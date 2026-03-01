"use client";

import { useCallback, useEffect, useState } from "react";

interface LatestIngestResponse {
  ok: boolean;
  hasData: boolean;
  ingestedCount: number;
  ingestedAt: string | null;
  batchId: string | null;
}

export default function HomePage() {
  const [status, setStatus] = useState("Loading latest ingestion...");
  const [latest, setLatest] = useState<LatestIngestResponse | null>(null);
  const [manualData, setManualData] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualProcessing, setIsManualProcessing] = useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  const fetchLatest = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/gmail-ingest/latest?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store"
      });
      const data = (await response.json()) as LatestIngestResponse;
      setLatest(data);
      if (!data.hasData) {
        setStatus("No ingestions yet.");
      } else {
        setStatus("Latest ingestion loaded.");
      }
    } catch {
      setStatus("Failed to load ingestion status.");
      setLatest(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleProcess = async (overridePayload?: Record<string, unknown>) => {
    if (overridePayload) {
      setIsManualProcessing(true);
    } else {
      setIsProcessing(true);
    }

    try {
      const response = await fetch("/api/gmail-ingest/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(overridePayload ? { payload: overridePayload } : {})
      });
      const data = (await response.json()) as { ok?: boolean; code?: string };
      if (!response.ok && data.code === "NO_DATA") {
        setStatus("No ingested data to process yet.");
      } else {
        setStatus("Process request sent.");
      }
    } catch {
      // Silent failure by design for backend processing in this prototype.
      setStatus("Process request sent.");
    } finally {
      if (overridePayload) {
        setIsManualProcessing(false);
      } else {
        setIsProcessing(false);
      }
    }
  };

  const handleManualProcess = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(manualData);
    } catch {
      setStatus("Manual data must be valid JSON.");
      return;
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setStatus("Manual data must be a JSON object.");
      return;
    }

    await handleProcess(parsed as Record<string, unknown>);
  };

  const handlePdfProcess = async () => {
    if (!selectedPdf) {
      setStatus("Choose a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedPdf);

    setIsPdfProcessing(true);
    try {
      const response = await fetch("/api/gmail-ingest/process-pdf", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        setStatus("Failed to submit PDF.");
      } else {
        setStatus("PDF process request sent.");
      }
    } catch {
      setStatus("PDF process request sent.");
    } finally {
      setIsPdfProcessing(false);
    }
  };

  useEffect(() => {
    void fetchLatest();
  }, [fetchLatest]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f7fb",
        padding: "24px"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "#ffffff",
          border: "1px solid #dbe3ee",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: "1.4rem", color: "#0f172a" }}>
          Gmail Ingestion Dashboard
        </h1>
        <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "0.95rem" }}>
          {status}
        </p>

        {latest?.hasData ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              marginBottom: "16px"
            }}
          >
            <p style={{ margin: "0 0 6px", color: "#0f172a", fontWeight: 600 }}>
              Latest Gmail ingestion: {latest.ingestedCount} emails
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              {latest.ingestedAt
                ? `Ingested at ${new Date(latest.ingestedAt).toLocaleString()}`
                : "Ingestion timestamp unavailable"}
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              marginBottom: "16px",
              color: "#64748b"
            }}
          >
            No ingestions yet.
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => void fetchLatest()}
            disabled={isRefreshing}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#0f766e",
              color: "#fff",
              fontWeight: 600,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.7 : 1
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => void handleProcess()}
            disabled={isProcessing}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#1d4ed8",
              color: "#fff",
              fontWeight: 600,
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? "Processing..." : "Process"}
          </button>
        </div>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0"
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#0f172a", fontWeight: 600 }}>
            Manual Email Data (JSON)
          </p>
          <textarea
            value={manualData}
            onChange={(event) => setManualData(event.target.value)}
            placeholder='Paste JSON email data here, e.g. {"messages":[...]}'
            rows={7}
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              padding: "10px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.85rem",
              boxSizing: "border-box",
              marginBottom: "10px"
            }}
          />
          <button
            type="button"
            onClick={() => void handleManualProcess()}
            disabled={isManualProcessing}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 600,
              cursor: isManualProcessing ? "not-allowed" : "pointer",
              opacity: isManualProcessing ? 0.7 : 1
            }}
          >
            {isManualProcessing ? "Processing Manual Data..." : "Process Manual Data"}
          </button>
        </div>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0"
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#0f172a", fontWeight: 600 }}>
            PDF Upload
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setSelectedPdf(nextFile);
            }}
            style={{ marginBottom: "10px", display: "block" }}
          />
          <button
            type="button"
            onClick={() => void handlePdfProcess()}
            disabled={isPdfProcessing}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#b45309",
              color: "#fff",
              fontWeight: 600,
              cursor: isPdfProcessing ? "not-allowed" : "pointer",
              opacity: isPdfProcessing ? 0.7 : 1
            }}
          >
            {isPdfProcessing ? "Processing PDF..." : "Process PDF"}
          </button>
        </div>
      </section>
    </main>
  );
}
