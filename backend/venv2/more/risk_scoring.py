"""
risk_scoring.py
---------------
Standalone wire-fraud risk scoring for hackathon demo.
Also serves as the canonical source for shared constants imported
by domain_verification.py and wire_pdf_parser.py.

Usage:
    from risk_scoring import score_extraction
    result = score_extraction(extraction_dict)
"""

import re
from difflib import SequenceMatcher

# ── Canonical domain lists (imported by domain_verification.py) ───────────────

KNOWN_LEGIT_DOMAINS: list[str] = [
    # National title companies
    "firstam.com",            # First American Title
    "fidelitynational.com",   # Fidelity National Title
    "fntic.com",              # Fidelity National Title Insurance Co.
    "oldrepublictitle.com",   # Old Republic Title
    "stewartitle.com",        # Stewart Title
    "chicagotitle.com",       # Chicago Title
    "ticortitle.com",         # Ticor Title
    "commonwealthland.com",   # Commonwealth Land Title
    "landam.com",             # LandAmerica
    "titleresourcegroup.com", # Title Resource Group (Realogy)
    "investors-title.com",    # Investors Title
    "titleone.com",           # TitleOne
    "landtitleguarantee.com", # Land Title Guarantee (CO)
    "alamo-title.com",        # Alamo Title (TX)
    "vectitle.com",           # VEC Title
    "nationaltitle.com",      # National Title
    "rexerainc.com",          # Rexera (formerly PropLogix)
    "proplogix.com",          # PropLogix / Rexera
    # Major mortgage lenders & servicers
    "wellsfargo.com",
    "bankofamerica.com",
    "chase.com",
    "usbank.com",
    "rocketmortgage.com",
    "quickenloans.com",
    "pennymac.com",
    "loandepot.com",
    "caliberhomeloans.com",
    "mrcooper.com",
    "flagstar.com",
    "newrez.com",
    "guaranteedrate.com",
    "uhm.com",
    "movement.com",
    "pnc.com",
    "truist.com",
    "regions.com",
    "citizensbank.com",
    "suntrust.com",
    # Escrow / closing services
    "escrow.com",
    "snapdocs.com",
    "notarize.com",
    "pavaso.com",
    "indecomm.net",
]

FREE_EMAIL_DOMAINS: frozenset[str] = frozenset({
    "gmail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "protonmail.com", "mail.com",
    "live.com", "msn.com", "ymail.com", "googlemail.com",
})


# ── Shared helpers ────────────────────────────────────────────────────────────

def aba_checksum_valid(routing: str) -> bool:
    """Return True if routing number passes the ABA mod-10 checksum."""
    digits = re.sub(r"\D", "", routing)
    if len(digits) != 9:
        return False
    d = [int(c) for c in digits]
    return (3*(d[0]+d[3]+d[6]) + 7*(d[1]+d[4]+d[7]) + (d[2]+d[5]+d[8])) % 10 == 0


def is_lookalike_domain(domain: str) -> bool:
    """Return True if domain looks like a typosquat of a known legit domain."""
    base = domain.lower().split(".")[0]
    for legit in KNOWN_LEGIT_DOMAINS:
        if domain.lower() == legit:
            return False  # exact match — not a lookalike
        if SequenceMatcher(None, base, legit.split(".")[0]).ratio() > 0.8:
            return True
    return False


# ── Main scoring function ─────────────────────────────────────────────────────

def score_extraction(data: dict) -> dict:
    """
    Score a wire extraction dict and return a text-only risk assessment.
    Accepts the extraction dict directly or wrapped as {"extraction": {...}}.
    """
    ext = data.get("extraction", data) if isinstance(data.get("extraction"), dict) else data

    signals = ext.get("signals_from_text") or {}
    phrases = signals.get("detected_phrases") or {}
    wire    = ext.get("wire_details") or {}
    comm    = ext.get("communication") or {}
    escrow  = ext.get("escrow_contact") or {}

    triggered: list[dict] = []
    content_pts = 0
    domain_pts  = 0
    banking_pts = 0

    # ── CONTENT ───────────────────────────────────────────────────────────────

    if phrases.get("rushed_closing"):
        content_pts += 15
        triggered.append({"rule": "RUSHED_CLOSING", "points": 15})

    if phrases.get("pressure_to_wire"):
        content_pts += 15
        triggered.append({"rule": "PRESSURE_TO_WIRE", "points": 15})

    if phrases.get("do_not_call_verify"):
        content_pts += 25
        triggered.append({"rule": "DO_NOT_CALL_VERIFY", "points": 25})

    if signals.get("dummy_name_detected"):
        content_pts += 10
        triggered.append({"rule": "DUMMY_NAME_DETECTED", "points": 10})

    misspellings = signals.get("misspelling_count")
    if isinstance(misspellings, (int, float)) and misspellings >= 2:
        content_pts += 5
        triggered.append({"rule": "MISSPELLINGS", "points": 5})

    # ── DOMAIN ────────────────────────────────────────────────────────────────

    sender_domain = (comm.get("sender_domain") or "").lower()
    escrow_email  = (escrow.get("email") or "").lower()
    escrow_domain = escrow_email.split("@", 1)[1] if "@" in escrow_email else ""

    if sender_domain and escrow_domain and sender_domain != escrow_domain:
        domain_pts += 15
        triggered.append({"rule": "SENDER_DOMAIN_MISMATCH", "points": 15})

    if sender_domain in FREE_EMAIL_DOMAINS:
        domain_pts += 10
        triggered.append({"rule": "FREE_EMAIL_PROVIDER", "points": 10})

    if sender_domain and is_lookalike_domain(sender_domain):
        domain_pts += 20
        triggered.append({"rule": "LOOKALIKE_DOMAIN", "points": 20})

    # ── BANKING ───────────────────────────────────────────────────────────────

    routing = re.sub(r"\D", "", wire.get("routing_number") or "")
    if not routing:
        banking_pts += 25
        triggered.append({"rule": "MISSING_ROUTING_NUMBER", "points": 25})
    elif len(routing) != 9:
        banking_pts += 25
        triggered.append({"rule": "ROUTING_NUMBER_BAD_LENGTH", "points": 25})
    elif not aba_checksum_valid(routing):
        banking_pts += 25
        triggered.append({"rule": "ROUTING_NUMBER_BAD_CHECKSUM", "points": 25})

    account = re.sub(r"\D", "", wire.get("account_number") or "")
    if len(account) < 6:
        banking_pts += 10
        triggered.append({"rule": "ACCOUNT_NUMBER_TOO_SHORT", "points": 10})

    if not wire.get("bank_name") or not wire.get("beneficiary_name"):
        banking_pts += 15
        triggered.append({"rule": "MISSING_BANK_OR_BENEFICIARY", "points": 15})

    # ── Overall ───────────────────────────────────────────────────────────────

    overall = content_pts + domain_pts + banking_pts
    tier = "high" if overall >= 60 else "medium" if overall >= 25 else "low"

    return {
        "bucket_scores": {
            "content": content_pts,
            "domain":  domain_pts,
            "banking": banking_pts,
        },
        "overall_risk_score": overall,
        "risk_tier":          tier,
        "triggered_rules":    triggered,
    }


# ── Minimal unit test ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    sample = {
        "document_type": "WIRE_TRANSFER_INSTRUCTIONS",
        "escrow_contact": {
            "name": "John Doe", "company": "Maple Grove Title & Escrow, LLC",
            "email": "ablake@maplegrovetitIe.com", "phone": "", "confidence": 0.95,
        },
        "transaction": {
            "property_address": "", "closing_date": "", "amount": "", "confidence": 0.3,
        },
        "wire_details": {
            "beneficiary_name": "Maple Grove Title Trust Account",
            "bank_name": "First Pacific Bank",
            "routing_number": "123456780",
            "account_number": "000112223999",
            "confidence": 0.95,
        },
        "communication": {
            "sender_email": "ablake@maplegrovetitIe.com",
            "sender_domain": "maplegrovetitIe.com",
            "confidence": 0.95,
        },
        "signals_from_text": {
            "detected_phrases": {
                "rushed_closing": True, "pressure_to_wire": True, "do_not_call_verify": True,
            },
            "phrase_evidence": {
                "rushed_closing_snippets":     ["UPDATED WIRE INSTRUCTIONS – CLOSING TODAY", "last minute change"],
                "pressure_to_wire_snippets":   ["This is time sensitive.", "Wire immediately"],
                "do_not_call_verify_snippets": ["Do not call the office to vtrify", "Only communicate via email"],
            },
            "dummy_name_detected": True, "dummy_name_match": "John Doe",
            "misspelling_count": 2, "grammar_error_count": None,
            "suspicious_characters_detected": False, "non_ascii_examples": [],
        },
        "internet_data": {
            "domains": ["maplegrovetitIe.com"],
            "emails":  ["ablake@maplegrovetitIe.com"],
            "urls":    [], "confidence": 0.95,
        },
    }

    result = score_extraction(sample)
    print(json.dumps(result, indent=2))

    assert result["risk_tier"] == "high", f"Expected high, got {result['risk_tier']}"
    assert result["overall_risk_score"] >= 60, f"Expected >= 60, got {result['overall_risk_score']}"
    assert result["bucket_scores"]["content"] >= 65
    print("\nAll assertions passed.")
