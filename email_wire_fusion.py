#!/usr/bin/env python3
"""
email_wire_fusion.py
--------------------
Fuses behavioral email context (behavioral_context.py) with wire document
analysis (wire_pdf_parser.py) into a single comprehensive fraud report.

When no email context is provided the output is byte-for-byte identical to
running wire_pdf_parser alone — the parser is NOT modified.

Usage:
    # Wire PDF + email context (full fusion)
    python email_wire_fusion.py --wire doc.pdf --email normalized.json

    # Wire plain-text + email context
    python email_wire_fusion.py --wire-text doc.txt --email normalized.json

    # Wire only — standard output, no changes
    python email_wire_fusion.py --wire doc.pdf
"""

import json
import re
import sys
from pathlib import Path
from typing import Any

# ── resolve backend path so wire_pdf_parser imports cleanly ───────────────────
_BACKEND_MORE = Path(__file__).resolve().parent / "backend" / "venv" / "more"
if str(_BACKEND_MORE) not in sys.path:
    sys.path.insert(0, str(_BACKEND_MORE))

from wire_pdf_parser import parse_pdf, parse_text  # noqa: E402
from behavioral_context import analyze_email        # noqa: E402


# ── Email-layer risk point values ─────────────────────────────────────────────
# Named constants so the scoring logic stays self-documenting.

_E_WIRE_FRAUD_HIGH  = 50   # email LLM flagged high wire-fraud probability
_E_WIRE_FRAUD_MED   = 25
_E_PHISHING_HIGH    = 35   # phishing email used to deliver a fake wire doc
_E_AUTH_WEAK        = 25   # DMARC/DKIM/SPF failures — spoofed sender
_E_AUTH_MIXED       = 10
_E_URGENCY_HIGH     = 15   # email urgency corroborates wire-doc pressure
_E_URGENCY_MED      = 8
_E_DOMAIN_MISMATCH  = 30   # email from-domain ≠ wire doc sender domain
_E_ESCROW_NAME_MISS = 25   # named escrow officer absent from email entities
_E_ESCROW_ORG_MISS  = 20   # named escrow company absent from email entities
_E_RISK_SIGNALS     = 10   # multiple sender-risk signals in email


# ── Name / entity helpers ─────────────────────────────────────────────────────

def _tokens(s: str) -> set[str]:
    """Lowercase alpha-only word tokens, length > 1."""
    return {w for w in re.sub(r"[^a-z\s]", "", s.lower()).split() if len(w) > 1}


def _fuzzy_match(a: str, b: str, threshold: float = 0.5) -> bool:
    """True if word-token overlap between a and b meets the threshold."""
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return False
    smaller = ta if len(ta) <= len(tb) else tb
    larger  = ta if smaller is tb else tb
    return len(smaller & larger) / len(smaller) >= threshold


def _any_match(candidates: list[str], target: str) -> bool:
    """True if any candidate fuzzy-matches target."""
    return bool(target) and any(_fuzzy_match(c, target) for c in candidates if c)


# ── Cross-signal detection (escrow-officer focused) ───────────────────────────

def _detect_cross_signals(
    bctx: dict[str, Any],
    wire_result: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Compare behavioral email context against wire extraction fields.
    Returns a list of cross-signal dicts describing the discrepancies found.
    """
    cross: list[dict[str, Any]] = []

    bc   = bctx.get("behavioral_context", {})
    rc   = bctx.get("risk_context", {})
    fp   = bc.get("infrastructure_fingerprint", {})
    pp   = bc.get("persuasion_profile", {})
    ents = bc.get("extracted_entities", {})

    hackathon  = wire_result.get("hackathon_schema") or {}
    extraction = hackathon.get("extraction") or {}
    escrow     = extraction.get("escrow_contact") or {}
    comm       = extraction.get("communication") or {}
    wire_sigs  = (extraction.get("signals_from_text") or {}).get("detected_phrases") or {}

    email_people       = [p for p in (ents.get("people") or []) if p]
    email_orgs         = [o for o in (ents.get("orgs")   or []) if o]
    escrow_name        = (escrow.get("name")    or "").strip()
    escrow_company     = (escrow.get("company") or "").strip()
    wire_sender_domain = (comm.get("sender_domain") or "").lower().strip()
    email_from_domain  = (fp.get("from_domain")    or "").lower().strip()

    # 1. From-domain of email ≠ sender domain claimed in wire doc
    if email_from_domain and wire_sender_domain and email_from_domain != wire_sender_domain:
        cross.append({
            "signal":        "EMAIL_WIRE_DOMAIN_MISMATCH",
            "severity":      "high",
            "description":   (
                f"Email arrived from '{email_from_domain}' but the wire document "
                f"claims sender domain '{wire_sender_domain}'. "
                "Domain divergence across channels is a hallmark of multi-vector BEC."
            ),
            "email_evidence": f"headers.from_email → domain: {email_from_domain}",
            "wire_evidence":  f"extraction.communication.sender_domain: {wire_sender_domain}",
        })

    # 2. Named escrow officer absent from email body
    if escrow_name and email_people and not _any_match(email_people, escrow_name):
        cross.append({
            "signal":        "ESCROW_OFFICER_NOT_IN_EMAIL",
            "severity":      "high",
            "description":   (
                f"Wire doc names escrow officer '{escrow_name}' but no matching person "
                f"was found in the email body (found: {email_people}). "
                "Attackers often substitute a different officer name inside the wire doc."
            ),
            "email_evidence": f"behavioral_context.extracted_entities.people: {email_people}",
            "wire_evidence":  f"extraction.escrow_contact.name: {escrow_name}",
        })

    # 3. Named escrow company absent from email body
    if escrow_company and email_orgs and not _any_match(email_orgs, escrow_company):
        cross.append({
            "signal":        "ESCROW_COMPANY_NOT_IN_EMAIL",
            "severity":      "medium",
            "description":   (
                f"Wire doc names company '{escrow_company}' but no matching org "
                f"was found in the email body (found: {email_orgs}). "
                "May indicate a substituted beneficiary or spoofed title company."
            ),
            "email_evidence": f"behavioral_context.extracted_entities.orgs: {email_orgs}",
            "wire_evidence":  f"extraction.escrow_contact.company: {escrow_company}",
        })

    # 4. Email LLM flagged significant wire-fraud probability
    wire_fraud_lk = rc.get("wire_fraud_likelihood", 0.0)
    if wire_fraud_lk >= 0.3:
        severity = "critical" if wire_fraud_lk >= 0.6 else "high"
        cross.append({
            "signal":        "EMAIL_FLAGS_WIRE_FRAUD",
            "severity":      severity,
            "description":   (
                f"Email behavioral analysis assigned wire-fraud likelihood "
                f"{wire_fraud_lk:.0%}. The presence of an accompanying wire document "
                "significantly amplifies this risk."
            ),
            "email_evidence": f"risk_context.wire_fraud_likelihood: {wire_fraud_lk}",
            "wire_evidence":  "wire transfer document present",
        })

    # 5. Urgency in email corroborates wire-doc pressure language
    urgency = pp.get("urgency", "none")
    if urgency in ("medium", "high") and wire_sigs.get("pressure_to_wire"):
        cross.append({
            "signal":        "COORDINATED_URGENCY",
            "severity":      "high",
            "description":   (
                "Both the email and wire document contain urgency/pressure language. "
                "Coordinated pressure across channels is the primary BEC social-engineering tactic."
            ),
            "email_evidence": f"behavioral_context.persuasion_profile.urgency: {urgency}",
            "wire_evidence":  "extraction.signals_from_text.detected_phrases.pressure_to_wire: true",
        })

    # 6. Phishing-classified email carrying a wire doc = coordinated BEC pattern
    phishing_lk = rc.get("phishing_likelihood", 0.0)
    if phishing_lk >= 0.5:
        cross.append({
            "signal":        "PHISHING_EMAIL_WITH_WIRE_DOC",
            "severity":      "critical",
            "description":   (
                f"Email assessed as likely phishing ({phishing_lk:.0%}) and a wire "
                "transfer document is present. This pattern matches BEC attacks "
                "targeting real-estate closings and escrow officers."
            ),
            "email_evidence": f"risk_context.phishing_likelihood: {phishing_lk}",
            "wire_evidence":  "wire document present alongside phishing-classified email",
        })

    return cross


# ── Email-layer point scoring ─────────────────────────────────────────────────

def _score_email_layer(
    bctx: dict[str, Any],
    cross_signals: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Translate behavioral email context + cross-signals into risk points.
    These are added on top of the wire parser's existing score.
    """
    bc  = bctx.get("behavioral_context", {})
    rc  = bctx.get("risk_context", {})
    fp  = bc.get("infrastructure_fingerprint", {})
    pp  = bc.get("persuasion_profile", {})

    pts:   int              = 0
    rules: list[dict[str, Any]] = []

    wire_lk    = rc.get("wire_fraud_likelihood", 0.0)
    phish_lk   = rc.get("phishing_likelihood", 0.0)
    auth_align = fp.get("auth_alignment", "unknown")
    urgency    = pp.get("urgency", "none")
    risk_sigs  = bc.get("sender_risk_signals") or []

    if wire_lk >= 0.6:
        pts += _E_WIRE_FRAUD_HIGH
        rules.append({"rule": "EMAIL_WIRE_FRAUD_HIGH",   "points": _E_WIRE_FRAUD_HIGH,
                      "detail": f"wire_fraud_likelihood={wire_lk:.2f}"})
    elif wire_lk >= 0.3:
        pts += _E_WIRE_FRAUD_MED
        rules.append({"rule": "EMAIL_WIRE_FRAUD_MEDIUM", "points": _E_WIRE_FRAUD_MED,
                      "detail": f"wire_fraud_likelihood={wire_lk:.2f}"})

    if phish_lk >= 0.6:
        pts += _E_PHISHING_HIGH
        rules.append({"rule": "EMAIL_PHISHING_HIGH",     "points": _E_PHISHING_HIGH,
                      "detail": f"phishing_likelihood={phish_lk:.2f}"})

    if auth_align == "weak":
        pts += _E_AUTH_WEAK
        rules.append({"rule": "EMAIL_AUTH_WEAK",  "points": _E_AUTH_WEAK,
                      "detail": "auth_alignment=weak (DMARC/DKIM/SPF failures)"})
    elif auth_align == "mixed":
        pts += _E_AUTH_MIXED
        rules.append({"rule": "EMAIL_AUTH_MIXED", "points": _E_AUTH_MIXED,
                      "detail": "auth_alignment=mixed"})

    if urgency == "high":
        pts += _E_URGENCY_HIGH
        rules.append({"rule": "EMAIL_URGENCY_HIGH",   "points": _E_URGENCY_HIGH})
    elif urgency == "medium":
        pts += _E_URGENCY_MED
        rules.append({"rule": "EMAIL_URGENCY_MEDIUM", "points": _E_URGENCY_MED})

    if len(risk_sigs) >= 2:
        pts += _E_RISK_SIGNALS
        rules.append({"rule": "EMAIL_RISK_SIGNALS", "points": _E_RISK_SIGNALS,
                      "detail": f"{len(risk_sigs)} sender risk signals detected"})

    # Points from cross-signals (avoid double-counting — check by signal name)
    cross_names = {cs["signal"] for cs in cross_signals}
    if "EMAIL_WIRE_DOMAIN_MISMATCH" in cross_names:
        pts += _E_DOMAIN_MISMATCH
        rules.append({"rule": "EMAIL_WIRE_DOMAIN_MISMATCH",   "points": _E_DOMAIN_MISMATCH})
    if "ESCROW_OFFICER_NOT_IN_EMAIL" in cross_names:
        pts += _E_ESCROW_NAME_MISS
        rules.append({"rule": "ESCROW_OFFICER_NOT_IN_EMAIL",  "points": _E_ESCROW_NAME_MISS})
    if "ESCROW_COMPANY_NOT_IN_EMAIL" in cross_names:
        pts += _E_ESCROW_ORG_MISS
        rules.append({"rule": "ESCROW_COMPANY_NOT_IN_EMAIL",  "points": _E_ESCROW_ORG_MISS})

    return {
        "email_contribution_points": min(pts, 100),
        "triggered_email_rules":     rules,
    }


# ── Fused risk calculation ─────────────────────────────────────────────────────

_FUSED_ACTIONS: dict[str, list[str]] = {
    "low": [
        "Verify wiring instructions by phone using a number from a previous known-good source.",
    ],
    "medium": [
        "Display warning to user.",
        "Require phone verification before revealing full wire details.",
    ],
    "high": [
        "Strong warning: suspicious email and wire document combination detected.",
        "Mask routing/account numbers until dual verification is complete.",
        "Call the escrow officer using a number from the official company website — not from this email.",
    ],
    "critical": [
        "HARD STOP: Do not wire funds.",
        "Hide all routing and account details immediately.",
        "Contact the title/escrow company via a number obtained independently (official website or prior contract).",
        "Report to FBI IC3 (ic3.gov) and your bank's fraud department.",
        "Do NOT reply to this email or call any number it contains.",
    ],
}


def _fuse_risk(
    wire_result: dict[str, Any],
    email_layer: dict[str, Any],
) -> dict[str, Any]:
    """Blend wire-parser risk scores with the email-layer contribution."""
    hackathon  = wire_result.get("hackathon_schema") or {}
    wire_ra    = hackathon.get("risk_assessment") or {}
    wire_score = wire_ra.get("overall_risk_score", 0)
    email_pts  = email_layer["email_contribution_points"]

    # Email contribution is additive but weighted at 0.6 so the wire-layer
    # (which has ABA checksum + domain verification) carries more authority.
    fused_score = min(100, round(wire_score + email_pts * 0.6))

    if fused_score >= 85:
        tier = "critical"
    elif fused_score >= 60:
        tier = "high"
    elif fused_score >= 25:
        tier = "medium"
    else:
        tier = "low"

    return {
        "wire_risk_score":           wire_score,
        "email_contribution_points": email_pts,
        "fused_overall_score":       fused_score,
        "fused_risk_tier":           tier,
        "triggered_email_rules":     email_layer["triggered_email_rules"],
        "recommended_actions":       _FUSED_ACTIONS[tier],
    }


# ── Public API ────────────────────────────────────────────────────────────────

def fuse(
    wire_result: dict[str, Any],
    normalized_email: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Merge wire parser output with optional email behavioral context.

    Args:
        wire_result:      Output of parse_pdf() or parse_text().
        normalized_email: A single normalized email dict (output of
                          normalize_gmail.py). If None, wire_result is
                          returned unchanged — no side effects.

    Returns:
        wire_result unchanged when normalized_email is None, otherwise a copy
        augmented with an 'email_context_fusion' key.
    """
    if normalized_email is None:
        return wire_result

    behavioral_ctx = analyze_email(normalized_email)
    cross_signals  = _detect_cross_signals(behavioral_ctx, wire_result)
    email_layer    = _score_email_layer(behavioral_ctx, cross_signals)
    fused_risk     = _fuse_risk(wire_result, email_layer)

    return {
        **wire_result,
        "email_context_fusion": {
            "behavioral_context": behavioral_ctx,
            "cross_signals":      cross_signals,
            "fused_risk":         fused_risk,
        },
    }


# ── CLI ───────────────────────────────────────────────────────────────────────

def _usage() -> None:
    print(
        "Usage:\n"
        "  python email_wire_fusion.py --wire doc.pdf [--email normalized.json]\n"
        "  python email_wire_fusion.py --wire-text doc.txt [--email normalized.json]",
        file=sys.stderr,
    )
    sys.exit(1)


if __name__ == "__main__":
    args = sys.argv[1:]
    wire_path = wire_text_path = email_path = None

    i = 0
    while i < len(args):
        if args[i] == "--wire" and i + 1 < len(args):
            wire_path = args[i + 1]; i += 2
        elif args[i] == "--wire-text" and i + 1 < len(args):
            wire_text_path = args[i + 1]; i += 2
        elif args[i] == "--email" and i + 1 < len(args):
            email_path = args[i + 1]; i += 2
        else:
            _usage()

    if not wire_path and not wire_text_path:
        _usage()

    wire_result = (
        parse_pdf(wire_path)
        if wire_path
        else parse_text(Path(wire_text_path).read_text(encoding="utf-8"))
    )

    normalized_email = None
    if email_path:
        with open(email_path) as f:
            normalized_email = json.load(f)

    result = fuse(wire_result, normalized_email)
    print(json.dumps(result, indent=2, ensure_ascii=False))