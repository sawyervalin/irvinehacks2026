import { searchEmails } from "./lib/gmailApi.js";

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        const details = chrome.runtime.lastError?.message || "No auth token returned.";
        reject(new Error(details));
        return;
      }
      resolve(token);
    });
  });
}

function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

function toUiError(error) {
  const status = Number(error?.status || 0);
  if (
    error?.code === "AUTH_ERROR" ||
    status === 401 ||
    /token|auth|permission|consent/i.test(error?.message || "")
  ) {
    return {
      code: "AUTH_ERROR",
      message: "Gmail authorization failed or expired. Click Retry Auth and try again.",
      retryable: true
    };
  }

  if (status === 429 || status >= 500) {
    return {
      code: "API_TEMPORARY_ERROR",
      message: "Gmail API is temporarily unavailable or rate-limited. Please retry.",
      retryable: true
    };
  }

  if (error?.code === "VALIDATION_ERROR") {
    return {
      code: "VALIDATION_ERROR",
      message: error.message,
      retryable: false
    };
  }

  if (error?.name === "AbortError" || error?.code === "TIMEOUT_ERROR") {
    return {
      code: "TIMEOUT_ERROR",
      message: "Search timed out after 20s. Please narrow filters and retry.",
      retryable: true
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: error?.message || "Unknown Gmail search error.",
    retryable: true
  };
}

async function handleSearch(payload) {
  let token = "";
  try {
    token = await getAuthToken(true);
    const data = await searchEmails({
      token,
      request: payload,
      timeoutMs: 20_000
    });
    return { ok: true, data };
  } catch (error) {
    if (token) {
      const status = Number(error?.status || 0);
      if (status === 401 || /token|auth/i.test(error?.message || "")) {
        await removeCachedToken(token);
      }
    }
    return { ok: false, error: toUiError(error) };
  }
}

async function handleRetryAuth() {
  try {
    const token = await getAuthToken(true);
    await removeCachedToken(token);
    await getAuthToken(true);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUiError({ ...error, code: "AUTH_ERROR" }) };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SEARCH_EMAILS") {
    handleSearch(message.payload).then(sendResponse);
    return true;
  }

  if (message?.type === "RETRY_AUTH") {
    handleRetryAuth().then(sendResponse);
    return true;
  }

  sendResponse({
    ok: false,
    error: { code: "UNKNOWN_MESSAGE", message: "Unsupported message type.", retryable: false }
  });
  return false;
});
