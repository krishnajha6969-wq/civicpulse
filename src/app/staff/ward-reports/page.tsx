'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginWardStaff, DEFAULT_WARD_STAFF, AuthUser } from '../../../lib/auth';
import {
  StaffIssue,
  StaffIssueStatus,
  StaffIssueCategory,
  getWardStaffIssues,
  getWardReportsAnalytics,
  WardReportsData,
  HotspotItem,
} from '../../../lib/staff';
import { getWardPerformanceData, WardPerformanceData } from '../../../lib/staff-data';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './ward-reports.module.css';

export default function WardReportsPage() {
  const router = useRouter();

  // ── Authentication ──
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

  // ── Filters ──
  const [activeTab, setActiveTab] = useState<'analytics' | 'performance'>('analytics');
  const [perfTrendPeriod, setPerfTrendPeriod] = useState<'7d' | '30d' | '3m'>('30d');
  const wardPerf = useMemo(() => getWardPerformanceData(), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('view=performance')) {
      setActiveTab('performance');
    }
  }, []);

  const [dateRange, setDateRange] = useState<string>('01 Dec 2024 - 31 Dec 2024');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Chart Option Toggles ──
  const [categoryMetric, setCategoryMetric] = useState<'Count' | 'Resolution Rate'>('Count');
  const [trendPeriod, setTrendPeriod] = useState<'Last 30 Days' | 'Last 14 Days' | 'Last 7 Days'>('Last 30 Days');
  const [mapHotspotFilter, setMapHotspotFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  // ── Map Zoom Level ──
  const [mapZoom, setMapZoom] = useState(1);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);

  // ── Modals & Toast ──
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

  // ── Sync with Auth & Issues ──
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && (usr.role === 'ward_staff' || usr.role === 'super_admin')) {
      setUser(usr);
    } else {
      const demoStaff = loginWardStaff(selectedWard);
      setUser(demoStaff);
    }
  }, [selectedWard]);

  // ── Compute Analytics from lib/staff ──
  const reportsData: WardReportsData = useMemo(() => {
    return getWardReportsAnalytics(selectedWard, {
      dateRange,
      category: categoryFilter,
      team: teamFilter,
    });
  }, [selectedWard, dateRange, categoryFilter, teamFilter]);

  // Filtered hotspots by intensity selector
  const visibleHotspots = useMemo(() => {
    if (mapHotspotFilter === 'All') return reportsData.hotspots;
    return reportsData.hotspots.filter((h) => h.intensity === mapHotspotFilter);
  }, [reportsData.hotspots, mapHotspotFilter]);

  // ── Handle Logout ──
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ── Download Report Handler (Actual functional CSV download) ──
  const handleDownloadReport = () => {
    try {
      const headers = [
        'Report ID,Title,Category,Ward,Status,Priority,Assigned Team,Reported Date,Location',
      ];
      const issues = getWardStaffIssues(selectedWard);
      const rows = issues.map((i) =>
        `"${i.id}","${i.title.replace(/"/g, '""')}","${i.category}","${i.assignedWard}","${i.status}","${i.priority}","${i.assignedTeam || 'Unassigned'}","${i.assignedDate}","${i.location.replace(/"/g, '""')}"`
      );

      const kpiSummary = [
        '',
        '--- WARD PERFORMANCE ANALYTICS SUMMARY ---',
        `Ward,"${selectedWard}"`,
        `Reporting Period,"${dateRange}"`,
        `Category Filter,"${categoryFilter}"`,
        `Team Filter,"${teamFilter}"`,
        `Total Reports,${reportsData.kpis.totalReports}`,
        `Resolved,${reportsData.kpis.resolved}`,
        `Resolution Rate,${reportsData.kpis.resolutionRate}%`,
        `Pending,${reportsData.kpis.pending}`,
        `Overdue,${reportsData.kpis.overdue}`,
        `Active Teams,${reportsData.kpis.activeTeams}`,
        '',
        '--- TEAM PERFORMANCE METRICS ---',
        'Team Name,Department,Assigned,In Progress,Resolved,Overdue,Resolution Rate,Avg Resolution Time',
        ...reportsData.teamPerformance.map(
          (t) =>
            `"${t.teamName}","${t.department}",${t.assigned},${t.inProgress},${t.resolved},${t.overdue},${t.resolutionRate}%,"${t.avgResolutionTime}"`
        ),
      ];

      const csvContent = [...headers, ...rows, ...kpiSummary].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `CivicPulse_${selectedWard.replace(/\s+/g, '_')}_Report_Dec2024.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Report downloaded successfully: ${filename}`);
    } catch {
      showToast('Error generating report. Please try again.');
    }
  };

  // ── Donut Chart calculations (Circumference 301.59, r = 48) ──
  const donutRadius = 48;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~301.59
  let currentDonutOffset = 0;

  const donutSegments = reportsData.statusDistribution.map((item) => {
    const strokeDash = (item.percentage / 100) * donutCircumference;
    const offset = currentDonutOffset;
    currentDonutOffset -= strokeDash;
    return {
      ...item,
      strokeDasharray: `${strokeDash} ${donutCircumference - strokeDash}`,
      strokeDashoffset: offset,
    };
  });

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

        {/* 5. Ward Reports (ACTIVE) */}
        <Link href="/staff/ward-reports" className={`${styles.navItem} ${styles.navItemActive}`}>
          <span className={styles.navActiveIndicator} />
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Ward Reports
        </Link>

        {/* 6. Profile & Settings */}
        <Link
          href="/staff/settings"
          className={styles.navItem}
        >
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          Profile &amp; Settings
        </Link>

        {/* 7. Help & Support */}
        <Link href="/staff/help" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className={styles.promoText}>Insights today for a cleaner tomorrow.</div>
          <div className={styles.promoSubtext}>Monitor. Improve. Serve Mira Bhayandar.</div>
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
              placeholder="Search reports, locations, categories or wards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerRight}>
            {/* Ward Selector Pill */}
            <button
              type="button"
              className={styles.wardPill}
              onClick={() => showToast('Active Jurisdiction: Ward 3 (Mira Bhayandar)')}
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
              onClick={() => showToast('5 active operational alerts in Ward 3')}
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
                <div className={styles.profileAvatar} suppressHydrationWarning>SJ</div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName} suppressHydrationWarning>{user?.name || 'Sandeep Jadhav'}</div>
                  <div className={styles.profileRole}>Ward Staff</div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileDropdown}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push('/staff/settings');
                    }}
                  >
                    Staff Profile &amp; Settings
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

        {/* ── Page Body ── */}
        <main className={styles.pageBody}>
          {/* ============================================================
              1. PAGE BANNER (Matches reference design)
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
                <span className={styles.crumbActive}>Ward Reports</span>
              </div>
              <h1 className={styles.bannerTitle}>Ward Reports</h1>
              <p className={styles.bannerSubtitle}>
                Track performance, analyse trends and identify key areas to build a cleaner Mira Bhayandar.
              </p>
            </div>

            <div className={styles.bannerRightSlogan}>
              <span className={styles.sloganLine}>Data Driven</span>
              <span className={styles.sloganLine}>Cleaner Wards</span>
              <span className={styles.sloganLine}>Better Communities</span>
              <svg className={styles.sloganSmileCurve} viewBox="0 0 90 10" fill="none">
                <path d="M2 2C25 10 65 10 88 2" stroke="#00e599" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ============================================================
              1B. VIEW SWITCHER TABS: ANALYTICS vs WARD PERFORMANCE
              ============================================================ */}
          <div className={styles.tabNavRow}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'analytics' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Reports & Incident Analytics
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'performance' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Ward 3 Performance Dashboard
              <span className={styles.tabBadgeLive}>Live MBMC</span>
            </button>
          </div>

          {/* ============================================================
              VIEW A: WARD PERFORMANCE DASHBOARD (Item #9)
              ============================================================ */}
          {activeTab === 'performance' && (
            <div className={styles.performanceDashboardWrapper}>
              {/* 1. Six Municipal Performance KPIs */}
              <div className={styles.perfKpiGrid}>
                {/* Total Issues */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>Total Issues</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue}>{wardPerf.kpis.totalIssues}</div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↑ +{wardPerf.kpis.totalIssuesChange}%</span> vs previous month
                  </div>
                </div>

                {/* Resolution Rate */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>Resolution Rate</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue}>{wardPerf.kpis.resolutionRate}%</div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↑ +{wardPerf.kpis.resolutionRateChange}%</span> Target: &gt;65%
                  </div>
                </div>

                {/* Avg Resolution Time */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>Avg Resolution Time</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue}>{wardPerf.kpis.avgResolutionDays} <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8' }}>days</span></div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↓ {wardPerf.kpis.avgResolutionChange}d</span> Municipal SLA: 4.0d
                  </div>
                </div>

                {/* SLA Compliance */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>SLA Compliance</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(0, 229, 153, 0.15)', color: '#00e599' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue}>{wardPerf.kpis.slaCompliance}%</div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↑ +{wardPerf.kpis.slaComplianceChange}%</span> Target: &gt;80%
                  </div>
                </div>

                {/* Overdue Issues */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>Overdue Issues</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue} style={{ color: '#ef4444' }}>{wardPerf.kpis.overdueIssues}</div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↓ {wardPerf.kpis.overdueChange}</span> Requires field priority
                  </div>
                </div>

                {/* Citizen Satisfaction */}
                <div className={styles.perfKpiCard}>
                  <div className={styles.perfKpiHeader}>
                    <span className={styles.perfKpiLabel}>Citizen Satisfaction</span>
                    <div className={styles.perfKpiIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.perfKpiValue}>{wardPerf.kpis.citizenSatisfaction} <span style={{ fontSize: 14, fontWeight: 500, color: '#f59e0b' }}>/ 5.0</span></div>
                  <div className={styles.perfKpiSubtext}>
                    <span className={`${styles.perfTrendPill} ${styles.perfTrendUp}`}>↑ +{wardPerf.kpis.satisfactionChange}</span> Based on 92 reviews
                  </div>
                </div>
              </div>

              {/* 2. Performance Trends Over Time */}
              <div className={styles.perfSectionCard}>
                <div className={styles.perfSectionHead}>
                  <div className={styles.perfSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    Performance Trend Over Time
                  </div>
                  <div className={styles.perfPeriodSelector}>
                    <button
                      type="button"
                      className={`${styles.perfPeriodBtn} ${perfTrendPeriod === '7d' ? styles.perfPeriodBtnActive : ''}`}
                      onClick={() => setPerfTrendPeriod('7d')}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      className={`${styles.perfPeriodBtn} ${perfTrendPeriod === '30d' ? styles.perfPeriodBtnActive : ''}`}
                      onClick={() => setPerfTrendPeriod('30d')}
                    >
                      Last 30 Days
                    </button>
                    <button
                      type="button"
                      className={`${styles.perfPeriodBtn} ${perfTrendPeriod === '3m' ? styles.perfPeriodBtnActive : ''}`}
                      onClick={() => setPerfTrendPeriod('3m')}
                    >
                      Last 3 Months
                    </button>
                  </div>
                </div>

                {/* SVG Trend Chart */}
                <div style={{ width: '100%', height: 260, position: 'relative', marginTop: 12 }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e599" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#00e599" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {[40, 90, 140, 190].map((y) => (
                      <line key={y} x1="50" y1={y} x2="780" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    ))}

                    {/* Trend Data Rendering */}
                    {(() => {
                      const trendList = perfTrendPeriod === '7d' ? wardPerf.trends7d : perfTrendPeriod === '30d' ? wardPerf.trends30d : wardPerf.trends3m;
                      const maxVal = Math.max(...trendList.map(t => Math.max(t.received, t.resolved))) || 10;
                      const stepX = (730) / Math.max(1, trendList.length - 1);

                      const ptsReceived = trendList.map((t, idx) => {
                        const x = 50 + idx * stepX;
                        const y = 190 - (t.received / (maxVal * 1.15)) * 150;
                        return `${x},${y}`;
                      });

                      const ptsResolved = trendList.map((t, idx) => {
                        const x = 50 + idx * stepX;
                        const y = 190 - (t.resolved / (maxVal * 1.15)) * 150;
                        return `${x},${y}`;
                      });

                      const areaReceived = `50,190 ${ptsReceived.join(' ')} ${50 + (trendList.length - 1) * stepX},190`;
                      const areaResolved = `50,190 ${ptsResolved.join(' ')} ${50 + (trendList.length - 1) * stepX},190`;

                      return (
                        <g>
                          <polygon points={areaReceived} fill="url(#receivedGradient)" />
                          <polygon points={areaResolved} fill="url(#resolvedGradient)" />

                          <polyline points={ptsReceived.join(' ')} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                          <polyline points={ptsResolved.join(' ')} fill="none" stroke="#00e599" strokeWidth="2.5" />

                          {trendList.map((t, idx) => {
                            const x = 50 + idx * stepX;
                            const yRec = 190 - (t.received / (maxVal * 1.15)) * 150;
                            const yRes = 190 - (t.resolved / (maxVal * 1.15)) * 150;
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={yRec} r="4" fill="#0ea5e9" stroke="#0b1329" strokeWidth="2" />
                                <circle cx={x} cy={yRes} r="4.5" fill="#00e599" stroke="#0b1329" strokeWidth="2" />
                                <text x={x} y="210" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                                  {t.periodLabel}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0ea5e9' }} />
                    <span>Incidents Received</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: '#00e599' }} />
                    <span>Resolved & Verified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
                    <span>SLA Benchmark Met (Target: 80%)</span>
                  </div>
                </div>
              </div>

              {/* 3. Category Performance Matrix */}
              <div className={styles.perfSectionCard}>
                <div className={styles.perfSectionHead}>
                  <div className={styles.perfSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Civic Category Efficiency Matrix
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Benchmark: MBMC Municipal Standard Guidelines</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.perfTable}>
                    <thead>
                      <tr>
                        <th>Civic Category</th>
                        <th style={{ textAlign: 'center' }}>Total Reported</th>
                        <th style={{ textAlign: 'center' }}>Resolved</th>
                        <th>Resolution Rate</th>
                        <th style={{ textAlign: 'center' }}>Avg Turnaround</th>
                        <th style={{ textAlign: 'center' }}>SLA Compliance</th>
                        <th style={{ textAlign: 'right' }}>Efficiency Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wardPerf.categoryPerformance.map((cat) => (
                        <tr key={cat.category}>
                          <td style={{ fontWeight: 600, color: '#ffffff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                              {cat.label}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{cat.total}</td>
                          <td style={{ textAlign: 'center', color: '#00e599', fontWeight: 600 }}>{cat.resolved}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className={styles.progressBarTrack}>
                                <div className={styles.progressBarFill} style={{ width: `${cat.resolutionRate}%`, background: cat.color }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{cat.resolutionRate}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{cat.avgDays} days</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: cat.slaCompliance >= 80 ? '#00e599' : '#f59e0b' }}>
                            {cat.slaCompliance}%
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`${styles.efficiencyScorePill} ${cat.resolutionRate >= 70 ? styles.scoreExcellent : styles.scoreGood}`}>
                              {cat.resolutionRate >= 70 ? 'On Target' : 'Under Review'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Team Performance & Operational Accountability */}
              <div className={styles.perfSectionCard}>
                <div className={styles.perfSectionHead}>
                  <div className={styles.perfSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Ward 3 Field Teams SLA &amp; Accountability Matrix
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Roll-call &amp; telemetry sync active</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.perfTable}>
                    <thead>
                      <tr>
                        <th>Team &amp; Leader</th>
                        <th>Department</th>
                        <th style={{ textAlign: 'center' }}>Assigned</th>
                        <th style={{ textAlign: 'center' }}>Completed</th>
                        <th style={{ textAlign: 'center' }}>Pending</th>
                        <th style={{ textAlign: 'center' }}>SLA Compliance</th>
                        <th style={{ textAlign: 'center' }}>Avg Turnaround</th>
                        <th style={{ textAlign: 'right' }}>Efficiency Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wardPerf.teamPerformance.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{t.teamName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Leader: {t.leader}</div>
                          </td>
                          <td style={{ color: '#94a3b8' }}>{t.department}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.assigned}</td>
                          <td style={{ textAlign: 'center', color: '#00e599', fontWeight: 600 }}>{t.completed}</td>
                          <td style={{ textAlign: 'center', color: t.pending > 3 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{t.pending}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: t.slaCompliance >= 85 ? '#00e599' : '#38bdf8' }}>
                            {t.slaCompliance}%
                          </td>
                          <td style={{ textAlign: 'center' }}>{t.avgResolutionTime}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`${styles.efficiencyScorePill} ${t.efficiencyScore >= 90 ? styles.scoreExcellent : styles.scoreGood}`}>
                              {t.efficiencyScore}% Score
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              VIEW B: REPORT FILTERS, CHARTS & HOTSPOTS (when activeTab === 'analytics')
              ============================================================ */}
          {activeTab === 'analytics' && (
            <>
          {/* ============================================================
              2. REPORT FILTERS & DOWNLOAD TOOLBAR
              ============================================================ */}
          <div className={styles.toolbarRow}>
            <div className={styles.toolbarFilters}>
              {/* Date Range Selector */}
              <div className={styles.filterSelectWrapper}>
                <span className={styles.filterIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={styles.filterSelect}
                  aria-label="Select Date Range"
                >
                  <option value="01 Dec 2024 - 31 Dec 2024">01 Dec 2024 - 31 Dec 2024</option>
                  <option value="Last 7 Days">Last 7 Days (24 Dec - 31 Dec 2024)</option>
                  <option value="Last 14 Days">Last 14 Days (17 Dec - 31 Dec 2024)</option>
                  <option value="Last 30 Days">Last 30 Days (01 Dec - 31 Dec 2024)</option>
                  <option value="Quarter 4 2024">Quarter 4 2024 (01 Oct - 31 Dec 2024)</option>
                </select>
                <span className={styles.selectArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>

              {/* Category Selector */}
              <div className={styles.filterSelectWrapper}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`${styles.filterSelect} ${styles.filterSelectNoIcon}`}
                  aria-label="Select Category"
                >
                  <option value="All">All Categories</option>
                  <option value="roads">Roads</option>
                  <option value="water">Water</option>
                  <option value="waste">Waste</option>
                  <option value="streetlights">Streetlights</option>
                  <option value="drainage">Drainage</option>
                  <option value="parks">Parks</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
                <span className={styles.selectArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>

              {/* Team Selector */}
              <div className={styles.filterSelectWrapper}>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className={`${styles.filterSelect} ${styles.filterSelectNoIcon}`}
                  aria-label="Select Team"
                >
                  <option value="All">All Teams</option>
                  <option value="Team 1">Team 1 (Road Maintenance)</option>
                  <option value="Team 2">Team 2 (Sanitation &amp; Waste)</option>
                  <option value="Team 3">Team 3 (Streetlights)</option>
                  <option value="Team 4">Team 4 (General Maintenance)</option>
                </select>
                <span className={styles.selectArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Download Report Button */}
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadReport}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Report
            </button>
          </div>

          {/* ============================================================
              3. FIVE ALIGNED KPI CARDS (Matching Reference)
              ============================================================ */}
          <div className={styles.kpiRow}>
            {/* 1. Total Reports */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.iconTeal}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiTopLine}>
                  <span className={styles.kpiValue}>{reportsData.kpis.totalReports}</span>
                  <span className={styles.kpiTrendUp}>↑ {reportsData.kpis.totalReportsChange}%</span>
                </div>
                <div className={styles.kpiLabel}>Total Reports</div>
                <div className={styles.kpiContext}>vs previous period</div>
              </div>
            </div>

            {/* 2. Resolved */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.iconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiTopLine}>
                  <span className={styles.kpiValue}>{reportsData.kpis.resolved}</span>
                  <span className={styles.kpiTrendUp}>↑ {reportsData.kpis.resolvedChange}%</span>
                </div>
                <div className={styles.kpiLabel}>Resolved</div>
                <div className={styles.kpiContext}>{reportsData.kpis.resolutionRate}% resolution rate</div>
              </div>
            </div>

            {/* 3. Pending */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 22h14" />
                  <path d="M5 2h14" />
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiTopLine}>
                  <span className={styles.kpiValue}>{reportsData.kpis.pending}</span>
                  <span className={styles.kpiTrendDown}>↓ {Math.abs(reportsData.kpis.pendingChange)}%</span>
                </div>
                <div className={styles.kpiLabel}>Pending</div>
                <div className={styles.kpiContext}>Under review/assigned</div>
              </div>
            </div>

            {/* 4. Overdue */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.iconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiTopLine}>
                  <span className={styles.kpiValue}>{reportsData.kpis.overdue}</span>
                  <span className={styles.kpiTrendDown}>↓ {Math.abs(reportsData.kpis.overdueChange)}%</span>
                </div>
                <div className={styles.kpiLabel}>Overdue</div>
                <div className={styles.kpiContext}>Needs attention</div>
              </div>
            </div>

            {/* 5. Active Teams */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.iconTeamPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiTopLine}>
                  <span className={styles.kpiValue}>{reportsData.kpis.activeTeams}</span>
                </div>
                <div className={styles.kpiLabel}>Active Teams</div>
                <div className={styles.kpiContext}>
                  {reportsData.kpis.fieldTeamsCount} field teams · {reportsData.kpis.supportTeamsCount} support teams
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. THREE-PANEL ANALYTICS ROW
              ============================================================ */}
          <div className={styles.analyticsRow}>
            {/* ── Left: Issue Status Distribution (Donut Chart) ── */}
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </span>
                  <span className={styles.cardTitle}>Issue Status Distribution</span>
                </div>
              </div>

              <div className={styles.donutContainer}>
                {/* SVG Donut */}
                <div className={styles.donutSvgWrapper}>
                  <svg width="140" height="140" viewBox="0 0 120 120">
                    {/* Background Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="16"
                    />

                    {/* Colored Donut Segments */}
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.status}
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        style={{
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                          transition: 'stroke-dasharray 0.5s ease',
                        }}
                      />
                    ))}
                  </svg>

                  {/* Center Label */}
                  <div className={styles.donutCenterLabel}>
                    <span className={styles.donutCenterNumber}>{reportsData.kpis.totalReports}</span>
                    <span className={styles.donutCenterText}>Reports</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className={styles.donutLegend}>
                  {reportsData.statusDistribution.map((item) => (
                    <div key={item.status} className={styles.legendItem}>
                      <div className={styles.legendLeft}>
                        <span className={styles.legendDot} style={{ background: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <span className={styles.legendRight}>
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Centre: Issues by Category (Bar Chart) ── */}
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H4" />
                      <path d="M14 14.66V17c0 .55.45 1 1 1h5" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                    </svg>
                  </span>
                  <span className={styles.cardTitle}>Issues by Category</span>
                </div>

                <select
                  value={categoryMetric}
                  onChange={(e) => setCategoryMetric(e.target.value as 'Count' | 'Resolution Rate')}
                  className={styles.smallSelect}
                  aria-label="Category Chart Metric"
                >
                  <option value="Count">Count</option>
                  <option value="Resolution Rate">Resolution Rate (%)</option>
                </select>
              </div>

              <div className={styles.barChartContainer}>
                <div className={styles.barChartArea}>
                  {/* Guidelines at 40, 30, 20, 10, 0 */}
                  <div className={styles.yAxisGuideLines}>
                    <div className={styles.guideLine}><span className={styles.guideLabel}>40</span></div>
                    <div className={styles.guideLine}><span className={styles.guideLabel}>30</span></div>
                    <div className={styles.guideLine}><span className={styles.guideLabel}>20</span></div>
                    <div className={styles.guideLine}><span className={styles.guideLabel}>10</span></div>
                    <div className={styles.guideLine}><span className={styles.guideLabel}>0</span></div>
                  </div>

                  {/* 8 Category Columns */}
                  {reportsData.categoryReport.map((cat) => {
                    const maxVal = categoryMetric === 'Count' ? 40 : 100;
                    const val = categoryMetric === 'Count' ? cat.count : cat.resolutionRate;
                    const heightPercent = Math.min(100, Math.max(8, (val / maxVal) * 100));

                    return (
                      <div key={cat.category} className={styles.barColumn}>
                        <span className={styles.barValue}>{val}{categoryMetric === 'Resolution Rate' ? '%' : ''}</span>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              height: `${heightPercent}%`,
                              background: `linear-gradient(180deg, ${cat.color} 0%, rgba(${
                                cat.color === '#f59e0b'
                                  ? '245, 158, 11'
                                  : cat.color === '#06b6d4'
                                  ? '6, 182, 212'
                                  : cat.color === '#10b981'
                                  ? '16, 185, 129'
                                  : cat.color === '#a855f7'
                                  ? '168, 85, 247'
                                  : cat.color === '#6366f1'
                                  ? '99, 102, 241'
                                  : cat.color === '#22c55e'
                                  ? '34, 197, 94'
                                  : cat.color === '#f97316'
                                  ? '249, 115, 22'
                                  : '100, 116, 139'
                              }, 0.4) 100%)`,
                            }}
                            title={`${cat.label}: ${val} ${categoryMetric === 'Count' ? 'issues' : '% resolved'}`}
                          />
                        </div>
                        <span className={styles.barLabel}>{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: Resolution Trend (Spline Line Chart) ── */}
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                  </span>
                  <span className={styles.cardTitle}>Resolution Trend</span>
                </div>

                <select
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(e.target.value as any)}
                  className={styles.smallSelect}
                  aria-label="Trend Period"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 14 Days">Last 14 Days</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                </select>
              </div>

              <div className={styles.trendChartContainer}>
                <div className={styles.trendSvgWrapper}>
                  <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e599" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00e599" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Lines (20, 15, 10, 5, 0) */}
                    <line x1="20" y1="15" x2="310" y2="15" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="20" y1="40" x2="310" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="20" y1="65" x2="310" y2="65" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="20" y1="90" x2="310" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="20" y1="110" x2="310" y2="110" stroke="rgba(255,255,255,0.1)" />

                    {/* Y Axis Numbers */}
                    <text x="5" y="18" fill="#475569" fontSize="8">20</text>
                    <text x="5" y="43" fill="#475569" fontSize="8">15</text>
                    <text x="5" y="68" fill="#475569" fontSize="8">10</text>
                    <text x="9" y="93" fill="#475569" fontSize="8">5</text>
                    <text x="9" y="113" fill="#475569" fontSize="8">0</text>

                    {/* Received Trend Line (Cyan) — 5 points: 01 Dec, 07 Dec, 14 Dec, 21 Dec, 28 Dec */}
                    {/* Points approx: (30,70), (100,30), (170,50), (240,20), (300,45) */}
                    <path
                      d="M 30 70 Q 65 30 100 30 T 170 50 T 240 20 T 300 45"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Resolved Trend Line (Mint Green) — (30,90), (100,55), (170,70), (240,45), (300,55) */}
                    <path
                      d="M 30 90 Q 65 55 100 55 T 170 70 T 240 45 T 300 55"
                      fill="none"
                      stroke="#00e599"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Received Nodes */}
                    <circle cx="30" cy="70" r="3.5" fill="#0ea5e9" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="100" cy="30" r="3.5" fill="#0ea5e9" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="170" cy="50" r="3.5" fill="#0ea5e9" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="240" cy="20" r="3.5" fill="#0ea5e9" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="300" cy="45" r="3.5" fill="#0ea5e9" stroke="#070c18" strokeWidth="1.5" />

                    {/* Resolved Nodes */}
                    <circle cx="30" cy="90" r="3.5" fill="#00e599" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="100" cy="55" r="3.5" fill="#00e599" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="170" cy="70" r="3.5" fill="#00e599" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="240" cy="45" r="3.5" fill="#00e599" stroke="#070c18" strokeWidth="1.5" />
                    <circle cx="300" cy="55" r="3.5" fill="#00e599" stroke="#070c18" strokeWidth="1.5" />

                    {/* Dates on X Axis */}
                    <text x="20" y="118" fill="#64748b" fontSize="8.5">01 Dec</text>
                    <text x="88" y="118" fill="#64748b" fontSize="8.5">07 Dec</text>
                    <text x="158" y="118" fill="#64748b" fontSize="8.5">14 Dec</text>
                    <text x="228" y="118" fill="#64748b" fontSize="8.5">21 Dec</text>
                    <text x="288" y="118" fill="#64748b" fontSize="8.5">28 Dec</text>
                  </svg>
                </div>

                {/* Trend Legend */}
                <div className={styles.trendLegend}>
                  <div className={styles.trendLegendItem}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e599' }} />
                    <span>Resolved</span>
                  </div>
                  <div className={styles.trendLegendItem}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9' }} />
                    <span>Received</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              5. MIDDLE ROW: WARD MAP HOTSPOTS (65%) + TOP 5 LOCATIONS (35%)
              ============================================================ */}
          <div className={styles.middleRow}>
            {/* ── Left: Ward Map - Issue Hotspots ── */}
            <div className={styles.mapCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                  </span>
                  <span className={styles.cardTitle}>Ward Map - Issue Hotspots</span>
                </div>

                <select
                  value={mapHotspotFilter}
                  onChange={(e) => setMapHotspotFilter(e.target.value as any)}
                  className={styles.smallSelect}
                  aria-label="Filter Hotspots by Priority"
                >
                  <option value="All">All Issues</option>
                  <option value="High">High Priority Only</option>
                  <option value="Medium">Medium Priority Only</option>
                  <option value="Low">Low Priority Only</option>
                </select>
              </div>

              {/* Map Container */}
              <div className={styles.mapViewport}>
                <Image
                  src="/images/dashboard/mira-bhayandar-map.png"
                  alt="Ward Map Issue Hotspots of Mira Bhayandar Ward 3"
                  fill
                  className={styles.mapImage}
                  sizes="(max-width: 1200px) 100vw, 800px"
                  style={{
                    transform: `scale(${mapZoom})`,
                    transition: 'transform 0.25s ease',
                  }}
                />

                {/* Map Zoom Controls */}
                <div className={styles.mapControls}>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.min(1.6, z + 0.2))}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.max(1, z - 0.2))}
                    title="Zoom out"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom(1)}
                    title="Recenter"
                  >
                    ⌖
                  </button>
                </div>

                {/* Hotspot Nodes with Pulsing Glow and Labels */}
                {visibleHotspots.map((h) => (
                  <div
                    key={h.id}
                    className={styles.hotspotNode}
                    style={{
                      top: `${h.top}%`,
                      left: `${h.left}%`,
                    }}
                    onClick={() => {
                      setSelectedHotspot(h);
                      showToast(`Cluster: ${h.name} (${h.intensity} Priority: ${h.count} active reports)`);
                    }}
                    title={`${h.name} (${h.intensity}: ${h.count} reports)`}
                  >
                    <div
                      className={styles.hotspotGlow}
                      style={{
                        width: h.radius * 2,
                        height: h.radius * 2,
                        background: `radial-gradient(circle, ${h.color} 0%, rgba(${
                          h.color === '#ef4444' ? '239, 68, 68' : h.color === '#f97316' ? '249, 115, 22' : '234, 179, 8'
                        }, 0.2) 70%, transparent 100%)`,
                      }}
                    />
                    <div
                      className={styles.hotspotCore}
                      style={{ background: h.color }}
                    />
                    <div className={styles.hotspotLabel}>{h.name}</div>
                  </div>
                ))}
              </div>

              {/* Map Bottom Legend */}
              <div className={styles.mapBottomLegend}>
                <div className={styles.mapLegendItem}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  <span>High (8)</span>
                </div>
                <div className={styles.mapLegendItem}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                  <span>Medium (12)</span>
                </div>
                <div className={styles.mapLegendItem}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
                  <span>Low (6)</span>
                </div>
              </div>
            </div>

            {/* ── Right: Top 5 Problem Locations ── */}
            <div className={styles.problemLocationsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className={styles.cardTitle}>Top 5 Problem Locations</span>
                </div>

                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => router.push('/staff/issues')}
                >
                  View All Issues
                </button>
              </div>

              {/* Top 5 Locations List */}
              <div className={styles.locationsList}>
                {reportsData.problemLocations.map((loc) => (
                  <div
                    key={loc.rank}
                    className={styles.locationRow}
                    onClick={() => {
                      showToast(`Filtered by location: ${loc.name}`);
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Click to focus on ${loc.name}`}
                  >
                    <span className={styles.locationRank}>{loc.rank}</span>
                    <span className={styles.locationName}>{loc.name}</span>
                    <span className={styles.locationCount}>{loc.count}</span>
                    <div className={styles.locationBarTrack}>
                      <div
                        className={styles.locationBarFill}
                        style={{
                          width: `${loc.percentage}%`,
                          background: loc.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================
              6. TEAM PERFORMANCE TABLE (Bottom Full-Width Panel)
              ============================================================ */}
          <div className={styles.tableCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className={styles.cardTitle}>Team Performance</span>
              </div>

              <button
                type="button"
                className={styles.viewAllLink}
                onClick={() => setActiveTab('performance')}
              >
                View Full Performance Matrix
              </button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.perfTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Team Name</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Assigned</th>
                    <th style={{ textAlign: 'center' }}>In Progress</th>
                    <th style={{ textAlign: 'center' }}>Resolved</th>
                    <th style={{ textAlign: 'center' }}>Overdue</th>
                    <th style={{ width: 140 }}>Resolution Rate</th>
                    <th>Avg. Resolution Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.teamPerformance.map((team, idx) => (
                    <tr key={team.id}>
                      <td style={{ color: '#64748b' }}>{idx + 1}</td>
                      <td className={styles.teamNameCell}>{team.teamName}</td>
                      <td className={styles.deptCell}>{team.department}</td>
                      <td className={styles.metricCell} style={{ textAlign: 'center' }}>
                        {team.assigned}
                      </td>
                      <td className={styles.metricCell} style={{ textAlign: 'center' }}>
                        {team.inProgress}
                      </td>
                      <td className={styles.metricCell} style={{ textAlign: 'center' }}>
                        {team.resolved}
                      </td>
                      <td className={styles.overdueCell} style={{ textAlign: 'center' }}>
                        {team.overdue}
                      </td>
                      <td>
                        <div className={styles.rateWrapper} title={`Formula: (Resolved / Assigned) × 100`}>
                          <div className={styles.rateTrack}>
                            <div
                              className={styles.rateFill}
                              style={{ width: `${team.resolutionRate}%` }}
                            />
                          </div>
                          <span className={styles.rateText}>{team.resolutionRate}%</span>
                        </div>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>{team.avgResolutionTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </main>
      </div>

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
