'use client';

import React from 'react';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import { useMagneticProximity } from '../../hooks/useMagneticProximity';

interface HeroSectionProps {
  onReportClick: () => void;
  onExploreClick: () => void;
}

export default function HeroSection({
  onReportClick,
  onExploreClick,
}: HeroSectionProps) {
  const reportBtnRef = useMagneticProximity<HTMLButtonElement>();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">

      {/*
        ── BACKGROUND IMAGE ──────────────────────────────────────
        civicpulse-hero-bg.png: 1024×366 px, ratio 2.80:1
        This is the ACTUAL clean asset: dark navy on left, city on right.
        It contains NO baked-in text, navigation, or buttons.

        Rendering: next/image with fill=false, width/height set to the
        image's natural dimensions, styled to span 100% hero width at
        height auto. This preserves the aspect ratio and never distorts.

        The image is placed BEHIND the text layer via z-index.
        No gradient overlay is applied — the image's own navy area
        provides sufficient contrast for the white text.
        ────────────────────────────────────────────────────────── */}
      <div className={styles.heroBgWrapper} aria-hidden="true">
        <Image
          src="/images/civicpulse-hero-bg-2x.png"
          alt=""
          width={2048}
          height={732}
          priority
          className={styles.heroBgImg}
          sizes="100vw"
          quality={100}
        />
      </div>

      {/* ── HTML TEXT LAYER — sits above the background image ── */}
      <div className={styles.heroOverlay}>
        <div className={styles.heroContent}>

          <p className={styles.heroEyebrow}>
            AI-ASSISTED URBAN ISSUE PRIORITISATION &amp; RESOURCE ALLOCATION
          </p>

          <h1 id="hero-title" className={styles.heroHeading}>
            A better city starts<br />
            with the right priorities.
          </h1>

          <p className={styles.heroSubtitle}>
            CivicPulse is being built to connect citizen reports, ward teams and central oversight—supporting clearer priorities, better resource planning and transparent progress.
          </p>

          <div className={styles.heroActions}>
            <button
              ref={reportBtnRef}
              type="button"
              id="hero-report-btn"
              className={styles.primaryBtn}
              onClick={onReportClick}
              aria-label="Report an issue"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className={styles.btnIcon}
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>Report an issue</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={styles.arrowIcon}
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              type="button"
              id="hero-insights-btn"
              className={styles.secondaryBtn}
              onClick={onExploreClick}
              aria-label="Explore ward performance"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={styles.btnIcon}
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6"  y1="20" x2="6"  y2="14" />
              </svg>
              <span>Explore ward performance</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={styles.arrowIcon}
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
