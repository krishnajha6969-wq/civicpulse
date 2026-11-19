'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, DEFAULT_WARD_STAFF, AuthUser } from '../../../lib/auth';
import {
  StaffIssue,
  StaffIssueStatus,
  StaffIssuePriority,
  StaffIssueCategory,
  getWardStaffIssues,
  updateStaffIssueStatus,
  addStaffIssueNote,
  getIssueSLA,
} from '../../../lib/staff';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './staff-issues.module.css';

type DetailTab = 'overview' | 'photos' | 'location' | 'updates' | 'citizen';
type SortOption = 'newest' | 'oldest' | 'priority_high' | 'priority_low';

function WardStaffAssignedIssuesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Authentication State ──
  const [user, setUser] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && (current.role === 'ward_staff' || current.role === 'super_admin')) {
      return current;
    }
    return DEFAULT_WARD_STAFF;
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('Ward 3');

  // ── Issues & Filtering State ──
  const [issues, setIssues] = useState<StaffIssue[]>(() => getWardStaffIssues(selectedWard));
  const [statusFilter, setStatusFilter] = useState<StaffIssueStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Filter Popover state
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<StaffIssueCategory[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<StaffIssuePriority[]>([]);

  // ── Pagination State (8 items per page) ──
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // ── Selected Issue & Tab State ──
  const [selectedIssueId, setSelectedIssueId] = useState<string>('CP-10421');
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  // ── Modals & Action State ──
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalValue, setStatusModalValue] = useState<StaffIssueStatus>('New');
  const [statusRemark, setStatusRemark] = useState('');

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Notice modal
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

  const openNotice = (title: string, message: string, stageNote?: string, badge?: string) => {
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

  // Load issues on mount & sync across tabs
  useEffect(() => {
    const loaded = getWardStaffIssues(selectedWard);
    setIssues(loaded);

    const handleSync = () => {
      setIssues(getWardStaffIssues(selectedWard));
    };
    window.addEventListener('civicpulse_ward_staff_updated', handleSync);
    return () => window.removeEventListener('civicpulse_ward_staff_updated', handleSync);
  }, [selectedWard]);

  // Sync search params (e.g. from Dashboard KPI cards or search)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const issueIdParam = searchParams.get('issueId');

    if (statusParam) {
      setStatusFilter(statusParam as StaffIssueStatus);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (issueIdParam) {
      setSelectedIssueId(issueIdParam);
    }
  }, [searchParams]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // Filtered and Sorted Issues
  const filteredIssues = useMemo(() => {
    let result = issues.filter((item) => {
      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      // Category filter popover
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
        return false;
      }
      // Priority filter popover
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(item.priority)) {
        return false;
      }
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchId = item.id.toLowerCase().includes(q) || item.ticketId.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchCitizen = item.citizenName && item.citizenName.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchLoc && !matchCat && !matchCitizen) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return b.id.localeCompare(a.id);
      }
      if (sortOption === 'oldest') {
        return a.id.localeCompare(b.id);
      }
      if (sortOption === 'priority_high') {
        const order: Record<StaffIssuePriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Others: 0 };
        return order[b.priority] - order[a.priority];
      }
      if (sortOption === 'priority_low') {
        const order: Record<StaffIssuePriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Others: 0 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

    return result;
  }, [issues, statusFilter, selectedCategories, selectedPriorities, searchQuery, sortOption]);

  // Paginated Issues
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize));
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, currentPage, pageSize]);

  // Currently Selected Issue
  const selectedIssue = useMemo(() => {
    const found = issues.find((i) => i.id === selectedIssueId);
    return found || issues[0] || null;
  }, [issues, selectedIssueId]);

  // Counts for Top Filter Toolbar
  const statusCounts = useMemo(() => {
    return {
      all: 24,
      newCount: 4,
      inProgressCount: 12,
      overdueCount: 6,
      resolvedCount: 18,
    };
  }, []);

  // Update Status handler
  const handleOpenStatusModal = () => {
    if (selectedIssue) {
      setStatusModalValue(selectedIssue.status);
      setStatusRemark('');
      setStatusModalOpen(true);
    }
  };

  const handleSaveStatus = () => {
    if (!selectedIssue) return;
    const updated = updateStaffIssueStatus(
      selectedIssue.id,
      statusModalValue,
      statusRemark,
      user?.name || 'Sandeep Jadhav'
    );
    setIssues(updated);
    setStatusModalOpen(false);
    showToast(`Issue ${selectedIssue.id} updated to ${statusModalValue}`);
  };

  // Add Note handler
  const handleOpenNoteModal = () => {
    setNoteText('');
    setNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!selectedIssue || !noteText.trim()) return;
    const updated = addStaffIssueNote(
      selectedIssue.id,
      noteText.trim(),
      user?.name || 'Sandeep Jadhav'
    );
    setIssues(updated);
    setNoteModalOpen(false);
    showToast(`Internal note recorded on ${selectedIssue.id}`);
  };

  // Switch to Location Tab on "View on Map"
  const handleViewOnMap = () => {
    setActiveTab('location');
  };

  // Category Icon helper
  const renderCategoryIcon = (category: StaffIssueCategory) => {
    switch (category) {
      case 'roads':
        return (
          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="20" x2="8" y2="4" />
              <line x1="20" y1="20" x2="16" y2="4" />
              <line x1="12" y1="6" x2="12" y2="8" />
              <line x1="12" y1="12" x2="12" y2="14" />
              <line x1="12" y1="18" x2="12" y2="20" />
            </svg>
          </span>
        );
      case 'streetlights':
        return (
          <span style={{ color: '#eab308', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </span>
        );
      case 'waste':
        return (
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </span>
        );
      case 'water':
        return (
          <span style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </span>
        );
      case 'drainage':
        return (
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18" />
            </svg>
          </span>
        );
      default:
        return (
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
            </svg>
          </span>
        );
    }
  };

  const getCategoryLabel = (category: StaffIssueCategory) => {
    switch (category) {
      case 'roads':
        return 'Roads';
      case 'streetlights':
        return 'Streetlights';
      case 'waste':
        return 'Waste';
      case 'water':
        return 'Water';
      case 'drainage':
        return 'Drainage';
      case 'parks':
        return 'Parks';
      case 'transport':
        return 'Transport';
      default:
        return 'Other';
    }
  };

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

        <div className={styles.sidebarSectionLabel}>WARD STAFF PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard */}
          <Link href="/staff/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Assigned Issues (Active) */}
          <Link
            href="/staff/issues"
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
            <span className={styles.navLabel}>Assigned Issues</span>
          </Link>

          {/* 3. Field Operations */}
          <Link
            href="/staff/field-operations"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span className={styles.navLabel}>Field Operations</span>
          </Link>

          {/* 4. Resolution Updates */}          <Link
            href="/staff/resolution-updates"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </span>
            <span className={styles.navLabel}>Resolution Updates</span>
          </Link>

          {/* 5. Ward Reports */}
          <Link
            href="/staff/ward-reports"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className={styles.navLabel}>Ward Reports</span>
          </Link>

          {/* 6. Profile & Settings */}
          <Link
            href="/staff/settings"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className={styles.navLabel}>Profile & Settings</span>
          </Link>

          {/* 7. Help & Support */}
          <Link href="/staff/help" className={styles.navItem}>
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

        {/* Lower Promo Card */}
        <div className={styles.promoCard}>
          <div className={styles.promoImageWrap}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Mira Bhayandar 3D City"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <h4 className={styles.promoTitle}>Cleaner wards stronger communities.</h4>
          <p className={styles.promoSubtitle}>Track. Resolve. Build a better Mira Bhayandar.</p>
        </div>
      </aside>

      {/* ============================================================
          MAIN WRAPPER
          ============================================================ */}
      <div className={styles.mainWrapper}>
        {/* TOP NAVIGATION BAR */}
        <header className={styles.topNav}>
          <div className={styles.topSearchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.topSearchInput}
              placeholder="Search issues, report ID, location, or citizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Global search"
            />
          </div>

          <div className={styles.topNavActions}>
            {/* Ward Selector Pill */}
            <div className={styles.wardPill} title="Authorized Municipal Ward">
              <span className={styles.wardDot} />
              <span>{selectedWard}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              className={styles.notifBtn}
              onClick={() => showToast('5 urgent issue updates pending review in Ward 3')}
              aria-label="Staff notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifBadge}>5</span>
            </button>

            {/* Staff Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.profileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                suppressHydrationWarning
              >
                <div className={styles.avatarCircle} suppressHydrationWarning>SJ</div>
                <div className={styles.profileMeta}>
                  <span className={styles.profileName} suppressHydrationWarning>{user?.name || 'Sandeep Jadhav'}</span>
                  <span className={styles.profileRole}>Ward Staff</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileDropdown}>
                  <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid #1e2c4a' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                      {user?.name || 'Sandeep Jadhav'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{selectedWard} Field Supervisor</div>
                  </div>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      showToast('Demonstration Ward 3 active');
                    }}
                  >
                    Ward 3 (Authorized)
                  </button>
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

        {/* ============================================================
            PAGE BODY CONTENT
            ============================================================ */}
        <main className={styles.contentArea}>
          {/* ── CITYSCAPE HEADER BANNER ── */}
          <section className={styles.banner}>
            <Image
              src="/images/ward/banner.jpg"
              alt="Mira Bhayandar Municipal Ward Operations"
              fill
              priority
              className={styles.bannerBg}
            />
            <div className={styles.bannerOverlay} />

            <div className={styles.bannerTextContent}>
              <div className={styles.breadcrumb}>
                <Link href="/staff/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                  Dashboard
                </Link>
                <span>&gt;</span>
                <span className={styles.breadcrumbCurrent}>Assigned Issues</span>
              </div>
              <h1 className={styles.bannerTitle}>Assigned Issues</h1>
              <p className={styles.bannerSubtitle}>
                View and manage all issues assigned to your ward. Update status, add notes and coordinate field work to ensure timely resolution.
              </p>
            </div>

            <div className={styles.bannerRightBadge}>
              <span className={styles.bannerBadgeHeadline}>On Ground</span>
              <span className={styles.bannerBadgeHeadline}>For Cleaner</span>
              <span className={styles.bannerBadgeSwoosh}>Mira Bhayandar</span>
            </div>
          </section>

          {/* ── FILTER & SEARCH TOOLBAR ── */}
          <section className={styles.toolbar}>
            {/* Status Filter Pills */}
            <div className={styles.statusFilterGroup}>
              <button
                type="button"
                className={`${styles.filterPill} ${statusFilter === 'All' ? styles.filterPillActive : ''}`}
                onClick={() => {
                  setStatusFilter('All');
                  setCurrentPage(1);
                }}
              >
                <span>All ({statusCounts.all})</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${statusFilter === 'New' ? styles.filterPillActive : ''}`}
                onClick={() => {
                  setStatusFilter('New');
                  setCurrentPage(1);
                }}
              >
                <span>New ({statusCounts.newCount})</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${statusFilter === 'In Progress' ? styles.filterPillActive : ''}`}
                onClick={() => {
                  setStatusFilter('In Progress');
                  setCurrentPage(1);
                }}
              >
                <span>In Progress ({statusCounts.inProgressCount})</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${statusFilter === 'Overdue' ? styles.filterPillActive : ''}`}
                onClick={() => {
                  setStatusFilter('Overdue');
                  setCurrentPage(1);
                }}
              >
                <span className={styles.dotRed} />
                <span>Overdue ({statusCounts.overdueCount})</span>
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${statusFilter === 'Resolved' ? styles.filterPillActive : ''}`}
                onClick={() => {
                  setStatusFilter('Resolved');
                  setCurrentPage(1);
                }}
              >
                <span className={styles.dotGreen} />
                <span>Resolved ({statusCounts.resolvedCount})</span>
              </button>
            </div>

            {/* Filter, Search & Sort Controls */}
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={`${styles.filterBtn} ${filterPopoverOpen ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterPopoverOpen((prev) => !prev)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filter</span>
              </button>

              <div className={styles.toolbarSearchWrap}>
                <span className={styles.toolbarSearchIcon} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className={styles.toolbarSearchInput}
                  placeholder="Search assigned issues..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search assigned issues"
                />
              </div>

              {/* Sort Control */}
              <div
                className={styles.sortControl}
                onClick={() => {
                  setSortOption((prev) => (prev === 'newest' ? 'priority_high' : prev === 'priority_high' ? 'oldest' : 'newest'));
                }}
                title="Toggle sort ordering"
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.sortLabel}>Sort</span>
                  <span className={styles.sortValue}>
                    {sortOption === 'newest'
                      ? 'Newest First'
                      : sortOption === 'priority_high'
                      ? 'Highest Priority'
                      : 'Oldest First'}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </section>

          {/* Filter Popover Panel */}
          {filterPopoverOpen && (
            <div className={styles.filterPopover}>
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>Filter By Category & Priority</span>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedPriorities([]);
                  }}
                >
                  Reset Filters
                </button>
              </div>
              <div className={styles.popoverGrids}>
                <div>
                  <div className={styles.popoverSectionTitle}>Categories</div>
                  <div className={styles.checkboxList}>
                    {(['roads', 'streetlights', 'waste', 'water', 'drainage'] as StaffIssueCategory[]).map((cat) => (
                      <label key={cat} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat]);
                            } else {
                              setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                            }
                          }}
                        />
                        <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={styles.popoverSectionTitle}>Priority Level</div>
                  <div className={styles.checkboxList}>
                    {(['High', 'Medium', 'Low', 'Others'] as StaffIssuePriority[]).map((pri) => (
                      <label key={pri} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={selectedPriorities.includes(pri)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPriorities([...selectedPriorities, pri]);
                            } else {
                              setSelectedPriorities(selectedPriorities.filter((p) => p !== pri));
                            }
                          }}
                        />
                        <span>{pri} Priority</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              MAIN TWO-COLUMN WORKSPACE
              ============================================================ */}
          <div className={styles.workspaceGrid}>
            {/* ── LEFT COLUMN: SCROLLABLE/PAGINATED ISSUES LIST ── */}
            <div className={styles.leftColumn}>
              {paginatedIssues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    className={`${styles.issueListCard} ${isSelected ? styles.issueListCardActive : ''}`}
                    onClick={() => setSelectedIssueId(issue.id)}
                    role="button"
                    tabIndex={0}
                    aria-selected={isSelected}
                  >
                    {/* Left: Thumbnail & Meta */}
                    <div className={styles.cardLeftBlock}>
                      <div className={styles.thumbWrap}>
                        <Image
                          src={issue.imageUrl || '/images/dashboard/thumb-pothole@2x.jpg'}
                          alt={issue.title}
                          fill
                          sizes="60px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={styles.cardMetaBlock}>
                        <span className={styles.ticketIdText}>{issue.ticketId}</span>
                        <h3 className={styles.issueTitleText}>{issue.title}</h3>
                        <div className={styles.issueLocationRow}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{issue.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Category */}
                    <div className={styles.cardCategoryBlock}>
                      {renderCategoryIcon(issue.category)}
                      <span>{getCategoryLabel(issue.category)}</span>
                    </div>

                    {/* Right: Badges, Time & Chevron */}
                    <div className={styles.cardRightBlock}>
                      {/* SLA Indicator */}
                      {(() => {
                        const sla = getIssueSLA(issue);
                        const slaStyle = styles[sla.badgeClass as keyof typeof styles] || styles.slaOnTrack;
                        return (
                          <span className={`${styles.slaBadge} ${slaStyle}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {sla.text}
                          </span>
                        );
                      })()}

                      {/* Priority Badge */}
                      {issue.priority === 'Critical' && <span className={styles.priorityBadgeRed} style={{ background: '#7f1d1d', borderColor: '#ef4444' }}>Critical</span>}
                      {issue.priority === 'High' && <span className={styles.priorityBadgeRed}>High</span>}
                      {issue.priority === 'Medium' && <span className={styles.priorityBadgeAmber}>Medium</span>}
                      {issue.priority === 'Low' && <span className={styles.priorityBadgeBlue}>Low</span>}
                      {issue.priority === 'Others' && <span className={styles.priorityBadgeSlate}>Other</span>}

                      {/* Status Badge */}
                      {issue.status === 'New' && <span className={styles.statusBadgeNew}>New</span>}
                      {issue.status === 'In Progress' && <span className={styles.statusBadgeInProgress}>In Progress</span>}
                      {issue.status === 'Overdue' && <span className={styles.statusBadgeOverdue}>Overdue</span>}
                      {issue.status === 'Resolved' && <span className={styles.statusBadgeResolved}>Resolved</span>}

                      <span className={styles.timeAgoText}>{issue.timeAgo}</span>

                      <span className={styles.chevronRightIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className={styles.paginationBar}>
                <div className={styles.pageControls}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    &lt;
                  </button>

                  <button
                    type="button"
                    className={`${styles.pageBtn} ${currentPage === 1 ? styles.pageBtnActive : ''}`}
                    onClick={() => setCurrentPage(1)}
                  >
                    1
                  </button>

                  {totalPages >= 2 && (
                    <button
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === 2 ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(2)}
                    >
                      2
                    </button>
                  )}

                  {totalPages >= 3 && (
                    <button
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === 3 ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(3)}
                    >
                      3
                    </button>
                  )}

                  {totalPages > 4 && <span className={styles.pageEllipsis}>...</span>}

                  {totalPages >= 5 && (
                    <button
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === 5 ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(5)}
                    >
                      5
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    &gt;
                  </button>
                </div>

                <div className={styles.showingRangeText}>
                  Showing {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filteredIssues.length)} of {filteredIssues.length} issues
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: SELECTED ISSUE DETAILS PANEL ── */}
            {selectedIssue && (
              <div className={styles.detailsCard}>
                {/* Header */}
                <div className={styles.detailsHeader}>
                  <div className={styles.detailsTopRow}>
                    <span className={styles.detailsTicketId}>{selectedIssue.ticketId}</span>
                    <div className={styles.detailsBadgesGroup}>
                      {(() => {
                        const sla = getIssueSLA(selectedIssue);
                        const slaStyle = styles[sla.badgeClass as keyof typeof styles] || styles.slaOnTrack;
                        return (
                          <span className={`${styles.slaBadge} ${slaStyle}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                            ⏱ {sla.text}
                          </span>
                        );
                      })()}
                      {selectedIssue.priority === 'Critical' && (
                        <span className={styles.priorityBadgeRed} style={{ background: '#7f1d1d', borderColor: '#ef4444' }}>Critical Priority</span>
                      )}
                      {selectedIssue.priority === 'High' && (
                        <span className={styles.priorityBadgeRed}>High Priority</span>
                      )}
                      {selectedIssue.priority === 'Medium' && (
                        <span className={styles.priorityBadgeAmber}>Medium Priority</span>
                      )}
                      {selectedIssue.priority === 'Low' && (
                        <span className={styles.priorityBadgeBlue}>Low Priority</span>
                      )}

                      {selectedIssue.status === 'New' && <span className={styles.statusBadgeNew}>New</span>}
                      {selectedIssue.status === 'In Progress' && (
                        <span className={styles.statusBadgeInProgress}>In Progress</span>
                      )}
                      {selectedIssue.status === 'Overdue' && (
                        <span className={styles.statusBadgeOverdue}>Overdue</span>
                      )}
                      {selectedIssue.status === 'Resolved' && (
                        <span className={styles.statusBadgeResolved}>Resolved</span>
                      )}

                      <button
                        type="button"
                        className={styles.dotsMenuBtn}
                        onClick={() => showToast(`Actions menu for ${selectedIssue.id}`)}
                        aria-label="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h2 className={styles.detailsTitle}>{selectedIssue.title}</h2>

                  <div className={styles.detailsSubRow}>
                    <div className={styles.detailsLocation}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{selectedIssue.location}</span>
                    </div>

                    <div>
                      <span>Reported on {selectedIssue.reportedDate || selectedIssue.assignedDateFull || '08 Dec 2024, 10:30 AM'}</span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <nav className={styles.tabNav}>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'overview' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'photos' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('photos')}
                  >
                    Photos ({selectedIssue.photos?.length || 3})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'location' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('location')}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'updates' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('updates')}
                  >
                    Updates ({selectedIssue.updates?.length || 4})
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'citizen' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('citizen')}
                  >
                    Citizen Details
                  </button>
                </nav>

                {/* ── TAB 1: OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className={styles.tabContent}>
                    {/* Photo Gallery Grid */}
                    <div className={styles.photoGalleryPreview}>
                      <div
                        className={styles.photoPrimary}
                        onClick={() => setLightboxImage(selectedIssue.photos?.[0] || selectedIssue.imageUrl)}
                      >
                        <Image
                          src={selectedIssue.photos?.[0] || selectedIssue.imageUrl || '/images/dashboard/thumb-pothole@2x.jpg'}
                          alt={selectedIssue.title}
                          fill
                          sizes="300px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={styles.photoSideStack}>
                        <div
                          className={styles.photoSecondary}
                          onClick={() => setLightboxImage(selectedIssue.photos?.[1] || selectedIssue.imageUrl)}
                        >
                          <Image
                            src={selectedIssue.photos?.[1] || '/images/dashboard/thumb-pothole.jpg'}
                            alt={`${selectedIssue.title} secondary`}
                            fill
                            sizes="150px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div
                          className={styles.photoSecondary}
                          onClick={() => setLightboxImage(selectedIssue.photos?.[2] || selectedIssue.imageUrl)}
                        >
                          <Image
                            src={selectedIssue.photos?.[2] || selectedIssue.imageUrl}
                            alt={`${selectedIssue.title} tertiary`}
                            fill
                            sizes="150px"
                            style={{ objectFit: 'cover' }}
                          />
                          <div className={styles.photoOverlayCount}>+1</div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className={styles.metaGrid}>
                      {/* Category */}
                      <div className={styles.metaItemCard}>
                        <div className={styles.metaIconWrap}>
                          {renderCategoryIcon(selectedIssue.category)}
                        </div>
                        <div className={styles.metaTextWrap}>
                          <span className={styles.metaLabel}>Category</span>
                          <span className={styles.metaValue}>{getCategoryLabel(selectedIssue.category)}</span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className={styles.metaItemCard}>
                        <div className={styles.metaIconWrap} style={{ color: '#ef4444' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </div>
                        <div className={styles.metaTextWrap}>
                          <span className={styles.metaLabel}>Priority</span>
                          <span className={styles.metaValue}>{selectedIssue.priority}</span>
                        </div>
                      </div>

                      {/* Current Status */}
                      <div className={styles.metaItemCard}>
                        <div className={styles.metaIconWrap} style={{ color: '#0ea5e9' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <div className={styles.metaTextWrap}>
                          <span className={styles.metaLabel}>Current Status</span>
                          <span className={styles.metaValue}>{selectedIssue.status}</span>
                        </div>
                      </div>

                      {/* Assigned Team */}
                      <div className={styles.metaItemCard}>
                        <div className={styles.metaIconWrap} style={{ color: '#10b981' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div className={styles.metaTextWrap}>
                          <span className={styles.metaLabel}>Assigned Team</span>
                          <span className={styles.metaValue}>
                            {selectedIssue.assignedTeam || 'Ward 3 - Road Maintenance'}
                          </span>
                        </div>
                      </div>

                      {/* Assigned Date Full Span */}
                      <div className={styles.metaItemCard} style={{ gridColumn: 'span 2' }}>
                        <div className={styles.metaIconWrap} style={{ color: '#a855f7' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div className={styles.metaTextWrap}>
                          <span className={styles.metaLabel}>Assigned Date</span>
                          <span className={styles.metaValue}>
                            {selectedIssue.assignedDateFull || `${selectedIssue.assignedDate}, 10:30 AM`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className={styles.descriptionSection}>
                      <h4 className={styles.descriptionHeading}>Description</h4>
                      <p className={styles.descriptionParagraph}>{selectedIssue.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtonsRow}>
                      <button
                        type="button"
                        className={styles.updateStatusBtn}
                        onClick={handleOpenStatusModal}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        <span>Update Status</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionBtnDark}
                        onClick={handleOpenNoteModal}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>Add Notes</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionBtnDark}
                        onClick={handleViewOnMap}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>View on Map</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionBtnDark}
                        onClick={() => router.push(`/staff/field-operations?issueId=${selectedIssue.id}`)}
                        style={{ borderColor: 'rgba(92, 235, 170, 0.4)', color: '#5cebaa' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Dispatch Team</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: PHOTOS ── */}
                {activeTab === 'photos' && (
                  <div className={styles.tabContent}>
                    <div className={styles.photosFullGrid}>
                      {(selectedIssue.photos || [selectedIssue.imageUrl]).map((photoUrl, idx) => (
                        <div
                          key={idx}
                          className={styles.photoFullItem}
                          onClick={() => setLightboxImage(photoUrl)}
                        >
                          <Image src={photoUrl} alt={`Photo ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                          <span className={styles.photoBadge}>{idx === 0 ? 'Citizen Photo' : 'Field Photo'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: LOCATION ── */}
                {activeTab === 'location' && (
                  <div className={styles.tabContent}>
                    <div className={styles.locationMapWrap}>
                      <div className={styles.mapContainer}>
                        <Image
                          src="/images/dashboard/mira-bhayandar-map.png"
                          alt="Ward 3 Issue Location"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        {/* Selected Marker */}
                        <div
                          style={{
                            position: 'absolute',
                            top: `${selectedIssue.mapTop}%`,
                            left: `${selectedIssue.mapLeft}%`,
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: '#ef4444',
                              border: '3px solid #ffffff',
                              boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          </div>
                          <span
                            style={{
                              backgroundColor: '#0d1527',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              marginTop: 4,
                              border: '1px solid #1e2c4a',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selectedIssue.id}
                          </span>
                        </div>
                      </div>

                      <div className={styles.locationAddressCard}>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{selectedIssue.location}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Coordinates: {selectedIssue.lat.toFixed(4)}° N, {selectedIssue.lng.toFixed(4)}° E • Ward 3 MBMC
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: UPDATES ── */}
                {activeTab === 'updates' && (
                  <div className={styles.tabContent}>
                    <div className={styles.updatesTimeline}>
                      {(selectedIssue.updates || []).map((upd, idx) => (
                        <div key={upd.id || idx} className={styles.timelineItem}>
                          {idx !== (selectedIssue.updates?.length || 0) - 1 && <div className={styles.timelineLine} />}
                          <div className={styles.timelineIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineHeader}>
                              <span className={styles.timelineTitle}>{upd.title}</span>
                              <span className={styles.timelineTime}>{upd.timestamp}</span>
                            </div>
                            <div className={styles.timelineActor}>{upd.actor}</div>
                            {upd.notes && <div className={styles.timelineNotes}>{upd.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 5: CITIZEN DETAILS ── */}
                {activeTab === 'citizen' && (
                  <div className={styles.tabContent}>
                    <div className={styles.citizenDetailsCard}>
                      <div className={styles.citizenHeaderRow}>
                        <div className={styles.citizenAvatar}>
                          {(selectedIssue.citizenName || 'Rohan Mehta').slice(0, 1)}
                        </div>
                        <div className={styles.citizenInfoMeta}>
                          <span className={styles.citizenName}>{selectedIssue.citizenName || 'Rohan Mehta'}</span>
                          <span className={styles.citizenTag}>Verified Citizen • Ward 3 Resident</span>
                        </div>
                      </div>

                      <div className={styles.citizenFieldRow}>
                        <span className={styles.citizenFieldLabel}>Contact Number</span>
                        <span className={styles.citizenFieldValue}>
                          {selectedIssue.citizenDetails?.phone || '+91 98201 44921'}
                        </span>
                      </div>

                      <div className={styles.citizenFieldRow}>
                        <span className={styles.citizenFieldLabel}>Email Address</span>
                        <span className={styles.citizenFieldValue}>
                          {selectedIssue.citizenDetails?.email || 'rohan.mehta@example.com'}
                        </span>
                      </div>

                      <div className={styles.citizenFieldRow}>
                        <span className={styles.citizenFieldLabel}>Registered Address</span>
                        <span className={styles.citizenFieldValue}>
                          {selectedIssue.citizenDetails?.address || selectedIssue.location}
                        </span>
                      </div>

                      <div className={styles.citizenFieldRow}>
                        <span className={styles.citizenFieldLabel}>Citizen Report History</span>
                        <span className={styles.citizenFieldValue}>
                          {selectedIssue.citizenDetails?.totalReports || 4} verified reports submitted
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============================================================
          UPDATE STATUS MODAL
          ============================================================ */}
      {statusModalOpen && selectedIssue && (
        <div className={styles.modalBackdrop} onClick={() => setStatusModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Status — {selectedIssue.id}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setStatusModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Workflow Status</label>
              <select
                className={styles.formSelect}
                value={statusModalValue}
                onChange={(e) => setStatusModalValue(e.target.value as StaffIssueStatus)}
              >
                <option value="New">New (Pending Inspection)</option>
                <option value="In Progress">In Progress (Field Work Underway)</option>
                <option value="Overdue">Overdue (Escalated to Assistant Commissioner)</option>
                <option value="Resolved">Resolved (Work Completed & Verified)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status Remarks / Contractor Note</label>
              <textarea
                className={styles.formTextarea}
                rows={3}
                placeholder="Enter field notes, material usage, or completion details..."
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleSaveStatus}
              >
                Save &amp; Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD NOTES MODAL
          ============================================================ */}
      {noteModalOpen && selectedIssue && (
        <div className={styles.modalBackdrop} onClick={() => setNoteModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Internal Staff Note — {selectedIssue.id}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setNoteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Internal Note</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                placeholder="Add confidential municipal notes for ward colleagues..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setNoteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleSaveNote}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          IMAGE LIGHTBOX MODAL
          ============================================================ */}
      {lightboxImage && (
        <div className={styles.modalBackdrop} onClick={() => setLightboxImage(null)}>
          <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: '440px' }}>
              <Image src={lightboxImage} alt="Enlarged photo preview" fill style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', background: '#0d1527' }}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setLightboxImage(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Modal */}
      <NoticeModal
        isOpen={notice.isOpen}
        title={notice.title}
        message={notice.message}
        stageNote={notice.stageNote}
        badge={notice.badge}
        onClose={closeNotice}
      />

      {/* Toast */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}

export default function WardStaffAssignedIssuesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070e1c', color: '#5cebaa' }}>
          Loading Assigned Issues...
        </div>
      }
    >
      <WardStaffAssignedIssuesContent />
    </Suspense>
  );
}
