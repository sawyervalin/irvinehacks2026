"use client";

import { useEffect, useRef } from "react";

/* ─── static node positions (% of container) ─────────────────────────── */
const NODES = [
  { x: 50, y: 50 }, // center
  { x: 50, y: 22 },
  { x: 72, y: 35 },
  { x: 78, y: 60 },
  { x: 62, y: 76 },
  { x: 38, y: 76 },
  { x: 22, y: 60 },
  { x: 28, y: 35 },
  { x: 50, y: 12 },
  { x: 84, y: 48 },
  { x: 16, y: 48 },
  { x: 66, y: 88 },
  { x: 34, y: 88 },
];

/* edges: pairs of node indices */
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 1],
  [1, 8], [2, 9], [6, 10], [4, 11], [5, 12],
];

export default function VoidField() {
  const svgRef  = useRef<SVGSVGElement>(null);
  const arcRef  = useRef<SVGLineElement>(null);
  const frameId = useRef<number>(0);
  const t       = useRef(0);

  useEffect(() => {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t.current += dt;

      /* ── pulse each node ── */
      const svg = svgRef.current;
      if (!svg) { frameId.current = requestAnimationFrame(tick); return; }

      const circles = svg.querySelectorAll<SVGCircleElement>("circle[data-node]");
      circles.forEach((c, i) => {
        const phase = (i / NODES.length) * Math.PI * 2;
        const pulse = 0.55 + 0.45 * Math.sin(t.current * 1.1 + phase);
        c.setAttribute("opacity", String(0.25 + pulse * 0.55));
        const baseR = i === 0 ? 5 : 3;
        c.setAttribute("r", String(baseR + pulse * (i === 0 ? 2.5 : 1.2)));
      });

      /* ── pulse each edge ── */
      const lines = svg.querySelectorAll<SVGLineElement>("line[data-edge]");
      lines.forEach((l, i) => {
        const phase = (i / EDGES.length) * Math.PI * 2;
        const pulse = 0.5 + 0.5 * Math.sin(t.current * 0.7 + phase);
        l.setAttribute("stroke-opacity", String(0.06 + pulse * 0.14));
      });

      /* ── rotating scanner line ── */
      const arc = arcRef.current;
      if (arc) {
        const angle = t.current * 0.6; // radians/s
        const cx = 50, cy = 50, len = 38;
        const x2 = cx + Math.cos(angle) * len;
        const y2 = cy + Math.sin(angle) * len;
        arc.setAttribute("x1", `${cx}%`);
        arc.setAttribute("y1", `${cy}%`);
        arc.setAttribute("x2", `${x2}%`);
        arc.setAttribute("y2", `${y2}%`);
      }

      /* ── expanding ring pulses ── */
      const rings = svg.querySelectorAll<SVGCircleElement>("circle[data-ring]");
      rings.forEach((r, i) => {
        const period = 3.2 + i * 0.9;
        const phase  = (i / rings.length) * period;
        const prog   = ((t.current + phase) % period) / period; // 0→1
        const radius = 4 + prog * 34;
        const opacity = (1 - prog) * 0.18;
        r.setAttribute("r", String(radius) + "%");
        r.setAttribute("opacity", String(opacity));
      });

      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId.current);
  }, []);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        {/* scanner sweep gradient */}
        <linearGradient id="sweep-grad" gradientUnits="userSpaceOnUse"
          x1="50%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%"   stopColor="#1C4C70" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1C4C70" stopOpacity="0" />
        </linearGradient>
        {/* node glow filter */}
        <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* expanding pulse rings */}
      {[0, 1, 2].map(i => (
        <circle
          key={`ring-${i}`}
          data-ring={i}
          cx="50%"
          cy="50%"
          r="4%"
          fill="none"
          stroke="#1C4C70"
          strokeWidth="0.4"
        />
      ))}

      {/* edges */}
      {EDGES.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          data-edge={i}
          x1={`${NODES[a].x}%`}
          y1={`${NODES[a].y}%`}
          x2={`${NODES[b].x}%`}
          y2={`${NODES[b].y}%`}
          stroke="#4B7BA7"
          strokeWidth="0.35"
          strokeOpacity="0.10"
        />
      ))}

      {/* scanner sweep line */}
      <line
        ref={arcRef}
        x1="50%" y1="50%" x2="88%" y2="50%"
        stroke="url(#sweep-grad)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />

      {/* nodes */}
      {NODES.map((n, i) => (
        <circle
          key={`node-${i}`}
          data-node={i}
          cx={`${n.x}%`}
          cy={`${n.y}%`}
          r={i === 0 ? 5 : 3}
          fill="#1C4C70"
          opacity="0.35"
          filter="url(#node-glow)"
        />
      ))}

      {/* center label */}
      <text
        x="50%"
        y="57%"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="2.2"
        fill="#1C4C70"
        opacity="0.30"
        letterSpacing="0.6"
      >
        AI ACTIVE
      </text>
    </svg>
  );
}
