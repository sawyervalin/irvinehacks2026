"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect } from "react";
import HeroPanel from "./HeroPanel";
import FinalPanel from "./FinalPanel";
import BootOverlay from "./BootOverlay";
import DataField from "./DataField";
import PanelCarousel from "./PanelCarousel";
import Navbar from "@/components/Navbar";

const HouseScene = dynamic(() => import("@/components/HouseScene"), { ssr: false });

export default function SpatialPage() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const FADE_END = 0.45; // house fully gone by 45% scroll progress

    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      const houseOpacity = Math.max(0, 1 - scrollProgress / FADE_END);

      if (canvasRef.current) {
        canvasRef.current.style.opacity = String(houseOpacity);
        canvasRef.current.style.transform = `translateY(${scrollProgress * -6}%)`;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative">

      {/* ── Boot animation — renders once on load ── */}
      <BootOverlay />

      {/* ── Persistent orbital data field / download counter ── */}
      <DataField />

      {/* ── Light background ── */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          background: "radial-gradient(circle at center, #ffffff 0%, #eef1f6 45%, #d4dde9 75%, #b8c6d6 100%)",
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
        style={{ zIndex: 2, willChange: "opacity, transform", backgroundColor: "transparent" }}
      >
        <HouseScene />
      </div>

      {/* ── Cinematic scan line ── */}
      <div className="scan-line" />

      {/* ── Shared Navbar — hidden until 25% scroll, fades in at 75% opacity ── */}
      <Navbar scrollReveal />

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

        {/* 2 — 3D PANEL CAROUSEL */}
        <section
          style={{
            minHeight: "88vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PanelCarousel />
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
