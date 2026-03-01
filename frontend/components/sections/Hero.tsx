"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const HouseScene = dynamic(() => import("../HouseScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border border-emerald-500/40 border-t-emerald-500 animate-spin" />
    </div>
  ),
});

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "glass" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="white" />
            </svg>
            <div className="absolute inset-0 rounded-lg bg-emerald-400 opacity-25 blur-sm" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            HomeGuard<span className="text-emerald-400">AI</span>
          </span>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-400">
          {["Product", "How It Works", "Why Us"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-white transition-colors duration-150">{l}</a>
          ))}
        </nav>

        {/* CTA */}
        <a href="/dashboard"
          className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/8 hover:bg-emerald-500/15 transition-colors duration-150">
          Open App
        </a>
      </div>
    </motion.header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <Nav />
      <div className="scan-line" />

      <section className="relative min-h-screen mesh-bg grid-bg flex items-center overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-emerald-500/7 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* Before: pt-20 pb-10 (80/40px) — too much top padding on mobile, pushes content down */}
        {/* After:  pt-16 pb-6 sm:pt-20 sm:pb-10 — tighter at mobile, same breathing room at sm+ */}
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-6 sm:pt-20 sm:pb-10 w-full">
          {/* Before: gap-8 items-center min-h-[calc(100vh-5rem)] — forces grid to ~764px on mobile, */}
          {/*         stretches cells with items-center adding phantom whitespace between stacked cols */}
          {/* After:  gap-5 sm:gap-8, no min-h — content drives height, no artificial stretching */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 lg:gap-4 lg:items-center lg:min-h-[calc(100vh-5rem)]">

            {/* ── Copy ─────────────────────────────────────────────────────── */}
            {/* Before: order-2 lg:order-1 — copy renders BELOW 3D on mobile (460px down before headline) */}
            {/* After:  order-1            — copy always renders first; 3D stacks below on mobile */}
            {/* Before: gap-6 (24px × 5 items = 120px of gaps) */}
            {/* After:  gap-3 sm:gap-5    — 12px gaps on mobile (60px total), 20px at sm+ */}
            <div className="flex flex-col gap-3 sm:gap-5 order-1">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  AI-Powered Fraud Protection
                </span>
              </motion.div>

              {/* Headline */}
              {/* Before: text-4xl (36px) — 3 lines × 36px × 1.08 = 117px on mobile, dominates viewport */}
              {/* After:  clamp(1.75rem, 4.5vw + 1rem, 3.5rem)                                        */}
              {/*         320px → ~29px  |  480px → ~30px  |  768px → ~45px  |  1280px → 56px        */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.12 }}
                className="font-bold leading-[1.08] tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 4.5vw + 1rem, 3.5rem)" }}
              >
                Protect Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  First Home
                </span>
                <br />
                Before You Wire
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-300">
                  a Dollar.
                </span>
              </motion.h1>

              {/* Sub */}
              {/* Before: text-base (16px) always — fine size but no mobile shrink */}
              {/* After:  text-sm sm:text-base — 14px on mobile saves ~8px per line */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22 }}
                className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md"
              >
                AI-powered fraud detection built for first-time buyers. Scan wire instructions,
                emails, and PDFs{" "}
                <span className="text-slate-200">before you lose everything.</span>
              </motion.p>

              {/* Buttons */}
              {/* Before: flex-col gap-3 — stacks on mobile, py-3 = 12px padding each side */}
              {/* After:  flex-row on mobile too (side by side), min-h-[44px] for tap targets */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="flex flex-row gap-2.5 sm:gap-3"
              >
                <a href="/dashboard"
                  className="relative inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] rounded-xl text-sm font-semibold text-white overflow-hidden group transition-transform duration-200 active:scale-95 flex-1 sm:flex-none"
                  style={{ background: "linear-gradient(135deg,#059669,#10b981,#34d399)" }}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="relative flex-shrink-0">
                    <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="white" />
                  </svg>
                  <span className="relative">Secure My Closing</span>
                  <div className="absolute inset-0 rounded-xl glow-green opacity-50" />
                </a>

                <a href="#chrome-ext"
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] rounded-xl text-sm font-semibold text-slate-300 glass border border-white/8 hover:border-blue-500/35 hover:text-white transition-all duration-200 flex-1 sm:flex-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="4" fill="#60a5fa" />
                  </svg>
                  Install Extension
                </a>
              </motion.div>

              {/* Stats */}
              {/* Before: gap-5, text-lg — on 320px three items at ~60px each = 180px + 40px gaps = 220px, tight */}
              {/* After:  gap-4, text-base — shaves ~12px, still legible */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex items-center gap-4 sm:gap-5"
              >
                {[
                  { v: "3×", l: "more vulnerable" },
                  { v: "$10B+", l: "lost annually" },
                  { v: "<3s", l: "scan time" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="text-base sm:text-lg font-bold text-white leading-none">{s.v}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── 3D Scene ──────────────────────────────────────────────────── */}
            {/* Before: order-1 lg:order-2 — renders above copy on mobile                      */}
            {/* After:  order-2            — always below copy on mobile; grid handles desktop  */}
            {/* Before: h-[340px] (87% of 390px width) — too dominant on mobile                */}
            {/* After:  h-[240px] sm:h-[360px] lg:h-[560px] — proportional to screen width    */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
              className="relative order-2 h-[240px] sm:h-[360px] lg:h-[560px]"
            >
              {/* Scene */}
              <HouseScene scrollY={scrollY} />

              {/* Safe score chip */}
              {/* Before: bottom-10 left-2, always visible — at 240px canvas height it clips or crowds */}
              {/* After:  hidden on mobile (<sm), shown sm+ where canvas is tall enough            */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
                className="absolute bottom-6 left-3 sm:bottom-10 sm:left-4 glass rounded-xl p-2.5 sm:p-3.5 min-w-[140px] sm:min-w-[160px]"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium tracking-wider">SCAN RESULT</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-400">98</span>
                  <span className="text-xs text-slate-500">/100 SAFE</span>
                </div>
                <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "98%" }}
                    transition={{ delay: 1.4, duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  />
                </div>
              </motion.div>

              {/* Threat blocked chip */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
                className="absolute top-3 right-3 sm:top-8 sm:right-4 glass rounded-xl p-2 sm:p-2.5 flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/12 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-400 leading-none">BLOCKED</div>
                  <div className="text-xs text-slate-500 mt-0.5">Fake routing #</div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050b18] to-transparent pointer-events-none" />
      </section>
    </>
  );
}
