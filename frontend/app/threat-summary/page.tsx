"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import styles from "../page.module.css";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Signal {
  id: string;
  description: string;
  weight: number;
  triggered?: boolean; // undefined = not yet analyzed, true = flagged, false = clear
}

interface Tier {
  tier_weight: number;
  signals: Signal[];
}

interface ThreatModel {
  model_name: string;
  total_weight: number;
  tiers: Record<string, Tier>;
}

/* ── Mock data (swap for real API response) ──────────────────────────────────── */
/*
 * Only signals present in the backend payload are assumed triggered.
 * Score = sum of triggered signal weights.
 * Demo score: 30+10+5+6+4+3 = 58 → HIGH RISK
 */

const MOCK_RESULT: ThreatModel = {
  model_name: "real_estate_wire_fraud_frontend_v1",
  total_weight: 100,
  tiers: {
    hard_evidence: {
      tier_weight: 60,
      signals: [
        {
          id: "routing_number_mismatch",
          description:
            "Routing number does not match stated bank or fails Federal Reserve verification",
          weight: 30,
          triggered: true,
        },
        {
          id: "known_scam_domain",
          description:
            "Sender domain matches known scam database or confirmed spoof",
          weight: 20,
          triggered: false,
        },
        {
          id: "newly_created_domain",
          description:
            "Domain age is recently created and used for financial instruction",
          weight: 10,
          triggered: false,
        },
      ],
    },
    structural_inconsistencies: {
      tier_weight: 22,
      signals: [
        {
          id: "escrow_name_mismatch",
          description:
            "Escrow officer name does not match user-provided or verified records",
          weight: 10,
          triggered: true,
        },
        {
          id: "foreign_banking_data",
          description:
            "Foreign bank, routing, or phone numbers in domestic transaction",
          weight: 7,
          triggered: false,
        },
        {
          id: "suspicious_unicode_characters",
          description: "Hidden or non-standard Unicode characters detected",
          weight: 5,
          triggered: true,
        },
      ],
    },
    behavioral_linguistic: {
      tier_weight: 13,
      signals: [
        {
          id: "pressure_language",
          description:
            "Urgency phrases such as 'wire immediately' or 'do not call to verify'",
          weight: 6,
          triggered: true,
        },
        {
          id: "ai_generated_text",
          description: "Text exhibits strong indicators of AI generation",
          weight: 4,
          triggered: true,
        },
        {
          id: "grammatical_errors",
          description:
            "Unusual grammatical patterns or structural writing issues",
          weight: 2,
          triggered: false,
        },
        {
          id: "misspellings",
          description:
            "Spelling inconsistencies or errors in professional communication",
          weight: 1,
          triggered: false,
        },
      ],
    },
    contextual_supporting: {
      tier_weight: 5,
      signals: [
        {
          id: "dummy_names",
          description: "Use of known placeholder names such as John Doe",
          weight: 2,
          triggered: false,
        },
        {
          id: "no_online_presence",
          description:
            "No verifiable online presence for sender or organization",
          weight: 3,
          triggered: true,
        },
      ],
    },
  },
};

/* ── Tier display config ─────────────────────────────────────────────────────── */

interface TierCfg {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const TIER_CONFIG: Record<string, TierCfg> = {
  hard_evidence: {
    label: "Hard Evidence",
    color: "#C75555",
    bg: "rgba(199,85,85,0.10)",
    border: "rgba(199,85,85,0.36)",
  },
  structural_inconsistencies: {
    label: "Structural Inconsistencies",
    color: "#C9843A",
    bg: "rgba(201,132,58,0.10)",
    border: "rgba(201,132,58,0.36)",
  },
  behavioral_linguistic: {
    label: "Behavioral & Linguistic",
    color: "#4B7BA7",
    bg: "rgba(75,123,167,0.12)",
    border: "rgba(75,123,167,0.38)",
  },
  contextual_supporting: {
    label: "Contextual Supporting",
    color: "#7AA85C",
    bg: "rgba(122,168,92,0.12)",
    border: "rgba(122,168,92,0.38)",
  },
};

function fallbackLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Score helpers ───────────────────────────────────────────────────────────── */

interface RiskLevel {
  label: string;
  color: string;
  bg: string;
  border: string;
}

function getRiskLevel(score: number, total: number): RiskLevel {
  const pct = (score / total) * 100;
  if (pct <= 25)
    return {
      label: "Low Risk",
      color: "#7AA85C",
      bg: "rgba(122,168,92,0.12)",
      border: "rgba(122,168,92,0.38)",
    };
  if (pct <= 50)
    return {
      label: "Moderate",
      color: "#C9843A",
      bg: "rgba(201,132,58,0.12)",
      border: "rgba(201,132,58,0.38)",
    };
  if (pct <= 75)
    return {
      label: "High Risk",
      color: "#C75555",
      bg: "rgba(199,85,85,0.12)",
      border: "rgba(199,85,85,0.38)",
    };
  return {
    label: "Critical",
    color: "#8E2020",
    bg: "rgba(142,32,32,0.10)",
    border: "rgba(142,32,32,0.36)",
  };
}

function computeScore(data: ThreatModel): number {
  let total = 0;
  for (const tier of Object.values(data.tiers)) {
    for (const sig of tier.signals) {
      if (sig.triggered !== false) total += sig.weight;
    }
  }
  return Math.min(total, data.total_weight);
}

function countSignals(data: ThreatModel): { triggered: number; total: number } {
  let triggered = 0;
  let total = 0;
  for (const tier of Object.values(data.tiers)) {
    for (const sig of tier.signals) {
      total++;
      if (sig.triggered !== false) triggered++;
    }
  }
  return { triggered, total };
}

/* ── SVG Gauge ───────────────────────────────────────────────────────────────── */
/*
 * 270° arc (75 % of circumference). Gap sits at the bottom.
 * Achieved with rotate(135°) which shifts the default top-gap down.
 * Track color is light on the white card; fill is the risk-level color.
 */

function RiskGauge({
  score,
  totalWeight,
}: {
  score: number;
  totalWeight: number;
}) {
  const RADIUS = 82;
  const cx = 110;
  const cy = 112;
  const C = 2 * Math.PI * RADIUS;
  const TRACK = 0.75 * C;
  const ratio = score / totalWeight;
  const fill = ratio * TRACK;
  const { color } = getRiskLevel(score, totalWeight);

  return (
    <svg
      viewBox="0 0 220 220"
      className={styles.gaugeSvg}
      role="img"
      aria-label={`Risk score: ${score} out of ${totalWeight}`}
    >
      {/* Track arc */}
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="none"
        stroke="rgba(28,76,112,0.09)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${TRACK} ${C - TRACK}`}
        transform={`rotate(135,${cx},${cy})`}
      />
      {/* Fill arc */}
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${C - fill}`}
        transform={`rotate(135,${cx},${cy})`}
      />
      {/* Score number */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#1A2540"
        fontSize="52"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {score}
      </text>
      {/* Denominator */}
      <text
        x={cx}
        y={cy + 17}
        textAnchor="middle"
        fill="rgba(90,107,128,0.65)"
        fontSize="14"
        letterSpacing="1"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        / {totalWeight}
      </text>
    </svg>
  );
}

/* ── Tier Card (with expandable signals) ─────────────────────────────────────── */

const SIGNALS_INITIAL = 2;

function TierCard({
  tierKey,
  tier,
  totalWeight,
}: {
  tierKey: string;
  tier: Tier;
  totalWeight: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg: TierCfg | undefined = TIER_CONFIG[tierKey];
  const label = cfg?.label ?? fallbackLabel(tierKey);
  const color = cfg?.color ?? "#4B7BA7";
  const bg = cfg?.bg ?? "rgba(75,123,167,0.1)";
  const border = cfg?.border ?? "rgba(75,123,167,0.35)";

  // Triggered subset
  const triggeredSignals = tier.signals.filter((s) => s.triggered !== false);
  const triggeredWeight = triggeredSignals.reduce((sum, s) => sum + s.weight, 0);
  const triggeredPct =
    tier.tier_weight > 0 ? (triggeredWeight / tier.tier_weight) * 100 : 0;

  // Expandable list (all signals, triggered first)
  const sorted = [
    ...tier.signals.filter((s) => s.triggered !== false),
    ...tier.signals.filter((s) => s.triggered === false),
  ];
  const visible = expanded ? sorted : sorted.slice(0, SIGNALS_INITIAL);
  const hiddenCount = sorted.length - SIGNALS_INITIAL;

  return (
    <article
      className={styles.tierCard}
      style={{ borderLeftColor: color }}
    >
      {/* Card header */}
      <div className={styles.tierCardTop}>
        <h3 className={styles.tierCardTitle}>{label}</h3>
        <span
          className={styles.tierWeightPill}
          style={{ color, background: bg, borderColor: border }}
        >
          {tier.tier_weight}pts
        </span>
      </div>

      {/* Trigger summary + progress bar */}
      <div className={styles.tierStatRow}>
        <span className={styles.tierStatLabel}>
          {triggeredSignals.length} of {tier.signals.length} signals detected
        </span>
        <span className={styles.tierStatValue} style={{ color }}>
          +{triggeredWeight}pts
        </span>
      </div>
      <div className={styles.tierProgressTrack}>
        <div
          className={styles.tierProgressFill}
          style={{ width: `${triggeredPct}%`, background: color }}
        />
      </div>

      {/* Signal list */}
      <div className={styles.signalList}>
        {visible.map((signal) => {
          const active = signal.triggered !== false;
          const barPct = (signal.weight / tier.tier_weight) * 100;
          return (
            <div key={signal.id} className={styles.signalRow}>
              <div className={styles.signalMeta}>
                <div className={styles.signalIdRow}>
                  {/* Status dot */}
                  <span
                    className={styles.signalDot}
                    style={{
                      background: active
                        ? color
                        : "rgba(90,107,128,0.22)",
                    }}
                  />
                  <span
                    className={`${styles.signalId} ${
                      !active ? styles.signalIdMuted : ""
                    }`}
                  >
                    {signal.id}
                  </span>
                </div>
                <span
                  className={styles.signalWeightLabel}
                  style={{
                    color: active ? color : "rgba(90,107,128,0.40)",
                  }}
                >
                  +{signal.weight}
                </span>
              </div>

              {/* Only show description + bar for triggered signals */}
              {active && (
                <>
                  <p className={styles.signalDescription}>
                    {signal.description}
                  </p>
                  <div className={styles.signalBarTrack}>
                    <div
                      className={styles.signalBarFill}
                      style={{ width: `${barPct}%`, background: color }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / collapse */}
      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.expandButton}
          style={{ color }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Show less"
            : `+${hiddenCount} more signal${hiddenCount > 1 ? "s" : ""}`}
        </button>
      )}
    </article>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function ThreatSummaryPage() {
  const data = MOCK_RESULT;
  const score = computeScore(data);
  const { triggered: triggeredCount, total: totalSignals } = countSignals(data);
  const risk = getRiskLevel(score, data.total_weight);
  const tierEntries = Object.entries(data.tiers);

  return (
    <DashboardShell
      title="Threat Summary"
      subtitle="AI-powered signal analysis for real estate wire fraud detection."
    >
      <div className={styles.threatGrid}>

        {/* ── Score Hero ── */}
        <div className={styles.scoreHero}>

          {/* Left: gauge */}
          <div className={styles.gaugePane}>
            <p className={styles.gaugeTopLabel}>Overall Risk Score</p>
            <RiskGauge score={score} totalWeight={data.total_weight} />
            <span
              className={styles.riskCategoryBadge}
              style={{
                color: risk.color,
                background: risk.bg,
                borderColor: risk.border,
              }}
            >
              {risk.label}
            </span>
          </div>

          {/* Right: stats + tier breakdown */}
          <div className={styles.infoPane}>
            <div>
              <h2 className={styles.infoHeading}>Threat Assessment</h2>
              <p className={styles.infoModelName}>{data.model_name}</p>
            </div>

            {/* Stat pills */}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span
                  className={styles.heroStatNum}
                  style={{ color: risk.color }}
                >
                  {triggeredCount}
                </span>
                <span className={styles.heroStatLabel}>Detected</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{totalSignals}</span>
                <span className={styles.heroStatLabel}>Signals</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{score}</span>
                <span className={styles.heroStatLabel}>Score</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{data.total_weight}</span>
                <span className={styles.heroStatLabel}>Max</span>
              </div>
            </div>

            {/* Tier weight bars */}
            <div className={styles.tierBars}>
              {tierEntries.map(([key, tier]) => {
                const cfg = TIER_CONFIG[key];
                const pct = (tier.tier_weight / data.total_weight) * 100;
                return (
                  <div key={key} className={styles.tierBarRow}>
                    <div className={styles.tierBarMeta}>
                      <span className={styles.tierBarLabel}>
                        {cfg?.label ?? fallbackLabel(key)}
                      </span>
                      <span className={styles.tierBarPts}>
                        {tier.tier_weight}pts
                      </span>
                    </div>
                    <div className={styles.tierBarTrack}>
                      <div
                        className={styles.tierBarFill}
                        style={{
                          width: `${pct}%`,
                          background: cfg?.color ?? "#4B7BA7",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tier Cards ── */}
        <div className={styles.tierCardGrid}>
          {tierEntries.map(([key, tier]) => (
            <TierCard
              key={key}
              tierKey={key}
              tier={tier}
              totalWeight={data.total_weight}
            />
          ))}
        </div>

      </div>
    </DashboardShell>
  );
}
