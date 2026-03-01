"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Email & PDF Scanning",
    desc: "Chrome Extension reads your inbox live. Scans wire instructions, PDFs, and attachments in real time — no copy-pasting required.",
    color: "#3b82f6",
  },
  {
    n: "02",
    title: "Multi-Layer Risk Scoring",
    desc: "Six detection engines run simultaneously: soft evidence, hard evidence, and domain verification — producing a weighted score in under 3 seconds.",
    color: "#8b5cf6",
  },
  {
    n: "03",
    title: "Instant Threat Report",
    desc: "Plain-language results delivered to your dashboard. Color-coded risk level, specific red flags, and clear next steps before you wire anything.",
    color: "#10b981",
  },
];

const FLAGS = [
  { t: "⚠", s: "Routing # mismatch",     c: "text-red-400 border-red-500/20 bg-red-500/6" },
  { t: "⚠", s: "Domain age: 4 days",     c: "text-red-400 border-red-500/20 bg-red-500/6" },
  { t: "⚠", s: "High-pressure language", c: "text-amber-400 border-amber-500/20 bg-amber-500/6" },
  { t: "✓", s: "Escrow officer verified", c: "text-emerald-400 border-emerald-500/20 bg-emerald-500/6" },
  { t: "✓", s: "Title company matched",  c: "text-emerald-400 border-emerald-500/20 bg-emerald-500/6" },
] as const;

function RiskMock({ active }: { active: boolean }) {
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active) { setScore(0); setItems([]); indexRef.current = 0; return; }
    let s = 0;
    const iv = setInterval(() => {
      s = Math.min(s + Math.floor(Math.random() * 10) + 4, 73);
      setScore(s);
      if (s >= 73) clearInterval(iv);
    }, 90);
    indexRef.current = 0;
    const iv2 = setInterval(() => {
      const i = indexRef.current;
      if (i >= FLAGS.length) { clearInterval(iv2); return; }
      const flag = FLAGS[i];
      setItems(p => [...p, flag.t + "|" + flag.s + "|" + flag.c]);
      indexRef.current = i + 1;
    }, 380);
    return () => { clearInterval(iv); clearInterval(iv2); };
  }, [active]);

  const col = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
  const label = score >= 70 ? "HIGH RISK" : score >= 40 ? "MEDIUM" : "SAFE";
  const circ = (score / 100) * 251.2;

  return (
    <div className="glass rounded-xl p-5 border border-white/5 w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-400 font-medium tracking-wider">RISK ANALYSIS</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ color: col, background: col + "18", border: `1px solid ${col}30` }}>
          {label}
        </span>
      </div>

      {/* Circle */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="7" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={col} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${circ} 251.2`}
              style={{ transition: "stroke-dasharray 0.08s, stroke 0.4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white leading-none">{score}</span>
            <span className="text-xs text-slate-500">risk</span>
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {items.map(raw => {
            const [t, s, c] = raw.split("|");
            return (
              <motion.div key={raw}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${c}`}>
                <span>{t}</span><span>{s}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-20 sm:py-24 mesh-bg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8" ref={ref}>

        {/* Header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Three Steps. Total Protection.
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
          >
            How{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              HomeGuard AI
            </span>{" "}
            Works
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-slate-400 max-w-md"
          >
            From email to threat report in under 3 seconds. Zero setup required.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const sRef = useRef<HTMLDivElement>(null);
              const sInView = useInView(sRef, { once: true, margin: "-50px" });
              const isActive = active === i;

              return (
                <motion.div
                  key={step.n} ref={sRef}
                  initial={{ opacity: 0, x: -18 }}
                  animate={sInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                  onClick={() => setActive(i)}
                  className={`relative cursor-pointer rounded-xl p-5 border transition-all duration-250 ${
                    isActive
                      ? "bg-white/[0.04] border-white/8"
                      : "bg-white/[0.015] border-white/4 hover:bg-white/[0.025]"
                  }`}
                  style={isActive ? { boxShadow: `0 0 30px ${step.color}18` } : {}}
                >
                  {isActive && (
                    <motion.div layoutId="step-bar"
                      className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
                      style={{ background: step.color }}
                    />
                  )}
                  <div className="flex items-start gap-3 pl-2">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ color: step.color, background: step.color + "15", border: `1px solid ${step.color}28` }}>
                      {step.n}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Chrome ext badge */}
            <motion.div
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              id="chrome-ext"
              className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3 mt-2"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/12 border border-blue-500/22 flex items-center justify-center text-blue-400 flex-shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Chrome Extension</div>
                <div className="text-xs text-slate-500">Scans directly inside Gmail</div>
              </div>
              <a href="#" className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/22 text-blue-400 hover:bg-blue-500/18 transition-colors whitespace-nowrap">
                Install Free
              </a>
            </motion.div>
          </div>

          {/* Mock UI */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.25, ease: "easeOut" }}
            className="lg:sticky lg:top-20"
          >
            {/* Browser chrome */}
            <div className="glass rounded-xl overflow-hidden border border-white/6">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                <div className="flex gap-1.5">
                  {["#ff5f57","#febc2e","#28c840"].map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 mx-2 h-5 bg-white/4 rounded-md flex items-center px-2">
                  <span className="text-xs text-slate-600">homeguard.ai/scan</span>
                </div>
              </div>
              <div className="p-4">
                <RiskMock active={inView} />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
