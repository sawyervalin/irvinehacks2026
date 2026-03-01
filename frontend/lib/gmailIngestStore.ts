export interface GmailIngestData {
  query: string;
  count: number;
  messages: unknown[];
  nextPageToken?: string;
  errors?: unknown[];
}

export interface GmailIngestPayload {
  source: string;
  ingestedAt: string;
  data: GmailIngestData;
}

export interface GmailIngestBatch {
  batchId: string;
  ingestedAt: string;
  ingestedCount: number;
  payload: GmailIngestPayload;
}

declare global {
  var __gmailIngestLatestBatch: GmailIngestBatch | null | undefined;
}

// Ephemeral in-memory storage for prototype use only.
// This resets whenever the Next.js server restarts or redeploys.
function getStoreSlot(): { value: GmailIngestBatch | null } {
  if (globalThis.__gmailIngestLatestBatch === undefined) {
    globalThis.__gmailIngestLatestBatch = null;
  }

  return {
    get value() {
      return globalThis.__gmailIngestLatestBatch ?? null;
    },
    set value(batch: GmailIngestBatch | null) {
      globalThis.__gmailIngestLatestBatch = batch;
    }
  };
}

export function setLatestBatch(payload: GmailIngestPayload): GmailIngestBatch {
  const batch: GmailIngestBatch = {
    batchId: crypto.randomUUID(),
    ingestedAt: payload.ingestedAt,
    ingestedCount: payload.data.count,
    payload
  };

  getStoreSlot().value = batch;
  return batch;
}

export function getLatestBatch(): GmailIngestBatch | null {
  return getStoreSlot().value;
}
