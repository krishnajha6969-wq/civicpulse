'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './settings.module.css';
import {
  INITIAL_SETTINGS_STATE,
  INITIAL_INTEGRATIONS_LIST,
  INITIAL_ISSUE_CATEGORIES,
  INITIAL_ADMIN_SESSIONS,
  CivicPulseSettingsState,
  ConnectedIntegrationItem,
  IssueCategorySetting,
  AdminSessionItem,
} from '../../../lib/admin';

export default function SettingsPage() {
  // Navigation & global scope state
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [activeTab, setActiveTab] = useState<string>('General');
  const [settingsSearch, setSettingsSearch] = useState('');

  // Primary configuration state
  const [cleanState, setCleanState] = useState<CivicPulseSettingsState>(INITIAL_SETTINGS_STATE);
  const [settings, setSettings] = useState<CivicPulseSettingsState>(INITIAL_SETTINGS_STATE);
  const [integrations, setIntegrations] = useState<ConnectedIntegrationItem[]>(INITIAL_INTEGRATIONS_LIST);
  const [categories, setCategories] = useState<IssueCategorySetting[]>(INITIAL_ISSUE_CATEGORIES);
  const [sessions, setSessions] = useState<AdminSessionItem[]>(INITIAL_ADMIN_SESSIONS);

  // Dirty state tracking
  const isDirty = useMemo(() => {
    return JSON.stringify(cleanState) !== JSON.stringify(settings);
  }, [cleanState, settings]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Modals state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'configure-int' | 'categories' | 'add-category' | 'danger' | 'unsaved-warning' | null;
    title: string;
    description: string;
    confirmLabel?: string;
    isDanger?: boolean;
    selectedIntegration?: ConnectedIntegrationItem | null;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
    selectedIntegration: null,
  });

  // Category addition modal form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Save / Discard Actions
  const handleSave = () => {
    setCleanState(settings);
    showToast('Settings saved successfully.');
  };

  const handleDiscard = () => {
    setSettings(cleanState);
    showToast('Unsaved changes discarded.');
  };

  // Danger Zone Actions
  const handleConfirmDanger = (actionType: string) => {
    if (actionType === 'clear-cache') {
      showToast('Temporary application data cleared locally.');
    } else if (actionType === 'reset-prefs') {
      setSettings((prev) => ({
        ...prev,
        showWardBoundaries: true,
        enableAIRecommendations: true,
        enableBetaFeatures: false,
        defaultAnalyticsPeriod: 'Last 30 Days',
        highContrastMode: false,
        largerText: false,
        reduceMotion: false,
      }));
      showToast('User preferences restored to default.');
    } else if (actionType === 'reset-all') {
      setSettings(INITIAL_SETTINGS_STATE);
      setCleanState(INITIAL_SETTINGS_STATE);
      showToast('All system configurations restored to baseline.');
    }
    setModalState({ isOpen: false, type: null, title: '', description: '', selectedIntegration: null });
  };

  const tabs = [
    { id: 'General', label: 'General', icon: '⚙️' },
    { id: 'Notifications', label: 'Notifications', icon: '🔔' },
    { id: 'Issue & Workflow', label: 'Issue & Workflow', icon: '🔀' },
    { id: 'Integrations', label: 'Integrations', icon: '🔗' },
    { id: 'Localization', label: 'Localization', icon: '🌐' },
    { id: 'Appearance', label: 'Appearance', icon: '👁️' },
    { id: 'Data & Privacy', label: 'Data & Privacy', icon: '🛡️' },
    { id: 'Security', label: 'Security', icon: '🔒' },
    { id: 'System Preferences', label: 'System Preferences', icon: '🎛️' },
    { id: 'Advanced', label: 'Advanced', icon: '⚡' },
  ];

  // Helper check for search match
  const matchesSearch = (text: string) => {
    if (!settingsSearch.trim()) return true;
    return text.toLowerCase().includes(settingsSearch.toLowerCase());
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

          <Link href="/admin/system-administration" className={styles.navItem}>
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

          <Link href="/admin/settings" className={`${styles.navItem} ${styles.navItemActive}`}>
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
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
            />
          </div>

          <div className={styles.headerActions}>
            <div className={styles.wardSelector}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
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
              onClick={() => showToast('8 operational alerts registered in platform')}
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
          {/* Top Bar with Breadcrumb, Title & Global Save */}
          <div className={styles.topBar}>
            <div className={styles.pageTitleGroup}>
              <div className={styles.breadcrumb}>
                <Link href="/admin/dashboard" className={styles.breadcrumbLink}>Dashboard</Link>
                <span>&gt;</span>
                <span>Settings</span>
              </div>
              <h1 className={styles.pageTitle}>Settings</h1>
              <p className={styles.pageSubtitle}>
                Manage application preferences, notifications, integrations and city-specific configurations for CivicPulse.
              </p>
            </div>

            <div className={styles.topBarActions}>
              <input
                type="text"
                className={styles.settingsSearchInput}
                placeholder="Search settings..."
                value={settingsSearch}
                onChange={(e) => setSettingsSearch(e.target.value)}
              />
              {isDirty && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleDiscard}
                >
                  Discard Changes
                </button>
              )}
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!isDirty}
                onClick={handleSave}
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

          {/* ============================================================
              NAVIGATION TABS ROW (Exact match with screenshot)
              ============================================================ */}
          <div className={styles.navTabsRow}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabPill} ${activeTab === tab.id ? styles.tabPillActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (settingsSearch) setSettingsSearch('');
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ============================================================
              2-COLUMN SETTINGS GRID
              ============================================================ */}
          <div className={styles.settingsGrid}>
            {/* ──── LEFT COLUMN ──── */}
            <div className={styles.settingsCol}>
              {/* Card 1: General Settings */}
              {(activeTab === 'General' || activeTab === 'All' || matchesSearch('General') || matchesSearch('Municipality') || matchesSearch('Time Zone')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>General Settings</h2>
                      <p className={styles.cardSubtitle}>Basic application and city configuration.</p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City / Municipality</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={settings.municipality}
                      onChange={(e) => setSettings({ ...settings, municipality: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Application Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Default Time Zone</label>
                    <select
                      className={styles.formSelect}
                      value={settings.timeZone}
                      onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC (Universal)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Default Language</label>
                    <select
                      className={styles.formSelect}
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    >
                      <option value="English">English</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date Format</label>
                    <select
                      className={styles.formSelect}
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
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
                      value={settings.autoRefreshInterval}
                      onChange={(e) => setSettings({ ...settings, autoRefreshInterval: e.target.value })}
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
                      onClick={handleSave}
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
              )}

              {/* Card 2: Issue & Workflow Settings */}
              {(activeTab === 'General' || activeTab === 'Issue & Workflow' || activeTab === 'All' || matchesSearch('Issue') || matchesSearch('Workflow') || matchesSearch('Escalation')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Issue &amp; Workflow Settings</h2>
                      <p className={styles.cardSubtitle}>Configure default behaviour for issue management.</p>
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
                        checked={settings.autoAssignIssues}
                        onChange={(e) => setSettings({ ...settings, autoAssignIssues: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleTextGroup}>
                      <span className={styles.toggleTitle}>Duplicate Issue Detection</span>
                      <span className={styles.toggleDesc}>Identify potentially duplicate complaints.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.duplicateDetection}
                        onChange={(e) => setSettings({ ...settings, duplicateDetection: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleTextGroup}>
                      <span className={styles.toggleTitle}>Automatic Escalation</span>
                      <span className={styles.toggleDesc}>Escalate unresolved high-priority issues after threshold.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.automaticEscalation}
                        onChange={(e) => setSettings({ ...settings, automaticEscalation: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Overdue Threshold</label>
                    <select
                      className={styles.formSelect}
                      value={settings.overdueThreshold}
                      onChange={(e) => setSettings({ ...settings, overdueThreshold: e.target.value })}
                    >
                      <option value="24 hours">24 hours</option>
                      <option value="48 hours">48 hours</option>
                      <option value="72 hours">72 hours</option>
                      <option value="7 days">7 days</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Default Issue Priority</label>
                    <select
                      className={styles.formSelect}
                      value={settings.defaultPriority}
                      onChange={(e) => setSettings({ ...settings, defaultPriority: e.target.value as any })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Workflow Lifecycle Stepper & Category Management Trigger */}
                  <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Lifecycle Stepper</span>
                      <button
                        type="button"
                        className={styles.btnConfigure}
                        onClick={() =>
                          setModalState({
                            isOpen: true,
                            type: 'categories',
                            title: 'Manage Issue Categories',
                            description: 'Add, rename or toggle civic issue classifications.',
                          })
                        }
                      >
                        + Manage Categories ({categories.filter((c) => c.enabled).length})
                      </button>
                    </div>

                    <div className={styles.workflowStepper}>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>1</div>
                        <span className={styles.stepName}>Reported</span>
                      </div>
                      <span className={styles.stepArrow}>→</span>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>2</div>
                        <span className={styles.stepName}>Review</span>
                      </div>
                      <span className={styles.stepArrow}>→</span>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>3</div>
                        <span className={styles.stepName}>Assigned</span>
                      </div>
                      <span className={styles.stepArrow}>→</span>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>4</div>
                        <span className={styles.stepName}>In Progress</span>
                      </div>
                      <span className={styles.stepArrow}>→</span>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>5</div>
                        <span className={styles.stepName}>Resolved</span>
                      </div>
                      <span className={styles.stepArrow}>→</span>
                      <div className={styles.stepItem}>
                        <div className={styles.stepCircle}>6</div>
                        <span className={styles.stepName}>Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Localization & Accessibility */}
              {(activeTab === 'General' || activeTab === 'Localization' || activeTab === 'Appearance' || activeTab === 'All' || matchesSearch('Language') || matchesSearch('Accessibility')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Localization &amp; Accessibility</h2>
                      <p className={styles.cardSubtitle}>Manage language options and accessibility preferences.</p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Available Languages</label>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.langEnglish}
                          onChange={(e) => setSettings({ ...settings, langEnglish: e.target.checked })}
                        />
                        <span>English</span>
                      </label>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.langMarathi}
                          onChange={(e) => setSettings({ ...settings, langMarathi: e.target.checked })}
                        />
                        <span>Marathi</span>
                      </label>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.langHindi}
                          onChange={(e) => setSettings({ ...settings, langHindi: e.target.checked })}
                        />
                        <span>Hindi</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ alignItems: 'flex-start' }}>
                    <label className={styles.formLabel} style={{ marginTop: 4 }}>Accessibility Options</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.highContrastMode}
                          onChange={(e) => setSettings({ ...settings, highContrastMode: e.target.checked })}
                        />
                        <span>High Contrast Mode</span>
                      </label>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.largerText}
                          onChange={(e) => setSettings({ ...settings, largerText: e.target.checked })}
                        />
                        <span>Larger Text</span>
                      </label>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={settings.reduceMotion}
                          onChange={(e) => setSettings({ ...settings, reduceMotion: e.target.checked })}
                        />
                        <span>Reduce Motion</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ──── RIGHT COLUMN ──── */}
            <div className={styles.settingsCol}>
              {/* Card 1: Notification Preferences */}
              {(activeTab === 'General' || activeTab === 'Notifications' || activeTab === 'All' || matchesSearch('Notification') || matchesSearch('Alerts')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Notification Preferences</h2>
                      <p className={styles.cardSubtitle}>Configure system and user notifications.</p>
                    </div>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleTextGroup}>
                      <span className={styles.toggleTitle}>New Issue Notifications</span>
                      <span className={styles.toggleDesc}>Notify assigned ward staff when a new issue is created.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.newIssueNotifications}
                        onChange={(e) => setSettings({ ...settings, newIssueNotifications: e.target.checked })}
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
                        checked={settings.criticalIssueAlerts}
                        onChange={(e) => setSettings({ ...settings, criticalIssueAlerts: e.target.checked })}
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
                        checked={settings.overdueIssueAlerts}
                        onChange={(e) => setSettings({ ...settings, overdueIssueAlerts: e.target.checked })}
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
                        checked={settings.resolutionNotifications}
                        onChange={(e) => setSettings({ ...settings, resolutionNotifications: e.target.checked })}
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
                        checked={settings.systemAlerts}
                        onChange={(e) => setSettings({ ...settings, systemAlerts: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              )}

              {/* Card 2: Integrations */}
              {(activeTab === 'General' || activeTab === 'Integrations' || activeTab === 'All' || matchesSearch('Integration') || matchesSearch('Maps') || matchesSearch('SMS') || matchesSearch('Email')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Integrations</h2>
                      <p className={styles.cardSubtitle}>Configure external services used by CivicPulse.</p>
                    </div>
                  </div>

                  {integrations.map((item) => (
                    <div key={item.id} className={styles.integrationItem}>
                      <div className={styles.integrationLeft}>
                        <span>{item.name}</span>
                      </div>
                      <div className={styles.integrationActions}>
                        {item.status === 'Connected' ? (
                          <span className={styles.badgeConnected}>Connected</span>
                        ) : (
                          <span className={styles.badgeNotConfigured}>Not Configured</span>
                        )}
                        <button
                          type="button"
                          className={styles.btnConfigure}
                          onClick={() =>
                            setModalState({
                              isOpen: true,
                              type: 'configure-int',
                              title: `Configure ${item.name}`,
                              description: `Manage endpoint routing and API authentication tokens for ${item.service}.`,
                              selectedIntegration: item,
                            })
                          }
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                          <span>Configure</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Card 3: Data & Privacy */}
              {(activeTab === 'General' || activeTab === 'Data & Privacy' || activeTab === 'All' || matchesSearch('Data') || matchesSearch('Privacy') || matchesSearch('Retention')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>Data &amp; Privacy</h2>
                      <p className={styles.cardSubtitle}>Manage data retention, export and privacy settings.</p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Data Retention Period</label>
                    <select
                      className={styles.formSelect}
                      value={settings.dataRetentionPeriod}
                      onChange={(e) => setSettings({ ...settings, dataRetentionPeriod: e.target.value })}
                    >
                      <option value="90 days">90 days</option>
                      <option value="180 days">180 days</option>
                      <option value="365 days">365 days (1 Year)</option>
                      <option value="3 years">3 years</option>
                      <option value="Indefinitely">Indefinitely</option>
                    </select>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleTextGroup}>
                      <span className={styles.toggleTitle}>Allow Data Export</span>
                      <span className={styles.toggleDesc}>Allow authorised users to export report data.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.allowDataExport}
                        onChange={(e) => setSettings({ ...settings, allowDataExport: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.toggleRow}>
                    <div className={styles.toggleTextGroup}>
                      <span className={styles.toggleTitle}>Anonymise Citizen Data</span>
                      <span className={styles.toggleDesc}>Mask personal details in exported reports.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.anonymiseCitizenData}
                        onChange={(e) => setSettings({ ...settings, anonymiseCitizenData: e.target.checked })}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              )}

              {/* Card 4: System Preferences */}
              {(activeTab === 'General' || activeTab === 'System Preferences' || activeTab === 'All' || matchesSearch('Preferences') || matchesSearch('AI') || matchesSearch('Boundaries')) && (
                <div className={styles.settingsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </div>
                    <div className={styles.cardHeaderText}>
                      <h2 className={styles.cardTitle}>System Preferences</h2>
                      <p className={styles.cardSubtitle}>Additional application preferences.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={settings.showWardBoundaries}
                        onChange={(e) => setSettings({ ...settings, showWardBoundaries: e.target.checked })}
                      />
                      <span>Show ward boundaries on map</span>
                    </label>

                    <label className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={settings.enableAIRecommendations}
                        onChange={(e) => setSettings({ ...settings, enableAIRecommendations: e.target.checked })}
                      />
                      <span>Enable AI-assisted recommendations</span>
                    </label>

                    <label className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={settings.enableBetaFeatures}
                        onChange={(e) => setSettings({ ...settings, enableBetaFeatures: e.target.checked })}
                      />
                      <span>Enable beta features (early access)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ──── ADDITIONAL FULL-WIDTH / DEDICATED SECTIONS ──── */}

            {/* Security & Active Sessions Section */}
            {(activeTab === 'Security' || activeTab === 'All' || matchesSearch('Security') || matchesSearch('Session')) && (
              <div className={styles.settingsCard} style={{ gridColumn: 'span 2' }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className={styles.cardHeaderText}>
                    <h2 className={styles.cardTitle}>Administrator Security &amp; Active Sessions</h2>
                    <p className={styles.cardSubtitle}>Control authentication timeouts and active administrative credentials.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Session Timeout</label>
                      <select
                        className={styles.formSelect}
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                      >
                        <option value="15 minutes">15 minutes</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="1 hour">1 hour</option>
                        <option value="4 hours">4 hours</option>
                      </select>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Require Re-authentication</span>
                        <span className={styles.toggleDesc}>Prompt for password before sensitive system actions.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={settings.requireReauth}
                          onChange={(e) => setSettings({ ...settings, requireReauth: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>

                    <div className={styles.toggleRow}>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleTitle}>Login Attempt Protection</span>
                        <span className={styles.toggleDesc}>Lock accounts temporarily after consecutive failures.</span>
                      </div>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={settings.loginAttemptProtection}
                          onChange={(e) => setSettings({ ...settings, loginAttemptProtection: e.target.checked })}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(8,15,29,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      Active Sessions
                    </div>
                    {sessions.map((sess) => (
                      <div key={sess.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#f1f5f9' }}>{sess.device}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{sess.location} • {sess.user}</span>
                        </div>
                        {sess.isCurrent ? (
                          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10 }}>Current</span>
                        ) : (
                          <button
                            type="button"
                            className={styles.btnDangerOutline}
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => {
                              setSessions(sessions.filter((s) => s.id !== sess.id));
                              showToast('Remote session terminated.');
                            }}
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced & Danger Zone */}
            {(activeTab === 'Advanced' || activeTab === 'All' || matchesSearch('Advanced') || matchesSearch('Danger')) && (
              <section className={styles.dangerZoneCard}>
                <div className={styles.dangerHeader}>
                  <div className={styles.dangerTriangleIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className={styles.dangerTitleGroup}>
                    <h3 className={styles.dangerTitle}>Danger Zone &amp; Advanced Operations</h3>
                    <p className={styles.dangerSubtitle}>
                      Careful: actions in this section can reset administrative preferences or affect application states.
                    </p>
                  </div>
                </div>

                <div className={styles.dangerItemsRow}>
                  <div className={styles.dangerItem}>
                    <div className={styles.dangerItemText}>
                      <span className={styles.dangerItemTitle}>Clear Temporary Data</span>
                      <span className={styles.dangerItemDesc}>Remove locally cached dashboard state.</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnDangerOutline}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'danger',
                          title: 'Clear Temporary Cache Data?',
                          description: 'This will purge local map tiles cache and temporary aggregations.',
                          confirmLabel: 'Clear Data',
                          isDanger: true,
                        })
                      }
                    >
                      Clear Data
                    </button>
                  </div>

                  <div className={styles.dangerItem}>
                    <div className={styles.dangerItemText}>
                      <span className={styles.dangerItemTitle}>Reset User Preferences</span>
                      <span className={styles.dangerItemDesc}>Restore display settings to defaults.</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnDangerOutline}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'danger',
                          title: 'Reset User Preferences?',
                          description: 'Theme accents, high contrast and map toggles will revert to municipal defaults.',
                          confirmLabel: 'Reset Preferences',
                          isDanger: true,
                        })
                      }
                    >
                      Reset Preferences
                    </button>
                  </div>

                  <div className={styles.dangerItem}>
                    <div className={styles.dangerItemText}>
                      <span className={styles.dangerItemTitle}>Reset System Configuration</span>
                      <span className={styles.dangerItemDesc}>Restore all parameters to baseline values.</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnDangerOutline}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          type: 'danger',
                          title: 'Reset All System Configuration?',
                          description: 'This will revert all general parameters, SLAs, notification triggers, and retention policies.',
                          confirmLabel: 'Reset Configuration',
                          isDanger: true,
                        })
                      }
                    >
                      Reset Configuration
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ============================================================
              STICKY BOTTOM ACTIONS (when changes are made)
              ============================================================ */}
          {isDirty && (
            <div className={styles.unsavedStickyBar}>
              <div className={styles.unsavedTextGroup}>
                <span className={styles.unsavedDot} />
                <span className={styles.unsavedTitle}>Unsaved Changes</span>
                <span className={styles.unsavedDesc}>You have modified configuration parameters.</span>
              </div>
              <div className={styles.unsavedActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleDiscard}
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}
      {modalState.isOpen && (
        <div className={styles.modalBackdrop} onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '', selectedIntegration: null })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalState.isDanger ? (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
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
                onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '', selectedIntegration: null })}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: '0 0 12px' }}>{modalState.description}</p>

              {/* Integration Configure view */}
              {modalState.type === 'configure-int' && modalState.selectedIntegration && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Service Provider</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      readOnly
                      value={modalState.selectedIntegration.service}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <span className={modalState.selectedIntegration.status === 'Connected' ? styles.badgeConnected : styles.badgeNotConfigured}>
                      {modalState.selectedIntegration.status}
                    </span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>API Key / Secret</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      readOnly
                      value={modalState.selectedIntegration.maskedKey}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Note: Secrets are masked for security. Updates require elevated Super Admin credentials.
                  </div>
                </div>
              )}

              {/* Categories view */}
              {modalState.type === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.map((cat) => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(8,15,29,0.5)', borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e8f0' }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{cat.description}</div>
                        </div>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={cat.enabled}
                            onChange={(e) => {
                              const updated = categories.map((c) => (c.id === cat.id ? { ...c, enabled: e.target.checked } : c));
                              setCategories(updated);
                            }}
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="New category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => {
                        if (!newCatName.trim()) return;
                        const newCat: IssueCategorySetting = {
                          id: `cat-${Date.now()}`,
                          name: newCatName.trim(),
                          description: 'Custom municipality category',
                          enabled: true,
                        };
                        setCategories([...categories, newCat]);
                        setNewCatName('');
                        showToast(`Category "${newCat.name}" added.`);
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setModalState({ isOpen: false, type: null, title: '', description: '', selectedIntegration: null })}
              >
                Close
              </button>
              {modalState.type === 'danger' && modalState.confirmLabel && (
                <button
                  type="button"
                  className={styles.btnDangerOutline}
                  onClick={() => {
                    if (modalState.confirmLabel?.includes('Clear')) handleConfirmDanger('clear-cache');
                    else if (modalState.confirmLabel?.includes('Preferences')) handleConfirmDanger('reset-prefs');
                    else handleConfirmDanger('reset-all');
                  }}
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
