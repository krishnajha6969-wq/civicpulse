'use client';

import React from 'react';
import styles from './SourcesSection.module.css';

interface PortalCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const PORTALS: PortalCard[] = [
  {
    id: 'citizen',
    title: 'Citizen portal',
    description: 'Report an issue with its location and photos, receive a ticket and follow progress.',
    badge: 'Public Access',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11v3" />
        <line x1="10.5" y1="12.5" x2="13.5" y2="12.5" />
      </svg>
    ),
  },
  {
    id: 'ward',
    title: 'Ward operations',
    description: 'Manage assigned work, record progress and submit evidence of completion.',
    badge: 'Ward Staff',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'admin',
    title: 'Central administration',
    description: 'Review related reports, assess priorities and coordinate available resources.',
    badge: 'Central Oversight',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="14" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
  },
];

export default function SourcesSection() {
  return (
    <section className={styles.sourcesSection} aria-labelledby="sources-heading">
      <div className={`container ${styles.sourcesContainer}`}>
        <div className={styles.sourcesHeader}>
          <h2 id="sources-heading" className={styles.sourcesTitle}>
            One platform. Three connected portals.
          </h2>
          <p className={styles.sourcesSubtitle}>
            Designed to connect citizen reports, authorised staff submissions and approved data imports through one shared workflow.
          </p>
        </div>

        <div className={styles.sourcesGrid}>
          {PORTALS.map((portal) => (
            <div key={portal.id} className={styles.sourceCard}>
              <div className={styles.iconContainer}>
                <div className={styles.iconCircle}>
                  {portal.icon}
                </div>
                <span className={styles.portalTag}>{portal.badge}</span>
              </div>
              <h3 className={styles.cardTitle}>{portal.title}</h3>
              <p className={styles.cardDesc}>{portal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
