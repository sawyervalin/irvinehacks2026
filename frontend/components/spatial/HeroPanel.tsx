"use client";

import { motion } from "framer-motion";

export default function HeroPanel() {
  return (
    <div className="pointer-events-auto" style={{ maxWidth: 560, position: "relative", paddingRight: "clamp(16px, 4vw, 48px)" }}>

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
            background: "#1C4C70",
            boxShadow: "0 0 8px rgba(28,76,112,0.4)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "10px",
            letterSpacing: "0.26em",
            color: "#1C4C70",
            textTransform: "uppercase",
            opacity: 0.90,
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
          fontWeight: 400,
          letterSpacing: "-0.025em",
          lineHeight: 0.94,
          color: "#1A2540",
          marginBottom: 28,
        }}
      >
        Protect<br />
        <span style={{ color: "#1C4C70" }}>the Wire.</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        style={{
          fontSize: "17px",
          fontWeight: 500,
          color: "#5A6B80",
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
            background: "#1C4C70",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#4B7BA7";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 4px 20px rgba(28,76,112,0.30)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#1C4C70";
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
            color: "#5A6B80",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.02em",
            border: "1px solid rgba(28,76,112,0.20)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(28,76,112,0.40)";
            b.style.color = "#1A2540";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(28,76,112,0.20)";
            b.style.color = "#5A6B80";
          }}
        >
          Install Extension
        </button>
      </motion.div>

    </div>
  );
}
