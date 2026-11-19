'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginSuperAdmin, DEFAULT_SUPER_ADMIN, AuthUser } from '../../../lib/auth';
import {
  CITY_KPIS,
  WARD_PERFORMANCE,
  CATEGORIES_BREAKDOWN,
  RESOLUTION_TRENDS,
  RECENT_ACTIVITIES,
  MAP_PINS,
  AdminMapPin,
  TrendDataPoint,
} from '../../../lib/admin';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './admin-dashboard.module.css';

export default function SuperAdminDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && current.role === 'super_admin') {
      return current;
    }
    return DEFAULT_SUPER_ADMIN;
  });

  // UI Dropdowns & Menus
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [trendPeriod, setTrendPeriod] = useState<string>('Last 30 Days');
  const [trendPeriodOpen, setTrendPeriodOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStatusFilter, setMapStatusFilter] = useState<'All' | 'New' | 'In Progress' | 'Overdue' | 'Resolved'>('All');

  // Map Interactive State
  const [activePin, setActivePin] = useState<AdminMapPin | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(1);

  // Hover states for charts
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<TrendDataPoint | null>(null);

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

  // Filtered Map Pins
  const filteredMapPins = useMemo(() => {
    return MAP_PINS.filter((pin) => {
      const matchesStatus = mapStatusFilter === 'All' || pin.status === mapStatusFilter;
      const matchesWard = selectedWard === 'All Wards' || pin.ward === selectedWard.split(' - ')[0];
      const matchesSearch =
        searchQuery === '' ||
        pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesWard && matchesSearch;
    });
  }, [mapStatusFilter, selectedWard, searchQuery]);

  // Filtered Ward Performance Rows
  const filteredWardPerformance = useMemo(() => {
    return WARD_PERFORMANCE.filter((row) => {
      const matchesWard = selectedWard === 'All Wards' || row.shortName === selectedWard.split(' - ')[0];
      const matchesSearch =
        searchQuery === '' ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.shortName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWard && matchesSearch;
    });
  }, [selectedWard, searchQuery]);

  // Resolution Trend Chart Points
  const trendPoints = RESOLUTION_TRENDS[trendPeriod] || RESOLUTION_TRENDS['Last 30 Days'];

  // SVG Line Chart Coordinate Generator
  const chartWidth = 360;
  const chartHeight = 110;
  const paddingX = 24;
  const paddingY = 15;
  const maxVal = 80;

  const getCoordinates = (points: TrendDataPoint[], key: 'received' | 'resolved') => {
    return points.map((p, index) => {
      const x = paddingX + (index * (chartWidth - 2 * paddingX)) / (points.length - 1);
      const y = chartHeight - paddingY - (p[key] / maxVal) * (chartHeight - 2 * paddingY);
      return { x, y, val: p[key], date: p.date };
    });
  };

  const receivedCoords = getCoordinates(trendPoints, 'received');
  const resolvedCoords = getCoordinates(trendPoints, 'resolved');

  const makeSvgPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth cubic bezier
      const prev = coords[idx - 1];
      const cpx1 = prev.x + (curr.x - prev.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) / 2;
      const cpy2 = curr.y;
      return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }, '');
  };

  const receivedPath = makeSvgPath(receivedCoords);
  const resolvedPath = makeSvgPath(resolvedCoords);

  // Donut Chart Segment Calculations
  const donutRadius = 48;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * donutRadius;
  let accumulatedPercent = 0;

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
        {/* Brand Link */}
        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        {/* Section Label */}
        <div className={styles.sidebarSectionLabel}>ADMIN PORTAL</div>

        {/* Sidebar Navigation */}
        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
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

        {/* Sidebar Footer Promo Card */}
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
          MAIN WRAPPER
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <span>{selectedWard}</span>
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
                        setSelectedWard(w);
                        setWardDropdownOpen(false);
                        showToast(`Filtered view to: ${w}`);
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
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
                <span className={styles.notifBadge}>5</span>
              </button>

              {notifDropdownOpen && (
                <div className={styles.dropdownMenu} style={{ width: '280px' }}>
                  <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '700', color: '#f1f5f9' }}>
                    Notifications (5 Unread)
                  </div>
                  <div className={styles.dropdownDivider} />
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Ward 3 Overdue:</strong> 26 issues require escalation
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Emergency Alert:</strong> Water main burst Station Road
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Resolution milestone:</strong> 892 issues resolved this month!
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
                <span className={styles.breadcrumbCurrent}>Overview</span>
              </div>
              <h1 className={styles.bannerTitle}>City Administration Dashboard</h1>
              <p className={styles.bannerSubtitle}>
                Monitor, manage and drive a cleaner, safer and smarter Mira Bhayandar.
              </p>
            </div>

            <div className={styles.bannerContentRight}>
              <div className={styles.bannerSlogan}>
                Smart Governance<br />
                Cleaner City<br />
                Better Tomorrow.
              </div>
              <div className={styles.bannerSloganCurve} />
            </div>
          </div>

          {/* ============================================================
              KPI CARDS ROW (5 Cards)
              ============================================================ */}
          <div className={styles.kpiGrid}>
            {/* Card 1: Total Reports */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.kpiIconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{CITY_KPIS.totalReports.toLocaleString()}</span>
                <span className={styles.kpiLabel}>Total Reports</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{CITY_KPIS.totalReportsGrowth}</span>
                  <span className={styles.trendMuted}>vs last month</span>
                </div>
              </div>
            </div>

            {/* Card 2: Resolved */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.kpiIconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{CITY_KPIS.resolved}</span>
                <span className={styles.kpiLabel}>Resolved</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{CITY_KPIS.resolvedGrowth}</span>
                  <span className={styles.trendMuted}>{CITY_KPIS.resolutionRate} resolution rate</span>
                </div>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.kpiIconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 22h14" />
                  <path d="M5 2h14" />
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{CITY_KPIS.pending}</span>
                <span className={styles.kpiLabel}>Pending</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendRed}>{CITY_KPIS.pendingGrowth}</span>
                  <span className={styles.trendMuted}>{CITY_KPIS.pendingNote}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Overdue */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.kpiIconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{CITY_KPIS.overdue}</span>
                <span className={styles.kpiLabel}>Overdue</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendRed}>{CITY_KPIS.overdueGrowth}</span>
                  <span className={styles.trendMuted}>{CITY_KPIS.overdueNote}</span>
                </div>
              </div>
            </div>

            {/* Card 5: Total Wards */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.kpiIconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{CITY_KPIS.totalWards}</span>
                <span className={styles.kpiLabel}>Total Wards</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendMuted}>{CITY_KPIS.activeTeams} active teams</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              MIDDLE GRID (Map 62% + Analytics 38%)
              ============================================================ */}
          <div className={styles.middleGrid}>
            {/* City-wide Issue Map */}
            <div className={styles.mapCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <h3 className={styles.cardTitle}>City-wide Issue Map</h3>
                </div>
                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() => openNotice('Full City Map View', 'Opening fullscreen GIS city mapping view with ward heatmaps and sensor overlays.')}
                >
                  <span>View Full Map</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className={styles.filterPillsRow}>
                <button
                  type="button"
                  className={`${styles.filterPill} ${mapStatusFilter === 'All' ? styles.filterPillActive : ''}`}
                  onClick={() => setMapStatusFilter('All')}
                >
                  All (1248)
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${mapStatusFilter === 'New' ? styles.filterPillActive : ''}`}
                  onClick={() => setMapStatusFilter('New')}
                >
                  <span className={styles.dotBlue}>●</span>
                  New (212)
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${mapStatusFilter === 'In Progress' ? styles.filterPillActive : ''}`}
                  onClick={() => setMapStatusFilter('In Progress')}
                >
                  <span className={styles.dotAmber}>●</span>
                  In Progress (312)
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${mapStatusFilter === 'Overdue' ? styles.filterPillActive : ''}`}
                  onClick={() => setMapStatusFilter('Overdue')}
                >
                  <span className={styles.dotRed}>●</span>
                  Overdue (144)
                </button>
                <button
                  type="button"
                  className={`${styles.filterPill} ${mapStatusFilter === 'Resolved' ? styles.filterPillActive : ''}`}
                  onClick={() => setMapStatusFilter('Resolved')}
                >
                  <span className={styles.dotGreen}>●</span>
                  Resolved (892)
                </button>
              </div>

              {/* Map Viewport */}
              <div className={styles.mapViewport}>
                <div
                  className={styles.mapBackground}
                  style={{ transform: `scale(${mapZoom})` }}
                />

                {/* SVG Polygons for Ward Boundaries */}
                <svg className={styles.mapSvgOverlay} viewBox="0 0 600 380" preserveAspectRatio="none">
                  {/* Ward 1 Boundary (Cyan/Blue) */}
                  <polygon
                    points="60,90 220,110 240,240 140,290 50,220"
                    className={`${styles.wardBoundary} ${styles.ward1Polygon}`}
                  />
                  {/* Ward 2 Boundary (Amber) */}
                  <polygon
                    points="160,220 280,180 340,320 200,350 140,280"
                    className={`${styles.wardBoundary} ${styles.ward2Polygon}`}
                  />
                  {/* Ward 3 Boundary (Red) */}
                  <polygon
                    points="250,130 420,150 450,280 320,310 270,210"
                    className={`${styles.wardBoundary} ${styles.ward3Polygon}`}
                  />
                  {/* Ward 4 Boundary (Emerald) */}
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
                    setSelectedWard('Ward 1 - Mira Road');
                    showToast('Filtered to Ward 1 - Mira Road');
                  }}
                >
                  <span>Mira Road (Ward 1)</span>
                  <span className={styles.badgeCount}>312</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge2}`}
                  style={{ top: '65%', left: '38%' }}
                  onClick={() => {
                    setSelectedWard('Ward 2 - Bhayandar West');
                    showToast('Filtered to Ward 2 - Bhayandar West');
                  }}
                >
                  <span>Bhayandar West (Ward 2)</span>
                  <span className={styles.badgeCount}>280</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge3}`}
                  style={{ top: '42%', left: '55%' }}
                  onClick={() => {
                    setSelectedWard('Ward 3 - Bhayandar East');
                    showToast('Filtered to Ward 3 - Bhayandar East');
                  }}
                >
                  <span>Bhayandar East (Ward 3)</span>
                  <span className={styles.badgeCount}>356</span>
                </div>

                <div
                  className={`${styles.wardMapBadge} ${styles.wardBadge4}`}
                  style={{ top: '67%', left: '62%' }}
                  onClick={() => {
                    setSelectedWard('Ward 4 - Dahisar Check Naka');
                    showToast('Filtered to Ward 4 - Dahisar Check Naka');
                  }}
                >
                  <span>Dahisar Check Naka (Ward 4)</span>
                  <span className={styles.badgeCount}>300</span>
                </div>

                {/* Render Filtered Pins */}
                {filteredMapPins.map((pin) => {
                  let pinClass = styles.pinResolved;
                  if (pin.status === 'New') pinClass = styles.pinNew;
                  if (pin.status === 'In Progress') pinClass = styles.pinProgress;
                  if (pin.status === 'Overdue') pinClass = styles.pinOverdue;

                  return (
                    <div
                      key={pin.id}
                      className={`${styles.mapPin} ${pinClass}`}
                      style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
                      onClick={() => setActivePin(pin)}
                      title={`${pin.ticketId}: ${pin.title}`}
                    />
                  );
                })}

                {/* Active Pin Tooltip Popup */}
                {activePin && (
                  <div
                    className={styles.mapTooltip}
                    style={{ top: `${activePin.top}%`, left: `${activePin.left}%` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.tooltipTicket}>{activePin.ticketId}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePin(null);
                        }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles.tooltipTitle}>{activePin.title}</div>
                    <div className={styles.tooltipMeta}>
                      <span>{activePin.ward}</span>
                      <span style={{ fontWeight: 600, color: activePin.status === 'Resolved' ? '#10b981' : activePin.status === 'Overdue' ? '#ef4444' : '#f59e0b' }}>
                        {activePin.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Map Controls */}
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

            {/* Right Column: Analytics (Donut + Trend) */}
            <div className={styles.analyticsCol}>
              {/* Issues by Category */}
              <div className={styles.analyticsCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <h3 className={styles.cardTitle}>Issues by Category</h3>
                  </div>
                  <button
                    type="button"
                    className={styles.headerActionBtn}
                    onClick={() => openNotice('Category Breakdown', 'Opening department-wise analytics view.')}
                  >
                    View Details
                  </button>
                </div>

                <div className={styles.donutLayout}>
                  {/* SVG Donut Chart */}
                  <div className={styles.donutSvgWrap}>
                    <svg width="130" height="130" viewBox="0 0 130 130">
                      <g transform="rotate(-90 65 65)">
                        {CATEGORIES_BREAKDOWN.map((cat) => {
                          const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                          const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                          accumulatedPercent += cat.percentage;

                          return (
                            <circle
                              key={cat.category}
                              cx="65"
                              cy="65"
                              r={donutRadius}
                              fill="none"
                              stroke={cat.color}
                              strokeWidth={strokeWidth}
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              style={{
                                cursor: 'pointer',
                                transition: 'stroke-width 0.2s',
                              }}
                              strokeLinecap="butt"
                              onMouseEnter={() => setHoveredCategory(cat.category)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            />
                          );
                        })}
                      </g>
                    </svg>
                    <div className={styles.donutCenterText}>
                      <span className={styles.donutCenterNum}>
                        {hoveredCategory
                          ? CATEGORIES_BREAKDOWN.find((c) => c.category === hoveredCategory)?.count
                          : '1,248'}
                      </span>
                      <span className={styles.donutCenterLabel}>
                        {hoveredCategory || 'Reports'}
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className={styles.categoryLegendList}>
                    {CATEGORIES_BREAKDOWN.map((cat) => (
                      <div
                        key={cat.category}
                        className={styles.categoryLegendItem}
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        style={{ cursor: 'pointer', opacity: hoveredCategory && hoveredCategory !== cat.category ? 0.6 : 1 }}
                      >
                        <div className={styles.categoryLeft}>
                          <span className={styles.categoryIndicator} style={{ backgroundColor: cat.color }} />
                          <span>{cat.category}</span>
                        </div>
                        <span className={styles.categoryCount}>
                          {cat.count} ({cat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolution Trend */}
              <div className={styles.analyticsCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h3 className={styles.cardTitle}>Resolution Trend</h3>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={styles.headerActionBtn}
                      onClick={() => setTrendPeriodOpen(!trendPeriodOpen)}
                    >
                      <span>{trendPeriod}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {trendPeriodOpen && (
                      <div className={styles.dropdownMenu} style={{ minWidth: '140px' }}>
                        {['Last 30 Days', 'Last 7 Days', 'Last 90 Days', 'Year to Date'].map((period) => (
                          <button
                            key={period}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setTrendPeriod(period);
                              setTrendPeriodOpen(false);
                            }}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trend Chart */}
                <div className={styles.trendChartWrap}>
                  <svg className={styles.trendChartSvg} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Horizontal Grid lines */}
                    {[0, 20, 40, 60, 80].map((val) => {
                      const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - 2 * paddingY);
                      return (
                        <g key={val}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeDasharray="2 3"
                          />
                          <text
                            x={paddingX - 6}
                            y={y + 3}
                            fill="#64748b"
                            fontSize="9"
                            textAnchor="end"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Received Line & Area (Cyan) */}
                    <path
                      d={receivedPath}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />

                    {/* Resolved Line & Area (Green) */}
                    <path
                      d={resolvedPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Dots for Received */}
                    {receivedCoords.map((pt, i) => (
                      <circle
                        key={`rec-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#06b6d4"
                        stroke="#080f1d"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Dots for Resolved */}
                    {resolvedCoords.map((pt, i) => (
                      <circle
                        key={`res-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#10b981"
                        stroke="#080f1d"
                        strokeWidth="1.5"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredTrendPoint(trendPoints[i])}
                        onMouseLeave={() => setHoveredTrendPoint(null)}
                      />
                    ))}

                    {/* X-axis labels */}
                    {trendPoints.map((pt, idx) => {
                      const x = paddingX + (idx * (chartWidth - 2 * paddingX)) / (trendPoints.length - 1);
                      return (
                        <text
                          key={pt.date}
                          x={x}
                          y={chartHeight}
                          fill="#64748b"
                          fontSize="9.5"
                          textAnchor="middle"
                        >
                          {pt.date}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Trend Legend */}
                <div className={styles.trendLegendRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span>Resolved</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
                    <span>Received</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              BOTTOM ROW (Ward Performance 62% + Recent Activity 38%)
              ============================================================ */}
          <div className={styles.bottomGrid}>
            {/* Ward Performance Card */}
            <div className={styles.bottomCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h3 className={styles.cardTitle}>Ward Performance</h3>
                </div>

                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() => openNotice('Ward Performance Analytics', 'Detailed ward SLA compliance and engineer scorecard rankings.')}
                >
                  <span>View All</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Table */}
              <div className={styles.tableContainer}>
                <table className={styles.wardTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}>#</th>
                      <th>Ward</th>
                      <th>Total Issues</th>
                      <th>Resolved</th>
                      <th>Pending</th>
                      <th>Overdue</th>
                      <th>Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWardPerformance.map((row) => (
                      <tr key={row.id}>
                        <td style={{ color: '#64748b' }}>{row.id}</td>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{row.name}</td>
                        <td>{row.totalIssues}</td>
                        <td className={styles.tableResolved}>{row.resolved}</td>
                        <td className={styles.tablePending}>{row.pending}</td>
                        <td className={styles.tableOverdue}>{row.overdue}</td>
                        <td>
                          <div className={styles.rateCell}>
                            <div className={styles.progressBarTrack}>
                              <div
                                className={styles.progressBarFill}
                                style={{ width: `${row.resolutionRate}%` }}
                              />
                            </div>
                            <span className={styles.rateText}>{row.resolutionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className={styles.bottomCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h3 className={styles.cardTitle}>Recent Activity</h3>
                </div>

                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() => openNotice('Audit Log Stream', 'Viewing full live municipal system audit event stream.')}
                >
                  <span>View All</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Activity List */}
              <div className={styles.activityList}>
                {RECENT_ACTIVITIES.map((act) => {
                  let circleClass = styles.activityIconGreen;
                  let icon = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  );

                  if (act.type === 'new') {
                    circleClass = styles.activityIconBlue;
                    icon = (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    );
                  } else if (act.type === 'progress') {
                    circleClass = styles.activityIconAmber;
                    icon = (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    );
                  } else if (act.type === 'staff') {
                    circleClass = styles.activityIconPurple;
                    icon = (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    );
                  }

                  return (
                    <div key={act.id} className={styles.activityItem}>
                      <div className={`${styles.activityIconCircle} ${circleClass}`}>
                        {icon}
                      </div>
                      <div className={styles.activityContent}>
                        <h5 className={styles.activityTitle}>{act.title}</h5>
                        <p className={styles.activitySubtitle}>{act.subtitle}</p>
                      </div>
                      <span className={styles.activityTime}>{act.timeAgo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
