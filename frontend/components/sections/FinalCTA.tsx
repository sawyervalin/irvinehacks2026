"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#050b18 0%,#030810 100%)" }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/12 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-80 rounded-full bg-blue-600/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* CTA block */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-24 text-center" ref={ref}>
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, type: "spring", stiffness: 220 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 opacity-35 blur-lg animate-pulse" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
        >
          Protect Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
            Down Payment
          </span>{" "}
          Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-slate-400 mb-2 max-w-lg mx-auto"
        >
          The average first-time buyer wires{" "}
          <span className="text-white font-medium">$287,000</span> at closing.
          A 3-second scan could save every dollar of it.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="text-sm text-slate-600 mb-10"
        >
          Free to start · No credit card · No technical knowledge required
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <a href="/dashboard"
            className="relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden group transition-transform duration-200 active:scale-95 min-w-[200px] justify-center"
            style={{ background: "linear-gradient(135deg,#059669,#10b981,#34d399)" }}
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="relative flex-shrink-0">
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="white" />
            </svg>
            <span className="relative">Secure My Closing</span>
            <div className="absolute inset-0 rounded-xl glow-green opacity-40" />
          </a>

          <a href="#chrome-ext"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-300 glass border border-white/8 hover:border-blue-500/30 hover:text-white transition-all duration-200 min-w-[200px] justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" fill="#60a5fa" />
            </svg>
            Install Chrome Extension
          </a>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600"
        >
          {[
            { e: "🔒", l: "256-bit encrypted" },
            { e: "🏦", l: "Fed Reserve DB" },
            { e: "⚡", l: "Results in <3s" },
            { e: "🆓", l: "Free to start" },
          ].map(i => (
            <span key={i.l} className="flex items-center gap-1.5">{i.e} {i.l}</span>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/4">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">
              HomeGuard<span className="text-emerald-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-700 text-center">
            © 2025 HomeGuard AI · Built to protect first-time home buyers from wire fraud.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}
