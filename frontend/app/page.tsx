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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/gmail-ingest/process", { method: "POST" });
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
      setIsProcessing(false);
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
      </section>
    </main>
  );
}
