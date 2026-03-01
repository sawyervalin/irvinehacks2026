"use client";

import dynamic from "next/dynamic";
import { useScroll, useTransform, motion } from "framer-motion";
import HeroPanel from "./HeroPanel";
import ThreatPanel from "./ThreatPanel";
import HowPanel from "./HowPanel";
import FinalPanel from "./FinalPanel";

const HouseScene = dynamic(() => import("@/components/HouseScene"), { ssr: false });

export default function SpatialPage() {
  const { scrollYProgress } = useScroll();
  const canvasY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  return (
    <div className="relative">

      {/* ── White gradient background — canvas is alpha-transparent so this shows ── */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          background: "linear-gradient(135deg, #DBEAFE 0%, #F0F9FF 40%, #FFFFFF 65%, #FFF7ED 100%)",
        }}
      />

      {/* ── Spatial grid — offset 40px so no line lands on the left/top edge ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(14, 116, 144, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 116, 144, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          backgroundPosition: "40px 40px",
        }}
      />

      {/* ── 3D House Canvas — transparent, gradient shows through ── */}
      <motion.div
        className="fixed inset-0"
        style={{ zIndex: 2, y: canvasY }}
      >
        <HouseScene />
      </motion.div>

      {/* ── Cinematic scan line ── */}
      <div className="scan-line" />

      {/* ── Minimal floating nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between pointer-events-auto"
        style={{ zIndex: 20, padding: "28px 48px" }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "11px",
            letterSpacing: "0.22em",
            color: "#0C2340",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          HomeGuard
        </span>
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#F97316",
              boxShadow: "0 0 8px rgba(249,115,22,0.6)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "rgba(249,115,22,0.7)",
            }}
          >
            PROTECTED
          </span>
        </div>
      </nav>

      {/* ── Scroll Content ── */}
      <main className="relative pointer-events-none" style={{ zIndex: 10 }}>

        {/* 1 — HERO */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 clamp(32px, 8vw, 128px)",
          }}
        >
          <HeroPanel />
        </section>

        {/* 2 — THREAT */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 clamp(32px, 8vw, 128px)",
          }}
        >
          <ThreatPanel />
        </section>

        {/* 3 — HOW IT WORKS */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 clamp(32px, 8vw, 128px)",
          }}
        >
          <HowPanel />
        </section>

        {/* 4 — FINAL CTA */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 clamp(32px, 8vw, 128px)",
          }}
        >
          <FinalPanel />
        </section>

      </main>

    </div>
  );
}
