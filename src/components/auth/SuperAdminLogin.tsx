'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginSuperAdmin } from '../../lib/auth';
import styles from './AuthLayout.module.css';

interface SuperAdminLoginProps {
  onBackToHome: () => void;
  onGoToCitizenLogin: () => void;
}

export default function SuperAdminLogin({
  onBackToHome,
  onGoToCitizenLogin,
}: SuperAdminLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Please enter your password');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (valid) {
      loginSuperAdmin();
      router.push('/admin/dashboard');
    }
  };

  const handleForgotClick = () => {
    setPendingNotice(
      'Administrative credential recovery is not available yet. Please contact system operations for assistance.'
    );
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Bar */}
      <header className={styles.topBar}>
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
          className={styles.backHomeBtn}
          onClick={onBackToHome}
          aria-label="Back to home page"
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
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Back to home</span>
        </button>
      </header>

      {/* Main Two-Column Layout */}
      <main className={styles.mainGrid}>
        {/* Left Column with Night Municipal Staff Artwork */}
        <section
          className={styles.leftCol}
          style={{ backgroundImage: `url('/images/auth-admin-clean.png')` }}
          aria-label="Central administration overview"
        >
          <div className={styles.leftColOverlay} />
          <div className={styles.leftTextContent}>
            <p className={styles.portalEyebrow}>CENTRAL ADMINISTRATION</p>
            <h1 className={styles.portalHeading}>
              Clear priorities.<br />Coordinated action.
            </h1>
            <p className={styles.portalSubtitle}>
              Review incoming issues, coordinate ward assignments and oversee progress.
            </p>
          </div>
        </section>

        {/* Right Column with Form Card */}
        <section className={styles.rightCol} aria-label="Super Admin Sign In Form">
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={styles.shieldIconWrap} aria-hidden="true">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 className={`${styles.cardTitle} ${styles.cardTitleCenter}`}>
                Super Admin sign in
              </h2>
              <p className={`${styles.cardSubtitle} ${styles.cardSubtitleCenter}`}>
                Restricted access for authorised central administration.
              </p>
            </div>

            {/* Email / Password Form (No role selector, no public registration) */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="admin-email" className={styles.label}>
                  Email address
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                    aria-describedby={emailError ? 'admin-email-err' : undefined}
                  />
                </div>
                {emailError && (
                  <span id="admin-email-err" className={styles.errorMessage} role="alert">
                    {emailError}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldRowBetween}>
                  <label htmlFor="admin-password" className={styles.label}>
                    Password
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={handleForgotClick}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                    aria-describedby={passwordError ? 'admin-password-err' : undefined}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <span id="admin-password-err" className={styles.errorMessage} role="alert">
                    {passwordError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                aria-label="Sign in as Super Admin"
              >
                <span>Sign in</span>
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
                  className={styles.submitArrow}
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            {/* Pending Notice Banner */}
            {pendingNotice && (
              <div className={styles.backendPendingBanner} role="status">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.pendingIcon}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className={styles.pendingText}>
                  <strong>Notice: </strong>
                  {pendingNotice}
                </div>
              </div>
            )}

            {/* Citizen Switch */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                className={styles.cardFooterAction}
                onClick={onGoToCitizenLogin}
              >
                <span>Citizen sign in</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.pageFooter}>
        <span>&copy; {new Date().getFullYear()} CivicPulse.</span>
      </footer>
    </div>
  );
}
