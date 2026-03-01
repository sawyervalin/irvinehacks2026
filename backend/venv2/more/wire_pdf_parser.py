"""
wire_pdf_parser.py
------------------
Wire transfer instruction parser.
PDF→text via pdfplumber; field extraction via Claude LLM; domain + bank
verification via DomainVerifier and ABA routing lookup.

Usage:
    python wire_pdf_parser.py path/to/file.pdf
"""

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from domain_verification import DomainVerifier
from extraction.llm_extractor import extract_wire_fields
from risk_scoring import aba_checksum_valid, score_extraction

try:
    import pdfplumber
except ImportError:
    print(json.dumps({"parsing_errors": ["pdfplumber is not installed. Run: pip install pdfplumber"]}))
    sys.exit(1)


# ---------------------------------------------------------------------------
# Routing number → bank name lookup
# ---------------------------------------------------------------------------

_KNOWN_ROUTING: dict[str, str] = {
    "021000021": "JPMorgan Chase",
    "021000089": "Citibank",
    "021200339": "Bank of America",
    "021300077": "HSBC",
    "021101108": "TD Bank",
    "026009593": "Bank of America",
    "026013673": "JPMorgan Chase",
    "031100649": "Wells Fargo",
    "031201360": "PNC Bank",
    "011400071": "Citizens Bank",
    "011900254": "Bank of America",
    "021301115": "TD Bank",
    "053000219": "Bank of America",
    "063100277": "Bank of America",
    "065400137": "JPMorgan Chase",
    "071000013": "JPMorgan Chase",
    "091000019": "US Bank",
    "102001017": "Wells Fargo",
    "111000614": "JPMorgan Chase",
    "121000248": "Wells Fargo",
    "121042882": "Wells Fargo",
    "122000247": "Wells Fargo",
    "124303120": "Wells Fargo",
    "267084131": "JPMorgan Chase",
    "322271627": "JPMorgan Chase",
    "325070760": "JPMorgan Chase",
    "103100195": "Bank of Oklahoma",
    "084000026": "Regions Bank",
    "062000080": "Regions Bank",
    "044000037": "JPMorgan Chase",
    "042000314": "Fifth Third Bank",
    "011000138": "Bank of America",
    "073000228": "Wells Fargo",
    "107002192": "Wells Fargo",
    "125200057": "Bank of America",
    "051000017": "Bank of America",
    "052001633": "Bank of America",
}

_NOISE_WORDS = {
    "bank", "national", "the", "of", "and", "&", "n.a.", "na",
    "n/a", "financial", "savings", "trust", "america", "us", "u.s.",
    "corp", "corporation", "inc", "llc", "association", "assoc",
}


def lookup_bank_by_routing(routing: str) -> dict[str, Any]:
    digits = re.sub(r"\D", "", routing)[:9]
    if len(digits) != 9:
        return {"bank_name": None, "status": "invalid_format"}

    if digits in _KNOWN_ROUTING:
        return {"bank_name": _KNOWN_ROUTING[digits], "status": "found", "source": "local"}

    try:
        url = f"https://www.routingnumbers.info/api/data.json?rn={digits}"
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        if data.get("code") == 200 and data.get("customer_name"):
            return {"bank_name": data["customer_name"].title(), "status": "found", "source": "api"}
    except Exception:
        pass

    return {"bank_name": None, "status": "not_found", "source": None}


def _bank_names_match(looked_up: str, extracted: str) -> bool:
    def tokens(s: str) -> set[str]:
        words = re.sub(r"[^a-z0-9\s]", "", s.lower()).split()
        return {w for w in words if w not in _NOISE_WORDS and len(w) > 1}

    lu = tokens(looked_up)
    ex = tokens(extracted)
    if not lu or not ex:
        return False
    smaller = lu if len(lu) <= len(ex) else ex
    larger  = lu if smaller is ex else ex
    return len(smaller & larger) / len(smaller) >= 0.5



# ---------------------------------------------------------------------------
# PDF text extraction (pdfplumber — unchanged)
# ---------------------------------------------------------------------------

def extract_text_from_pdf(path: str) -> str:
    pdf_path = Path(path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    pages: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                pages.append(page_text)

    return "\n".join(pages)


def normalize_text(text: str) -> str:
    lines = text.split("\n")
    cleaned = [re.sub(r"[ \t]+", " ", line).strip() for line in lines]
    result = "\n".join(cleaned)
    return re.sub(r"\n{3,}", "\n\n", result)


# ---------------------------------------------------------------------------
# Legacy extracted_fields mapping (keeps the frontend working unchanged)
# ---------------------------------------------------------------------------

def _map_llm_to_fields(llm_data: dict) -> dict[str, Any]:
    """
    Convert the LLM extraction schema to the legacy extracted_fields format
    expected by the Next.js frontend.
    """
    escrow      = llm_data.get("escrow_contact") or {}
    wire        = llm_data.get("wire_details") or {}
    transaction = llm_data.get("transaction") or {}
    comm        = llm_data.get("communication") or {}

    email  = comm.get("sender_email") or escrow.get("email") or ""
    domain: str | None = comm.get("sender_domain") or None
    if not domain and email and "@" in email:
        domain = email.split("@", 1)[1]
    elif not domain and (llm_data.get("internet_data") or {}).get("domains"):
        domain = llm_data["internet_data"]["domains"][0]

    def _field(raw, conf: float = 0.90) -> dict[str, Any]:
        return {"raw": raw, "normalized": raw, "confidence": conf if raw else 0.0}

    # Routing number
    routing_raw = wire.get("routing_number")
    routing_field: dict[str, Any] = {
        "raw": None, "normalized": None,
        "is_checksum_valid": False, "confidence": 0.0,
    }
    if routing_raw:
        digits = re.sub(r"\D", "", str(routing_raw))[:9]
        if len(digits) == 9:
            valid = aba_checksum_valid(digits)
            routing_field = {
                "raw": routing_raw, "normalized": digits,
                "is_checksum_valid": valid,
                "confidence": 0.95 if valid else 0.70,
            }

    # Account number — mask all but last 4
    acct_raw = wire.get("account_number")
    acct_field: dict[str, Any] = {"raw": None, "normalized": None, "confidence": 0.0}
    if acct_raw:
        digits = re.sub(r"\D", "", str(acct_raw))
        if len(digits) >= 4:
            masked = f"****{digits[-4:]}"
            acct_field = {"raw": masked, "normalized": masked, "confidence": 0.90}

    # Wire amount
    amount_raw = wire.get("amount")
    amount_field: dict[str, Any] = {"raw": None, "normalized": None, "confidence": 0.0}
    if amount_raw:
        try:
            clean = re.sub(r"[^\d.]", "", str(amount_raw))
            value = float(clean)
            amount_field = {"raw": str(amount_raw), "normalized": value, "confidence": 0.90}
        except (ValueError, AttributeError):
            pass

    # Phone numbers — gather from escrow_contact
    phones_raw: list[str] = []
    if escrow.get("phone"):
        phones_raw.append(escrow["phone"])
    phones_norm = [re.sub(r"\D", "", p) for p in phones_raw]
    phones_norm = [p for p in phones_norm if len(p) in (10, 11)]

    return {
        "document_type":       _field(llm_data.get("document_type")),
        "title_company_name":  _field(escrow.get("company")),
        "escrow_officer_name": _field(escrow.get("name")),
        "sender_email":        _field(email),
        "sender_domain":       _field(domain),
        "receiving_bank_name": _field(wire.get("bank_name")),
        "routing_number":      routing_field,
        "account_number":      acct_field,
        "wire_amount":         amount_field,
        "phone_numbers": {
            "raw": phones_raw[:len(phones_norm)],
            "normalized": phones_norm,
            "confidence": 0.90 if phones_norm else 0.0,
        },
        "property_address": _field(transaction.get("property_address")),
        "closing_date":     _field(transaction.get("closing_date")),
    }


# ---------------------------------------------------------------------------
# Hackathon AI Extraction JSON schema mapper  (wire-doc.hack.v1)
# ---------------------------------------------------------------------------

def _map_to_hackathon_schema(
    llm_data: dict[str, Any],
    bank_verification: dict[str, Any] | None = None,
    domain_verification: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Convert LLM extraction output + enrichment data to the Hackathon AI
    Extraction JSON schema (wire-doc.hack.v1).
    """
    escrow       = llm_data.get("escrow_contact") or {}
    wire         = llm_data.get("wire_details") or {}
    transaction  = llm_data.get("transaction") or {}
    comm_raw     = llm_data.get("communication") or {}
    internet     = llm_data.get("internet_data") or {}
    bank_verif   = bank_verification or {}
    domain_verif = domain_verification or {}

    # -- Sections: pass through LLM data directly, normalizing missing fields --
    escrow_contact = {
        "name":       escrow.get("name") or "",
        "company":    escrow.get("company") or "",
        "email":      escrow.get("email") or "",
        "phone":      escrow.get("phone") or "",
        "confidence": float(escrow.get("confidence") or 0.0),
    }

    amount_raw = transaction.get("amount") or wire.get("amount") or ""
    transaction_out = {
        "property_address": transaction.get("property_address") or "",
        "closing_date":     transaction.get("closing_date") or "",
        "amount":           str(amount_raw) if amount_raw else "",
        "confidence":       float(transaction.get("confidence") or 0.0),
    }

    wire_out = {
        "beneficiary_name": wire.get("beneficiary_name") or "",
        "bank_name":        wire.get("bank_name") or "",
        "routing_number":   wire.get("routing_number") or "",
        "account_number":   wire.get("account_number") or "",
        "confidence":       float(wire.get("confidence") or 0.0),
    }

    communication = {
        "sender_email":  comm_raw.get("sender_email") or "",
        "sender_domain": comm_raw.get("sender_domain") or "",
        "confidence":    float(comm_raw.get("confidence") or 0.0),
    }

    # -- signals_from_text: pass through from LLM ------------------------------
    raw_signals = llm_data.get("signals_from_text") or {}
    raw_phrases = raw_signals.get("detected_phrases") or {}
    raw_evidence = raw_signals.get("phrase_evidence") or {}
    signals: dict[str, Any] = {
        "detected_phrases": {
            "rushed_closing":     bool(raw_phrases.get("rushed_closing")),
            "pressure_to_wire":   bool(raw_phrases.get("pressure_to_wire")),
            "do_not_call_verify": bool(raw_phrases.get("do_not_call_verify")),
        },
        "phrase_evidence": {
            "rushed_closing_snippets":      raw_evidence.get("rushed_closing_snippets") or [],
            "pressure_to_wire_snippets":    raw_evidence.get("pressure_to_wire_snippets") or [],
            "do_not_call_verify_snippets":  raw_evidence.get("do_not_call_verify_snippets") or [],
        },
        "dummy_name_detected":            raw_signals.get("dummy_name_detected") or False,
        "dummy_name_match":               raw_signals.get("dummy_name_match"),
        "misspelling_count":              raw_signals.get("misspelling_count"),
        "grammar_error_count":            raw_signals.get("grammar_error_count"),
        "suspicious_characters_detected": raw_signals.get("suspicious_characters_detected") or False,
        "non_ascii_examples":             raw_signals.get("non_ascii_examples") or [],
    }

    # -- internet_data ---------------------------------------------------------
    domains = internet.get("domains") or []
    emails  = internet.get("emails") or []
    urls    = internet.get("urls") or []
    internet_out = {
        "domains":    domains,
        "emails":     emails,
        "urls":       urls,
        "confidence": float(internet.get("confidence") or 0.0),
    }

    # -- metadata: overall confidence = max of section confidences -------------
    section_confs = [
        escrow_contact["confidence"], transaction_out["confidence"],
        wire_out["confidence"], communication["confidence"], internet_out["confidence"],
    ]
    overall_confidence = round(max(section_confs) if any(section_confs) else 0.0, 4)

    # -- enrichment.banking ----------------------------------------------------
    routing_raw  = wire_out["routing_number"]
    routing_valid: bool | None = aba_checksum_valid(routing_raw) if routing_raw else None

    fed_bank_name   = bank_verif.get("looked_up_bank")
    match_flag      = bank_verif.get("match")
    bank_mismatch: bool | None = (not match_flag) if match_flag is not None else None
    foreign_bank: bool | None  = True if wire.get("swift_code") else None

    banking_enrichment: dict[str, Any] = {
        "routing_valid":          routing_valid,
        "fed_bank_name":          fed_bank_name,
        "bank_name_mismatch":     bank_mismatch,
        "foreign_bank_suspected": foreign_bank,
    }

    # -- enrichment.domain -----------------------------------------------------
    domain_enrichment: dict[str, Any] = {
        d: {
            "domain_exists":      None,
            "domain_age_days":    None,
            "mx_records_present": None,
            "lookalike_detected": None,
            "lookalike_to":       None,
            "on_scam_list":       None,
        }
        for d in domains
    }

    primary_domain = domain_verif.get("domain")
    checks = domain_verif.get("checks") or {}
    if primary_domain and primary_domain in domain_enrichment:
        age_chk  = checks.get("domain_age") or {}
        mx_chk   = checks.get("mx_records") or {}
        look_chk = checks.get("lookalike") or {}
        sb_chk   = checks.get("safe_browsing") or {}
        look_hit = (look_chk.get("risk_contribution") or 0) > 0
        domain_enrichment[primary_domain] = {
            "domain_exists":      age_chk.get("exists"),
            "domain_age_days":    age_chk.get("age_days"),
            "mx_records_present": mx_chk.get("has_mx"),
            "lookalike_detected": look_hit,
            "lookalike_to":       look_chk.get("closest_legitimate") if look_hit else None,
            "on_scam_list":       sb_chk.get("flagged"),
        }

    # -- Final assembly --------------------------------------------------------
    doc: dict[str, Any] = {
        "metadata": {
            "extraction_confidence": overall_confidence,
        },
        "extraction": {
            "document_type":     llm_data.get("document_type") or "WIRE_TRANSFER_INSTRUCTIONS",
            "escrow_contact":    escrow_contact,
            "transaction":       transaction_out,
            "wire_details":      wire_out,
            "communication":     communication,
            "signals_from_text": signals,
            "internet_data":     internet_out,
        },
        "enrichment": {
            "banking": banking_enrichment,
            "domain":  domain_enrichment,
            "ai_text": {"ai_generated_probability": None},
        },
        "risk_assessment": None,
    }
    doc["risk_assessment"] = _compute_risk_assessment(doc)
    doc["risk_assessment"]["text_signals"] = score_extraction(llm_data)
    return doc


# ---------------------------------------------------------------------------
# Fraud risk scoring engine
# ---------------------------------------------------------------------------

# Named point values — makes the scoring rules self-documenting
_P_DO_NOT_CALL      = 75   # explicit "don't verify" is near-definitive BEC fraud language
_P_PRESSURE_WIRE    = 55   # urgency is the primary BEC manipulation tactic
_P_RUSHED_CLOSE     = 50
_P_DUMMY_NAME       = 40
_P_SUSP_CHARS       = 25   # homograph/Unicode attacks are deliberate, not accidental
_P_BAD_ROUTING      = 80
_P_BANK_MISMATCH    = 75   # routing says Chase, doc says Wells Fargo = clear fraud signal
_P_FOREIGN_BANK     = 60
_P_LOOKALIKE        = 75   # typosquat domain is the #1 BEC delivery mechanism (FBI IC3)
_P_NEW_DOMAIN       = 65   # domain registered days before the attack is highly suspicious
_P_NO_MX            = 55   # no MX = domain can't receive mail = can't be a real business
_P_SCAM_LIST        = 95
_P_DOMAIN_NOT_EXIST = 90   # non-existent domain cannot legitimately send wire instructions
_P_HARD_STOP_MIN    = 85


def _compute_risk_assessment(hackathon: dict[str, Any]) -> dict[str, Any]:
    """
    Compute bucket scores, overall risk score, risk tier, triggered rules,
    and recommended actions from a wire-doc.hack.v1 document.
    """
    extraction  = hackathon.get("extraction") or {}
    enrichment  = hackathon.get("enrichment") or {}
    signals     = extraction.get("signals_from_text") or {}
    phrases     = signals.get("detected_phrases") or {}
    banking     = enrichment.get("banking") or {}
    domain_map  = enrichment.get("domain") or {}
    wire        = extraction.get("wire_details") or {}

    triggered: list[dict[str, Any]] = []
    content_pts = 0
    banking_pts = 0
    domain_pts  = 0

    # ── CONTENT RULES ─────────────────────────────────────────────────────────
    if phrases.get("do_not_call_verify") is True:
        content_pts += _P_DO_NOT_CALL
        triggered.append({"id": "CONTENT_DO_NOT_CALL_VERIFY", "bucket": "content", "points": _P_DO_NOT_CALL,
                           "evidence": {"do_not_call_verify": True}})

    if phrases.get("pressure_to_wire") is True:
        content_pts += _P_PRESSURE_WIRE
        triggered.append({"id": "CONTENT_PRESSURE_TO_WIRE", "bucket": "content", "points": _P_PRESSURE_WIRE,
                           "evidence": {"pressure_to_wire": True}})

    if phrases.get("rushed_closing") is True:
        content_pts += _P_RUSHED_CLOSE
        triggered.append({"id": "CONTENT_RUSHED_CLOSING", "bucket": "content", "points": _P_RUSHED_CLOSE,
                           "evidence": {"rushed_closing": True}})

    if signals.get("dummy_name_detected") is True:
        content_pts += _P_DUMMY_NAME
        triggered.append({"id": "CONTENT_DUMMY_NAME", "bucket": "content", "points": _P_DUMMY_NAME,
                           "evidence": {"dummy_name_detected": True,
                                        "dummy_name_match": signals.get("dummy_name_match")}})

    if signals.get("suspicious_characters_detected") is True:
        content_pts += _P_SUSP_CHARS
        triggered.append({"id": "CONTENT_SUSPICIOUS_CHARS", "bucket": "content", "points": _P_SUSP_CHARS,
                           "evidence": {"suspicious_characters_detected": True,
                                        "non_ascii_examples": signals.get("non_ascii_examples", [])}})

    misspellings = signals.get("misspelling_count")
    if misspellings and isinstance(misspellings, (int, float)) and misspellings > 0:
        pts = min(int(misspellings) * 10, 20)
        content_pts += pts
        triggered.append({"id": "CONTENT_MISSPELLINGS", "bucket": "content", "points": pts,
                           "evidence": {"misspelling_count": misspellings}})

    grammar_errors = signals.get("grammar_error_count")
    if grammar_errors and isinstance(grammar_errors, (int, float)) and grammar_errors > 0:
        pts = min(int(grammar_errors) * 10, 20)
        content_pts += pts
        triggered.append({"id": "CONTENT_GRAMMAR_ERRORS", "bucket": "content", "points": pts,
                           "evidence": {"grammar_error_count": grammar_errors}})

    # ── BANKING RULES ─────────────────────────────────────────────────────────
    if banking.get("routing_valid") is False:
        banking_pts += _P_BAD_ROUTING
        triggered.append({"id": "BANKING_INVALID_ROUTING", "bucket": "banking", "points": _P_BAD_ROUTING,
                           "evidence": {"routing_valid": False,
                                        "routing_number": wire.get("routing_number")}})

    if banking.get("bank_name_mismatch") is True:
        banking_pts += _P_BANK_MISMATCH
        triggered.append({"id": "BANKING_NAME_MISMATCH", "bucket": "banking", "points": _P_BANK_MISMATCH,
                           "evidence": {"bank_name_mismatch": True,
                                        "fed_bank_name": banking.get("fed_bank_name"),
                                        "extracted_bank": wire.get("bank_name")}})

    if banking.get("foreign_bank_suspected") is True:
        banking_pts += _P_FOREIGN_BANK
        triggered.append({"id": "BANKING_FOREIGN_BANK", "bucket": "banking", "points": _P_FOREIGN_BANK,
                           "evidence": {"foreign_bank_suspected": True,
                                        "swift_code": wire.get("swift_code")}})

    # ── DOMAIN RULES ──────────────────────────────────────────────────────────
    for domain, info in domain_map.items():
        if not isinstance(info, dict):
            continue

        if info.get("lookalike_detected") is True:
            domain_pts += _P_LOOKALIKE
            triggered.append({"id": "DOMAIN_LOOKALIKE", "bucket": "domain", "points": _P_LOOKALIKE,
                               "evidence": {"domain": domain,
                                            "lookalike_detected": True,
                                            "lookalike_to": info.get("lookalike_to")}})

        if info.get("domain_exists") is False:
            domain_pts += _P_DOMAIN_NOT_EXIST
            triggered.append({"id": "DOMAIN_NOT_EXIST", "bucket": "domain", "points": _P_DOMAIN_NOT_EXIST,
                               "evidence": {"domain": domain, "domain_exists": False}})

        age = info.get("domain_age_days")
        if age is not None and isinstance(age, (int, float)) and age <= 30:
            domain_pts += _P_NEW_DOMAIN
            triggered.append({"id": "DOMAIN_NEW_REGISTRATION", "bucket": "domain", "points": _P_NEW_DOMAIN,
                               "evidence": {"domain": domain, "domain_age_days": age}})

        if info.get("mx_records_present") is False:
            domain_pts += _P_NO_MX
            triggered.append({"id": "DOMAIN_NO_MX", "bucket": "domain", "points": _P_NO_MX,
                               "evidence": {"domain": domain, "mx_records_present": False}})

        if info.get("on_scam_list") is True:
            domain_pts += _P_SCAM_LIST
            triggered.append({"id": "DOMAIN_ON_SCAM_LIST", "bucket": "domain", "points": _P_SCAM_LIST,
                               "evidence": {"domain": domain, "on_scam_list": True}})

    # ── Cap buckets ───────────────────────────────────────────────────────────
    content_pts = min(content_pts, 100)
    banking_pts = min(banking_pts, 100)
    domain_pts  = min(domain_pts,  100)

    overall = round(0.25 * content_pts + 0.40 * banking_pts + 0.35 * domain_pts)

    # ── Hard-stop overrides ───────────────────────────────────────────────────
    hard_stop = (
        banking.get("routing_valid") is False
        or any(
            isinstance(info, dict) and (
                info.get("on_scam_list") is True
                or info.get("domain_exists") is False
            )
            for info in domain_map.values()
        )
    )
    if hard_stop:
        overall = max(overall, _P_HARD_STOP_MIN)

    # ── Risk tier ─────────────────────────────────────────────────────────────
    if overall < 25:
        tier = "low"
    elif overall < 50:
        tier = "medium"
    elif overall < 75:
        tier = "high"
    else:
        tier = "critical"

    # ── Recommended actions ───────────────────────────────────────────────────
    actions: dict[str, list[str]] = {
        "low":      ["Encourage user to call and verify wiring instructions using a known phone number."],
        "medium":   ["Show warning.", "Require phone verification before showing full wiring details."],
        "high":     ["Strong warning.", "Mask account number.",
                     "Require dual verification (call escrow + secondary confirmation)."],
        "critical": ["HARD STOP: Hide wiring details.",
                     "Instruct user to call title/escrow using previously saved contact info.",
                     "Do not reply to the email/message; verify independently."],
    }

    return {
        "bucket_scores":       {"content": content_pts, "banking": banking_pts, "domain": domain_pts},
        "overall_risk_score":  overall,
        "risk_tier":           tier,
        "triggered_rules":     triggered,
        "recommended_actions": actions[tier],
    }


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(pdf_path: str) -> dict[str, Any]:
    """
    Full pipeline: PDF→text → LLM extraction → bank verification →
    domain verification → structured output.
    """
    parsing_errors: list[str] = []

    # 1. Extract raw text from PDF
    try:
        raw_text = extract_text_from_pdf(pdf_path)
    except FileNotFoundError as e:
        return {
            "document_text_snippet": None,
            "extracted_fields": {},
            "llm_extracted": None,
            "parsing_errors": [str(e)],
            "version": "wire_pdf_parser_v2",
        }
    except Exception as e:
        return {
            "document_text_snippet": None,
            "extracted_fields": {},
            "llm_extracted": None,
            "parsing_errors": [f"PDF extraction failed: {e}"],
            "version": "wire_pdf_parser_v2",
        }

    if not raw_text.strip():
        return {
            "document_text_snippet": None,
            "extracted_fields": {},
            "llm_extracted": None,
            "parsing_errors": ["No text could be extracted (image-only or corrupt PDF)."],
            "version": "wire_pdf_parser_v2",
        }

    # 2. Normalise text
    text = normalize_text(raw_text)

    # 3. LLM field extraction
    llm_data: dict[str, Any] = {}
    try:
        llm_data = extract_wire_fields(text)
    except Exception as e:
        parsing_errors.append(f"LLM extraction error: {e}")

    # 4. Map to legacy extracted_fields for frontend
    fields: dict[str, Any] = {}
    if llm_data:
        try:
            fields = _map_llm_to_fields(llm_data)
        except Exception as e:
            parsing_errors.append(f"Field mapping error: {e}")

    # 5. Routing number → bank name cross-check
    bank_name_verification: dict[str, Any] = {
        "looked_up_bank": None, "extracted_bank": None,
        "match": None, "status": "skipped",
    }
    routing_norm = (fields.get("routing_number") or {}).get("normalized")
    extracted_bank = (fields.get("receiving_bank_name") or {}).get("normalized")

    if routing_norm:
        lookup = lookup_bank_by_routing(routing_norm)
        bank_name_verification["looked_up_bank"] = lookup.get("bank_name")
        bank_name_verification["extracted_bank"] = extracted_bank
        bank_name_verification["status"]         = lookup["status"]
        if lookup.get("bank_name") and extracted_bank:
            bank_name_verification["match"] = _bank_names_match(
                lookup["bank_name"], extracted_bank
            )
        # Checksum alone is insufficient — require bank lookup to confirm
        if lookup["status"] == "not_found" and fields.get("routing_number"):
            fields["routing_number"]["is_checksum_valid"] = False

    # 6. Domain verification (uses verify_extracted for richer signals)
    domain_verification: dict[str, Any] | None = None
    if llm_data:
        try:
            domain_verification = DomainVerifier().verify_extracted(llm_data)
        except Exception as e:
            parsing_errors.append(f"Domain verification error: {e}")

    # 7. Build output
    snippet = text[:400].replace("\n", " ").strip()
    hackathon_schema: dict[str, Any] = {}
    if llm_data:
        try:
            hackathon_schema = _map_to_hackathon_schema(
                llm_data, bank_name_verification, domain_verification
            )
        except Exception as e:
            parsing_errors.append(f"Hackathon schema mapping error: {e}")

    return {
        "document_text_snippet":  snippet,
        "extracted_fields":       fields,
        "llm_extracted":          llm_data or None,
        "bank_name_verification": bank_name_verification,
        "domain_verification":    domain_verification,
        "hackathon_schema":       hackathon_schema or None,
        "parsing_errors":         parsing_errors,
        "version":                "wire_pdf_parser_v2",
    }


# ---------------------------------------------------------------------------
# Text-only pipeline (skips pdfplumber — for pasted/pre-extracted text)
# ---------------------------------------------------------------------------

def run_text(raw_text: str) -> dict[str, Any]:
    """
    Run the full pipeline on pre-extracted text, bypassing pdfplumber.
    Identical to run() from step 2 onwards.
    """
    if not raw_text.strip():
        return {
            "document_text_snippet": None,
            "extracted_fields": {},
            "llm_extracted": None,
            "parsing_errors": ["No text provided."],
            "version": "wire_pdf_parser_v2",
        }

    parsing_errors: list[str] = []
    text = normalize_text(raw_text)

    llm_data: dict[str, Any] = {}
    try:
        llm_data = extract_wire_fields(text)
    except Exception as e:
        parsing_errors.append(f"LLM extraction error: {e}")

    fields: dict[str, Any] = {}
    if llm_data:
        try:
            fields = _map_llm_to_fields(llm_data)
        except Exception as e:
            parsing_errors.append(f"Field mapping error: {e}")

    bank_name_verification: dict[str, Any] = {
        "looked_up_bank": None, "extracted_bank": None,
        "match": None, "status": "skipped",
    }
    routing_norm = (fields.get("routing_number") or {}).get("normalized")
    extracted_bank = (fields.get("receiving_bank_name") or {}).get("normalized")
    if routing_norm:
        lookup = lookup_bank_by_routing(routing_norm)
        bank_name_verification["looked_up_bank"] = lookup.get("bank_name")
        bank_name_verification["extracted_bank"] = extracted_bank
        bank_name_verification["status"]         = lookup["status"]
        if lookup.get("bank_name") and extracted_bank:
            bank_name_verification["match"] = _bank_names_match(
                lookup["bank_name"], extracted_bank
            )
        # Checksum alone is insufficient — require bank lookup to confirm
        if lookup["status"] == "not_found" and fields.get("routing_number"):
            fields["routing_number"]["is_checksum_valid"] = False

    domain_verification: dict[str, Any] | None = None
    if llm_data:
        try:
            domain_verification = DomainVerifier().verify_extracted(llm_data)
        except Exception as e:
            parsing_errors.append(f"Domain verification error: {e}")

    snippet = text[:400].replace("\n", " ").strip()
    hackathon_schema: dict[str, Any] = {}
    if llm_data:
        try:
            hackathon_schema = _map_to_hackathon_schema(
                llm_data, bank_name_verification, domain_verification
            )
        except Exception as e:
            parsing_errors.append(f"Hackathon schema mapping error: {e}")

    return {
        "document_text_snippet":  snippet,
        "extracted_fields":       fields,
        "llm_extracted":          llm_data or None,
        "bank_name_verification": bank_name_verification,
        "domain_verification":    domain_verification,
        "hackathon_schema":       hackathon_schema or None,
        "parsing_errors":         parsing_errors,
        "version":                "wire_pdf_parser_v2",
    }


# ---------------------------------------------------------------------------
# Public entry points for FastAPI / programmatic use
# ---------------------------------------------------------------------------

def parse_pdf(pdf_path: str) -> dict[str, Any]:
    return run(pdf_path)


def parse_text(text: str) -> dict[str, Any]:
    return run_text(text)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) >= 3 and sys.argv[1] == "--text-file":
        text = Path(sys.argv[2]).read_text(encoding="utf-8")
        result = run_text(text)
    elif len(sys.argv) >= 2 and not sys.argv[1].startswith("--"):
        result = run(sys.argv[1])
    else:
        print(
            "Usage: python wire_pdf_parser.py path/to/file.pdf\n"
            "       python wire_pdf_parser.py --text-file path/to/text.txt",
            file=sys.stderr,
        )
        sys.exit(1)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
