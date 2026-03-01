import styles from "../wire-parser.module.css";

export function LoadingSpinner() {
  return (
    <div style={{ paddingTop: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        }}
      >
        <div
          className={styles.spinner}
          role="status"
          aria-label="Analyzing document"
        />
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#111827",
            }}
          >
            Analyzing your wire instructions…
          </p>
          <p
            style={{
              margin: "0.15rem 0 0",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            This may take 10–20 seconds.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[88, 108, 96].map((height, i) => (
          <div
            key={i}
            className={styles.shimmerCard}
            style={{
              height: `${height}px`,
              animationDelay: `${i * 0.1}s`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
