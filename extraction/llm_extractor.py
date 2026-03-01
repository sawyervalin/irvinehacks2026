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
    "You extract structured wire instruction data for real estate fraud detection.\n"
    "Return valid JSON only. No prose. No markdown. No comments.\n"
    "Use null if missing. Do not guess. Preserve original values.\n"
    "Normalize dates to YYYY-MM-DD if clear. Normalize phone numbers to E.164 if clear.\n"
    "Extract all domains from emails and URLs.\n"
    "Add red_flags for mismatches, urgency language, payment changes, "
    "free email domains, or inconsistencies."
)

_SCHEMA = """{
  "document_type": null,
  "escrow_officer": {"name": null, "title": null, "company": null, "email": null, "phone": null, "domains": []},
  "other_contacts": [],
  "transaction": {"property_address": null, "closing_date": null, "escrow_number": null, "loan_number": null},
  "wire_details": {"beneficiary_name": null, "bank_name": null, "bank_address": null, "routing_number": null, "account_number": null, "swift_code": null, "amount": null},
  "internet_data": {"domains": [], "emails": [], "urls": []},
  "red_flags": [],
  "confidence": 0.0
}"""

# ── Defaults for missing keys ──────────────────────────────────────────────────

_DEFAULTS: dict = {
    "document_type": None,
    "escrow_officer": {
        "name": None, "title": None, "company": None,
        "email": None, "phone": None, "domains": [],
    },
    "other_contacts": [],
    "transaction": {
        "property_address": None, "closing_date": None,
        "escrow_number": None, "loan_number": None,
    },
    "wire_details": {
        "beneficiary_name": None, "bank_name": None, "bank_address": None,
        "routing_number": None, "account_number": None,
        "swift_code": None, "amount": None,
    },
    "internet_data": {"domains": [], "emails": [], "urls": []},
    "red_flags": [],
    "confidence": 0.0,
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


def _strip_markdown(text: str) -> str:
    """Remove ```json ... ``` fences Gemini sometimes adds."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ── Main extractor ─────────────────────────────────────────────────────────────

def extract_wire_fields(document_text: str) -> dict:
    """
    Call Gemini with the document text and return structured wire fields.

    Raises:
        ValueError  – if the model returns invalid or non-dict JSON.
    """
    api_key = os.getenv("GOOGLE_API_KEY", "")
    client = genai.Client(api_key=api_key)

    user_message = (
        f"Extract wire-related fields from this document:\n"
        f"<<<\n{document_text}\n>>>\n\n"
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

    # Strict JSON parse
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
