"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const TABLE = [
  { who: "Title Company",    protects: "Their liability",      ok: false },
  { who: "Lender / Bank",    protects: "Their loan",           ok: false },
  { who: "Real Estate Agent",protects: "Their commission",     ok: false },
  { who: "HomeGuard AI",     protects: "You — the buyer",      ok: true  },
];

const CARDS = [
  {
    title: "Built for buyers, not institutions",
    desc: "Every other tool was designed to protect the transaction. We started blank and designed for the most vulnerable person in the room.",
    color: "#3b82f6",
  },
  {
    title: "No expertise required",
    desc: "You don't need to know routing numbers or escrow mechanics. We surface one result: safe or not safe.",
    color: "#8b5cf6",
  },
  {
    title: "Works inside your inbox",
    desc: "The Chrome Extension scans directly inside Gmail or Outlook. No file uploads, no copy-pasting.",
    color: "#10b981",
  },
  {
    title: "Zero trust architecture",
    desc: "Your closing data never touches our servers. Everything runs locally or end-to-end encrypted.",
    color: "#f59e0b",
  },
];

export default function WhyDifferent() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="why-us" className="relative py-20 sm:py-24 mesh-bg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8" ref={ref}>

        {/* Header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            The HomeGuard Difference
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
          >
            Everyone Protects{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300">Themselves.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">We Protect You.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-slate-400 max-w-md"
          >
            Every party in a real estate deal has tools to protect their own interests.
            Until now, no one built one for yours.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-xl overflow-hidden border border-white/5"
          >
            {TABLE.map((row, i) => (
              <div
                key={row.who}
                className={`flex items-center justify-between px-5 py-4 transition-colors ${
                  row.ok
                    ? "bg-emerald-500/6 border-t border-emerald-500/15"
                    : `bg-white/[0.015] ${i > 0 ? "border-t border-white/4" : ""}`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {row.ok ? (
                    <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="#10b981" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-white/4 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </div>
                  )}
                  <span className={`text-sm ${row.ok ? "text-white font-medium" : "text-slate-400"}`}>
                    {row.who}
                  </span>
                  {row.ok && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/22 font-medium">
                      us
                    </span>
                  )}
                </div>
                <span className={`text-xs ${row.ok ? "text-emerald-400" : "text-slate-600"}`}>
                  {row.protects}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CARDS.map((c, i) => {
              const cRef = useRef<HTMLDivElement>(null);
              const cInView = useInView(cRef, { once: true, margin: "-40px" });
              return (
                <motion.div
                  key={c.title} ref={cRef}
                  initial={{ opacity: 0, y: 16 }}
                  animate={cInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="rounded-xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.035] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-1.5 h-1.5 rounded-full mb-3" style={{ background: c.color }} />
                  <div className="text-sm font-semibold text-white mb-1.5">{c.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{c.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
