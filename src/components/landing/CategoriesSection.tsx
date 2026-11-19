'use client';

import React from 'react';
import styles from './CategoriesSection.module.css';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  color: string;
  iconBg: string;
  iconSvg: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'roads',
    name: 'Roads',
    description: 'Potholes, broken dividers, dangerous patches',
    color: '#f97316',
    iconBg: 'rgba(249, 115, 22, 0.12)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19L9 5h6l5 14" />
        <line x1="12" y1="8" x2="12" y2="10" strokeDasharray="2 2" />
        <line x1="12" y1="13" x2="12" y2="17" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: 'water',
    name: 'Water',
    description: 'Leaks, low pressure, supply issues',
    color: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.12)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 'waste',
    name: 'Waste',
    description: 'Overflowing bins, uncollected garbage',
    color: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.12)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
  },
  {
    id: 'streetlights',
    name: 'Streetlights',
    description: 'Non-functional lights, dark areas',
    color: '#c084fc',
    iconBg: 'rgba(192, 132, 252, 0.12)',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6a6 6 0 0 0-12 0c0 7 3 9 3 14h6c0-5 3-7 3-14z" />
        <line x1="9" y1="20" x2="15" y2="20" />
      </svg>
    ),
  },
];

export default function CategoriesSection() {
  return (
    <section id="categories" className={styles.categoriesSection} aria-label="Issue Categories">
      <div className={`container ${styles.categoriesContainer}`}>
        <div className={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className={styles.categoryCard}>
              <div
                className={styles.iconCircle}
                style={{
                  backgroundColor: cat.iconBg,
                  borderColor: `rgba(255, 255, 255, 0.15)`,
                }}
                aria-hidden="true"
              >
                {cat.iconSvg}
              </div>
              <div className={styles.categoryText}>
                <h2 className={styles.categoryTitle}>{cat.name}</h2>
                <p className={styles.categoryDesc}>{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
