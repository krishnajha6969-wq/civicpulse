'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginWardStaff, DEFAULT_WARD_STAFF, AuthUser } from '../../../lib/auth';
import {
  StaffIssue,
  StaffIssueStatus,
  StaffIssueCategory,
  StaffNotification,
  getWardStaffIssues,
  getWardStaffKPIs,
  getPriorityDistribution,
  STAFF_TODAY_ACTIVITY,
  updateStaffIssueStatus,
  getIssueSLA,
  getStaffNotifications,
  markStaffNotificationRead,
  markAllStaffNotificationsRead,
} from '../../../lib/staff';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './staff-dashboard.module.css';

export default function WardStaffDashboardPage() {
  const router = useRouter();

  // ── Authentication State ──
  const [user, setUser] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && (current.role === 'ward_staff' || current.role === 'super_admin')) {
      return current;
    }
    // Consistent with project demo mode: initialize authorized Ward 3 staff session
    return DEFAULT_WARD_STAFF;
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('Ward 3');

  // Notifications State
  const [notifs, setNotifs] = useState<StaffNotification[]>(() => getStaffNotifications());
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const unreadNotifCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);

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

  // ── Issues State & KPI ──
  const [issues, setIssues] = useState<StaffIssue[]>(() => getWardStaffIssues(selectedWard));
  const [tableStatusFilter, setTableStatusFilter] = useState<StaffIssueStatus | 'All'>('All');
  const [tableSearch, setTableSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // ── Map State ──
  const [selectedPinIssue, setSelectedPinIssue] = useState<StaffIssue | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(1);

  // ── Issue Detail Modal State ──
  const [detailModalIssue, setDetailModalIssue] = useState<StaffIssue | null>(null);
  const [newStatus, setNewStatus] = useState<StaffIssueStatus>('In Progress');
  const [statusRemark, setStatusRemark] = useState('');

  // Sync user and issues on mount
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && (usr.role === 'ward_staff' || usr.role === 'super_admin')) {
      setUser(usr);
    } else {
      const demoStaff = loginWardStaff(selectedWard);
      setUser(demoStaff);
    }
    setIssues(getWardStaffIssues(selectedWard));

    const handleSync = () => setIssues(getWardStaffIssues(selectedWard));
    const handleNotifSync = () => setNotifs(getStaffNotifications());

    window.addEventListener('civicpulse_ward_staff_updated', handleSync);
    window.addEventListener('civicpulse_staff_notifications_updated', handleNotifSync);
    return () => {
      window.removeEventListener('civicpulse_ward_staff_updated', handleSync);
      window.removeEventListener('civicpulse_staff_notifications_updated', handleNotifSync);
    };
  }, [selectedWard]);

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

  // Derived KPI metrics
  const kpis = useMemo(() => getWardStaffKPIs(issues, selectedWard), [issues, selectedWard]);
  const priorityDist = useMemo(() => getPriorityDistribution(issues), [issues]);

  // Counts for Table Filter Pills
  const statusCounts = useMemo(() => {
    return { all: 24, n: 4, inp: 12, ov: 6, res: 18 };
  }, []);

  // Filtered issues for the table
  const filteredTableIssues = useMemo(() => {
    return issues.filter((item) => {
      const matchStatus = tableStatusFilter === 'All' ? true : item.status === tableStatusFilter;
      const searchTerms = (tableSearch || globalSearch).toLowerCase().trim();
      const matchSearch =
        !searchTerms ||
        item.id.toLowerCase().includes(searchTerms) ||
        item.title.toLowerCase().includes(searchTerms) ||
        item.location.toLowerCase().includes(searchTerms) ||
        item.category.toLowerCase().includes(searchTerms) ||
        item.priority.toLowerCase().includes(searchTerms) ||
        (item.citizenName && item.citizenName.toLowerCase().includes(searchTerms));

      return matchStatus && matchSearch;
    });
  }, [issues, tableStatusFilter, tableSearch, globalSearch]);

  // Needs Attention list (prioritizing Overdue, Critical, and High priority SLA-sensitive issues)
  const needsAttentionList = useMemo(() => {
    return [...issues]
      .sort((a, b) => {
        const score = (item: StaffIssue) => {
          if (item.status === 'Overdue') return 100;
          if (item.priority === 'Critical') return 80;
          if (item.priority === 'High' && item.status !== 'Resolved' && item.status !== 'Closed') return 60;
          if (item.status === 'In Progress') return 40;
          if (item.status === 'New') return 20;
          return 0;
        };
        return score(b) - score(a);
      })
      .slice(0, 5);
  }, [issues]);

  // Handle Status Update Submit
  const handleSaveStatusUpdate = () => {
    if (!detailModalIssue) return;
    const updated = updateStaffIssueStatus(detailModalIssue.id, newStatus, statusRemark);
    setIssues(updated);
    setDetailModalIssue(null);
    setStatusRemark('');
    showToast(`Issue ${detailModalIssue.id} updated to ${newStatus}`);
  };

  // Category Icon helper
  const renderCategoryIcon = (category: StaffIssueCategory) => {
    switch (category) {
      case 'roads':
        return (
          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 19L8 5M16 5L20 19M12 7V9M12 13V15M12 19V21" />
            </svg>
          </span>
        );
      case 'streetlights':
        return (
          <span style={{ color: '#00e599', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
            </svg>
          </span>
        );
      case 'waste':
        return (
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
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

  // Guard: Protect Staff Portal for staff or super_admin accounts
  const isAuthorized = user && (user.role === 'ward_staff' || user.role === 'super_admin');

  if (!isAuthorized) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg
              width="32"
              height="32"
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
          <h1 className={styles.authTitle}>Ward Staff Access Restricted</h1>
          <p className={styles.authMessage}>
            The Ward Staff Portal is reserved for verified municipal employees assigned to field operations in Mira Bhayandar.
          </p>
          <div className={styles.authActions}>
            <button
              type="button"
              className={styles.authPrimaryBtn}
              onClick={handleDemoSignInStaff}
            >
              Sign In as Ward 3 Staff (Demo)
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

        <div className={styles.sidebarSectionLabel}>WARD STAFF PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard (Active) */}
          <Link
            href="/staff/dashboard"
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

          {/* 2. Assigned Issues */}
          <Link
            href="/staff/issues"
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
            <span className={styles.navLabel}>Assigned Issues</span>
          </Link>

          {/* 3. Field Operations */}
          <Link
            href="/staff/field-operations"
            className={styles.navItem}
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
              alt="Work together for a cleaner Mira Bhayandar"
              fill
              sizes="220px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div className={styles.promoTitle}>Work together for a cleaner Mira Bhayandar.</div>
            <div className={styles.promoSubtitle}>Track. Resolve. Build a better city.</div>
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
              placeholder="Search issues, report ID, location, or citizen..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  router.push(`/staff/issues?search=${encodeURIComponent(globalSearch.trim())}`);
                }
              }}
              aria-label="Search issues or citizens"
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
                <div className={styles.profileMenuDropdown} style={{ minWidth: '180px' }}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    style={{ fontWeight: 600, color: '#5cebaa' }}
                    onClick={() => {
                      setSelectedWard('Ward 3');
                      setWardDropdownOpen(false);
                      showToast('Active Jurisdiction: Ward 3 (Primary Assignment)');
                    }}
                  >
                    ✓ Ward 3 (Authorized)
                  </button>
                  {['Ward 1', 'Ward 2', 'Ward 4', 'Ward 5'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      className={styles.menuItem}
                      onClick={() => {
                        setWardDropdownOpen(false);
                        showToast(`Viewing ${w} in read-only mode (Field operations scoped to Ward 3)`);
                      }}
                    >
                      {w} (Read-only)
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell with Real Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                aria-expanded={notifDropdownOpen}
                aria-label="View staff notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifCount > 0 && (
                  <span className={styles.notifBadgeSmall}>{unreadNotifCount}</span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Ward 3 Operations Alerts
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#5cebaa',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          const updated = markAllStaffNotificationsRead();
                          setNotifs(updated);
                          showToast('All alerts marked as read');
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifs.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                        onClick={() => {
                          const updated = markStaffNotificationRead(n.id);
                          setNotifs(updated);
                          setNotifDropdownOpen(false);
                          if (n.issueId) {
                            const found = issues.find((i) => i.id === n.issueId);
                            if (found) {
                              setDetailModalIssue(found);
                              setNewStatus(found.status);
                            } else {
                              router.push(`/staff/issues?search=${n.issueId}`);
                            }
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{n.createdAt}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        {n.issueId && (
                          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
                            Ref: {n.issueId}
                          </span>
                        )}
                      </button>
                    ))}
                    {notifs.length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                <Link href="/" className={styles.crumbLink}>
                  Dashboard
                </Link>
                <span className={styles.crumbSep}>&gt;</span>
                <span className={styles.crumbActive}>Ward Staff Dashboard</span>
              </nav>
              <h1 className={styles.bannerTitle}>Ward Staff Dashboard</h1>
              <p className={styles.bannerSubtitle}>
                Manage assigned issues, track field work and help keep Mira Bhayandar clean and safe.
              </p>
            </div>

            <div className={styles.bannerImageContainer}>
              <Image
                src="/images/ward/banner.jpg"
                alt="Ward maintenance vehicles and field crew"
                width={540}
                height={180}
                className={styles.bannerImg}
                priority
              />
              <div className={styles.bannerSloganOverlay}>
                <div className={styles.sloganTitle}>Cleaner Wards</div>
                <div className={styles.sloganSubtitle}>Stronger Communities</div>
              </div>
            </div>
          </div>

          {/* 6 Aligned KPI Cards (Requirement #4) */}
          <div className={styles.kpiRow}>
            {/* 1. Assigned Issues */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/issues')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="View all assigned issues"
            >
              <div className={`${styles.kpiIconBox} ${styles.kpiIconTeal}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.assignedIssues}</div>
                <div className={styles.kpiLabel}>Assigned Issues</div>
                <div className={`${styles.kpiSubtext} ${styles.kpiPositive}`}>Active in Ward 3</div>
              </div>
            </div>

            {/* 2. New Issues */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/issues?status=New')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="Filter by New issues"
            >
              <div className={`${styles.kpiIconBox}`} style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber} style={{ color: '#0ea5e9' }}>{kpis.newIssues}</div>
                <div className={styles.kpiLabel}>New Issues</div>
                <div className={`${styles.kpiSubtext} ${styles.kpiPositive}`}>+2 reported today</div>
              </div>
            </div>

            {/* 3. In Progress */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/issues?status=In Progress')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="Filter by In Progress"
            >
              <div className={`${styles.kpiIconBox} ${styles.kpiIconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.inProgress}</div>
                <div className={styles.kpiLabel}>In Progress</div>
                <div className={styles.kpiSubtext}>{kpis.inProgressPercent}% of total</div>
              </div>
            </div>

            {/* 4. Resolved */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/issues?status=Resolved')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="Filter by Resolved"
            >
              <div className={`${styles.kpiIconBox} ${styles.kpiIconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.resolvedThisMonth}</div>
                <div className={styles.kpiLabel}>Resolved</div>
                <div className={styles.kpiSubtext}>
                  This month <span className={styles.kpiPositive}>↑ {kpis.resolvedGrowth}%</span>
                </div>
              </div>
            </div>

            {/* 5. Overdue */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/issues?status=Overdue')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="Filter by Overdue"
            >
              <div className={`${styles.kpiIconBox} ${styles.kpiIconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber} style={{ color: '#ef4444' }}>{kpis.overdue}</div>
                <div className={styles.kpiLabel}>Overdue</div>
                <div className={styles.kpiSubtext} style={{ color: '#ef4444' }}>Needs immediate action</div>
              </div>
            </div>

            {/* 6. Avg Resolution Time */}
            <div
              className={styles.kpiCard}
              onClick={() => router.push('/staff/ward-reports?view=performance')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              aria-label="View Ward Performance analytics"
            >
              <div className={`${styles.kpiIconBox} ${styles.kpiIconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiNumber}>{kpis.avgResolutionDays} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>days</span></div>
                <div className={styles.kpiLabel}>Avg. Resolution Time</div>
                <div className={`${styles.kpiSubtext} ${styles.kpiPositive}`}>↓ 0.6d faster (SLA: 4.0d)</div>
              </div>
            </div>
          </div>

          {/* ============================================================
              MIDDLE SECTION — 3 Columns: Map, Recent Issues, Priority & Activity
              ============================================================ */}
          <div className={styles.middleSection}>
            {/* Left Panel: Assigned Issues Map */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <span className={styles.panelHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className={styles.panelHeaderTitle}>Assigned Issues Map</span>
                </div>
                <button
                  type="button"
                  className={styles.panelHeaderAction}
                  onClick={() => router.push('/staff/field-operations')}
                >
                  View Full Map
                </button>
              </div>

              <div className={styles.mapBody}>
                {/* Background Satellite Map of Mira Bhayandar */}
                <Image
                  src="/images/dashboard/mira-bhayandar-map.png"
                  alt="Assigned Issues Map of Mira Bhayandar Ward 3"
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
                      setSelectedPinIssue(issues[0]);
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
                  {issues.slice(0, 16).map((issue) => {
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

                {/* Selected Pin Popup Card */}
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
                    <div style={{ margin: '4px 0 8px' }}>
                      {(() => {
                        const sla = getIssueSLA(selectedPinIssue);
                        const slaStyle = styles[sla.badgeClass as keyof typeof styles] || styles.slaOnTrack;
                        return (
                          <span className={`${styles.slaBadge} ${slaStyle}`}>
                            ⏱ {sla.text}
                          </span>
                        );
                      })()}
                    </div>
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
                    <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                    <span>Overdue (6)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                    <span>In Progress (12)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#0ea5e9' }} />
                    <span>New (4)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#22c55e' }} />
                    <span>Resolved (18)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel: Needs Attention Priority Queue */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <span className={styles.panelHeaderIcon} style={{ color: '#ef4444' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="12 2 2 22 22 22" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <span className={styles.panelHeaderTitle}>Needs Attention</span>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    Priority Queue
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.panelHeaderAction}
                  onClick={() => router.push('/staff/issues')}
                >
                  View All →
                </button>
              </div>

              <div className={styles.recentList}>
                {needsAttentionList.map((issue) => {
                  const sla = getIssueSLA(issue);
                  const slaStyle = styles[sla.badgeClass as keyof typeof styles] || styles.slaOnTrack;

                  return (
                    <div
                      key={issue.id}
                      className={styles.recentItem}
                      onClick={() => {
                        setDetailModalIssue(issue);
                        setNewStatus(issue.status);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View issue ${issue.id}`}
                    >
                      <Image
                        src={issue.imageUrl}
                        alt={issue.title}
                        width={44}
                        height={44}
                        className={styles.recentThumb}
                      />
                      <div className={styles.recentInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.recentTicket}>{issue.ticketId}</span>
                          <span className={`${styles.slaBadge} ${slaStyle}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {sla.text}
                          </span>
                        </div>
                        <div className={styles.recentTitle}>{issue.title}</div>
                        <div className={styles.recentLoc}>📍 {issue.location} {issue.assignedTeam ? `• ${issue.assignedTeam}` : ''}</div>
                      </div>
                      <div className={styles.recentRight}>
                        <span
                          className={`${styles.priorityPill} ${
                            issue.priority === 'Critical'
                              ? styles.prioCritical || styles.prioHigh
                              : issue.priority === 'High'
                              ? styles.prioHigh
                              : issue.priority === 'Medium'
                              ? styles.prioMedium
                              : styles.prioLow
                          }`}
                        >
                          {issue.priority}
                        </span>
                        <span className={styles.recentTime}>{issue.timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Priority Distribution & Today's Activity */}
            <div className={styles.rightStack}>
              {/* Card 1: Priority Distribution */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span className={styles.panelHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    </span>
                    <span className={styles.panelHeaderTitle}>Priority Distribution</span>
                  </div>
                </div>

                <div className={styles.donutWrapper}>
                  {/* Circular SVG Donut Chart */}
                  <div className={styles.donutSvgContainer}>
                    <svg width="140" height="140" viewBox="0 0 36 36">
                      {/* Background Track */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="4"
                      />
                      {/* Segment 1: High (25% -> stroke-dasharray 22 66, offset 25) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="4"
                        strokeDasharray="22 66"
                        strokeDashoffset="25"
                      />
                      {/* Segment 2: Medium (42% -> stroke-dasharray 37 51, offset 3) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeDasharray="37 51"
                        strokeDashoffset="3"
                      />
                      {/* Segment 3: Low (25% -> stroke-dasharray 22 66, offset -34) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="4"
                        strokeDasharray="22 66"
                        strokeDashoffset="-34"
                      />
                      {/* Segment 4: Others (8% -> stroke-dasharray 7 81, offset -56) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="4"
                        strokeDasharray="7 81"
                        strokeDashoffset="-56"
                      />
                    </svg>

                    <div className={styles.donutCenterText}>
                      <div className={styles.donutCenterNumber}>24</div>
                      <div className={styles.donutCenterLabel}>Issues</div>
                    </div>
                  </div>

                  <div className={styles.distributionLegend}>
                    {priorityDist.map((item) => (
                      <div key={item.priority} className={styles.distRow}>
                        <div className={styles.distLeft}>
                          <span className={styles.distDot} style={{ background: item.color }} />
                          <span>{item.priority}</span>
                        </div>
                        <div className={styles.distRight}>
                          {item.count} ({item.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Today's Activity */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelHeaderLeft}>
                    <span className={styles.panelHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <span className={styles.panelHeaderTitle}>Today&apos;s Activity</span>
                  </div>
                </div>

                <div className={styles.activityList}>
                  {STAFF_TODAY_ACTIVITY.map((act) => {
                    let iconBg = 'rgba(0, 229, 153, 0.15)';
                    let iconColor = '#00e599';
                    if (act.type === 'visit') {
                      iconBg = 'rgba(14, 165, 233, 0.15)';
                      iconColor = '#0ea5e9';
                    } else if (act.type === 'status') {
                      iconBg = 'rgba(245, 158, 11, 0.15)';
                      iconColor = '#f59e0b';
                    } else if (act.type === 'photo') {
                      iconBg = 'rgba(168, 85, 247, 0.15)';
                      iconColor = '#a855f7';
                    }

                    return (
                      <div key={act.id} className={styles.activityItem}>
                        <div
                          className={styles.activityIcon}
                          style={{ background: iconBg, color: iconColor }}
                        >
                          {act.type === 'assigned' && '📋'}
                          {act.type === 'visit' && '📍'}
                          {act.type === 'status' && '⏱️'}
                          {act.type === 'photo' && '📷'}
                        </div>
                        <div className={styles.activityInfo}>
                          <div className={styles.activityTitle}>{act.title}</div>
                          <div className={styles.activitySubtitle}>{act.subtitle}</div>
                        </div>
                        <div className={styles.activityTime}>{act.timestamp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              BOTTOM SECTION — My Assigned Issues Table
              ============================================================ */}
          <div className={styles.tablePanel} id="my-assigned-table">
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <span className={styles.panelHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
                <span className={styles.panelHeaderTitle}>My Assigned Issues</span>
              </div>
            </div>

            <div className={styles.tableToolbar}>
              {/* Filter Pills */}
              <div className={styles.tableFilterPills}>
                <button
                  type="button"
                  className={`${styles.filterPill} ${tableStatusFilter === 'All' ? styles.filterPillActive : ''}`}
                  onClick={() => setTableStatusFilter('All')}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${tableStatusFilter === 'New' ? styles.filterPillActive : ''}`}
                  onClick={() => setTableStatusFilter('New')}
                >
                  New ({statusCounts.n})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${tableStatusFilter === 'In Progress' ? styles.filterPillActive : ''}`}
                  onClick={() => setTableStatusFilter('In Progress')}
                >
                  In Progress ({statusCounts.inp})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${tableStatusFilter === 'Overdue' ? styles.filterPillActive : ''}`}
                  onClick={() => setTableStatusFilter('Overdue')}
                >
                  Overdue ({statusCounts.ov})
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${tableStatusFilter === 'Resolved' ? styles.filterPillActive : ''}`}
                  onClick={() => setTableStatusFilter('Resolved')}
                >
                  Resolved ({statusCounts.res})
                </button>
              </div>

              {/* Table Search & Filter Button */}
              <div className={styles.tableControlsRight}>
                <div className={styles.tableSearchBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.tableSearchInput}
                    placeholder="Search assigned issues..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    aria-label="Filter issues table"
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
                  All Filters
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Issue Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td className={styles.issueIdCell}>{issue.id}</td>
                      <td className={styles.issueTitleCell}>{issue.title}</td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {renderCategoryIcon(issue.category)}
                          <span style={{ textTransform: 'capitalize' }}>{issue.category}</span>
                        </span>
                      </td>
                      <td>{issue.location}</td>
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
                      <td style={{ color: '#94a3b8' }}>{issue.assignedDate}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.viewActionBtn}
                          onClick={() => {
                            setDetailModalIssue(issue);
                            setNewStatus(issue.status);
                          }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTableIssues.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No assigned issues found matching the selected filter.
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
                <div className={styles.detailLabel}>SLA Status &amp; Horizon</div>
                <div className={styles.detailValue}>
                  {(() => {
                    const sla = getIssueSLA(detailModalIssue);
                    const slaStyle = styles[sla.badgeClass as keyof typeof styles] || styles.slaOnTrack;
                    return (
                      <span className={`${styles.slaBadge} ${slaStyle}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                        ⏱ {sla.text}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Assigned Field Team</div>
                <div className={styles.detailValue} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{detailModalIssue.assignedTeam || 'Unassigned'}</span>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(92, 235, 170, 0.1)',
                      color: '#5cebaa',
                      border: '1px solid rgba(92, 235, 170, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setDetailModalIssue(null);
                      router.push(`/staff/field-operations?issueId=${detailModalIssue.id}`);
                    }}
                  >
                    Dispatch / Reassign Team →
                  </button>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Update Working Status</div>
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
