"use client";

import styles from "../page.module.css";
import DashboardShell from "../components/DashboardShell";

export default function ThreatSummaryPage() {
  return (
    <DashboardShell
      title="Threat Summary"
      subtitle="Review outcomes from your latest extension, manual, and PDF checks."
    >
      <div className={styles.emptyCanvas}>
        <h2 className={styles.summaryTitle}>Summary Workspace</h2>
        <p className={styles.summaryText}>
          This page is ready for the next stage of your threat analysis output.
        </p>
      </div>
    </DashboardShell>
  );
}
