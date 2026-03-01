"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "Scan",    sub: "Wire instructions, emails, PDFs" },
  { label: "Analyze", sub: "Routing, domains, pressure language" },
  { label: "Verify",  sub: "Get your risk score" },
] as const;

export default function HowPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto"
      style={{ maxWidth: 320 }}
    >
      <div
        style={{
          padding: "44px 48px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(248, 249, 251, 0.92)",
          border: "1px solid rgba(28,76,112,0.10)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 2px 40px rgba(0,0,0,0.06)",
        }}
      >
        {/* Soft blue glow — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -50,
            left: -50,
            width: 180,
            height: 180,
            background: "rgba(28,76,112,0.04)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "9px",
            letterSpacing: "0.28em",
            color: "#1C4C70",
            textTransform: "uppercase",
            marginBottom: 40,
            opacity: 0.80,
          }}
        >
          How it works
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 + i * 0.18, duration: 0.7 }}
              style={{ display: "flex", alignItems: "flex-start", gap: 20 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "10px",
                  color: "rgba(28,76,112,0.35)",
                  marginTop: 4,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                0{i + 1}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "clamp(20px, 2.8vw, 26px)",
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                    color: "#1A2540",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "#5A6B80",
                    letterSpacing: "0em",
                  }}
                >
                  {step.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            marginTop: 44,
            paddingTop: 32,
            borderTop: "1px solid rgba(28,76,112,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "9px",
              letterSpacing: "0.26em",
              color: "#5A6B80",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Instant risk score.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(28,76,112,0.1)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: "0%" }}
                whileInView={{ width: "28%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 1.4, ease: "easeOut" }}
                style={{ height: "100%", background: "#7AA85C" }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "#7AA85C",
                opacity: 0.8,
              }}
            >
              CLEAR
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
