import styles from "../wire-parser.module.css";

interface ResultCardProps {
  title: string;
  icon: string;
  borderColor: string;
  children: React.ReactNode;
  delay?: number;
}

export function ResultCard({
  title,
  icon,
  borderColor,
  children,
  delay = 0,
}: ResultCardProps) {
  return (
    <div
      className={styles.card}
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        padding: "1.25rem 1.5rem",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{ fontSize: "1.05rem", lineHeight: 1 }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "#111827",
            letterSpacing: "0.01em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h3>
      </div>
      <div
        style={{
          color: "#374151",
          fontSize: "0.875rem",
          lineHeight: "1.75",
        }}
      >
        {children}
      </div>
    </div>
  );
}
