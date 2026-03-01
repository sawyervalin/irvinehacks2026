"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";
import DashboardShell from "./components/DashboardShell";

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

    const ingestText = latest?.hasData
        ? `Latest Gmail ingestion: ${latest.ingestedCount} emails`
        : "No ingestions yet";

    const ingestTime = latest?.ingestedAt
        ? `Ingested at ${new Date(latest.ingestedAt).toLocaleString()}`
        : "Ingestion timestamp unavailable";

  return (
    <DashboardShell
      statusText={status === "No ingestions yet." ? undefined : status}
      primaryLabel={isProcessing ? "Checking..." : "Check for threats!"}
      onPrimaryAction={() => {
        void handleProcess();
      }}
      primaryDisabled={isProcessing}
    >
      <div className={styles.grid}>
        <article className={`${styles.card} ${styles.chromeCard}`}>
          <h2 className={styles.cardTitle}>From Chrome Extension</h2>
          <div className={styles.infoBox}>
            <p className={styles.infoPrimary}>{ingestText}</p>
            <p className={styles.infoSecondary}>{ingestTime}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchLatest()}
            disabled={isRefreshing}
            className={styles.softButton}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Manual Data entry</h2>
          <textarea
            value={manualData}
            onChange={(event) => setManualData(event.target.value)}
            placeholder='Paste JSON email data here, e.g. {"messages":[...]}'
            rows={8}
            className={styles.textArea}
          />
          <button
            type="button"
            onClick={() => void handleManualProcess()}
            disabled={isManualProcessing}
            className={styles.softButton}
          >
            {isManualProcessing ? "Processing..." : "Process Manual Data"}
          </button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Upload PDF</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setSelectedPdf(nextFile);
            }}
            className={styles.fileInput}
          />
          <button
            type="button"
            onClick={() => void handlePdfProcess()}
            disabled={isPdfProcessing}
            className={styles.softButton}
          >
            {isPdfProcessing ? "Uploading..." : "Upload"}
          </button>
        </article>
      </div>
    </DashboardShell>
  );
}
