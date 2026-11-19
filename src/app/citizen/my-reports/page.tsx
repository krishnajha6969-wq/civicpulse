'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, AuthUser } from '../../../lib/auth';
import {
  getCitizenReports,
  getReportSummaryCounts,
  ROHAN_INITIAL_REPORTS,
  CivicReport,
  ReportStatus,
  ReportPriority,
  ReportCategory,
} from '../../../lib/reports';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './my-reports.module.css';

const PAGE_SIZE = 5;

const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'roads', label: 'Roads' },
  { id: 'water', label: 'Water' },
  { id: 'waste', label: 'Waste' },
  { id: 'streetlights', label: 'Streetlights' },
  { id: 'drainage', label: 'Drainage' },
  { id: 'parks', label: 'Parks & Public Spaces' },
  { id: 'transport', label: 'Public Transport' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'other', label: 'Other' },
];

function MyReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Status Filter State ('all' | 'in_progress' | 'resolved' | 'awaiting')
  const initialStatusParam = searchParams?.get('status') as ReportStatus | null;
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(
    initialStatusParam && ['in_progress', 'resolved', 'awaiting'].includes(initialStatusParam)
      ? initialStatusParam
      : 'all'
  );

  // Search & Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'highest_priority' | 'recently_updated'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Report State for Details Panel
  const initialReportParam = searchParams?.get('reportId');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialReportParam || null);

  // Details Tab: 'overview' | 'photos' | 'updates'
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'photos' | 'updates'>('overview');

  // Photo Lightbox State
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Notice Modal for user actions & upcoming features
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
    badge: 'CivicPulse Alert',
  });

  const openNotice = useCallback(
    (title: string, message: string, stageNote: string = 'Civic Service Desk', badge: string = 'Notice') => {
      setModalState({
        isOpen: true,
        title,
        message,
        stageNote,
        badge,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Check persistent session on mount
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Sync URL search params to statusFilter and selectedReportId
  useEffect(() => {
    const statusParam = searchParams?.get('status') as ReportStatus | null;
    if (statusParam && ['in_progress', 'resolved', 'awaiting'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
    const reportParam = searchParams?.get('reportId');
    if (reportParam) {
      setSelectedReportId(reportParam);
    }
  }, [searchParams]);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  const handleLoadDemoReports = () => {
    if (!user) return;
    try {
      localStorage.setItem(`civicpulse_citizen_reports_${user.id}`, JSON.stringify(ROHAN_INITIAL_REPORTS));
      window.location.reload();
    } catch {
      // Ignore
    }
  };

  // Dynamically load reports scoped to this citizen
  const citizenReports: CivicReport[] = useMemo(() => {
    if (!user) return [];
    return getCitizenReports(user.id);
  }, [user]);

  // Dynamic summary counts directly from the user's report records
  const summaryCounts = useMemo(() => {
    return getReportSummaryCounts(citizenReports);
  }, [citizenReports]);

  // Filtered & Sorted reports
  const filteredReports = useMemo(() => {
    let result = [...citizenReports];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        (r) => r.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ticketId.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          (r.address && r.address.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') return b.timestamp - a.timestamp;
      if (sortOption === 'oldest') return a.timestamp - b.timestamp;
      if (sortOption === 'highest_priority') {
        const priorityWeight: Record<ReportPriority, number> = {
          'High priority': 3,
          'Medium priority': 2,
          'Low priority': 1,
        };
        const pA = priorityWeight[a.priority] || 1;
        const pB = priorityWeight[b.priority] || 1;
        if (pA !== pB) return pB - pA;
        return b.timestamp - a.timestamp;
      }
      if (sortOption === 'recently_updated') {
        return b.timestamp - a.timestamp;
      }
      return 0;
    });

    return result;
  }, [citizenReports, statusFilter, selectedCategory, searchQuery, sortOption]);

  // Reset pagination to page 1 whenever search, status filter, or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedCategory, sortOption]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  // Ensure currentPage doesn't exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Current page records
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  // Selected report calculation
  const selectedReport = useMemo(() => {
    if (!filteredReports.length) return null;
    if (selectedReportId) {
      const found = filteredReports.find((r) => r.id === selectedReportId);
      if (found) return found;
    }
    return filteredReports[0];
  }, [filteredReports, selectedReportId]);

  // Auto-set selected report ID if not set or out of filter
  useEffect(() => {
    if (selectedReport && selectedReport.id !== selectedReportId) {
      setSelectedReportId(selectedReport.id);
    }
  }, [selectedReport, selectedReportId]);

  // User initials for avatar fallback
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }, [user]);

  // Clear all filters handler
  const handleClearFilters = () => {
    setStatusFilter('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  // Priority badge helper
  const renderPriorityBadge = (priority: ReportPriority) => {
    let badgeClass = styles.priorityMedium;
    if (priority === 'High priority') badgeClass = styles.priorityHigh;
    if (priority === 'Low priority') badgeClass = styles.priorityLow;

    return (
      <span className={`${styles.priorityBadge} ${badgeClass}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {priority}
      </span>
    );
  };

  // Status badge helper
  const renderStatusBadge = (status: ReportStatus) => {
    if (status === 'in_progress') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          In Progress
        </span>
      );
    }
    if (status === 'resolved') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusResolved}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Resolved
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.statusAwaiting}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
        Awaiting Update
      </span>
    );
  };

  // Category Icon helper
  const renderCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'roads':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19L8 5h8l4 14" />
            <line x1="12" y1="8" x2="12" y2="10" />
            <line x1="12" y1="14" x2="12" y2="16" />
          </svg>
        );
      case 'water':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'waste':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        );
      case 'streetlights':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          </svg>
        );
      case 'drainage':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        );
      case 'parks':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22v-7" />
            <path d="M7 10a5 5 0 0 1 10 0 5 5 0 0 1 1 5H6a5 5 0 0 1 1-5z" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  // Guard: Protect citizen workspace for authenticated citizen accounts
  if (!user || (user.role !== 'citizen' && user.role !== 'super_admin')) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Authentication Required</h1>
          <p className={styles.authMessage}>
            You must be signed in with a verified citizen account to access your personal CivicPulse reports.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={() => router.push('/auth/login?destination=/citizen/my-reports')}
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

  // Format category display string
  const formatCategoryName = (cat: string) => {
    const found = CATEGORY_OPTIONS.find((c) => c.id === cat.toLowerCase());
    if (found && found.id !== 'all') return found.label;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* ── Left Sidebar Navigation (Citizen Portal) ── */}
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

          {/* 3. My Reports (Active) */}
          <Link
            href="/citizen/my-reports"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
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
          <Image
            src="/images/dashboard/sidebar-promo-iso.png"
            alt="Neighbourhood civic initiative"
            width={200}
            height={95}
            className={styles.sidebarPromoImg}
          />
          <h4 className={styles.sidebarPromoTitle}>A cleaner neighbourhood starts with you.</h4>
          <p className={styles.sidebarPromoSub}>Report. Track. See change.</p>
        </div>
      </aside>

      {/* ── Main Viewport ── */}
      <div className={styles.mainViewport}>
        {/* Topbar Header */}
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search your reports, areas or issue types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search reports"
            />
          </div>

          <div className={styles.topbarRight}>
            <div
              className={styles.locationBadge}
              onClick={() => openNotice('Location Verification', 'Current municipality: Mira Bhayandar, Maharashtra. Ward 3 & 4 active zone.', 'Verified Municipal Boundary', 'Jurisdiction')}
              role="button"
              tabIndex={0}
              aria-label="Select location"
            >
              <span className={styles.locationIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Mira Bhayandar</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

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

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
                suppressHydrationWarning
              >
                {user.avatarUrl ? (
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
                  <span className={styles.userName} suppressHydrationWarning>{user.name}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      openNotice('Profile Settings', `Logged in as: ${user.name} (${user.email}). Phone: +91 98765 43210.`, 'Citizen Account');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push('/citizen');
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Citizen Dashboard
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className={styles.contentScroll}>
          {/* Page Heading Banner with Glowing Night Skyline */}
          <section className={styles.pageHeadingBanner} aria-label="Page Title">
            <div className={styles.headingTextCol}>
              <div className={styles.breadcrumb}>
                <Link href="/citizen" className={styles.breadcrumbLink}>
                  Dashboard
                </Link>
                <span className={styles.breadcrumbSep}>&gt;</span>
                <span className={styles.breadcrumbCurrent}>My Reports</span>
              </div>
              <h1 className={styles.pageTitle}>My Reports</h1>
              <p className={styles.pageSubtitle}>
                Track the status of the issues you have reported.
              </p>
            </div>

            <div className={styles.headingImageCol}>
              <Image
                src="/images/dashboard/mira-bhayandar-skyline.png"
                alt="Mira Bhayandar municipal skyline at night"
                fill
                sizes="(max-width: 1200px) 50vw, 40vw"
                className={styles.headingImage}
                priority
              />
            </div>
          </section>

          {/* Status Filters Row */}
          <section className={styles.statusFiltersRow} aria-label="Status Filters">
            {/* 1. All Reports */}
            <button
              type="button"
              className={`${styles.statusFilterBtn} ${statusFilter === 'all' ? styles.statusFilterBtnActive : ''
                }`}
              onClick={() => setStatusFilter('all')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>All Reports</span>
              <span className={styles.filterCount}>{summaryCounts.total}</span>
            </button>

            {/* 2. In Progress */}
            <button
              type="button"
              className={`${styles.statusFilterBtn} ${styles.statusFilterBtnInProgress} ${statusFilter === 'in_progress' ? styles.statusFilterBtnActive : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>In Progress</span>
              <span className={styles.filterCount}>{summaryCounts.inProgress}</span>
            </button>

            {/* 3. Resolved */}
            <button
              type="button"
              className={`${styles.statusFilterBtn} ${styles.statusFilterBtnResolved} ${statusFilter === 'resolved' ? styles.statusFilterBtnActive : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Resolved</span>
              <span className={styles.filterCount}>{summaryCounts.resolved}</span>
            </button>

            {/* 4. Awaiting Update */}
            <button
              type="button"
              className={`${styles.statusFilterBtn} ${styles.statusFilterBtnAwaiting} ${statusFilter === 'awaiting' ? styles.statusFilterBtnActive : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'awaiting' ? 'all' : 'awaiting')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              <span>Awaiting Update</span>
              <span className={styles.filterCount}>{summaryCounts.awaiting}</span>
            </button>
          </section>

          {/* Search, Category Filter, and Sorting Controls */}
          <section className={styles.controlsRow} aria-label="Search and Filters">
            {/* Search Input */}
            <div className={styles.reportSearchWrap}>
              <span className={styles.reportSearchIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className={styles.reportSearchInput}
                placeholder="Search your reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter report list"
              />
            </div>

            {/* Category Dropdown */}
            <div className={styles.selectWrap}>
              <select
                className={styles.selectControl}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#0d1527', color: '#ffffff' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <span className={styles.selectArrow} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.selectWrap}>
              <select
                className={styles.selectControl}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                aria-label="Sort reports"
              >
                <option value="newest" style={{ background: '#0d1527', color: '#ffffff' }}>Newest First</option>
                <option value="oldest" style={{ background: '#0d1527', color: '#ffffff' }}>Oldest First</option>
                <option value="highest_priority" style={{ background: '#0d1527', color: '#ffffff' }}>Highest Priority</option>
                <option value="recently_updated" style={{ background: '#0d1527', color: '#ffffff' }}>Recently Updated</option>
              </select>
              <span className={styles.selectArrow} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </section>

          {/* If citizen has 0 reports overall: Show clean full-width empty card */}
          {citizenReports.length === 0 ? (
            <div className={styles.fullWidthEmptyCard}>
              <div className={styles.emptyStateIcon}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className={styles.emptyStateTitle}>You haven&apos;t reported any issues yet.</h3>
              <p className={styles.emptyStateText}>
                When you report a local civic issue in Mira Bhayandar, you can track its live progress, resolution photos, and municipal department updates right here.
              </p>
              <div className={styles.emptyActionsRow}>
                <Link href="/citizen/report-issue" className={styles.emptyReportBtn}>
                  <span>Report an Issue</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <button
                  type="button"
                  className={styles.emptySecondaryBtn}
                  onClick={handleLoadDemoReports}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Load Sample Demo Issues</span>
                </button>
              </div>
            </div>
          ) : (
            /* Two-Column Content Grid: Left Report List + Right Selected Report Details */
            <div className={styles.twoColumnGrid}>
              {/* Left Column: Report List Panel */}
              <section className={styles.reportListPanel} aria-label="Reports list">
                {filteredReports.length === 0 ? (
                  /* Empty Search/Filter Results */
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                    <h3 className={styles.emptyStateTitle}>No matching reports found</h3>
                    <p className={styles.emptyStateText}>
                      Try adjusting your search query, status filter, or category.
                    </p>
                    <button
                      type="button"
                      className={styles.clearFiltersBtn}
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                /* Report Rows List */
                <div className={styles.reportListBody}>
                  {paginatedReports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <article
                        key={report.id}
                        className={`${styles.reportRow} ${isSelected ? styles.reportRowSelected : ''
                          }`}
                        onClick={() => setSelectedReportId(report.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                      >
                        <Image
                          src={report.imageUrl || '/images/dashboard/thumb-pothole@2x.jpg'}
                          alt={report.title}
                          width={56}
                          height={56}
                          className={styles.reportThumb}
                        />

                        <div className={styles.reportRowContent}>
                          <div className={styles.reportRowTopLine}>
                            {renderPriorityBadge(report.priority)}
                            <div className={styles.reportRowStatusWrap}>
                              {renderStatusBadge(report.status)}
                            </div>
                          </div>
                          <h3 className={styles.reportRowTitle}>{report.title}</h3>
                          <div className={styles.reportRowMeta}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{report.location}</span>
                            <span>{report.ticketId}</span>
                            <span className={styles.reportRowMetaDot} />
                            <span>{report.reportedDate}</span>
                          </div>
                        </div>

                        <div className={styles.reportRowRight}>
                          <span className={styles.reportRowChevron} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Pagination Bar */}
              {filteredReports.length > 0 && (
                <div className={styles.paginationBar}>
                  <span className={styles.paginationInfo}>
                    Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredReports.length)}–
                    {Math.min(currentPage * PAGE_SIZE, filteredReports.length)} of{' '}
                    {filteredReports.length} reports
                  </span>

                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      &lt;
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`${styles.pageBtn} ${pageNum === currentPage ? styles.pageBtnActive : ''
                          }`}
                        onClick={() => setCurrentPage(pageNum)}
                        aria-current={pageNum === currentPage ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Right Column: Selected Report Details Panel */}
            <section className={styles.detailPanel} id="selected-report-details" aria-label="Selected report details">
              {!selectedReport ? (
                <div className={styles.detailEmpty}>
                  <div className={styles.detailEmptyIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h4 className={styles.detailEmptyTitle}>No report selected</h4>
                  <p className={styles.detailEmptyText}>
                    Select any issue from the list on the left to inspect its live status, photos, and ward updates.
                  </p>
                </div>
              ) : (
                <div className={styles.detailScrollArea}>
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    className={styles.mobileBackBtn}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Back to report list</span>
                  </button>

                  {/* Top Report Header with edit button */}
                  <div className={styles.detailHeader} style={{ position: 'relative' }}>
                    <Image
                      src={selectedReport.imageUrl || '/images/dashboard/thumb-pothole@2x.jpg'}
                      alt={selectedReport.title}
                      width={72}
                      height={72}
                      className={styles.detailThumb}
                    />

                    <div className={styles.detailHeaderInfo}>
                      <h3 className={styles.detailTitle}>{selectedReport.title}</h3>
                      <div className={styles.detailBadges}>
                        {renderStatusBadge(selectedReport.status)}
                        {renderPriorityBadge(selectedReport.priority)}
                      </div>
                      <p className={styles.detailMeta}>
                        {selectedReport.ticketId} • Reported {selectedReport.reportedDate}
                      </p>
                      <p className={styles.detailMeta} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{selectedReport.address || `${selectedReport.location}, Mira Bhayandar, Maharashtra`}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.detailEditBtn}
                      onClick={() =>
                        openNotice(
                          'Edit Report',
                          `Editing ticket ${selectedReport.ticketId} is restricted once assigned to municipal engineering teams. You can attach additional notes via the support desk.`,
                          'Report Modification Policy'
                        )
                      }
                      title="Edit this report"
                      aria-label="Edit report"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>

                  {/* Tabs: Overview, Photos, Updates */}
                  <div className={styles.detailTabs} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeDetailTab === 'overview'}
                      className={`${styles.detailTab} ${activeDetailTab === 'overview' ? styles.detailTabActive : ''
                        }`}
                      onClick={() => setActiveDetailTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeDetailTab === 'photos'}
                      className={`${styles.detailTab} ${activeDetailTab === 'photos' ? styles.detailTabActive : ''
                        }`}
                      onClick={() => setActiveDetailTab('photos')}
                    >
                      Photos ({selectedReport.photos?.length || (selectedReport.imageUrl ? 1 : 0)})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeDetailTab === 'updates'}
                      className={`${styles.detailTab} ${activeDetailTab === 'updates' ? styles.detailTabActive : ''
                        }`}
                      onClick={() => setActiveDetailTab('updates')}
                    >
                      Updates ({selectedReport.updates?.length || 1})
                    </button>
                  </div>

                  {/* Tab 1: Overview */}
                  {activeDetailTab === 'overview' && (
                    <div className={styles.tabContent}>
                      {/* Issue Details Section */}
                      <div className={styles.sectionLabelRow}>
                        <div className={styles.sectionLabel} style={{ margin: 0 }}>
                          <span className={styles.sectionLabelIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </span>
                          <span>Issue Details</span>
                        </div>
                        <button
                          type="button"
                          className={styles.sectionEditBtn}
                          onClick={() => openNotice('Edit Details', `You can propose an update or additional notes for ticket ${selectedReport.ticketId}.`, 'Issue Modification')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className={styles.detailFieldsGrid}>
                        <div className={styles.fieldLabel}>
                          <span className={styles.fieldLabelIcon}>
                            {renderCategoryIcon(selectedReport.category)}
                          </span>
                          <span>Category</span>
                        </div>
                        <div className={styles.fieldValue}>
                          {formatCategoryName(selectedReport.category)}
                        </div>

                        <div className={styles.fieldLabel}>
                          <span className={styles.fieldLabelIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" />
                              <line x1="3" y1="12" x2="3.01" y2="12" />
                              <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                          </span>
                          <span>Description</span>
                        </div>
                        <div className={styles.fieldValue}>
                          {selectedReport.description ||
                            'Civic infrastructure issue flagged for departmental inspection.'}
                        </div>

                        <div className={styles.fieldLabel}>
                          <span className={styles.fieldLabelIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </span>
                          <span>Reported on</span>
                        </div>
                        <div className={styles.fieldValue}>
                          {selectedReport.fullReportedDate || `${selectedReport.reportedDate}`}
                        </div>
                      </div>

                      {/* Location Section */}
                      <div className={styles.locationSection}>
                        <div className={styles.sectionLabel}>
                          <span className={styles.sectionLabelIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </span>
                          <span>Location</span>
                        </div>

                        <div className={styles.locationCard}>
                          <Image
                            src="/images/dashboard/realistic-map-crop.png"
                            alt="Map location preview with pin marker"
                            width={96}
                            height={72}
                            className={styles.locationMapPreview}
                          />
                          <div className={styles.locationDetails}>
                            <div className={styles.locationText}>
                              <span className={styles.locationPrimary}>
                                {selectedReport.location === 'Mira Road (E)' ? 'Station Road' : selectedReport.location}
                              </span>
                              <span className={styles.locationSecondary}>{selectedReport.location}</span>
                              <span className={styles.locationSecondary}>Mira Bhayandar, Maharashtra</span>
                            </div>
                            <button
                              type="button"
                              className={styles.viewMapBtn}
                              onClick={() =>
                                openNotice(
                                  'Interactive Municipal Map',
                                  `Coordinates: ${selectedReport.lat || '19.2952'}° N, ${selectedReport.lng || '72.8544'}° E. Location verified in Ward 3 jurisdiction.`,
                                  'GIS Mapping Service',
                                  'Location'
                                )
                              }
                            >
                              <span>View on Map</span>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Current Status Section & Horizontal Timeline */}
                      <div className={styles.timelineSection}>
                        <div className={styles.sectionLabel}>
                          <span className={styles.sectionLabelIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                          </span>
                          <span>Current Status</span>
                        </div>

                        {/* Connected 4-stage horizontal timeline */}
                        <div className={styles.timelineTrack}>
                          {/* Active line between stages */}
                          <div
                            className={styles.timelineProgressLine}
                            style={{
                              width:
                                selectedReport.status === 'resolved'
                                  ? 'calc(100% - 40px)'
                                  : selectedReport.status === 'in_progress'
                                    ? 'calc(66% - 20px)'
                                    : 'calc(33% - 10px)',
                            }}
                          />
                          {/* 1. Reported */}
                          <div className={styles.timelineStep}>
                            <div className={`${styles.timelineNode} ${styles.timelineNodeCompleted}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span className={`${styles.timelineStepLabel} ${styles.timelineStepLabelActive}`}>
                              Reported
                            </span>
                            <span className={styles.timelineStepTime}>
                              {selectedReport.timeline?.[0]?.date || selectedReport.reportedDate}
                            </span>
                          </div>

                          {/* 2. Assigned */}
                          <div className={styles.timelineStep}>
                            <div
                              className={`${styles.timelineNode} ${selectedReport.status === 'resolved' || selectedReport.status === 'in_progress'
                                  ? styles.timelineNodeCompleted
                                  : selectedReport.status === 'awaiting'
                                    ? styles.timelineNodeCurrent
                                    : ''
                                }`}
                            >
                              {selectedReport.status === 'resolved' || selectedReport.status === 'in_progress' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="3" />
                                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`${styles.timelineStepLabel} ${selectedReport.status !== 'awaiting' ? styles.timelineStepLabelActive : ''
                                }`}
                            >
                              Assigned
                            </span>
                            <span className={styles.timelineStepTime}>
                              {selectedReport.timeline?.[1]?.date || (selectedReport.status !== 'awaiting' ? '13 Dec' : 'Pending')}
                            </span>
                          </div>

                          {/* 3. In Progress */}
                          <div className={styles.timelineStep}>
                            <div
                              className={`${styles.timelineNode} ${selectedReport.status === 'resolved'
                                  ? styles.timelineNodeCompleted
                                  : selectedReport.status === 'in_progress'
                                    ? styles.timelineNodeCurrent
                                    : ''
                                }`}
                            >
                              {selectedReport.status === 'resolved' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`${styles.timelineStepLabel} ${selectedReport.status === 'in_progress' || selectedReport.status === 'resolved'
                                  ? styles.timelineStepLabelActive
                                  : ''
                                }`}
                            >
                              In Progress
                            </span>
                            <span className={styles.timelineStepTime}>
                              {selectedReport.timeline?.[2]?.date || (selectedReport.status === 'in_progress' ? '14 Dec, 2:20 PM' : '—')}
                            </span>
                          </div>

                          {/* 4. Resolved */}
                          <div className={styles.timelineStep}>
                            <div
                              className={`${styles.timelineNode} ${selectedReport.status === 'resolved' ? styles.timelineNodeCompleted : ''
                                }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span
                              className={`${styles.timelineStepLabel} ${selectedReport.status === 'resolved' ? styles.timelineStepLabelActive : ''
                                }`}
                            >
                              Resolved
                            </span>
                            <span className={styles.timelineStepTime}>
                              {selectedReport.timeline?.[3]?.date || (selectedReport.status === 'resolved' ? 'Completed' : '—')}
                            </span>
                          </div>
                        </div>

                        {/* Latest update card below timeline */}
                        <div className={styles.latestUpdateCard}>
                          <div className={styles.updateIconCircle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                          </div>
                          <div className={styles.updateContent}>
                            <h4 className={styles.updateTitle}>
                              {selectedReport.latestUpdate?.title ||
                                (selectedReport.status === 'resolved'
                                  ? 'Issue successfully resolved'
                                  : selectedReport.status === 'in_progress'
                                    ? 'Work in progress'
                                    : 'Awaiting ward assignment')}
                            </h4>
                            <p className={styles.updateDesc}>
                              {selectedReport.latestUpdate?.description ||
                                'The issue has been assigned to the ward team and repair work has started at the location.'}
                            </p>
                          </div>
                          <span className={styles.updateTime}>
                            {selectedReport.latestUpdate?.timeAgo || '2 hours ago'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Photos */}
                  {activeDetailTab === 'photos' && (
                    <div className={styles.tabContent}>
                      {selectedReport.photos && selectedReport.photos.length > 0 ? (
                        <div className={styles.photosGrid}>
                          {selectedReport.photos.map((photoUrl, idx) => (
                            <div
                              key={idx}
                              className={styles.photoItem}
                              onClick={() => setLightboxPhoto(photoUrl)}
                              role="button"
                              tabIndex={0}
                              aria-label={`View photo ${idx + 1} full size`}
                            >
                              <Image
                                src={photoUrl}
                                alt={`Report photo ${idx + 1}`}
                                width={180}
                                height={135}
                                className={styles.photoImage}
                              />
                            </div>
                          ))}
                        </div>
                      ) : selectedReport.imageUrl ? (
                        <div className={styles.photosGrid}>
                          <div
                            className={styles.photoItem}
                            onClick={() => setLightboxPhoto(selectedReport.imageUrl)}
                            role="button"
                            tabIndex={0}
                            aria-label="View photo full size"
                          >
                            <Image
                              src={selectedReport.imageUrl}
                              alt="Report photo"
                              width={240}
                              height={180}
                              className={styles.photoImage}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className={styles.emptyState} style={{ padding: '24px 0' }}>
                          <p className={styles.emptyStateText}>
                            No photos attached to this report.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Updates */}
                  {activeDetailTab === 'updates' && (
                    <div className={styles.tabContent}>
                      {selectedReport.updates && selectedReport.updates.length > 0 ? (
                        <div className={styles.updatesList}>
                          {selectedReport.updates.map((upd) => {
                            let iconClass = styles.updateEntryIconBlue;
                            if (upd.type === 'resolved') iconClass = styles.updateEntryIconGreen;
                            if (upd.type === 'progress') iconClass = styles.updateEntryIconAmber;
                            if (upd.type === 'status_change') iconClass = styles.updateEntryIconPurple;

                            return (
                              <div key={upd.id} className={styles.updateEntry}>
                                <div className={`${styles.updateEntryIcon} ${iconClass}`}>
                                  {upd.type === 'resolved' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : upd.type === 'progress' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="12 6 12 12 16 14" />
                                      <circle cx="12" cy="12" r="10" />
                                    </svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                  )}
                                </div>
                                <div className={styles.updateEntryContent}>
                                  <h4 className={styles.updateEntryTitle}>{upd.title}</h4>
                                  <p className={styles.updateEntryDesc}>{upd.description}</p>
                                </div>
                                <span className={styles.updateEntryTime}>{upd.timeAgo}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.updatesList}>
                          <div className={styles.updateEntry}>
                            <div className={`${styles.updateEntryIcon} ${styles.updateEntryIconBlue}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <div className={styles.updateEntryContent}>
                              <h4 className={styles.updateEntryTitle}>Report logged</h4>
                              <p className={styles.updateEntryDesc}>
                                Ticket registered in civic database and assigned ticket {selectedReport.ticketId}.
                              </p>
                            </div>
                            <span className={styles.updateEntryTime}>{selectedReport.reportedDate}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
        </main>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close enlarged photo"
          >
            &times;
          </button>
          <Image
            src={lightboxPhoto}
            alt="Enlarged view"
            width={800}
            height={600}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Standard Notice Modal */}
      <NoticeModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        stageNote={modalState.stageNote}
        badge={modalState.badge}
        onClose={closeModal}
      />
    </div>
  );
}

export default function MyReportsPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#060c18' }} />}>
      <MyReportsContent />
    </React.Suspense>
  );
}

