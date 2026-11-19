'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCurrentUser,
  logout,
  loginWardStaff,
  DEFAULT_WARD_STAFF,
  AuthUser,
} from '../../../lib/auth';
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  SYSTEM_SERVICES,
  HelpCategory,
  HelpArticle,
  submitStaffSupportTicket,
} from '../../../lib/staff-support';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './help.module.css';

export default function StaffHelpPage() {
  const router = useRouter();

  // ── Authentication & User State ──
  const [user, setUser] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && (current.role === 'ward_staff' || current.role === 'super_admin')) {
      return current;
    }
    return DEFAULT_WARD_STAFF;
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedWard] = useState<string>('Ward 3');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Knowledge Base State ──
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('getting-started');
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // ── Modals & Dialog State ──
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // ── Support Request Form State ──
  const [requestSubject, setRequestSubject] = useState('');
  const [requestCategory, setRequestCategory] = useState('Field Operations App');
  const [requestPriority, setRequestPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [requestIssueId, setRequestIssueId] = useState('');
  const [requestDesc, setRequestDesc] = useState('');

  // ── Contact Support Form State ──
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // ── Toast & Notice State ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({ isOpen: false, title: '', message: '' });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openNotice = (title: string, message: string, stageNote?: string, badge?: string) => {
    setNotice({ isOpen: true, title, message, stageNote, badge });
  };
  const closeNotice = () => setNotice((prev) => ({ ...prev, isOpen: false }));

  // ── Sync with Auth on Mount ──
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && (usr.role === 'ward_staff' || usr.role === 'super_admin')) {
      setUser(usr);
    } else {
      const demoStaff = loginWardStaff(selectedWard);
      setUser(demoStaff);
    }
  }, [selectedWard]);

  // ── Handle Logout ──
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // ── Filtered Articles ──
  const filteredArticles = useMemo(() => {
    let list = HELP_ARTICLES;

    // Filter by search query if user typed in KB search or top header search
    const query = (kbSearchQuery || headerSearchQuery).trim().toLowerCase();
    if (query) {
      return list.filter(
        (art) =>
          art.title.toLowerCase().includes(query) ||
          art.summary.toLowerCase().includes(query) ||
          art.sections.some((s) => s.heading.toLowerCase().includes(query) || (s.content || '').toLowerCase().includes(query))
      );
    }

    // Otherwise filter by selected category
    return list.filter((art) => art.categoryId === selectedCategoryId);
  }, [selectedCategoryId, kbSearchQuery, headerSearchQuery]);

  // Popular Articles (Top 5 ranked)
  const popularArticles = useMemo(() => {
    return HELP_ARTICLES.filter((a) => a.popularRank && a.popularRank <= 5).sort(
      (a, b) => (a.popularRank || 99) - (b.popularRank || 99)
    );
  }, []);

  // ── Submit Support Request ──
  const handleSubmitSupportRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestSubject.trim() || !requestDesc.trim()) {
      showToast('Please provide a subject and description.');
      return;
    }

    const ticket = submitStaffSupportTicket({
      subject: requestSubject,
      category: requestCategory,
      description: requestDesc,
      relatedIssueId: requestIssueId,
      priority: requestPriority,
      staffName: user?.name,
      staffEmail: user?.email,
    });

    setIsRequestModalOpen(false);
    setRequestSubject('');
    setRequestDesc('');
    setRequestIssueId('');
    showToast(`Support Request ${ticket.ticketNumber} registered successfully.`);
  };

  // ── Submit Contact Message ──
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      showToast('Please provide both subject and message.');
      return;
    }

    setIsContactModalOpen(false);
    setContactSubject('');
    setContactMessage('');
    showToast('Your message has been transmitted to MBMC IT Support.');
  };

  // ── Submit Emergency Escalation ──
  const handleTriggerEmergency = () => {
    setIsEmergencyModalOpen(false);
    showToast('Emergency Technical Alert broadcast to MBMC Central Dispatch.');
  };

  return (
    <div className={styles.layoutContainer}>
      {/* ── Mobile Overlay ── */}
      <div
        className={`${styles.mobileOverlay} ${sidebarOpen ? styles.mobileOverlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ============================================================
          SIDEBAR NAVIGATION (Matches approved Ward Staff portal layout)
          ============================================================ */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarLogoArea}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h4l3-8 4 16 3-8h4"
                stroke="#00e599"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.logoText}>CivicPulse</span>
        </div>

        <div className={styles.sidebarSectionTitle}>Ward Staff Portal</div>

        {/* 1. Dashboard */}
        <Link href="/staff/dashboard" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Dashboard
        </Link>

        {/* 2. Assigned Issues */}
        <Link href="/staff/issues" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 12h6M9 16h6" />
            </svg>
          </span>
          Assigned Issues
        </Link>

        {/* 3. Field Operations */}
        <Link href="/staff/field-operations" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          Field Operations
        </Link>

        {/* 4. Resolution Updates */}
        <Link href="/staff/resolution-updates" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Resolution Updates
        </Link>

        {/* 5. Ward Reports */}
        <Link href="/staff/ward-reports" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Ward Reports
        </Link>

        {/* 6. Profile & Settings */}
        <Link href="/staff/settings" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          Profile &amp; Settings
        </Link>

        {/* 7. Help & Support (ACTIVE) */}
        <Link href="/staff/help" className={`${styles.navItem} ${styles.navItemActive}`}>
          <span className={styles.navActiveIndicator} />
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          Help &amp; Support
        </Link>

        {/* Sidebar Promo Card */}
        <div className={styles.sidebarPromo}>
          <div className={styles.promoImgContainer}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Mira Bhayandar 3D City Insights"
              fill
              style={{ objectFit: 'cover' }}
              sizes="220px"
            />
          </div>
          <div className={styles.promoText}>Together for cleaner wards.</div>
          <div className={styles.promoSubtext}>Support. Resolve. Build a better Mira Bhayandar.</div>
        </div>
      </aside>

      {/* ============================================================
          MAIN WRAPPER
          ============================================================ */}
      <div className={styles.mainWrapper}>
        {/* ── Top Header ── */}
        <header className={styles.topHeader}>
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Search Bar */}
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search help articles, guides or keywords..."
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerRight}>
            {/* Ward Selector Pill */}
            <button
              type="button"
              className={styles.wardPill}
              onClick={() => showToast('Active Jurisdiction: Ward 3 (Mira Bhayandar Municipal Corporation)')}
            >
              <span className={styles.wardPinIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Ward 3</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className={styles.notificationBtn}
              onClick={() => showToast('5 active operational alerts in Ward 3 queue')}
              aria-label="5 notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.badgeCount}>5</span>
            </button>

            {/* Staff Profile Pill */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.profilePill}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                suppressHydrationWarning
              >
                <div className={styles.profileAvatarSmall} suppressHydrationWarning>
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || 'Sandeep Jadhav'}
                      width={34}
                      height={34}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    'SJ'
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName} suppressHydrationWarning>{user?.name || 'Sandeep Jadhav'}</div>
                  <div className={styles.profileRole}>Ward Staff</div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/staff/settings" className={styles.dropdownItem} onClick={() => setProfileMenuOpen(false)}>
                    Staff Profile &amp; Settings
                  </Link>
                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Body ── */}
        <main className={styles.pageBody}>
          {/* ============================================================
              1. PAGE BANNER
              ============================================================ */}
          <div className={styles.bannerCard}>
            <Image
              src="/images/ward/ward-reports-banner.jpg"
              alt="Municipal maintenance vehicle night scene in Mira Bhayandar"
              fill
              className={styles.bannerBgImage}
              priority
            />
            <div className={styles.bannerOverlay} />

            <div className={styles.bannerContent}>
              <div className={styles.breadcrumb}>
                <Link href="/staff/dashboard" className={styles.crumbLink}>
                  Dashboard
                </Link>
                <span className={styles.crumbSep}>&gt;</span>
                <span className={styles.crumbActive}>Help &amp; Support</span>
              </div>
              <h1 className={styles.bannerTitle}>Help &amp; Support</h1>
              <p className={styles.bannerSubtitle}>
                Find answers, guides and support to help you manage civic issues effectively.
              </p>
            </div>

            <div className={styles.bannerRightSlogan}>
              <span className={styles.sloganLine}>We&apos;re Here</span>
              <span className={styles.sloganLine}>to Support a</span>
              <span className={styles.sloganLine}>Cleaner Mira Bhayandar</span>
              <svg className={styles.sloganSmileCurve} viewBox="0 0 90 10" fill="none">
                <path d="M2 2C25 10 65 10 88 2" stroke="#00e599" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ============================================================
              2. FOUR QUICK-ACCESS CARDS
              ============================================================ */}
          <div className={styles.quickAccessRow}>
            {/* Card 1: Knowledge Base */}
            <div
              className={styles.quickCard}
              onClick={() => {
                setSelectedCategoryId('getting-started');
                setKbSearchQuery('');
                showToast('Viewing Knowledge Base guides.');
              }}
            >
              <div className={styles.quickCardLeft}>
                <div className={`${styles.quickIconBox} ${styles.iconTeal}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <div className={styles.quickCardText}>
                  <div className={styles.quickCardTitle}>Knowledge Base</div>
                  <div className={styles.quickCardSubtitle}>Step-by-step guides and FAQs</div>
                </div>
              </div>
              <span className={styles.quickArrow}>&gt;</span>
            </div>

            {/* Card 2: Video Tutorials */}
            <div className={styles.quickCard} onClick={() => setIsVideoModalOpen(true)}>
              <div className={styles.quickCardLeft}>
                <div className={`${styles.quickIconBox} ${styles.iconBlue}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                  </svg>
                </div>
                <div className={styles.quickCardText}>
                  <div className={styles.quickCardTitle}>Video Tutorials</div>
                  <div className={styles.quickCardSubtitle}>Learn with visual guides</div>
                </div>
              </div>
              <span className={styles.quickArrow}>&gt;</span>
            </div>

            {/* Card 3: Contact Support */}
            <div className={styles.quickCard} onClick={() => setIsContactModalOpen(true)}>
              <div className={styles.quickCardLeft}>
                <div className={`${styles.quickIconBox} ${styles.iconPurple}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className={styles.quickCardText}>
                  <div className={styles.quickCardTitle}>Contact Support</div>
                  <div className={styles.quickCardSubtitle}>Get help from our team</div>
                </div>
              </div>
              <span className={styles.quickArrow}>&gt;</span>
            </div>

            {/* Card 4: Raise a Request */}
            <div className={styles.quickCard} onClick={() => setIsRequestModalOpen(true)}>
              <div className={styles.quickCardLeft}>
                <div className={`${styles.quickIconBox} ${styles.iconHeadset}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>
                <div className={styles.quickCardText}>
                  <div className={styles.quickCardTitle}>Raise a Request</div>
                  <div className={styles.quickCardSubtitle}>Report a technical issue</div>
                </div>
              </div>
              <span className={styles.quickArrow}>&gt;</span>
            </div>
          </div>

          {/* ============================================================
              3. MAIN MIDDLE SECTION (Knowledge Base + Right Side Stack)
              ============================================================ */}
          <div className={styles.middleLayout}>
            {/* ── Left: Knowledge Base Card ── */}
            <div className={styles.panelCard}>
              <div className={styles.kbCardHeader}>
                <div className={styles.kbHeaderLeft}>
                  <span className={styles.kbHeaderIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.kbTitle}>Knowledge Base</div>
                    <div className={styles.kbSubtitle}>Browse guides and FAQs for common tasks.</div>
                  </div>
                </div>

                <div className={styles.kbSearchWrapper}>
                  <span className={styles.kbSearchIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search help articles..."
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                    className={styles.kbSearchInput}
                  />
                </div>
              </div>

              {/* Split Body: Categories on Left, Articles on Right */}
              <div className={styles.kbSplitBody}>
                {/* Left Categories Menu */}
                <div className={styles.categoryMenuList}>
                  {HELP_CATEGORIES.map((cat) => {
                    const isActive = selectedCategoryId === cat.id && !kbSearchQuery;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setKbSearchQuery('');
                        }}
                      >
                        {isActive && <span className={styles.categoryIndicator} />}
                        <span>{cat.name}</span>
                        <span className={styles.categoryCountBadge}>{cat.count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Articles List */}
                <div className={styles.articlesList}>
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((art) => (
                      <div
                        key={art.id}
                        className={styles.articleItemRow}
                        onClick={() => setSelectedArticle(art)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(art)}
                      >
                        <div className={styles.articleLeft}>
                          <div className={styles.articleDocIconBox}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </div>
                          <div className={styles.articleText}>
                            <span className={styles.articleTitle}>{art.title}</span>
                            <span className={styles.articleSummary}>{art.summary}</span>
                          </div>
                        </div>

                        <div className={styles.articleRight}>
                          <span className={styles.readTimeBadge}>{art.readingTime}</span>
                          <span className={styles.articleChevron}>&gt;</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                      No documentation articles matching &quot;{kbSearchQuery}&quot;. Try a different keyword or browse categories.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column: Popular Articles + Need Additional Help ── */}
            <div className={styles.rightColumn}>
              {/* Card 1: Popular Articles */}
              <div className={styles.panelCard}>
                <div className={styles.popularHeader}>
                  <span className={styles.starIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                  <span className={styles.popularTitle}>Popular Articles</span>
                </div>

                <div className={styles.popularList}>
                  {popularArticles.map((art) => (
                    <div
                      key={art.id}
                      className={styles.popularItemRow}
                      onClick={() => setSelectedArticle(art)}
                    >
                      <div className={styles.popularLeft}>
                        <span className={styles.popularRank}>{art.popularRank}</span>
                        <span className={styles.popularItemTitle}>{art.title}</span>
                      </div>
                      <span className={styles.readTimeBadge}>{art.readingTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Need Additional Help? */}
              <div className={styles.needHelpCard}>
                <div className={styles.needHelpHeader}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className={styles.needHelpTitle}>Need Additional Help?</span>
                </div>

                <p className={styles.needHelpSub}>
                  Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                </p>

                {/* Support Agent Visual Illustration */}
                <div className={styles.agentVisualArea}>
                  <svg width="140" height="90" viewBox="0 0 140 90" fill="none">
                    <circle cx="70" cy="38" r="22" fill="#0ea5e9" />
                    <path d="M70 18a16 16 0 0 0-16 16v8h32v-8a16 16 0 0 0-16-16z" fill="#0284c7" />
                    <circle cx="70" cy="38" r="14" fill="#fed7aa" />
                    {/* Headset */}
                    <path d="M54 36a16 16 0 0 1 32 0v8h-4v-8a12 12 0 0 0-24 0v8h-4v-8z" fill="#00e599" />
                    <circle cx="53" cy="42" r="3.5" fill="#00e599" />
                    <circle cx="87" cy="42" r="3.5" fill="#00e599" />
                    <path d="M54 44c0 8 10 10 14 10" stroke="#00e599" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="69" cy="54" r="2.5" fill="#00e599" />
                    {/* Body */}
                    <path d="M38 88c0-16 14-26 32-26s32 10 32 26z" fill="#1e293b" />
                    <path d="M60 88l10-18 10 18z" fill="#0284c7" />
                    {/* Speech bubble */}
                    <rect x="94" y="16" width="36" height="22" rx="6" fill="#00e599" />
                    <circle cx="104" cy="27" r="2" fill="#070c18" />
                    <circle cx="112" cy="27" r="2" fill="#070c18" />
                    <circle cx="120" cy="27" r="2" fill="#070c18" />
                    <polygon points="98,38 94,44 104,38" fill="#00e599" />
                  </svg>
                </div>

                <button
                  type="button"
                  className={styles.contactSupportBtn}
                  onClick={() => setIsContactModalOpen(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. BOTTOM ROW: THREE ACTION PANELS
              ============================================================ */}
          <div className={styles.bottomRow}>
            {/* Panel 1: Submit a Support Request */}
            <div className={styles.bottomActionCard}>
              <div className={styles.bottomCardTop}>
                <div className={`${styles.bottomCardIconBox} ${styles.iconTeal}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div className={styles.bottomCardText}>
                  <div className={styles.bottomCardTitle}>Submit a Support Request</div>
                  <div className={styles.bottomCardSubtitle}>
                    Facing a technical issue or need assistance? Submit a support request and our team will get back to you.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.bottomActionBtnDefault}
                onClick={() => setIsRequestModalOpen(true)}
              >
                + Raise a Request &rarr;
              </button>
            </div>

            {/* Panel 2: System Status */}
            <div className={styles.bottomActionCard}>
              <div className={styles.bottomCardTop}>
                <div className={`${styles.bottomCardIconBox} ${styles.iconTeal}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className={styles.bottomCardText}>
                  <div className={styles.bottomCardTitle}>System Status</div>
                  <div className={styles.statusIndicatorRow}>
                    <span className={styles.statusGreenDot} />
                    <span>All systems are operational</span>
                  </div>
                  <span className={styles.statusLastChecked}>
                    Last updated: 12 Dec 2024, 10:30 AM
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={styles.bottomActionBtnDefault}
                onClick={() => setIsStatusModalOpen(true)}
              >
                View Status &rarr;
              </button>
            </div>

            {/* Panel 3: Emergency Support */}
            <div className={styles.bottomActionCard}>
              <div className={styles.bottomCardTop}>
                <div className={`${styles.bottomCardIconBox} ${styles.bottomCardIconBoxRed}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className={styles.bottomCardText}>
                  <div className={styles.bottomCardTitle}>Emergency Support</div>
                  <div className={styles.bottomCardSubtitle}>
                    For urgent technical issues affecting field operations.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.bottomActionBtnEmergency}
                onClick={() => setIsEmergencyModalOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Contact Emergency Support
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================
          INTERACTIVE MODALS
          ============================================================ */}

      {/* ── 1. Article Detail Modal ── */}
      {selectedArticle && (
        <div className={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
          <div className={styles.articleModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalArticleTitle}>{selectedArticle.title}</h2>
                <div className={styles.modalArticleMeta}>
                  <span>Reading time: {selectedArticle.readingTime}</span>
                  <span>•</span>
                  <span>Category: {selectedArticle.categoryId.replace('-', ' ').toUpperCase()}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedArticle(null)}
                aria-label="Close article"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.articleContentBody}>
              <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>{selectedArticle.summary}</p>

              {selectedArticle.sections.map((sec, idx) => (
                <div key={idx}>
                  <div className={styles.articleSectionHeading}>{sec.heading}</div>
                  {sec.content && <p>{sec.content}</p>}
                  {sec.steps && (
                    <ol className={styles.stepsOrderedList}>
                      {sec.steps.map((st, sIdx) => (
                        <li key={sIdx}>{st}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}

              {selectedArticle.tips && selectedArticle.tips.length > 0 && (
                <div className={styles.articleTipBox}>
                  <span className={styles.tipIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </span>
                  <div>
                    <strong>Pro Tip:</strong> {selectedArticle.tips.join(' ')}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setSelectedArticle(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={() => {
                  showToast('Thank you! Feedback recorded.');
                  setSelectedArticle(null);
                }}
              >
                Mark as Helpful ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Raise a Support Request Modal ── */}
      {isRequestModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRequestModalOpen(false)}>
          <div className={styles.formModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                Raise a Technical Support Request
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsRequestModalOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitSupportRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Request Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Map marker coordinates offset in Shanti Nagar"
                  value={requestSubject}
                  onChange={(e) => setRequestSubject(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Field Operations App">Field Operations App</option>
                    <option value="Resolution & Camera Upload">Resolution &amp; Camera Upload</option>
                    <option value="GIS / Satellite Map">GIS / Satellite Map</option>
                    <option value="Login & Authentication">Login &amp; Authentication</option>
                    <option value="Reports & Data Export">Reports &amp; Data Export</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    value={requestPriority}
                    onChange={(e) => setRequestPriority(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="Low">Low (General Query)</option>
                    <option value="Medium">Medium (Minor Glitch)</option>
                    <option value="High">High (Impacting Dispatch)</option>
                    <option value="Urgent">Urgent (Field Halting)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Related Issue Ticket ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CP-10421"
                  value={requestIssueId}
                  onChange={(e) => setRequestIssueId(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Detailed Description</label>
                <textarea
                  placeholder="Explain what happened, including any error messages or reproduction steps..."
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  className={styles.formTextarea}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Contact Support Modal ── */}
      {isContactModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsContactModalOpen(false)}>
          <div className={styles.formModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Contact Municipal Support Desk</div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsContactModalOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitContact} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject</label>
                <input
                  type="text"
                  placeholder="How can we assist your ward duties today?"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Message</label>
                <textarea
                  placeholder="Type your message to the MBMC IT and municipal coordination team..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className={styles.formTextarea}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsContactModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. System Status Modal ── */}
      {isStatusModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsStatusModalOpen(false)}>
          <div className={styles.articleModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalArticleTitle}>CivicPulse Municipal Infrastructure Status</h2>
                <div className={styles.modalArticleMeta}>
                  <span>MBMC Cloud Datacenter, Mumbai Region</span>
                  <span>•</span>
                  <span>99.98% Historical SLA</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsStatusModalOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SYSTEM_SERVICES.map((srv) => (
                <div
                  key={srv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>{srv.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Latency: {srv.latency} · 30-day uptime: {srv.uptime}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#22c55e',
                      background: 'rgba(34, 197, 94, 0.12)',
                      padding: '3px 10px',
                      borderRadius: '16px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={() => setIsStatusModalOpen(false)}
              >
                Close Status Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Emergency Support Modal ── */}
      {isEmergencyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEmergencyModalOpen(false)}>
          <div className={styles.formModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ef4444' }}>
                Emergency Operations Escalation
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsEmergencyModalOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              Use this channel <strong>only</strong> for critical system disruptions impacting on-ground safety,
              active gas/water pipeline excavations, or severe municipal network outages in Mira Bhayandar.
            </p>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#fca5a5',
              }}
            >
              • MBMC Central Command Hotline: <strong>1800-22-3042</strong> (24x7)<br />
              • Disaster Management Cell: <strong>+91 22 2819 2828</strong><br />
              • Duty Supervisor: <strong>Sandeep Jadhav (Ward 3)</strong>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setIsEmergencyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.bottomActionBtnEmergency}
                style={{ width: 'auto', marginTop: 0 }}
                onClick={handleTriggerEmergency}
              >
                Broadcast Emergency Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Video Tutorials Modal ── */}
      {isVideoModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsVideoModalOpen(false)}>
          <div className={styles.articleModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalArticleTitle}>Interactive Visual Guides &amp; Tutorials</h2>
                <div className={styles.modalArticleMeta}>
                  <span>Mira Bhayandar Municipal Corporation · Ward Operations Training</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsVideoModalOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
                onClick={() => showToast('Opening Field Inspection Walkthrough...')}
              >
                <div style={{ height: '90px', background: '#070d1e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '8px' }}>
                  Field Inspection &amp; Photo Proof
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Duration: 4 mins · HD Tutorial</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
                onClick={() => showToast('Opening GIS Map Routing Tutorial...')}
              >
                <div style={{ height: '90px', background: '#070d1e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e599' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '8px' }}>
                  GIS Map Routing &amp; Team Patrols
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Duration: 6 mins · HD Tutorial</div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={() => setIsVideoModalOpen(false)}
              >
                Close Tutorials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Notice Modal ── */}
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
