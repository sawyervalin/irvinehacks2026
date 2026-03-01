"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const FACTS = [
  {
    category: "Massive Financial Impact",
    before: "In 2023, wire fraud schemes accounted for",
    highlight: "$2.9 billion",
    after: "in reported losses.",
  },
  {
    category: "High Frequency",
    before: "Roughly",
    highlight: "63%",
    after: "of U.S. companies experienced at least one wire-transfer fraud incident.",
  },
  {
    category: "High Stakes",
    before: "The average consumer wire fraud loss exceeded",
    highlight: "$100,000",
    after: "in 2022.",
  },
  {
    category: "Irreversibility",
    before: "Wire transfers are nearly impossible to trace or reverse",
    highlight: "once sent.",
    after: "",
  },
  {
    category: "Common Targets",
    before: "",
    highlight: "46%",
    after: "of title agents report at least one wire fraud attempt per month.",
  },
];

const INTERVAL_MS = 4000;

export default function DataField() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FACTS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const fact = FACTS[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.9 }}
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
        width: 228,
        boxShadow: "0 4px 48px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.80)",
        pointerEvents: "auto",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          {/* Category label */}
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "7.5px",
              letterSpacing: "0.20em",
              color: "#5A6B80",
              textTransform: "uppercase",
              marginBottom: 10,
              opacity: 0.72,
            }}
          >
            {fact.category}
          </div>

          {/* Fact body */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 400,
              color: "#5A6B80",
              lineHeight: 1.55,
            }}
          >
            {fact.before && <span>{fact.before} </span>}
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 400,
                color: "#1A2540",
                letterSpacing: "-0.02em",
              }}
            >
              {fact.highlight}
            </span>
            {fact.after && <span> {fact.after}</span>}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 5, marginTop: 14, alignItems: "center" }}>
        {FACTS.map((_, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              height: 3,
              width: i === index ? 14 : 4,
              borderRadius: 999,
              background: i === index ? "#1C4C70" : "rgba(28,76,112,0.18)",
              transition: "width 0.35s ease, background 0.35s ease",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
