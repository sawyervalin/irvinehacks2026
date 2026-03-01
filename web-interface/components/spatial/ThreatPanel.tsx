"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

/* ─── shared card container — matches HowPanel exactly ───────────────── */
const CARD: React.CSSProperties = {
  padding: "44px 48px",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.70) 0%, rgba(236,241,247,0.92) 100%)",
  borderRadius: "4px",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 4px 48px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.80)",
};

const MISS_ITEMS = [
  "AI can't scan emails as you read them",
  "Automated threat detection is disabled",
  "Wire scams may go completely unnoticed",
];

export default function ThreatPanel() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rawX = useTransform(scrollYProgress, [0, 1], [24, -24]);
  const rawY = useTransform(scrollYProgress, [0, 1], [16, -16]);
  const x    = useSpring(rawX, { stiffness: 60, damping: 20 });
  const y    = useSpring(rawY, { stiffness: 60, damping: 20 });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto"
        style={{ maxWidth: 360, position: "relative", x, y }}
      >
        {/* Float loop */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
        >
          <div style={CARD}>

            {/* Soft red glow — top right */}
            <div
              style={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: "rgba(199,85,85,0.05)",
                borderRadius: "50%",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            {/* Pulsing radial overlay */}
            <motion.div
              animate={{ opacity: [0.0, 0.055, 0.0], scale: [0.85, 1.1, 0.85] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at 80% 20%, rgba(199,85,85,0.18) 0%, transparent 65%)",
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
                      background: i === 1 ? "rgba(199,85,85,0.80)" : "rgba(199,85,85,0.20)",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.28em",
                  color: "rgba(199,85,85,0.70)",
                  textTransform: "uppercase",
                }}
              >
                Routing mismatch
              </span>
            </motion.div>

            {/* Headline */}
            <h2
              style={{
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "#1A2540",
                marginBottom: 20,
              }}
            >
              Wire fraud happens<br />in seconds.
            </h2>

            {/* Chrome extension context warning */}
            <p
              style={{
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "#5A6B80",
                marginBottom: 20,
              }}
            >
              Without the extension, AI can't protect you in real-time.
            </p>

            {/* Miss items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MISS_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      color: "rgba(199,85,85,0.55)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ×
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#5A6B80",
                      lineHeight: 1.4,
                    }}
                  >
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 48 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{ height: 1, background: "rgba(199,85,85,0.22)", marginTop: 36 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
