export interface UserProfile {
  name?: string;
  role?: string;
  organization?: string;
  preferences?: Record<string, unknown>;
}

export interface RiskAssessment {
  risk_score: number;
  plain_english_advice: string;
}

export interface ParsedResponse {
  risk: RiskAssessment;
  extracted_fields: Record<string, unknown>;
  soft_evidence: Record<string, unknown>;
  hard_evidence: Record<string, unknown>;
  domain_verification: Record<string, unknown>;
  cross_reference: Record<string, unknown>;
  parsing_errors?: string[];
}
