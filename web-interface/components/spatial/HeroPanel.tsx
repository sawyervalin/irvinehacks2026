"use client";

import { motion } from "framer-motion";

export default function HeroPanel() {
  return (
    <div className="pointer-events-auto" style={{ maxWidth: 560, position: "relative" }}>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}
      >
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#1E90FF",
            boxShadow: "0 0 8px rgba(30,144,255,0.6)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "10px",
            letterSpacing: "0.26em",
            color: "#1E90FF",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          AI Fraud Detection
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: "clamp(52px, 8vw, 96px)",
          fontWeight: 300,
          letterSpacing: "-0.025em",
          lineHeight: 0.94,
          color: "#E8EDF2",
          marginBottom: 28,
        }}
      >
        Protect<br />
        <span style={{ color: "#1E90FF" }}>the Wire.</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        style={{
          fontSize: "17px",
          fontWeight: 400,
          color: "#7A8FA6",
          letterSpacing: "-0.01em",
          marginBottom: 52,
        }}
      >
        Scan before you wire.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.05 }}
        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
      >
        <button
          style={{
            padding: "14px 28px",
            background: "#1E90FF",
            color: "#050A12",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#4DB8FF";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 4px 20px rgba(30,144,255,0.45)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#1E90FF";
            b.style.transform = "scale(1)";
            b.style.boxShadow = "none";
          }}
        >
          Secure My Closing
        </button>

        <button
          style={{
            padding: "14px 28px",
            background: "transparent",
            color: "#7A8FA6",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.02em",
            border: "1px solid rgba(30,144,255,0.22)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(30,144,255,0.55)";
            b.style.color = "#E8EDF2";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(30,144,255,0.22)";
            b.style.color = "#7A8FA6";
          }}
        >
          Install Extension
        </button>
      </motion.div>

    </div>
  );
}
