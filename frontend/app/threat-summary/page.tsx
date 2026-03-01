"use client";

import styles from "../page.module.css";
import DashboardShell from "../components/DashboardShell";

export default function ThreatSummaryPage() {
  return (
    <DashboardShell
      title="Threat Summary"
      subtitle="Overview of risk checks and detected issues."
      primaryLabel="Check for threats!"
    >
      <div className={styles.emptyCanvas} />
    </DashboardShell>
  );
}
