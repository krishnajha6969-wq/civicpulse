'use client';

import React from 'react';
import Image from 'next/image';
import styles from './WorkflowSection.module.css';

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  imageSrc: string;
  width: number;
  height: number;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: '01',
    title: 'Report and receive a ticket',
    description: 'Submit the issue details, confirm its location and attach supporting photos.',
    imageSrc: '/images/workflow-01.png',
    width: 330,
    height: 260,
  },
  {
    number: '02',
    title: 'Review and prioritise',
    description: 'Identify related reports and assess urgency, with AI assistance and human review.',
    imageSrc: '/images/workflow-02.png',
    width: 300,
    height: 240,
  },
  {
    number: '03',
    title: 'Assign and coordinate',
    description: 'Route work to the responsible ward and plan suitable teams and resources.',
    imageSrc: '/images/workflow-03.png',
    width: 370,
    height: 235,
  },
  {
    number: '04',
    title: 'Verify and update',
    description: 'Review completion evidence, update linked tickets and notify affected citizens.',
    imageSrc: '/images/workflow-04.png',
    width: 330,
    height: 245,
  },
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className={styles.workflowSection} aria-labelledby="workflow-heading">
      <div className={`container ${styles.workflowContainer}`}>
        <div className={styles.header}>
          <h2 id="workflow-heading" className={styles.title}>
            From a report to the right response.
          </h2>
          <p className={styles.subtitle}>
            The planned workflow connects reporting, review, ward action and evidence-backed resolution.
          </p>
        </div>

        <div className={styles.workflowGrid}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>{step.number}</span>
                <div className={styles.stepText}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.description}</p>
                </div>
              </div>

              <div className={styles.illustrationWrapper}>
                <Image
                  src={step.imageSrc}
                  alt={`Workflow Step ${step.number}: ${step.title}`}
                  width={step.width}
                  height={step.height}
                  className={styles.illustrationImg}
                />
              </div>

              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={styles.connector} aria-hidden="true">
                  <span className={styles.connectorDot} />
                  <span className={styles.connectorLine} />
                  <span className={styles.connectorDot} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
