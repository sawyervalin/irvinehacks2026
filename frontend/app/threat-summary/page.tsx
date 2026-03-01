"use client";

import styles from "../page.module.css";
import DashboardShell from "../components/DashboardShell";

export default function ThreatSummaryPage() {
  return (
    <DashboardShell primaryLabel="Check for threats!">
      <div className={styles.emptyCanvas} />
    </DashboardShell>
  );
}
