interface RiskBadgeProps {
  riskScore: number;
}

type RiskLevel = "low" | "caution" | "high";

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "low";
  if (score <= 69) return "caution";
  return "high";
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; emoji: string; bg: string; text: string; border: string; ringColor: string }
> = {
  low: {
    label: "Low Risk",
    emoji: "🟢",
    bg: "#f0fdf4",
    text: "#15803d",
    border: "#16a34a",
    ringColor: "rgba(22,163,74,0.2)",
  },
  caution: {
    label: "Caution",
    emoji: "🟡",
    bg: "#fffbeb",
    text: "#92400e",
    border: "#d97706",
    ringColor: "rgba(217,119,6,0.2)",
  },
  high: {
    label: "High Risk",
    emoji: "🔴",
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#dc2626",
    ringColor: "rgba(220,38,38,0.2)",
  },
};

export function RiskBadge({ riskScore }: RiskBadgeProps) {
  const level = getRiskLevel(riskScore);
  const cfg = RISK_CONFIG[level];

  return (
    <div
      role="img"
      aria-label={`${cfg.label}: score ${riskScore} out of 100`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        backgroundColor: cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: `0 0 0 4px ${cfg.ringColor}`,
        color: cfg.text,
        borderRadius: "9999px",
        padding: "0.45rem 1.1rem",
        fontWeight: 700,
        fontSize: "1rem",
        letterSpacing: "0.01em",
        userSelect: "none",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "1.1rem" }}>
        {cfg.emoji}
      </span>
      <span>{cfg.label}</span>
      <span
        style={{
          fontWeight: 500,
          fontSize: "0.85rem",
          opacity: 0.7,
          paddingLeft: "0.1rem",
        }}
      >
        {riskScore}/100
      </span>
    </div>
  );
}
