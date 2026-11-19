'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

interface NavbarProps {
  onOpenNotice: (title: string, message: string, stageNote: string, badge?: string) => void;
  onWardPerformanceClick?: () => void;
  onTrackTicketClick?: () => void;
  onCitizenSignInClick?: () => void;
}

export default function Navbar({
  onOpenNotice,
  onWardPerformanceClick,
  onTrackTicketClick,
  onCitizenSignInClick,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
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

  const handleWardPerformance = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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

  const handleTrackTicket = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onTrackTicketClick) {
      onTrackTicketClick();
    } else {
      onOpenNotice(
        'Track ticket requires login',
        'Please sign in to your citizen account to track active tickets and resolution updates.',
        'Citizen Services'
      );
    }
  };

  const handleCitizenSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onCitizenSignInClick) {
      onCitizenSignInClick();
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo} aria-label="CivicPulse Home">
          <span className={styles.logoPulse}>
            <svg
              width="24"
              height="24"
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

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <a
            href="#workflow"
            className={styles.navLink}
            onClick={(e) => handleLinkClick(e, '#workflow')}
          >
            How it works
          </a>
          <button
            type="button"
            className={styles.navLinkBtn}
            onClick={handleWardPerformance}
          >
            Ward performance
          </button>
          <button
            type="button"
            className={styles.navLinkBtn}
            onClick={handleTrackTicket}
          >
            Track ticket
          </button>
          <button
            type="button"
            className={styles.signInBtn}
            onClick={handleCitizenSignIn}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.signInIcon}
              aria-hidden="true"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Sign in</span>
          </button>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`${styles.hamburgerBar} ${mobileMenuOpen ? styles.barOpen1 : ''}`}
            />
            <span
              className={`${styles.hamburgerBar} ${mobileMenuOpen ? styles.barOpen2 : ''}`}
            />
            <span
              className={`${styles.hamburgerBar} ${mobileMenuOpen ? styles.barOpen3 : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className={styles.mobileNavLinks}>
          <a
            href="#workflow"
            className={styles.mobileNavLink}
            onClick={(e) => handleLinkClick(e, '#workflow')}
          >
            How it works
          </a>
          <button
            type="button"
            className={styles.mobileNavLinkBtn}
            onClick={handleWardPerformance}
          >
            Ward performance
          </button>
          <button
            type="button"
            className={styles.mobileNavLinkBtn}
            onClick={handleTrackTicket}
          >
            Track ticket
          </button>
          <button
            type="button"
            className={styles.mobileSignInBtn}
            onClick={handleCitizenSignIn}
          >
            <span>Sign in</span>
          </button>
        </div>
      </div>
    </header>
  );
}
