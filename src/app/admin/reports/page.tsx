'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './reports.module.css';
import {
  REPORT_TYPES,
  RECENT_REPORTS,
  SCHEDULED_REPORTS,
  REPORTS_KPIS,
  REPORTING_ACTIVITY,
  EXPORT_HISTORY_DATA,
  REPORT_PREVIEW_WARD_DATA,
  REPORT_PREVIEW_CATEGORY_DATA,
  CUSTOM_REPORT_METRICS,
  ReportRecord,
  ScheduledReport,
} from '../../../lib/admin';

/* ────────────────────────────────────────────────────────────
   ICON MAPPING
   ──────────────────────────────────────────────────────────── */
const ReportIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'chart':
      return <svg {...s}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case 'map':
      return <svg {...s}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>;
    case 'alert':
      return <svg {...s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'briefcase':
      return <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case 'spark':
      return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case 'activity':
      return <svg {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    default:
      return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
  }
};

/* ────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ──────────────────────────────────────────────────────────── */
export default function ReportsExportPage() {
  // Global
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [searchQuery, setSearchQuery] = useState('');

  // Page filters
  const [filterDateRange, setFilterDateRange] = useState('01 Dec 2024 - 31 Dec 2024');
  const [filterWard, setFilterWard] = useState('All Wards');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterReportStatus, setFilterReportStatus] = useState('All');

  // Custom report builder
  const [customReportName, setCustomReportName] = useState('');
  const [customReportType, setCustomReportType] = useState('City Performance');
  const [customDateRange, setCustomDateRange] = useState('01 Dec 2024 - 31 Dec 2024');
  const [customWards, setCustomWards] = useState('All Wards');
  const [customCategories, setCustomCategories] = useState('All Categories');
  const [customGroupBy, setCustomGroupBy] = useState('Ward');
  const [customExportFormat, setCustomExportFormat] = useState('PDF');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(CUSTOM_REPORT_METRICS);

  // Reports data
  const [reports, setReports] = useState<ReportRecord[]>(RECENT_REPORTS);
  const [scheduledReports] = useState<ScheduledReport[]>(SCHEDULED_REPORTS);

  // Report table filters
  const [reportSearch, setReportSearch] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [reportFormatFilter, setReportFormatFilter] = useState('All');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');

  // Export activity chart period
  const [exportPeriod, setExportPeriod] = useState('Last 30 Days');

  // Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloadModal, setDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [generateModal, setGenerateModal] = useState(false);
  const [generateStep, setGenerateStep] = useState(0);
  const [generateReportTitle, setGenerateReportTitle] = useState('');
  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedReportName, setSchedReportName] = useState('');
  const [schedFrequency, setSchedFrequency] = useState('Weekly');
  const [schedTime, setSchedTime] = useState('09:00');
  const [schedRecipient, setSchedRecipient] = useState('admin@civicpulse.in');
  const [schedFormat, setSchedFormat] = useState('PDF');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Metric toggle
  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  // Generate report simulation
  const startGeneration = useCallback((title: string) => {
    setGenerateReportTitle(title);
    setGenerateStep(0);
    setGenerateModal(true);
  }, []);

  useEffect(() => {
    if (!generateModal || generateStep >= 4) return;
    const timer = setTimeout(() => setGenerateStep((s) => s + 1), 900);
    return () => clearTimeout(timer);
  }, [generateModal, generateStep]);

  const handleGenerateComplete = () => {
    const newReport: ReportRecord = {
      id: `report-${Date.now()}`,
      name: generateReportTitle || customReportName || 'Custom Report',
      type: customReportType,
      period: '01 Dec – 31 Dec 2024',
      generatedBy: 'Admin User',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      format: customExportFormat as 'PDF' | 'Excel' | 'CSV',
      status: 'Generated',
    };
    setReports((prev) => [newReport, ...prev]);
    setGenerateModal(false);
    showToast(`${generateReportTitle || 'Report'} generated successfully.`);
  };

  const handleDownload = () => {
    setDownloadModal(false);
    showToast(`Report exported in ${downloadFormat} format (prototype — no file created).`);
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.type.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.generatedBy.toLowerCase().includes(reportSearch.toLowerCase());
    const matchType = reportTypeFilter === 'All' || r.type === reportTypeFilter;
    const matchFormat = reportFormatFilter === 'All' || r.format === reportFormatFilter;
    const matchStatus = reportStatusFilter === 'All' || r.status === reportStatusFilter;
    return matchSearch && matchType && matchFormat && matchStatus;
  });

  const maxExport = Math.max(...EXPORT_HISTORY_DATA.map((d) => d.count));

  return (
    <div className={styles.container}>
      {/* ============ SIDEBAR ============ */}
      <aside className={styles.sidebar}>
        <Link href="/admin/dashboard" className={styles.brandLink}>
          <div className={styles.brandIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>Admin Portal</div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></span>
            <span>Dashboard</span>
          </Link>

          <Link href="/admin/issues" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg></span>
            <span>All Issues & City Map</span>
          </Link>

          <Link href="/admin/analytics" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></span>
            <span>City Analytics</span>
          </Link>

          <Link href="/admin/resource-allocation" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></span>
            <span>Resource Allocation</span>
          </Link>

          <Link href="/admin/ward-management" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
            <span>Ward & User Management</span>
          </Link>

          <Link href="/admin/system-administration" className={styles.navItem}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></span>
            <span>System Administration</span>
          </Link>

          <Link href="/admin/reports" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></span>
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

        <div className={styles.sidebarBanner}>
          <div className={styles.sidebarBannerBg} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerText}>
              <div className={styles.bannerTitle}>Stronger Communities A Cleaner Mira Bhayandar</div>
              <div className={styles.bannerSub}>Smart Governance</div>
            </div>
            <div className={styles.bannerArrow}>→</div>
          </div>
        </div>
      </aside>

      {/* ============ MAIN AREA ============ */}
      <div className={styles.mainArea}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
            <input type="text" className={styles.searchInput} placeholder="Search issues, wards, staff, locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className={styles.headerActions}>
            <div className={styles.wardSelector}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
                <option>All Wards</option>
                <option>Ward 1</option><option>Ward 2</option><option>Ward 3</option><option>Ward 4</option><option>Ward 5</option>
              </select>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => showToast('8 notifications pending')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span className={styles.notificationBadge}>8</span>
            </button>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>SA</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Admin User</span>
                <span className={styles.userRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* ============ CONTENT ============ */}
        <main className={styles.content}>
          {/* Page Title */}
          <div className={styles.topBar}>
            <div className={styles.pageTitleGroup}>
              <div className={styles.breadcrumb}>
                <Link href="/admin/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
                <span>&gt;</span>
                <span>Reports & Export</span>
              </div>
              <h1 className={styles.pageTitle}>Reports & Export</h1>
              <p className={styles.pageSubtitle}>Generate, analyse and export city-wide civic reports for administrative decision-making.</p>
            </div>
            <button type="button" className={styles.btnPrimaryLg} onClick={() => startGeneration('City Performance Report')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>Generate Report</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <select className={styles.filterSelect} style={{ minWidth: 210 }} value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}>
              <option>01 Dec 2024 - 31 Dec 2024</option>
              <option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option>
            </select>
            <select className={styles.filterSelect} value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
              <option>All Wards</option><option>Ward 1</option><option>Ward 2</option><option>Ward 3</option><option>Ward 4</option><option>Ward 5</option>
            </select>
            <select className={styles.filterSelect} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option>All Categories</option><option>Roads</option><option>Waste Management</option><option>Streetlights</option><option>Drainage</option><option>Water Supply</option><option>Traffic</option><option>Other</option>
            </select>
            <select className={styles.filterSelect} value={filterReportStatus} onChange={(e) => setFilterReportStatus(e.target.value)}>
              <option>All Reports</option><option>Generated</option><option>Scheduled</option><option>Failed</option>
            </select>
            <button type="button" className={styles.btnApplyFilter} onClick={() => showToast('Filters applied to reporting data.')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              <span>Apply Filters</span>
            </button>
          </div>

          {/* ──── MAIN BODY GRID (LEFT + RIGHT) ──── */}
          <div className={styles.mainBodyGrid}>
            {/* LEFT COLUMN */}
            <div className={styles.mainLeftCol}>
              {/* KPI Cards */}
              <section className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiContent}>
                    <span className={styles.kpiValue}>{REPORTS_KPIS.totalIssues.toLocaleString()}</span>
                    <span className={styles.kpiLabel}>Total Issues</span>
                    <span className={styles.kpiSub}>{REPORTS_KPIS.totalIssuesSub}</span>
                  </div>
                  <div className={`${styles.kpiIconWrapper} ${styles.kpiIconTeal}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiContent}>
                    <span className={styles.kpiValue}>{REPORTS_KPIS.resolvedIssues.toLocaleString()}</span>
                    <span className={styles.kpiLabel}>Resolved Issues</span>
                    <span className={styles.kpiSub}>{REPORTS_KPIS.resolvedSub}</span>
                  </div>
                  <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiContent}>
                    <span className={styles.kpiValue}>{REPORTS_KPIS.overdueIssues}</span>
                    <span className={styles.kpiLabel}>Overdue Issues</span>
                    <span className={styles.kpiSub}>{REPORTS_KPIS.overdueSub}</span>
                  </div>
                  <div className={`${styles.kpiIconWrapper} ${styles.kpiIconAmber}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  </div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiContent}>
                    <span className={styles.kpiValue}>{REPORTS_KPIS.reportsGenerated}</span>
                    <span className={styles.kpiLabel}>Reports Generated</span>
                    <span className={styles.kpiSub}>{REPORTS_KPIS.reportsSub}</span>
                  </div>
                  <div className={`${styles.kpiIconWrapper} ${styles.kpiIconBlue}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </div>
                </div>
              </section>

              {/* Generate a Report */}
              <section>
                <div style={{ marginBottom: 10 }}>
                  <h2 className={styles.sectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    Generate a Report
                  </h2>
                  <p className={styles.sectionSubtitle}>Select a report type and configure the information you need.</p>
                </div>
                <div className={styles.reportTypeGrid}>
                  {REPORT_TYPES.map((rt) => (
                    <div key={rt.id} className={styles.reportTypeCard}>
                      <div className={styles.reportTypeTitle}>
                        <div className={styles.reportTypeIcon}><ReportIcon type={rt.icon} size={14} /></div>
                        {rt.title}
                      </div>
                      <p className={styles.reportTypeDesc}>{rt.description}</p>
                      <button type="button" className={styles.btnGenerateReport} onClick={() => startGeneration(rt.title)}>
                        <span>Generate Report</span>
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Mid Area: Custom Report Builder + Preview */}
              <div className={styles.midAreaGrid}>
                {/* Custom Report Builder */}
                <div className={styles.builderCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Custom Report Builder</h2>
                      <p className={styles.cardSubtitle}>Build a report using the data and metrics you need.</p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Report Name</label>
                    <input type="text" className={styles.formInput} placeholder="Enter report name..." value={customReportName} onChange={(e) => setCustomReportName(e.target.value)} />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Report Type</label>
                    <select className={styles.formSelect} value={customReportType} onChange={(e) => setCustomReportType(e.target.value)}>
                      <option>City Performance</option><option>Ward Performance</option><option>Issue Analysis</option><option>Resource Allocation</option><option>AI Prioritisation</option><option>System Activity</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date Range</label>
                    <select className={styles.formSelect} value={customDateRange} onChange={(e) => setCustomDateRange(e.target.value)}>
                      <option>01 Dec 2024 - 31 Dec 2024</option><option>Last 7 Days</option><option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Wards</label>
                    <select className={styles.formSelect} value={customWards} onChange={(e) => setCustomWards(e.target.value)}>
                      <option>All Wards</option><option>Ward 1</option><option>Ward 2</option><option>Ward 3</option><option>Ward 4</option><option>Ward 5</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Categories</label>
                    <select className={styles.formSelect} value={customCategories} onChange={(e) => setCustomCategories(e.target.value)}>
                      <option>All Categories</option><option>Roads</option><option>Waste Management</option><option>Streetlights</option><option>Drainage</option><option>Water Supply</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Metrics</label>
                    <div className={styles.metricsGrid}>
                      {CUSTOM_REPORT_METRICS.map((m) => (
                        <label key={m} className={styles.metricCheckbox}>
                          <input type="checkbox" checked={selectedMetrics.includes(m)} onChange={() => toggleMetric(m)} />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Group By</label>
                    <select className={styles.formSelect} value={customGroupBy} onChange={(e) => setCustomGroupBy(e.target.value)}>
                      <option>Ward</option><option>Category</option><option>Priority</option><option>Status</option><option>Date</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Export Format</label>
                    <select className={styles.formSelect} value={customExportFormat} onChange={(e) => setCustomExportFormat(e.target.value)}>
                      <option>PDF</option><option>Excel</option><option>CSV</option>
                    </select>
                  </div>

                  <button type="button" className={styles.btnGenerateCustom} onClick={() => startGeneration(customReportName || 'Custom Report')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    <span>Generate Custom Report</span>
                  </button>
                </div>

                {/* Report Preview */}
                <div className={styles.previewCard}>
                  <div className={styles.previewHeaderBar}>
                    <span className={styles.previewHeaderTitle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      Report Preview
                    </span>
                    <div className={styles.previewActions}>
                      <button type="button" className={styles.btnPreviewAction}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        Preview
                      </button>
                      <button type="button" className={styles.btnPreviewAction} onClick={() => setDownloadModal(true)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Download
                      </button>
                      <button type="button" className={styles.btnPreviewAction} onClick={() => showToast('Print preview opened (prototype).')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                        Print
                      </button>
                      <button type="button" className={styles.btnPreviewAction} disabled onClick={() => showToast('Sharing requires external integration.')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        Share
                      </button>
                    </div>
                  </div>

                  <div className={styles.previewBody}>
                    {/* Report Inner Header */}
                    <div className={styles.reportInnerHeader}>
                      <div className={styles.reportInnerLogo}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        CivicPulse
                      </div>
                      <h3 className={styles.reportInnerTitle}>City Performance Report</h3>
                      <span className={styles.reportInnerMeta}>Mira-Bhayandar Municipal Corporation</span>
                      <span className={styles.reportInnerMeta}>Period: 01 Dec 2024 – 31 Dec 2024 &nbsp;|&nbsp; Generated: 17 Nov 2026</span>
                    </div>

                    {/* Preview KPIs */}
                    <div className={styles.previewKpiRow}>
                      <div className={styles.previewKpi}>
                        <div className={styles.previewKpiValue}>1,248</div>
                        <div className={styles.previewKpiLabel}>Total Issues</div>
                      </div>
                      <div className={styles.previewKpi}>
                        <div className={styles.previewKpiValue}>892</div>
                        <div className={styles.previewKpiLabel}>Resolved</div>
                      </div>
                      <div className={styles.previewKpi}>
                        <div className={styles.previewKpiValue}>312</div>
                        <div className={styles.previewKpiLabel}>In Progress</div>
                      </div>
                      <div className={styles.previewKpi}>
                        <div className={styles.previewKpiValue}>144</div>
                        <div className={styles.previewKpiLabel}>Overdue</div>
                      </div>
                    </div>

                    {/* Charts Row */}
                    <div className={styles.previewChartsGrid}>
                      {/* Category Distribution */}
                      <div className={styles.previewChartCard}>
                        <div className={styles.previewChartTitle}>Issues by Category</div>
                        <div className={styles.catDistLayout}>
                          <svg className={styles.miniDonut} viewBox="0 0 42 42">
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#14b8a6" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="0" />
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="22 78" strokeDashoffset="-25" />
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="18 82" strokeDashoffset="-47" />
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="13 87" strokeDashoffset="-65" />
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="4" strokeDasharray="12 88" strokeDashoffset="-78" />
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#64748b" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-90" />
                            <text x="21" y="21" textAnchor="middle" dy=".1em" fill="#ffffff" fontSize="5" fontWeight="700">1,248</text>
                            <text x="21" y="25" textAnchor="middle" fill="#94a3b8" fontSize="3">Issues</text>
                          </svg>
                          <div className={styles.catLegend}>
                            {REPORT_PREVIEW_CATEGORY_DATA.map((c) => (
                              <div key={c.name} className={styles.catLegendItem}>
                                <span className={styles.catLegendDot} style={{ backgroundColor: c.color }} />
                                <span>{c.name} – {c.value} ({c.pct})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Resolution Trend */}
                      <div className={styles.previewChartCard}>
                        <div className={styles.previewChartTitle}>Resolution Trend</div>
                        <div className={styles.miniBarChart}>
                          {[45, 60, 55, 70, 80, 65, 90].map((h, i) => (
                            <div key={i} className={styles.miniBar} style={{ height: `${h}%` }} />
                          ))}
                        </div>
                        <div className={styles.miniBarLabels}>
                          <span>1 Dec</span><span>7 Dec</span><span>10 Dec</span><span>15 Dec</span><span>20 Dec</span><span>25 Dec</span><span>31 Dec</span>
                        </div>
                      </div>
                    </div>

                    {/* Ward Performance Table */}
                    <div className={styles.previewChartCard}>
                      <div className={styles.previewChartTitle}>Ward Performance</div>
                      <table className={styles.previewWardTable}>
                        <thead><tr><th>Ward</th><th>Reports</th><th>Resolved</th><th>Rate</th></tr></thead>
                        <tbody>
                          {REPORT_PREVIEW_WARD_DATA.map((w) => (
                            <tr key={w.ward}><td>{w.ward}</td><td>{w.reports}</td><td>{w.resolved}</td><td>{w.rate}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className={styles.mainRightCol}>
              {/* Reporting Activity */}
              <div className={styles.activityCard}>
                <div className={styles.activityTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                  Reporting Activity
                </div>
                <div className={styles.activityKpis}>
                  <div className={styles.activityKpi}>
                    <div className={styles.activityKpiValue}>{REPORTING_ACTIVITY.total}</div>
                    <div className={styles.activityKpiLabel}>Reports Generated</div>
                  </div>
                  <div className={styles.activityKpi}>
                    <div className={styles.activityKpiValue}>{REPORTING_ACTIVITY.pdf}</div>
                    <div className={styles.activityKpiLabel}>PDF</div>
                    <div className={styles.activityKpiSub}>(50%)</div>
                  </div>
                  <div className={styles.activityKpi}>
                    <div className={styles.activityKpiValue}>{REPORTING_ACTIVITY.excel}</div>
                    <div className={styles.activityKpiLabel}>Excel</div>
                    <div className={styles.activityKpiSub}>(33%)</div>
                  </div>
                  <div className={styles.activityKpi}>
                    <div className={styles.activityKpiValue}>{REPORTING_ACTIVITY.csv}</div>
                    <div className={styles.activityKpiLabel}>CSV</div>
                    <div className={styles.activityKpiSub}>(17%)</div>
                  </div>
                </div>
                <div className={styles.activityInfoRow}>
                  <span className={styles.activityInfoLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Most Generated Report
                  </span>
                  <span className={styles.activityInfoValue}>{REPORTING_ACTIVITY.mostGenerated}</span>
                </div>
                <div className={styles.activityInfoRow}>
                  <span className={styles.activityInfoLabel}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Most Active Period
                  </span>
                  <span className={styles.activityInfoValue}>{REPORTING_ACTIVITY.mostActivePeriod}</span>
                </div>
              </div>

              {/* Export Activity Chart */}
              <div className={styles.activityCard}>
                <div className={styles.exportChartHeader}>
                  <span className={styles.activityTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export Activity
                  </span>
                  <select className={styles.exportChartSelect} value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value)}>
                    <option>Last 7 Days</option><option>Last 30 Days</option><option>Last 90 Days</option>
                  </select>
                </div>
                <div className={styles.exportBarChart}>
                  {EXPORT_HISTORY_DATA.map((d, i) => (
                    <div key={i} className={styles.exportBar} style={{ height: `${(d.count / maxExport) * 100}%` }} title={`${d.week}: ${d.count} exports`} />
                  ))}
                </div>
                <div className={styles.exportBarLabels}>
                  {EXPORT_HISTORY_DATA.map((d) => (
                    <span key={d.week}>{d.week}</span>
                  ))}
                </div>
              </div>

              {/* Scheduled Reports */}
              <div className={styles.activityCard}>
                <div className={styles.scheduledHeader}>
                  <span className={styles.activityTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Scheduled Reports
                  </span>
                  <button type="button" className={styles.btnSecondary} style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setScheduleModal(true)}>
                    + Schedule Report
                  </button>
                </div>
                <table className={styles.schedTable}>
                  <thead>
                    <tr><th>Report</th><th>Frequency</th><th>Next Run</th><th>Recipient</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {scheduledReports.map((sr) => (
                      <tr key={sr.id}>
                        <td style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 11 }}>{sr.reportName}</td>
                        <td style={{ fontSize: 11 }}>{sr.frequency}</td>
                        <td style={{ fontSize: 11 }}>{sr.nextRun}</td>
                        <td style={{ fontSize: 11 }}>{sr.recipient}</td>
                        <td><span className={styles.badgeActive}>{sr.status}</span></td>
                        <td>
                          <button type="button" className={styles.btnEditSmall} onClick={() => showToast(`Editing schedule for ${sr.reportName}`)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ──── RECENT REPORTS TABLE ──── */}
          <section className={styles.card}>
            <div className={styles.recentReportsHeader}>
              <h2 className={styles.recentReportsTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Recent Reports
              </h2>
              <div className={styles.recentFilters}>
                <input type="text" className={styles.recentSearchInput} placeholder="Search reports..." value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} />
                <select className={styles.recentFilterSelect} value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)}>
                  <option value="All">All Types</option><option>City Performance</option><option>Ward Performance</option><option>Issue Analysis</option><option>Resource Allocation</option><option>AI Prioritisation</option><option>System Activity</option>
                </select>
                <select className={styles.recentFilterSelect} value={reportFormatFilter} onChange={(e) => setReportFormatFilter(e.target.value)}>
                  <option value="All">All Formats</option><option>PDF</option><option>Excel</option><option>CSV</option>
                </select>
                <select className={styles.recentFilterSelect} value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)}>
                  <option value="All">All Status</option><option>Generated</option><option>Scheduled</option><option>Processing</option><option>Failed</option>
                </select>
              </div>
            </div>

            <div className={styles.reportsTableWrapper}>
              <table className={styles.reportsTable}>
                <thead>
                  <tr><th>#</th><th>Report</th><th>Type</th><th>Period</th><th>Generated By</th><th>Date</th><th>Format</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredReports.map((r, idx) => (
                    <tr key={r.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{r.name}</td>
                      <td>{r.type}</td>
                      <td>{r.period}</td>
                      <td>{r.generatedBy}</td>
                      <td>{r.date}</td>
                      <td>
                        <span className={`${styles.formatBadge} ${r.format === 'PDF' ? styles.formatPdf : r.format === 'Excel' ? styles.formatExcel : styles.formatCsv}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          {r.format}
                        </span>
                      </td>
                      <td>
                        <span className={r.status === 'Generated' ? styles.badgeGenerated : r.status === 'Scheduled' ? styles.badgeScheduled : r.status === 'Processing' ? styles.badgeProcessing : styles.badgeFailed}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button type="button" className={styles.btnDownload} onClick={() => { setDownloadFormat(r.format); setDownloadModal(true); }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px 8px', color: '#64748b' }}>No reports match filter criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ──── GENERATE REPORT MODAL ──── */}
      {generateModal && (
        <div className={styles.modalBackdrop} onClick={() => { if (generateStep >= 4) setGenerateModal(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                Generate Report
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setGenerateModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody} style={{ marginBottom: 4 }}>
              <strong style={{ color: '#e2e8f0' }}>{generateReportTitle}</strong>
            </div>
            <div className={styles.generateSteps}>
              {['Collecting data', 'Processing selected metrics', 'Preparing report', 'Report ready'].map((label, i) => (
                <div key={label} className={`${styles.generateStep} ${generateStep === i ? styles.stepActive : generateStep > i ? styles.stepDone : styles.stepPending}`}>
                  {generateStep > i ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : generateStep === i ? (
                    <div className={styles.stepSpinner} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
                  )}
                  <span>{i + 1}. {label}</span>
                </div>
              ))}
            </div>
            {generateStep >= 4 && (
              <>
                <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#10b981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Report generated successfully
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setGenerateModal(false)}>Preview</button>
                  <button type="button" className={styles.btnPrimary} onClick={handleGenerateComplete}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ──── DOWNLOAD FORMAT MODAL ──── */}
      {downloadModal && (
        <div className={styles.modalBackdrop} onClick={() => setDownloadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download Report
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setDownloadModal(false)}>✕</button>
            </div>
            <div className={styles.formatOptions}>
              <div className={`${styles.formatOption} ${downloadFormat === 'PDF' ? styles.formatOptionSelected : ''}`} onClick={() => setDownloadFormat('PDF')}>
                <div className={`${styles.formatOptionIcon} ${styles.formatPdfIcon}`}>PDF</div>
                <div className={styles.formatOptionText}>
                  <span className={styles.formatOptionTitle}>PDF</span>
                  <span className={styles.formatOptionDesc}>Best for formal reports and presentations</span>
                </div>
              </div>
              <div className={`${styles.formatOption} ${downloadFormat === 'Excel' ? styles.formatOptionSelected : ''}`} onClick={() => setDownloadFormat('Excel')}>
                <div className={`${styles.formatOptionIcon} ${styles.formatExcelIcon}`}>XLS</div>
                <div className={styles.formatOptionText}>
                  <span className={styles.formatOptionTitle}>Excel</span>
                  <span className={styles.formatOptionDesc}>Best for analysis and data processing</span>
                </div>
              </div>
              <div className={`${styles.formatOption} ${downloadFormat === 'CSV' ? styles.formatOptionSelected : ''}`} onClick={() => setDownloadFormat('CSV')}>
                <div className={`${styles.formatOptionIcon} ${styles.formatCsvIcon}`}>CSV</div>
                <div className={styles.formatOptionText}>
                  <span className={styles.formatOptionTitle}>CSV</span>
                  <span className={styles.formatOptionDesc}>Best for raw data export</span>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setDownloadModal(false)}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={handleDownload}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── SCHEDULE REPORT MODAL ──── */}
      {scheduleModal && (
        <div className={styles.modalBackdrop} onClick={() => setScheduleModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Schedule Report
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setScheduleModal(false)}>✕</button>
            </div>
            <div className={styles.scheduleForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Report</label>
                <select className={styles.formSelect} value={schedReportName} onChange={(e) => setSchedReportName(e.target.value)}>
                  <option value="">Select report type...</option>
                  {REPORT_TYPES.map((rt) => <option key={rt.id} value={rt.title}>{rt.title}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Frequency</label>
                <select className={styles.formSelect} value={schedFrequency} onChange={(e) => setSchedFrequency(e.target.value)}>
                  <option>Daily</option><option>Weekly</option><option>Monthly</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Time</label>
                <input type="time" className={styles.formInput} value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Recipient</label>
                <input type="text" className={styles.formInput} value={schedRecipient} onChange={(e) => setSchedRecipient(e.target.value)} placeholder="Email or username" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Format</label>
                <select className={styles.formSelect} value={schedFormat} onChange={(e) => setSchedFormat(e.target.value)}>
                  <option>PDF</option><option>Excel</option><option>CSV</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', padding: '4px 0' }}>
              Note: Email delivery requires external mail service integration (not configured in current prototype).
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setScheduleModal(false)}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={() => { setScheduleModal(false); showToast(`Schedule created for ${schedReportName || 'report'} (prototype — no delivery configured).`); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── TOAST ──── */}
      {toastMessage && (
        <div className={styles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
