'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './system-administration.module.css';
import {
  SYSTEM_OVERVIEW_KPIS,
  INITIAL_GENERAL_CONFIG,
  INITIAL_ISSUE_MANAGEMENT_CONFIG,
  INITIAL_AI_PRIORITISATION_CONFIG,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_SECURITY_SETTINGS,
  INITIAL_DATA_BACKUP_CONFIG,
  SYSTEM_HEALTH_SERVICES,
  SYSTEM_PERFORMANCE_METRICS,
  INITIAL_AUDIT_LOGS,
  GeneralConfigState,
  IssueManagementConfigState,
  AIPrioritisationConfigState,
  NotificationSettingsState,
  SecuritySettingsState,
  DataBackupConfigState,
  AuditLogItem,
} from '../../../lib/admin';

export default function SystemAdministrationPage() {
  // Global & header state
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [searchQuery, setSearchQuery] = useState('');

  // Configuration States
  const [generalConfig, setGeneralConfig] = useState<GeneralConfigState>(INITIAL_GENERAL_CONFIG);
  const [issueConfig, setIssueConfig] = useState<IssueManagementConfigState>(INITIAL_ISSUE_MANAGEMENT_CONFIG);
  const [aiConfig, setAiConfig] = useState<AIPrioritisationConfigState>(INITIAL_AI_PRIORITISATION_CONFIG);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>(INITIAL_NOTIFICATION_SETTINGS);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>(INITIAL_SECURITY_SETTINGS);
  const [backupConfig, setBackupConfig] = useState<DataBackupConfigState>(INITIAL_DATA_BACKUP_CONFIG);

  // Danger Zone States
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Audit Logs State & Filters
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('All');
  const [auditStatusFilter, setAuditStatusFilter] = useState('All');

  // Modals & Feedback Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'clear-cache' | 'reset-prefs' | 'maintenance' | 'backup' | 'export' | 'notice' | null;
    title: string;
    description: string;
    confirmLabel?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addAuditLog = (action: string, moduleName: 'System Administration' | 'Ward Management' | 'City Analytics' | 'Resource Allocation' | 'Reports & Export') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry: AuditLogItem = {
      id: `log-${Date.now()}`,
      time: timeStr,
      administrator: 'Admin User',
      action,
      module: moduleName,
      status: 'Success',
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Weight Calculation for AI Prioritisation
  const totalWeight =
    aiConfig.weights.severity +
    aiConfig.weights.publicImpact +
    aiConfig.weights.complaintFrequency +
    aiConfig.weights.locationRisk +
    aiConfig.weights.issueAge +
    aiConfig.weights.historicalRecurrence;

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.administrator.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesModule = auditModuleFilter === 'All' || log.module === auditModuleFilter;
    const matchesStatus = auditStatusFilter === 'All' || log.status === auditStatusFilter;
    return matchesSearch && matchesModule && matchesStatus;
  });

  // Modal Handlers
  const handleOpenNotice = (title: string, desc: string) => {
    setModalState({
      isOpen: true,
      type: 'notice',
      title,
      description: desc,
      confirmLabel: 'Understood',
      isDanger: false,
    });
  };

  const handleConfirmModalAction = () => {
    if (modalState.type === 'clear-cache') {
      showToast('Temporary cache and application transients successfully cleared.');
      addAuditLog('Cleared temporary application cache', 'System Administration');
    } else if (modalState.type === 'reset-prefs') {
      setGeneralConfig(INITIAL_GENERAL_CONFIG);
      setIssueConfig(INITIAL_ISSUE_MANAGEMENT_CONFIG);
      setAiConfig(INITIAL_AI_PRIORITISATION_CONFIG);
      setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
      setSecuritySettings(INITIAL_SECURITY_SETTINGS);
      showToast('All system configurations restored to factory defaults.');
      addAuditLog('Reset configurable system preferences to defaults', 'System Administration');
    } else if (modalState.type === 'maintenance') {
      const nextState = !maintenanceMode;
      setMaintenanceMode(nextState);
      showToast(nextState ? 'Maintenance mode ACTIVATED. Non-admin access restricted.' : 'Maintenance mode deactivated. Normal operations resumed.');
      addAuditLog(`Set Maintenance Mode to ${nextState ? 'ENABLED' : 'DISABLED'}`, 'System Administration');
    } else if (modalState.type === 'backup') {
      const now = new Date();
      const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setBackupConfig((prev) => ({
        ...prev,
        lastBackupTime: timeStr,
        lastBackupStatus: 'Successful',
      }));
      showToast(`Database snapshot created successfully (${timeStr}).`);
      addAuditLog('Triggered manual database backup snapshot', 'System Administration');
    } else if (modalState.type === 'export') {
      showToast('System configuration and audit records compiled for export.');
      addAuditLog('Exported full system audit and configuration package', 'System Administration');
    }
    setModalState({ isOpen: false, type: null, title: '', description: '' });
  };

  return (
    <div className={styles.container}>
      {/* ============================================================
          SIDEBAR NAVIGATION
          ============================================================ */}
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
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
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

          <Link href="/admin/resource-allocation" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span>Resource Allocation</span>
          </Link>

          <Link href="/admin/ward-management" className={styles.navItem}>
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

          <Link href="/admin/system-administration" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

      {/* ============================================================
          MAIN AREA
          ============================================================ */}
      <div className={styles.mainArea}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.searchBar}>
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
            <div className={styles.wardSelector}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                value={selectedWard}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  showToast(`Scope set to ${e.target.value}`);
                }}
              >
                <option value="All Wards">All Wards</option>
                <option value="Ward 1">Ward 1 - Mira Road</option>
                <option value="Ward 2">Ward 2 - Bhayandar West</option>
                <option value="Ward 3">Ward 3 - Bhayandar East</option>
                <option value="Ward 4">Ward 4 - GCC Road</option>
                <option value="Ward 5">Ward 5 - Station Area</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              onClick={() => showToast('8 high-priority municipal alerts active in system')}
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
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

        {/* ============================================================
            CONTENT AREA
            ============================================================ */}
        <main className={styles.content}>
          {/* Top Bar with Breadcrumb, Title & System Status */}
          <div className={styles.topBar}>
            <div className={styles.pageTitleGroup}>
              <div className={styles.breadcrumb}>
                <Link href="/admin/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
                <span>&gt;</span>
                <span>System Administration</span>
              </div>
              <h1 className={styles.pageTitle}>System Administration</h1>
              <p className={styles.pageSubtitle}>
                Configure system behaviour, security, notifications and operational settings for CivicPulse.
              </p>
            </div>

            <div className={styles.systemStatusPill}>
              <span className={styles.statusDot} />
              <span>System Status: Operational</span>
            </div>
          </div>

          {/* ============================================================
              4 KPI CARDS ROW
              ============================================================ */}
          <section className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SYSTEM_OVERVIEW_KPIS.uptime}</span>
                <span className={styles.kpiLabel}>System Uptime</span>
                <span className={styles.kpiSub}>{SYSTEM_OVERVIEW_KPIS.uptimeSecondary}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <polyline points="6 9 10 13 14 9 18 13" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SYSTEM_OVERVIEW_KPIS.recordsProcessed}</span>
                <span className={styles.kpiLabel}>Records Processed</span>
                <span className={styles.kpiSub}>{SYSTEM_OVERVIEW_KPIS.recordsSecondary}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SYSTEM_OVERVIEW_KPIS.activeUsers}</span>
                <span className={styles.kpiLabel}>Active Users</span>
                <span className={styles.kpiSub}>{SYSTEM_OVERVIEW_KPIS.usersSecondary}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiContent}>
                <span className={styles.kpiValue}>{SYSTEM_OVERVIEW_KPIS.securityHealth}</span>
                <span className={styles.kpiLabel}>Security Health</span>
                <span className={styles.kpiSub}>{SYSTEM_OVERVIEW_KPIS.securitySecondary}</span>
              </div>
              <div className={styles.kpiIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
            </div>
          </section>

          {/* ============================================================
              3-COLUMN MAIN ADMINISTRATION GRID
              ============================================================ */}
          <div className={styles.adminGrid}>
            {/* COLUMN 1: General Config, Issue Management, AI Prioritisation */}
            <div className={styles.adminCol}>
              {/* Card 1: General Configuration */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>General Configuration</h2>
                    <p className={styles.cardSubtitle}>Manage basic CivicPulse platform settings.</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City / Municipality</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={generalConfig.municipality}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, municipality: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Default Time Zone</label>
                  <select
                    className={styles.formSelect}
                    value={generalConfig.timeZone}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, timeZone: e.target.value })}
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Universal)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Default Language</label>
                  <select
                    className={styles.formSelect}
                    value={generalConfig.language}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, language: e.target.value })}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date Format</label>
                  <select
                    className={styles.formSelect}
                    value={generalConfig.dateFormat}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Auto Refresh Interval</label>
                  <select
                    className={styles.formSelect}
                    value={generalConfig.autoRefreshInterval}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, autoRefreshInterval: e.target.value })}
                  >
                    <option value="15 seconds">15 seconds</option>
                    <option value="30 seconds">30 seconds</option>
                    <option value="1 minute">1 minute</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="Manual Only">Manual Only</option>
                  </select>
                </div>

                <div className={styles.cardFooterRight}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      showToast('General platform configuration updated.');
                      addAuditLog('Saved general configuration changes', 'System Administration');
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Issue Management */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Issue Management</h2>
                    <p className={styles.cardSubtitle}>Configure how civic issues are processed and prioritised.</p>
                  </div>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleTextGroup}>
                    <span className={styles.toggleTitle}>Auto-assign Issues</span>
                    <span className={styles.toggleDesc}>Automatically assign new issues to the appropriate ward.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={issueConfig.autoAssignIssues}
                      onChange={(e) => {
                        setIssueConfig({ ...issueConfig, autoAssignIssues: e.target.checked });
                        showToast(`Auto-assignment ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        addAuditLog(`Toggled issue auto-assignment to ${e.target.checked}`, 'System Administration');
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleTextGroup}>
                    <span className={styles.toggleTitle}>Duplicate Issue Detection</span>
                    <span className={styles.toggleDesc}>Identify potentially duplicate complaints from the same area.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={issueConfig.duplicateDetection}
                      onChange={(e) => {
                        setIssueConfig({ ...issueConfig, duplicateDetection: e.target.checked });
                        showToast(`Duplicate detection ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        addAuditLog(`Toggled duplicate issue detection to ${e.target.checked}`, 'System Administration');
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleTextGroup}>
                    <span className={styles.toggleTitle}>Automatic Escalation</span>
                    <span className={styles.toggleDesc}>Escalate unresolved high-priority issues after the configured threshold.</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={issueConfig.automaticEscalation}
                      onChange={(e) => {
                        setIssueConfig({ ...issueConfig, automaticEscalation: e.target.checked });
                        showToast(`Automatic escalation ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        addAuditLog(`Toggled automatic escalation to ${e.target.checked}`, 'System Administration');
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Overdue Threshold</label>
                  <select
                    className={styles.formSelect}
                    value={issueConfig.overdueThreshold}
                    onChange={(e) => {
                      setIssueConfig({ ...issueConfig, overdueThreshold: e.target.value });
                      showToast(`Overdue threshold set to ${e.target.value}`);
                    }}
                  >
                    <option value="24 hours">24 hours</option>
                    <option value="48 hours">48 hours</option>
                    <option value="72 hours">72 hours</option>
                    <option value="96 hours">96 hours</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Default Issue Priority</label>
                  <select
                    className={styles.formSelect}
                    value={issueConfig.defaultPriority}
                    onChange={(e) => {
                      setIssueConfig({ ...issueConfig, defaultPriority: e.target.value as any });
                      showToast(`Default issue priority set to ${e.target.value}`);
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Card 3: AI Prioritisation */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>AI Prioritisation</h2>
                    <p className={styles.cardSubtitle}>Configure the AI-assisted priority recommendation framework.</p>
                  </div>
                </div>

                <div className={styles.aiSectionTop}>
                  <span className={styles.toggleTitle}>AI Prioritisation (AI-Assisted)</span>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={aiConfig.enabled}
                      onChange={(e) => {
                        setAiConfig({ ...aiConfig, enabled: e.target.checked });
                        showToast(`AI Prioritisation assistance ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        addAuditLog(`Toggled AI recommendation framework to ${e.target.checked}`, 'System Administration');
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.aiTwoCol}>
                  {/* Left: Factors */}
                  <div>
                    <div className={styles.aiSubHeading}>Priority Factors</div>
                    <div className={styles.factorList}>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.severity}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, severity: e.target.checked } })}
                        />
                        <span>Severity</span>
                      </label>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.publicImpact}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, publicImpact: e.target.checked } })}
                        />
                        <span>Public Impact</span>
                      </label>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.complaintFrequency}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, complaintFrequency: e.target.checked } })}
                        />
                        <span>Complaint Frequency</span>
                      </label>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.locationRisk}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, locationRisk: e.target.checked } })}
                        />
                        <span>Location Risk</span>
                      </label>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.issueAge}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, issueAge: e.target.checked } })}
                        />
                        <span>Issue Age</span>
                      </label>
                      <label className={styles.factorItem}>
                        <input
                          type="checkbox"
                          className={styles.factorCheckbox}
                          checked={aiConfig.factors.historicalRecurrence}
                          onChange={(e) => setAiConfig({ ...aiConfig, factors: { ...aiConfig.factors, historicalRecurrence: e.target.checked } })}
                        />
                        <span>Historical Recurrence</span>
                      </label>
                    </div>
                  </div>

                  {/* Right: Weight Configuration */}
                  <div>
                    <div className={styles.aiSubHeading}>Priority Weight Configuration (Total: {totalWeight}%)</div>
                    <div className={styles.weightList}>
                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Severity</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.severity}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, severity: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.severity}%</span>
                      </div>

                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Public Impact</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.publicImpact}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, publicImpact: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.publicImpact}%</span>
                      </div>

                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Complaint Frequency</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.complaintFrequency}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, complaintFrequency: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.complaintFrequency}%</span>
                      </div>

                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Location Risk</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.locationRisk}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, locationRisk: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.locationRisk}%</span>
                      </div>

                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Issue Age</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.issueAge}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, issueAge: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.issueAge}%</span>
                      </div>

                      <div className={styles.weightItem}>
                        <span className={styles.weightName}>Historical Recurrence</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiConfig.weights.historicalRecurrence}
                          className={styles.weightInputRange}
                          onChange={(e) => setAiConfig({ ...aiConfig, weights: { ...aiConfig.weights, historicalRecurrence: Number(e.target.value) } })}
                        />
                        <span className={styles.weightPct}>{aiConfig.weights.historicalRecurrence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: 8 }}>
                  <label className={styles.formLabel}>Recommendation Mode</label>
                  <select
                    className={styles.formSelect}
                    value={aiConfig.recommendationMode}
                    onChange={(e) => {
                      setAiConfig({ ...aiConfig, recommendationMode: e.target.value as any });
                      showToast(`AI Recommendation mode set to ${e.target.value}`);
                    }}
                  >
                    <option value="Human Review Required">Human Review Required</option>
                    <option value="Assisted Recommendation">Assisted Recommendation</option>
                    <option value="Automatic Recommendation">Automatic Recommendation</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Notification Settings, Security & Access, Data & Backup */}
            <div className={styles.adminCol}>
              {/* Card 1: Notification Settings & Channels */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Notification Settings</h2>
                    <p className={styles.cardSubtitle}>Configure administrative alerts and citizen/ward notifications.</p>
                  </div>
                </div>

                <div className={styles.splitCardLayout}>
                  {/* Left: Toggles */}
                  <div className={styles.splitLeftCol}>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>New Issue Notifications</span>
                        <span className={styles.toggleDesc}>Notify assigned ward staff when a new issue is created.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.newIssueNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, newIssueNotifications: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Critical Issue Alerts</span>
                        <span className={styles.toggleDesc}>Immediately notify authorised staff about critical issues.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.criticalIssueAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, criticalIssueAlerts: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Overdue Issue Alerts</span>
                        <span className={styles.toggleDesc}>Notify responsible staff when issues exceed the threshold.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.overdueIssueAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, overdueIssueAlerts: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Resolution Notifications</span>
                        <span className={styles.toggleDesc}>Notify citizens when their issue status changes.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.resolutionNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, resolutionNotifications: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>System Alerts</span>
                        <span className={styles.toggleDesc}>Notify administrators about important system events.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, systemAlerts: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => {
                          showToast('Notification policies successfully saved.');
                          addAuditLog('Saved notification preferences and alert triggers', 'System Administration');
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Save Notification Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Channels */}
                  <div className={styles.splitRightCol}>
                    <div className={styles.rightColTitle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Notification Channels</span>
                    </div>

                    <div className={styles.channelItem}>
                      <span className={styles.channelName}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        In-App
                      </span>
                      <span className={styles.badgeSuccess}>Enabled</span>
                    </div>

                    <div className={styles.channelItem}>
                      <span className={styles.channelName}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Email
                      </span>
                      <span className={styles.badgeSuccess}>Enabled</span>
                    </div>

                    <div className={styles.channelItem}>
                      <span className={styles.channelName}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        SMS
                      </span>
                      <span className={styles.badgeWarning}>Configuration Required</span>
                    </div>

                    <div className={styles.channelItem}>
                      <span className={styles.channelName}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                        Push Notification
                      </span>
                      <span className={styles.badgeWarning}>Configuration Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Security & Access */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Security & Access</h2>
                    <p className={styles.cardSubtitle}>Manage authentication and administrative security policies.</p>
                  </div>
                </div>

                <div className={styles.splitCardLayout}>
                  {/* Left: Security Controls */}
                  <div className={styles.splitLeftCol}>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Two-Factor Authentication</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth}
                          onChange={(e) => {
                            setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked });
                            showToast(`2FA Policy ${e.target.checked ? 'Enforced' : 'Optional'}`);
                            addAuditLog(`Updated 2FA enforcement to ${e.target.checked}`, 'System Administration');
                          }}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Session Timeout</label>
                      <select
                        className={styles.formSelect}
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => {
                          setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value });
                          showToast(`Session timeout set to ${e.target.value}`);
                        }}
                      >
                        <option value="15 minutes">15 minutes</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="1 hour">1 hour</option>
                        <option value="4 hours">4 hours</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Password Expiry</label>
                      <select
                        className={styles.formSelect}
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => {
                          setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value });
                          showToast(`Password expiry cycle set to ${e.target.value}`);
                        }}
                      >
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days</option>
                        <option value="90 days">90 days</option>
                        <option value="180 days">180 days</option>
                        <option value="Never">Never</option>
                      </select>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Failed Login Protection</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={securitySettings.failedLoginProtection}
                          onChange={(e) => {
                            setSecuritySettings({ ...securitySettings, failedLoginProtection: e.target.checked });
                            showToast(`Brute-force protection ${e.target.checked ? 'Active' : 'Disabled'}`);
                          }}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Audit Logging</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={securitySettings.auditLogging}
                          onChange={(e) => {
                            setSecuritySettings({ ...securitySettings, auditLogging: e.target.checked });
                            showToast(`Comprehensive audit logging ${e.target.checked ? 'Active' : 'Suspended'}`);
                          }}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>

                  {/* Right: Security Status */}
                  <div className={styles.splitRightCol}>
                    <div className={styles.rightColTitle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Security Status</span>
                    </div>

                    <div className={styles.statusRowItem}>
                      <span className={styles.statusRowName}>Authentication</span>
                      <span className={styles.badgeSuccess}>Protected</span>
                    </div>

                    <div className={styles.statusRowItem}>
                      <span className={styles.statusRowName}>Role-Based Access</span>
                      <span className={styles.badgeSuccess}>Enabled</span>
                    </div>

                    <div className={styles.statusRowItem}>
                      <span className={styles.statusRowName}>Audit Logging</span>
                      <span className={styles.badgeSuccess}>Enabled</span>
                    </div>

                    <div className={styles.statusRowItem}>
                      <span className={styles.statusRowName}>Session Protection</span>
                      <span className={styles.badgeSuccess}>Enabled</span>
                    </div>

                    <div className={styles.statusRowItem}>
                      <span className={styles.statusRowName}>Data Encryption</span>
                      <span className={styles.badgeWarning}>Configuration Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Data & Backup */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Data & Backup</h2>
                    <p className={styles.cardSubtitle}>Manage data retention and backup operations.</p>
                  </div>
                </div>

                <div className={styles.backupInfoRow}>
                  <div className={styles.backupInfoLeft}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Last Backup</span>
                  </div>
                  <div className={styles.backupInfoRight}>
                    <span>{backupConfig.lastBackupTime}</span>
                    <span className={styles.badgeSuccess}>{backupConfig.lastBackupStatus}</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Backup Frequency
                    </span>
                  </label>
                  <select
                    className={styles.formSelect}
                    value={backupConfig.backupFrequency}
                    onChange={(e) => {
                      setBackupConfig({ ...backupConfig, backupFrequency: e.target.value });
                      showToast(`Backup frequency set to ${e.target.value}`);
                    }}
                  >
                    <option value="Realtime">Realtime Mirroring</option>
                    <option value="Daily">Daily (02:00 AM IST)</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      Data Retention
                    </span>
                  </label>
                  <select
                    className={styles.formSelect}
                    value={backupConfig.dataRetention}
                    onChange={(e) => {
                      setBackupConfig({ ...backupConfig, dataRetention: e.target.value });
                      showToast(`Data retention period set to ${e.target.value}`);
                    }}
                  >
                    <option value="90 days">90 days</option>
                    <option value="180 days">180 days</option>
                    <option value="365 days">365 days (1 Year)</option>
                    <option value="7 years">7 years (Statutory)</option>
                  </select>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleTextGroup}>
                    <span className={styles.toggleTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Automatic Backup
                    </span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={backupConfig.automaticBackup}
                      onChange={(e) => {
                        setBackupConfig({ ...backupConfig, automaticBackup: e.target.checked });
                        showToast(`Automated snapshot schedule ${e.target.checked ? 'Active' : 'Disabled'}`);
                      }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.backupActionsRow}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        type: 'backup',
                        title: 'Initiate Manual Database Backup',
                        description: 'This will trigger a point-in-time snapshot of the municipal database, geo-issue ledger, and audit registers.',
                        confirmLabel: 'Create Backup Now',
                        isDanger: false,
                      })
                    }
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Create Backup</span>
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        type: 'export',
                        title: 'Export Platform Data',
                        description: 'Export all municipal issue logs, user directories, and system telemetry in structured JSON / CSV formats.',
                        confirmLabel: 'Export Data Package',
                        isDanger: false,
                      })
                    }
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Export Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 3: System Health, Performance, Audit Log */}
            <div className={styles.adminCol}>
              {/* Card 1: System Health */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>System Health</h2>
                    <p className={styles.cardSubtitle}>Monitor the health of major CivicPulse services.</p>
                  </div>
                </div>

                <div className={styles.healthList}>
                  {SYSTEM_HEALTH_SERVICES.map((srv) => (
                    <div key={srv.id} className={styles.healthItem}>
                      <div className={styles.healthLeft}>
                        <span className={styles.healthServiceName}>{srv.name}</span>
                        <span className={styles.healthServiceDesc}>{srv.description}</span>
                      </div>
                      {srv.status === 'Operational' ? (
                        <span className={styles.badgeSuccess}>Operational</span>
                      ) : (
                        <span className={styles.badgeInfo}>Prototype</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: System Performance */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>System Performance</h2>
                  </div>
                </div>

                <div className={styles.perfList}>
                  <div className={styles.perfItem}>
                    <div className={styles.perfHeader}>
                      <span className={styles.perfLabel}>CPU Usage</span>
                      <span className={styles.perfValue}>{SYSTEM_PERFORMANCE_METRICS.cpuUsage}%</span>
                    </div>
                    <div className={styles.perfBarBg}>
                      <div className={styles.perfBarFill} style={{ width: `${SYSTEM_PERFORMANCE_METRICS.cpuUsage}%` }} />
                    </div>
                  </div>

                  <div className={styles.perfItem}>
                    <div className={styles.perfHeader}>
                      <span className={styles.perfLabel}>Memory Usage</span>
                      <span className={styles.perfValue}>{SYSTEM_PERFORMANCE_METRICS.memoryUsage}%</span>
                    </div>
                    <div className={styles.perfBarBg}>
                      <div className={styles.perfBarFill} style={{ width: `${SYSTEM_PERFORMANCE_METRICS.memoryUsage}%` }} />
                    </div>
                  </div>

                  <div className={styles.perfItem}>
                    <div className={styles.perfHeader}>
                      <span className={styles.perfLabel}>Database Usage</span>
                      <span className={styles.perfValue}>{SYSTEM_PERFORMANCE_METRICS.databaseUsage}%</span>
                    </div>
                    <div className={styles.perfBarBg}>
                      <div className={styles.perfBarFill} style={{ width: `${SYSTEM_PERFORMANCE_METRICS.databaseUsage}%` }} />
                    </div>
                  </div>

                  <div className={styles.perfItem}>
                    <div className={styles.perfHeader}>
                      <span className={styles.perfLabel}>API Response</span>
                      <span className={styles.perfValue}>{SYSTEM_PERFORMANCE_METRICS.apiResponseMs} ms</span>
                    </div>
                    <div className={styles.perfBarBg}>
                      <div className={styles.perfBarFill} style={{ width: '28%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Recent Administrative Activity (Audit Log) */}
              <div className={styles.adminCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Recent Administrative Activity</h2>
                  </div>
                </div>

                <div className={styles.auditFilterRow}>
                  <input
                    type="text"
                    className={styles.auditSearchInput}
                    placeholder="Search activity..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                  />
                  <select
                    className={styles.auditSelect}
                    value={auditModuleFilter}
                    onChange={(e) => setAuditModuleFilter(e.target.value)}
                  >
                    <option value="All">All Modules</option>
                    <option value="System Administration">System Administration</option>
                    <option value="Ward Management">Ward Management</option>
                    <option value="Resource Allocation">Resource Allocation</option>
                    <option value="Reports & Export">Reports & Export</option>
                  </select>
                  <select
                    className={styles.auditSelect}
                    value={auditStatusFilter}
                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Success">Success</option>
                    <option value="Warning">Warning</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className={styles.auditTableWrapper}>
                  <table className={styles.auditTable}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Administrator</th>
                        <th>Action</th>
                        <th>Module</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.slice(0, 6).map((log) => (
                        <tr key={log.id}>
                          <td className={styles.auditTime}>{log.time}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              {log.administrator}
                            </span>
                          </td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action}</td>
                          <td>{log.module}</td>
                          <td>
                            <span className={styles.badgeSuccess}>{log.status}</span>
                          </td>
                        </tr>
                      ))}
                      {filteredAuditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '16px 8px', color: '#64748b' }}>
                            No activity entries match filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              DANGER ZONE (FULL WIDTH BOTTOM PANEL)
              ============================================================ */}
          <section className={styles.dangerZoneCard}>
            <div className={styles.dangerHeaderCol}>
              <div className={styles.dangerTriangleIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.dangerTitleGroup}>
                <h3 className={styles.dangerTitle}>Danger Zone</h3>
                <p className={styles.dangerSubtitle}>
                  Actions in this section can affect the entire CivicPulse system.
                </p>
              </div>
            </div>

            <div className={styles.dangerActionsGroup}>
              {/* Item 1: Clear Temporary Data */}
              <div className={styles.dangerItem}>
                <div className={styles.dangerItemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <div className={styles.dangerItemText}>
                  <span className={styles.dangerItemTitle}>Clear Temporary Data</span>
                  <span className={styles.dangerItemDesc}>Remove temporary cached application data.</span>
                </div>
                <button
                  type="button"
                  className={styles.btnDangerOutline}
                  onClick={() =>
                    setModalState({
                      isOpen: true,
                      type: 'clear-cache',
                      title: 'Clear Temporary Application Cache?',
                      description: 'This will purge client session caches, GIS map tiles cache, and temporary analytics aggregations without affecting stored tickets.',
                      confirmLabel: 'Clear Cache',
                      isDanger: true,
                    })
                  }
                >
                  Clear Cache
                </button>
              </div>

              {/* Item 2: Reset System Preferences */}
              <div className={styles.dangerItem}>
                <div className={styles.dangerItemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </div>
                <div className={styles.dangerItemText}>
                  <span className={styles.dangerItemTitle}>Reset System Preferences</span>
                  <span className={styles.dangerItemDesc}>Restore configurable system preferences to their default values.</span>
                </div>
                <button
                  type="button"
                  className={styles.btnDangerOutline}
                  onClick={() =>
                    setModalState({
                      isOpen: true,
                      type: 'reset-prefs',
                      title: 'Reset System Preferences to Default?',
                      description: 'All municipality parameters, notification toggles, and AI factor weightings will revert back to standard municipal baseline settings.',
                      confirmLabel: 'Reset Preferences',
                      isDanger: true,
                    })
                  }
                >
                  Reset Preferences
                </button>
              </div>

              {/* Item 3: Maintenance Mode */}
              <div className={styles.dangerItem}>
                <div className={styles.dangerItemIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div className={styles.dangerItemText}>
                  <span className={styles.dangerItemTitle}>Maintenance Mode</span>
                  <span className={styles.dangerItemDesc}>Temporarily restrict normal user access while maintenance is performed.</span>
                </div>
                <label className={`${styles.toggleSwitch} ${styles.toggleSwitchDanger}`}>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={() =>
                      setModalState({
                        isOpen: true,
                        type: 'maintenance',
                        title: maintenanceMode ? 'Deactivate Maintenance Mode?' : 'Activate System Maintenance Mode?',
                        description: maintenanceMode
                          ? 'This will immediately re-open the public portals and officer mobile dispatch apps.'
                          : 'This will lock citizen reporting and field worker portals, allowing access solely to Super Administrators.',
                        confirmLabel: maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance',
                        isDanger: true,
                      })
                    }
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ============================================================
          INTERACTIVE MODALS
          ============================================================ */}
      {modalState.isOpen && (
        <div className={styles.modalBackdrop} onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '' })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalState.isDanger ? (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {modalState.title}
                  </span>
                ) : (
                  modalState.title
                )}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '' })}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>{modalState.description}</div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '' })}
              >
                Cancel
              </button>
              {modalState.confirmLabel && (
                <button
                  type="button"
                  className={modalState.isDanger ? styles.btnDangerOutline : styles.btnPrimary}
                  onClick={handleConfirmModalAction}
                >
                  {modalState.confirmLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TOAST FEEDBACK
          ============================================================ */}
      {toastMessage && (
        <div className={styles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
