"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const START  = 12847;
const TARGET = 12879;

export default function DataField() {
  const [count, setCount] = useState(START);

  useEffect(() => {
    // Fast count-up to TARGET over ~1.5s, then slow live increments
    let current = START;
    let slowId: ReturnType<typeof setInterval> | null = null;

    const fastId = setInterval(() => {
      current = Math.min(current + 1, TARGET);
      setCount(current);
      if (current >= TARGET) {
        clearInterval(fastId);
        // +1 every ~18 seconds to simulate live installs
        slowId = setInterval(() => setCount(c => c + 1), 18000);
      }
    }, 47);

    return () => {
      clearInterval(fastId);
      if (slowId) clearInterval(slowId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.9 }} // appears after boot overlay fades
      style={{
        position: "fixed",
        bottom: 48,
        right: 56,
        zIndex: 15,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "linear-gradient(145deg, rgba(255,255,255,0.70) 0%, rgba(236,241,247,0.92) 100%)",
        borderRadius: "4px",
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 4px 48px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.80)",
        pointerEvents: "auto",
      }}
    >
      {/* ── Orbital SVG ── */}
      <svg width="88" height="88" viewBox="0 0 88 88">
        <defs>
          <linearGradient id="df-sweep" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1C4C70" stopOpacity="0" />
            <stop offset="100%" stopColor="#1C4C70" stopOpacity="0.75" />
          </linearGradient>
          <filter id="df-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static rings */}
        <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(28,76,112,0.10)" strokeWidth="0.7" strokeDasharray="3 6" />
        <circle cx="44" cy="44" r="30" fill="none" stroke="rgba(28,76,112,0.07)" strokeWidth="0.5" />
        <circle cx="44" cy="44" r="18" fill="none" stroke="rgba(28,76,112,0.06)" strokeWidth="0.5" />

        {/* Outer orbit — large dot, slow */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "44px 44px" }}
        >
          <circle cx="44" cy="4" r="3" fill="#1C4C70" opacity="0.65" filter="url(#df-glow)" />
          <circle cx="44" cy="84" r="1.8" fill="#4B7BA7" opacity="0.28" />
        </motion.g>

        {/* Mid orbit — counter-clockwise */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "44px 44px" }}
        >
          <circle cx="74" cy="44" r="2.5" fill="#1C4C70" opacity="0.50" filter="url(#df-glow)" />
        </motion.g>

        {/* Inner orbit — fast */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "44px 44px" }}
        >
          <circle cx="44" cy="26" r="2" fill="#4B7BA7" opacity="0.55" filter="url(#df-glow)" />
        </motion.g>

        {/* Scanner sweep line */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "44px 44px" }}
        >
          <line
            x1="44" y1="44" x2="44" y2="4"
            stroke="url(#df-sweep)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Center node */}
        <circle cx="44" cy="44" r="2.8" fill="#1C4C70" opacity="0.65" filter="url(#df-glow)" />
      </svg>

      {/* ── Counter ── */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "17px",
            fontWeight: 400,
            color: "#1A2540",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {count.toLocaleString()}
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "7.5px",
            letterSpacing: "0.20em",
            color: "#5A6B80",
            textTransform: "uppercase",
            marginTop: 7,
            opacity: 0.72,
          }}
        >
          downloading now
        </div>
      </div>

      {/* ── Live indicator ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingTop: 2,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#7AA85C",
            boxShadow: "0 0 6px rgba(122,168,92,0.45)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "7.5px",
            letterSpacing: "0.22em",
            color: "#7AA85C",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Live
        </span>
      </div>
    </motion.div>
  );
}
