'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerCitizen } from '../../lib/auth';
import styles from './AuthLayout.module.css';

interface CitizenRegisterProps {
  onBackToHome: () => void;
  onGoToLogin: () => void;
  intendedDestination?: string;
}

export default function CitizenRegister({
  onBackToHome,
  onGoToLogin,
  intendedDestination,
}: CitizenRegisterProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!fullName.trim()) {
      setNameError('Please enter your full name');
      valid = false;
    } else {
      setNameError('');
    }

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
      setPasswordError('Please create a password');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }

    if (!agreedToTerms) {
      setTermsError('You must agree to the Terms of Use and Privacy Policy');
      valid = false;
    } else {
      setTermsError('');
    }

    if (valid) {
      registerCitizen(fullName, email);
      let target = '/citizen';
      if (intendedDestination === 'report') {
        target = '/citizen/report-issue';
      } else if (intendedDestination === 'track') {
        target = '/citizen#recent-reports-panel';
      } else if (intendedDestination?.startsWith('/')) {
        target = intendedDestination;
      }
      router.push(target);
    }
  };

  const handleGoogleClick = () => {
    setPendingNotice('Google sign-in is not available yet.');
  };

  const handlePolicyNotice = (e: React.MouseEvent) => {
    e.preventDefault();
    setPendingNotice(
      'Formal policy documents are required prior to public registration. In this academic prototype, test data is handled confidentially.'
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
        {/* Left Column with City Artwork */}
        <section
          className={styles.leftCol}
          style={{ backgroundImage: `url('/images/auth-citizen-clean.png')` }}
          aria-label="Citizen portal overview"
        >
          <div className={styles.leftColOverlay} />
          <div className={styles.leftTextContent}>
            <p className={styles.portalEyebrow}>CITIZEN PORTAL</p>
            <h1 className={styles.portalHeading}>
              Your voice.<br />A better neighbourhood.
            </h1>
            <p className={styles.portalSubtitle}>
              Create an account to report local issues and follow their progress.
            </p>
          </div>
        </section>

        {/* Right Column with Form Card */}
        <section className={styles.rightCol} aria-label="Citizen Registration Form">
          <div className={styles.formCard}>
            <div className={styles.topPrompt}>
              <span>Already registered?</span>
              <button
                type="button"
                className={styles.switchLink}
                onClick={onGoToLogin}
              >
                Log in
              </button>
            </div>

            {/* Contextual Banners - only when arriving from a specific action */}
            {intendedDestination === 'report' && (
              <div className={styles.destinationBanner} role="status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Create an account to report an issue.</span>
              </div>
            )}

            {intendedDestination === 'track' && (
              <div className={styles.destinationBanner} role="status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Create an account to track your tickets.</span>
              </div>
            )}

            {intendedDestination === 'insights' && (
              <div className={styles.destinationBanner} role="status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Create an account to access ward updates.</span>
              </div>
            )}

            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Create your account</h2>
              {/* Does not duplicate the contextual banner */}
              <p className={styles.cardSubtitle}>
                {intendedDestination ? 'Fill in your details to get started.' : 'Get started with CivicPulse.'}
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleClick}
              aria-label="Continue with Google (Not available yet)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerSpan}>or register with email</span>
            </div>

            {/* Email / Password Registration Form */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="reg-name" className={styles.label}>
                  Full name
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={`${styles.input} ${nameError ? styles.inputError : ''}`}
                    aria-describedby={nameError ? 'reg-name-err' : undefined}
                  />
                </div>
                {nameError && (
                  <span id="reg-name-err" className={styles.errorMessage} role="alert">
                    {nameError}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-email" className={styles.label}>
                  Email address
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                    aria-describedby={emailError ? 'reg-email-err' : undefined}
                  />
                </div>
                {emailError && (
                  <span id="reg-email-err" className={styles.errorMessage} role="alert">
                    {emailError}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Create a strong password (min. 8 chars)"
                    autoComplete="new-password"
                    className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                    aria-describedby={passwordError ? 'reg-password-err' : undefined}
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
                  <span id="reg-password-err" className={styles.errorMessage} role="alert">
                    {passwordError}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-confirm" className={styles.label}>
                  Confirm password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmError) setConfirmError('');
                    }}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className={`${styles.input} ${confirmError ? styles.inputError : ''}`}
                    aria-describedby={confirmError ? 'reg-confirm-err' : undefined}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
                {confirmError && (
                  <span id="reg-confirm-err" className={styles.errorMessage} role="alert">
                    {confirmError}
                  </span>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className={styles.termsGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (termsError) setTermsError('');
                    }}
                    className={styles.checkbox}
                  />
                  <span>
                    I agree to the{' '}
                    <button type="button" className={styles.termsLink} onClick={handlePolicyNotice}>
                      Terms of Use
                    </button>{' '}
                    and{' '}
                    <button type="button" className={styles.termsLink} onClick={handlePolicyNotice}>
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {termsError && (
                  <span className={styles.errorMessage} role="alert">
                    {termsError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                aria-label="Create citizen account"
              >
                <span>Create account</span>
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
          </div>
        </section>
      </main>

      <footer className={styles.pageFooter}>
        <span>&copy; {new Date().getFullYear()} CivicPulse.</span>
      </footer>
    </div>
  );
}
