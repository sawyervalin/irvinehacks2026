"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const COLS = [
  {
    title: "Soft Evidence",
    sub: "Behavioral & linguistic",
    color: "#f59e0b",
    checks: [
      "Misspellings & grammar errors",
      "Dummy names (John Doe, etc.)",
      "Escrow officer name mismatch",
      "Non-Latin / mixed characters",
      "\"Wire immediately\" detected",
      "\"Do not call to verify\" flag",
      "AI-generated text detection",
    ],
  },
  {
    title: "Hard Evidence",
    sub: "Banking & financial",
    color: "#ef4444",
    checks: [
      "Routing number verification",
      "Federal Reserve DB query",
      "Routing ↔ bank name mismatch",
      "Foreign phone numbers",
      "Foreign banking identifiers",
      "Account format validation",
      "Wire amount anomaly check",
    ],
  },
  {
    title: "Domain Verification",
    sub: "Online identity",
    color: "#10b981",
    checks: [
      "Domain age check",
      "Lookalike domain detection",
      "MX record validation",
      "Known scam domain database",
      "LinkedIn presence check",
      "Company review cross-reference",
      "Zero footprint = red flag",
    ],
  },
];

export default function DetectionBreakdown() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="detection" className="relative py-20 sm:py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#050b18 0%,#060d1e 100%)" }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/15 to-transparent" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8" ref={ref}>

        {/* Header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 border border-slate-500/20 text-slate-300 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            Proprietary Detection Engine
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
          >
            21 Checks.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-white">
              3 Layers.
            </span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              Zero Compromises.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-slate-400 max-w-md"
          >
            Even if something looks legitimate — if there&apos;s no digital footprint, it&apos;s a red flag.
          </motion.p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {COLS.map((col, ci) => {
            const cRef = useRef<HTMLDivElement>(null);
            const cInView = useInView(cRef, { once: true, margin: "-50px" });

            return (
              <motion.div
                key={col.title} ref={cRef}
                initial={{ opacity: 0, y: 24 }}
                animate={cInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: ci * 0.12, ease: "easeOut" }}
                className="rounded-xl p-5 border transition-all duration-300 hover:-translate-y-0.5 group"
                style={{
                  background: `${col.color}07`,
                  border: `1px solid ${col.color}20`,
                }}
              >
                {/* Title */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                  <div>
                    <div className="text-sm font-semibold text-white">{col.title}</div>
                    <div className="text-xs text-slate-500">{col.sub}</div>
                  </div>
                </div>

                <div className="h-px mb-4" style={{ background: `linear-gradient(90deg,${col.color}35,transparent)` }} />

                {/* Checks */}
                <ul className="space-y-2">
                  {col.checks.map((c, i) => (
                    <motion.li
                      key={c}
                      initial={{ opacity: 0, x: -8 }}
                      animate={cInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.35, delay: 0.2 + ci * 0.1 + i * 0.045 }}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <span className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: col.color + "18", border: `1px solid ${col.color}30` }}>
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke={col.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {c}
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-white/4 flex items-center justify-between">
                  <span className="text-xs text-slate-600">{col.checks.length} checks</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: col.color, background: col.color + "12", border: `1px solid ${col.color}22` }}>
                    ACTIVE
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Metrics strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { v: "<3s",   l: "Scan time",       c: "#3b82f6" },
            { v: "21",    l: "Detection checks", c: "#10b981" },
            { v: "99.1%", l: "Accuracy rate",    c: "#f59e0b" },
          ].map(m => (
            <div key={m.l} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <div className="text-2xl font-bold mb-0.5" style={{ color: m.c }}>{m.v}</div>
              <div className="text-xs text-slate-500">{m.l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
