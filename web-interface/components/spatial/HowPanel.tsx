"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

/* ─── shared card container — matches ThreatPanel exactly ────────────── */
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

const STEPS = [
  {
    label: "Install",
    sub:   "Add the Chrome extension in 30 seconds",
  },
  {
    label: "Analyze",
    sub:   "AI scans emails, PDFs & wire instructions live",
  },
  {
    label: "Protect",
    sub:   "Get instant risk scores before you transfer",
  },
] as const;

export default function HowPanel() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Opposing x-direction vs ThreatPanel
  const rawX = useTransform(scrollYProgress, [0, 1], [-24, 24]);
  const rawY = useTransform(scrollYProgress, [0, 1], [20, -12]);
  const x    = useSpring(rawX, { stiffness: 60, damping: 20 });
  const y    = useSpring(rawY, { stiffness: 60, damping: 20 });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto"
        style={{ maxWidth: 320, x, y }}
      >
        {/* Float loop — offset phase from ThreatPanel */}
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 6.2, ease: "easeInOut", repeat: Infinity, delay: 1.2 }}
        >
          <div style={CARD}>

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

            {/* Pulsing radial overlay */}
            <motion.div
              animate={{ opacity: [0.0, 0.05, 0.0], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at 20% 80%, rgba(28,76,112,0.20) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* Section label */}
            <div
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "9px",
                letterSpacing: "0.28em",
                color: "#1C4C70",
                textTransform: "uppercase",
                marginBottom: 8,
                opacity: 0.80,
              }}
            >
              Install to enable
            </div>

            {/* Sub-label */}
            <div
              style={{
                fontSize: "11px",
                color: "#5A6B80",
                marginBottom: 36,
                lineHeight: 1.4,
              }}
            >
              AI-driven contract verification and live risk scoring for every wire transfer.
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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
                        fontWeight: 400,
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
                        fontWeight: 500,
                        color: "#5A6B80",
                      }}
                    >
                      {step.sub}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom bar */}
            <div
              style={{
                marginTop: 40,
                paddingTop: 28,
                borderTop: "1px solid rgba(28,76,112,0.07)",
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
                Live monitoring active.
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(28,76,112,0.08)", overflow: "hidden" }}>
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
      </motion.div>
    </div>
  );
}
