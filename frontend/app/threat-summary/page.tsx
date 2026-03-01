"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import styles from "../page.module.css";

interface Signal {
  id: string;
  description: string;
  weight: number;
  triggered?: boolean;
}

interface Tier {
  tier_weight: number;
  signals: Signal[];
}

interface ThreatModel {
  model_name: string;
  total_weight: number;
  score: number;
  risk_tier: string;
  tiers: Record<string, Tier>;
}

interface TierCfg {
  label: string;
  color: string;
  bg: string;
  border: string;
}

interface BackendTriggeredRule {
  id: string;
  bucket: string;
  points: number;
}

interface BackendRiskAssessment {
  bucket_scores: Record<string, number>;
  overall_risk_score: number;
  risk_tier: string;
  triggered_rules: BackendTriggeredRule[];
}

interface StoredThreatResult {
  receivedAt: string;
  source: "process" | "process-pdf";
  backendResponse: unknown;
}

interface LatestResultResponse {
  ok: boolean;
  hasData: boolean;
  result: StoredThreatResult | null;
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

const SIGNALS_INITIAL = 2;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fallbackLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeRuleId(ruleId: string): string {
  return ruleId
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return defaultValue;
}

function normalizeTriggeredRules(value: unknown): BackendTriggeredRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: BackendTriggeredRule[] = [];
  for (const rule of value) {
    if (!isObject(rule)) {
      continue;
    }

    const id = typeof rule.id === "string" ? rule.id : "";
    const bucket = typeof rule.bucket === "string" ? rule.bucket : "";
    const points = toNumber(rule.points, 0);
    if (!id || !bucket || points <= 0) {
      continue;
    }
    normalized.push({ id, bucket, points });
  }
  return normalized;
}

function extractRiskAssessment(backendResponse: unknown): BackendRiskAssessment | null {
  if (!isObject(backendResponse)) {
    return null;
  }

  const direct = backendResponse.risk_assessment;
  if (isObject(direct)) {
    return {
      bucket_scores: isObject(direct.bucket_scores)
        ? {
            content: toNumber(direct.bucket_scores.content),
            banking: toNumber(direct.bucket_scores.banking),
            domain: toNumber(direct.bucket_scores.domain),
          }
        : { content: 0, banking: 0, domain: 0 },
      overall_risk_score: toNumber(direct.overall_risk_score),
      risk_tier: typeof direct.risk_tier === "string" ? direct.risk_tier : "low",
      triggered_rules: normalizeTriggeredRules(direct.triggered_rules),
    };
  }

  const result = backendResponse.result;
  if (!isObject(result)) {
    return null;
  }
  const hackathon = result.hackathon_schema;
  if (!isObject(hackathon)) {
    return null;
  }
  const risk = hackathon.risk_assessment;
  if (!isObject(risk)) {
    return null;
  }

  return {
    bucket_scores: isObject(risk.bucket_scores)
      ? {
          content: toNumber(risk.bucket_scores.content),
          banking: toNumber(risk.bucket_scores.banking),
          domain: toNumber(risk.bucket_scores.domain),
        }
      : { content: 0, banking: 0, domain: 0 },
    overall_risk_score: toNumber(risk.overall_risk_score),
    risk_tier: typeof risk.risk_tier === "string" ? risk.risk_tier : "low",
    triggered_rules: normalizeTriggeredRules(risk.triggered_rules),
  };
}

function ruleToTierKey(bucket: string): string {
  if (bucket === "banking") {
    return "hard_evidence";
  }
  if (bucket === "domain") {
    return "structural_inconsistencies";
  }
  if (bucket === "content") {
    return "behavioral_linguistic";
  }
  return "contextual_supporting";
}

function buildThreatModel(assessment: BackendRiskAssessment): ThreatModel {
  const tiers: Record<string, Tier> = {
    hard_evidence: {
      tier_weight: toNumber(assessment.bucket_scores.banking),
      signals: [],
    },
    structural_inconsistencies: {
      tier_weight: toNumber(assessment.bucket_scores.domain),
      signals: [],
    },
    behavioral_linguistic: {
      tier_weight: toNumber(assessment.bucket_scores.content),
      signals: [],
    },
    contextual_supporting: {
      tier_weight: 0,
      signals: [],
    },
  };

  for (const rule of assessment.triggered_rules) {
    const key = ruleToTierKey(rule.bucket);
    tiers[key].signals.push({
      id: rule.id,
      description: humanizeRuleId(rule.id),
      weight: rule.points,
      triggered: true,
    });
  }

  for (const [tierKey, tier] of Object.entries(tiers)) {
    if (tier.signals.length === 0) {
      tier.signals.push({
        id: `no_${tierKey}_signals`,
        description: "No high-confidence signals detected in this tier.",
        weight: Math.max(tier.tier_weight, 1),
        triggered: false,
      });
    }
  }

  return {
    model_name: "wire_pdf_parser_v2",
    total_weight: 100,
    score: Math.max(0, Math.min(100, assessment.overall_risk_score)),
    risk_tier: assessment.risk_tier.toLowerCase(),
    tiers,
  };
}

interface RiskLevel {
  label: string;
  color: string;
  bg: string;
  border: string;
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) {
    return {
      label: "Low Risk",
      color: "#7AA85C",
      bg: "rgba(122,168,92,0.12)",
      border: "rgba(122,168,92,0.38)",
    };
  }
  if (score <= 50) {
    return {
      label: "Moderate",
      color: "#C9843A",
      bg: "rgba(201,132,58,0.12)",
      border: "rgba(201,132,58,0.38)",
    };
  }
  if (score <= 75) {
    return {
      label: "High Risk",
      color: "#C75555",
      bg: "rgba(199,85,85,0.12)",
      border: "rgba(199,85,85,0.38)",
    };
  }
  return {
    label: "Critical",
    color: "#8E2020",
    bg: "rgba(142,32,32,0.10)",
    border: "rgba(142,32,32,0.36)",
  };
}

function countSignals(data: ThreatModel): { triggered: number; total: number } {
  let triggered = 0;
  let total = 0;
  for (const tier of Object.values(data.tiers)) {
    for (const sig of tier.signals) {
      total += 1;
      if (sig.triggered !== false) {
        triggered += 1;
      }
    }
  }
  return { triggered, total };
}

function RiskGauge({
  score,
  totalWeight,
}: {
  score: number;
  totalWeight: number;
}) {
  const radius = 82;
  const cx = 110;
  const cy = 112;
  const circumference = 2 * Math.PI * radius;
  const track = 0.75 * circumference;
  const ratio = score / totalWeight;
  const fill = ratio * track;
  const { color } = getRiskLevel(score);

  return (
    <svg
      viewBox="0 0 220 220"
      className={styles.gaugeSvg}
      role="img"
      aria-label={`Risk score: ${score} out of ${totalWeight}`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(28,76,112,0.09)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${track} ${circumference - track}`}
        transform={`rotate(135,${cx},${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circumference - fill}`}
        transform={`rotate(135,${cx},${cy})`}
      />
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

function TierCard({
  tierKey,
  tier,
}: {
  tierKey: string;
  tier: Tier;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg: TierCfg | undefined = TIER_CONFIG[tierKey];
  const label = cfg?.label ?? fallbackLabel(tierKey);
  const color = cfg?.color ?? "#4B7BA7";
  const bg = cfg?.bg ?? "rgba(75,123,167,0.1)";
  const border = cfg?.border ?? "rgba(75,123,167,0.35)";

  const triggeredSignals = tier.signals.filter((s) => s.triggered !== false);
  const triggeredWeight = triggeredSignals.reduce((sum, s) => sum + s.weight, 0);
  const triggeredPct =
    tier.tier_weight > 0 ? (triggeredWeight / tier.tier_weight) * 100 : 0;
  const sorted = [
    ...tier.signals.filter((s) => s.triggered !== false),
    ...tier.signals.filter((s) => s.triggered === false),
  ];
  const visible = expanded ? sorted : sorted.slice(0, SIGNALS_INITIAL);
  const hiddenCount = sorted.length - SIGNALS_INITIAL;

  return (
    <article className={styles.tierCard} style={{ borderLeftColor: color }}>
      <div className={styles.tierCardTop}>
        <h3 className={styles.tierCardTitle}>{label}</h3>
        <span className={styles.tierWeightPill} style={{ color, background: bg, borderColor: border }}>
          {tier.tier_weight}pts
        </span>
      </div>

      <div className={styles.tierStatRow}>
        <span className={styles.tierStatLabel}>
          {triggeredSignals.length} of {tier.signals.length} signals detected
        </span>
        <span className={styles.tierStatValue} style={{ color }}>
          +{triggeredWeight}pts
        </span>
      </div>
      <div className={styles.tierProgressTrack}>
        <div className={styles.tierProgressFill} style={{ width: `${triggeredPct}%`, background: color }} />
      </div>

      <div className={styles.signalList}>
        {visible.map((signal) => {
          const active = signal.triggered !== false;
          const barPct = tier.tier_weight > 0 ? (signal.weight / tier.tier_weight) * 100 : 0;
          return (
            <div key={signal.id} className={styles.signalRow}>
              <div className={styles.signalMeta}>
                <div className={styles.signalIdRow}>
                  <span
                    className={styles.signalDot}
                    style={{ background: active ? color : "rgba(90,107,128,0.22)" }}
                  />
                  <span className={`${styles.signalId} ${!active ? styles.signalIdMuted : ""}`}>
                    {signal.id}
                  </span>
                </div>
                <span
                  className={styles.signalWeightLabel}
                  style={{ color: active ? color : "rgba(90,107,128,0.40)" }}
                >
                  +{signal.weight}
                </span>
              </div>

              {active && (
                <>
                  <p className={styles.signalDescription}>{signal.description}</p>
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

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.expandButton}
          style={{ color }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `+${hiddenCount} more signal${hiddenCount > 1 ? "s" : ""}`}
        </button>
      )}
    </article>
  );
}

export default function ThreatSummaryPage() {
  const [data, setData] = useState<ThreatModel | null>(null);
  const [status, setStatus] = useState("Loading latest backend analysis...");

  useEffect(() => {
    let active = true;

    async function loadThreatData() {
      try {
        const response = await fetch(`/api/gmail-ingest/latest-result?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as LatestResultResponse;
        if (!active) {
          return;
        }

        if (!payload.hasData || !payload.result) {
          setData(null);
          setStatus("No backend analysis found yet. Run a threat check first.");
          return;
        }

        const assessment = extractRiskAssessment(payload.result.backendResponse);
        if (!assessment) {
          setData(null);
          setStatus("Latest backend response did not include risk assessment data.");
          return;
        }

        setData(buildThreatModel(assessment));
        setStatus(`Loaded backend analysis from ${new Date(payload.result.receivedAt).toLocaleString()}.`);
      } catch {
        if (!active) {
          return;
        }
        setData(null);
        setStatus("Failed to load threat summary data from backend.");
      }
    }

    void loadThreatData();
    return () => {
      active = false;
    };
  }, []);

  const score = data?.score ?? 0;
  const totalWeight = data?.total_weight ?? 100;
  const risk = getRiskLevel(score);
  const signalCounts = useMemo(() => (data ? countSignals(data) : { triggered: 0, total: 0 }), [data]);
  const tierEntries = data ? Object.entries(data.tiers) : [];

  return (
    <DashboardShell
      title="Threat Summary"
      subtitle="AI-powered signal analysis for real estate wire fraud detection."
      statusText={status}
    >
      <div className={styles.threatGrid}>
        <div className={styles.scoreHero}>
          <div className={styles.gaugePane}>
            <p className={styles.gaugeTopLabel}>Overall Risk Score</p>
            <RiskGauge score={score} totalWeight={totalWeight} />
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

          <div className={styles.infoPane}>
            <div>
              <h2 className={styles.infoHeading}>Threat Assessment</h2>
              <p className={styles.infoModelName}>{data?.model_name ?? "No active analysis"}</p>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum} style={{ color: risk.color }}>
                  {signalCounts.triggered}
                </span>
                <span className={styles.heroStatLabel}>Detected</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{signalCounts.total}</span>
                <span className={styles.heroStatLabel}>Signals</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{score}</span>
                <span className={styles.heroStatLabel}>Score</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{totalWeight}</span>
                <span className={styles.heroStatLabel}>Max</span>
              </div>
            </div>

            <div className={styles.tierBars}>
              {tierEntries.map(([key, tier]) => {
                const cfg = TIER_CONFIG[key];
                const pct = totalWeight > 0 ? (tier.tier_weight / totalWeight) * 100 : 0;
                return (
                  <div key={key} className={styles.tierBarRow}>
                    <div className={styles.tierBarMeta}>
                      <span className={styles.tierBarLabel}>{cfg?.label ?? fallbackLabel(key)}</span>
                      <span className={styles.tierBarPts}>{tier.tier_weight}pts</span>
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

        <div className={styles.tierCardGrid}>
          {tierEntries.map(([key, tier]) => (
            <TierCard key={key} tierKey={key} tier={tier} />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
