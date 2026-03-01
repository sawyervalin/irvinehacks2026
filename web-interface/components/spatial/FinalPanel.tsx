"use client";

import { motion } from "framer-motion";

export default function FinalPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto"
      style={{ textAlign: "center", maxWidth: 680 }}
    >
      {/* Thin horizontal rule */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 40 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{
          height: 1,
          background: "rgba(14,116,144,0.2)",
          margin: "0 auto 56px",
        }}
      />

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 1 }}
        style={{
          fontSize: "clamp(40px, 7vw, 80px)",
          fontWeight: 100,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: "#0C2340",
          marginBottom: 20,
        }}
      >
        You don't get<br />a second closing.
      </motion.h2>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.9 }}
        style={{
          fontSize: "18px",
          fontWeight: 300,
          color: "#475569",
          marginBottom: 56,
          letterSpacing: "0.02em",
        }}
      >
        Protect this one.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.7 }}
      >
        <button
          style={{
            padding: "16px 36px",
            background: "#F97316",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#EA580C";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 8px 32px rgba(249,115,22,0.4)";
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
      </motion.div>

      {/* Footer wordmark */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1, duration: 1.2 }}
        style={{
          marginTop: 96,
          fontFamily: "var(--font-geist-mono)",
          fontSize: "9px",
          letterSpacing: "0.32em",
          color: "rgba(71,85,105,0.4)",
          textTransform: "uppercase",
        }}
      >
        HomeGuard AI &mdash; IrvineHacks 2026
      </motion.div>
    </motion.div>
  );
}
