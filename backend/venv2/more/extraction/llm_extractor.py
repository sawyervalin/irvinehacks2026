"""
extraction/llm_extractor.py
---------------------------
LLM-based wire instruction field extractor using Google Gemini.

Usage:
    from extraction.llm_extractor import extract_wire_fields
    result = extract_wire_fields(document_text)
"""

import json
import os
import re

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# ── Prompt ─────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a real-estate wire-instruction extraction + fraud-signal engine.\n"
    "Return ONLY valid JSON matching the schema exactly. No markdown. No commentary.\n\n"

    "EXTRACTION RULES (be conservative):\n"
    "- If a field is not present in parsed_text, set it to \"\" (or [] for arrays).\n"
    "- Do not guess routing/account numbers if not explicitly present.\n"
    "- Normalize closing_date to YYYY-MM-DD if possible.\n"
    "- amount should be a string; preserve currency if present (e.g. \"$73,250.00 USD\").\n\n"

    "COMMUNICATION RULES:\n"
    "- email_body_text: if text contains a clear email body, copy it; otherwise \"\".\n"
    "- sender_email: extract the first clear email address from the text.\n"
    "- sender_domain: substring after \"@\" in sender_email; else first domain found.\n\n"

    "INTERNET DATA RULES:\n"
    "- domains: unique domains from emails/urls found.\n"
    "- emails: all unique email addresses found.\n"
    "- urls: all unique urls found.\n\n"

    "SIGNALS_FROM_TEXT RULES:\n"
    "A) rushed_closing = true if last-minute changes or rushed timing:\n"
    "   e.g. \"updated wiring instructions\", \"new wire instructions\", \"closing is today\".\n"
    "B) pressure_to_wire = true if urgency/pressure exists:\n"
    "   e.g. \"wire immediately\", \"ASAP\", \"urgent\", \"within 1 hour\", \"lose the house\".\n"
    "C) do_not_call_verify = true if verification is discouraged:\n"
    "   e.g. \"do not call\", \"only reply by email\", \"do not contact agent/title/escrow\".\n"
    "For each detected phrase type, include up to 3 verbatim snippets (max 120 chars each) "
    "in phrase_evidence.*_snippets. If none, leave [].\n"
    "D) dummy_name_detected = true if placeholder name present (John Doe, Jane Doe, Test, etc.).\n"
    "   If true, dummy_name_match = exact matched string; else null.\n"
    "E) suspicious_characters_detected = true if non-ASCII characters appear in key strings.\n"
    "   If true, include up to 5 tokens containing non-ASCII in non_ascii_examples.\n"
    "F) misspelling_count / grammar_error_count: set to null if not confident; only output "
    "numbers for conservative estimates.\n\n"

    "CONFIDENCE SCORING (0.0-1.0) per section:\n"
    "- baseline = 0.85\n"
    "- All key fields present and explicit: confidence = 0.95-1.0\n"
    "- Some present, some missing: confidence = 0.6-0.8\n"
    "- Mostly missing: confidence = 0.3-0.5\n"
)

_SCHEMA = """{
  "document_type": "WIRE_TRANSFER_INSTRUCTIONS",
  "escrow_contact": {
    "name": "", "company": "", "email": "", "phone": "", "confidence": 0.0
  },
  "transaction": {
    "property_address": "", "closing_date": "", "amount": "", "confidence": 0.0
  },
  "wire_details": {
    "beneficiary_name": "", "bank_name": "", "routing_number": "", "account_number": "", "confidence": 0.0
  },
  "communication": {
    "sender_email": "", "sender_domain": "", "confidence": 0.0
  },
  "signals_from_text": {
    "detected_phrases": {
      "rushed_closing": false, "pressure_to_wire": false, "do_not_call_verify": false
    },
    "phrase_evidence": {
      "rushed_closing_snippets": [],
      "pressure_to_wire_snippets": [],
      "do_not_call_verify_snippets": []
    },
    "dummy_name_detected": false,
    "dummy_name_match": null,
    "misspelling_count": null,
    "grammar_error_count": null,
    "suspicious_characters_detected": false,
    "non_ascii_examples": []
  },
  "internet_data": {
    "domains": [], "emails": [], "urls": [], "confidence": 0.0
  }
}"""

# ── Defaults for missing keys ──────────────────────────────────────────────────

_DEFAULTS: dict = {
    "document_type": "WIRE_TRANSFER_INSTRUCTIONS",
    "escrow_contact": {
        "name": "", "company": "", "email": "", "phone": "", "confidence": 0.0,
    },
    "transaction": {
        "property_address": "", "closing_date": "", "amount": "", "confidence": 0.0,
    },
    "wire_details": {
        "beneficiary_name": "", "bank_name": "", "routing_number": "",
        "account_number": "", "confidence": 0.0,
    },
    "communication": {
        "sender_email": "", "sender_domain": "", "confidence": 0.0,
    },
    "signals_from_text": {
        "detected_phrases": {
            "rushed_closing": False,
            "pressure_to_wire": False,
            "do_not_call_verify": False,
        },
        "phrase_evidence": {
            "rushed_closing_snippets": [],
            "pressure_to_wire_snippets": [],
            "do_not_call_verify_snippets": [],
        },
        "dummy_name_detected": False,
        "dummy_name_match": None,
        "misspelling_count": None,
        "grammar_error_count": None,
        "suspicious_characters_detected": False,
        "non_ascii_examples": [],
    },
    "internet_data": {
        "domains": [], "emails": [], "urls": [], "confidence": 0.0,
    },
}


def _fill_defaults(data: dict) -> None:
    """Fill missing top-level and nested keys with defaults (in-place)."""
    for key, default in _DEFAULTS.items():
        if key not in data or data[key] is None:
            data[key] = default
        elif isinstance(default, dict) and isinstance(data.get(key), dict):
            for subkey, subdefault in default.items():
                if subkey not in data[key]:
                    data[key][subkey] = subdefault
                elif isinstance(subdefault, dict) and isinstance(data[key].get(subkey), dict):
                    for k2, v2 in subdefault.items():
                        if k2 not in data[key][subkey]:
                            data[key][subkey][k2] = v2


def _strip_markdown(text: str) -> str:
    """Remove ```json ... ``` fences Gemini sometimes adds."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ── Main extractor ─────────────────────────────────────────────────────────────

def extract_wire_fields(document_text: str, sender_email: str = "") -> dict:
    """
    Call Gemini with the document text and return structured wire fields.

    Raises:
        ValueError  – if the model returns invalid or non-dict JSON.
    """
    api_key = os.getenv("GOOGLE_API_KEY", "")
    client = genai.Client(api_key=api_key)

    optional_context = f"sender_email: {sender_email}" if sender_email else "(none)"
    user_message = (
        f"parsed_text:\n<<<\n{document_text}\n>>>\n\n"
        f"optional_context: {optional_context}\n\n"
        f"Return JSON matching this schema:\n{_SCHEMA}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
        ),
    )
    raw = _strip_markdown(response.text)

    try:
        extracted = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned invalid JSON: {exc}\n"
            f"Raw response (first 300 chars): {raw[:300]}"
        ) from exc

    if not isinstance(extracted, dict):
        raise ValueError(
            f"LLM returned non-dict JSON (got {type(extracted).__name__}): {raw[:200]}"
        )

    _fill_defaults(extracted)
    return extracted
