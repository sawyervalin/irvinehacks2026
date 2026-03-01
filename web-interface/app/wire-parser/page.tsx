"use client";

import { useState, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScalarField {
  raw: string | number | null;
  normalized: string | number | null;
  confidence: number;
  is_checksum_valid?: boolean;
}

interface ArrayField {
  raw: string[];
  normalized: string[];
  confidence: number;
}

type AnyField = ScalarField | ArrayField;

interface BankVerification {
  looked_up_bank: string | null;
  extracted_bank: string | null;
  match: boolean | null;
  status: "found" | "not_found" | "invalid_format" | "skipped";
}

interface ParseResult {
  document_text_snippet?: string;
  extracted_fields?: Record<string, AnyField>;
  bank_name_verification?: BankVerification;
  parsing_errors?: string[];
  version?: string;
  error?: string;
}

// ── Field display config ──────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  document_type:       "Document Type",
  title_company_name:  "Title Company",
  escrow_officer_name: "Escrow Officer",
  sender_email:        "Sender Email",
  sender_domain:       "Sender Domain",
  receiving_bank_name: "Receiving Bank",
  routing_number:      "Routing Number",
  account_number:      "Account Number",
  wire_amount:         "Wire Amount",
  phone_numbers:       "Phone Numbers",
  property_address:    "Property Address",
  closing_date:        "Closing Date",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNormalized(field: AnyField): string {
  if ("normalized" in field && Array.isArray((field as ArrayField).normalized)) {
    const arr = (field as ArrayField).normalized;
    if (arr.length === 0) return "—";
    return arr.join(", ");
  }
  const val = (field as ScalarField).normalized;
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") return `$${val.toLocaleString()}`;
  return String(val);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldRow({ label, field }: { label: string; field: AnyField }) {
  const value = formatNormalized(field);
  const isRouting = label === "Routing Number";
  const checksumValid = isRouting && (field as ScalarField).is_checksum_valid;

  if (value === "—") return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        alignItems: "start",
        gap: "0.75rem",
        padding: "0.65rem 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          color: "#111827",
          fontWeight: 600,
          wordBreak: "break-all",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {value}
        {isRouting && (
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "0.1rem 0.45rem",
              borderRadius: "9999px",
              background: checksumValid ? "#dcfce7" : "#fee2e2",
              color: checksumValid ? "#15803d" : "#b91c1c",
            }}
          >
            {checksumValid ? "ABA ✓" : "ABA ✗"}
          </span>
        )}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2.5px solid #e5e7eb",
          borderTopColor: "#4f46e5",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
        Running parser…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WireParserPage() {
  const [fileName, setFileName]   = useState("");
  const [manualText, setManualText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ParseResult | null>(null);
  const [apiError, setApiError]   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run the Python parser when a PDF is selected.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setApiError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
      const data: ParseResult = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Parser returned an error.");
      } else {
        setResult(data);
      }
    } catch {
      setApiError("Could not reach the server. Make sure the dev server is running.");
    } finally {
      setLoading(false);
    }
  };

  const fields = result?.extracted_fields ?? {};
  const hasFields = FIELD_ORDER.some((k) => fields[k]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 0.3rem", letterSpacing: "-0.01em" }}>
            KeyReady Wire Instruction Parser
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
            Upload a wire instruction PDF to extract and verify its key fields.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
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

          {/* Textarea (display-only — no Python call for raw text) */}
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", color: "#111827", marginBottom: "0.5rem" }}>
              Paste Wire Instruction Text{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: "0.8rem" }}>(for reference only)</span>
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the full text of your wire instruction document here…"
              rows={6}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.83rem",
                color: "#374151",
                lineHeight: "1.6",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Loading */}
          {loading && <Spinner />}

          {/* API error */}
          {apiError && (
            <p style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "0.6rem 0.875rem" }}>
              {apiError}
            </p>
          )}
        </div>

        {/* ── Results ── */}
        {result && !loading && (
          <div>
            {/* Parsing errors from Python */}
            {result.parsing_errors && result.parsing_errors.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#991b1b", margin: "0 0 0.4rem" }}>
                  Parser warnings
                </p>
                {result.parsing_errors.map((e, i) => (
                  <p key={i} style={{ margin: "0.2rem 0", fontSize: "0.8rem", color: "#b91c1c" }}>{e}</p>
                ))}
              </div>
            )}

            {/* Extracted fields */}
            {hasFields && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  overflow: "hidden",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
                    Extracted Fields
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {fileName}
                  </span>
                </div>
                <div style={{ padding: "0.25rem 1.5rem 0.75rem" }}>
                  {FIELD_ORDER.map((key) => {
                    const field = fields[key];
                    if (!field) return null;
                    return (
                      <FieldRow
                        key={key}
                        label={FIELD_LABELS[key]}
                        field={field}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bank name verification */}
            {result.bank_name_verification &&
              result.bank_name_verification.status !== "skipped" && (() => {
                const bv = result.bank_name_verification!;
                const isMatch   = bv.match === true;
                const isMiss    = bv.match === false;
                const unknown   = bv.match === null;
                const borderColor = isMatch ? "#16a34a" : isMiss ? "#dc2626" : "#d97706";
                const bgColor     = isMatch ? "#f0fdf4"  : isMiss ? "#fef2f2"  : "#fffbeb";
                const label       = isMatch ? "✓ Match"  : isMiss ? "✗ Mismatch" : "—";
                const labelColor  = isMatch ? "#15803d"  : isMiss ? "#b91c1c"    : "#92400e";

                return (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                      overflow: "hidden",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        borderBottom: "1px solid #f1f5f9",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#111827",
                      }}
                    >
                      Bank Name Verification
                    </div>
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        background: bgColor,
                        borderLeft: `4px solid ${borderColor}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
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
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: labelColor,
                            }}
                          >
                            {label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Document text snippet */}
            {result.document_text_snippet && (
              <details
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "0.875rem 1.25rem",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    userSelect: "none",
                  }}
                >
                  Document text snippet
                </summary>
                <pre
                  style={{
                    margin: 0,
                    padding: "1rem 1.25rem 1.25rem",
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    background: "#f8fafc",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: "1.7",
                    fontFamily: "ui-monospace, monospace",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
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
