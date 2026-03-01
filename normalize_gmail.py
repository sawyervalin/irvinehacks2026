#!/usr/bin/env python3
"""
Gmail message normalizer.

Transforms a Gmail API message JSON into a compact normalized schema
suitable for downstream AI analysis.

Usage:
    python normalize_gmail.py input.json       # prints normalized JSON
    echo '{...}' | python normalize_gmail.py - # reads from stdin
"""

import html
import json
import re
import sys
from html.parser import HTMLParser
from typing import Optional
from urllib.parse import urlparse


# ── Vendor host patterns (ESP / CRM / tracking infrastructure) ───────────────

VENDOR_HOST_PATTERNS = [
    "sendgrid", "mailgun", "mailchimp", "mandrillapp", "klaviyo",
    "hubspot", "marketo", "technolutions", "eloqua", "pardot",
    "constantcontact", "campaignmonitor", "brevo", "sendinblue",
    "postmarkapp", "sparkpost", "amazonses", "exacttarget",
    "mimecast", "proofpoint", "slate-mx",
]

# ── Signal phrase lists ───────────────────────────────────────────────────────

CTA_PATTERNS = [
    r"\bAPPLY(?: TODAY| NOW)?\b", r"\bSUBMIT\b", r"\bVERIFY\b",
    r"\bCLICK HERE\b", r"\bPAY NOW\b", r"\bDOWNLOAD\b", r"\bREGISTER\b",
    r"\bSIGN UP\b", r"\bGET STARTED\b", r"\bCONFIRM\b", r"\bUPDATE NOW\b",
    r"\bCONNECT WITH US\b",
]

INCENTIVE_PATTERNS = [
    r"tuition waiver[s]?", r"\d+\s*%\s*off", r"scholarship[s]?",
    r"financial aid", r"merit.based", r"discount[s]?", r"\bfree\b",
    r"\bwaiver[s]?\b", r"\bgrant[s]?\b", r"\bfellowship[s]?\b",
]

URGENCY_PATTERNS = [
    r"\burgent\b", r"\bimmediately\b", r"\bASAP\b", r"\bright away\b",
    r"\btoday\b", r"\bwithin \d+ hours?\b", r"\bwithin days?\b",
    r"\bdeadline\b", r"\bexpires?\b", r"\bact now\b", r"\bdo not delay\b",
    r"works? swiftly", r"as soon as possible",
]

WIRE_PAYMENT_PATTERNS = [
    r"\bwire transfer\b", r"\bwiring instructions?\b", r"\bACH\b",
    r"\brouting number\b", r"\baccount number\b", r"\bIBAN\b",
    r"\bSWIFT\b", r"\binvoice\b", r"\bpay via wire\b", r"\bremittance\b",
    r"\bbeneficiary\b", r"\bbank transfer\b",
]

POLICY_FOOTER_HINTS = [
    "title ix", "nondiscrimination", "privacy policy", "terms of service",
    "terms and conditions", "unsubscribe", "opt-out", "copyright",
    "all rights reserved",
]

ADDRESS_PATTERN = re.compile(
    r"\d{3,5}\s+[A-Za-z0-9\s]+"
    r"(?:St|Ave|Dr|Blvd|Rd|Ln|Way|Pl|Ct|Ter|Terrace|Memorial|Park)\b"
    r"[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}",
    re.IGNORECASE,
)

URL_PATTERN = re.compile(r'https?://[^\s<>"\']+', re.IGNORECASE)


# ── HTML text extractor ───────────────────────────────────────────────────────

class _HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip = False
        self._parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip = True
        if tag in ("p", "br", "div", "tr", "li", "h1", "h2", "h3"):
            self._parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            self._parts.append(data)

    def get_text(self) -> str:
        text = "".join(self._parts)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def _strip_html(html_str: str) -> str:
    extractor = _HTMLTextExtractor()
    extractor.feed(html_str)
    return extractor.get_text()


# ── Field parsers ─────────────────────────────────────────────────────────────

def _parse_from(raw: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Return (name, email) from 'Name <email@domain>' or bare 'email@domain'."""
    if not raw:
        return None, None
    m = re.match(r'^"?([^"<]+?)"?\s*<([^>]+)>', raw.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip()
    m = re.match(r'^([^\s@]+@[^\s@]+)$', raw.strip())
    if m:
        return None, raw.strip()
    return None, None


def _parse_auth(auth_str: Optional[str]) -> dict:
    if not auth_str:
        return {"spf": None, "dkim": None, "dmarc": None, "raw": None}

    def _find(key: str) -> str:
        m = re.search(rf'\b{key}=(\w+)', auth_str, re.IGNORECASE)
        return m.group(1).lower() if m else "unknown"

    spf_val   = _find("spf")
    dkim_val  = _find("dkim")
    dmarc_val = _find("dmarc")

    def _norm(v, allowed):
        return v if v in allowed else "unknown"

    return {
        "spf":   _norm(spf_val,   {"pass", "fail", "neutral", "softfail", "none"}),
        "dkim":  _norm(dkim_val,  {"pass", "fail"}),
        "dmarc": _norm(dmarc_val, {"pass", "fail"}),
        "raw":   auth_str.strip(),
    }


def _parse_list_unsubscribe(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    parts = re.split(r",\s*(?=<|\s*https?://)", raw)
    result = []
    for p in parts:
        p = p.strip().strip("<>").strip()
        if p:
            result.append(p)
    return result


def _extract_urls(text: str) -> list[str]:
    """Return deduplicated list of https?:// URLs found in text."""
    return list(dict.fromkeys(URL_PATTERN.findall(text)))


def _extract_hosts(urls: list[str]) -> list[str]:
    hosts: list[str] = []
    for url in urls:
        try:
            h = urlparse(url).hostname
            if h and h not in hosts:
                hosts.append(h)
        except Exception:
            pass
    return hosts


def _find_phrases(text: str, patterns: list[str], max_results: int = 10) -> list[str]:
    found: list[str] = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            phrase = m.group(0).strip()
            if phrase not in found:
                found.append(phrase)
            if len(found) >= max_results:
                return found
    return found


def _is_vendor_host(host: str) -> bool:
    hl = host.lower()
    return any(v in hl for v in VENDOR_HOST_PATTERNS)


def _has_physical_address(text: str) -> bool:
    if ADDRESS_PATTERN.search(text):
        return True
    # Fallback: city, ST 12345 pattern
    return bool(re.search(r'\b[A-Z]{2}\s+\d{5}\b', text))


def _has_policy_footer(text: str) -> bool:
    tl = text.lower()
    return any(hint in tl for hint in POLICY_FOOTER_HINTS)


# ── Core normalizer ───────────────────────────────────────────────────────────

def normalize_message(msg: dict) -> dict:
    headers = msg.get("headers") or {}
    body    = msg.get("body") or {}

    # IDs & labels
    message_id    = msg.get("id")
    thread_id     = msg.get("threadId")
    internal_date = str(msg["internalDate"]) if msg.get("internalDate") else None
    labels        = msg.get("labelIds") or []

    # Header fields
    from_raw              = headers.get("from")
    from_name, from_email = _parse_from(from_raw)
    reply_to_raw          = headers.get("replyTo") or headers.get("reply-to")
    return_path_raw       = headers.get("returnPath") or headers.get("return-path") or ""
    return_path           = return_path_raw.strip("<>").strip() or None
    list_id               = headers.get("listId") or headers.get("list-id")
    list_unsub_raw        = headers.get("listUnsubscribe") or headers.get("list-unsubscribe")
    list_unsub            = _parse_list_unsubscribe(list_unsub_raw)
    list_unsub_post       = headers.get("listUnsubscribePost") or headers.get("list-unsubscribe-post")
    auth_raw              = (headers.get("authenticationResults")
                             or headers.get("arcAuthenticationResults"))
    auth_summary          = _parse_auth(auth_raw)

    # Content — prefer textPlain, fall back to stripping textHtml
    snippet_raw = msg.get("snippet") or ""
    snippet     = html.unescape(snippet_raw).strip() or None

    text_plain = body.get("textPlain")
    text_html  = body.get("textHtml")

    if text_plain:
        content_text = text_plain.replace("\u000D\u000A", "\n").replace("\r\n", "\n")
        content_text = re.sub(r"[ \t]{4,}", " ", content_text)   # collapse indents
        content_text = re.sub(r"\n{3,}", "\n\n", content_text)
        content_text = content_text.strip()
    elif text_html:
        content_text = _strip_html(text_html)
    else:
        content_text = None

    if content_text and len(content_text) > 2500:
        content_text = content_text[:2500]

    # URL extraction from both plain and HTML
    url_source = (text_plain or "") + (text_html or "")
    urls  = _extract_urls(url_source)
    hosts = _extract_hosts(urls)

    # Signals computed from cleaned text
    sig = content_text or ""

    return {
        "source":           "gmail",
        "message_id":       message_id,
        "thread_id":        thread_id,
        "internal_date_ms": internal_date,
        "labels":           labels,
        "headers": {
            "from_raw":              from_raw,
            "from_email":            from_email,
            "from_name":             from_name,
            "to":                    headers.get("to"),
            "subject":               headers.get("subject"),
            "date":                  headers.get("date"),
            "reply_to":              reply_to_raw,
            "return_path":           return_path,
            "list_id":               list_id,
            "list_unsubscribe":      list_unsub,
            "list_unsubscribe_post": list_unsub_post,
            "auth_summary":          auth_summary,
        },
        "content": {
            "snippet": snippet,
            "text":    content_text,
        },
        "links": {
            "urls":  urls,
            "hosts": hosts,
        },
        "signals": {
            "num_links":                 len(urls),
            "has_unsubscribe":           bool(list_unsub) or bool(
                re.search(r"unsubscribe", sig, re.IGNORECASE)
            ),
            "has_physical_address_hint": _has_physical_address(sig),
            "has_policy_footer_hint":    _has_policy_footer(sig),
            "cta_phrases":               _find_phrases(sig, CTA_PATTERNS),
            "incentive_phrases":         _find_phrases(sig, INCENTIVE_PATTERNS),
            "urgency_phrases":           _find_phrases(sig, URGENCY_PATTERNS),
            "wire_payment_phrases":      _find_phrases(sig, WIRE_PAYMENT_PATTERNS),
            "vendor_hosts":              [h for h in hosts if _is_vendor_host(h)],
        },
    }


def normalize(data: dict) -> list[dict]:
    """Normalize one message or all messages in a Gmail batch response."""
    if "messages" in data:
        return [normalize_message(m) for m in data["messages"]]
    return [normalize_message(data)]


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "-"
    if src == "-":
        raw = json.load(sys.stdin)
    else:
        with open(src) as f:
            raw = json.load(f)

    results = normalize(raw)
    output  = results[0] if len(results) == 1 else results
    print(json.dumps(output, indent=2, ensure_ascii=False))
