'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, AuthUser } from '../../../lib/auth';
import {
  getCitizenNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  getNotificationTabCounts,
  getUnreadNotificationCount,
  CivicNotification,
  NotificationCategory,
} from '../../../lib/notifications';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './notifications.module.css';

type TabFilter = 'all' | NotificationCategory;
type SortOption = 'newest' | 'oldest';

function NotificationsContent() {
  const router = useRouter();

  // Authentication
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Notice Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({ isOpen: false, title: '', message: '', stageNote: '', badge: 'CivicPulse Alert' });

  const openNotice = useCallback(
    (title: string, message: string, stageNote = 'Civic Service Desk', badge = 'Notice') => {
      setModalState({ isOpen: true, title, message, stageNote, badge });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Notification State
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Load notifications from storage
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    // Simulated async fetch — read from localStorage via lib
    const timer = setTimeout(() => {
      const loaded = getCitizenNotifications(user.id);
      setNotifications(loaded);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [user]);

  // Listen for external updates (e.g., other tabs marking read)
  useEffect(() => {
    if (!user) return;
    function handleUpdate() {
      setNotifications(getCitizenNotifications(user!.id));
    }
    window.addEventListener('civicpulse_notifications_updated', handleUpdate);
    return () => window.removeEventListener('civicpulse_notifications_updated', handleUpdate);
  }, [user]);

  // Tab counts
  const tabCounts = useMemo(() => getNotificationTabCounts(notifications), [notifications]);

  // Unread count for header badge
  const totalUnread = useMemo(() => {
    if (!user) return 0;
    return getUnreadNotificationCount(user.id);
  }, [user, notifications]);

  // Filtered + searched + sorted notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((n) => n.category === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.previewMessage.toLowerCase().includes(q) ||
          (n.reportTitle && n.reportTitle.toLowerCase().includes(q)) ||
          (n.reportTicketId && n.reportTicketId.toLowerCase().includes(q)) ||
          n.badgeLabel.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) =>
      sortOption === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );

    return result;
  }, [notifications, activeTab, searchQuery, sortOption]);

  // Selected notification
  const selectedNotification = useMemo(() => {
    if (!filteredNotifications.length) return null;
    if (selectedNotifId) {
      const found = filteredNotifications.find((n) => n.id === selectedNotifId);
      if (found) return found;
    }
    return filteredNotifications[0];
  }, [filteredNotifications, selectedNotifId]);

  // Auto-select first notification when filter changes
  useEffect(() => {
    if (selectedNotification && selectedNotification.id !== selectedNotifId) {
      setSelectedNotifId(selectedNotification.id);
    }
  }, [selectedNotification, selectedNotifId]);

  // Handle selecting a notification
  const handleSelectNotification = useCallback(
    (notif: CivicNotification) => {
      if (!user) return;
      setSelectedNotifId(notif.id);
      setOverflowMenuOpen(false);
      setMobileShowDetail(true);

      // Mark as read
      if (!notif.isRead) {
        const updated = markNotificationAsRead(user.id, notif.id);
        setNotifications(updated);
      }
    },
    [user]
  );

  // Handle mark as read/unread toggle from detail panel
  const handleToggleRead = useCallback(() => {
    if (!user || !selectedNotification) return;
    let updated;
    if (selectedNotification.isRead) {
      updated = markNotificationAsUnread(user.id, selectedNotification.id);
    } else {
      updated = markNotificationAsRead(user.id, selectedNotification.id);
    }
    setNotifications(updated);
    setOverflowMenuOpen(false);
  }, [user, selectedNotification]);

  // Handle mark all as read
  const handleMarkAllRead = useCallback(() => {
    if (!user) return;
    const updated = markAllNotificationsAsRead(user.id);
    setNotifications(updated);
  }, [user]);

  // Logout
  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // User initials
  const initials = useMemo(() => {
    if (!user?.name) return 'C';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }, [user]);

  // Get icon class based on visual type
  const getIconClass = (type: string) => {
    switch (type) {
      case 'resolved': return styles.notifIconResolved;
      case 'in_progress': return styles.notifIconInProgress;
      case 'assigned': return styles.notifIconAssigned;
      case 'warning': return styles.notifIconWarning;
      case 'announcement': return styles.notifIconAnnouncement;
      case 'system': return styles.notifIconSystem;
      default: return styles.notifIconSystem;
    }
  };

  // Get badge class
  const getBadgeClass = (label: string) => {
    switch (label) {
      case 'Update': return styles.badgeUpdate;
      case 'Announcement': return styles.badgeAnnouncement;
      case 'System': return styles.badgeSystem;
      default: return styles.badgeUpdate;
    }
  };

  // Status badge class
  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'resolved': return styles.statusResolved;
      case 'in_progress': return styles.statusInProgress;
      case 'awaiting': return styles.statusAwaiting;
      default: return styles.statusAwaiting;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'resolved': return 'Resolved';
      case 'in_progress': return 'In Progress';
      case 'awaiting': return 'Awaiting Update';
      default: return 'Pending';
    }
  };

  // Timeline dot class
  const getTimelineDotClass = (type: string) => {
    switch (type) {
      case 'resolved': return styles.timelineDotResolved;
      case 'progress': return styles.timelineDotProgress;
      case 'assigned': return styles.timelineDotAssigned;
      case 'submitted': return styles.timelineDotSubmitted;
      default: return styles.timelineDotProgress;
    }
  };

  // Render notification icon SVG
  const renderNotifIcon = (type: string, size = 20) => {
    switch (type) {
      case 'resolved':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'assigned':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
        );
      case 'warning':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'announcement':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'system':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
    }
  };

  // Timeline icon render
  const renderTimelineIcon = (type: string) => {
    switch (type) {
      case 'resolved':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'progress':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'assigned':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
        );
      case 'submitted':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  // Auth Guard
  if (!user || (user.role !== 'citizen' && user.role !== 'super_admin')) {
    return (
      <div className={styles.authRequiredWrap}>
        <div className={styles.authCard}>
          <div className={styles.lockIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>Authentication Required</h1>
          <p className={styles.authMessage}>
            You must be signed in with a verified citizen account to view your notifications.
          </p>
          <div className={styles.authActions}>
            <button type="button" className={styles.authPrimaryBtn} onClick={() => router.push('/auth/login?destination=/citizen/notifications')}>
              Citizen Sign In
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
    <div className={styles.dashboardContainer}>
      {/* ── Left Sidebar Navigation (Citizen Portal) ── */}
      <aside className={styles.sidebar} aria-label="Citizen portal navigation">
        <Link href="/" className={styles.sidebarBrand}>
          <div className={styles.brandLogo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>CITIZEN PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard */}
          <Link href="/citizen" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Report an Issue */}
          <Link href="/citizen/report-issue" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            <span className={styles.navLabel}>Report an Issue</span>
          </Link>

          {/* 3. My Reports */}
          <Link href="/citizen/my-reports" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className={styles.navLabel}>My Reports</span>
          </Link>

          {/* 4. Notifications (Active) */}
          <Link
            href="/citizen/notifications"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className={styles.navLabel}>Notifications</span>
            {totalUnread > 0 && <span className={styles.navBadge}>{totalUnread}</span>}
          </Link>

          {/* 5. Community */}
          <Link href="/citizen/community" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className={styles.navLabel}>Community</span>
          </Link>

          {/* 6. Help & Support */}
          <Link href="/citizen/help-support" className={styles.navItem}>
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

        {/* Sidebar Bottom Promo Card */}
        <div className={styles.sidebarPromoCard}>
          <Image
            src="/images/dashboard/sidebar-promo-iso.png"
            alt="Neighbourhood civic initiative"
            width={200}
            height={95}
            className={styles.sidebarPromoImg}
          />
          <h4 className={styles.sidebarPromoTitle}>A cleaner neighbourhood starts with you.</h4>
          <p className={styles.sidebarPromoSub}>Report. Track. See change.</p>
        </div>
      </aside>

      {/* ── Main Viewport ── */}
      <div className={styles.mainViewport}>
        {/* Topbar Header */}
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search for your reports, areas or issue types..."
              aria-label="Search reports"
            />
          </div>

          <div className={styles.topbarRight}>
            <div
              className={styles.locationBadge}
              role="button"
              tabIndex={0}
              aria-label="Select location"
              onClick={() => openNotice('Location Verification', 'Current municipality: Mira Bhayandar, Maharashtra. Ward 3 & 4 active zone.', 'Verified Municipal Boundary', 'Jurisdiction')}
            >
              <span className={styles.locationIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>{user?.location || 'Mira Bhayandar'}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              aria-label="View notifications"
              aria-current="page"
              style={{ borderColor: 'rgba(92, 235, 170, 0.4)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5cebaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {totalUnread > 0 && (
                <span className={styles.notifBadgeCount}>{totalUnread}</span>
              )}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.userProfileTrigger}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
                suppressHydrationWarning
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={36}
                    height={36}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.initialsAvatar} suppressHydrationWarning>{initials}</div>
                )}
                <div className={styles.userInfo} suppressHydrationWarning>
                  <span className={styles.userName} suppressHydrationWarning>{user.name}</span>
                  <span className={styles.userRole}>Citizen</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className={styles.profileMenuDropdown}>
                  <button type="button" className={styles.menuItem} onClick={() => openNotice('Profile Settings', 'View and update your citizen profile, contact information, and notification preferences.', 'Account Management', 'Profile')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    My Profile
                  </button>
                  <button type="button" className={styles.menuItem} onClick={() => openNotice('Preferences', 'Configure municipal notifications and language options.')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    Preferences
                  </button>
                  <div className={styles.menuDivider} />
                  <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content Area ── */}
        <div className={styles.contentScroll}>
          {/* Heading Banner */}
          <section className={styles.headingBanner}>
            <div className={styles.bannerBreadcrumb}>
              <Link href="/citizen" className={styles.crumbLink}>Dashboard</Link>
              <span className={styles.crumbSep}>›</span>
              <span className={styles.crumbActive}>Notifications</span>
            </div>
            <h1 className={styles.bannerHeading}>Notifications</h1>
            <p className={styles.bannerSubtitle}>
              Stay updated on your reports and important announcements.
            </p>
          </section>

          {/* ── Two-Column Layout ── */}
          <div className={styles.notificationsLayout}>
            {/* ── Left Panel ── */}
            <div className={styles.leftPanel} style={mobileShowDetail ? { display: undefined } : undefined}>
              {/* Category Tabs */}
              <div className={styles.categoryTabs} role="tablist" aria-label="Notification categories">
                {([
                  { key: 'all', label: 'All', count: tabCounts.all },
                  { key: 'updates', label: 'Updates', count: tabCounts.updates },
                  { key: 'announcements', label: 'Announcements', count: tabCounts.announcements },
                  { key: 'system', label: 'System', count: tabCounts.system },
                ] as { key: TabFilter; label: string; count: number }[]).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    className={`${styles.categoryTab} ${activeTab === tab.key ? styles.categoryTabActive : ''}`}
                    onClick={() => { setActiveTab(tab.key); setMobileShowDetail(false); }}
                  >
                    {tab.label}
                    <span className={styles.tabCount}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search + Sort */}
              <div className={styles.filterControls}>
                <div className={styles.notifSearchWrap}>
                  <span className={styles.notifSearchIcon} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    className={styles.notifSearchInput}
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search notifications"
                  />
                </div>
                <select
                  className={styles.sortSelect}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  aria-label="Sort notifications"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                {totalUnread > 0 && (
                  <button type="button" className={styles.markAllReadBtn} onClick={handleMarkAllRead} aria-label="Mark all notifications as read">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className={styles.notificationList} role="listbox" aria-label="Notifications list">
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skel-${i}`} className={styles.skeletonCard} aria-hidden="true">
                      <div className={styles.skeletonIcon} />
                      <div className={styles.skeletonLines}>
                        <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                        <div className={styles.skeletonLine} />
                        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                      </div>
                    </div>
                  ))
                ) : filteredNotifications.length === 0 ? (
                  // Empty state
                  searchQuery.trim() ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <h3 className={styles.emptyTitle}>No notifications found</h3>
                      <p className={styles.emptyDesc}>Try another search term or clear your filters.</p>
                      <button type="button" className={styles.emptyActionBtn} onClick={() => setSearchQuery('')}>
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h3 className={styles.emptyTitle}>You&apos;re all caught up</h3>
                      <p className={styles.emptyDesc}>
                        When there are updates about your reports or relevant announcements, you&apos;ll see them here.
                      </p>
                      <button type="button" className={styles.emptyActionBtn} onClick={() => router.push('/citizen')}>
                        Go to Dashboard
                      </button>
                    </div>
                  )
                ) : (
                  // Notification rows
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      role="option"
                      aria-selected={selectedNotification?.id === notif.id}
                      className={`${styles.notifCard} ${selectedNotification?.id === notif.id ? styles.notifCardSelected : ''} ${!notif.isRead ? styles.notifCardUnread : ''}`}
                      onClick={() => handleSelectNotification(notif)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectNotification(notif); } }}
                    >
                      <div className={`${styles.notifIconWrap} ${getIconClass(notif.visualType)}`}>
                        {renderNotifIcon(notif.visualType)}
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifTitleRow}>
                          <span className={styles.notifTitle}>{notif.title}</span>
                          <span className={`${styles.notifBadge} ${getBadgeClass(notif.badgeLabel)}`}>{notif.badgeLabel}</span>
                        </div>
                        <p className={styles.notifPreview}>{notif.previewMessage}</p>
                        <span className={styles.notifTime}>{notif.timeAgo}</span>
                      </div>
                      <div className={styles.notifMeta}>
                        {!notif.isRead && <span className={styles.unreadDot} aria-label="Unread" />}
                        <span className={styles.chevron}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Right Detail Panel ── */}
            <div className={`${styles.rightPanel} ${!mobileShowDetail ? styles.rightPanelHidden : ''}`} style={!selectedNotification && !isLoading ? { display: undefined } : undefined}>
              {/* Mobile back button */}
              <button type="button" className={styles.mobileBackBtn} onClick={() => setMobileShowDetail(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Notifications
              </button>

              {selectedNotification ? (
                <>
                  {/* Detail Header */}
                  <div className={styles.detailHeader} style={{ position: 'relative' }}>
                    <div className={styles.detailHeaderTop}>
                      <div className={`${styles.detailIconWrap} ${getIconClass(selectedNotification.visualType)}`}>
                        {renderNotifIcon(selectedNotification.visualType, 22)}
                      </div>
                      <div className={styles.detailTitleBlock}>
                        <h2 className={styles.detailTitle}>{selectedNotification.title}</h2>
                        <span className={styles.detailTime}>{selectedNotification.timeAgo}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.detailMoreBtn}
                        onClick={() => setOverflowMenuOpen((prev) => !prev)}
                        aria-label="More options"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    </div>

                    {/* Overflow menu */}
                    {overflowMenuOpen && (
                      <div className={styles.overflowMenu}>
                        <button type="button" className={styles.overflowMenuItem} onClick={handleToggleRead}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {selectedNotification.isRead ? (
                              <>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </>
                            ) : (
                              <polyline points="20 6 9 17 4 12" />
                            )}
                          </svg>
                          {selectedNotification.isRead ? 'Mark as Unread' : 'Mark as Read'}
                        </button>
                      </div>
                    )}

                    <p className={styles.detailMessage}>{selectedNotification.message}</p>
                  </div>

                  {/* Related Report Card (for report-related notifications) */}
                  {selectedNotification.reportId && (
                    <div className={styles.reportDetailsSection}>
                      <div className={styles.reportDetailsLabel}>Report Details</div>
                      <div
                        className={styles.reportCard}
                        onClick={() => router.push(`/citizen/my-reports?reportId=${selectedNotification.reportId}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/citizen/my-reports?reportId=${selectedNotification.reportId}`); }}
                      >
                        {selectedNotification.reportImageUrl && (
                          <Image
                            src={selectedNotification.reportImageUrl}
                            alt={selectedNotification.reportTitle || 'Report'}
                            width={64}
                            height={52}
                            className={styles.reportThumb}
                          />
                        )}
                        <div className={styles.reportCardInfo}>
                          <h4 className={styles.reportCardTitle}>{selectedNotification.reportTitle}</h4>
                          <div className={styles.reportBadges}>
                            <span className={`${styles.statusBadge} ${getStatusClass(selectedNotification.reportStatus)}`}>
                              {selectedNotification.reportStatus === 'resolved' && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              )}
                              {getStatusLabel(selectedNotification.reportStatus)}
                            </span>
                            {selectedNotification.reportPriority && (
                              <span className={`${styles.priorityBadge} ${selectedNotification.reportPriority === 'High priority' ? styles.priorityHigh : selectedNotification.reportPriority === 'Medium priority' ? styles.priorityMedium : styles.priorityLow}`}>
                                {selectedNotification.reportPriority}
                              </span>
                            )}
                          </div>
                          <div className={styles.reportMeta}>
                            {selectedNotification.reportLocation && (
                              <span className={styles.reportMetaItem}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {selectedNotification.reportLocation}
                              </span>
                            )}
                            {selectedNotification.reportReportedDate && (
                              <span className={styles.reportMetaItem}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {selectedNotification.reportReportedDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={styles.reportChevron}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Announcement Details */}
                  {selectedNotification.announcementDetails && (
                    <div className={styles.announcementDetails}>
                      <div className={styles.reportDetailsLabel}>Announcement Details</div>
                      <div className={styles.announcementCard}>
                        {selectedNotification.announcementDetails.ward && (
                          <div className={styles.announcementRow}>
                            <span className={styles.announcementLabel}>Ward:</span>
                            <span className={styles.announcementValue}>{selectedNotification.announcementDetails.ward}</span>
                          </div>
                        )}
                        {selectedNotification.announcementDetails.department && (
                          <div className={styles.announcementRow}>
                            <span className={styles.announcementLabel}>Dept:</span>
                            <span className={styles.announcementValue}>{selectedNotification.announcementDetails.department}</span>
                          </div>
                        )}
                        {selectedNotification.announcementDetails.effectiveDate && (
                          <div className={styles.announcementRow}>
                            <span className={styles.announcementLabel}>Effective:</span>
                            <span className={styles.announcementValue}>{selectedNotification.announcementDetails.effectiveDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Updates Timeline */}
                  {selectedNotification.timeline && selectedNotification.timeline.length > 0 && (
                    <div className={styles.timelineSection}>
                      <h3 className={styles.timelineSectionTitle}>Recent Updates</h3>
                      <div className={styles.timelineList}>
                        {selectedNotification.timeline.map((item) => (
                          <div key={item.id} className={styles.timelineItem}>
                            <div className={`${styles.timelineDot} ${getTimelineDotClass(item.type)}`}>
                              {renderTimelineIcon(item.type)}
                            </div>
                            <div className={styles.timelineItemContent}>
                              <h4 className={styles.timelineItemTitle}>{item.title}</h4>
                              <p className={styles.timelineItemDesc}>{item.description}</p>
                            </div>
                            <span className={styles.timelineItemTime}>{item.timeAgo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={styles.detailActions}>
                    {selectedNotification.reportId ? (
                      <>
                        <button
                          type="button"
                          className={styles.viewReportBtn}
                          onClick={() => router.push(`/citizen/my-reports?reportId=${selectedNotification.reportId}`)}
                        >
                          View Full Report
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.reportIssueBtn}
                          onClick={() => router.push('/citizen/report-issue')}
                        >
                          Report Another Issue
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.viewReportBtn}
                          onClick={() => router.push('/citizen')}
                        >
                          Go to Dashboard
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.reportIssueBtn}
                          onClick={() => router.push('/citizen/report-issue')}
                        >
                          Report an Issue
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Detail Empty State */
                <div className={styles.detailEmpty}>
                  <div className={styles.detailEmptyIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <h3 className={styles.detailEmptyTitle}>Select a notification</h3>
                  <p className={styles.detailEmptyDesc}>
                    Choose a notification from the list to view its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notice Modal */}
      <NoticeModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        stageNote={modalState.stageNote}
        badge={modalState.badge}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <React.Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060c18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5cebaa' }}>
        Loading Notifications...
      </div>
    }>
      <NotificationsContent />
    </React.Suspense>
  );
}
