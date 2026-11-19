'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, AuthUser } from '../../lib/auth';
import {
  getCitizenReports,
  getReportSummaryCounts,
  MAP_ISSUES,
  RECENT_UPDATES,
  CivicReport,
  MapIssue,
  ReportStatus,
} from '../../lib/reports';
import NoticeModal from '../../components/ui/NoticeModal';
import styles from './citizen.module.css';

export default function CitizenDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Profile menu dropdown state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Search and status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');

  // Interactive Map State
  const [selectedMapIssue, setSelectedMapIssue] = useState<MapIssue>(MAP_ISSUES[0]);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('all');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [fullMapModalOpen, setFullMapModalOpen] = useState(false);

  // Ward Selector State
  const [selectedWard, setSelectedWard] = useState('Mira Bhayandar');
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const wardOptions = [
    'Mira Bhayandar (All Wards)',
    'Ward 1 - Mira Road (East)',
    'Ward 2 - Mira Road (West)',
    'Ward 3 - Bhayandar (East)',
    'Ward 4 - Bhayandar (West)',
    'Ward 5 - Kanakia / Beverly Park',
  ];

  // Notice Modal State for upcoming action buttons
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    stageNote: '',
    badge: 'Upcoming Feature',
  });

  const openNotice = (
    title: string,
    message: string,
    stageNote: string = 'Scheduled for next release',
    badge: string = 'Upcoming Feature'
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      stageNote,
      badge,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Check persistent session on mount
  useEffect(() => {
    setUser(getCurrentUser());
    if (typeof window !== 'undefined' && window.location.hash === '#recent-reports-panel') {
      setTimeout(() => {
        const el = document.getElementById('recent-reports-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.locationDropdownWrap}`)) {
        setWardDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // Filtered map issues by category
  const filteredMapIssues = useMemo(() => {
    if (mapCategoryFilter === 'all') return MAP_ISSUES;
    return MAP_ISSUES.filter((issue) => issue.category === mapCategoryFilter);
  }, [mapCategoryFilter]);

  // Dynamic reports & summary counts
  const citizenReports: CivicReport[] = useMemo(() => {
    if (!user) return [];
    return getCitizenReports(user.id);
  }, [user]);

  const summaryCounts = useMemo(() => {
    return getReportSummaryCounts(citizenReports);
  }, [citizenReports]);

  // Filtered reports for "Your Recent Reports"
  const filteredReports = useMemo(() => {
    return citizenReports.filter((rep) => {
      const matchesStatus = statusFilter === 'all' || rep.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [citizenReports, statusFilter, searchQuery]);

  // Dynamic greeting based on current local hour
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }, []);

  // First name for friendly heading
  const firstName = useMemo(() => {
    if (!user?.name) return 'Citizen';
    return user.name.split(' ')[0];
  }, [user]);

  // Initials for avatar fallback
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }, [user]);

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
            You must be signed in with a verified citizen account to access the Citizen Portal dashboard.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={() => router.push('/auth/login?destination=/citizen')}
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
    <div className={styles.dashboardContainer}>
      {/* ── Left Sidebar Navigation ── */}
      <aside className={styles.sidebar} aria-label="Citizen portal navigation">
        <Link href="/" className={styles.sidebarBrand}>
          <div className={styles.brandLogo}>
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
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>CITIZEN PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard (Active) */}
          <Link
            href="/citizen"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Report an Issue */}
          <Link
            href="/citizen/report-issue"
            className={styles.navItem}
          >
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
          <Link
            href="/citizen/my-reports"
            className={styles.navItem}
          >
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

          {/* 6. Help & Support */}
          <Link href="/citizen/help-support" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>Help & Support</span>
          </Link>
        </nav>

        {/* Sidebar Bottom Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <img
            src="/images/dashboard/sidebar-promo-iso.png"
            alt="Cleaner neighbourhood artwork"
            className={styles.sidebarPromoImg}
          />
          <h4 className={styles.sidebarPromoTitle}>
            A cleaner neighbourhood starts with you.
          </h4>
          <p className={styles.sidebarPromoSub}>Report. Track. See change.</p>
        </div>
      </aside>

      {/* ── Main Viewport Area ── */}
      <div className={styles.mainViewport}>
        {/* Top Navigation Bar */}
        <header className={styles.topbar}>
          {/* Search Box */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for your reports, areas or issue types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search reports"
            />
          </div>

          {/* Right Controls */}
          <div className={styles.topbarRight}>
            {/* Location Selector with Ward Dropdown */}
            <div className={styles.locationDropdownWrap}>
              <button
                type="button"
                className={styles.locationBadge}
                onClick={() => setWardDropdownOpen(!wardDropdownOpen)}
                aria-expanded={wardDropdownOpen}
                aria-label={`Current location: ${selectedWard}`}
              >
                <span className={styles.locationIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>{selectedWard}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {wardDropdownOpen && (
                <div className={styles.locationDropdown} role="menu">
                  <div className={styles.locationDropdownHeader}>Select Ward / Jurisdiction</div>
                  {wardOptions.map((ward) => (
                    <button
                      key={ward}
                      type="button"
                      className={`${styles.locationDropdownItem} ${selectedWard === ward ? styles.locationDropdownItemActive : ''}`}
                      onClick={() => {
                        setSelectedWard(ward);
                        setWardDropdownOpen(false);
                      }}
                    >
                      <span>{ward}</span>
                      {selectedWard === ward && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              <span className={styles.notifDot} />
            </Link>

            {/* User Profile Trigger & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-expanded={profileMenuOpen}
                aria-label="User account menu"
                suppressHydrationWarning
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.initialsAvatar} suppressHydrationWarning>{initials}</div>
                )}
                <div className={styles.userInfo} suppressHydrationWarning>
                  <span className={styles.userName} suppressHydrationWarning>{user?.name}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown} role="menu">
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7b8fae' }}>
                      {user?.email}
                    </div>
                  </div>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice('Profile Settings', 'Profile information and contact preferences can be updated here.');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openNotice('Civic Preferences', 'Choose preferred ward alerts and notification channels.');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Preferences</span>
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable Dashboard Content ── */}
        <main className={styles.contentScroll}>
          {/* Welcome Section */}
          <section className={styles.welcomeCard} aria-label="Welcome banner">
            <div className={styles.welcomeTextCol}>
              <p className={styles.welcomeGreeting}>{greetingText}</p>
              <h1 className={styles.welcomeHeading}>{firstName}!</h1>
              <p className={styles.welcomeSubtitle}>
                Thanks for being an active citizen. Together we can build a cleaner, safer and stronger city.
              </p>
            </div>
            <div className={styles.welcomeSceneCol}>
              <img
                src="/images/dashboard/welcome-street-scene@2x.jpg"
                alt="Neighbourhood street at night with civic repair teams"
                className={styles.welcomeSceneImg}
              />
            </div>
          </section>

          {/* 4 Summary Metric Cards */}
          <section className={styles.metricsGrid} aria-label="Report summaries">
            {/* 1. Total Reports */}
            <div
              className={styles.metricCard}
              onClick={() => router.push('/citizen/my-reports')}
              role="button"
              tabIndex={0}
              aria-label="View all reports in My Reports"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.metricLeft}>
                <div className={`${styles.metricIconBox} ${styles.metricIconMint}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.metricNumber}>{summaryCounts.total}</h3>
                  <p className={styles.metricLabel}>Total Reports</p>
                </div>
              </div>
              <span className={styles.metricChevron} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            {/* 2. In Progress */}
            <div
              className={styles.metricCard}
              onClick={() => router.push('/citizen/my-reports?status=in_progress')}
              role="button"
              tabIndex={0}
              aria-label="View in progress reports"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.metricLeft}>
                <div className={`${styles.metricIconBox} ${styles.metricIconAmber}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 22h14" />
                    <path d="M5 2h14" />
                    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.metricNumber}>{summaryCounts.inProgress}</h3>
                  <p className={styles.metricLabel}>In Progress</p>
                </div>
              </div>
              <span className={styles.metricChevron} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            {/* 3. Resolved */}
            <div
              className={styles.metricCard}
              onClick={() => router.push('/citizen/my-reports?status=resolved')}
              role="button"
              tabIndex={0}
              aria-label="View resolved reports"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.metricLeft}>
                <div className={`${styles.metricIconBox} ${styles.metricIconBlue}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.metricNumber}>{summaryCounts.resolved}</h3>
                  <p className={styles.metricLabel}>Resolved</p>
                </div>
              </div>
              <span className={styles.metricChevron} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            {/* 4. Awaiting Update */}
            <div
              className={styles.metricCard}
              onClick={() => router.push('/citizen/my-reports?status=awaiting')}
              role="button"
              tabIndex={0}
              aria-label="View awaiting update reports"
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.metricLeft}>
                <div className={`${styles.metricIconBox} ${styles.metricIconViolet}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.metricNumber}>{summaryCounts.awaiting}</h3>
                  <p className={styles.metricLabel}>Awaiting Update</p>
                </div>
              </div>
              <span className={styles.metricChevron} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
          </section>

          {/* ── Middle Two-Column Grid ── */}
          <div className={styles.middleGrid}>
            {/* Left Main Column */}
            <div className={styles.mainColumn}>
              {/* Reports Around You Map Panel */}
              <section className={styles.panel} aria-label="Interactive map of nearby reports">
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleWrap}>
                    <span className={styles.panelIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div>
                      <h2 className={styles.panelTitle}>Reports Around You</h2>
                      <p className={styles.panelSubtitle}>Live view of reported issues in your area.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.panelActionBtn}
                    onClick={() => setFullMapModalOpen(true)}
                  >
                    <span>View in full map</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>

                {/* Category Filters for Map */}
                <div className={styles.mapFilterBar}>
                  {[
                    { id: 'all', label: 'All Issues', count: MAP_ISSUES.length },
                    { id: 'roads', label: 'Roads', count: MAP_ISSUES.filter((i) => i.category === 'roads').length },
                    { id: 'water', label: 'Water', count: MAP_ISSUES.filter((i) => i.category === 'water').length },
                    { id: 'streetlights', label: 'Streetlights', count: MAP_ISSUES.filter((i) => i.category === 'streetlights').length },
                    { id: 'waste', label: 'Waste', count: MAP_ISSUES.filter((i) => i.category === 'waste').length },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.mapFilterPill} ${mapCategoryFilter === cat.id ? styles.mapFilterPillActive : ''}`}
                      onClick={() => setMapCategoryFilter(cat.id)}
                    >
                      <span>{cat.label}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>({cat.count})</span>
                    </button>
                  ))}
                </div>

                {/* Map Viewport Box */}
                <div className={styles.mapWrapper}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transform: `scale(${mapZoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <img
                      src="/images/dashboard/reports-map-view@2x.jpg"
                      alt="Satellite view of neighbourhood streets"
                      className={styles.mapBgImg}
                    />

                    {/* Dynamic Pins Layer */}
                    <div className={styles.mapPinsLayer}>
                      {filteredMapIssues.map((issue) => {
                        let pinClass = styles.pinWarning;
                        if (issue.iconType === 'exclamation') pinClass = styles.pinExclamation;
                        if (issue.iconType === 'water') pinClass = styles.pinWater;
                        if (issue.iconType === 'trash') pinClass = styles.pinTrash;

                        const isSelected = selectedMapIssue?.id === issue.id;

                        return (
                          <button
                            key={issue.id}
                            type="button"
                            className={`${styles.mapPin} ${pinClass} ${isSelected ? styles.mapPinActive : ''}`}
                            style={{ top: `${issue.topPercent}%`, left: `${issue.leftPercent}%` }}
                            onClick={() => setSelectedMapIssue(issue)}
                            aria-label={`Issue: ${issue.title} at ${issue.location}`}
                          >
                            {issue.iconType === 'exclamation' && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            )}
                            {issue.iconType === 'water' && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                              </svg>
                            )}
                            {issue.iconType === 'trash' && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            )}
                            {issue.iconType === 'warning' && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Selected Issue Popup Card */}
                  {selectedMapIssue && (
                    <div className={styles.mapPopupCard}>
                      <img
                        src={selectedMapIssue.imageUrl}
                        alt={selectedMapIssue.title}
                        className={styles.popupThumb}
                      />
                      <div className={styles.popupInfo}>
                        <h4 className={styles.popupTitle}>{selectedMapIssue.title}</h4>
                        <span className={styles.popupLoc}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {selectedMapIssue.location}
                        </span>
                        <span className={styles.priorityPill}>{selectedMapIssue.priority}</span>
                        <button
                          type="button"
                          className={styles.popupActionBtn}
                          onClick={() => router.push('/citizen/my-reports')}
                        >
                          Track Report →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Map Zoom Controls */}
                  <div className={styles.mapZoomControls}>
                    <button
                      type="button"
                      className={styles.mapZoomBtn}
                      onClick={() => setMapZoom((prev) => Math.min(1.6, Number((prev + 0.2).toFixed(1))))}
                      aria-label="Zoom in"
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className={styles.mapZoomBtn}
                      onClick={() => setMapZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(1))))}
                      aria-label="Zoom out"
                      title="Zoom out"
                    >
                      −
                    </button>
                  </div>

                  {/* Recenter / Reset Zoom Button */}
                  <button
                    type="button"
                    className={styles.mapRecenterBtn}
                    onClick={() => {
                      setSelectedMapIssue(MAP_ISSUES[0]);
                      setMapZoom(1);
                      setMapCategoryFilter('all');
                    }}
                    aria-label="Recenter map"
                    title="Recenter and reset zoom"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Your Recent Reports Section */}
              <section id="recent-reports-panel" className={styles.panel} aria-label="Citizen recent reports">
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleWrap}>
                    <span className={styles.panelIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </span>
                    <div>
                      <h2 className={styles.panelTitle}>Your Recent Reports</h2>
                      {statusFilter !== 'all' && (
                        <p className={styles.panelSubtitle}>
                          Filtered by: <strong>{statusFilter.replace('_', ' ')}</strong> (
                          <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            style={{ background: 'none', border: 'none', color: '#5cebaa', cursor: 'pointer', padding: 0 }}
                          >
                            clear filter
                          </button>
                          )
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.panelActionBtn}
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                {filteredReports.length > 0 ? (
                  <div className={styles.reportsGrid}>
                    {filteredReports.slice(0, 3).map((rep) => {
                      let badgeClass = styles.badgeInProgress;
                      let badgeText = 'In progress';
                      if (rep.priority === 'High priority') {
                        badgeClass = styles.badgePriorityHigh;
                        badgeText = 'High priority';
                      } else if (rep.status === 'resolved') {
                        badgeClass = styles.badgeResolved;
                        badgeText = 'Resolved';
                      }

                      return (
                        <div
                          key={rep.id}
                          className={styles.reportCard}
                          onClick={() =>
                            openNotice(
                              rep.title,
                              `Ticket ${rep.ticketId} reported at ${rep.location}. Status: ${rep.status.toUpperCase()}. MBMC Ward Team is assigned.`,
                              'Report Inspection View',
                              rep.priority
                            )
                          }
                          role="button"
                          tabIndex={0}
                        >
                          <img
                            src={rep.imageUrl}
                            alt={rep.title}
                            className={styles.reportThumb}
                          />
                          <div className={styles.reportContent}>
                            <span className={badgeClass}>{badgeText}</span>
                            <h4 className={styles.reportTitle}>{rep.title}</h4>
                            <p className={styles.reportLocation}>{rep.location}</p>
                            <p className={styles.reportMeta}>
                              {rep.reportedDate} • {rep.ticketId}
                            </p>
                          </div>
                          <span className={styles.cardChevron} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <h4 className={styles.emptyStateTitle}>No reports found</h4>
                    <p className={styles.emptyStateText}>
                      {searchQuery
                        ? `No reports matched "${searchQuery}". Try a different keyword.`
                        : 'Spotted a problem in your area? Help us fix it by submitting your first report.'}
                    </p>
                    <button
                      type="button"
                      className={styles.emptyReportBtn}
                      onClick={() => router.push('/citizen/report-issue')}
                    >
                      Report an Issue
                    </button>
                  </div>
                )}
              </section>
            </div>

            {/* Right Side Column */}
            <div className={styles.sideColumn}>
              {/* Report a New Issue Mint Card */}
              <div className={styles.reportActionCard}>
                <img
                  src="/images/dashboard/phone-report@2x.jpg"
                  alt="Reporting issue with smartphone"
                  className={styles.reportActionImg}
                />
                <div className={styles.reportActionBody}>
                  <h3 className={styles.reportActionHeading}>Report a new issue</h3>
                  <p className={styles.reportActionDesc}>
                    Spotted a problem in your area? Help us fix it.
                  </p>
                  <button
                    type="button"
                    className={styles.reportActionBtn}
                    onClick={() => router.push('/citizen/report-issue')}
                  >
                    <span>Report an Issue</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Recent Updates Panel */}
              <section className={styles.panel} aria-label="Recent activity and status updates">
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleWrap}>
                    <span className={styles.panelIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <h2 className={styles.panelTitle}>Recent Updates</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.panelActionBtn}
                    onClick={() =>
                      openNotice(
                        'Recent Updates Feed',
                        'Showing real-time event logs for municipal resolution activities in your ward.',
                        'MBMC Activity Stream',
                        'Live'
                      )
                    }
                  >
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className={styles.updatesTimeline}>
                  {RECENT_UPDATES.map((update) => {
                    let circleClass = styles.iconCircleGreen;
                    if (update.type === 'progress') circleClass = styles.iconCircleBlue;
                    if (update.type === 'assigned') circleClass = styles.iconCircleAmber;
                    if (update.type === 'staff_update') circleClass = styles.iconCirclePurple;

                    return (
                      <div
                        key={update.id}
                        className={styles.updateItem}
                        onClick={() =>
                          openNotice(
                            update.title,
                            `${update.reportTitle} — ${update.timeAgo}. Updated by MBMC Ward response team.`,
                            'Municipal Ticket Log',
                            'Update'
                          )
                        }
                      >
                        <div className={`${styles.updateIconCircle} ${circleClass}`}>
                          {update.type === 'resolved' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {update.type === 'progress' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                          )}
                          {update.type === 'assigned' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M5 22h14" />
                              <path d="M5 2h14" />
                              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                            </svg>
                          )}
                          {update.type === 'staff_update' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          )}
                        </div>

                        <div className={styles.updateContent}>
                          <h4 className={styles.updateTitle}>{update.title}</h4>
                          <p className={styles.updateReportTitle}>{update.reportTitle}</p>
                          <p className={styles.updateTime}>{update.timeAgo}</p>
                        </div>

                        <span className={styles.updateChevron}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Full Geographic Map Modal */}
      {fullMapModalOpen && (
        <div
          className={styles.fullMapModalOverlay}
          onClick={() => setFullMapModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.fullMapModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.fullMapModalHeader}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Mira Bhayandar Municipal Issues Map
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '3px 0 0' }}>
                  Live spatial view of reported civic issues across Ward 1 to 5
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullMapModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.fullMapModalBody}>
              <div className={styles.fullMapViewer}>
                <img
                  src="/images/dashboard/reports-map-view@2x.jpg"
                  alt="Full geographic map"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {MAP_ISSUES.map((issue) => {
                  let pinBg = '#f59e0b';
                  if (issue.iconType === 'exclamation') pinBg = '#ef4444';
                  if (issue.iconType === 'water') pinBg = '#3b82f6';
                  if (issue.iconType === 'trash') pinBg = '#10b981';

                  const isSelected = selectedMapIssue?.id === issue.id;

                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => setSelectedMapIssue(issue)}
                      style={{
                        position: 'absolute',
                        top: `${issue.topPercent}%`,
                        left: `${issue.leftPercent}%`,
                        transform: isSelected ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                        background: pinBg,
                        border: isSelected ? '3px solid #5cebaa' : '2px solid #ffffff',
                        boxShadow: isSelected ? '0 0 16px #5cebaa' : '0 2px 8px rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        zIndex: isSelected ? 30 : 10,
                      }}
                    >
                      <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>•</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.fullMapListCol}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5cebaa', textTransform: 'uppercase' }}>
                  Reported Issues ({MAP_ISSUES.length})
                </div>
                {MAP_ISSUES.map((issue) => {
                  const isSelected = selectedMapIssue?.id === issue.id;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedMapIssue(issue)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(92, 235, 170, 0.12)' : '#0d1629',
                        border: isSelected ? '1px solid #5cebaa' : '1px solid #1c2b44',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                        {issue.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {issue.location} • {issue.priority}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{issue.reportedDate}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullMapModalOpen(false);
                            router.push('/citizen/my-reports');
                          }}
                          style={{
                            fontSize: '0.7rem',
                            color: '#5cebaa',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                          }}
                        >
                          View in Reports →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Informative Action Feedback */}
      <NoticeModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        stageNote={modalState.stageNote}
        badge={modalState.badge}
      />
    </div>
  );
}
