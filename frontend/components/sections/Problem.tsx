"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { v: "$446M", l: "Stolen via wire fraud in 2023" },
  { v: "3×",    l: "More likely to target first-time buyers" },
  { v: "78hrs", l: "Avg window before fraud is detected" },
  { v: "92%",   l: "Of victims never recover their funds" },
];

const STEPS = [
  {
    n: "01",
    t: "Hacker intercepts your email",
    d: "A man-in-the-middle attack on your inbox or the title company's compromised account.",
  },
  {
    n: "02",
    t: "Sends fake wire instructions",
    d: "A spoofed email arrives looking identical to your title company — different bank account.",
  },
  {
    n: "03",
    t: "You wire $300K in minutes",
    d: "Stressed and rushed at closing, you follow the instructions. Money is gone in seconds.",
  },
  {
    n: "04",
    t: "No one protects you",
    d: "Banks, title companies, lenders — they protect themselves. You are left with nothing.",
  },
];

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Problem() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-60px" });

  return (
    <section id="product" className="relative py-20 sm:py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#050b18 0%,#07091a 100%)" }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-900/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div ref={titleRef} className="mb-14">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            The Threat Is Real
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
          >
            The Most Expensive{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300">
              Click
            </span>{" "}
            of Your Life
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-slate-400 max-w-lg"
          >
            Wire fraud in real estate is the fastest-growing financial crime. First-time buyers
            — unfamiliar with the process — are the primary target.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {STATS.map((s, i) => (
            <FadeUp key={s.v} delay={i * 0.08}>
              <div className="rounded-xl border border-red-500/10 bg-red-500/4 p-4 hover:border-red-500/20 transition-colors duration-200">
                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">{s.v}</div>
                <div className="text-xs text-slate-500 leading-snug">{s.l}</div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Attack timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.1}>
              <div className="relative rounded-xl p-5 bg-white/[0.02] border border-white/5 h-full">
                <span className="text-xs font-mono text-red-500/50 font-bold tracking-widest mb-3 block">
                  {s.n}
                </span>
                <h3 className="text-sm font-semibold text-white mb-2 leading-snug">{s.t}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-slate-700 text-base z-10">›</div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Callout */}
        <FadeUp delay={0.2} className="mt-10">
          <div className="rounded-xl border border-red-500/12 bg-red-500/4 px-6 py-5 text-center">
            <p className="text-slate-400 text-sm mb-1">Title companies and lenders protect themselves.</p>
            <p className="text-lg font-semibold text-white">
              We protect{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                you.
              </span>
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
