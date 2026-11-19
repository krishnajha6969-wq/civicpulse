'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  // Starts true immediately so no flash of landing page occurs
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 600);
  }, [exiting, onComplete]);

  useEffect(() => {
    // Exactly 1.8s duration before graceful transition
    const timer = setTimeout(() => {
      dismiss();
    }, 1800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.overlay} ${exiting ? styles.exiting : ''}`}
      onClick={dismiss}
      role="dialog"
      aria-label="CivicPulse Loading"
      aria-modal="true"
    >
      <div className={styles.content}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/loading-city-clean.png"
            alt="Mira Bhayandar 3D City Overview"
            width={720}
            height={380}
            priority
            className={styles.cityImage}
          />
        </div>

        <div className={styles.branding}>
          <h1 className={styles.title}>CivicPulse</h1>
          <p className={styles.subtitle}>PREPARING YOUR WORKSPACE</p>
          <div className={styles.dots} aria-label="Loading indicators">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>

      <div className={styles.skipHint} aria-hidden="true">
        Click or press ESC to proceed
      </div>
    </div>
  );
}
