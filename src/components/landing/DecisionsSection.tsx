'use client';

import React, { useState } from 'react';
import styles from './DecisionsSection.module.css';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconSvg: React.ReactNode;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'priorities',
    title: 'Explainable priorities',
    description: 'Review the factors behind a suggested priority, including impact and waiting time.',
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'grouped',
    title: 'Related reports, one issue',
    description: 'Link reports about the same problem while preserving every citizen’s ticket.',
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'resources',
    title: 'Resource coordination',
    description: 'Plan work around team skills, equipment and available capacity.',
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'accountability',
    title: 'Ward accountability',
    description: 'Review aggregate pending and resolved issues, turnaround times and recurring problems.',
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="3" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="21" />
        <line x1="3" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
];

export default function DecisionsSection() {
  const [activeFeature, setActiveFeature] = useState('priorities');

  return (
    <section className={styles.decisionsSection} aria-labelledby="decisions-heading">
      <div className={`container ${styles.decisionsContainer}`}>
        <div className={styles.sectionHeader}>
          <h2 id="decisions-heading" className={styles.sectionTitle}>
            Better decisions behind every response.
          </h2>
          <p className={styles.sectionSubtitle}>
            Capabilities planned for the connected CivicPulse workflow.
          </p>
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column: Interactive Feature Cards */}
          <div className={styles.featuresList}>
            {FEATURES.map((item) => {
              const isActive = activeFeature === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.featureItem} ${isActive ? styles.featureActive : ''}`}
                  onClick={() => setActiveFeature(item.id)}
                  aria-pressed={isActive}
                >
                  <div className={styles.iconBox} aria-hidden="true">
                    {item.iconSvg}
                  </div>
                  <div className={styles.textBox}>
                    <h3 className={styles.featureTitle}>{item.title}</h3>
                    <p className={styles.featureDesc}>{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Native Explanatory Panel (Concept Preview) */}
          <div className={styles.mockupWrapper}>
            <div className={styles.mockupCard}>
              <div className={styles.mockupTopBar}>
                <div className={styles.panelDots} aria-hidden="true">
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <span className={styles.disclaimerBadge}>Concept preview</span>
              </div>

              <div className={styles.panelContent}>
                {activeFeature === 'priorities' && (
                  <div className={styles.conceptView}>
                    <div className={styles.conceptHeader}>
                      <span className={styles.conceptKicker}>DECISION SUPPORT</span>
                      <h4 className={styles.conceptTitle}>Explainable Priority Model</h4>
                      <p className={styles.conceptDesc}>
                        Factors evaluated collaboratively by AI assessment and human oversight.
                      </p>
                    </div>

                    <div className={styles.factorsList}>
                      <div className={styles.factorItem}>
                        <div className={styles.factorLabelWrap}>
                          <span className={styles.factorDot} />
                          <span className={styles.factorName}>Public Safety &amp; Severity</span>
                        </div>
                        <span className={styles.factorStatus}>Evaluated Factor</span>
                      </div>
                      <div className={styles.factorItem}>
                        <div className={styles.factorLabelWrap}>
                          <span className={styles.factorDot} />
                          <span className={styles.factorName}>Citizen Impact &amp; Footfall</span>
                        </div>
                        <span className={styles.factorStatus}>Evaluated Factor</span>
                      </div>
                      <div className={styles.factorItem}>
                        <div className={styles.factorLabelWrap}>
                          <span className={styles.factorDot} />
                          <span className={styles.factorName}>Elapsed Waiting Time</span>
                        </div>
                        <span className={styles.factorStatus}>Dynamic Escalation</span>
                      </div>
                      <div className={styles.factorItem}>
                        <div className={styles.factorLabelWrap}>
                          <span className={styles.factorDot} />
                          <span className={styles.factorName}>Historical Ward Recurrence</span>
                        </div>
                        <span className={styles.factorStatus}>Context Factor</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 'grouped' && (
                  <div className={styles.conceptView}>
                    <div className={styles.conceptHeader}>
                      <span className={styles.conceptKicker}>REPORT CLUSTERING</span>
                      <h4 className={styles.conceptTitle}>Related Reports, One Issue</h4>
                      <p className={styles.conceptDesc}>
                        Multiple reports for the same incident link together while preserving individual tickets.
                      </p>
                    </div>

                    <div className={styles.groupingSchema}>
                      <div className={styles.clusterBox}>
                        <span className={styles.clusterTag}>Primary Coordination Unit</span>
                        <div className={styles.linkedTicketsGrid}>
                          <div className={styles.linkedTicket}>Citizen Ticket A (Preserved)</div>
                          <div className={styles.linkedTicket}>Citizen Ticket B (Preserved)</div>
                          <div className={styles.linkedTicket}>Citizen Ticket C (Preserved)</div>
                        </div>
                        <p className={styles.clusterNote}>
                          Updates made to the primary work order notify all linked citizens simultaneously.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 'resources' && (
                  <div className={styles.conceptView}>
                    <div className={styles.conceptHeader}>
                      <span className={styles.conceptKicker}>CAPACITY MATCHING</span>
                      <h4 className={styles.conceptTitle}>Resource Coordination</h4>
                      <p className={styles.conceptDesc}>
                        Match assigned tasks to team specialisation, required equipment and ward capacity.
                      </p>
                    </div>

                    <div className={styles.resourceGrid}>
                      <div className={styles.resourceCard}>
                        <span className={styles.resourceType}>Team Skill Matching</span>
                        <span className={styles.resourceDetail}>Pothole repair, electrical or drainage teams</span>
                      </div>
                      <div className={styles.resourceCard}>
                        <span className={styles.resourceType}>Equipment Availability</span>
                        <span className={styles.resourceDetail}>Required machinery and safety equipment</span>
                      </div>
                      <div className={styles.resourceCard}>
                        <span className={styles.resourceType}>Ward Capacity Planning</span>
                        <span className={styles.resourceDetail}>Preventing overload through coordinated dispatch</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeature === 'accountability' && (
                  <div className={styles.conceptView}>
                    <div className={styles.conceptHeader}>
                      <span className={styles.conceptKicker}>WARD INSIGHTS</span>
                      <h4 className={styles.conceptTitle}>Ward Accountability</h4>
                      <p className={styles.conceptDesc}>
                        Planned pilot ward performance metrics and aggregate progress tracking.
                      </p>
                    </div>

                    <div className={styles.accountabilityList}>
                      <div className={styles.accountabilityItem}>
                        <span className={styles.metricName}>Aggregate Ticket Volumes</span>
                        <span className={styles.metricDesc}>Track pending vs. resolved issues across pilot wards</span>
                      </div>
                      <div className={styles.accountabilityItem}>
                        <span className={styles.metricName}>Turnaround Time Trends</span>
                        <span className={styles.metricDesc}>Measure resolution pace from initial intake to verification</span>
                      </div>
                      <div className={styles.accountabilityItem}>
                        <span className={styles.metricName}>Recurring Hotspots</span>
                        <span className={styles.metricDesc}>Identify persistent infrastructure failures for permanent fixes</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
