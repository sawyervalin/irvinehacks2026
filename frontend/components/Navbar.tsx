"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NavbarProps {
  /** When true: background/border overlay fades in after 25% scroll (landing page).
   *  When false (default): nav is always fully transparent — text only. */
  scrollReveal?: boolean;
}

export default function Navbar({ scrollReveal = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(!scrollReveal);

  useEffect(() => {
    if (!scrollReveal) return;

    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.25);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollReveal]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 flex items-center justify-between"
      style={{ zIndex: 50, padding: "28px 48px" }}
    >
      {/* Background + border — only on landing page, scroll-triggered */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(248, 249, 251, 0.75)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(28, 76, 112, 0.10)",
          opacity: scrollReveal && scrolled ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      />

      {/* Logo — always visible, links to landing page */}
      <Link
        href="/"
        style={{
          position: "relative",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          letterSpacing: "0.22em",
          color: "rgba(26,37,64,1)",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Constryke
      </Link>

      {/* Badge — always visible */}
      <div className="flex items-center gap-2" style={{ position: "relative" }}>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1C4C70",
            boxShadow: "0 0 8px rgba(28,76,112,0.30)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            letterSpacing: "0.2em",
            color: "rgba(28,76,112,1)",
          }}
        >
          PROTECTED
        </span>
      </div>
    </nav>
  );
}
