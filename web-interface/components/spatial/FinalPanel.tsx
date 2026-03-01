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
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 40 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{
          height: 1,
          background: "rgba(30,144,255,0.18)",
          margin: "0 auto 48px",
        }}
      />

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 1 }}
        style={{
          fontSize: "clamp(40px, 7vw, 80px)",
          fontWeight: 300,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          color: "#E8EDF2",
          marginBottom: 20,
        }}
      >
        You don't get<br />a second closing.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.9 }}
        style={{
          fontSize: "17px",
          fontWeight: 400,
          color: "#7A8FA6",
          marginBottom: 48,
          letterSpacing: "-0.01em",
        }}
      >
        Protect this one.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.7 }}
      >
        <button
          style={{
            padding: "16px 36px",
            background: "#1E90FF",
            color: "#050A12",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#4DB8FF";
            b.style.transform = "scale(1.02)";
            b.style.boxShadow = "0 8px 28px rgba(30,144,255,0.4)";
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1, duration: 1.2 }}
        style={{
          marginTop: 80,
          fontFamily: "var(--font-geist-mono)",
          fontSize: "9px",
          letterSpacing: "0.3em",
          color: "rgba(122,143,166,0.30)",
          textTransform: "uppercase",
        }}
      >
        HomeGuard AI &mdash; IrvineHacks 2026
      </motion.div>
    </motion.div>
  );
}
