import { parseMessage } from "./messageParser.js";
import { buildGmailQuery } from "./queryBuilder.js";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

function makeError(message, status = 0, code = "") {
  const error = new Error(message);
  error.status = status;
  if (code) {
    error.code = code;
  }
  return error;
}

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId)
  };
}

async function apiGetJson(path, { token, fetchImpl, signal }) {
  const response = await fetchImpl(`${GMAIL_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    signal
  });

  if (!response.ok) {
    let message = `Gmail API request failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      try {
        const bodyText = await response.text();
        if (bodyText) {
          message = bodyText;
        }
      } catch {
        // ignore parse failures
      }
    }
    throw makeError(message, response.status);
  }

  return response.json();
}

async function listMessages({ token, query, maxResults, fetchImpl, signal }) {
  const listPath = `/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  return apiGetJson(listPath, { token, fetchImpl, signal });
}

async function getMessage({ token, id, fetchImpl, signal }) {
  const getPath = `/messages/${encodeURIComponent(id)}?format=full`;
  return apiGetJson(getPath, { token, fetchImpl, signal });
}

/**
 * @param {{token: string, request?: import('./types.js').SearchRequest, timeoutMs?: number, fetchImpl?: typeof fetch}} args
 * @returns {Promise<import('./types.js').SearchResponse>}
 */
export async function searchEmails(args) {
  const token = args?.token;
  if (!token) {
    throw makeError("Missing OAuth token.", 0, "AUTH_ERROR");
  }

  const fetchImpl = args.fetchImpl || fetch;
  const timeoutMs = Number(args.timeoutMs) > 0 ? Number(args.timeoutMs) : 20_000;
  const { query, limit } = buildGmailQuery(args.request || {});

  const { signal, clear } = withTimeout(timeoutMs);
  const errors = [];
  const parsedMessages = [];
  let nextPageToken;

  try {
    const listResponse = await listMessages({
      token,
      query,
      maxResults: limit,
      fetchImpl,
      signal
    });

    nextPageToken = listResponse.nextPageToken;
    const messages = listResponse.messages || [];

    for (const messageRef of messages) {
      if (signal.aborted) {
        break;
      }

      try {
        const rawMessage = await getMessage({
          token,
          id: messageRef.id,
          fetchImpl,
          signal
        });
        parsedMessages.push(parseMessage(rawMessage));
      } catch (error) {
        if (error?.name === "AbortError" || signal.aborted) {
          break;
        }
        errors.push({
          id: messageRef.id,
          status: Number(error?.status || 0) || undefined,
          message: error?.message || "Failed to fetch message."
        });
      }
    }

    if (signal.aborted) {
      errors.push({
        message: `Timed out after ${timeoutMs}ms while fetching message details.`
      });
    }

    return {
      query,
      count: parsedMessages.length,
      messages: parsedMessages,
      nextPageToken,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw makeError(`Search timed out after ${timeoutMs}ms.`, 0, "TIMEOUT_ERROR");
    }
    throw error;
  } finally {
    clear();
  }
}
