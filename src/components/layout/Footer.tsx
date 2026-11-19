'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

interface FooterProps {
  onOpenNotice: (title: string, message: string, stageNote: string, badge?: string) => void;
  onReportClick: () => void;
  onWardPerformanceClick?: () => void;
  onTrackTicketClick?: () => void;
  onCitizenSignInClick?: () => void;
  onSuperAdminClick?: () => void;
}

export default function Footer({
  onOpenNotice,
  onReportClick,
  onWardPerformanceClick,
  onTrackTicketClick,
  onCitizenSignInClick,
  onSuperAdminClick,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerOffset = 70;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  const handleWardPerformance = () => {
    if (onWardPerformanceClick) {
      onWardPerformanceClick();
    } else {
      onOpenNotice(
        'Ward performance is not available yet.',
        'This view will show aggregate results once reporting and resolution records are available.',
        'Planned for pilot ward reporting release',
        'Concept Preview'
      );
    }
  };

  const handleTrackTicket = () => {
    if (onTrackTicketClick) {
      onTrackTicketClick();
    } else {
      onOpenNotice(
        'Citizen authentication required',
        'Log in to view your tickets and follow their progress.',
        'Citizen Services'
      );
    }
  };

  return (
    <footer className={styles.footer} aria-label="Site Footer">
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.topRow}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo} aria-label="CivicPulse Home">
              <span className={styles.logoPulse}>
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5cebaa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </span>
              <span className={styles.logoText}>CivicPulse</span>
            </Link>

            <p className={styles.brandTagline}>
              AI-assisted urban issue prioritisation and resource allocation.
            </p>
            <p className={styles.brandMotto}>
              Connecting citizen reporting, ward operations and central oversight.
            </p>
          </div>

          {/* Links Grid */}
          <div className={styles.linksGrid}>
            {/* Col 1: Explore */}
            <div className={styles.col}>
              <h3 className={styles.colTitle}>EXPLORE</h3>
              <ul className={styles.linksList}>
                <li>
                  <a
                    href="#workflow"
                    onClick={(e) => handleLinkClick(e, '#workflow')}
                    className={styles.link}
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#categories"
                    onClick={(e) => handleLinkClick(e, '#categories')}
                    className={styles.link}
                  >
                    Issue categories
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleWardPerformance}
                    className={styles.linkBtn}
                  >
                    Ward performance
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 2: Citizen Services */}
            <div className={styles.col}>
              <h3 className={styles.colTitle}>CITIZEN SERVICES</h3>
              <ul className={styles.linksList}>
                <li>
                  <button
                    type="button"
                    onClick={onReportClick}
                    className={styles.linkBtn}
                  >
                    Report an issue
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleTrackTicket}
                    className={styles.linkBtn}
                  >
                    My tickets
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onCitizenSignInClick}
                    className={styles.linkBtn}
                  >
                    Citizen sign in
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Platform */}
            <div className={styles.col}>
              <h3 className={styles.colTitle}>PLATFORM</h3>
              <ul className={styles.linksList}>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenNotice(
                        'About CivicPulse',
                        'CivicPulse is an academic prototype for AI-based urban issue prioritisation and resource allocation in Mira Bhayandar. Not an official MBMC service.',
                        'Academic Prototype',
                        'Platform'
                      )
                    }
                    className={styles.linkBtn}
                  >
                    About CivicPulse
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenNotice(
                        'Prioritisation approach',
                        'Issues are weighted objectively based on severity, citizen impact, and waiting time to assist coordination without replacing human judgment.',
                        'Decision Support',
                        'Methodology'
                      )
                    }
                    className={styles.linkBtn}
                  >
                    Prioritisation approach
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onSuperAdminClick}
                    className={styles.linkBtn}
                  >
                    Super Admin sign in
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Project Note */}
        <div className={styles.projectNoteRow}>
          <p className={styles.projectNote}>
            An academic prototype for Mira Bhayandar. Not an official MBMC service.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomRow}>
          <p className={styles.copyright}>&copy; {currentYear} CivicPulse.</p>

          <div className={styles.legalLinks}>
            <button
              type="button"
              className={styles.legalBtn}
              onClick={() =>
                onOpenNotice(
                  'Privacy Policy Requirement',
                  'Formal privacy and data handling policies are required before enabling public production registration. In this academic prototype, test data is handled confidentially.',
                  'Pre-Registration Requirement',
                  'Policy'
                )
              }
            >
              Privacy policy
            </button>
            <span className={styles.legalDivider}>|</span>
            <button
              type="button"
              className={styles.legalBtn}
              onClick={() =>
                onOpenNotice(
                  'Terms of Service Requirement',
                  'Terms of service will govern official municipal issue reporting upon deployment. This prototype demonstrates prioritisation algorithms and workflows.',
                  'Pre-Registration Requirement',
                  'Terms'
                )
              }
            >
              Terms of use
            </button>
            <span className={styles.legalDivider}>|</span>
            <button
              type="button"
              className={styles.backToTopBtn}
              onClick={scrollToTop}
              aria-label="Back to top"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
