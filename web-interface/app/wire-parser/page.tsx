"use client";

import { useState, useRef } from "react";

// Placeholder PDF extraction: reads printable ASCII bytes from binary.
// Replace with a real pdfjs integration when available.
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let text = "";
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b >= 32 && b <= 126) text += String.fromCharCode(b);
        else if (b === 10 || b === 13) text += " ";
      }
      resolve(
        text.replace(/\s{2,}/g, " ").trim() ||
          "[No readable text extracted from PDF]"
      );
    };
    reader.onerror = () => resolve("[Failed to read PDF file]");
    reader.readAsArrayBuffer(file);
  });
}

export default function WireParserPage() {
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPdfText(await extractTextFromPDF(file));
  };

  // The active document text: manual input takes priority over PDF.
  const activeText = manualText.trim() || pdfText.trim();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 0.3rem",
              letterSpacing: "-0.01em",
            }}
          >
            KeyReady Wire Instruction Parser
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
            Upload a wire instruction PDF or paste document text to extract its
            contents.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* PDF upload */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Upload PDF
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{
                display: "block",
                fontSize: "0.875rem",
                color: "#374151",
                cursor: "pointer",
              }}
            />
            {fileName && (
              <p
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                Loaded: <strong style={{ color: "#374151" }}>{fileName}</strong>
              </p>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            <span
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              or paste directly
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          </div>

          {/* Textarea */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              Paste Wire Instruction Text{" "}
              <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: "0.8rem" }}>
                (takes priority over PDF)
              </span>
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the full text of your wire instruction document here…"
              rows={8}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
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
        </div>

        {/* ── Extracted Text Preview ── */}
        {activeText && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              overflow: "hidden",
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
              <span
                style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}
              >
                Extracted Document Text
              </span>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {activeText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "1.25rem 1.5rem",
                fontSize: "0.8rem",
                color: "#374151",
                background: "#f8fafc",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: "1.75",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {activeText}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
