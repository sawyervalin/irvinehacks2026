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
# ABA routing checksum
# ---------------------------------------------------------------------------

def validate_routing_checksum(routing: str) -> bool:
    digits = re.sub(r"\D", "", routing)
    if len(digits) != 9:
        return False
    d = [int(c) for c in digits]
    return (3*(d[0]+d[3]+d[6]) + 7*(d[1]+d[4]+d[7]) + (d[2]+d[5]+d[8])) % 10 == 0


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
    escrow      = llm_data.get("escrow_officer") or {}
    wire        = llm_data.get("wire_details") or {}
    transaction = llm_data.get("transaction") or {}

    email  = escrow.get("email")
    domain: str | None = None
    if email and "@" in email:
        domain = email.split("@", 1)[1]
    elif (llm_data.get("internet_data") or {}).get("domains"):
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
            valid = validate_routing_checksum(digits)
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

    # Phone numbers — gather from escrow officer + other_contacts
    phones_raw: list[str] = []
    if escrow.get("phone"):
        phones_raw.append(escrow["phone"])
    for contact in llm_data.get("other_contacts", []):
        if isinstance(contact, dict) and contact.get("phone"):
            phones_raw.append(contact["phone"])
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

    # 6. Domain verification (uses verify_extracted for richer signals)
    domain_verification: dict[str, Any] | None = None
    if llm_data:
        try:
            domain_verification = DomainVerifier().verify_extracted(llm_data)
        except Exception as e:
            parsing_errors.append(f"Domain verification error: {e}")

    # 7. Build output
    snippet = text[:400].replace("\n", " ").strip()
    return {
        "document_text_snippet":  snippet,
        "extracted_fields":       fields,
        "llm_extracted":          llm_data or None,
        "bank_name_verification": bank_name_verification,
        "domain_verification":    domain_verification,
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

    domain_verification: dict[str, Any] | None = None
    if llm_data:
        try:
            domain_verification = DomainVerifier().verify_extracted(llm_data)
        except Exception as e:
            parsing_errors.append(f"Domain verification error: {e}")

    snippet = text[:400].replace("\n", " ").strip()
    return {
        "document_text_snippet":  snippet,
        "extracted_fields":       fields,
        "llm_extracted":          llm_data or None,
        "bank_name_verification": bank_name_verification,
        "domain_verification":    domain_verification,
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
