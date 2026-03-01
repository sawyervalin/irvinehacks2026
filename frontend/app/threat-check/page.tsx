"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../page.module.css";
import DashboardShell from "../components/DashboardShell";

interface LatestIngestResponse {
    ok: boolean;
    hasData: boolean;
    ingestedCount: number;
    ingestedAt: string | null;
    batchId: string | null;
}

// ── Analyzing overlay ──────────────────────────────────────────────────────────

const ANALYSIS_MESSAGES = [
  "Verifying bank routing numbers…",
  "Scanning for email domain spoofing…",
  "Detecting hidden characters in instructions…",
  "Checking for escrow name mismatches…",
  "Analyzing urgency-based language…",
  "Cross-referencing known fraud patterns…",
];

function AnalyzingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % ANALYSIS_MESSAGES.length),
      2500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        gap: 24,
        padding: "40px 20px",
      }}
    >
      {/* Rotating cog */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ color: "#1C4C70", opacity: 0.78, flexShrink: 0 }}
      >
        <svg width="108" height="108" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58
            c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96
            c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84
            c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33
            c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58
            C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58
            c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96
            c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84
            c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96
            c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z
            M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
          />
        </svg>
      </motion.div>

      {/* Static tagline */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          color: "#5A6B80",
          opacity: 0.72,
          margin: 0,
        }}
      >
        Constryke AI Engine is running
      </p>

      {/* Rotating message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 500,
            color: "#1A2540",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {ANALYSIS_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress dots — indeterminate */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.22,
            }}
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#1C4C70",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const router = useRouter();
    const [status, setStatus] = useState("Loading latest ingestion...");
    const [latest, setLatest] = useState<LatestIngestResponse | null>(null);
    const [manualData, setManualData] = useState("");
    const [senderAddress, setSenderAddress] = useState("");
    const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
    const pdfInputRef = useRef<HTMLInputElement | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const waitForThreatSummaryData = useCallback(async (): Promise<boolean> => {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            try {
                const response = await fetch(`/api/gmail-ingest/latest-result?t=${Date.now()}`, {
                    method: "GET",
                    cache: "no-store"
                });
                const data = (await response.json()) as { hasData?: boolean };
                if (Boolean(data?.hasData)) {
                    return true;
                }
            } catch {
                // Keep polling.
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return false;
    }, []);

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
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({})
                    });
                    if (response.ok) { successCount += 1; } else { failureCount += 1; }
                } catch { failureCount += 1; }
            }

            if (manualPayload) {
                try {
                    const response = await fetch("/api/gmail-ingest/process", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ payload: manualPayload })
                    });
                    if (response.ok) { successCount += 1; } else { failureCount += 1; }
                } catch { failureCount += 1; }
            }

            if (selectedPdf) {
                try {
                    const formData = new FormData();
                    formData.append("file", selectedPdf);
                    const response = await fetch("/api/gmail-ingest/process-pdf", {
                        method: "POST",
                        body: formData
                    });
                    if (response.ok) { successCount += 1; } else { failureCount += 1; }
                } catch { failureCount += 1; }
            }

            if (failureCount > 0) {
                setStatus(`Threat checks completed: ${successCount} succeeded, ${failureCount} failed.`);
            } else {
                setStatus(`Threat checks completed: ${successCount} succeeded.`);
            }

            if (successCount > 0) {
                const summaryReady = await waitForThreatSummaryData();
                if (summaryReady) {
                    setStatus("Threat checks completed. Redirecting to threat summary...");
                    router.push("/threat-summary");
                }
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
      title={isChecking ? "Analyzing Your Documents" : "Create Your Threat Check"}
      subtitle={isChecking ? undefined : "Fill out the form below to process Gmail, manual payloads, and PDF files."}
      statusText={isChecking ? undefined : (status === "No ingestions yet." ? undefined : status)}
      primaryLabel={isChecking ? undefined : "Check for threats!"}
      onPrimaryAction={isChecking ? undefined : () => { void handleCheckForThreats(); }}
      primaryDisabled={isChecking}
    >
      <AnimatePresence mode="wait">
        {isChecking ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <AnalyzingState />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
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
                  onClick={() => { pdfInputRef.current?.click(); }}
                  className={styles.softButton}
                >
                  Choose File
                </button>
              </article>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
