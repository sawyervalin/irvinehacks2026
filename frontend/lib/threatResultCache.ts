// Client-side module-level cache for the latest threat result.
// Persists across page navigations within the same browser session
// (as long as the Next.js client bundle stays loaded).

export interface StoredThreatResult {
  receivedAt: string;
  source: "process" | "process-pdf";
  backendResponse: unknown;
}

let cached: StoredThreatResult | null = null;

export function setCachedThreatResult(result: StoredThreatResult | null): void {
  cached = result;
}

export function getCachedThreatResult(): StoredThreatResult | null {
  return cached;
}
