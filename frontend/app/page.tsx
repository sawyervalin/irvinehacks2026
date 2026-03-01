"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    const [senderAddress, setSenderAddress] = useState("");
    const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
    const pdfInputRef = useRef<HTMLInputElement | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

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

    const handleCheckForThreats = async () => {
        let manualPayload: Record<string, unknown> | null = null;
        const hasManualInput = manualData.trim().length > 0;

        if (hasManualInput) {
            let parsed: unknown;
            try {
                parsed = JSON.parse(manualData);
            } catch {
                setStatus("Manual data must be valid JSON before running checks.");
                return;
            }

            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                setStatus("Manual data must be a JSON object before running checks.");
                return;
            }

            const senderAddressValue = senderAddress.trim();
            if (!senderAddressValue) {
                setStatus("Email sender address is required when manual data is provided.");
                return;
            }

            manualPayload = {
                ...(parsed as Record<string, unknown>),
                senderAddress: senderAddressValue
            };
        }

        const hasExtensionData = Boolean(latest?.hasData);
        const hasPdfData = Boolean(selectedPdf);

        if (!hasExtensionData && !manualPayload && !hasPdfData) {
            setStatus("No data available to check. Add extension, manual, or PDF input first.");
            return;
        }

        setIsChecking(true);

        let successCount = 0;
        let failureCount = 0;

        try {
            if (hasExtensionData) {
                try {
                    const response = await fetch("/api/gmail-ingest/process", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({})
                    });
                    if (response.ok) {
                        successCount += 1;
                    } else {
                        failureCount += 1;
                    }
                } catch {
                    failureCount += 1;
                }
            }

            if (manualPayload) {
                try {
                    const response = await fetch("/api/gmail-ingest/process", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ payload: manualPayload })
                    });
                    if (response.ok) {
                        successCount += 1;
                    } else {
                        failureCount += 1;
                    }
                } catch {
                    failureCount += 1;
                }
            }

            if (selectedPdf) {
                try {
                    const formData = new FormData();
                    formData.append("file", selectedPdf);
                    const response = await fetch("/api/gmail-ingest/process-pdf", {
                        method: "POST",
                        body: formData
                    });
                    if (response.ok) {
                        successCount += 1;
                    } else {
                        failureCount += 1;
                    }
                } catch {
                    failureCount += 1;
                }
            }

            if (failureCount > 0) {
                setStatus(`Threat checks completed: ${successCount} succeeded, ${failureCount} failed.`);
            } else {
                setStatus(`Threat checks completed: ${successCount} succeeded.`);
            }
        } finally {
            setIsChecking(false);
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
      title="Create Your Threat Check"
      subtitle="Fill out the form below to process Gmail, manual payloads, and PDF files."
      statusText={status === "No ingestions yet." ? undefined : status}
      primaryLabel={isChecking ? "Checking..." : "Check for threats!"}
      onPrimaryAction={() => {
        void handleCheckForThreats();
      }}
      primaryDisabled={isChecking}
    >
      <div className={styles.grid}>
        <article className={styles.formCard}>
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

        <article className={styles.formCard}>
          <h2 className={styles.cardTitle}>Manual Data entry</h2>
          <label className={styles.fieldLabel}>Paste email data</label>
          <textarea
            value={manualData}
            onChange={(event) => setManualData(event.target.value)}
            placeholder='Paste email data here'
            rows={8}
            className={styles.textArea}
          />
          <label htmlFor="senderAddress" className={styles.fieldLabel}>
            Email sender address *
          </label>
          <input
            id="senderAddress"
            type="email"
            value={senderAddress}
            onChange={(event) => setSenderAddress(event.target.value)}
            placeholder="sender@example.com"
            className={styles.manualFieldInput}
          />
        </article>

        <article className={styles.formCard}>
          <h2 className={styles.cardTitle}>Upload PDF</h2>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setSelectedPdf(nextFile);
              if (nextFile) {
                setStatus(`PDF selected: ${nextFile.name}`);
              }
            }}
            className={styles.hiddenFileInput}
          />
          <label className={styles.fieldLabel}>Selected file</label>
          <div className={styles.fileInput}>
            {selectedPdf ? selectedPdf.name : "No file chosen"}
          </div>
          <button
            type="button"
            onClick={() => {
              pdfInputRef.current?.click();
            }}
            className={styles.softButton}
          >
            Choose File
          </button>
        </article>
      </div>
    </DashboardShell>
  );
}
