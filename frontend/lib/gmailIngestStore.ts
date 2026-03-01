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

// Ephemeral in-memory storage for prototype use only.
// This resets whenever the Next.js server restarts or redeploys.
let latestBatch: GmailIngestBatch | null = null;

export function setLatestBatch(payload: GmailIngestPayload): GmailIngestBatch {
  const batch: GmailIngestBatch = {
    batchId: crypto.randomUUID(),
    ingestedAt: payload.ingestedAt,
    ingestedCount: payload.data.count,
    payload
  };

  latestBatch = batch;
  return batch;
}

export function getLatestBatch(): GmailIngestBatch | null {
  return latestBatch;
}
