"use client";

import { motion } from "framer-motion";

export default function ThreatPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto"
      style={{ maxWidth: 360, position: "relative" }}
    >
      {/* White glass panel */}
      <div
        style={{
          padding: "44px 48px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(239,68,68,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: "rgba(239,68,68,0.08)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Routing mismatch indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
            {[20, 32, 14, 26, 10].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: h }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + i * 0.07, duration: 0.4 }}
                style={{
                  width: 3,
                  background: i === 1 ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.25)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "rgba(239,68,68,0.65)",
              textTransform: "uppercase",
            }}
          >
            Routing mismatch
          </span>
        </motion.div>

        {/* Main copy */}
        <h2
          style={{
            fontSize: "clamp(22px, 3vw, 30px)",
            fontWeight: 200,
            lineHeight: 1.25,
            color: "#0C2340",
            marginBottom: 16,
          }}
        >
          Wire fraud happens<br />in seconds.
        </h2>
        <p
          style={{
            fontSize: "clamp(17px, 2.2vw, 20px)",
            fontWeight: 300,
            lineHeight: 1.4,
            color: "#475569",
          }}
        >
          Recovery almost<br />never does.
        </p>

        {/* Red accent line */}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: 48 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ height: 1, background: "rgba(239,68,68,0.4)", marginTop: 36 }}
        />
      </div>
    </motion.div>
  );
}
