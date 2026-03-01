"use client";

import { motion } from "framer-motion";

export default function HeroPanel() {
  return (
    <div className="pointer-events-auto" style={{ maxWidth: 560, position: "relative" }}>

      {/* Warm glass backing — keeps text crisp against the 3D scene */}
      <div
        style={{
          position: "absolute",
          inset: "-40px -20px -40px -60px",
          background: "radial-gradient(ellipse 100% 90% at 20% 50%, rgba(246,244,240,0.82) 0%, transparent 72%)",
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
            background: "#4E7FA4",
            boxShadow: "0 0 6px rgba(78,127,164,0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "10px",
            letterSpacing: "0.26em",
            color: "#4E7FA4",
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
          color: "#1A1A1A",
          marginBottom: 28,
        }}
      >
        Protect<br />
        Your First<br />
        <span style={{ color: "#4E7FA4" }}>Home.</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85 }}
        style={{
          fontSize: "18px",
          fontWeight: 400,
          color: "#5C606B",
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
            background: "#4E7FA4",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.02em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#3D6E93";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 4px 20px rgba(78,127,164,0.35)";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#4E7FA4";
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
            color: "#5C606B",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.02em",
            border: "1px solid rgba(78,127,164,0.25)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(78,127,164,0.55)";
            b.style.color = "#1A1A1A";
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "rgba(78,127,164,0.25)";
            b.style.color = "#5C606B";
          }}
        >
          Install Extension
        </button>
      </motion.div>

    </div>
  );
}
