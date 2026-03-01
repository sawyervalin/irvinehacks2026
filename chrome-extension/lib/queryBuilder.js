const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIMPLE_DOMAIN_REGEX = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;

export function validateEmail(email) {
  return SIMPLE_EMAIL_REGEX.test(email);
}

export function validateDomain(domain) {
  return SIMPLE_DOMAIN_REGEX.test(domain);
}

export function normalizeDomain(domain) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

export function normalizeKeywords(keywords) {
  if (!keywords) {
    return [];
  }
  return String(keywords)
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function clampLimit(limit) {
  const numeric = Number(limit);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(numeric), MAX_LIMIT);
}

function escapeToken(token) {
  if (/[\s"]/u.test(token)) {
    return `"${token.replace(/"/g, '\\"')}"`;
  }
  return token;
}

export function buildGmailQuery(request = {}) {
  const senderEmail = (request.senderEmail || "").trim();
  const senderDomain = normalizeDomain(request.senderDomain);
  const keywordTokens = normalizeKeywords(request.keywords);
  const tokens = [];

  if (senderEmail) {
    if (!validateEmail(senderEmail)) {
      const error = new Error("Sender email format is invalid.");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    tokens.push(`from:${escapeToken(senderEmail)}`);
  }

  if (senderDomain) {
    if (!validateDomain(senderDomain)) {
      const error = new Error("Sender domain format is invalid.");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    tokens.push(`from:${escapeToken(senderDomain)}`);
  }

  if (keywordTokens.length > 0) {
    for (const token of keywordTokens) {
      tokens.push(escapeToken(token));
    }
  }

  if (tokens.length === 0) {
    const error = new Error("Provide sender email, sender domain, keywords, or any combination.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  return {
    query: tokens.join(" "),
    limit: clampLimit(request.limit)
  };
}
