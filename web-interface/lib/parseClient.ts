export interface ParsedWireDocument {
  risk: {
    risk_score: number;
    plain_english_advice: string;
  };
  extracted_fields: Record<string, unknown>;
  soft_evidence: Record<string, unknown>;
  hard_evidence: Record<string, unknown>;
  domain_verification: Record<string, unknown>;
  cross_reference: Record<string, unknown>;
}

// Structured to be replaced with a real Claude API call later.
export async function parseWireDocument(document_text: string): Promise<ParsedWireDocument> {
  const lower = document_text.toLowerCase();

  const risk_score = lower.includes("wire immediately") ? 85 : 12;

  const plain_english_advice =
    risk_score >= 70
      ? "High risk detected. This document contains urgent wire transfer language commonly associated with fraud. Do not proceed without independent verification."
      : "Low risk detected. This document appears to be a standard wire instruction. Proceed with normal due diligence.";

  return {
    risk: {
      risk_score,
      plain_english_advice,
    },
    extracted_fields: {
      word_count: document_text.split(/\s+/).filter(Boolean).length,
      detected_urgency: lower.includes("immediately") || lower.includes("urgent"),
    },
    soft_evidence: {
      contains_urgency_language: lower.includes("wire immediately"),
      contains_routing_number: /\b\d{9}\b/.test(document_text),
      contains_account_number: /account\s*#?\s*\d+/i.test(document_text),
    },
    hard_evidence: {
      flagged_phrases: lower.includes("wire immediately") ? ["wire immediately"] : [],
    },
    domain_verification: {
      status: "not_checked",
      note: "Domain verification requires Claude API integration.",
    },
    cross_reference: {
      status: "not_checked",
      note: "Cross-reference check requires Claude API integration.",
    },
  };
}
