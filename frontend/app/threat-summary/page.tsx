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
    triggered_rules: normalizeTriggeredRules(risk.triggered_rules),
  };
}

const BASE_MODEL: Omit<ThreatModel, "score" | "risk_tier"> = {
  model_name: "real_estate_wire_fraud_frontend_v1",
  total_weight: 100,
  tiers: {
    hard_evidence: {
      tier_weight: 60,
      signals: [
        {
          id: "routing_number_mismatch",
          description: "Routing number does not match stated bank or fails Federal Reserve verification",
          weight: 30,
        },
        {
          id: "known_scam_domain",
          description: "Sender domain matches known scam database or confirmed spoof",
          weight: 20,
        },
        {
          id: "newly_created_domain",
          description: "Domain age is recently created and used for financial instruction",
          weight: 10,
        },
      ],
    },
    structural_inconsistencies: {
      tier_weight: 22,
      signals: [
        {
          id: "escrow_name_mismatch",
          description: "Escrow officer name does not match user-provided or verified records",
          weight: 10,
        },
        {
          id: "foreign_banking_data",
          description: "Foreign bank, routing, or phone numbers in domestic transaction",
          weight: 7,
        },
        {
          id: "suspicious_unicode_characters",
          description: "Hidden or non-standard Unicode characters detected",
          weight: 5,
        },
      ],
    },
    behavioral_linguistic: {
      tier_weight: 13,
      signals: [
        {
          id: "pressure_language",
          description: "Urgency phrases such as 'wire immediately' or 'do not call to verify'",
          weight: 6,
        },
        {
          id: "ai_generated_text",
          description: "Text exhibits strong indicators of AI generation",
          weight: 4,
        },
        {
          id: "grammatical_errors",
          description: "Unusual grammatical patterns or structural writing issues",
          weight: 2,
        },
        {
          id: "misspellings",
          description: "Spelling inconsistencies or errors in professional communication",
          weight: 1,
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
        },
        {
          id: "no_online_presence",
          description: "No verifiable online presence for sender or organization",
          weight: 3,
        },
      ],
    },
  },
};

function createModelWithDefaults(): ThreatModel {
  return {
    model_name: BASE_MODEL.model_name,
    total_weight: BASE_MODEL.total_weight,
    score: 0,
    risk_tier: "low",
    tiers: {
      hard_evidence: {
        tier_weight: BASE_MODEL.tiers.hard_evidence.tier_weight,
        signals: BASE_MODEL.tiers.hard_evidence.signals.map((s) => ({ ...s, triggered: false })),
      },
      structural_inconsistencies: {
        tier_weight: BASE_MODEL.tiers.structural_inconsistencies.tier_weight,
        signals: BASE_MODEL.tiers.structural_inconsistencies.signals.map((s) => ({ ...s, triggered: false })),
      },
      behavioral_linguistic: {
        tier_weight: BASE_MODEL.tiers.behavioral_linguistic.tier_weight,
        signals: BASE_MODEL.tiers.behavioral_linguistic.signals.map((s) => ({ ...s, triggered: false })),
      },
      contextual_supporting: {
        tier_weight: BASE_MODEL.tiers.contextual_supporting.tier_weight,
        signals: BASE_MODEL.tiers.contextual_supporting.signals.map((s) => ({ ...s, triggered: false })),
      },
    },
  };
}

function toRuleSet(triggeredRules: BackendTriggeredRule[]): Set<string> {
  return new Set(triggeredRules.map((rule) => rule.id));
}

function hasAnyRule(ruleSet: Set<string>, ids: string[]): boolean {
  return ids.some((id) => ruleSet.has(id));
}

function scoreFromSignals(model: ThreatModel): number {
  let score = 0;
  for (const tier of Object.values(model.tiers)) {
    for (const signal of tier.signals) {
      if (signal.triggered) {
        score += signal.weight;
      }
    }
  }
  return Math.min(score, model.total_weight);
}

function buildThreatModel(assessment: BackendRiskAssessment): ThreatModel {
  const model = createModelWithDefaults();
  const rules = toRuleSet(assessment.triggered_rules);

  const mark = (tierKey: keyof ThreatModel["tiers"], signalId: string, active: boolean) => {
    const signal = model.tiers[tierKey].signals.find((entry) => entry.id === signalId);
    if (signal) {
      signal.triggered = active;
    }
  };

  mark("hard_evidence", "routing_number_mismatch", hasAnyRule(rules, ["BANKING_INVALID_ROUTING", "BANKING_NAME_MISMATCH"]));
  mark("hard_evidence", "known_scam_domain", hasAnyRule(rules, ["DOMAIN_ON_SCAM_LIST", "DOMAIN_LOOKALIKE", "DOMAIN_NOT_EXIST"]));
  mark("hard_evidence", "newly_created_domain", hasAnyRule(rules, ["DOMAIN_NEW_REGISTRATION"]));

  mark("structural_inconsistencies", "escrow_name_mismatch", hasAnyRule(rules, ["BANKING_NAME_MISMATCH"]));
  mark("structural_inconsistencies", "foreign_banking_data", hasAnyRule(rules, ["BANKING_FOREIGN_BANK"]));
  mark("structural_inconsistencies", "suspicious_unicode_characters", hasAnyRule(rules, ["CONTENT_SUSPICIOUS_CHARS"]));

  mark(
    "behavioral_linguistic",
    "pressure_language",
    hasAnyRule(rules, ["CONTENT_PRESSURE_TO_WIRE", "CONTENT_DO_NOT_CALL_VERIFY", "CONTENT_RUSHED_CLOSING"])
  );
  mark("behavioral_linguistic", "ai_generated_text", false);
  mark("behavioral_linguistic", "grammatical_errors", hasAnyRule(rules, ["CONTENT_GRAMMAR_ERRORS"]));
  mark("behavioral_linguistic", "misspellings", hasAnyRule(rules, ["CONTENT_MISSPELLINGS"]));

  mark("contextual_supporting", "dummy_names", hasAnyRule(rules, ["CONTENT_DUMMY_NAME"]));
  mark("contextual_supporting", "no_online_presence", hasAnyRule(rules, ["DOMAIN_NO_MX", "DOMAIN_NOT_EXIST"]));

  model.score = scoreFromSignals(model);
  model.risk_tier = getRiskLevel(model.score).label.toLowerCase().replace(" ", "_");
  return model;
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
  const [isClearing, setIsClearing] = useState(false);

  const clearSummary = async () => {
    setIsClearing(true);
    try {
      await fetch("/api/gmail-ingest/latest-result", {
        method: "DELETE",
      });
      setData(null);
      setStatus("Threat summary cleared.");
    } catch {
      setStatus("Failed to clear threat summary.");
    } finally {
      setIsClearing(false);
    }
  };

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
        <div className={styles.summaryActions}>
          <button
            type="button"
            className={styles.summaryClearButton}
            onClick={() => {
              void clearSummary();
            }}
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear Summary"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
