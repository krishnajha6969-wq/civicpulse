'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginSuperAdmin, DEFAULT_SUPER_ADMIN, AuthUser } from '../../../lib/auth';
import {
  CITY_ANALYTICS_KPIS,
  VOLUME_TREND_SERIES,
  CATEGORIES_BREAKDOWN,
  STATUS_DISTRIBUTION,
  WARD_PERFORMANCE_COMPARISON,
  AI_PRIORITY_FEATURED,
  TOP_AI_PRIORITY_ISSUES,
  RESOURCE_ALLOCATION_RECOMMENDATIONS,
  HOTSPOT_DATA,
  KEY_CITY_INSIGHTS,
  VolumeTrendPoint,
  CategoryBreakdown,
  StatusDistributionItem,
  WardPerformanceRowData,
  HotspotData,
} from '../../../lib/admin';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './admin-analytics.module.css';

export default function CityAnalyticsPage() {
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
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const [trendDropdownOpen, setTrendDropdownOpen] = useState(false);

  // Active View Tab Navigation
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'ward' | 'hotspots' | 'trends' | 'ai'>('overview');

  // Filter Bar State
  const [selectedGlobalWard, setSelectedGlobalWard] = useState<string>('All Wards');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('01 Dec 2024 – 31 Dec 2024');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('All Wards');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All Categories');
  const [trendTimeRange, setTrendTimeRange] = useState<string>('Last 30 Days');
  const [hotspotCategory, setHotspotCategory] = useState<string>('All Categories');

  // Interactive Hover States
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [hoveredVolumeBar, setHoveredVolumeBar] = useState<VolumeTrendPoint | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<HotspotData | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(1);

  // Section references for smooth scrolling from navigation tabs
  const wardSectionRef = useRef<HTMLDivElement>(null);
  const hotspotSectionRef = useRef<HTMLDivElement>(null);
  const trendSectionRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);

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

  // Toast notifications
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

  // Tab switcher with smooth scrolling to sections
  const handleTabChange = (tab: 'overview' | 'ward' | 'hotspots' | 'trends' | 'ai') => {
    setActiveViewTab(tab);
    if (tab === 'ward' && wardSectionRef.current) {
      wardSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'hotspots' && hotspotSectionRef.current) {
      hotspotSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'trends' && trendSectionRef.current) {
      trendSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'ai' && aiSectionRef.current) {
      aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filtered Ward Performance Table
  const filteredWardRows = useMemo(() => {
    return WARD_PERFORMANCE_COMPARISON.filter((row) => {
      if (selectedWardFilter === 'All Wards') return true;
      return row.ward === selectedWardFilter;
    });
  }, [selectedWardFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (selectedCategoryFilter === 'All Categories') return CATEGORIES_BREAKDOWN;
    return CATEGORIES_BREAKDOWN.filter((c) =>
      c.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase())
    );
  }, [selectedCategoryFilter]);

  // Filtered Hotspot Areas
  const filteredHotspots = useMemo(() => {
    return HOTSPOT_DATA.filter((hs) => {
      const matchesWard = selectedWardFilter === 'All Wards' || hs.ward === selectedWardFilter;
      const matchesCategory =
        hotspotCategory === 'All Categories' ||
        hs.primaryCategory.toLowerCase().includes(hotspotCategory.toLowerCase());
      return matchesWard && matchesCategory;
    });
  }, [selectedWardFilter, hotspotCategory]);

  // Dynamic KPI counts reacting to filters
  const dynamicKPIs = useMemo(() => {
    if (selectedWardFilter !== 'All Wards') {
      const wardRow = WARD_PERFORMANCE_COMPARISON.find((w) => w.ward === selectedWardFilter);
      if (wardRow) {
        return {
          totalReports: wardRow.totalIssues,
          resolutionRate: `${wardRow.resolutionRate}%`,
          avgResolutionTime: wardRow.avgResolution,
          overdueIssues: wardRow.overdue,
        };
      }
    }
    return {
      totalReports: CITY_ANALYTICS_KPIS.totalReports,
      resolutionRate: CITY_ANALYTICS_KPIS.resolutionRate,
      avgResolutionTime: CITY_ANALYTICS_KPIS.avgResolutionTime,
      overdueIssues: CITY_ANALYTICS_KPIS.overdueIssues,
    };
  }, [selectedWardFilter]);

  // Volume Trend Series data
  const volumeData = VOLUME_TREND_SERIES[trendTimeRange] || VOLUME_TREND_SERIES['Last 30 Days'];

  // Volume SVG Chart Coordinate Generator
  const vChartWidth = 380;
  const vChartHeight = 150;
  const vPaddingX = 28;
  const vPaddingY = 20;
  const vMaxVal = trendTimeRange === 'This Year' ? 1400 : 100;

  // Donut Segment Geometry (Radius 46, Circumference ~289)
  const donutRadius = 46;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * donutRadius;

  // Real CSV Export Action
  const handleExport = () => {
    showToast('Generating Municipal Analytics CSV Report...');

    // Generate CSV Content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'CivicPulse City Analytics & AI Prioritisation Report\n';
    csvContent += `Generated Date: ${new Date().toLocaleDateString('en-GB')},Period: ${selectedDateRange}\n\n`;

    csvContent += '--- MUNICIPAL KPIS ---\n';
    csvContent += `Total Reports,${dynamicKPIs.totalReports},Resolution Rate,${dynamicKPIs.resolutionRate},Avg Resolution Time,${dynamicKPIs.avgResolutionTime},Overdue Issues,${dynamicKPIs.overdueIssues}\n\n`;

    csvContent += '--- WARD PERFORMANCE COMPARISON ---\n';
    csvContent += 'Ward,Total Issues,Resolved,Resolution Rate,Avg. Resolution,Overdue,Performance\n';
    WARD_PERFORMANCE_COMPARISON.forEach((w) => {
      csvContent += `${w.ward},${w.totalIssues},${w.resolved},${w.resolutionRate}%,${w.avgResolution},${w.overdue},${w.performance}\n`;
    });

    csvContent += '\n--- ISSUES BY CATEGORY ---\n';
    csvContent += 'Category,Count,Percentage\n';
    CATEGORIES_BREAKDOWN.forEach((c) => {
      csvContent += `${c.category},${c.count},${c.percentage}%\n`;
    });

    csvContent += '\n--- RESOLUTION STATUS DISTRIBUTION ---\n';
    csvContent += 'Status,Count,Percentage\n';
    STATUS_DISTRIBUTION.forEach((s) => {
      csvContent += `${s.status},${s.count},${s.percentage}%\n`;
    });

    csvContent += '\n--- AI-ASSISTED ISSUE PRIORITISATION ---\n';
    csvContent += 'Rank,Issue,Ward,Priority,Score,Suggested Action\n';
    TOP_AI_PRIORITY_ISSUES.forEach((i) => {
      csvContent += `${i.rank},"${i.issue}",${i.ward},${i.priority},${i.priorityScore},"${i.suggestedAction}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'civicpulse-city-analytics-dec2024.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    openNotice(
      'Export Analytics Dataset',
      'The comprehensive municipal analytics report has been downloaded to your system as civicpulse-city-analytics-dec2024.csv.',
      'Includes ward telemetry, SLA performance, category distribution, and AI urgency queues for ' + selectedDateRange,
      'Export Successful'
    );
  };

  // Helper for circular progress ring (AI score indicator)
  const renderScoreRing = (score: number, color: string) => {
    const ringRadius = 22;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const offset = ringCircumference - (score / 100) * ringCircumference;

    return (
      <div className={styles.scoreRingWrap}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={ringRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r={ringRadius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={ringCircumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
        </svg>
        <div className={styles.scoreRingText}>
          <span className={styles.scoreNum} style={{ color }}>{score}</span>
          <span className={styles.scoreOutOf}>/ 100</span>
        </div>
      </div>
    );
  };

  let accCatPercent = 0;
  let accStatPercent = 0;

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
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
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
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
          SIDEBAR (Existing CivicPulse Admin Navigation)
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

          {/* City Analytics (ACTIVE) */}
          <Link href="/admin/analytics" className={`${styles.navItem} ${styles.navItemActive}`}>
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
            />
          </div>

          <div className={styles.headerActions}>
            {/* Ward Selector Dropdown */}
            <div style={{ position: 'relative' }}>
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
                  {['All Wards', 'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedGlobalWard(w);
                        setSelectedWardFilter(w);
                        setWardDropdownOpen(false);
                        showToast(`Filtered municipal view to: ${w}`);
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell (Badge 8) */}
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
                    <strong>Critical AI Alert:</strong> CP-10421 road damage flagged score 94
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <strong>Ward 3 Telemetry:</strong> Resolution rate reached 77% (Excellent)
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
            <div style={{ position: 'relative' }}>
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
              PAGE HEADER (Breadcrumb, Title, Subtitle, Date, Export)
              ============================================================ */}
          <div className={styles.cityBanner}>
            <div className={styles.cityBannerBg} />
            <div className={styles.cityBannerOverlay} />

            <div className={styles.bannerContentLeft}>
              <div className={styles.breadcrumb}>
                <span>Dashboard</span>
                <span>&gt;</span>
                <span className={styles.breadcrumbCurrent}>City Analytics</span>
              </div>
              <h1 className={styles.bannerTitle}>City Analytics & AI Prioritisation</h1>
              <p className={styles.bannerSubtitle}>
                Understand citywide issue trends, compare ward performance, and identify which civic problems need attention first.
              </p>
            </div>

            <div className={styles.bannerContentRight}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Date Range Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={styles.filterBox}
                    onClick={() => setDateRangeDropdownOpen(!dateRangeDropdownOpen)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{selectedDateRange}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {dateRangeDropdownOpen && (
                    <div className={styles.dropdownMenu} style={{ minWidth: '240px' }}>
                      {[
                        '01 Dec 2024 – 31 Dec 2024',
                        '01 Nov 2024 – 30 Nov 2024',
                        '01 Oct 2024 – 31 Dec 2024',
                        '01 Jan 2024 – 31 Dec 2024',
                      ].map((range) => (
                        <button
                          key={range}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSelectedDateRange(range);
                            setDateRangeDropdownOpen(false);
                            showToast(`Updated calendar window: ${range}`);
                          }}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export Analytics Action Button */}
                <button
                  type="button"
                  className={styles.btnExport}
                  onClick={handleExport}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export Analytics</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================
              NAVIGATION TABS PILLS (Overview, Ward, Hotspots, Trends, AI)
              ============================================================ */}
          <div className={styles.navTabsBar}>
            <button
              type="button"
              className={`${styles.navTabPill} ${activeViewTab === 'overview' ? styles.navTabPillActive : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`${styles.navTabPill} ${activeViewTab === 'ward' ? styles.navTabPillActive : ''}`}
              onClick={() => handleTabChange('ward')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Ward Analysis</span>
            </button>

            <button
              type="button"
              className={`${styles.navTabPill} ${activeViewTab === 'hotspots' ? styles.navTabPillActive : ''}`}
              onClick={() => handleTabChange('hotspots')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              <span>Issue Hotspots</span>
            </button>

            <button
              type="button"
              className={`${styles.navTabPill} ${activeViewTab === 'trends' ? styles.navTabPillActive : ''}`}
              onClick={() => handleTabChange('trends')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Trend Analysis</span>
            </button>

            <button
              type="button"
              className={`${styles.navTabPill} ${activeViewTab === 'ai' ? styles.navTabPillActive : ''}`}
              onClick={() => handleTabChange('ai')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>AI Prioritization</span>
            </button>
          </div>

          {/* ============================================================
              FILTER BAR (Ward filter, Category filter, Date range control)
              ============================================================ */}
          <div className={styles.filterBar}>
            <div className={styles.filterControlsLeft}>
              {/* Ward Filter */}
              <div className={styles.filterItem}>
                <span className={styles.filterLabel}>Ward:</span>
                <select
                  className={styles.filterSelectBox}
                  value={selectedWardFilter}
                  onChange={(e) => {
                    setSelectedWardFilter(e.target.value);
                    setSelectedGlobalWard(e.target.value);
                    showToast(`Filtered ward view: ${e.target.value}`);
                  }}
                >
                  <option value="All Wards">All Wards</option>
                  <option value="Ward 1">Ward 1</option>
                  <option value="Ward 2">Ward 2</option>
                  <option value="Ward 3">Ward 3</option>
                  <option value="Ward 4">Ward 4</option>
                  <option value="Ward 5">Ward 5</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className={styles.filterItem}>
                <span className={styles.filterLabel}>Category:</span>
                <select
                  className={styles.filterSelectBox}
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    showToast(`Filtered category: ${e.target.value}`);
                  }}
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Roads">Roads</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Streetlights">Streetlights</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Active Filter Indicators */}
              {(selectedWardFilter !== 'All Wards' || selectedCategoryFilter !== 'All Categories') && (
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: '1px dashed #64748b',
                    color: '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedWardFilter('All Wards');
                    setSelectedGlobalWard('All Wards');
                    setSelectedCategoryFilter('All Categories');
                    showToast('Cleared all active filters');
                  }}
                >
                  Clear Filters ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing records for <strong>Mira Bhayandar Municipal Corporation</strong>
              </span>
            </div>
          </div>

          {/* ============================================================
              KPI SECTION (Four Large KPI Cards)
              ============================================================ */}
          <div className={styles.kpiGrid}>
            {/* CARD 1: Total Reports */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{dynamicKPIs.totalReports.toLocaleString()}</span>
                <span className={styles.kpiLabel}>Total Reports</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>+12%</span>
                  <span className={styles.trendMuted}>vs previous month</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Resolution Rate */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{dynamicKPIs.resolutionRate}</span>
                <span className={styles.kpiLabel}>Resolution Rate</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>+8%</span>
                  <span className={styles.trendMuted}>vs previous month</span>
                </div>
              </div>
            </div>

            {/* CARD 3: Avg. Resolution Time */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{dynamicKPIs.avgResolutionTime}</span>
                <span className={styles.kpiLabel}>Avg. Resolution Time</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>−18%</span>
                  <span className={styles.trendMuted}>vs previous month</span>
                </div>
              </div>
            </div>

            {/* CARD 4: Overdue Issues */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{dynamicKPIs.overdueIssues}</span>
                <span className={styles.kpiLabel}>Overdue Issues</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>−5%</span>
                  <span className={styles.trendMuted}>vs previous month</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              ANALYTICS GRID ROW 1: (Geo Hotspot Map + Category Donut + Ward Performance)
              ============================================================ */}
          <div className={styles.chartsGrid}>
            {/* Panel 1: Civic Issue Hotspots Map */}
            <div className={styles.chartCard} ref={hotspotSectionRef}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <h3 className={styles.cardTitle}>Geo Issue Map – Hotspots</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    className={styles.filterSelectBox}
                    style={{ height: '28px', fontSize: '11px', padding: '0 22px 0 8px' }}
                    value={hotspotCategory}
                    onChange={(e) => setHotspotCategory(e.target.value)}
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Roads">Roads</option>
                    <option value="Waste Management">Waste</option>
                    <option value="Streetlights">Streetlights</option>
                    <option value="Drainage">Drainage</option>
                  </select>

                  <button
                    type="button"
                    className={styles.headerActionBtn}
                    style={{ padding: '4px 6px' }}
                    onClick={() => setMapZoom((prev) => (prev >= 1.4 ? 1 : prev + 0.2))}
                    title="Zoom in map"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.headerActionBtn}
                    style={{ padding: '4px 6px' }}
                    onClick={() => setMapZoom(1)}
                    title="Reset zoom"
                  >
                    -
                  </button>
                </div>
              </div>

              {/* Map Viewport */}
              <div className={styles.hotspotViewport}>
                <div
                  className={styles.hotspotBackground}
                  style={{
                    transform: `scale(${mapZoom})`,
                    transition: 'transform 0.3s ease',
                  }}
                />

                {/* SVG glowing heatmap clusters */}
                <svg className={styles.hotspotSvgOverlay} viewBox="0 0 400 240" preserveAspectRatio="none">
                  <defs>
                    <radialGradient id="heatRedGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                      <stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="heatOrangeGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="heatAmberGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#eab308" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="heatTealGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.7" />
                      <stop offset="60%" stopColor="#14b8a6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Ward Boundaries */}
                  <polygon points="40,50 160,60 170,150 90,180 30,130" stroke="#38bdf8" strokeWidth="1.5" fill="#38bdf8" fillOpacity="0.06" strokeDasharray="3 3" />
                  <polygon points="170,60 300,70 330,160 210,180 170,150" stroke="#f97316" strokeWidth="1.5" fill="#f97316" fillOpacity="0.06" strokeDasharray="3 3" />
                  <polygon points="90,180 210,180 230,230 110,235" stroke="#ef4444" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.08" strokeDasharray="3 3" />

                  {/* Mira Road High Density Red Core */}
                  <circle cx="150" cy="190" r="46" fill="url(#heatRedGrad)" />
                  <circle cx="150" cy="190" r="14" fill="#ef4444" fillOpacity="0.8" />

                  {/* Bhayandar West Orange Cluster */}
                  <circle cx="100" cy="110" r="36" fill="url(#heatOrangeGrad)" />
                  <circle cx="100" cy="110" r="10" fill="#f97316" fillOpacity="0.8" />

                  {/* Bhayandar East Amber Cluster */}
                  <circle cx="240" cy="100" r="32" fill="url(#heatAmberGrad)" />
                  <circle cx="240" cy="100" r="9" fill="#eab308" fillOpacity="0.75" />

                  {/* Mira Road East Cluster */}
                  <circle cx="270" cy="155" r="30" fill="url(#heatTealGrad)" />
                  <circle cx="270" cy="155" r="8" fill="#14b8a6" fillOpacity="0.75" />
                </svg>

                {/* Ward Labels */}
                <div
                  className={styles.hotspotBadge}
                  style={{ top: '78%', left: '38%', background: 'rgba(239,68,68,0.9)', border: '1px solid #ef4444', cursor: 'pointer' }}
                  onClick={() => openNotice('Mira Road Hotspot', '58 active civic reports (38% roads, 24% drainage). High priority remediation queue active.', 'Ward 1 - Mira Road', 'Critical Density')}
                >
                  <span>Mira Road (58)</span>
                </div>

                <div
                  className={styles.hotspotBadge}
                  style={{ top: '45%', left: '26%', background: 'rgba(249,115,22,0.9)', border: '1px solid #f97316', cursor: 'pointer' }}
                  onClick={() => openNotice('Bhayandar West Hotspot', '38 active issues reported near suburban railway station corridor.', 'Ward 2', 'High Density')}
                >
                  <span>Bhayandar West</span>
                </div>

                <div
                  className={styles.hotspotBadge}
                  style={{ top: '42%', left: '68%', background: 'rgba(234,179,8,0.9)', border: '1px solid #eab308', color: '#0f172a', cursor: 'pointer' }}
                  onClick={() => openNotice('Bhayandar East Hotspot', '26 active issues primarily related to stormwater drainage culverts.', 'Ward 3', 'Medium Density')}
                >
                  <span>Bhayandar East</span>
                </div>

                <div
                  className={styles.hotspotBadge}
                  style={{ top: '65%', left: '72%', background: 'rgba(20,184,166,0.9)', border: '1px solid #14b8a6', cursor: 'pointer' }}
                  onClick={() => openNotice('Mira Road East Hotspot', '42 active issues. Electrical pole replacement program in progress.', 'Ward 1 / 4', 'Normal / Low')}
                >
                  <span>Mira Road East</span>
                </div>

                {/* Legend */}
                <div className={styles.hotspotLegend}>
                  <div className={styles.hotspotLegendRow}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span>High (50+)</span>
                  </div>
                  <div className={styles.hotspotLegendRow}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
                    <span>Medium (20–50)</span>
                  </div>
                  <div className={styles.hotspotLegendRow}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14b8a6' }} />
                    <span>Low (&lt;20)</span>
                  </div>
                </div>

                <div className={styles.scaleTag}>Mira Bhayandar • 2 km</div>
              </div>
            </div>

            {/* Panel 2: Issues by Category Donut */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="2" x2="12" y2="12" />
                    <line x1="12" y1="12" x2="19.07" y2="15.5" />
                  </svg>
                  <h3 className={styles.cardTitle}>Issues by Category</h3>
                </div>
                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() =>
                    openNotice(
                      'Issues by Category Details',
                      'Detailed breakdown of municipal work tickets across all wards: Roads represent the highest share (25%, 312 reports), followed by Waste Management (22%, 280 reports).',
                      'Total Reports: 1,248',
                      'Category Analytics'
                    )
                  }
                >
                  View Details
                </button>
              </div>

              <div className={styles.donutLayout}>
                {/* SVG Donut */}
                <div className={styles.donutSvgWrap}>
                  <svg width="116" height="116" viewBox="0 0 116 116">
                    <g transform="rotate(-90 58 58)">
                      {CATEGORIES_BREAKDOWN.map((cat) => {
                        const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((accCatPercent / 100) * circumference);
                        accCatPercent += cat.percentage;

                        return (
                          <circle
                            key={cat.category}
                            cx="58"
                            cy="58"
                            r={donutRadius}
                            fill="none"
                            stroke={cat.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
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
                    <span className={styles.donutCenterLabel}>Reports</span>
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
                      style={{
                        cursor: 'pointer',
                        opacity: hoveredCategory && hoveredCategory !== cat.category ? 0.5 : 1,
                        padding: '2px 0',
                      }}
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

            {/* Panel 3: Ward Performance Comparison Overview */}
            <div className={styles.chartCard} ref={wardSectionRef}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  onClick={() => {
                    handleTabChange('ward');
                  }}
                >
                  <span>View All →</span>
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.wardTable}>
                  <thead>
                    <tr>
                      <th>Ward</th>
                      <th>Reports</th>
                      <th>Resolved</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WARD_PERFORMANCE_COMPARISON.map((w) => {
                      let badgeStyle = styles.badgeGood;
                      if (w.performance === 'Excellent') badgeStyle = styles.badgeExcellent;
                      if (w.performance === 'Needs Attention') badgeStyle = styles.badgeAttention;

                      return (
                        <tr key={w.ward}>
                          <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{w.ward}</td>
                          <td>{w.totalIssues}</td>
                          <td>{w.resolved}</td>
                          <td>
                            <span className={badgeStyle}>{w.resolutionRate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================
              ANALYTICS GRID ROW 2: (Issue Volume Trend + AI Priority Issues Top 5 + Resolution Status Donut)
              ============================================================ */}
          <div className={styles.chartsGrid} ref={trendSectionRef}>
            {/* Panel 1: Issue Volume Trend (Line + Bar Combination) */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <h3 className={styles.cardTitle}>Issue Volume Trend</h3>
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={styles.headerActionBtn}
                    onClick={() => setTrendDropdownOpen(!trendDropdownOpen)}
                  >
                    <span>{trendTimeRange}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {trendDropdownOpen && (
                    <div className={styles.dropdownMenu} style={{ minWidth: '130px' }}>
                      {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setTrendTimeRange(t);
                            setTrendDropdownOpen(false);
                            showToast(`Updated trend window to: ${t}`);
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mixed Chart: Blue Bars for Received + Cyan Line with Points for Resolved */}
              <div className={styles.volumeChartWrap}>
                <svg className={styles.volumeChartSvg} viewBox={`0 0 ${vChartWidth} ${vChartHeight}`}>
                  {/* Subtle Grid Lines */}
                  {[0, 20, 40, 60, 80, 100].map((val) => {
                    const y = vChartHeight - vPaddingY - (val / 100) * (vChartHeight - 2 * vPaddingY);
                    return (
                      <g key={val}>
                        <line
                          x1={vPaddingX}
                          y1={y}
                          x2={vChartWidth - vPaddingX}
                          y2={y}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="2 3"
                        />
                        <text
                          x={vPaddingX - 6}
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

                  {/* Vertical Blue Bars for Volume Received */}
                  {volumeData.map((pt, idx) => {
                    const x = vPaddingX + (idx * (vChartWidth - 2 * vPaddingX)) / (volumeData.length - 1);
                    const barWidth = 10;
                    const valClamped = Math.min(pt.received, vMaxVal);
                    const barHeight = (valClamped / vMaxVal) * (vChartHeight - 2 * vPaddingY);
                    const y = vChartHeight - vPaddingY - barHeight;

                    return (
                      <rect
                        key={`bar-${idx}`}
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="#0284c7"
                        rx="2"
                        opacity={hoveredVolumeBar && hoveredVolumeBar.date === pt.date ? 1 : 0.75}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={() => setHoveredVolumeBar(pt)}
                        onMouseLeave={() => setHoveredVolumeBar(null)}
                      />
                    );
                  })}

                  {/* Cyan Glowing Curve for Reports Resolved */}
                  {(() => {
                    const lineCoords = volumeData.map((pt, idx) => {
                      const x = vPaddingX + (idx * (vChartWidth - 2 * vPaddingX)) / (volumeData.length - 1);
                      const valClamped = Math.min(pt.resolved, vMaxVal);
                      const y = vChartHeight - vPaddingY - (valClamped / vMaxVal) * (vChartHeight - 2 * vPaddingY);
                      return { x, y, pt };
                    });

                    const d = lineCoords.reduce((acc, curr, idx) => {
                      if (idx === 0) return `M ${curr.x} ${curr.y}`;
                      const prev = lineCoords[idx - 1];
                      const cpx = prev.x + (curr.x - prev.x) / 2;
                      return `${acc} C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
                    }, '');

                    return (
                      <>
                        <path d={d} fill="none" stroke="#00f2fe" strokeWidth="2.5" />
                        {lineCoords.map((c, i) => (
                          <circle
                            key={`c-${i}`}
                            cx={c.x}
                            cy={c.y}
                            r={hoveredVolumeBar && hoveredVolumeBar.date === c.pt.date ? 5 : 3.5}
                            fill="#00f2fe"
                            stroke="#080f1d"
                            strokeWidth="2"
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={() => setHoveredVolumeBar(c.pt)}
                            onMouseLeave={() => setHoveredVolumeBar(null)}
                          />
                        ))}
                      </>
                    );
                  })()}

                  {/* X-axis labels */}
                  {volumeData.map((pt, idx) => {
                    const x = vPaddingX + (idx * (vChartWidth - 2 * vPaddingX)) / (volumeData.length - 1);
                    return (
                      <text
                        key={pt.date}
                        x={x}
                        y={vChartHeight - 2}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {pt.date}
                      </text>
                    );
                  })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredVolumeBar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(8,15,29,0.92)',
                      border: '1px solid #00f2fe',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#ffffff',
                      display: 'flex',
                      gap: '12px',
                      zIndex: 10,
                    }}
                  >
                    <span><strong>{hoveredVolumeBar.date}:</strong></span>
                    <span style={{ color: '#38bdf8' }}>Received: {hoveredVolumeBar.received}</span>
                    <span style={{ color: '#00f2fe' }}>Resolved: {hoveredVolumeBar.resolved}</span>
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className={styles.volumeLegendRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#0284c7' }} />
                  <span>Received (Bars)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#00f2fe' }} />
                  <span>Resolved (Line)</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Resolution Status Distribution Donut */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  <h3 className={styles.cardTitle}>Resolution Status Distribution</h3>
                </div>
                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() =>
                    openNotice(
                      'Resolution Status Details',
                      'Citywide lifecycle states: 892 Resolved (72%), 312 In Progress (25%), 217 New (17%), and 144 Overdue (12%). SLA breach alerts are active on overdue tickets.',
                      'Total Reports: 1,248',
                      'Lifecycle Metrics'
                    )
                  }
                >
                  View Details
                </button>
              </div>

              <div className={styles.donutLayout}>
                {/* SVG Donut */}
                <div className={styles.donutSvgWrap}>
                  <svg width="116" height="116" viewBox="0 0 116 116">
                    <g transform="rotate(-90 58 58)">
                      {STATUS_DISTRIBUTION.map((st) => {
                        const totalPct = 72 + 25 + 17 + 12; // 126 normalised
                        const normalised = (st.percentage / totalPct) * 100;
                        const strokeDasharray = `${(normalised / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((accStatPercent / 100) * circumference);
                        accStatPercent += normalised;

                        return (
                          <circle
                            key={st.status}
                            cx="58"
                            cy="58"
                            r={donutRadius}
                            fill="none"
                            stroke={st.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                            onMouseEnter={() => setHoveredStatus(st.status)}
                            onMouseLeave={() => setHoveredStatus(null)}
                          />
                        );
                      })}
                    </g>
                  </svg>
                  <div className={styles.donutCenterText}>
                    <span className={styles.donutCenterNum}>
                      {hoveredStatus
                        ? STATUS_DISTRIBUTION.find((s) => s.status === hoveredStatus)?.count
                        : '1,248'}
                    </span>
                    <span className={styles.donutCenterLabel}>Reports</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className={styles.categoryLegendList}>
                  {STATUS_DISTRIBUTION.map((st) => (
                    <div
                      key={st.status}
                      className={styles.categoryLegendItem}
                      onMouseEnter={() => setHoveredStatus(st.status)}
                      onMouseLeave={() => setHoveredStatus(null)}
                      style={{
                        cursor: 'pointer',
                        opacity: hoveredStatus && hoveredStatus !== st.status ? 0.5 : 1,
                        padding: '2px 0',
                      }}
                    >
                      <div className={styles.categoryLeft}>
                        <span className={styles.categoryIndicator} style={{ backgroundColor: st.color }} />
                        <span>{st.status}</span>
                      </div>
                      <span className={styles.categoryCount}>
                        {st.count} ({st.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel 3: AI Priority Issues (Top 5) (Matching reference screenshot) */}
            <div className={styles.chartCard} ref={aiSectionRef}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardHeaderLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <h3 className={styles.cardTitle}>AI Priority Issues (Top 5)</h3>
                </div>

                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={() => handleTabChange('ai')}
                >
                  View All →
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.wardTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '20px' }}>#</th>
                      <th>Issue</th>
                      <th>Ward</th>
                      <th>Priority</th>
                      <th>Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_AI_PRIORITY_ISSUES.map((item) => {
                      let priorityClass = styles.badgeGood;
                      if (item.priority === 'Critical') priorityClass = styles.levelCritical;
                      if (item.priority === 'High') priorityClass = styles.levelHigh;
                      if (item.priority === 'Medium') priorityClass = styles.levelMedium;

                      return (
                        <tr key={item.rank}>
                          <td style={{ color: '#64748b' }}>{item.rank}</td>
                          <td style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                            {item.issue}
                          </td>
                          <td style={{ color: '#94a3b8' }}>{item.ward}</td>
                          <td>
                            <span className={priorityClass}>{item.priority}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.tableActionBtn}
                              style={{ whiteSpace: 'nowrap' }}
                              onClick={() => {
                                openNotice(
                                  `Action Dispatch: ${item.issue}`,
                                  `Suggested Action: "${item.suggestedAction}". Dispatch ticket generated for ${item.ward} with priority score ${item.priorityScore}/100.`,
                                  'Assigned to Rapid Response Crew',
                                  'Action Dispatched'
                                );
                              }}
                            >
                              <span>{item.suggestedAction}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================
              WARD PERFORMANCE COMPARISON SECTION (Full Comprehensive Table)
              ============================================================ */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Ward Performance Comparison</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Compare issue volume, resolution rate and response time across wards.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Filtered Ward:</span>
                <select
                  className={styles.filterSelectBox}
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                >
                  <option value="All Wards">All Wards (5)</option>
                  <option value="Ward 1">Ward 1</option>
                  <option value="Ward 2">Ward 2</option>
                  <option value="Ward 3">Ward 3</option>
                  <option value="Ward 4">Ward 4</option>
                  <option value="Ward 5">Ward 5</option>
                </select>
              </div>
            </div>

            <div className={styles.chartCard} style={{ padding: '8px 16px' }}>
              <div className={styles.tableContainer}>
                <table className={styles.wardTable}>
                  <thead>
                    <tr>
                      <th>Ward</th>
                      <th>Total Issues</th>
                      <th>Resolved</th>
                      <th>Resolution Rate</th>
                      <th>Avg. Resolution</th>
                      <th>Overdue</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWardRows.map((w) => {
                      let badgeClass = styles.badgeGood;
                      if (w.performance === 'Excellent') badgeClass = styles.badgeExcellent;
                      if (w.performance === 'Needs Attention') badgeClass = styles.badgeAttention;

                      return (
                        <tr key={w.ward}>
                          <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{w.ward}</td>
                          <td>{w.totalIssues}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{w.resolved}</td>
                          <td>
                            <div className={styles.rateCell}>
                              <div className={styles.progressBarTrack}>
                                <div
                                  className={styles.progressBarFill}
                                  style={{
                                    width: `${w.resolutionRate}%`,
                                    background:
                                      w.performance === 'Excellent'
                                        ? 'linear-gradient(90deg, #10b981, #00f2fe)'
                                        : w.performance === 'Needs Attention'
                                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                        : 'linear-gradient(90deg, #3b82f6, #14b8a6)',
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '12px', color: '#f1f5f9' }}>
                                {w.resolutionRate}%
                              </span>
                            </div>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{w.avgResolution}</td>
                          <td className={styles.overdueText}>{w.overdue}</td>
                          <td>
                            <span className={badgeClass}>{w.performance}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================
              AI PRIORITISATION SECTION (Prominent Cards & Scoring)
              ============================================================ */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>AI-Assisted Issue Prioritisation</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Identify high-impact civic issues that require immediate administrative attention.
                </p>
              </div>

              <div className={styles.aiDemoBadge}>
                <span>Priority Scoring Framework (Demo)</span>
              </div>
            </div>

            {/* 3 Prominent Featured Priority Cards */}
            <div className={styles.aiCardsGrid}>
              {AI_PRIORITY_FEATURED.map((item) => {
                let badgeClass = styles.levelCritical;
                let actionBtnClass = styles.aiActionBtnCritical;
                if (item.level === 'HIGH PRIORITY') {
                  badgeClass = styles.levelHigh;
                  actionBtnClass = styles.aiActionBtnHigh;
                } else if (item.level === 'MEDIUM PRIORITY') {
                  badgeClass = styles.levelMedium;
                  actionBtnClass = styles.aiActionBtnMedium;
                }

                return (
                  <div key={item.ticketId} className={styles.aiPriorityCard}>
                    <div className={styles.aiCardTop}>
                      <span className={`${styles.aiLevelBadge} ${badgeClass}`}>
                        {item.level}
                      </span>
                      {renderScoreRing(item.priorityScore, item.scoreColor)}
                    </div>

                    <div>
                      <h4 className={styles.aiCardTitle}>{item.title}</h4>
                      <span className={styles.aiCardWard}>{item.ward} • {item.category} ({item.ticketId})</span>
                    </div>

                    <div className={styles.aiFactorsBox}>
                      <span className={styles.aiFactorLabel}>Evaluation Factors</span>
                      <div className={styles.aiFactorsList}>
                        {item.factors.map((factor) => (
                          <span key={factor} className={styles.aiFactorChip}>
                            • {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`${styles.aiActionBtn} ${actionBtnClass}`}
                      onClick={() => {
                        openNotice(
                          `${item.level}: ${item.title}`,
                          `Action initiated: "${item.actionLabel}" for ticket ${item.ticketId} in ${item.ward}. Priority score evaluated at ${item.priorityScore}/100.`,
                          `Dispatched with key factors: ${item.factors.join(', ')}`,
                          'Action Assigned'
                        );
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>{item.actionLabel}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              AI EXPLANATION PANEL (How Priority is Calculated)
              ============================================================ */}
          <div className={styles.aiExplanationPanel}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h3 className={styles.cardTitle} style={{ fontSize: '16px' }}>
                  How Priority is Calculated
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  AI-assisted priority recommendation scoring framework
                </span>
              </div>
            </div>

            <div className={styles.formulaContainer}>
              {/* Severity */}
              <div className={styles.formulaTile}>
                <span className={styles.formulaTileTitle}>Severity</span>
                <span className={styles.formulaTileWeight}>Weight: 25%</span>
                <span className={styles.formulaTileDesc}>Physical hazard, structural damage, water or road contamination</span>
              </div>

              <span className={styles.formulaOperator}>+</span>

              {/* Public Impact */}
              <div className={styles.formulaTile}>
                <span className={styles.formulaTileTitle}>Public Impact</span>
                <span className={styles.formulaTileWeight}>Weight: 25%</span>
                <span className={styles.formulaTileDesc}>Affected population count, commuter volume, transit proximity</span>
              </div>

              <span className={styles.formulaOperator}>+</span>

              {/* Location Risk */}
              <div className={styles.formulaTile}>
                <span className={styles.formulaTileTitle}>Location Risk</span>
                <span className={styles.formulaTileWeight}>Weight: 20%</span>
                <span className={styles.formulaTileDesc}>Schools, hospitals, arterial highways, low-lying flood sectors</span>
              </div>

              <span className={styles.formulaOperator}>+</span>

              {/* Complaint Frequency */}
              <div className={styles.formulaTile}>
                <span className={styles.formulaTileTitle}>Complaint Frequency</span>
                <span className={styles.formulaTileWeight}>Weight: 15%</span>
                <span className={styles.formulaTileDesc}>Cluster density, multiple reports from unique citizen coordinates</span>
              </div>

              <span className={styles.formulaOperator}>+</span>

              {/* Issue Age */}
              <div className={styles.formulaTile}>
                <span className={styles.formulaTileTitle}>Issue Age</span>
                <span className={styles.formulaTileWeight}>Weight: 15%</span>
                <span className={styles.formulaTileDesc}>Days unresolved vs municipal citizen SLA turnaround baseline</span>
              </div>

              <span className={styles.formulaOperator}>=</span>

              {/* Result */}
              <div className={styles.formulaResultTile}>
                <span className={styles.formulaTileTitle} style={{ color: '#00f2fe' }}>Priority Recommendation</span>
                <span className={styles.formulaTileWeight} style={{ color: '#5eead4' }}>0 – 100 Score</span>
                <span className={styles.formulaTileDesc} style={{ color: '#e2e8f0' }}>Algorithmic dispatch & queue prioritisation</span>
              </div>
            </div>

            <div className={styles.aiDisclaimerNote}>
              <strong>Notice:</strong> This interface displays an <em>AI-assisted priority recommendation</em> framework based on heuristic scoring of reported civic metadata. It assists administrative dispatch decisions by ordering issues by calculated urgency.
            </div>
          </div>

          {/* ============================================================
              RECOMMENDED RESOURCE ALLOCATION SECTION
              ============================================================ */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  <span>Recommended Resource Allocation</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Dynamic field team and machinery deployment based on current ward issue density.
                </p>
              </div>

              <button
                type="button"
                className={styles.headerActionBtn}
                style={{ background: '#10b981', color: '#ffffff', borderColor: '#10b981' }}
                onClick={() => {
                  openNotice(
                    'Recommended Resource Allocation',
                    'Direct field crew distribution across all 5 wards: 8 Road Maintenance teams, 5 Waste Management squads, 3 Water Supply emergency vans, and 2 Streetlight maintenance teams.',
                    'Dispatch plan ready for administrative review',
                    'Manpower Plan'
                  );
                }}
              >
                <span>View Resource Allocation →</span>
              </button>
            </div>

            <div className={styles.resourceGrid}>
              {RESOURCE_ALLOCATION_RECOMMENDATIONS.map((r) => (
                <div key={r.department} className={styles.resourceCard}>
                  <div className={styles.resourceCardTop}>
                    <div className={styles.resourceIconSquircle}>{r.icon}</div>
                    <span className={styles.resourceDept}>{r.department}</span>
                  </div>
                  <div className={styles.resourceRecommendation}>{r.recommendation}</div>
                  <div className={styles.resourceReason}>
                    <strong>Reason:</strong> {r.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              KEY CITY INSIGHTS SECTION (Bottom Summary Cards)
              ============================================================ */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Key City Insights</span>
                </h2>
                <p className={styles.sectionSubtitle}>
                  Executive summary of civic indicators and operational performance across Mira Bhayandar.
                </p>
              </div>
            </div>

            <div className={styles.insightsGrid}>
              {KEY_CITY_INSIGHTS.map((item) => (
                <div key={item.id} className={styles.insightCard}>
                  <div className={styles.insightIconSquircle}>{item.icon}</div>
                  <div className={styles.insightContent}>
                    <span className={styles.insightBadge}>{item.category} • {item.trend}</span>
                    <p className={styles.insightTitle}>{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
