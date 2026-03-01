"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../page.module.css";
import Navbar from "@/components/Navbar";

interface DashboardShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  statusText?: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
}

export default function DashboardShell({
  children,
  title,
  subtitle,
  statusText,
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false
}: DashboardShellProps) {
  const pathname = usePathname();
  const isAddData = pathname.startsWith("/threat-check");
  const isThreatSummary = pathname.startsWith("/threat-summary");
  const currentStep = isThreatSummary ? 2 : 1;

  return (
    <>
      <Navbar />
      <main className={styles.pageShell} style={{ paddingTop: "80px" }}>
        <div className={styles.appFrame}>
          <section className={styles.contentPane}>

          <div className={styles.headerRow}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>

          <nav className={styles.timeline} aria-label="Workflow steps">
            <Link
              href="/threat-check"
              className={styles.timelineStep}
              aria-current={isAddData ? "step" : undefined}
            >
              <span
                className={`${styles.timelineDot} ${currentStep >= 1 ? styles.timelineDotDone : ""}`}
                aria-hidden="true"
              >
                {currentStep > 1 ? "✓" : "1"}
              </span>
              <span className={styles.timelineLabel}>Add Data</span>
            </Link>
            <span className={styles.timelineRail} aria-hidden="true" />
            <Link
              href="/threat-summary"
              className={styles.timelineStep}
              aria-current={isThreatSummary ? "step" : undefined}
            >
              <span
                className={`${styles.timelineDot} ${currentStep >= 2 ? styles.timelineDotDone : ""}`}
                aria-hidden="true"
              >
                2
              </span>
              <span className={styles.timelineLabel}>Threat Summary</span>
            </Link>
          </nav>

          {statusText ? <p className={styles.statusText}>{statusText}</p> : null}

          {children}

          {onPrimaryAction && primaryLabel ? (
            <button
              type="button"
              className={styles.ctaButton}
              onClick={onPrimaryAction}
              disabled={primaryDisabled}
            >
              {primaryLabel}
            </button>
          ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
