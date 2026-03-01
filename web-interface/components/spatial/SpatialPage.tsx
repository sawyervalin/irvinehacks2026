"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect } from "react";
import HeroPanel from "./HeroPanel";
import ThreatPanel from "./ThreatPanel";
import HowPanel from "./HowPanel";
import FinalPanel from "./FinalPanel";

const HouseScene = dynamic(() => import("@/components/HouseScene"), { ssr: false });

export default function SpatialPage() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const opacity = 1 - scrollProgress;

      if (canvasRef.current) {
        canvasRef.current.style.opacity = String(opacity);
        // Parallax: translate canvas up slightly as scroll progresses
        canvasRef.current.style.transform = `translateY(${scrollProgress * -6}%)`;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // apply initial state on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative">

      {/* ── Light background ── */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          background: "linear-gradient(135deg, #F0F2F7 0%, #F8F9FB 55%, #EBF0F5 100%)",
        }}
      />

      {/* ── Subtle grid ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(75, 123, 167, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75, 123, 167, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          backgroundPosition: "40px 40px",
        }}
      />

      {/* ── 3D House Canvas — opacity + parallax via direct scroll listener ── */}
      <div
        ref={canvasRef}
        className="fixed inset-0"
        style={{ zIndex: 2, willChange: "opacity, transform" }}
      >
        <HouseScene />
      </div>

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
            color: "rgba(26,37,64,0.60)",
            textTransform: "uppercase",
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
              background: "#1C4C70",
              boxShadow: "0 0 8px rgba(28,76,112,0.30)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "rgba(28,76,112,0.70)",
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
            minHeight: "68vh",
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
            minHeight: "68vh",
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
            minHeight: "72vh",
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
