'use client';

import React, { useEffect } from 'react';
import styles from './NoticeModal.module.css';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  message: string;
  stageNote?: string;
}

export default function NoticeModal({
  isOpen,
  onClose,
  title,
  badge = 'Upcoming Stage',
  message,
  stageNote,
}: NoticeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.badge}>{badge}</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.iconCircle}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 id="notice-modal-title" className={styles.title}>
            {title}
          </h3>
          <p className={styles.message}>{message}</p>
          {stageNote && (
            <div className={styles.stageNoteBox}>
              <span className={styles.stageDot} />
              <span>{stageNote}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.primaryBtn} onClick={onClose}>
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
}
