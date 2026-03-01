"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../page.module.css";

interface DashboardShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  statusText?: string;
  primaryLabel: string;
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
  const isAddData = pathname === "/";
  const isThreatSummary = pathname.startsWith("/threat-summary");

  return (
    <main className={styles.pageShell}>
      <div className={styles.appFrame}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>LOGO PLACEHOLDER</div>
          <div className={styles.menuLabel}>MENU</div>
          <nav className={styles.nav}>
            <Link
              href="/"
              className={`${styles.navLink} ${isAddData ? styles.navItemActive : ""}`}
            >
              <span className={`${styles.navIcon} ${styles.navIconGrid}`} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className={styles.navLabel}>Add Data</span>
            </Link>
            <Link
              href="/threat-summary"
              className={`${styles.navLink} ${isThreatSummary ? styles.navItemActive : ""}`}
            >
              <span className={`${styles.navIcon} ${styles.navIconShield}`} aria-hidden="true">
                <span />
              </span>
              <span className={styles.navLabel}>Threat summary</span>
            </Link>
          </nav>
        </aside>

        <section className={styles.contentPane}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={onPrimaryAction}
              disabled={primaryDisabled || !onPrimaryAction}
            >
              {primaryLabel}
            </button>
          </div>

          {statusText ? <p className={styles.statusText}>{statusText}</p> : null}

          {children}
        </section>
      </div>
    </main>
  );
}
