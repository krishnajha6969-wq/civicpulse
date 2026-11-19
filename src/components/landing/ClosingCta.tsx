'use client';

import React from 'react';
import Image from 'next/image';
import styles from './ClosingCta.module.css';
import { useMagneticProximity } from '../../hooks/useMagneticProximity';

interface ClosingCtaProps {
  onReportClick: () => void;
  onTrackClick: () => void;
}

export default function ClosingCta({
  onReportClick,
  onTrackClick,
}: ClosingCtaProps) {
  const reportBtnRef = useMagneticProximity<HTMLButtonElement>();

  return (
    <section className={styles.ctaSection} aria-labelledby="cta-heading">
      {/* Background Blueprint Map Pattern */}
      <div className={styles.bgWrapper} aria-hidden="true">
        <Image
          src="/images/cta-background.png"
          alt=""
          fill
          className={styles.bgImage}
          priority={false}
        />
        <div className={styles.gradientFade} />
      </div>

      <div className={`container ${styles.ctaContainer}`}>
        <div className={styles.contentLeft}>
          <span className={styles.tag}>CIVICPULSE</span>
          <h2 id="cta-heading" className={styles.heading}>
            Better decisions.<br />Stronger neighbourhoods.
          </h2>
          <p className={styles.subheading}>
            A connected approach to reporting local issues, coordinating action and making progress visible.
          </p>
        </div>

        <div className={styles.actionsRight}>
          <button
            ref={reportBtnRef}
            type="button"
            className={styles.ctaBtn}
            onClick={onReportClick}
            aria-label="Report an issue"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className={styles.btnIcon}
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Report an issue</span>
            <svg
              width="16"
              height="16"
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
            className={styles.trackLink}
            onClick={onTrackClick}
          >
            Track your ticket
          </button>
        </div>
      </div>
    </section>
  );
}
