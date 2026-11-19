'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, AuthUser } from '../../../lib/auth';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './help-support.module.css';

/* ── FAQ Data ── */
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
  iconBg: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I report a civic issue?',
    answer:
      'To report a civic issue, navigate to "Report an Issue" from the sidebar menu. Fill in the issue details including title, category (e.g., Roads, Water Supply, Streetlights), location, and an optional photo. Your report will be assigned a unique ticket ID for tracking.',
    icon: '📝',
    iconBg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    id: 'faq-2',
    question: 'How can I track the status of my report?',
    answer:
      'Go to "My Reports" in the sidebar to see all your submitted reports. Each report displays its current status (Submitted, Under Review, In Progress, Resolved, Rejected). You can click any report to view full details including timeline updates from the assigned department.',
    icon: '📊',
    iconBg: 'rgba(0, 229, 153, 0.12)',
  },
  {
    id: 'faq-3',
    question: 'How long does it take to resolve an issue?',
    answer:
      'Resolution time depends on the issue type and severity. Minor issues like streetlight repairs are typically addressed within 3–7 working days. Infrastructure issues like road repairs may take 2–4 weeks. Water supply and drainage issues are usually prioritised and resolved within 5–10 days. You will receive notifications at each status change.',
    icon: '⏱️',
    iconBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    id: 'faq-4',
    question: 'Can I edit or delete my report?',
    answer:
      'You can edit the description or update the photo of a report while it is in "Submitted" status. Once a report moves to "Under Review" or beyond, it can no longer be edited. Reports cannot be deleted but can be marked as "Withdrawn" by contacting support.',
    icon: '✏️',
    iconBg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    id: 'faq-5',
    question: 'What types of issues can I report?',
    answer:
      'You can report issues across several categories: Roads & Potholes, Water Supply, Streetlights, Waste Management, Drainage, Parks & Public Spaces, Public Transport, and Other. Each category is routed to the appropriate municipal department for action.',
    icon: '📋',
    iconBg: 'rgba(236, 72, 153, 0.12)',
  },
  {
    id: 'faq-6',
    question: 'How does the location selection work?',
    answer:
      'When reporting an issue, you can specify the location by typing an address, selecting from a dropdown of known areas, or using the interactive map. GPS-based auto-detection is available if you allow location access. Accurate location helps the ward team respond faster.',
    icon: '📍',
    iconBg: 'rgba(239, 68, 68, 0.12)',
  },
  {
    id: 'faq-7',
    question: 'Who will receive my report?',
    answer:
      'Your report is routed to the relevant ward office and department based on the issue category and location. For example, a pothole report near Kanakia Road goes to Ward 3 — Roads & Infrastructure Department. You can see the assigned department in your report details.',
    icon: '👥',
    iconBg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    id: 'faq-8',
    question: 'How will I get updates on my report?',
    answer:
      'You will receive in-app notifications whenever your report status changes. You can view all notifications in the "Notifications" section. Email and SMS notifications are planned for future releases. You can also visit "My Reports" anytime to check the latest status.',
    icon: '🔔',
    iconBg: 'rgba(245, 158, 11, 0.12)',
  },
];

/* ── Support Request Types ── */
type SupportCategory = 'general' | 'report_issue' | 'account' | 'technical' | 'feedback';
type RequestPriority = 'low' | 'medium' | 'high';

interface SupportRequest {
  id: string;
  subject: string;
  category: SupportCategory;
  priority: RequestPriority;
  description: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export default function HelpSupportPage() {
  const router = useRouter();

  // Auth
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Notice Modal
  const [notice, setNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const openNotice = (
    title: string,
    message: string,
    stageNote?: string,
    badge?: string
  ) => {
    setNotice({ isOpen: true, title, message, stageNote, badge });
  };

  const closeNotice = () => {
    setNotice((prev) => ({ ...prev, isOpen: false }));
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Help search
  const [helpSearch, setHelpSearch] = useState('');

  // FAQ accordion
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Support Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqSubject, setReqSubject] = useState('');
  const [reqCategory, setReqCategory] = useState<SupportCategory>('general');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('medium');
  const [reqDescription, setReqDescription] = useState('');
  const [reqError, setReqError] = useState('');

  // Support requests list (LocalStorage)
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);

  useEffect(() => {
    setUser(getCurrentUser());
    const stored = localStorage.getItem('civicpulse_support_requests');
    if (stored) {
      try {
        setSupportRequests(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  // User initials
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }, [user]);

  // Filtered FAQs based on search
  const filteredFaqs = useMemo(() => {
    if (!helpSearch.trim()) return FAQ_DATA;
    const q = helpSearch.toLowerCase();
    return FAQ_DATA.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [helpSearch]);

  // Office hours logic
  const isOnline = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    // Mon-Sat (1-6), 9 AM - 6 PM
    return day >= 1 && day <= 6 && hours >= 9 && hours < 18;
  }, []);

  // Handle FAQ toggle
  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  // Handle support request submit
  const handleSubmitRequest = () => {
    if (!reqSubject.trim()) {
      setReqError('Please enter a subject for your request.');
      return;
    }
    if (!reqDescription.trim()) {
      setReqError('Please describe your issue or question.');
      return;
    }

    const newRequest: SupportRequest = {
      id: `SR-${Date.now().toString(36).toUpperCase()}`,
      subject: reqSubject.trim(),
      category: reqCategory,
      priority: reqPriority,
      description: reqDescription.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    const updated = [newRequest, ...supportRequests];
    setSupportRequests(updated);
    localStorage.setItem('civicpulse_support_requests', JSON.stringify(updated));

    // Reset form
    setReqSubject('');
    setReqCategory('general');
    setReqPriority('medium');
    setReqDescription('');
    setReqError('');
    setRequestModalOpen(false);

    showToast(`Support request ${newRequest.id} submitted successfully!`);
  };

  // Handle help search
  const handleHelpSearch = () => {
    if (helpSearch.trim()) {
      // Expand the first matching FAQ
      if (filteredFaqs.length > 0) {
        setOpenFaqId(filteredFaqs[0].id);
      }
    }
  };

  // Guard: Protect citizen workspace for authenticated citizen accounts
  if (!user || (user.role !== 'citizen' && user.role !== 'super_admin')) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5cebaa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Authentication Required</h1>
          <p className={styles.authMessage}>
            You must be signed in with a verified citizen account to access the Help &amp; Support center.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={() => router.push('/auth/login?destination=/citizen/help-support')}
            >
              Citizen Sign In
            </button>
            <button
              type="button"
              className={styles.authSecondaryBtn}
              onClick={() => router.push('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ============================================================
          SIDEBAR NAVIGATION
          ============================================================ */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brandLink}>
          <div className={styles.logoPulseIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>CITIZEN PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard */}
          <Link href="/citizen" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Report an Issue */}
          <Link href="/citizen/report-issue" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            <span className={styles.navLabel}>Report an Issue</span>
          </Link>

          {/* 3. My Reports */}
          <Link href="/citizen/my-reports" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>My Reports</span>
          </Link>

          {/* 4. Notifications */}
          <Link href="/citizen/notifications" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className={styles.navLabel}>Notifications</span>
            <span className={styles.navBadge}>3</span>
          </Link>

          {/* 5. Community */}
          <Link href="/citizen/community" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className={styles.navLabel}>Community</span>
          </Link>

          {/* 6. Help & Support (Active) */}
          <Link
            href="/citizen/help-support"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>Help &amp; Support</span>
          </Link>
        </nav>

        {/* Sidebar Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <div className={styles.promoImageWrapper}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Community Neighbourhood"
              fill
              sizes="220px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div className={styles.promoTitle}>A cleaner neighbourhood starts with you.</div>
            <div className={styles.promoSubtitle}>Report. Track. See change.</div>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN WRAPPER & TOPBAR
          ============================================================ */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          {/* Global Search Bar */}
          <div className={styles.globalSearchForm}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.globalSearchInput}
              placeholder="Search for help topics, issues, or keywords..."
              aria-label="Search help topics"
              readOnly
              onFocus={() =>
                openNotice(
                  'Global Search',
                  'Use the help search bar below to search FAQs and help topics.',
                  'Tip',
                  'Info'
                )
              }
            />
          </div>

          {/* Topbar Actions */}
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.locationSelector}
              onClick={() =>
                openNotice(
                  'Municipal Boundary',
                  'Active Zone: Mira Bhayandar Municipal Corporation (MBMC), Ward 3 & 4.',
                  'Geo-verified Ward Coverage',
                  'Jurisdiction'
                )
              }
            >
              <span className={styles.locationIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Mira Bhayandar</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Notification Bell */}
            <Link
              href="/citizen/notifications"
              className={styles.iconButton}
              aria-label="View notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifBadgeSmall}>3</span>
            </Link>

            {/* User Profile */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-label="Toggle user profile menu"
                suppressHydrationWarning
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={36}
                    height={36}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.initialsAvatar} suppressHydrationWarning>{initials}</div>
                )}
                <div className={styles.userInfo} suppressHydrationWarning>
                  <span className={styles.userName} suppressHydrationWarning>{user?.name || 'Citizen'}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice(
                        'Verified Profile',
                        `Logged in as ${user?.name} (${user?.email}). Location: Mira Bhayandar.`
                      );
                    }}
                  >
                    Citizen Profile
                  </button>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={() => {
                      logout();
                      router.push('/auth/login');
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================
            PAGE BODY
            ============================================================ */}
        <main className={styles.pageBody}>
          {/* Banner */}
          <div className={styles.bannerCard}>
            <div className={styles.bannerContent}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/citizen" className={styles.crumbLink}>
                  Dashboard
                </Link>
                <span className={styles.crumbSep}>&gt;</span>
                <span className={styles.crumbActive}>Help &amp; Support</span>
              </nav>
              <h1 className={styles.bannerTitle}>Help &amp; Support</h1>
              <p className={styles.bannerSubtitle}>
                We&apos;re here to help you. Find answers, get support, or reach out to
                our team for assistance.
              </p>
            </div>

            <div className={styles.bannerImageContainer}>
              <Image
                src="/images/help-support/banner.jpg"
                alt="How can we help you?"
                width={518}
                height={200}
                className={styles.bannerImg}
                priority
              />
            </div>
          </div>

          {/* Help Search Bar */}
          <div className={styles.helpSearchSection}>
            <div className={styles.helpSearchWrapper}>
              <span className={styles.helpSearchIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className={styles.helpSearchInput}
                placeholder="Search for help topics, e.g. report status, account, map..."
                value={helpSearch}
                onChange={(e) => setHelpSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleHelpSearch();
                }}
                aria-label="Search help topics"
              />
            </div>
            <button
              type="button"
              className={styles.helpSearchBtn}
              onClick={handleHelpSearch}
            >
              Search
            </button>
          </div>

          {/* Two-Column Content */}
          <div className={styles.contentArea}>
            {/* Quick Action Cards (span full width) */}
            <div className={styles.quickActionsRow}>
              {/* Track My Report */}
              <Link href="/citizen/my-reports" className={styles.quickActionCard}>
                <div className={`${styles.actionIconBox} ${styles.actionIconTrack}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className={styles.actionTextGroup}>
                  <div className={styles.actionTitle}>Track My Report</div>
                  <div className={styles.actionDesc}>Check the status of your submitted reports.</div>
                </div>
                <span className={styles.actionArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </Link>

              {/* Report a New Issue */}
              <Link href="/citizen/report-issue" className={styles.quickActionCard}>
                <div className={`${styles.actionIconBox} ${styles.actionIconReport}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className={styles.actionTextGroup}>
                  <div className={styles.actionTitle}>Report a New Issue</div>
                  <div className={styles.actionDesc}>Learn how to report a civic issue.</div>
                </div>
                <span className={styles.actionArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </Link>

              {/* Manage My Account */}
              <button
                type="button"
                className={styles.quickActionCard}
                onClick={() =>
                  openNotice(
                    'Account Management',
                    'Profile settings, notification preferences, and account security options are coming soon. Currently logged in as ' +
                      (user?.name || 'Citizen') +
                      '.',
                    'Scheduled for Phase 2',
                    'Coming Soon'
                  )
                }
              >
                <div className={`${styles.actionIconBox} ${styles.actionIconAccount}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className={styles.actionTextGroup}>
                  <div className={styles.actionTitle}>Manage My Account</div>
                  <div className={styles.actionDesc}>Update your profile and account settings.</div>
                </div>
                <span className={styles.actionArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            </div>

            {/* LEFT COLUMN — FAQs */}
            <div className={styles.leftColumn}>
              <div className={styles.faqSection}>
                <div className={styles.faqHeader}>
                  <div className={styles.faqHeaderLeft}>
                    <span className={styles.faqHeaderIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <div>
                      <div className={styles.faqHeaderTitle}>Frequently Asked Questions</div>
                      <div className={styles.faqHeaderSubtitle}>Find quick answers to common questions.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.faqViewAllBtn}
                    onClick={() =>
                      openNotice(
                        'All FAQs',
                        'A dedicated FAQ page with advanced search and categories is planned for a future release.',
                        'Phase 2 Feature',
                        'Coming Soon'
                      )
                    }
                  >
                    View all
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>

                <ul className={styles.faqList}>
                  {filteredFaqs.map((faq) => (
                    <li key={faq.id} className={styles.faqItem}>
                      <button
                        type="button"
                        className={styles.faqQuestion}
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={openFaqId === faq.id}
                      >
                        <span
                          className={styles.faqQuestionIcon}
                          style={{ background: faq.iconBg }}
                        >
                          {faq.icon}
                        </span>
                        <span className={styles.faqQuestionText}>{faq.question}</span>
                        <span
                          className={`${styles.faqChevron} ${
                            openFaqId === faq.id ? styles.faqChevronOpen : ''
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>
                      {openFaqId === faq.id && (
                        <div className={styles.faqAnswer}>{faq.answer}</div>
                      )}
                    </li>
                  ))}
                  {filteredFaqs.length === 0 && (
                    <li style={{ padding: '28px 24px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                      No FAQs match your search. Try different keywords or{' '}
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#00e599', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px' }}
                        onClick={() => setRequestModalOpen(true)}
                      >
                        submit a support request
                      </button>.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* RIGHT COLUMN — Contact, Hours, Submit */}
            <div className={styles.rightColumn}>
              {/* Contact Support */}
              <div className={styles.contactCard}>
                <div className={styles.contactCardHeader}>
                  <div className={styles.contactCardTitle}>Contact Support</div>
                  <div className={styles.contactCardSubtitle}>
                    Need more help? Reach out to our support team.
                  </div>
                </div>
                <div className={styles.contactMethodList}>
                  {/* Helpline */}
                  <div className={styles.contactMethodRow}>
                    <div className={`${styles.contactMethodIcon} ${styles.contactIconPhone}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className={styles.contactMethodInfo}>
                      <div className={styles.contactMethodLabel}>Helpline Number</div>
                      <div className={styles.contactMethodValue}>1800-123-4567</div>
                    </div>
                    <button
                      type="button"
                      className={styles.contactMethodBtn}
                      onClick={() =>
                        openNotice(
                          'Helpline',
                          'Call the CivicPulse Helpline at 1800-123-4567 (Toll-Free). Available Monday to Saturday, 9:00 AM – 6:00 PM.',
                          'Municipal Support Line',
                          'Helpline'
                        )
                      }
                    >
                      Call Now
                    </button>
                  </div>

                  {/* Email */}
                  <div className={styles.contactMethodRow}>
                    <div className={`${styles.contactMethodIcon} ${styles.contactIconEmail}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className={styles.contactMethodInfo}>
                      <div className={styles.contactMethodLabel}>Email Support</div>
                      <div className={styles.contactMethodValue}>support@civicpulse.gov.in</div>
                    </div>
                    <button
                      type="button"
                      className={styles.contactMethodBtn}
                      onClick={() =>
                        openNotice(
                          'Email Support',
                          'Send your query to support@civicpulse.gov.in. Our team typically responds within 24–48 hours on business days.',
                          'Support Email',
                          'Email'
                        )
                      }
                    >
                      Send Email
                    </button>
                  </div>

                  {/* Live Chat */}
                  <div className={styles.contactMethodRow}>
                    <div className={`${styles.contactMethodIcon} ${styles.contactIconChat}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className={styles.contactMethodInfo}>
                      <div className={styles.contactMethodLabel}>Live Chat</div>
                      <div className={styles.contactMethodValue}>
                        Chat with our support team
                        <br />
                        (Mon - Sat, 9 AM - 6 PM)
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.contactMethodBtn}
                      onClick={() =>
                        openNotice(
                          'Live Chat',
                          'Live chat support is available Monday to Saturday, 9:00 AM – 6:00 PM IST. This feature will launch with the next platform update.',
                          'Phase 2 Feature',
                          'Coming Soon'
                        )
                      }
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className={styles.officeHoursCard}>
                <div className={styles.officeHoursHeader}>
                  <span className={styles.officeHoursIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className={styles.officeHoursTitle}>Office Hours</span>
                </div>
                <div className={styles.officeHoursSubtitle}>
                  Our support team is available during the following hours:
                </div>

                <div className={styles.hoursRow}>
                  <div className={styles.hoursCalIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className={styles.hoursInfo}>
                    <div className={styles.hoursDays}>Monday – Saturday</div>
                    <div className={styles.hoursTime}>9:00 AM – 6:00 PM</div>
                  </div>
                  {isOnline ? (
                    <div className={styles.onlineBadge}>
                      <span className={styles.onlineDot} />
                      Online Now
                    </div>
                  ) : (
                    <div className={styles.offlineBadge}>Offline</div>
                  )}
                </div>
              </div>

              {/* Still Need Help */}
              <div className={styles.submitCard}>
                <div className={styles.submitCardIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className={styles.submitCardTitle}>Still Need Help?</div>
                <div className={styles.submitCardDesc}>
                  Can&apos;t find what you&apos;re looking for? Submit a support
                  request and we&apos;ll get back to you.
                </div>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => setRequestModalOpen(true)}
                >
                  Submit a Support Request
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================
          SUPPORT REQUEST MODAL
          ============================================================ */}
      {requestModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRequestModalOpen(false);
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Submit a Support Request</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRequestModalOpen(false)}
                aria-label="Close support request form"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Subject */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subject *</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Brief summary of your issue..."
                value={reqSubject}
                onChange={(e) => setReqSubject(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.formSelect}
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value as SupportCategory)}
              >
                <option value="general">General Inquiry</option>
                <option value="report_issue">Report Issue Problem</option>
                <option value="account">Account & Profile</option>
                <option value="technical">Technical Issue</option>
                <option value="feedback">Feedback & Suggestions</option>
              </select>
            </div>

            {/* Priority */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Priority</label>
              <select
                className={styles.formSelect}
                value={reqPriority}
                onChange={(e) => setReqPriority(e.target.value as RequestPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description *</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Describe your issue or question in detail..."
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
              />
            </div>

            {reqError && <div className={styles.formError}>{reqError}</div>}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.formCancelBtn}
                onClick={() => setRequestModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.formSubmitBtn}
                onClick={handleSubmitRequest}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TOAST
          ============================================================ */}
      {toastMessage && (
        <div className={styles.toast}>
          <span className={styles.toastIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          {toastMessage}
        </div>
      )}

      {/* Notice Modal */}
      <NoticeModal
        isOpen={notice.isOpen}
        onClose={closeNotice}
        title={notice.title}
        message={notice.message}
        stageNote={notice.stageNote}
        badge={notice.badge}
      />
    </div>
  );
}
