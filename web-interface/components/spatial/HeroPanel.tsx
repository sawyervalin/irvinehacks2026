"use client";

import { motion } from "framer-motion";

export default function HeroPanel() {
  return (
    <div className="pointer-events-auto" style={{ maxWidth: 560, position: "relative" }}>

      {/* White glass backing — keeps text crisp over the 3D scene */}
      <div
        style={{
          position: "absolute",
          inset: "-40px -20px -40px -60px",
          background: "radial-gradient(ellipse 100% 90% at 20% 50%, rgba(255,255,255,0.72) 0%, transparent 72%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

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
            background: "#F97316",
            boxShadow: "0 0 8px rgba(249,115,22,0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "10px",
            letterSpacing: "0.28em",
            color: "#F97316",
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
          fontWeight: 100,
          letterSpacing: "-0.02em",
          lineHeight: 0.92,
          color: "#0C2340",
          marginBottom: 28,
        }}
      >
        Protect<br />
        Your First<br />
        <span style={{ color: "#0EA5E9" }}>Home.</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        style={{
          fontSize: "18px",
          fontWeight: 300,
          color: "#475569",
          letterSpacing: "0.04em",
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
            background: "#F97316",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#EA580C";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 4px 24px rgba(249,115,22,0.45)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#F97316";
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
            color: "#0E7490",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.06em",
            border: "1px solid rgba(14,116,144,0.3)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(14,116,144,0.65)";
            b.style.color = "#0C2340";
            b.style.background = "rgba(14,116,144,0.05)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(14,116,144,0.3)";
            b.style.color = "#0E7490";
            b.style.background = "transparent";
          }}
        >
          Install Extension
        </button>
      </motion.div>

    </div>
  );
}
