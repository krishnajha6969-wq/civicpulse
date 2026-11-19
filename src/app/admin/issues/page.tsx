'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginSuperAdmin, DEFAULT_SUPER_ADMIN, AuthUser } from '../../../lib/auth';
import {
  ALL_ISSUES_SUMMARY,
  ADMIN_ISSUES_LIST,
  AdminIssue,
  IssueStatus,
  IssuePriority,
  IssueCategory,
} from '../../../lib/admin';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './admin-issues.module.css';

export default function AllIssuesAndCityMapPage() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && current.role === 'super_admin') {
      return current;
    }
    return DEFAULT_SUPER_ADMIN;
  });

  // UI Dropdowns
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [selectedGlobalWard, setSelectedGlobalWard] = useState<string>('All Wards');

  // Filter Toolbar State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWard, setFilterWard] = useState('All Wards');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priorities');
  const [filterTeam, setFilterTeam] = useState('All Teams');
  const [dateRange, setDateRange] = useState('01 Dec 2024 - 31 Dec 2024');

  // Applied Filter State
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    ward: 'All Wards',
    category: 'All Categories',
    status: 'All Status',
    priority: 'All Priorities',
    team: 'All Teams',
  });

  // Workspace View Mode & Selected Issue
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('map');
  const [selectedIssueId, setSelectedIssueId] = useState<string>('CP-10421');
  const [detailsTab, setDetailsTab] = useState<'details' | 'photos' | 'location' | 'updates' | 'citizen'>('details');
  const [detailsPanelVisible, setDetailsPanelVisible] = useState(true);

  // Map Controls State
  const [mapZoom, setMapZoom] = useState(1);

  // Table Row Selection & Pagination
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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

  // Ensure authorized Super Admin session
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && usr.role === 'super_admin') {
      setUser(usr);
    } else {
      const demoAdmin = loginSuperAdmin();
      setUser(demoAdmin);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/admin');
  };

  // Handle Apply Filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: filterSearch,
      ward: filterWard,
      category: filterCategory,
      status: filterStatus,
      priority: filterPriority,
      team: filterTeam,
    });
    setCurrentPage(1);
    showToast('Applied search & filters');
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterWard('All Wards');
    setFilterCategory('All Categories');
    setFilterStatus('All Status');
    setFilterPriority('All Priorities');
    setFilterTeam('All Teams');
    setAppliedFilters({
      search: '',
      ward: 'All Wards',
      category: 'All Categories',
      status: 'All Status',
      priority: 'All Priorities',
      team: 'All Teams',
    });
    setCurrentPage(1);
    showToast('Reset all filters');
  };

  // Filtered Issues List
  const filteredIssues = useMemo(() => {
    return ADMIN_ISSUES_LIST.filter((issue) => {
      // Global Ward selection from header
      if (selectedGlobalWard !== 'All Wards' && issue.ward !== selectedGlobalWard.split(' - ')[0]) {
        return false;
      }
      // Toolbar ward filter
      if (appliedFilters.ward !== 'All Wards' && issue.ward !== appliedFilters.ward) {
        return false;
      }
      // Category filter
      if (appliedFilters.category !== 'All Categories' && issue.category !== appliedFilters.category) {
        return false;
      }
      // Status filter
      if (appliedFilters.status !== 'All Status' && issue.status !== appliedFilters.status) {
        return false;
      }
      // Priority filter
      if (appliedFilters.priority !== 'All Priorities' && issue.priority !== appliedFilters.priority) {
        return false;
      }
      // Team filter
      if (appliedFilters.team !== 'All Teams' && issue.assignedTeam !== appliedFilters.team) {
        return false;
      }
      // Search text
      if (appliedFilters.search) {
        const query = appliedFilters.search.toLowerCase();
        const matchesId = issue.ticketId.toLowerCase().includes(query);
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesLocation = issue.location.toLowerCase().includes(query);
        const matchesWard = issue.wardFullName.toLowerCase().includes(query);
        if (!matchesId && !matchesTitle && !matchesLocation && !matchesWard) {
          return false;
        }
      }
      return true;
    });
  }, [appliedFilters, selectedGlobalWard]);

  // Paginated Rows
  const totalIssuesCount = filteredIssues.length;
  const totalPages = Math.ceil(totalIssuesCount / rowsPerPage) || 1;
  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredIssues.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredIssues, currentPage, rowsPerPage]);

  // Selected Issue Object
  const selectedIssue = useMemo(() => {
    return (
      ADMIN_ISSUES_LIST.find((i) => i.id === selectedIssueId) ||
      filteredIssues[0] ||
      ADMIN_ISSUES_LIST[0]
    );
  }, [selectedIssueId, filteredIssues]);

  // Select / Deselect All Rows
  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(paginatedIssues.map((i) => i.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper for Category Icon
  const getCategoryIcon = (cat: IssueCategory) => {
    switch (cat) {
      case 'Roads':
        return '⚠️';
      case 'Streetlights':
        return '💡';
      case 'Waste':
        return '🗑️';
      case 'Water Supply':
        return '💧';
      case 'Drainage':
        return '🔘';
      default:
        return '📋';
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0d9488',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {toastMessage}
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

      {/* ============================================================
          SIDEBAR
          ============================================================ */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>ADMIN PORTAL</div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          {/* All Issues & City Map (ACTIVE) */}
          <Link href="/admin/issues" className={`${styles.navItem} ${styles.navItemActive}`}>
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

          <Link
            href="/admin/resource-allocation"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </span>
            <span>Resource Allocation</span>
          </Link>

          <Link
            href="/admin/ward-management"
            className={styles.navItem}
          >
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

          <Link
            href="/admin/system-administration"
            className={styles.navItem}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

          <Link href="/admin/help-support" className={styles.navItem}>
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

        {/* Promo Card at bottom of sidebar */}
        <div className={styles.sidebarPromoCard}>
          <div className={styles.promoGraphicWrap}>
            <Image
              src="/images/dashboard/sidebar-promo-iso.png"
              alt="Mira Bhayandar 3D model"
              width={220}
              height={90}
              className={styles.promoGraphic}
            />
          </div>
          <h4 className={styles.promoTitle}>Stronger Communities A Cleaner Mira Bhayandar</h4>
          <p className={styles.promoSubtext}>Monitor. Manage. Make a Difference.</p>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA
          ============================================================ */}
      <div className={styles.mainWrapper}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.searchContainer}>
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
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>

          <div className={styles.headerActions}>
            {/* Ward Selector Dropdown */}
            <div className={styles.wardSelector}>
              <button
                type="button"
                className={styles.wardSelectorBtn}
                onClick={() => setWardDropdownOpen(!wardDropdownOpen)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{selectedGlobalWard}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {wardDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {['All Wards', 'Ward 1 - Mira Road', 'Ward 2 - Bhayandar West', 'Ward 3 - Bhayandar East', 'Ward 4 - Dahisar Check Naka'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedGlobalWard(w);
                        setWardDropdownOpen(false);
                        showToast(`Filtered global scope to: ${w}`);
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell (Badge 8 as shown in image) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.notifBtn}
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="View notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className={styles.notifBadge}>8</span>
              </button>

              {notifDropdownOpen && (
                <div className={styles.dropdownMenu} style={{ width: '280px' }}>
                  <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '700', color: '#f1f5f9' }}>
                    Notifications (8 Unread)
                  </div>
                  <div className={styles.dropdownDivider} />
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Ward 1:</strong> New high-priority pothole reported on Station Road
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Ward 2 Overdue:</strong> Garbage overflow exceeding 48h SLA
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Ward 4:</strong> Stormwater drain slab replacement dispatched
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    style={{ color: '#14b8a6', textAlign: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      showToast('Marked all notifications as read');
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className={styles.userProfile}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className={styles.avatarCircle}>SA</div>
                <div className={styles.profileMeta}>
                  <span className={styles.profileName}>Admin User</span>
                  <span className={styles.profileRole}>Super Admin</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <Link href="/citizen" className={styles.dropdownItem}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Switch to Citizen Portal</span>
                  </Link>
                  <Link href="/staff/dashboard" className={styles.dropdownItem}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Switch to Staff Portal</span>
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    style={{ color: '#ef4444' }}
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Page Body */}
        <div className={styles.pageBody}>
          {/* ============================================================
              CITY BANNER
              ============================================================ */}
          <div className={styles.cityBanner}>
            <div className={styles.cityBannerBg} />
            <div className={styles.cityBannerOverlay} />

            <div className={styles.bannerContentLeft}>
              <div className={styles.breadcrumb}>
                <span>Dashboard</span>
                <span>&gt;</span>
                <span className={styles.breadcrumbCurrent}>All Issues & City Map</span>
              </div>
              <h1 className={styles.bannerTitle}>All Issues & City Map</h1>
              <p className={styles.bannerSubtitle}>
                Monitor, investigate and manage civic reports across all authorised wards of Mira Bhayandar.
              </p>
            </div>

            <div className={styles.bannerContentRight}>
              <div className={styles.bannerSlogan}>
                Unified Oversight<br />
                Cleaner Wards<br />
                Stronger Communities
              </div>
              <div className={styles.bannerSloganCurve} />
            </div>
          </div>

          {/* ============================================================
              SUMMARY CARDS (5 Cards in 1 Row)
              ============================================================ */}
          <div className={styles.summaryGrid}>
            {/* 1. Total Issues */}
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIconSquircle} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryNumber}>{ALL_ISSUES_SUMMARY.totalIssues.toLocaleString()}</span>
                <span className={styles.summaryLabel}>Total Issues</span>
                <span className={styles.summarySubtext}>All wards</span>
              </div>
            </div>

            {/* 2. New */}
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIconSquircle} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryNumber}>{ALL_ISSUES_SUMMARY.newIssues}</span>
                <span className={styles.summaryLabel}>New</span>
                <span className={styles.summarySubtext}>Awaiting action</span>
              </div>
            </div>

            {/* 3. In Progress */}
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIconSquircle} ${styles.iconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryNumber}>{ALL_ISSUES_SUMMARY.inProgress}</span>
                <span className={styles.summaryLabel}>In Progress</span>
                <span className={styles.summarySubtext}>Under resolution</span>
              </div>
            </div>

            {/* 4. Overdue */}
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIconSquircle} ${styles.iconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryNumber}>{ALL_ISSUES_SUMMARY.overdue}</span>
                <span className={styles.summaryLabel}>Overdue</span>
                <span className={styles.summarySubtext}>Needs immediate attention</span>
              </div>
            </div>

            {/* 5. Resolved */}
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIconSquircle} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.summaryMeta}>
                <span className={styles.summaryNumber}>{ALL_ISSUES_SUMMARY.resolved}</span>
                <span className={styles.summaryLabel}>Resolved</span>
                <span className={styles.summarySubtext}>72% resolution rate</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              FILTER TOOLBAR
              ============================================================ */}
          <div className={styles.filterToolbar}>
            {/* Search Input */}
            <div className={styles.filterSearchWrap}>
              <span className={styles.filterSearchIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className={styles.filterSearchInput}
                placeholder="Search by ID, title or location..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>

            {/* Ward Selector */}
            <select
              className={styles.filterSelect}
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
            >
              <option value="All Wards">All Wards</option>
              <option value="Ward 1">Ward 1 - Mira Road</option>
              <option value="Ward 2">Ward 2 - Bhayandar West</option>
              <option value="Ward 3">Ward 3 - Bhayandar East</option>
              <option value="Ward 4">Ward 4 - Dahisar Check Naka</option>
            </select>

            {/* Category Selector */}
            <select
              className={styles.filterSelect}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              <option value="Roads">Roads</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Waste">Waste</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Drainage">Drainage</option>
              <option value="Others">Others</option>
            </select>

            {/* Status Selector */}
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Overdue">Overdue</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Priority Selector */}
            <select
              className={styles.filterSelect}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Date Range Box */}
            <div
              className={styles.dateRangeBox}
              onClick={() => openNotice('Date Range Filter', 'Select custom fiscal reporting dates.')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{dateRange}</span>
            </div>

            {/* Team Selector */}
            <select
              className={styles.filterSelect}
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="All Teams">All Teams</option>
              <option value="Team 1">Team 1 - Road Maintenance</option>
              <option value="Team 2">Team 2 - Sanitation Squad</option>
              <option value="Team 3">Team 3 - Water Supply</option>
              <option value="Team 4">Team 4 - Stormwater Ops</option>
              <option value="Unassigned">Unassigned</option>
            </select>

            {/* Action Buttons */}
            <button
              type="button"
              className={styles.btnApply}
              onClick={handleApplyFilters}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Apply</span>
            </button>

            <button
              type="button"
              className={styles.btnClear}
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>

          {/* ============================================================
              MAIN WORKSPACE (Map on left, Details on right)
              ============================================================ */}
          <div className={styles.workspaceGrid}>
            {/* Left: City Map - All Issues */}
            <div className={styles.mapCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>City Map - All Issues</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={styles.viewModePills}>
                    <button
                      type="button"
                      className={`${styles.viewModeBtn} ${viewMode === 'map' ? styles.viewModeBtnActive : ''}`}
                      onClick={() => setViewMode('map')}
                    >
                      Map View
                    </button>
                    <button
                      type="button"
                      className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.viewModeBtnActive : ''}`}
                      onClick={() => {
                        const el = document.getElementById('all-issues-register-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      List View
                    </button>
                    <button
                      type="button"
                      className={`${styles.viewModeBtn} ${viewMode === 'split' ? styles.viewModeBtnActive : ''}`}
                      onClick={() => setViewMode('split')}
                    >
                      Split View
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => openNotice('Fullscreen Map View', 'Expanded GIS mapping interface with high-density sensor overlays.')}
                    title="Fullscreen"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Interactive Map Viewport */}
              <div className={styles.mapViewport}>
                <div
                  className={styles.mapBackground}
                  style={{ transform: `scale(${mapZoom})` }}
                />

                {/* SVG Polygons for Ward Boundaries */}
                <svg className={styles.mapSvgOverlay} viewBox="0 0 600 380" preserveAspectRatio="none">
                  <polygon
                    points="60,90 220,110 240,240 140,290 50,220"
                    className={`${styles.wardBoundary} ${styles.ward1Polygon}`}
                  />
                  <polygon
                    points="160,220 280,180 340,320 200,350 140,280"
                    className={`${styles.wardBoundary} ${styles.ward2Polygon}`}
                  />
                  <polygon
                    points="250,130 420,150 450,280 320,310 270,210"
                    className={`${styles.wardBoundary} ${styles.ward3Polygon}`}
                  />
                  <polygon
                    points="330,220 460,200 520,330 380,360 310,300"
                    className={`${styles.wardBoundary} ${styles.ward4Polygon}`}
                  />
                </svg>

                {/* Ward Badges on Map */}
                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge1}`}
                  style={{ top: '35%', left: '26%' }}
                  onClick={() => {
                    setFilterWard('Ward 1');
                    handleApplyFilters();
                  }}
                >
                  <span>Mira Road (Ward 1)</span>
                  <span className={styles.badgeCount}>312</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge2}`}
                  style={{ top: '65%', left: '38%' }}
                  onClick={() => {
                    setFilterWard('Ward 2');
                    handleApplyFilters();
                  }}
                >
                  <span>Bhayandar West (Ward 2)</span>
                  <span className={styles.badgeCount}>280</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge3}`}
                  style={{ top: '42%', left: '55%' }}
                  onClick={() => {
                    setFilterWard('Ward 3');
                    handleApplyFilters();
                  }}
                >
                  <span>Bhayandar East (Ward 3)</span>
                  <span className={styles.badgeCount}>356</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge4}`}
                  style={{ top: '67%', left: '62%' }}
                  onClick={() => {
                    setFilterWard('Ward 4');
                    handleApplyFilters();
                  }}
                >
                  <span>Dahisar Check Naka (Ward 4)</span>
                  <span className={styles.badgeCount}>300</span>
                </div>

                {/* Markers for all visible issues */}
                {filteredIssues.map((issue) => {
                  let pinClass = styles.pinResolved;
                  if (issue.status === 'New') pinClass = styles.pinNew;
                  if (issue.status === 'In Progress') pinClass = styles.pinProgress;
                  if (issue.status === 'Overdue') pinClass = styles.pinOverdue;
                  const isSelected = issue.id === selectedIssueId;

                  return (
                    <div
                      key={issue.id}
                      className={`${styles.mapPin} ${pinClass} ${isSelected ? styles.mapPinSelected : ''}`}
                      style={{ top: `${issue.mapTop}%`, left: `${issue.mapLeft}%` }}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setDetailsPanelVisible(true);
                      }}
                      title={`${issue.ticketId}: ${issue.title} (${issue.status})`}
                    />
                  );
                })}

                {/* Map Zoom & Recenter Controls */}
                <div className={styles.mapControls}>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.min(z + 0.2, 1.8))}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.8))}
                    title="Zoom out"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom(1)}
                    title="Recenter"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="7" />
                      <line x1="12" y1="1" x2="12" y2="5" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="1" y1="12" x2="5" y2="12" />
                      <line x1="19" y1="12" x2="23" y2="12" />
                    </svg>
                  </button>
                </div>

                {/* Map Legend */}
                <div className={styles.mapLegend}>
                  <div className={styles.legendRow}>
                    <span className={styles.dotBlue}>●</span> New
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.dotAmber}>●</span> In Progress
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.dotRed}>●</span> Overdue
                  </div>
                  <div className={styles.legendRow}>
                    <span className={styles.dotGreen}>●</span> Resolved
                  </div>
                  <div className={styles.legendRow}>
                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>—</span> Ward Boundary
                  </div>
                  <div className={styles.legendScale}>
                    <div className={styles.scaleLine} />
                    <span>2 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Issue Details Panel */}
            {detailsPanelVisible && selectedIssue ? (
              <div className={styles.detailsCard}>
                <div className={styles.detailsHeaderRow}>
                  <h3 className={styles.cardTitle}>Issue Details</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setDetailsPanelVisible(false)}
                    title="Close Details Panel"
                  >
                    ✕
                  </button>
                </div>

                {/* Issue Header Block with Thumbnail and Badges */}
                <div className={styles.issueHeaderBlock}>
                  <div className={styles.issuePhotoWrap}>
                    <Image
                      src={selectedIssue.imageUrl || '/images/dashboard/thumb-pothole.jpg'}
                      alt={selectedIssue.title}
                      width={110}
                      height={80}
                      className={styles.issuePhoto}
                    />
                    <span className={styles.photoCounter}>1/{selectedIssue.photos.length || 3}</span>
                  </div>

                  <div className={styles.issueHeaderMeta}>
                    <div className={styles.badgesRow}>
                      <span className={styles.badgeId}>{selectedIssue.ticketId}</span>
                      <span
                        className={
                          selectedIssue.priority === 'High'
                            ? styles.badgePriorityHigh
                            : selectedIssue.priority === 'Medium'
                            ? styles.badgePriorityMedium
                            : styles.badgePriorityLow
                        }
                      >
                        ● {selectedIssue.priority} Priority
                      </span>
                      <span
                        className={
                          selectedIssue.status === 'Resolved'
                            ? styles.badgeStatusResolved
                            : selectedIssue.status === 'Overdue'
                            ? styles.badgeStatusOverdue
                            : selectedIssue.status === 'New'
                            ? styles.badgeStatusNew
                            : styles.badgeStatusProgress
                        }
                      >
                        ● {selectedIssue.status}
                      </span>
                    </div>

                    <h4 className={styles.issueMainTitle}>{selectedIssue.title}</h4>

                    <div className={styles.issueLocationRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{selectedIssue.location} ({selectedIssue.ward})</span>
                    </div>

                    <div className={styles.issueReportedMetaRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                        </svg>
                        <span>Reported: {selectedIssue.reportedDateTime}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>By: {selectedIssue.reportedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabsRow}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${detailsTab === 'details' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDetailsTab('details')}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${detailsTab === 'photos' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDetailsTab('photos')}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${detailsTab === 'location' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDetailsTab('location')}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${detailsTab === 'updates' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDetailsTab('updates')}
                  >
                    Updates
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${detailsTab === 'citizen' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDetailsTab('citizen')}
                  >
                    Citizen Details
                  </button>
                </div>

                {/* Tab Content */}
                {detailsTab === 'details' && (
                  <div className={styles.detailsGrid}>
                    {/* Category */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconGreen}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Category</span>
                        <span className={styles.metaItemValue}>{selectedIssue.category}</span>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconRed}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Priority</span>
                        <span className={styles.metaItemValue}>{selectedIssue.priority}</span>
                      </div>
                    </div>

                    {/* Ward */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconBlue}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Ward</span>
                        <span className={styles.metaItemValue}>{selectedIssue.wardFullName}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconBlue}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 14 14" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Status</span>
                        <span className={styles.metaItemValue}>{selectedIssue.status}</span>
                      </div>
                    </div>

                    {/* Assigned Team */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconPurple}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Assigned Team</span>
                        <span className={styles.metaItemValue}>{selectedIssue.assignedTeamFull}</span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className={styles.metaItemCard}>
                      <div className={`${styles.metaItemIconSquircle} ${styles.iconGreen}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className={styles.metaItemTexts}>
                        <span className={styles.metaItemLabel}>Last Updated</span>
                        <span className={styles.metaItemValue}>{selectedIssue.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                )}

                {detailsTab === 'photos' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {selectedIssue.photos.map((src, i) => (
                      <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', height: '80px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Image src={src} alt="Evidence" width={100} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {detailsTab === 'location' && (
                  <div style={{ padding: '8px', background: '#091222', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <p style={{ margin: '0 0 6px' }}><strong>Geographic Coordinates:</strong> 19.2812° N, 72.8561° E</p>
                    <p style={{ margin: '0 0 6px' }}><strong>Landmark:</strong> Near Railway Station West Exit Gate 2</p>
                    <p style={{ margin: 0 }}><strong>Municipal Ward Zone:</strong> {selectedIssue.wardFullName}</p>
                  </div>
                )}

                {detailsTab === 'updates' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedIssue.history.map((h, i) => (
                      <div key={i} style={{ padding: '8px', background: '#091222', borderRadius: '6px', fontSize: '11.5px' }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{h.title}</div>
                        <div style={{ color: '#64748b', fontSize: '10.5px' }}>{h.actor} • {h.time}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailsTab === 'citizen' && (
                  <div style={{ padding: '10px', background: '#091222', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <p style={{ margin: '0 0 4px' }}><strong>Name:</strong> {selectedIssue.citizenName}</p>
                    <p style={{ margin: '0 0 4px' }}><strong>Phone:</strong> {selectedIssue.citizenPhone}</p>
                    <p style={{ margin: 0 }}><strong>Email:</strong> {selectedIssue.citizenEmail}</p>
                  </div>
                )}

                {/* View Full Details Button */}
                <button
                  type="button"
                  className={styles.btnViewFullDetails}
                  onClick={() => openNotice(
                    `Issue ${selectedIssue.ticketId}`,
                    `${selectedIssue.title} (${selectedIssue.wardFullName}) - ${selectedIssue.description}`,
                    `Assigned to ${selectedIssue.assignedTeamFull}. Status: ${selectedIssue.status}`,
                    selectedIssue.status
                  )}
                >
                  <span>View Full Details</span>
                  <span>→</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* ============================================================
              ALL ISSUES REGISTER (Full-Width Table)
              ============================================================ */}
          <div className={styles.registerCard} id="all-issues-register-section">
            <div className={styles.registerHeaderRow}>
              <div className={styles.registerHeaderLeft}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <h3 className={styles.cardTitle}>
                  All Issues Register ({ALL_ISSUES_SUMMARY.totalIssues.toLocaleString()})
                </h3>
              </div>

              <div className={styles.registerHeaderActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => openNotice('Bulk Actions', 'Dispatch selected issues to municipal field crews or reassign wards in bulk.')}
                >
                  <span>Bulk Actions</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => {
                    showToast('Exporting issue register as CSV...');
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => openNotice('Customize Columns', 'Configure visible table attributes and custom GIS sensor columns.')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Columns</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
              <table className={styles.issuesTable}>
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}>
                      <input
                        type="checkbox"
                        className={styles.tableCheck}
                        onChange={handleSelectAllRows}
                        checked={
                          paginatedIssues.length > 0 &&
                          selectedRowIds.length >= paginatedIssues.length
                        }
                      />
                    </th>
                    <th style={{ width: '32px' }}>#</th>
                    <th>Issue ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Ward</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Team</th>
                    <th>Reported Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIssues.map((issue) => {
                    const isSelected = selectedIssueId === issue.id;
                    const isChecked = selectedRowIds.includes(issue.id);

                    return (
                      <tr
                        key={issue.id}
                        className={isSelected ? styles.rowSelected : ''}
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setDetailsPanelVisible(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.tableCheck}
                            checked={isChecked}
                            onChange={() => handleToggleRow(issue.id)}
                          />
                        </td>
                        <td style={{ color: '#64748b' }}>{issue.index}</td>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{issue.ticketId}</td>
                        <td style={{ color: '#ffffff', fontWeight: 500 }}>{issue.title}</td>
                        <td>
                          <div className={styles.categoryCell}>
                            <span>{getCategoryIcon(issue.category)}</span>
                            <span>{issue.category}</span>
                          </div>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{issue.location}</td>
                        <td>{issue.ward}</td>
                        <td>
                          <span style={{
                            color:
                              issue.priority === 'High'
                                ? '#f87171'
                                : issue.priority === 'Medium'
                                ? '#fbbf24'
                                : '#34d399',
                            fontWeight: 600,
                          }}>
                            ● {issue.priority}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              issue.status === 'Resolved'
                                ? styles.badgeStatusResolved
                                : issue.status === 'Overdue'
                                ? styles.badgeStatusOverdue
                                : issue.status === 'New'
                                ? styles.badgeStatusNew
                                : styles.badgeStatusProgress
                            }
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{issue.assignedTeam}</td>
                        <td style={{ color: '#94a3b8' }}>{issue.reportedDate}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => {
                              setSelectedIssueId(issue.id);
                              setDetailsPanelVisible(true);
                              openNotice(
                                `Issue ${issue.ticketId}`,
                                `${issue.title} — ${issue.location}`,
                                `Status: ${issue.status}. Priority: ${issue.priority}. Assigned to: ${issue.assignedTeamFull}`,
                                issue.status
                              );
                            }}
                          >
                            <span>View</span>
                            <span style={{ fontSize: '12px' }}>&gt;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationRow}>
              <div>
                Showing 1 to {paginatedIssues.length} of {ALL_ISSUES_SUMMARY.totalIssues.toLocaleString()} issues
              </div>

              <div className={styles.paginationRight}>
                <div className={styles.rowsPerPage}>
                  <span>Rows per page:</span>
                  <select
                    className={styles.rowsSelect}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className={styles.pageControls}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </button>
                  <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
                    {currentPage}
                  </button>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(2)}
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(3)}
                  >
                    3
                  </button>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(4)}
                  >
                    4
                  </button>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(5)}
                  >
                    5
                  </button>
                  <span style={{ padding: '0 4px', color: '#64748b' }}>...</span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(250)}
                  >
                    250
                  </button>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, 250))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
