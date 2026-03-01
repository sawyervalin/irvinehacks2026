"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * Boot animation — WebGL loader fusion.
 * Timeline:
 *   0.00 – 0.60s  three sonar ping rings emanate from shield center
 *   0.15 – 1.00s  shield outline draws (pathLength 0→1)
 *   0.87 – 1.19s  scan line draws
 *   0.97s          label fades in
 *   1.05s          center dot + glow ring appear
 *   1.30s          state flips → AnimatePresence exit begins
 *   1.30 – 1.75s  overlay fades out + slight scale
 */
export default function BootOverlay() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(false), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background:
              "radial-gradient(circle at center, #ffffff 0%, #eef1f6 45%, #d4dde9 75%, #b8c6d6 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            pointerEvents: "none",
          }}
        >
          {/* ── Corner brackets ── */}
          {(
            [
              { style: { top: 32, left: 32 },     d: "M0 16 L0 0 L16 0" },
              { style: { top: 32, right: 32 },    d: "M20 16 L20 0 L4 0" },
              { style: { bottom: 32, left: 32 },  d: "M0 4 L0 20 L16 20" },
              { style: { bottom: 32, right: 32 }, d: "M20 4 L20 20 L4 20" },
            ] as const
          ).map(({ style, d }, i) => (
            <motion.svg
              key={i}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              style={{ position: "absolute", ...style }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.22 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
            >
              <path
                d={d}
                fill="none"
                stroke="#1C4C70"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          ))}

          {/* ── Central shield SVG ── */}
          <svg
            width="92"
            height="100"
            viewBox="0 0 92 100"
            style={{ overflow: "visible" }}
          >
            {/* ── Sonar ping rings — scale 0→1, fade 0.5→0, staggered ── */}
            {[0, 1, 2].map(i => (
              <motion.g
                key={`ping-${i}`}
                style={{ transformOrigin: "46px 50px" }}
                initial={{ scale: 0, opacity: 0.55 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{
                  delay: i * 0.12,
                  duration: 0.62,
                  ease: "easeOut",
                }}
              >
                <circle
                  cx="46"
                  cy="50"
                  r="58"
                  fill="none"
                  stroke="#1C4C70"
                  strokeWidth={0.8 - i * 0.18}
                />
              </motion.g>
            ))}

            {/* Shield outline — draws after first ping */}
            <motion.path
              d="M46 4 L86 20 L86 52 C86 74 46 96 46 96 C46 96 6 74 6 52 L6 20 Z"
              fill="none"
              stroke="#1C4C70"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.55 }}
              animate={{ pathLength: 1, opacity: 0.62 }}
              transition={{ delay: 0.15, duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
            />

            {/* Horizontal scan line */}
            <motion.path
              d="M16 50 L76 50"
              fill="none"
              stroke="#4B7BA7"
              strokeWidth="0.9"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.38 }}
              transition={{ delay: 0.87, duration: 0.32, ease: "easeOut" }}
            />

            {/* Center dot */}
            <motion.circle
              cx="46"
              cy="50"
              r="3"
              fill="#1C4C70"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.72 }}
              transition={{ delay: 1.05, duration: 0.22 }}
              style={{ transformOrigin: "46px 50px" }}
            />

            {/* Faint outer glow ring */}
            <motion.circle
              cx="46"
              cy="50"
              r="8"
              fill="none"
              stroke="#1C4C70"
              strokeWidth="0.6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.14 }}
              transition={{ delay: 1.05, duration: 0.35 }}
              style={{ transformOrigin: "46px 50px" }}
            />
          </svg>

          {/* ── Status label ── */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.42, y: 0 }}
            transition={{ delay: 0.97, duration: 0.32 }}
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "9px",
              letterSpacing: "0.34em",
              color: "#1C4C70",
              textTransform: "uppercase",
            }}
          >
            Initializing AI Engine
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
