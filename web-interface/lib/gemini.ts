import type { ParsedResponse, UserProfile } from "@/lib/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  //gemenia-1.5-flash

const SYSTEM_PROMPT = `You are an extraction + forensic analysis engine for KeyReady, a wire fraud detection app for homebuyers.

INPUTS:
- document_text: the full text extracted from a wiring instructions PDF or pasted by the user.
- user_profile (optional): {
  title_company_name: string,
  escrow_officer_name: string,
  expected_wire_amount: number,
  expected_bank_name?: string
}

TASK:
Extract key wiring fields from document_text and produce ONE valid JSON object only (no markdown, no code fences, no commentary) in the schema below.

REQUIREMENTS:
- If a field is missing, set it to null and confidence 0.0.
- Provide confidence 0.0–1.0 for extracted fields.
- Provide soft evidence and hard evidence flags relevant to wire fraud ONLY.
- Do NOT browse the web. If an external lookup is needed (routing lookup, WHOIS, MX), mark *_api_needed=true and leave lookup fields null.
- Mask account numbers: output ONLY last4 in extracted_fields.account_number_last4.
- Detect non-Latin characters or suspicious character substitutions in critical fields (routing/account/domain).
- Detect lookalike domains and dummy names.
- Detect high-risk phrases ("wire immediately", "do not call to verify", "urgent", "phones offline", "within 1 hour", etc.).
- Provide ai_generated_text_likelihood as a heuristic score (0–1) with a brief explanation.

JSON SCHEMA (MUST MATCH EXACTLY):
{
  "document_text_snippet": string,
  "extracted_fields": {
    "document_type": {"raw": string|null, "normalized": string|null, "confidence": number},
    "sender_email": {"raw": string|null, "normalized": string|null, "confidence": number},
    "sender_domain": {"raw": string|null, "normalized": string|null, "confidence": number},
    "title_company_name": {"raw": string|null, "normalized": string|null, "confidence": number},
    "escrow_officer_name": {"raw": string|null, "normalized": string|null, "confidence": number},
    "escrow_officer_phone": {"raw": string|null, "normalized": string|null, "confidence": number},
    "bank_name": {"raw": string|null, "normalized": string|null, "confidence": number},
    "routing_number": {"raw": string|null, "normalized": string|null, "confidence": number},
    "account_number_last4": {"raw": string|null, "normalized": string|null, "confidence": number},
    "wire_amount": {"raw": string|null, "normalized": number|null, "confidence": number},
    "currency": {"raw": string|null, "normalized": string|null, "confidence": number},
    "wire_deadline": {"raw": string|null, "normalized": string|null, "confidence": number},
    "signed_by": {"raw": string|null, "normalized": string|null, "confidence": number},
    "footer_contact_info": {"raw": string|null, "confidence": number}
  },
  "soft_evidence": {
    "misspelling_detected": {"value": boolean, "examples": string[], "confidence": number},
    "grammatical_errors_score": number,
    "known_dummy_name_detected": {"value": boolean, "matches": string[]},
    "escrow_name_mismatch": {"value": boolean, "similarity": number|null, "explanation": string},
    "non_latin_characters_detected": {"value": boolean, "scripts": string[]},
    "high_risk_phrases": [{"phrase": string, "context": string, "offset": number, "severity": number}],
    "ai_generated_text_likelihood": {"score": number, "explanation": string}
  },
  "hard_evidence": {
    "routing_number_verification": {
      "routing_normalized": string|null,
      "lookup_status": "found"|"not_found"|"invalid_format",
      "lookup_bank_name": string|null,
      "match_with_doc_bank_name": boolean|null
    },
    "account_number_format_anomaly": {"value": boolean, "explanation": string},
    "foreign_data_detected": {"value": boolean, "items": string[], "confidence": number},
    "routing_lookup_api_needed": boolean
  },
  "domain_verification": {
    "domain_name": string|null,
    "domain_age_days": number|null,
    "is_new_domain": boolean|null,
    "mx_records_found": boolean|null,
    "lookalike_similarity": {"to_title_company": number|null, "edit_distance": number|null},
    "known_scam_domain_hit": string[],
    "online_identity_presence": {"search_results_found": boolean|null, "num_search_hits": number|null}
  },
  "cross_reference": {
    "amount_mismatch": {"value": boolean, "difference_amount": number|null, "difference_percent": number|null, "explanation": string},
    "bank_name_mismatch": {"value": boolean, "explanation": string},
    "escrow_officer_mismatch": {"value": boolean, "explanation": string},
    "consistency_score": number
  },
  "risk": {
    "risk_score": number,
    "risk_breakdown": [{"factor": string, "points": number}],
    "plain_english_advice": string
  },
  "parsing_errors": string[],
  "processing_time_ms": number,
  "version": "keyready_parser_v1"
}

DUMMY NAME LIST (flag if matched approximately):
John Doe, Ryan Smith, Sawyer Valin, Jane Doe, Test User, Sample Name`;

function buildPrompt(document_text: string, user_profile?: UserProfile | null): string {
  const profileJson = user_profile ? JSON.stringify(user_profile, null, 2) : "null";

  return `${SYSTEM_PROMPT}

Now process this:
document_text:
<<<DOCUMENT_TEXT>>>
${document_text}
<<<DOCUMENT_TEXT>>>

user_profile (optional):
<<<USER_PROFILE_JSON>>>
${profileJson}
<<<USER_PROFILE_JSON>>>`;
}

function stripAndParseJSON(raw: string): ParsedResponse {
  // Remove fenced code blocks (```json ... ``` or ``` ... ```)
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // If there's leading/trailing text outside the JSON object, extract the first {...} block
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as ParsedResponse;
}

export async function parseWithGemini(
  document_text: string,
  user_profile?: UserProfile | null
): Promise<ParsedResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      risk: { risk_score: 0, plain_english_advice: "Gemini API key not configured." },
      extracted_fields: {},
      soft_evidence: {},
      hard_evidence: {},
      domain_verification: {},
      cross_reference: {},
      parsing_errors: ["GEMINI_API_KEY environment variable is not set."],
    };
  }

  const prompt = buildPrompt(document_text, user_profile);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    return {
      risk: { risk_score: 0, plain_english_advice: "No response from model." },
      extracted_fields: {},
      soft_evidence: {},
      hard_evidence: {},
      domain_verification: {},
      cross_reference: {},
      parsing_errors: ["Empty response from Gemini API."],
    };
  }

  try {
    return stripAndParseJSON(rawText);
  } catch (err) {
    return {
      risk: { risk_score: 0, plain_english_advice: "Failed to parse model response." },
      extracted_fields: {},
      soft_evidence: {},
      hard_evidence: {},
      domain_verification: {},
      cross_reference: {},
      parsing_errors: [
        `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
        `Raw model output: ${rawText.slice(0, 500)}`,
      ],
    };
  }
}
