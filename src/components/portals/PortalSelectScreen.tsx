'use client';

import React, { useEffect, useRef } from 'react';
import styles from './PortalSelectScreen.module.css';

interface PortalSelectScreenProps {
  onClose: () => void;
  destination?: string;
  onCitizenLogin: () => void;
  onCitizenRegister: () => void;
  onWardLogin: () => void;
  onAdminLogin: () => void;
}

// ── Reusable icon helpers ─────────────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="14" y2="13" />
    </svg>
  );
}
function TrackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function CheckFileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function AIIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PortalSelectScreen({
  onClose,
  destination,
  onCitizenLogin,
  onCitizenRegister,
  onWardLogin,
  onAdminLogin,
}: PortalSelectScreenProps) {
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstFocusRef.current?.focus(), 50);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'Tab' && wrapperRef.current) {
        const focusable = wrapperRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  const destLabel =
    destination === 'report' ? 'Continuing to: Report an issue' :
    destination === 'track'  ? 'Continuing to: Track report'    : null;

  return (
    <div
      ref={wrapperRef}
      className={styles.pageWrapper}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your portal"
    >
      {/*
        NOTE: The city background is set via CSS ::before on .pageWrapper
        using the CLEAN aerial city image (civicpulse-hero-bg-2x.png).
        There is NO background rendered here in JSX to avoid duplicate layers.
      */}

      <div className={styles.contentLayer}>

        {/* ── Top Bar ── */}
        <header className={styles.topBar}>
          <div className={styles.brand} aria-label="CivicPulse">
            <svg
              className={styles.brandIcon}
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className={styles.brandName}>CivicPulse</span>
          </div>

          <button
            type="button"
            className={styles.backBtn}
            onClick={onClose}
            aria-label="Back to home"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to home
          </button>
        </header>

        {/* ── Heading ── */}
        <section className={styles.headingSection}>
          <div className={styles.getStartedPill}>
            <span className={styles.getStartedDot} aria-hidden="true" />
            Get Started
          </div>

          <h1 className={styles.mainHeading}>
            Choose your{' '}
            <span className={styles.portalAccent}>portal</span>
          </h1>

          <p className={styles.mainSubtitle}>
            Different roles. A common goal — a cleaner, safer and stronger city.
          </p>

          {destLabel && (
            <div>
              <span className={styles.destBanner} role="status">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {destLabel}
              </span>
            </div>
          )}
        </section>

        {/* ── Cards Grid ── */}
        <section className={styles.cardsSection} aria-label="Portal options">
          <div className={styles.cardsGrid} role="list">

            {/* ── 1. Citizen Portal ── */}
            <article className={`${styles.card} ${styles.cardCitizen}`} role="listitem">
              <div className={styles.illustrationWrapper}>
                <img
                  src="/images/portals/citizen-card-head@2x.jpg"
                  alt="Citizen reporting illustration: smartphone with location pin and issue report"
                  className={styles.illustrationImg}
                  width={572} height={340}
                />
                <div className={styles.illustrationFade} aria-hidden="true" />
              </div>

              <div className={styles.cardBody}>
                <button
                  type="button"
                  className={styles.cardTitleBtn}
                  onClick={onCitizenLogin}
                >
                  Citizen Portal <span className={styles.titleArrow}>→</span>
                </button>
                <p className={styles.cardDesc}>
                  Report local issues and track their progress in real-time.
                </p>

                <div className={styles.featureBox}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><UserIcon /></span>
                    Register / Sign in as a citizen
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><CameraIcon /></span>
                    Report issues with photo &amp; location
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><TicketIcon /></span>
                    Get a unique ticket ID
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><TrackIcon /></span>
                    Track status and updates
                  </div>
                </div>

                <button
                  ref={firstFocusRef}
                  type="button"
                  id="portal-citizen-login-btn"
                  className={`${styles.ctaBtn} ${styles.ctaCitizen}`}
                  onClick={onCitizenLogin}
                >
                  Continue as Citizen <span className={styles.ctaArrow}>→</span>
                </button>

                <button
                  type="button"
                  id="portal-citizen-register-btn"
                  className={styles.subBtn}
                  onClick={onCitizenRegister}
                >
                  New here? Create an account
                </button>
              </div>
            </article>

            {/* ── 2. Ward Staff Portal ── */}
            <article className={`${styles.card} ${styles.cardWard}`} role="listitem">
              <div className={styles.illustrationWrapper}>
                <img
                  src="/images/portals/ward-card-head@2x.jpg"
                  alt="Ward staff illustration: municipal maintenance vehicle and field team"
                  className={styles.illustrationImg}
                  width={572} height={340}
                />
                <div className={styles.illustrationFade} aria-hidden="true" />
              </div>

              <div className={styles.cardBody}>
                <button
                  type="button"
                  className={styles.cardTitleBtn}
                  onClick={onWardLogin}
                >
                  Ward Staff Portal <span className={styles.titleArrow}>→</span>
                </button>
                <p className={styles.cardDesc}>
                  Manage assigned tasks and update work progress.
                </p>

                <div className={styles.featureBox}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><UserIcon /></span>
                    Sign in as authorised staff
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><FileIcon /></span>
                    View assigned issues
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><CameraIcon /></span>
                    Update status with photos
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><CheckFileIcon /></span>
                    Submit work completion reports
                  </div>
                </div>

                <button
                  type="button"
                  id="portal-ward-login-btn"
                  className={`${styles.ctaBtn} ${styles.ctaWard}`}
                  onClick={onWardLogin}
                >
                  Continue as Staff <span className={styles.ctaArrow}>→</span>
                </button>

                <div className={styles.accessNote} role="note">
                  <LockIcon />
                  Access restricted to authorised ward staff
                </div>
              </div>
            </article>

            {/* ── 3. Super Admin Portal ── */}
            <article className={`${styles.card} ${styles.cardAdmin}`} role="listitem">
              <div className={styles.illustrationWrapper}>
                <img
                  src="/images/portals/admin-card-head@2x.jpg"
                  alt="Super admin illustration: city analytics dashboard and monitoring screens"
                  className={styles.illustrationImg}
                  width={572} height={340}
                />
                <div className={styles.illustrationFade} aria-hidden="true" />
              </div>

              <div className={styles.cardBody}>
                <button
                  type="button"
                  className={styles.cardTitleBtn}
                  onClick={onAdminLogin}
                >
                  Super Admin Portal <span className={styles.titleArrow}>→</span>
                </button>
                <p className={styles.cardDesc}>
                  Oversee all wards, allocate resources and monitor city-wide progress.
                </p>

                <div className={styles.featureBox}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><ShieldIcon /></span>
                    Sign in as Super Admin
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><GlobeIcon /></span>
                    View reports from all wards
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><AIIcon /></span>
                    AI-based priority recommendations
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureIcon}><TeamIcon /></span>
                    Manage resources and teams
                  </div>
                </div>

                <button
                  type="button"
                  id="portal-admin-login-btn"
                  className={`${styles.ctaBtn} ${styles.ctaAdmin}`}
                  onClick={onAdminLogin}
                >
                  Continue as Super Admin <span className={styles.ctaArrow}>→</span>
                </button>

                <div className={styles.accessNote} role="note">
                  <LockIcon />
                  Access restricted to authorised administrators
                </div>
              </div>
            </article>

          </div>
        </section>

        {/* ── Bottom Banner ── */}
        <section className={styles.bottomBanner} aria-label="CivicPulse platform summary">
          <div className={styles.bannerInner}>
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIconBox} aria-hidden="true">
                <TargetIcon />
              </div>
              <div className={styles.bannerCopy}>
                <div className={styles.bannerTitle}>One platform. A better city.</div>
                <p className={styles.bannerText}>
                  Whether you&apos;re a citizen, ward staff or administrator — CivicPulse
                  brings everyone together for a cleaner, safer and more liveable city.
                </p>
              </div>
            </div>

            <div className={styles.bannerDivider} aria-hidden="true" />

            <div className={styles.bannerPillars}>
              <div className={styles.pillar}>
                <span className={styles.pillarIconGreen}><LeafIcon /></span>
                Cleaner Neighbourhoods
              </div>
              <div className={styles.pillar}>
                <span className={styles.pillarIconBlue}><PeopleIcon /></span>
                Safer Communities
              </div>
              <div className={styles.pillar}>
                <span className={styles.pillarIconPurple}><ChartIcon /></span>
                A Stronger Tomorrow
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
