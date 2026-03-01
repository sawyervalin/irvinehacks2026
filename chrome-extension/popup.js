import { sanitizeForJsonExport } from "./lib/jsonSanitizer.js";

const form = document.getElementById("search-form");
const senderInput = document.getElementById("senderEmail");
const keywordsInput = document.getElementById("keywords");
const senderDomainInput = document.getElementById("senderDomain");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const resultSummaryEl = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadBtn");
const retryBtn = document.getElementById("retryBtn");
const searchBtn = document.getElementById("searchBtn");

let lastResponse = null;
let isBusy = false;

function setBusy(busy) {
  isBusy = busy;
  senderInput.disabled = busy;
  keywordsInput.disabled = busy;
  senderDomainInput.disabled = busy;
  searchBtn.disabled = busy;
  retryBtn.disabled = busy;
}

function setStatus(message, tone = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}

function showResults(response) {
  resultSummaryEl.textContent = `Matched ${response.count} emails for query: ${response.query}`;
  resultsEl.classList.remove("hidden");
  downloadBtn.disabled = false;
}

function hideResults() {
  resultsEl.classList.add("hidden");
  downloadBtn.disabled = true;
}

function setRetryVisible(visible) {
  retryBtn.classList.toggle("hidden", !visible);
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          error: {
            code: "RUNTIME_ERROR",
            message: chrome.runtime.lastError.message,
            retryable: true
          }
        });
        return;
      }
      resolve(response);
    });
  });
}

function downloadJson(data) {
  const sanitized = sanitizeForJsonExport(data);
  const json = JSON.stringify(sanitized, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `gmail-search-results-${date}.json`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isBusy) {
    return;
  }

  const senderEmail = senderInput.value.trim();
  const keywords = keywordsInput.value.trim();
  const senderDomain = senderDomainInput.value.trim();

  if (!senderEmail && !keywords && !senderDomain) {
    hideResults();
    setRetryVisible(false);
    setStatus("Enter sender email, sender domain, keywords, or any combination.", "error");
    return;
  }

  setBusy(true);
  hideResults();
  setRetryVisible(false);
  setStatus("Searching Gmail...");

  const response = await sendMessage({
    type: "SEARCH_EMAILS",
    payload: {
      senderEmail,
      senderDomain,
      keywords,
      limit: 50
    }
  });

  setBusy(false);

  if (!response?.ok) {
    const errorMessage = response?.error?.message || "Unknown error while searching Gmail.";
    const showRetry = response?.error?.code === "AUTH_ERROR" || response?.error?.retryable;
    setRetryVisible(Boolean(showRetry));
    setStatus(errorMessage, "error");
    return;
  }

  lastResponse = response.data;
  showResults(response.data);

  const errorCount = response.data.errors?.length || 0;
  if (errorCount > 0) {
    setStatus(
      `Search completed with ${errorCount} partial fetch errors. You can still download results.`,
      "error"
    );
  } else {
    setStatus("Search completed successfully.", "success");
  }
});

retryBtn.addEventListener("click", async () => {
  if (isBusy) {
    return;
  }
  setBusy(true);
  setStatus("Refreshing Gmail authorization...");

  const response = await sendMessage({ type: "RETRY_AUTH" });
  setBusy(false);

  if (!response?.ok) {
    setStatus(response?.error?.message || "Authorization failed.", "error");
    return;
  }

  setRetryVisible(false);
  setStatus("Authorization refreshed. Run search again.", "success");
});

downloadBtn.addEventListener("click", () => {
  if (!lastResponse) {
    return;
  }
  downloadJson(lastResponse);
});
