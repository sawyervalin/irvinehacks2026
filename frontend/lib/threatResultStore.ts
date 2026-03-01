export interface StoredThreatResult {
  receivedAt: string;
  source: "process" | "process-pdf";
  backendResponse: unknown;
}

declare global {
  var __latestThreatResult: StoredThreatResult | null | undefined;
}

function getStoreSlot(): { value: StoredThreatResult | null } {
  if (globalThis.__latestThreatResult === undefined) {
    globalThis.__latestThreatResult = null;
  }

  return {
    get value() {
      return globalThis.__latestThreatResult ?? null;
    },
    set value(next: StoredThreatResult | null) {
      globalThis.__latestThreatResult = next;
    }
  };
}

export function setLatestThreatResult(result: StoredThreatResult): void {
  getStoreSlot().value = result;
}

export function getLatestThreatResult(): StoredThreatResult | null {
  return getStoreSlot().value;
}
