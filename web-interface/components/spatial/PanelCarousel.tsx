"use client";

import { useRef, useEffect, useState } from "react";

/* ── Layout constants ──────────────────────────────────────────────────── */
const PANEL_W        = 368;   // px
const PANEL_H        = 500;   // px
const RADIUS         = 360;   // circle radius
const PERSPECTIVE    = 2000;  // px
const ROTATION_SPEED = 7;     // deg / second (free rotation)
const SNAP_LERP      = 0.12;  // interpolation factor toward target
const SNAP_THRESHOLD = 0.06;  // degrees — close enough to snap exactly
const FOCUS_Z        = 28;    // extra translateZ when panel is focused

/* Hitbox: 55% of panel, centered — only this region triggers hover-focus */
const HITBOX_W = Math.round(PANEL_W * 0.55);
const HITBOX_H = Math.round(PANEL_H * 0.55);

/* ── Panel data ────────────────────────────────────────────────────────── */
interface StepItem { num: string; label: string; sub: string }

interface PanelData {
  tag:         string;
  headline:    string;
  accentLine:  string;
  glowColor:   string;
  intro?:      string;
  items?:      string[];
  steps?:      StepItem[];
}

const PANELS: PanelData[] = [
  /* 1 — Threat Detection */
  {
    tag:        "Threat Intel",
    headline:   "Real-Time\nThreat Detection",
    accentLine: "rgba(199,85,85,0.55)",
    glowColor:  "rgba(199,85,85,0.06)",
    items: [
      "Real-time wire fraud detection",
      "Domain spoof detection",
      "Email interception defense",
      "Routing mismatch alerts",
    ],
  },

  /* 2 — How It Works */
  {
    tag:        "How It Works",
    headline:   "Scan. Analyze.\nVerify. Protect.",
    accentLine: "rgba(28,76,112,0.50)",
    glowColor:  "rgba(28,76,112,0.045)",
    steps: [
      { num: "01", label: "Scan",    sub: "Wire instructions, emails, PDFs" },
      { num: "02", label: "Analyze", sub: "Domains, routing, pressure language" },
      { num: "03", label: "Verify",  sub: "Authenticity and intent signals" },
      { num: "04", label: "Protect", sub: "Risk score before you wire" },
    ],
  },

  /* 3 — Chrome Extension */
  {
    tag:        "Chrome Extension",
    headline:   "Real-Time Email\nIntelligence",
    accentLine: "rgba(75,123,167,0.55)",
    glowColor:  "rgba(75,123,167,0.05)",
    intro:      "Live contextual AI from inside your inbox — detects:",
    items: [
      "Domain spoofing",
      "Hidden Unicode characters",
      "Man-in-the-middle interception",
      "Phishing attempts",
      "Bank account & routing fraud",
      "Email tampering",
    ],
  },

  /* 4 — Web App */
  {
    tag:        "Web App",
    headline:   "Professional\nWorkflow Mode",
    accentLine: "rgba(122,168,92,0.60)",
    glowColor:  "rgba(122,168,92,0.05)",
    intro:      "For brokers, realtors, and real estate professionals.",
    items: [
      "Bulk document validation",
      "Routing number verification",
      "Escrow officer cross-checks",
      "Risk scoring dashboards",
      "Transaction-level fraud analytics",
    ],
  },
];

/* ── Shared card style ─────────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  width:                    "100%",
  height:                   "100%",
  padding:                  "40px 44px",
  background:               "linear-gradient(145deg, #ffffff 0%, #ECF1F7 100%)",
  borderRadius:             "18px",
  position:                 "relative",
  overflow:                 "hidden",
  boxShadow:                "0 4px 48px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.80)",
  display:                  "flex",
  flexDirection:            "column",
  backfaceVisibility:       "hidden",
  WebkitBackfaceVisibility: "hidden",
};

/* ── Panel card ────────────────────────────────────────────────────────── */
function PanelCard({ panel }: { panel: PanelData }) {
  return (
    <div className="carousel-card" style={CARD}>

      {/* Corner glow blob */}
      <div
        style={{
          position:      "absolute",
          top:           -50,
          right:         -50,
          width:         180,
          height:        180,
          background:    panel.glowColor,
          borderRadius:  "50%",
          filter:        "blur(45px)",
          pointerEvents: "none",
        }}
      />

      {/* Tag */}
      <div
        style={{
          fontFamily:    "var(--font-geist-mono)",
          fontSize:      "8.5px",
          letterSpacing: "0.28em",
          color:         "#1C4C70",
          textTransform: "uppercase",
          opacity:       0.72,
          marginBottom:  24,
        }}
      >
        {panel.tag}
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize:      "clamp(22px, 2.2vw, 26px)",
          fontWeight:    400,
          letterSpacing: "-0.02em",
          lineHeight:    1.18,
          color:         "#1A2540",
          marginBottom:  22,
          whiteSpace:    "pre-line",
        }}
      >
        {panel.headline}
      </div>

      {/* Accent divider */}
      <div
        style={{
          height:       1,
          width:        32,
          background:   panel.accentLine,
          marginBottom: 22,
          flexShrink:   0,
        }}
      />

      {/* Intro */}
      {panel.intro && (
        <div
          style={{
            fontSize:     "11px",
            color:        "#5A6B80",
            lineHeight:   1.5,
            marginBottom: 18,
          }}
        >
          {panel.intro}
        </div>
      )}

      {/* Steps */}
      {panel.steps && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {panel.steps.map(step => (
            <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <span
                style={{
                  fontFamily:  "var(--font-geist-mono)",
                  fontSize:    "9px",
                  color:       "rgba(28,76,112,0.35)",
                  marginTop:   4,
                  flexShrink:  0,
                  userSelect:  "none",
                }}
              >
                {step.num}
              </span>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 400, letterSpacing: "-0.02em", color: "#1A2540", lineHeight: 1, marginBottom: 5 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: "10.5px", color: "#5A6B80" }}>
                  {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      {panel.items && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
          {panel.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span
                style={{
                  fontFamily:  "var(--font-geist-mono)",
                  fontSize:    "9px",
                  color:       panel.accentLine,
                  flexShrink:  0,
                  marginTop:   2,
                  userSelect:  "none",
                }}
              >
                →
              </span>
              <span style={{ fontSize: "11px", color: "#5A6B80", lineHeight: 1.45 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Arrow button ──────────────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const d = dir === "left"
    ? "M13 4 L7 10 L13 16"
    : "M7 4 L13 10 L7 16";

  return (
    <button
      onClick={onClick}
      style={{
        position:   "absolute",
        top:        "50%",
        [dir]:      "clamp(12px, 2.5vw, 40px)",
        transform:  "translateY(-50%)",
        zIndex:     10,
        background: "none",
        border:     "none",
        cursor:     "pointer",
        padding:    "10px",
        opacity:    0.32,
        lineHeight: 0,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.32"; }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d={d} stroke="#1C4C70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ── Carousel ──────────────────────────────────────────────────────────── */
export default function PanelCarousel() {
  const trackRef    = useRef<HTMLDivElement>(null);
  const angleRef    = useRef(0);       // current actual angle (continuous, no wrapping)
  const targetRef   = useRef(0);       // snap/step target angle
  const snappingRef = useRef(false);   // true while interpolating toward target
  const pausedRef   = useRef(false);   // true while hitbox hovered
  const lastRef     = useRef(0);
  const rafRef      = useRef(0);

  /* focusedIdx drives Z-forward on the front panel — needs re-render */
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  /* Which panel is currently at the front given an angle */
  const getFrontIdx = (a: number) => (((Math.round(-a / 90) % 4) + 4) % 4);

  /* Step to a panel delta from current snapped position */
  const stepTo = (delta: number) => {
    const snapped = Math.round(angleRef.current / 90) * 90;
    targetRef.current  = snapped + delta * 90;
    snappingRef.current = true;
    lastRef.current     = 0;
  };

  /* ── RAF loop ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const tick = (now: number) => {
      const dt = lastRef.current
        ? Math.min((now - lastRef.current) / 1000, 0.05)
        : 0;
      lastRef.current = now;

      if (snappingRef.current) {
        /* Interpolate toward target */
        const diff = targetRef.current - angleRef.current;
        if (Math.abs(diff) > SNAP_THRESHOLD) {
          angleRef.current += diff * SNAP_LERP;
        } else {
          angleRef.current    = targetRef.current;
          snappingRef.current = false;
        }
      } else if (!pausedRef.current) {
        /* Free rotation */
        angleRef.current  -= ROTATION_SPEED * dt;
        targetRef.current  = angleRef.current; // keep target in sync
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `rotateY(${angleRef.current}deg)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Hitbox hover — enter snaps to nearest panel + focuses ─────────── */
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect   = e.currentTarget.getBoundingClientRect();
    const dx     = Math.abs(e.clientX - (rect.left + rect.width  / 2));
    const dy     = Math.abs(e.clientY - (rect.top  + rect.height / 2));
    const inside = dx < HITBOX_W / 2 && dy < HITBOX_H / 2;

    if (inside === pausedRef.current) return; // no state change

    pausedRef.current = inside;

    if (inside) {
      /* Snap to nearest panel and light up front panel */
      const snapped = Math.round(angleRef.current / 90) * 90;
      targetRef.current   = snapped;
      snappingRef.current = true;
      setFocusedIdx(getFrontIdx(snapped));
    } else {
      /* Left hitbox — resume free rotation */
      setFocusedIdx(null);
      lastRef.current = 0;
    }
  };

  const onMouseLeave = () => {
    pausedRef.current = false;
    setFocusedIdx(null);
    lastRef.current = 0;
  };

  return (
    <div
      className="pointer-events-auto"
      style={{
        perspective:       `${PERSPECTIVE}px`,
        perspectiveOrigin: "50% 50%",
        width:             "100%",
        height:            PANEL_H + 80,
        display:           "flex",
        alignItems:        "center",
        justifyContent:    "center",
        position:          "relative",
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >

      {/* ── Left arrow ── */}
      <ArrowBtn dir="left"  onClick={() => stepTo(+1)} />

      {/* ── Right arrow ── */}
      <ArrowBtn dir="right" onClick={() => stepTo(-1)} />

      {/* ── Rotating track ── */}
      <div
        ref={trackRef}
        style={{
          position:       "relative",
          width:          PANEL_W,
          height:         PANEL_H,
          transformStyle: "preserve-3d",
        }}
      >
        {PANELS.map((panel, i) => {
          const isFocused = focusedIdx === i;
          const z         = isFocused ? RADIUS + FOCUS_Z : RADIUS;
          return (
            <div
              key={i}
              style={{
                position:   "absolute",
                inset:      0,
                transition: "transform 0.38s ease",
                transform:  `rotateY(${i * 90}deg) translateZ(${z}px)`,
              }}
            >
              <PanelCard panel={panel} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
