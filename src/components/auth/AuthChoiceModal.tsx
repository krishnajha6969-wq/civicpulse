'use client';

import React, { useEffect, useRef } from 'react';
import styles from './AuthChoiceModal.module.css';

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLogin: () => void;
  onSelectRegister: () => void;
  onSelectSuperAdmin: () => void;
  destination?: string;
}

export default function AuthChoiceModal({
  isOpen,
  onClose,
  onSelectLogin,
  onSelectRegister,
  onSelectSuperAdmin,
  destination = 'report',
}: AuthChoiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  let badgeText = '';
  let headingText = 'Report an issue';
  let subtitleText = 'Log in or create an account to report an issue and follow its progress.';
  let loginDesc = 'Already have an account? Continue here.';

  if (destination === 'track') {
    badgeText = 'Citizen Tracking';
    headingText = 'Track your ticket';
    subtitleText = 'Log in to view your tickets and follow their progress.';
    loginDesc = 'Sign in to view your tickets';
  } else if (destination === 'insights') {
    badgeText = 'Ward Performance';
    headingText = 'Ward performance';
    subtitleText = 'Log in or create an account to follow ward activities.';
    loginDesc = 'Sign in to explore ward updates';
  }

  // Escape key listener & focus management with containment
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      firstActionRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-choice-title"
      >
        {/* Header with Logo and Close */}
        <div className={styles.modalHeader}>
          <div className={styles.brand}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5cebaa"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className={styles.brandName}>CivicPulse</span>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.bodyContent}>
          {/* Avatar / Feature Icon Circle */}
          <div className={styles.avatarCircle} aria-hidden="true">
            {destination === 'insights' ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            ) : destination === 'track' ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ) : (
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>

          {badgeText && <span className={styles.badge}>{badgeText}</span>}

          <h2 id="auth-choice-title" className={styles.title}>
            {headingText}
          </h2>
          <p className={styles.subtitle}>
            {subtitleText}
          </p>

          {/* Action Choice Cards */}
          <div className={styles.choices}>
            {/* Log In Card (Mint surface) */}
            <button
              ref={firstActionRef}
              type="button"
              className={styles.loginCard}
              onClick={onSelectLogin}
            >
              <div className={styles.cardLeft}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.cardIconMint}
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <div className={styles.cardText}>
                  <span className={styles.loginTitle}>Log In</span>
                  <span className={styles.loginDesc}>{loginDesc}</span>
                </div>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.cardArrowMint}
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Create Account Card (Dark bordered surface) */}
            <button
              type="button"
              className={styles.registerCard}
              onClick={onSelectRegister}
            >
              <div className={styles.cardLeft}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.cardIconDark}
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <div className={styles.cardText}>
                  <span className={styles.registerTitle}>Create Account</span>
                  <span className={styles.registerDesc}>New to CivicPulse? Register to get started.</span>
                </div>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.cardArrowDark}
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Back to Home Link */}
          <button
            type="button"
            className={styles.homeLinkBtn}
            onClick={onClose}
          >
            Back to home
          </button>

          {/* Super Admin / Staff Link */}
          <div className={styles.footerNote}>
            <span>For authorised teams</span>
            <button
              type="button"
              className={styles.adminLink}
              onClick={onSelectSuperAdmin}
            >
              <span>Super Admin sign in</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
