#!/usr/bin/env python3
"""
behavioral_context.py
---------------------
Analyzes a normalized email JSON (output of normalize_gmail.py) and produces
reusable behavioral context signals, risk assessment, and a report-ready
summary using Gemini.

Usage:
    python behavioral_context.py input_normalized.json    # from file
    echo '{...}' | python behavioral_context.py -         # from stdin
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a specialized email security and behavioral analysis engine.

Analyze a normalized email JSON and produce behavioral context signals,
risk assessment, and a report-ready summary.

STRICT RULES:
- Output MUST be valid JSON only. No markdown fences. No commentary.
- Do NOT invent facts not present in the input JSON.
- Every rationale bullet MUST include evidence_paths referencing actual fields
  from the input JSON (e.g. "headers.auth_summary.dmarc", "links.hosts",
  "content.text", "signals.has_unsubscribe", "signals.urgency_phrases").
- If something is uncertain, say so and lower confidence scores accordingly.
- Keep output concise and high-signal.

SCORING GUIDELINES:
- Strong legitimacy: DMARC pass + DKIM pass + SPF pass + list-unsubscribe
  present + consistent domains + known bulk-mail vendor hosts.
- Phishing risk increases with: domain mismatch, urgent action, credential
  request, suspicious hosts, broken auth, impersonation cues.
- Wire-fraud risk increases with: wire/ACH/routing/account/payment language
  + urgency + instruction changes.
- benign_likelihood + phishing_likelihood + wire_fraud_likelihood must sum
  to approximately 1.0. Each is a float between 0.0 and 1.0.

FIELD CONSTRAINTS (use exactly these values):
- message_type:   "marketing" | "transactional" | "account_security" |
                  "financial" | "legal" | "personal" | "unknown"
- auth_alignment: "strong" | "mixed" | "weak" | "unknown"
- urgency:        "none" | "low" | "medium" | "high"
- cta_density:    "low" | "medium" | "high"
- overall_risk:   "low" | "medium" | "high"

ENTITY EXTRACTION GUIDANCE:
- people / orgs / topics: infer ONLY from content.text and obvious header
  fields (subject, from_name). Do not hallucinate entities.

Return EXACTLY this JSON shape (no extra or missing keys):
{
  "behavioral_context": {
    "message_type": <string>,
    "intent_summary": <string>,
    "sender_legitimacy_signals": [<string>, ...],
    "sender_risk_signals": [<string>, ...],
    "infrastructure_fingerprint": {
      "from_domain": <string|null>,
      "return_path_domain": <string|null>,
      "vendor_indicators": [<string>, ...],
      "auth_alignment": <string>
    },
    "persuasion_profile": {
      "urgency": <string>,
      "cta_density": <string>,
      "incentives_present": <boolean>,
      "notable_ctas": [<string>, ...]
    },
    "extracted_entities": {
      "people": [<string>, ...],
      "orgs": [<string>, ...],
      "topics": [<string>, ...]
    }
  },
  "risk_context": {
    "benign_likelihood": <float>,
    "phishing_likelihood": <float>,
    "wire_fraud_likelihood": <float>,
    "overall_risk": <string>,
    "rationale_bullets": [
      {
        "claim": <string>,
        "evidence_paths": [<string>, ...]
      }
    ]
  },
  "report_ready_summary": {
    "one_paragraph": <string>,
    "notable_patterns": [<string>, ...],
    "what_to_check_next": [<string>, ...]
  }
}"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences if Gemini adds them."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ── Core analyzer ─────────────────────────────────────────────────────────────

def analyze_email(normalized: dict) -> dict:
    """
    Call Gemini to produce behavioral context for a single normalized email.

    Args:
        normalized: A normalized email dict (output of normalize_gmail.py).

    Returns:
        Parsed behavioral context dict matching the output schema.

    Raises:
        ValueError: if Gemini returns invalid or non-conforming JSON.
    """
    api_key = os.getenv("GOOGLE_API_KEY", "")
    client = genai.Client(api_key=api_key)

    user_message = (
        "Analyze the normalized email JSON below and return behavioral context "
        "exactly matching the specified output schema. Return JSON only.\n\n"
        "NORMALIZED EMAIL JSON:\n"
        f"{json.dumps(normalized, indent=2, ensure_ascii=False)}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
        ),
    )

    raw = _strip_fences(response.text)

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Gemini returned invalid JSON: {exc}\n"
            f"Raw response (first 500 chars): {raw[:500]}"
        ) from exc

    if not isinstance(result, dict):
        raise ValueError(
            f"Gemini returned non-dict JSON (got {type(result).__name__}): "
            f"{raw[:200]}"
        )

    return result


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "-"

    if src == "-":
        raw = json.load(sys.stdin)
    else:
        with open(src) as f:
            raw = json.load(f)

    # Support a single normalized email or a list of them
    if isinstance(raw, list):
        results = [analyze_email(msg) for msg in raw]
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        result = analyze_email(raw)
        print(json.dumps(result, indent=2, ensure_ascii=False))