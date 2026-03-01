export const DEFAULT_APP_BASE_URL = "http://localhost:3000";
export const DEFAULT_EXTENSION_API_KEY = "dev-extension-key-change-me";

/**
 * @param {unknown} data
 * @returns {{source: string, ingestedAt: string, data: unknown}}
 */
export function buildIngestPayload(data) {
  return {
    source: "chrome-extension",
    ingestedAt: new Date().toISOString(),
    data
  };
}

/**
 * @param {{data: unknown, appBaseUrl?: string, apiKey?: string, fetchImpl?: typeof fetch}} args
 * @returns {Promise<{ok: boolean, status: number}>}
 */
export async function sendIngestToApp(args) {
  const appBaseUrl = args.appBaseUrl || DEFAULT_APP_BASE_URL;
  const apiKey = args.apiKey || DEFAULT_EXTENSION_API_KEY;
  const fetchImpl = args.fetchImpl || fetch;
  const payload = buildIngestPayload(args.data);

  const response = await fetchImpl(`${appBaseUrl}/api/gmail-ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-extension-api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  return {
    ok: response.ok,
    status: response.status
  };
}
