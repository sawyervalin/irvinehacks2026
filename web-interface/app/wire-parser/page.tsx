"use client";

import { useState, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BankVerification {
  looked_up_bank: string | null;
  extracted_bank: string | null;
  match: boolean | null;
  status: "found" | "not_found" | "invalid_format" | "skipped";
}

interface ParseResult {
  document_text_snippet?: string;
  llm_extracted?: Record<string, unknown>;
  hackathon_schema?: Record<string, unknown>;
  bank_name_verification?: BankVerification;
  parsing_errors?: string[];
  version?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
      <div style={{
        width: "20px", height: "20px",
        border: "2.5px solid #e5e7eb", borderTopColor: "#4f46e5",
        borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
      }} />
      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
        {label ?? "Analyzing with Gemini…"}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function JsonCollapsible({ label, data }: { label: string; data: unknown }) {
  if (!data) return null;
  return (
    <details style={{
      background: "#fff", borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1rem",
    }}>
      <summary style={{
        padding: "0.875rem 1.25rem", cursor: "pointer",
        fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", userSelect: "none",
      }}>
        {label}
      </summary>
      <pre style={{
        margin: 0, padding: "1rem 1.25rem 1.25rem",
        fontSize: "0.72rem", color: "#374151", background: "#f8fafc",
        whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.7",
        fontFamily: "ui-monospace, monospace", borderTop: "1px solid #f1f5f9",
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WireParserPage() {
  const [fileName, setFileName]     = useState("");
  const [manualText, setManualText] = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<ParseResult | null>(null);
  const [apiError, setApiError]     = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function submit(body: FormData) {
    setResult(null);
    setApiError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/parse-pdf", { method: "POST", body });
      const data: ParseResult = await res.json();
      if (!res.ok) setApiError(data.error ?? "Parser returned an error.");
      else         setResult(data);
    } catch {
      setApiError("Could not reach the server. Make sure the dev server is running.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    await submit(form);
  };

  const handleTextSubmit = async () => {
    if (!manualText.trim()) return;
    setFileName("");
    const form = new FormData();
    form.append("text", manualText);
    await submit(form);
  };

  const downloadJson = () => {
    const payload = result?.hackathon_schema ?? result?.llm_extracted;
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = fileName ? `${fileName.replace(".pdf", "")}_extracted.json` : "wire_extracted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 0.3rem", letterSpacing: "-0.01em" }}>
              KeyReady Wire Instruction Parser
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
              Upload a PDF or paste text — Claude extracts and verifies all wire fields.
            </p>
          </div>
          {result?.llm_extracted && (
            <button
              onClick={downloadJson}
              style={{
                flexShrink: 0, marginLeft: "1rem",
                background: "#4f46e5", color: "#fff",
                border: "none", borderRadius: "8px",
                padding: "0.5rem 1rem", fontSize: "0.8rem",
                fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              ↓ Download JSON
            </button>
          )}
        </div>

        {/* ── Input Card ── */}
        <div style={{
          background: "#fff", borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.75rem", marginBottom: "1.5rem",
        }}>
          {/* PDF upload */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#111827", marginBottom: "0.5rem" }}>
              Upload PDF
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: "block", fontSize: "0.875rem", color: "#374151", cursor: loading ? "not-allowed" : "pointer" }}
            />
            {fileName && (
              <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#6b7280" }}>
                File: <strong style={{ color: "#374151" }}>{fileName}</strong>
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap" }}>
              or paste text directly
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          </div>

          {/* Text input */}
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#111827", marginBottom: "0.5rem" }}>
              Paste Wire Instruction Text
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the full text of your wire instruction document here…"
              rows={6}
              disabled={loading}
              style={{
                width: "100%", padding: "0.75rem 1rem",
                border: "1.5px solid #d1d5db", borderRadius: "8px",
                fontFamily: "ui-monospace, monospace", fontSize: "0.83rem",
                color: "#374151", lineHeight: "1.6", resize: "vertical",
                boxSizing: "border-box", outline: "none", transition: "border-color 0.15s",
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e)  => (e.target.style.borderColor = "#d1d5db")}
            />
            <button
              onClick={handleTextSubmit}
              disabled={loading || !manualText.trim()}
              style={{
                marginTop: "0.75rem",
                background: loading || !manualText.trim() ? "#e5e7eb" : "#4f46e5",
                color: loading || !manualText.trim() ? "#9ca3af" : "#fff",
                border: "none", borderRadius: "8px",
                padding: "0.55rem 1.25rem", fontSize: "0.875rem",
                fontWeight: 600, cursor: loading || !manualText.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              Analyze Text
            </button>
          </div>

          {loading && <Spinner />}

          {apiError && (
            <p style={{
              marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "6px", padding: "0.6rem 0.875rem",
            }}>
              {apiError}
            </p>
          )}
        </div>

        {/* ── Results ── */}
        {result && !loading && (
          <div>
            {/* Parser warnings */}
            {result.parsing_errors && result.parsing_errors.length > 0 && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1rem",
              }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#991b1b", margin: "0 0 0.4rem" }}>
                  Parser warnings
                </p>
                {result.parsing_errors.map((e, i) => (
                  <p key={i} style={{ margin: "0.2rem 0", fontSize: "0.8rem", color: "#b91c1c" }}>{e}</p>
                ))}
              </div>
            )}

            {/* Bank name verification */}
            {result.bank_name_verification &&
              result.bank_name_verification.status !== "skipped" && (() => {
                const bv = result.bank_name_verification!;
                const isMatch = bv.match === true;
                const isMiss  = bv.match === false;
                const unknown = bv.match === null;
                const borderColor = isMatch ? "#16a34a" : isMiss ? "#dc2626" : "#d97706";
                const bgColor     = isMatch ? "#f0fdf4"  : isMiss ? "#fef2f2"  : "#fffbeb";
                const label       = isMatch ? "✓ Match"  : isMiss ? "✗ Mismatch" : "—";
                const labelColor  = isMatch ? "#15803d"  : isMiss ? "#b91c1c"    : "#92400e";

                return (
                  <div style={{
                    background: "#fff", borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                    overflow: "hidden", marginBottom: "1rem",
                  }}>
                    <div style={{
                      padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9",
                      fontWeight: 700, fontSize: "0.9rem", color: "#111827",
                    }}>
                      Bank Name Verification
                    </div>
                    <div style={{
                      padding: "1rem 1.5rem", background: bgColor,
                      borderLeft: `4px solid ${borderColor}`,
                      display: "flex", flexDirection: "column", gap: "0.6rem",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>Routing number bank</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
                          {bv.looked_up_bank ?? (bv.status === "not_found" ? "Not found in database" : "—")}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>Document bank name</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
                          {bv.extracted_bank ?? "Not extracted"}
                        </span>
                      </div>
                      {!unknown && (
                        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>Result</span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: labelColor }}>{label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Risk Assessment card (wire-doc.hack.v1) */}
            {(() => {
              const hs = result.hackathon_schema as Record<string, unknown> | undefined;
              const ra = hs?.risk_assessment as {
                bucket_scores: { content: number; banking: number; domain: number };
                overall_risk_score: number;
                risk_tier: "low" | "medium" | "high" | "critical";
                triggered_rules: { id: string; bucket: string; points: number; evidence: Record<string, unknown> }[];
                recommended_actions: string[];
                text_signals?: {
                  bucket_scores: { content: number; domain: number; banking: number };
                  overall_risk_score: number;
                  risk_tier: "low" | "medium" | "high";
                  triggered_rules: { rule: string; points: number }[];
                };
              } | undefined;
              if (!ra) return null;

              const tierPalette: Record<string, { bg: string; border: string; badge: string; text: string; label: string }> = {
                low:      { bg: "#f0fdf4", border: "#16a34a", badge: "#dcfce7", text: "#15803d", label: "LOW" },
                medium:   { bg: "#fffbeb", border: "#d97706", badge: "#fef3c7", text: "#92400e", label: "MEDIUM" },
                high:     { bg: "#fff7ed", border: "#ea580c", badge: "#ffedd5", text: "#9a3412", label: "HIGH" },
                critical: { bg: "#fef2f2", border: "#dc2626", badge: "#fee2e2", text: "#991b1b", label: "CRITICAL" },
              };
              const pal = tierPalette[ra.risk_tier] ?? tierPalette.medium;

              const bucketColor = (score: number) =>
                score >= 75 ? "#dc2626" : score >= 50 ? "#ea580c" : score >= 25 ? "#d97706" : "#16a34a";

              return (
                <div style={{
                  background: "#fff", borderRadius: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  overflow: "hidden", marginBottom: "1rem",
                  borderTop: `4px solid ${pal.border}`,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
                      Fraud Risk Assessment
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
                      padding: "0.25rem 0.75rem", borderRadius: "999px",
                      background: pal.badge, color: pal.text,
                    }}>
                      {pal.label}
                    </span>
                  </div>

                  {/* Score + buckets */}
                  <div style={{ padding: "1.25rem 1.5rem", background: pal.bg }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
                      <span style={{ fontSize: "3rem", fontWeight: 800, color: pal.text, lineHeight: 1 }}>
                        {ra.overall_risk_score}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>/ 100 overall score</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {(["content", "banking", "domain"] as const).map((b) => {
                        const score = ra.bucket_scores[b];
                        const color = bucketColor(score);
                        return (
                          <div key={b} style={{ display: "grid", gridTemplateColumns: "70px 1fr 36px", gap: "0.5rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280", textTransform: "capitalize" }}>{b}</span>
                            <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                              <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.4s" }} />
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color, textAlign: "right" }}>{score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text-only signals from risk_scoring module */}
                  {ra.text_signals && ra.text_signals.triggered_rules.length > 0 && (
                    <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Text Signal Flags
                        <span style={{
                          marginLeft: "0.5rem", fontSize: "0.65rem", fontWeight: 600,
                          padding: "0.1rem 0.45rem", borderRadius: "9999px",
                          background: "#e0e7ff", color: "#4338ca",
                        }}>
                          score {ra.text_signals.overall_risk_score} · {ra.text_signals.risk_tier.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {ra.text_signals.triggered_rules.map((r, i) => (
                          <span key={i} style={{
                            fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.55rem",
                            borderRadius: "9999px", background: "#fee2e2", color: "#b91c1c",
                            display: "flex", alignItems: "center", gap: "0.3rem",
                          }}>
                            {r.rule.replace(/_/g, " ")}
                            <span style={{ opacity: 0.7 }}>+{r.points}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Triggered rules */}
                  {ra.triggered_rules.length > 0 && (
                    <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Triggered Rules
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {ra.triggered_rules.map((rule, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "flex-start", gap: "0.75rem",
                            padding: "0.5rem 0.75rem", borderRadius: "8px", background: "#f8fafc",
                          }}>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                              borderRadius: "4px", background: "#e5e7eb", color: "#374151",
                              whiteSpace: "nowrap", marginTop: "1px",
                            }}>{rule.bucket.toUpperCase()}</span>
                            <span style={{ fontSize: "0.78rem", color: "#374151", flex: 1 }}>
                              {rule.id.replace(/_/g, " ")}
                            </span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#dc2626", whiteSpace: "nowrap" }}>
                              +{rule.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended actions */}
                  <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Recommended Actions
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {ra.recommended_actions.map((action, i) => (
                        <li key={i} style={{ fontSize: "0.82rem", color: "#374151" }}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Risk Assessment JSON */}
            <JsonCollapsible
              label="Risk Assessment JSON"
              data={(result.hackathon_schema as Record<string, unknown> | undefined)?.risk_assessment}
            />

            {/* Extracted Sections JSON */}
            <JsonCollapsible
              label="Extracted Sections JSON"
              data={(result.hackathon_schema as Record<string, unknown> | undefined)?.extraction ?? result.llm_extracted}
            />

            {/* Document text snippet */}
            {result.document_text_snippet && (
              <details style={{
                background: "#fff", borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden",
              }}>
                <summary style={{
                  padding: "0.875rem 1.25rem", cursor: "pointer",
                  fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", userSelect: "none",
                }}>
                  Document text snippet
                </summary>
                <pre style={{
                  margin: 0, padding: "1rem 1.25rem 1.25rem",
                  fontSize: "0.75rem", color: "#6b7280", background: "#f8fafc",
                  whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.7",
                  fontFamily: "ui-monospace, monospace", borderTop: "1px solid #f1f5f9",
                }}>
                  {result.document_text_snippet}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
