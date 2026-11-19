'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './help-support.module.css';
import {
  SUPPORT_KPIS,
  INITIAL_FAQS,
  DOCUMENTATION_GUIDES,
  INITIAL_SUPPORT_TICKETS,
  SYSTEM_SERVICES_STATUS,
  SUPPORT_RESOURCES_LIST,
  FAQItem,
  DocumentationGuide,
  SupportTicket,
} from '../../../lib/admin';

export default function HelpSupportPage() {
  // Global & header state
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [headerSearch, setHeaderSearch] = useState('');

  // Help Search & Topic Filter
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string>('All');

  // FAQs State (Expand / Collapse)
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>(['faq-1']);

  // Support Tickets State & Filters
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('All');

  // Selected Ticket for Details View
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Selected Documentation Guide for Reader View
  const [selectedDoc, setSelectedDoc] = useState<DocumentationGuide | null>(null);

  // Modals
  const [createTicketModal, setCreateTicketModal] = useState(false);
  const [contactSupportModal, setContactSupportModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newModule, setNewModule] = useState('All Issues & City Map');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDescription, setNewDescription] = useState('');
  const [newEmail, setNewEmail] = useState('admin@civicpulse.in');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle FAQ accordion item
  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered FAQs based on search and selected popular topic
  const filteredFaqs = useMemo(() => {
    return INITIAL_FAQS.filter((faq) => {
      const matchesTopic = activeTopic === 'All' || faq.category.toLowerCase().includes(activeTopic.toLowerCase());
      const matchesSearch =
        !helpSearchQuery.trim() ||
        faq.question.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(helpSearchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [helpSearchQuery, activeTopic]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !ticketSearch.trim() ||
        t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.module.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchesStatus = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
      const matchesPriority = ticketPriorityFilter === 'All' || t.priority === ticketPriorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, ticketSearch, ticketStatusFilter, ticketPriorityFilter]);

  // Handle Ticket Submission
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('Please enter both subject and description.');
      return;
    }

    const ticketNumber = `CIV-00${tickets.length + 1}`;
    const newEntry: SupportTicket = {
      id: ticketNumber,
      subject: newSubject.trim(),
      module: newModule,
      priority: newPriority,
      status: 'Open',
      createdAt: '17 Nov 2026',
      updatedAt: '17 Nov 2026',
      description: newDescription.trim(),
      activity: [
        {
          date: '17 Nov 2026, Just now',
          author: 'Admin User',
          note: 'Ticket created via Municipal Admin Portal.',
        },
      ],
    };

    setTickets([newEntry, ...tickets]);
    setCreateTicketModal(false);
    setNewSubject('');
    setNewDescription('');
    setAttachedFile(null);
    showToast(`Support ticket ${ticketNumber} created successfully.`);
  };

  // Handle Ticket Reply
  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;

    const updatedActivity = [
      ...selectedTicket.activity,
      {
        date: '17 Nov 2026, Just now',
        author: 'Admin User',
        note: replyText.trim(),
      },
    ];

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      updatedAt: '17 Nov 2026',
      activity: updatedActivity,
    };

    setTickets(tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t)));
    setSelectedTicket(updatedTicket);
    setReplyText('');
    showToast('Reply added to ticket history.');
  };

  const popularTopics = ['All', 'Dashboard', 'Issues', 'City Analytics', 'Resource Allocation', 'Reports', 'Settings'];

  return (
    <div className={styles.container}>
      {/* ============================================================
          SIDEBAR NAVIGATION
          ============================================================ */}
      <aside className={styles.sidebar}>
        <Link href="/admin/dashboard" className={styles.brandLink}>
          <div className={styles.brandIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>Admin Portal</div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          <Link href="/admin/issues" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </span>
            <span>All Issues & City Map</span>
          </Link>

          <Link href="/admin/analytics" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span>City Analytics</span>
          </Link>

          <Link href="/admin/resource-allocation" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span>Resource Allocation</span>
          </Link>

          <Link href="/admin/ward-management" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span>Ward & User Management</span>
          </Link>

          <Link href="/admin/system-administration" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>System Administration</span>
          </Link>

          <Link href="/admin/reports" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span>Reports & Export</span>
          </Link>

          <Link href="/admin/settings" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span>Settings</span>
          </Link>

          <Link href="/admin/help-support" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span>Help & Support</span>
          </Link>
        </nav>

        <div className={styles.sidebarBanner}>
          <div className={styles.sidebarBannerBg} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerText}>
              <div className={styles.bannerTitle}>Stronger Communities A Cleaner Mira Bhayandar</div>
              <div className={styles.bannerSub}>Smart Governance</div>
            </div>
            <div className={styles.bannerArrow}>→</div>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN AREA
          ============================================================ */}
      <div className={styles.mainArea}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search issues, wards, staff, locations..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
            />
          </div>

          <div className={styles.headerActions}>
            <div className={styles.wardSelector}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                <option value="All Wards">All Wards</option>
                <option value="Ward 1">Ward 1 - Mira Road</option>
                <option value="Ward 2">Ward 2 - Bhayandar West</option>
                <option value="Ward 3">Ward 3 - Bhayandar East</option>
                <option value="Ward 4">Ward 4 - GCC Road</option>
                <option value="Ward 5">Ward 5 - Station Area</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              onClick={() => showToast('Support updates: 3 active administrative tickets')}
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notificationBadge}>8</span>
            </button>

            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>SA</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Admin User</span>
                <span className={styles.userRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================
            CONTENT AREA
            ============================================================ */}
        <main className={styles.content}>
          {/* Top Bar with Breadcrumb, Title & + Create Ticket Action */}
          <div className={styles.topBar}>
            <div className={styles.pageTitleGroup}>
              <div className={styles.breadcrumb}>
                <Link href="/admin/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
                <span>&gt;</span>
                <span>Help &amp; Support</span>
              </div>
              <h1 className={styles.pageTitle}>Help &amp; Support</h1>
              <p className={styles.pageSubtitle}>
                Get assistance, manage support requests and access CivicPulse documentation.
              </p>
            </div>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setCreateTicketModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Support Ticket</span>
            </button>
          </div>

          {/* ============================================================
              ROW 1: 4 KPI CARDS
              ============================================================ */}
          <section className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SUPPORT_KPIS.supportAvailability}</span>
                <span className={styles.kpiLabel}>Support Availability</span>
                <span className={styles.kpiSub}>{SUPPORT_KPIS.supportAvailabilitySub}</span>
              </div>
              <div className={`${styles.kpiIconWrapper} ${styles.kpiIconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length}</span>
                <span className={styles.kpiLabel}>Open Tickets</span>
                <span className={styles.kpiSub}>{SUPPORT_KPIS.openTicketsSub}</span>
              </div>
              <div className={`${styles.kpiIconWrapper} ${styles.kpiIconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SUPPORT_KPIS.resolvedTickets}</span>
                <span className={styles.kpiLabel}>Resolved Tickets</span>
                <span className={styles.kpiSub}>{SUPPORT_KPIS.resolvedTicketsSub}</span>
              </div>
              <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SUPPORT_KPIS.systemAvailability}</span>
                <span className={styles.kpiLabel}>System Availability</span>
                <span className={styles.kpiSub}>{SUPPORT_KPIS.systemAvailabilitySub}</span>
              </div>
              <div className={`${styles.kpiIconWrapper} ${styles.kpiIconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
            </div>
          </section>

          {/* ============================================================
              ROW 2: "How can we help?" + "Quick Support Actions"
              ============================================================ */}
          <div className={styles.secondRowGrid}>
            {/* Search Help Card */}
            <div className={styles.searchHelpCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 className={styles.cardTitle}>How can we help?</h2>
                </div>
              </div>

              <div className={styles.helpSearchBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className={styles.helpSearchInput}
                  placeholder="Search help articles, guides and troubleshooting..."
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.popularTopicsRow}>
                <span className={styles.popularLabel}>Popular Topics:</span>
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`${styles.topicPill} ${activeTopic === topic ? styles.topicPillActive : ''}`}
                    onClick={() => setActiveTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Support Actions */}
            <div className={styles.quickActionsCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <div>
                  <h2 className={styles.cardTitle}>Quick Support Actions</h2>
                </div>
              </div>

              <div className={styles.quickActionsGrid}>
                {/* 1. Documentation */}
                <div className={styles.quickActionItem}>
                  <div className={styles.quickActionHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>Documentation</span>
                  </div>
                  <p className={styles.quickActionDesc}>Browse guides for using CivicPulse admin tools.</p>
                  <button
                    type="button"
                    className={styles.btnActionOutline}
                    onClick={() => setSelectedDoc(DOCUMENTATION_GUIDES[0])}
                  >
                    View Documentation
                  </button>
                </div>

                {/* 2. Report a Problem */}
                <div className={styles.quickActionItem}>
                  <div className={styles.quickActionHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <line x1="6" y1="12" x2="6.01" y2="12" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                      <line x1="18" y1="12" x2="18.01" y2="12" />
                    </svg>
                    <span>Report a Problem</span>
                  </div>
                  <p className={styles.quickActionDesc}>Report a technical problem or unexpected behaviour.</p>
                  <button
                    type="button"
                    className={styles.btnActionOutline}
                    onClick={() => setCreateTicketModal(true)}
                  >
                    Create Ticket
                  </button>
                </div>

                {/* 3. Contact Support */}
                <div className={styles.quickActionItem}>
                  <div className={styles.quickActionHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                    <span>Contact Support</span>
                  </div>
                  <p className={styles.quickActionDesc}>Contact the CivicPulse support team for assistance.</p>
                  <button
                    type="button"
                    className={styles.btnActionOutline}
                    onClick={() => setContactSupportModal(true)}
                  >
                    Contact Support
                  </button>
                </div>

                {/* 4. System Status */}
                <div className={styles.quickActionItem}>
                  <div className={styles.quickActionHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span>System Status</span>
                  </div>
                  <p className={styles.quickActionDesc}>Check the operational status of CivicPulse services.</p>
                  <button
                    type="button"
                    className={styles.btnActionOutline}
                    onClick={() => showToast('All major platform services are operating nominally (Demo Status).')}
                  >
                    View Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              ROW 3: FAQ + Support Tickets + System Status
              ============================================================ */}
          <div className={styles.thirdRowGrid}>
            {/* Col 1: Frequently Asked Questions */}
            <div className={styles.standardCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <h2 className={styles.cardTitle}>Frequently Asked Questions</h2>
              </div>

              <div className={styles.faqList}>
                {filteredFaqs.map((faq) => {
                  const isOpen = expandedFaqIds.includes(faq.id);
                  return (
                    <div key={faq.id} className={styles.faqItem}>
                      <div className={styles.faqQuestionRow} onClick={() => toggleFaq(faq.id)}>
                        <span className={styles.faqQuestion}>{faq.question}</span>
                        <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}>▼</span>
                      </div>
                      {isOpen && <div className={styles.faqAnswer}>{faq.answer}</div>}
                    </div>
                  );
                })}
                {filteredFaqs.length === 0 && (
                  <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
                    No help articles found.
                  </div>
                )}
              </div>
            </div>

            {/* Col 2: My Support Tickets */}
            <div className={styles.standardCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    </svg>
                  </span>
                  <h2 className={styles.cardTitle}>My Support Tickets</h2>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#2dd4bf', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setTicketStatusFilter('All');
                    setTicketPriorityFilter('All');
                    setTicketSearch('');
                  }}
                >
                  View All →
                </button>
              </div>

              <div className={styles.ticketFiltersRow}>
                <input
                  type="text"
                  className={styles.ticketSearchInput}
                  placeholder="Search tickets..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
                <select
                  className={styles.ticketSelect}
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <select
                  className={styles.ticketSelect}
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className={styles.ticketTableWrapper}>
                <table className={styles.ticketTable}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject</th>
                      <th>Module</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => (
                      <tr key={t.id} onClick={() => setSelectedTicket(t)}>
                        <td className={styles.ticketId}>{t.id}</td>
                        <td style={{ fontWeight: 600, color: '#f1f5f9', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.subject}
                        </td>
                        <td style={{ color: '#94a3b8' }}>{t.module}</td>
                        <td>
                          <span
                            className={
                              t.priority === 'Critical' || t.priority === 'High'
                                ? styles.badgePriorityHigh
                                : t.priority === 'Medium'
                                ? styles.badgePriorityMed
                                : styles.badgePriorityLow
                            }
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              t.status === 'In Progress'
                                ? styles.badgeStatusProgress
                                : t.status === 'Open'
                                ? styles.badgeStatusOpen
                                : styles.badgeStatusResolved
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 10.5 }}>{t.updatedAt}</td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '16px 0', color: '#64748b' }}>
                          No tickets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Col 3: System Status */}
            <div className={styles.standardCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </span>
                  <div>
                    <h2 className={styles.cardTitle}>System Status</h2>
                  </div>
                </div>
                <span className={styles.statusCardHeaderPill}>All Systems Operational</span>
              </div>
              <p className={styles.cardSubtitle}>Current operational status of CivicPulse services.</p>

              <div>
                {SYSTEM_SERVICES_STATUS.map((srv) => (
                  <div key={srv.id} className={styles.serviceItem}>
                    <div className={styles.serviceLeft}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span>{srv.name}</span>
                    </div>
                    {srv.status === 'Operational' ? (
                      <span className={styles.badgeOperational}>Operational</span>
                    ) : (
                      <span className={styles.badgePrototype}>Prototype</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
                <span>Last checked: Just now</span>
                <span style={{ color: '#2dd4bf' }}>Demo Status</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              ROW 4: Documentation (2x3) + Support Resources + Info/Hours
              ============================================================ */}
          <div className={styles.fourthRowGrid}>
            {/* Col 1: Documentation */}
            <div className={styles.standardCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className={styles.cardTitle}>Documentation</h2>
                    <p className={styles.cardSubtitle}>Explore detailed guides and user manuals.</p>
                  </div>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#2dd4bf', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setSelectedDoc(DOCUMENTATION_GUIDES[0])}
                >
                  View All →
                </button>
              </div>

              <div className={styles.docGrid}>
                {DOCUMENTATION_GUIDES.map((doc) => (
                  <div key={doc.id} className={styles.docItem} onClick={() => setSelectedDoc(doc)}>
                    <div className={styles.docIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <div className={styles.docText}>
                      <span className={styles.docTitle}>{doc.title}</span>
                      <span className={styles.docDesc}>{doc.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2: Support Resources */}
            <div className={styles.standardCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </span>
                <h2 className={styles.cardTitle}>Support Resources</h2>
              </div>

              <div>
                {SUPPORT_RESOURCES_LIST.map((res) => (
                  <div key={res.id} className={styles.resourceItem}>
                    <div className={styles.resourceLeft}>
                      <span className={styles.resourceIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </span>
                      <div>
                        <div className={styles.resourceTitle}>{res.title}</div>
                        <div className={styles.resourceDesc}>{res.description}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.btnOpenResource}
                      onClick={() => showToast(`Opened ${res.title} (demonstration resource).`)}
                    >
                      Open ↗
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Stacked Availability & System Info & Feedback */}
            <div className={styles.rightStack}>
              {/* Support Availability */}
              <div className={styles.compactCard}>
                <span className={styles.compactTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Support Availability
                </span>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f1f5f9' }}>Monday – Friday</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>9:00 AM – 6:00 PM IST</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#f87171' }}>Emergency system issues:</strong> Create a Critical priority support ticket.
                </div>
              </div>

              {/* System Information */}
              <div className={styles.compactCard}>
                <span className={styles.compactTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  System Information
                </span>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Application</span>
                  <span className={styles.infoVal}>CivicPulse</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Version</span>
                  <span className={styles.infoVal}>v1.0.0</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Environment</span>
                  <span className={styles.infoVal}>Development</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Last Updated</span>
                  <span className={styles.infoVal}>17 Nov 2026</span>
                </div>
              </div>

              {/* Feedback */}
              <div className={styles.compactCard}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Was this page helpful?</span>
                {feedbackGiven === null ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => {
                        setFeedbackGiven('yes');
                        showToast('Thank you for your feedback!');
                      }}
                    >
                      👍 Yes, helpful
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => setFeedbackGiven('no')}
                    >
                      👎 Not helpful
                    </button>
                  </div>
                ) : feedbackGiven === 'no' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      className={styles.formTextarea}
                      style={{ minHeight: 45, fontSize: 11 }}
                      placeholder="Tell us what could be improved..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => {
                        setFeedbackGiven('yes');
                        showToast('Feedback submitted locally.');
                      }}
                    >
                      Submit Feedback
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: '#10b981' }}>✓ Feedback recorded. Thank you!</span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================
          MODAL 1: CREATE SUPPORT TICKET
          ============================================================ */}
      {createTicketModal && (
        <div className={styles.modalBackdrop} onClick={() => setCreateTicketModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                </svg>
                Create Support Ticket
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setCreateTicketModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Briefly describe the problem..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Module</label>
                  <select
                    className={styles.formSelect}
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                  >
                    <option value="Dashboard">Dashboard</option>
                    <option value="All Issues & City Map">All Issues & City Map</option>
                    <option value="City Analytics">City Analytics</option>
                    <option value="Resource Allocation">Resource Allocation</option>
                    <option value="Ward & User Management">Ward & User Management</option>
                    <option value="System Administration">System Administration</option>
                    <option value="Reports & Export">Reports & Export</option>
                    <option value="Settings">Settings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    className={styles.formSelect}
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Describe the problem in detail, steps to reproduce, or requested change..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Attach Screenshot</label>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ height: 36, fontSize: 11.5 }}
                    onClick={() => {
                      setAttachedFile('screenshot_issue_diagnostic.png');
                      showToast('Screenshot attached locally.');
                    }}
                  >
                    📎 {attachedFile ? attachedFile : 'Upload Screenshot'}
                  </button>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCreateTicketModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: VIEW TICKET DETAILS & ACTIVITY TIMELINE
          ============================================================ */}
      {selectedTicket && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedTicket(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.ticketId}>{selectedTicket.id}</span>
                <span>{selectedTicket.subject}</span>
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Module: <strong style={{ color: '#e2e8f0' }}>{selectedTicket.module}</strong></span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Priority: <strong style={{ color: selectedTicket.priority === 'High' ? '#ef4444' : '#f59e0b' }}>{selectedTicket.priority}</strong></span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Status: <strong style={{ color: '#2dd4bf' }}>{selectedTicket.status}</strong></span>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>Description</span>
                <p style={{ margin: '4px 0 12px', fontSize: 12.5, color: '#f1f5f9', background: 'rgba(8,15,29,0.5)', padding: 10, borderRadius: 6 }}>
                  {selectedTicket.description}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>Activity Timeline</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedTicket.activity.map((act, idx) => (
                    <div key={idx} className={styles.timelineItem}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={styles.timelineAuthor}>{act.author}</span>
                          <span className={styles.timelineDate}>{act.date}</span>
                        </div>
                        <div className={styles.timelineNote}>{act.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Write a reply or follow-up comment..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                />
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={handleSendReply}
                >
                  Send Reply
                </button>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: DOCUMENTATION GUIDE READER
          ============================================================ */}
      {selectedDoc && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedDoc(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {selectedDoc.title}
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setSelectedDoc(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13, color: '#2dd4bf', fontWeight: 500 }}>{selectedDoc.description}</p>
              <div style={{ background: 'rgba(8,15,29,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14, fontSize: 13, color: '#f1f5f9', lineHeight: 1.6 }}>
                {selectedDoc.content}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                CivicPulse Administrator Handbook • Documentation Revision 2.4
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedDoc(null)}
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: CONTACT SUPPORT DIALOG
          ============================================================ */}
      {contactSupportModal && (
        <div className={styles.modalBackdrop} onClick={() => setContactSupportModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
                Contact Support Team
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setContactSupportModal(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ background: 'rgba(8,15,29,0.5)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#e2e8f0', fontSize: 13 }}>Technical Operations Desk</strong>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Hours: Monday – Friday, 9:00 AM – 6:00 PM IST</span>
                <span style={{ fontSize: 12, color: '#f59e0b' }}>Support contact phone/email: Support contact not configured in demo</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                For technical issues requiring fast resolution, please create a ticket with <strong>Critical</strong> priority directly in this portal.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setContactSupportModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  setContactSupportModal(false);
                  setCreateTicketModal(true);
                }}
              >
                Create Ticket Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TOAST FEEDBACK
          ============================================================ */}
      {toastMessage && (
        <div className={styles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
