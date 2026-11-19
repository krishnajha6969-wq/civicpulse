'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginWardStaff, DEFAULT_WARD_STAFF, AuthUser } from '../../../lib/auth';
import {
  StaffIssue,
  StaffIssueStatus,
  StaffIssueCategory,
  FieldTeam,
  getWardStaffIssues,
  updateStaffIssueStatus,
  getFieldTeams,
  dispatchTeamToIssue,
  getIssueSLA,
} from '../../../lib/staff';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './field-operations.module.css';

// ── Route Stop Model ──
interface RouteStop {
  id: number;
  location: string;
  description: string;
  status: StaffIssueStatus;
  time: string;
}

// Pre-seeded route stops matching the approved reference
const ROUTE_STOPS: RouteStop[] = [
  { id: 1, location: 'Station Road', description: 'Pothole repair', status: 'New', time: '09:00 AM' },
  { id: 2, location: 'Shanti Nagar', description: 'Streetlight not working', status: 'In Progress', time: '11:30 AM' },
  { id: 3, location: 'Kanakia Road', description: 'Garbage overflow', status: 'Overdue', time: '02:00 PM' },
];

function FieldOperationsContent() {
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
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('Ward 3');

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

  // ── Teams State ──
  const [teams, setTeams] = useState<FieldTeam[]>(() => getFieldTeams());

  // ── Issues State ──
  const [issues, setIssues] = useState<StaffIssue[]>(() => getWardStaffIssues(selectedWard));
  const [globalSearch, setGlobalSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [tableTeamFilter, setTableTeamFilter] = useState<string>('All Teams');

  // ── Map State ──
  const [mapFilter, setMapFilter] = useState<StaffIssueStatus | 'All'>('All');
  const [selectedPinIssue, setSelectedPinIssue] = useState<StaffIssue | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(1);

  // ── Issue Detail Modal State ──
  const [detailModalIssue, setDetailModalIssue] = useState<StaffIssue | null>(null);
  const [newStatus, setNewStatus] = useState<StaffIssueStatus>('In Progress');
  const [statusRemark, setStatusRemark] = useState('');

  // ── Dispatch Team Modal State ──
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchTeamId, setDispatchTeamId] = useState<string>('team-1');
  const [dispatchIssueId, setDispatchIssueId] = useState<string>('CP-10421');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');

  // Sync user, teams, and issues on mount
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && (usr.role === 'ward_staff' || usr.role === 'super_admin')) {
      setUser(usr);
    } else {
      const demoStaff = loginWardStaff(selectedWard);
      setUser(demoStaff);
    }
    setIssues(getWardStaffIssues(selectedWard));
    setTeams(getFieldTeams());

    const handleIssuesSync = () => setIssues(getWardStaffIssues(selectedWard));
    const handleTeamsSync = () => setTeams(getFieldTeams());

    window.addEventListener('civicpulse_ward_staff_updated', handleIssuesSync);
    window.addEventListener('civicpulse_field_teams_updated', handleTeamsSync);
    return () => {
      window.removeEventListener('civicpulse_ward_staff_updated', handleIssuesSync);
      window.removeEventListener('civicpulse_field_teams_updated', handleTeamsSync);
    };
  }, [selectedWard]);

  // Handle URL issueId for immediate dispatch
  useEffect(() => {
    const issueIdParam = searchParams.get('issueId');
    if (issueIdParam) {
      setDispatchIssueId(issueIdParam);
      setDispatchModalOpen(true);
      const found = issues.find((i) => i.id === issueIdParam);
      if (found) {
        setSelectedPinIssue(found);
      }
    }
  }, [searchParams, issues]);

  // Handle logout
  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // Handle demo switch to Ward Staff
  const handleDemoSignInStaff = () => {
    const staffUser = loginWardStaff('Ward 3');
    setUser(staffUser);
    setIssues(getWardStaffIssues('Ward 3'));
    showToast('Signed in as authorized Ward 3 staff (Sandeep Jadhav)');
  };

  // ── KPI Metrics (Field Operations specific) ──
  const kpis = useMemo(() => {
    const newCount = issues.filter((i) => i.status === 'New').length;
    const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
    const overdueCount = issues.filter((i) => i.status === 'Overdue').length;
    const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
    return {
      todaysTasks: 18,
      inProgress: 6,
      siteVisitsPending: 3,
      completedToday: 7,
      activeFieldTeams: 4,
      newCount,
      inProgressCount,
      overdueCount,
      resolvedCount,
    };
  }, [issues]);

  // ── Filtered Map Pins ──
  const filteredMapIssues = useMemo(() => {
    if (mapFilter === 'All') return issues.slice(0, 18);
    return issues.filter((i) => i.status === mapFilter).slice(0, 18);
  }, [issues, mapFilter]);

  // ── Filtered Table Issues (Field Tasks Today) ──
  const filteredTableIssues = useMemo(() => {
    // Show first 4 issues as "today's tasks" per the reference
    let list = issues.slice(0, 4);

    // Apply team filter
    if (tableTeamFilter !== 'All Teams') {
      list = list.filter((i) => i.assignedTeam?.includes(tableTeamFilter.replace('Team ', 'Ward 3 - ')));
    }

    // Apply search
    const searchTerms = (tableSearch || globalSearch).toLowerCase().trim();
    if (searchTerms) {
      list = issues.filter((i) =>
        i.id.toLowerCase().includes(searchTerms) ||
        i.title.toLowerCase().includes(searchTerms) ||
        i.location.toLowerCase().includes(searchTerms) ||
        i.category.toLowerCase().includes(searchTerms)
      );
    }

    return list;
  }, [issues, tableTeamFilter, tableSearch, globalSearch]);

  // Handle Status Update Submit
  const handleSaveStatusUpdate = () => {
    if (!detailModalIssue) return;
    const updated = updateStaffIssueStatus(detailModalIssue.id, newStatus, statusRemark);
    setIssues(updated);
    setDetailModalIssue(null);
    setStatusRemark('');
    showToast(`Issue ${detailModalIssue.id} updated to ${newStatus}`);
  };

  // Handle Team Dispatch Submit
  const handleConfirmDispatch = () => {
    const res = dispatchTeamToIssue(dispatchTeamId, dispatchIssueId, dispatchNotes);
    if (res.success) {
      showToast(res.message);
      setDispatchModalOpen(false);
      setDispatchNotes('');
      setTeams(getFieldTeams());
      setIssues(getWardStaffIssues(selectedWard));
    } else {
      showToast(res.message);
    }
  };

  // Guard: Protect Staff Portal
  const isAuthorized = user && (user.role === 'ward_staff' || user.role === 'super_admin');

  if (!isAuthorized) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Ward Staff Access Restricted</h1>
          <p className={styles.authMessage}>
            The Ward Staff Portal is reserved for verified municipal employees assigned to field operations in Mira Bhayandar.
          </p>
          <div className={styles.authActions}>
            <button type="button" className={styles.authPrimaryBtn} onClick={handleDemoSignInStaff}>
              Sign In as Ward 3 Staff (Demo)
            </button>
            <button type="button" className={styles.authSecondaryBtn} onClick={() => router.push('/')}>
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

          {/* 2. Assigned Issues */}
          <Link href="/staff/issues" className={styles.navItem}>
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

          {/* 3. Field Operations (Active) */}
          <Link
            href="/staff/field-operations"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              </svg>
            </span>
            <span className={styles.navLabel}>Field Operations</span>
          </Link>

          {/* 4. Resolution Updates */}
          <Link
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
            <span className={styles.navLabel}>Profile &amp; Settings</span>
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

        {/* Sidebar Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <div className={styles.promoImageWrapper}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Cleaner wards stronger communities"
              fill
              sizes="220px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div className={styles.promoTitle}>Cleaner wards stronger communities.</div>
            <div className={styles.promoSubtitle}>Coordinate. Resolve. Make a difference.</div>
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
              placeholder="Search issues, locations, or field teams..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              aria-label="Search issues or field teams"
            />
          </div>

          {/* Topbar Actions */}
          <div className={styles.topbarActions}>
            {/* Ward Selector */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.wardSelector}
                onClick={() => setWardDropdownOpen((prev) => !prev)}
                aria-expanded={wardDropdownOpen}
                aria-label="Authorized ward selection"
              >
                <span className={styles.wardIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>{selectedWard}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {wardDropdownOpen && (
                <div className={styles.profileMenuDropdown} style={{ minWidth: '160px' }}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setSelectedWard('Ward 3');
                      setWardDropdownOpen(false);
                      showToast('Switched view to Ward 3 (Primary Assignment)');
                    }}
                  >
                    Ward 3 (Authorized)
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setWardDropdownOpen(false);
                      showToast('Viewing Ward 4 in telemetry mode (Field operations restricted to Ward 3)');
                    }}
                  >
                    Ward 4 (Read-only)
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={() =>
                showToast('3 field alerts: 1 overdue visit on Kanakia Rd, 1 new assignment on Station Rd')
              }
              aria-label="View staff notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifBadgeSmall}>3</span>
            </button>

            {/* Staff User Profile */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-label="Toggle staff profile menu"
                suppressHydrationWarning
              >
                <div className={styles.initialsAvatar} suppressHydrationWarning>SJ</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName} suppressHydrationWarning>{user?.name || 'Sandeep Jadhav'}</span>
                  <span className={styles.userRole}>Ward Staff</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown}>
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {user?.name || 'Sandeep Jadhav'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {user?.email || 'sandeep.jadhav@mbmc.gov.in'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00e599', marginTop: '2px' }}>
                      Assigned: {user?.assignedWard || 'Ward 3'}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push('/staff/settings');
                    }}
                  >
                    Staff Profile &amp; Settings
                  </button>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
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
            PAGE BODY
            ============================================================ */}
        <main className={styles.pageBody}>
          {/* Cityscape Banner */}
          <div className={styles.bannerCard}>
            <div className={styles.bannerContent}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/staff/dashboard" className={styles.crumbLink}>
                  Dashboard
                </Link>
                <span className={styles.crumbSep}>&gt;</span>
                <span className={styles.crumbActive}>Field Operations</span>
              </nav>
              <h1 className={styles.bannerTitle}>Field Operations</h1>
              <p className={styles.bannerSubtitle}>
                Plan field work, track teams and update on-ground progress for a cleaner Mira Bhayandar.
              </p>
            </div>

            <div className={styles.bannerImageContainer}>
              <Image
                src="/images/ward/field-ops-banner.jpg"
                alt="Field operations team at work"
                width={540}
                height={180}
                className={styles.bannerImg}
                priority
              />
              <div className={styles.bannerSloganOverlay}>
                <div className={styles.sloganTitle}>Efficient Field Work</div>
                <div className={styles.sloganSubtitle}>Cleaner Wards</div>
              </div>
            </div>
          </div>

          {/* ============================================================
              5 KPI CARDS
              ============================================================ */}
          <div className={styles.kpiRow}>
            {/* 1. Today's Tasks */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiIconTeal}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.todaysTasks}</div>
                <div className={styles.kpiLabel}>Today&apos;s Tasks</div>
                <div className={styles.kpiSubtext}>Assigned for field team</div>
              </div>
            </div>

            {/* 2. In Progress */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiIconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.inProgress}</div>
                <div className={styles.kpiLabel}>In Progress</div>
                <div className={styles.kpiSubtext}>Currently being handled</div>
              </div>
            </div>

            {/* 3. Site Visits Pending */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiIconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.siteVisitsPending}</div>
                <div className={styles.kpiLabel}>Site Visits Pending</div>
                <div className={styles.kpiSubtext}>Require on-ground visit</div>
              </div>
            </div>

            {/* 4. Completed Today */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiIconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.completedToday}</div>
                <div className={styles.kpiLabel}>Completed Today</div>
                <div className={styles.kpiSubtext}>Tasks marked complete</div>
              </div>
            </div>

            {/* 5. Active Field Teams */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiIconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.activeFieldTeams}</div>
                <div className={styles.kpiLabel}>Active Field Teams</div>
                <div className={styles.kpiSubtext}>In {selectedWard}</div>
              </div>
            </div>
          </div>

          {/* ============================================================
              MIDDLE SECTION — Map + Right Stack (Teams & Route)
              ============================================================ */}
          <div className={styles.middleSection}>
            {/* Left: Field Operations Map */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <span className={styles.panelHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className={styles.panelHeaderTitle}>Field Operations Map</span>
                </div>
                <button
                  type="button"
                  className={styles.panelHeaderAction}
                  onClick={() => {
                    setMapZoomLevel(1.5);
                    showToast('Zoomed to active sector GIS coordinates');
                  }}
                >
                  Focus Sector Map
                </button>
              </div>

              {/* Map Filter Chips */}
              <div className={styles.mapFilterChips}>
                {(['All', 'New', 'In Progress', 'Overdue', 'Resolved'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`${styles.mapChip} ${mapFilter === status ? styles.mapChipActive : ''}`}
                    onClick={() => setMapFilter(status)}
                  >
                    {status !== 'All' && (
                      <span
                        className={styles.mapChipDot}
                        style={{
                          background:
                            status === 'New' ? '#0ea5e9' :
                            status === 'In Progress' ? '#f59e0b' :
                            status === 'Overdue' ? '#ef4444' :
                            '#22c55e',
                        }}
                      />
                    )}
                    {status}
                  </button>
                ))}
              </div>

              <div className={styles.mapBody}>
                {/* Background Satellite Map */}
                <Image
                  src="/images/dashboard/mira-bhayandar-map.png"
                  alt="Field Operations Map of Mira Bhayandar Ward 3"
                  fill
                  style={{
                    objectFit: 'cover',
                    transform: `scale(${mapZoomLevel})`,
                    transition: 'transform 0.3s ease',
                  }}
                  className={styles.mapBgImage}
                />
                <div className={styles.mapOverlayGradient} />

                {/* Map Controls */}
                <div className={styles.mapControls}>
                  <button
                    type="button"
                    className={styles.mapCtrlBtn}
                    onClick={() => setMapZoomLevel((z) => Math.min(z + 0.25, 2.0))}
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.mapCtrlBtn}
                    onClick={() => setMapZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className={styles.mapCtrlBtn}
                    onClick={() => {
                      setMapZoomLevel(1);
                      setSelectedPinIssue(filteredMapIssues[0] || null);
                    }}
                    aria-label="Recenter map"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Interactive Map Pins */}
                <div className={styles.mapPinsLayer}>
                  {filteredMapIssues.map((issue) => {
                    let pinModifier = styles.pinAmber;
                    if (issue.status === 'Overdue') pinModifier = styles.pinRed;
                    else if (issue.status === 'New') pinModifier = styles.pinBlue;
                    else if (issue.status === 'Resolved') pinModifier = styles.pinGreen;

                    return (
                      <button
                        key={issue.id}
                        type="button"
                        className={`${styles.mapPinBtn} ${pinModifier}`}
                        style={{
                          top: `${issue.mapTop}%`,
                          left: `${issue.mapLeft}%`,
                        }}
                        onClick={() => setSelectedPinIssue(issue)}
                        aria-label={`${issue.id}: ${issue.title} (${issue.status})`}
                      >
                        {issue.status === 'Overdue' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        )}
                        {issue.status === 'In Progress' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <circle cx="12" cy="12" r="4" fill="#fff" />
                          </svg>
                        )}
                        {issue.status === 'New' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                        {issue.status === 'Resolved' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Team 1 Route Callout */}
                <div className={styles.teamRouteCallout} style={{ top: '42%', left: '35%' }}>
                  <div className={styles.teamRouteTitle}>Team 1</div>
                  <div className={styles.teamRouteSub}>3 tasks • 8.2 km</div>
                </div>

                {/* Selected Pin Popup */}
                {selectedPinIssue && (
                  <div className={styles.mapPopupCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                        {selectedPinIssue.ticketId}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPinIssue(null)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.popupTitle}>{selectedPinIssue.title}</div>
                    <div className={styles.popupLoc}>📍 {selectedPinIssue.location}</div>
                    <div className={styles.popupMeta}>
                      <span
                        className={`${styles.statusBadge} ${
                          selectedPinIssue.status === 'Overdue'
                            ? styles.statusOverdue
                            : selectedPinIssue.status === 'New'
                            ? styles.statusNew
                            : selectedPinIssue.status === 'Resolved'
                            ? styles.statusResolved
                            : styles.statusInProgress
                        }`}
                      >
                        {selectedPinIssue.status}
                      </span>
                      <button
                        type="button"
                        className={styles.viewActionBtn}
                        onClick={() => {
                          setDetailModalIssue(selectedPinIssue);
                          setNewStatus(selectedPinIssue.status);
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Legend */}
                <div className={styles.mapLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#0ea5e9' }} />
                    <span>New ({kpis.newCount})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                    <span>In Progress ({kpis.inProgressCount})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                    <span>Overdue ({kpis.overdueCount})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#22c55e' }} />
                    <span>Resolved ({kpis.resolvedCount})</span>
                  </div>
                  <div className={styles.legendRoute}>
                    <span className={styles.legendRouteLine} />
                    <span>Field Team Route</span>
                  </div>
                </div>

                {/* Satellite badge */}
                <div className={styles.satelliteBadge}>
                  <span className={styles.satelliteBadgeBtn}>Satellite</span>
                </div>
              </div>
            </div>

            {/* Right Stack: Field Teams + Today's Route */}
            <div className={styles.rightStack}>
              {/* Panel 1: Field Teams */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span className={styles.panelHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <span className={styles.panelHeaderTitle}>Field Teams</span>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: '#5cebaa',
                      color: '#070e1c',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => setDispatchModalOpen(true)}
                  >
                    + Dispatch Team
                  </button>
                </div>

                {teams.map((team) => (
                  <div key={team.id} className={styles.fieldTeamRow}>
                    <div className={styles.fieldTeamLeft}>
                      <div className={`${styles.teamIcon} ${styles[team.iconStyle as keyof typeof styles] || styles.teamIconBlue}`}>
                        {team.shortName === 'Team 1' && '🔧'}
                        {team.shortName === 'Team 2' && '🗑️'}
                        {team.shortName === 'Team 3' && '💡'}
                        {team.shortName === 'Team 4' && '⚙️'}
                      </div>
                      <div className={styles.teamInfo}>
                        <div className={styles.teamName}>{team.name}</div>
                        <div className={styles.teamSpecialty}>{team.specialty} • Lead: {team.lead}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Members: {team.members.join(', ')}
                        </div>
                        {team.currentAssignment && (
                          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                            📍 {team.currentAssignment}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.fieldTeamRight} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className={styles.teamTaskCount}>
                        {team.taskCount} task{team.taskCount !== 1 ? 's' : ''}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          team.status === 'Dispatched' || team.status === 'Working'
                            ? styles.statusActive
                            : team.status === 'On Site'
                            ? styles.statusOnSite
                            : styles.statusAvailable
                        }`}
                      >
                        {team.status}
                      </span>
                      <button
                        type="button"
                        style={{
                          background: 'rgba(92, 235, 170, 0.1)',
                          border: '1px solid rgba(92, 235, 170, 0.3)',
                          color: '#5cebaa',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setDispatchTeamId(team.id);
                          setDispatchModalOpen(true);
                        }}
                      >
                        Dispatch →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel 2: Today's Field Route */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span className={styles.panelHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <span className={styles.panelHeaderTitle}>Today&apos;s Field Route</span>
                  </div>
                  <button
                    type="button"
                    className={styles.panelHeaderAction}
                    onClick={() => showToast('Today\'s route: 4 scheduled field checkpoints active')}
                  >
                    Route Checklist
                  </button>
                </div>

                {ROUTE_STOPS.map((stop) => (
                  <div key={stop.id} className={styles.routeItem}>
                    <div className={styles.routeNumber}>{stop.id}</div>
                    <div className={styles.routeInfo}>
                      <div className={styles.routeTitle}>{stop.location}</div>
                      <div className={styles.routeSubtitle}>{stop.description}</div>
                    </div>
                    <div className={styles.routeRight}>
                      <span
                        className={`${styles.statusBadge} ${
                          stop.status === 'New'
                            ? styles.statusNew
                            : stop.status === 'In Progress'
                            ? styles.statusInProgress
                            : stop.status === 'Overdue'
                            ? styles.statusOverdue
                            : styles.statusResolved
                        }`}
                      >
                        {stop.status}
                      </span>
                      <span className={styles.routeTime}>{stop.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================
              BOTTOM SECTION — Field Tasks (Today) Table
              ============================================================ */}
          <div className={styles.tablePanel} id="field-tasks-table">
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <span className={styles.panelHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
                <span className={styles.panelHeaderTitle}>Field Tasks (Today)</span>
              </div>
            </div>

            <div className={styles.tableToolbar}>
              {/* Team Filter */}
              <div className={styles.tableFilterPills}>
                {['All Teams', 'Team 1', 'Team 2', 'Team 3', 'Team 4'].map((team) => (
                  <button
                    key={team}
                    type="button"
                    className={`${styles.filterPill} ${tableTeamFilter === team ? styles.filterPillActive : ''}`}
                    onClick={() => setTableTeamFilter(team)}
                  >
                    {team}
                  </button>
                ))}
              </div>

              {/* Search & Filter */}
              <div className={styles.tableControlsRight}>
                <div className={styles.tableSearchBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.tableSearchInput}
                    placeholder="Search tasks, location or issue ID..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    aria-label="Filter field tasks"
                  />
                </div>
                <button
                  type="button"
                  className={styles.filterBtn}
                  onClick={() => router.push('/staff/issues')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  All Issues
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Issue ID ▼</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Team</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Scheduled Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableIssues.map((issue, idx) => {
                    // Map issue to a team name for display
                    const teamMap: Record<string, string> = {
                      'CP-10421': 'Team 1',
                      'CP-10418': 'Team 3',
                      'CP-10417': 'Team 2',
                      'CP-10415': 'Team 4',
                    };
                    const teamName = teamMap[issue.id] || `Team ${(idx % 4) + 1}`;

                    // Scheduled times per the reference
                    const timeMap: Record<string, string> = {
                      'CP-10421': '09:00 AM',
                      'CP-10418': '11:30 AM',
                      'CP-10417': '02:00 PM',
                      'CP-10415': '04:00 PM',
                    };
                    const scheduledTime = timeMap[issue.id] || '10:00 AM';

                    return (
                      <tr key={issue.id}>
                        <td style={{ color: '#64748b', fontWeight: 600, fontSize: '12px' }}>{idx + 1}</td>
                        <td className={styles.issueIdCell}>{issue.id}</td>
                        <td className={styles.issueTitleCell}>{issue.title}</td>
                        <td>{issue.location}</td>
                        <td style={{ fontWeight: 600, color: '#cbd5e1' }}>{teamName}</td>
                        <td>
                          <span
                            className={`${styles.priorityPill} ${
                              issue.priority === 'High'
                                ? styles.prioHigh
                                : issue.priority === 'Medium'
                                ? styles.prioMedium
                                : issue.priority === 'Low'
                                ? styles.prioLow
                                : styles.prioOthers
                            }`}
                          >
                            {issue.priority}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              issue.status === 'Overdue'
                                ? styles.statusOverdue
                                : issue.status === 'New'
                                ? styles.statusNew
                                : issue.status === 'Resolved'
                                ? styles.statusResolved
                                : styles.statusInProgress
                            }`}
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{scheduledTime}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.viewActionBtn}
                            onClick={() => {
                              setDetailModalIssue(issue);
                              setNewStatus(issue.status);
                            }}
                          >
                            View ▼
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTableIssues.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No field tasks found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================
          ISSUE DETAIL & STATUS UPDATE MODAL
          ============================================================ */}
      {detailModalIssue && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailModalIssue(null);
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Issue {detailModalIssue.id} Details</div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDetailModalIssue(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden' }}>
                <Image
                  src={detailModalIssue.imageUrl}
                  alt={detailModalIssue.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Title &amp; Category</div>
                <div className={styles.detailValue} style={{ fontWeight: 700 }}>
                  {detailModalIssue.title} ({detailModalIssue.category})
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Location</div>
                <div className={styles.detailValue}>📍 {detailModalIssue.location}</div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Description</div>
                <div className={styles.detailValue}>{detailModalIssue.description}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Priority</div>
                  <div className={styles.detailValue}>{detailModalIssue.priority}</div>
                </div>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Assigned Date</div>
                  <div className={styles.detailValue}>{detailModalIssue.assignedDate}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Update Field Status</div>
                <select
                  className={styles.statusUpdateSelect}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as StaffIssueStatus)}
                >
                  <option value="New">New (Pending Inspection)</option>
                  <option value="In Progress">In Progress (Field Team Dispatched)</option>
                  <option value="Overdue">Overdue (Escalate to Engineer)</option>
                  <option value="Resolved">Resolved (Work Completed &amp; Verified)</option>
                </select>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Field Notes / Resolution Remark</div>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Enter inspection findings, work completion notes, or contractor details..."
                  value={statusRemark}
                  onChange={(e) => setStatusRemark(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDetailModalIssue(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSubmitBtn}
                onClick={handleSaveStatusUpdate}
              >
                Save Status Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0c1629',
            border: '1px solid rgba(0, 229, 153, 0.4)',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#00e599',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 10000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          ✓ {toastMessage}
        </div>
      )}

      {/* ============================================================
          TEAM DISPATCH MODAL
          ============================================================ */}
      {dispatchModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDispatchModalOpen(false);
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Dispatch Field Operations Team</div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDispatchModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Select Field Team</div>
                <select
                  className={styles.statusUpdateSelect}
                  value={dispatchTeamId}
                  onChange={(e) => setDispatchTeamId(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status} - {t.taskCount} tasks) — Lead: {t.lead}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Target Assigned Issue</div>
                <select
                  className={styles.statusUpdateSelect}
                  value={dispatchIssueId}
                  onChange={(e) => setDispatchIssueId(e.target.value)}
                >
                  {issues.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id} - {i.title} ({i.priority} | {i.status} | {i.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Crew Instructions &amp; Dispatch Notes</div>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Provide urgent instructions, equipment requirements (e.g. cold mix asphalt, jetting machine), or site contact details..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDispatchModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSubmitBtn}
                onClick={handleConfirmDispatch}
              >
                Confirm &amp; Dispatch Team
              </button>
            </div>
          </div>
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

export default function FieldOperationsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070e1c', color: '#5cebaa' }}>
          Loading Field Operations...
        </div>
      }
    >
      <FieldOperationsContent />
    </Suspense>
  );
}
