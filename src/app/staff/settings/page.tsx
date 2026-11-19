'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCurrentUser,
  logout,
  loginWardStaff,
  DEFAULT_WARD_STAFF,
  AuthUser,
  updateUserProfile,
  StaffNotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  StaffAppPreferences,
  getAppPreferences,
  saveAppPreferences,
} from '../../../lib/auth';
import { STAFF_TODAY_ACTIVITY, getWardStaffIssues } from '../../../lib/staff';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './settings.module.css';

export default function StaffSettingsPage() {
  const router = useRouter();

  // ── Authentication & User State ──
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

  // ── Modals & Toast State ──
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

  // ── Edit Profile Modal State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Notification Preferences State ──
  const [notifPrefs, setNotifPrefs] = useState<StaffNotificationPreferences>(() =>
    getNotificationPreferences()
  );

  // ── Change Password State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── App Preferences State ──
  const [appPrefs, setAppPrefs] = useState<StaffAppPreferences>(() => getAppPreferences());

  // ── Sync with Auth on Mount ──
  useEffect(() => {
    const usr = getCurrentUser();
    if (usr && (usr.role === 'ward_staff' || usr.role === 'super_admin')) {
      setUser(usr);
    } else {
      const demoStaff = loginWardStaff(selectedWard);
      setUser(demoStaff);
    }

    const handleUserUpdate = () => {
      const updated = getCurrentUser();
      if (updated) setUser(updated);
    };

    window.addEventListener('civicpulse_user_updated', handleUserUpdate);
    return () => window.removeEventListener('civicpulse_user_updated', handleUserUpdate);
  }, [selectedWard]);

  // ── Handle Logout ──
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // ── Open Edit Profile Modal ──
  const handleOpenEdit = () => {
    setEditName(user?.name || 'Sandeep Jadhav');
    setEditEmail(user?.email || 'sandeep.jadhav@mbmc.gov.in');
    setEditPhone(user?.phone || '+91 98765 43210');
    setIsEditModalOpen(true);
  };

  // ── Save Edited Profile ──
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Name cannot be blank.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      showToast('Please provide a valid email address.');
      return;
    }

    const updated = updateUserProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    });
    setUser(updated);
    setIsEditModalOpen(false);
    showToast('Profile information updated successfully.');
  };

  // ── Handle Avatar Photo Upload ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size exceeds 3MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = updateUserProfile({ avatarUrl: result });
      setUser(updated);
      showToast('Profile photograph updated.');
    };
    reader.readAsDataURL(file);
  };

  // ── Toggle Notification Preference ──
  const handleTogglePref = (key: keyof StaffNotificationPreferences) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updated);
    saveNotificationPreferences(updated);
    showToast('Notification preferences updated.');
  };

  // ── Handle Password Update ──
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.');
      return;
    }
    if (!/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      showToast('Password must contain numbers and at least one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Confirm password does not match new password.');
      return;
    }

    // Success simulation with real validation
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast(`Password successfully updated for ${user?.name || 'Sandeep Jadhav'}.`);
  };

  // ── Handle App Preferences Change ──
  const handleAppPrefChange = (key: keyof StaffAppPreferences, value: string) => {
    const updated = {
      ...appPrefs,
      [key]: value,
    };
    setAppPrefs(updated);
    saveAppPreferences(updated);
    showToast(`${key === 'language' ? 'Language' : 'Theme'} preference saved.`);
  };

  // ── Download Activity Log ──
  const handleDownloadActivityLog = () => {
    try {
      const issues = getWardStaffIssues(selectedWard);
      const rows = [
        'Timestamp,Event Type,Record Identifier,Action Details,Operator,Jurisdiction',
        `"${new Date().toISOString()}","SESSION_LOGIN","AUTH-3042","Authorized login verified with 2FA","${user?.name || 'Sandeep Jadhav'}","Ward 3"`,
        ...STAFF_TODAY_ACTIVITY.map(
          (act) =>
            `"${act.timestamp}","${act.type.toUpperCase()}","${act.id}","${act.title} - ${act.subtitle}","${user?.name || 'Sandeep Jadhav'}","Ward 3"`
        ),
        ...issues.slice(0, 10).map(
          (i) =>
            `"${i.assignedDate}","ISSUE_DISPATCH","${i.id}","Assigned to ${i.assignedTeam || 'Team 1'} [${i.title.replace(/"/g, '""')}]","${user?.name || 'Sandeep Jadhav'}","Ward 3"`
        ),
      ];

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Sandeep_Jadhav_Ward3_Activity_Log.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Activity log exported: ${filename}`);
    } catch {
      showToast('Error exporting activity log.');
    }
  };

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

        {/* 5. Ward Reports */}
        <Link href="/staff/ward-reports" className={styles.navItem}>
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Ward Reports
        </Link>

        {/* 6. Profile & Settings (ACTIVE) */}
        <Link href="/staff/settings" className={`${styles.navItem} ${styles.navItemActive}`}>
          <span className={styles.navActiveIndicator} />
          <span className={styles.navIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" strokeWidth="2.5">
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
          <div className={styles.promoText}>Cleaner wards stronger communities.</div>
          <div className={styles.promoSubtext}>Your work today makes a better Mira Bhayandar.</div>
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
              placeholder="Search issues, reports, teams, or settings..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerRight}>
            {/* Ward Selector Pill */}
            <button
              type="button"
              className={styles.wardPill}
              onClick={() => showToast('Active Jurisdiction: Ward 3 (Mira Bhayandar Municipal Corporation)')}
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
              onClick={() => showToast('5 active operational alerts in Ward 3 queue')}
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
                <div className={styles.profileAvatarSmall} suppressHydrationWarning>
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || 'Sandeep Jadhav'}
                      width={34}
                      height={34}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    'SJ'
                  )}
                </div>
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
                      showToast('Viewing your active profile and ward assignments');
                    }}
                  >
                    Staff Profile Details
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
              1. PAGE BANNER
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
                <span className={styles.crumbActive}>Profile &amp; Settings</span>
              </div>
              <h1 className={styles.bannerTitle}>Profile &amp; Settings</h1>
              <p className={styles.bannerSubtitle}>
                Manage your personal details, ward information, preferences and security settings.
              </p>
            </div>

            <div className={styles.bannerRightSlogan}>
              <span className={styles.sloganLine}>Your Role</span>
              <span className={styles.sloganLine}>Our Cleaner Ward</span>
              <span className={styles.sloganLine}>Mira Bhayandar</span>
              <svg className={styles.sloganSmileCurve} viewBox="0 0 90 10" fill="none">
                <path d="M2 2C25 10 65 10 88 2" stroke="#00e599" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ============================================================
              2. MAIN CONTENT GRID (LEFT: My Profile | RIGHT: Stacked Cards)
              ============================================================ */}
          <div className={styles.contentGrid}>
            {/* ── Left Column: My Profile Card ── */}
            <div className={styles.panelCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <div className={styles.cardHeaderTitle}>My Profile</div>
                  <div className={styles.cardHeaderSubtitle}>View and update your personal information.</div>
                </div>
              </div>

              {/* Avatar & Main Info Header */}
              <div className={styles.profileHeaderSection}>
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarLarge}>
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name || 'Sandeep Jadhav'}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      'SJ'
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.cameraBtn}
                    onClick={() => fileInputRef.current?.click()}
                    title="Change profile photo"
                    aria-label="Upload photo"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className={styles.profileHeaderText}>
                  <div className={styles.profileHeaderNameRow}>
                    <span className={styles.profileMainName}>{user?.name || 'Sandeep Jadhav'}</span>
                    <span className={styles.activeBadge}>
                      <span className={styles.activeDot} />
                      Active
                    </span>
                  </div>
                  <span className={styles.profileMainRole}>Ward Staff</span>
                  <span className={styles.profileMainLocation}>
                    {user?.location || 'Ward 3, Mira Bhayandar'}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className={styles.profileFieldsList}>
                {/* 1. Full Name */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Full Name</span>
                      <span className={styles.fieldValue}>{user?.name || 'Sandeep Jadhav'}</span>
                    </div>
                  </div>
                  <button type="button" className={styles.editActionBtn} onClick={handleOpenEdit}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* 2. Email Address */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Email Address</span>
                      <span className={styles.fieldValue}>{user?.email || 'sandeep.jadhav@mbmc.gov.in'}</span>
                    </div>
                  </div>
                  <button type="button" className={styles.editActionBtn} onClick={handleOpenEdit}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* 3. Phone Number */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Phone Number</span>
                      <span className={styles.fieldValue}>{user?.phone || '+91 98765 43210'}</span>
                    </div>
                  </div>
                  <button type="button" className={styles.editActionBtn} onClick={handleOpenEdit}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* 4. Employee ID (Locked) */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Employee ID</span>
                      <span className={styles.fieldValue}>{user?.employeeId || 'MBMC-WS-0142'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Department (Locked) */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Department</span>
                      <span className={styles.fieldValue}>{user?.department || 'Road Maintenance'}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Joining Date (Locked) */}
                <div className={styles.profileFieldItem}>
                  <div className={styles.fieldLeft}>
                    <div className={styles.fieldIconBox}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>Joining Date</span>
                      <span className={styles.fieldValue}>{user?.joiningDate || '15 Jan 2023'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: Stacked Cards ── */}
            <div className={styles.rightColumn}>
              {/* ============================================================
                  A. UPPER RIGHT: Ward & Assignment Details
                  ============================================================ */}
              <div className={styles.panelCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.cardHeaderTitle}>Ward &amp; Assignment Details</div>
                    <div className={styles.cardHeaderSubtitle}>Your current ward, team and role information.</div>
                  </div>
                </div>

                <div className={styles.assignmentCardsRow}>
                  {/* 1. Ward */}
                  <div className={styles.subDetailCard}>
                    <div className={`${styles.subCardIconBox} ${styles.iconBlue}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className={styles.subCardText}>
                      <span className={styles.subCardLabel}>Ward</span>
                      <span className={styles.subCardMain}>{user?.assignedWard || 'Ward 3'}</span>
                      <span className={styles.subCardSub}>Mira Bhayandar</span>
                    </div>
                  </div>

                  {/* 2. Assigned Team */}
                  <div className={styles.subDetailCard}>
                    <div className={`${styles.subCardIconBox} ${styles.iconPurple}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className={styles.subCardText}>
                      <span className={styles.subCardLabel}>Assigned Team</span>
                      <span className={styles.subCardMain}>{user?.assignedTeam || 'Team 1'}</span>
                      <span className={styles.subCardSub}>{user?.teamSpecialty || 'Road Maintenance'}</span>
                    </div>
                  </div>

                  {/* 3. Department */}
                  <div className={styles.subDetailCard}>
                    <div className={`${styles.subCardIconBox} ${styles.iconAmber}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2" />
                      </svg>
                    </div>
                    <div className={styles.subCardText}>
                      <span className={styles.subCardLabel}>Department</span>
                      <span className={styles.subCardMain}>{user?.department || 'Road Maintenance'}</span>
                      <span className={styles.subCardSub}>{user?.division || 'Public Works'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  B. MIDDLE ROW: Notification Preferences + Change Password
                  ============================================================ */}
              <div className={styles.midTwoCardsRow}>
                {/* ── Notification Preferences Card ── */}
                <div className={styles.panelCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardHeaderIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <div>
                      <div className={styles.cardHeaderTitle}>Notification Preferences</div>
                      <div className={styles.cardHeaderSubtitle}>Choose what updates and alerts you want to receive.</div>
                    </div>
                  </div>

                  <div className={styles.notificationTogglesList}>
                    {/* 1. New issue assignments */}
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleLeft}>
                        <div className={styles.toggleIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            <path d="M9 12h6M9 16h6" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>New issue assignments</div>
                          <div className={styles.toggleDesc}>
                            Get notified when new issues are assigned to your ward or team
                          </div>
                        </div>
                      </div>
                      <div
                        className={`${styles.switchTrack} ${notifPrefs.newAssignments ? styles.switchTrackOn : ''}`}
                        onClick={() => handleTogglePref('newAssignments')}
                        role="switch"
                        aria-checked={notifPrefs.newAssignments}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTogglePref('newAssignments')}
                      >
                        <div
                          className={`${styles.switchThumb} ${notifPrefs.newAssignments ? styles.switchThumbOn : ''}`}
                        />
                      </div>
                    </div>

                    {/* 2. Status updates */}
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleLeft}>
                        <div className={styles.toggleIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Status updates</div>
                          <div className={styles.toggleDesc}>
                            Get notified about status changes in your assigned issues
                          </div>
                        </div>
                      </div>
                      <div
                        className={`${styles.switchTrack} ${notifPrefs.statusUpdates ? styles.switchTrackOn : ''}`}
                        onClick={() => handleTogglePref('statusUpdates')}
                        role="switch"
                        aria-checked={notifPrefs.statusUpdates}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTogglePref('statusUpdates')}
                      >
                        <div
                          className={`${styles.switchThumb} ${notifPrefs.statusUpdates ? styles.switchThumbOn : ''}`}
                        />
                      </div>
                    </div>

                    {/* 3. Overdue alerts */}
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleLeft}>
                        <div className={styles.toggleIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Overdue alerts</div>
                          <div className={styles.toggleDesc}>Get alerts for issues that are overdue</div>
                        </div>
                      </div>
                      <div
                        className={`${styles.switchTrack} ${notifPrefs.overdueAlerts ? styles.switchTrackOn : ''}`}
                        onClick={() => handleTogglePref('overdueAlerts')}
                        role="switch"
                        aria-checked={notifPrefs.overdueAlerts}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTogglePref('overdueAlerts')}
                      >
                        <div
                          className={`${styles.switchThumb} ${notifPrefs.overdueAlerts ? styles.switchThumbOn : ''}`}
                        />
                      </div>
                    </div>

                    {/* 4. Field team updates */}
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleLeft}>
                        <div className={styles.toggleIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Field team updates</div>
                          <div className={styles.toggleDesc}>
                            Get notified about field team activities and location updates
                          </div>
                        </div>
                      </div>
                      <div
                        className={`${styles.switchTrack} ${notifPrefs.fieldTeamUpdates ? styles.switchTrackOn : ''}`}
                        onClick={() => handleTogglePref('fieldTeamUpdates')}
                        role="switch"
                        aria-checked={notifPrefs.fieldTeamUpdates}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTogglePref('fieldTeamUpdates')}
                      >
                        <div
                          className={`${styles.switchThumb} ${notifPrefs.fieldTeamUpdates ? styles.switchThumbOn : ''}`}
                        />
                      </div>
                    </div>

                    {/* 5. System announcements */}
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleLeft}>
                        <div className={styles.toggleIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>System announcements</div>
                          <div className={styles.toggleDesc}>
                            Important updates from the civic administration
                          </div>
                        </div>
                      </div>
                      <div
                        className={`${styles.switchTrack} ${notifPrefs.systemAnnouncements ? styles.switchTrackOn : ''}`}
                        onClick={() => handleTogglePref('systemAnnouncements')}
                        role="switch"
                        aria-checked={notifPrefs.systemAnnouncements}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTogglePref('systemAnnouncements')}
                      >
                        <div
                          className={`${styles.switchThumb} ${notifPrefs.systemAnnouncements ? styles.switchThumbOn : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Change Password Card ── */}
                <div className={styles.panelCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardHeaderIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <div>
                      <div className={styles.cardHeaderTitle}>Change Password</div>
                      <div className={styles.cardHeaderSubtitle}>Update your account password.</div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                    {/* Current Password */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Current Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={styles.formInput}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeToggleBtn}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label="Toggle password visibility"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showCurrentPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={styles.formInput}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeToggleBtn}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label="Toggle new password visibility"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showNewPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                      <span className={styles.passwordHint}>
                        Minimum 8 characters with letters, numbers and a special character.
                      </span>
                    </div>

                    {/* Confirm New Password */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={styles.formInput}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeToggleBtn}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle confirm password visibility"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {showConfirmPassword ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>

                    <button type="submit" className={styles.updatePasswordBtn}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>

              {/* ============================================================
                  C. BOTTOM ROW: App Preferences + Account Actions
                  ============================================================ */}
              <div className={styles.bottomTwoCardsRow}>
                {/* ── App Preferences Card ── */}
                <div className={styles.panelCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardHeaderIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </span>
                    <div>
                      <div className={styles.cardHeaderTitle}>App Preferences</div>
                      <div className={styles.cardHeaderSubtitle}>Customize your experience.</div>
                    </div>
                  </div>

                  <div>
                    {/* Language Preference */}
                    <div className={styles.prefRow}>
                      <div className={styles.prefLeft}>
                        <div className={styles.fieldIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Language</div>
                          <div className={styles.toggleDesc}>Choose your preferred language</div>
                        </div>
                      </div>

                      <div className={styles.prefSelectWrapper}>
                        <select
                          value={appPrefs.language}
                          onChange={(e) => handleAppPrefChange('language', e.target.value)}
                          className={styles.prefSelect}
                          aria-label="App Language"
                        >
                          <option value="English">English</option>
                          <option value="Marathi">मराठी (Marathi)</option>
                          <option value="Hindi">हिंदी (Hindi)</option>
                        </select>
                        <span className={styles.selectArrow}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Theme Preference */}
                    <div className={styles.prefRow}>
                      <div className={styles.prefLeft}>
                        <div className={styles.fieldIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Theme</div>
                          <div className={styles.toggleDesc}>Choose between light and dark theme</div>
                        </div>
                      </div>

                      <div className={styles.prefSelectWrapper}>
                        <select
                          value={appPrefs.theme}
                          onChange={(e) => handleAppPrefChange('theme', e.target.value)}
                          className={styles.prefSelect}
                          aria-label="App Theme"
                        >
                          <option value="Dark (Default)">Dark (Default)</option>
                          <option value="Light">Light (Experimental)</option>
                        </select>
                        <span className={styles.selectArrow}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Account Actions Card ── */}
                <div className={styles.panelCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardHeaderIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                    </span>
                    <div>
                      <div className={styles.cardHeaderTitle}>Account Actions</div>
                      <div className={styles.cardHeaderSubtitle}>Manage your account session and data.</div>
                    </div>
                  </div>

                  <div>
                    {/* Download Activity Log */}
                    <div className={styles.actionRow}>
                      <div className={styles.prefLeft}>
                        <div className={styles.fieldIconBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Download My Activity Log</div>
                          <div className={styles.toggleDesc}>Export your recent activities and updates</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.actionBtnDownload}
                        onClick={handleDownloadActivityLog}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className={styles.actionRow}>
                      <div className={styles.prefLeft}>
                        <div className={styles.fieldIconBox} style={{ color: '#ef4444' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </div>
                        <div>
                          <div className={styles.toggleTitle}>Sign Out</div>
                          <div className={styles.toggleDesc}>Securely sign out from your account</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.actionBtnSignOut}
                        onClick={handleLogout}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Edit Profile Information</div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close dialog"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={styles.formInput}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
