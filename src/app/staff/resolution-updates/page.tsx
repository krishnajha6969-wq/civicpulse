'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginWardStaff, DEFAULT_WARD_STAFF, AuthUser } from '../../../lib/auth';
import {
  StaffIssue,
  StaffIssueStatus,
  StaffIssuePriority,
  StaffIssueCategory,
  getWardStaffIssues,
  updateStaffIssueStatus,
  addStaffIssueNote,
} from '../../../lib/staff';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './resolution-updates.module.css';

type DetailTab = 'details' | 'location' | 'photos' | 'worklog' | 'citizen';
type SortOption = 'last_updated' | 'newest' | 'oldest' | 'priority_high' | 'priority_low';

// ── Category icon map ──
const CATEGORY_ICONS: Record<StaffIssueCategory, string> = {
  roads: '🛣️',
  streetlights: '💡',
  waste: '🗑️',
  water: '💧',
  drainage: '🚰',
  parks: '🌳',
  transport: '🚌',
  other: '📋',
};

export default function ResolutionUpdatesPage() {
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

  // ── Issues & Filtering ──
  const [issues, setIssues] = useState<StaffIssue[]>(() => getWardStaffIssues('Ward 3'));
  const [statusFilter, setStatusFilter] = useState<StaffIssueStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('last_updated');

  // ── Pagination (6 per page to match reference) ──
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // ── Selected Issue ──
  const [selectedIssueId, setSelectedIssueId] = useState<string>('CP-10421');
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  // ── Update Status Form ──
  const [newStatus, setNewStatus] = useState<StaffIssueStatus>('In Progress');
  const [workNotes, setWorkNotes] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Lightbox ──
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // ── Mobile sidebar ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Notice Modal ──
  const [notice, setNotice] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    stageNote?: string;
    badge?: string;
  }>({ isOpen: false, title: '', message: '' });

  const openNotice = (title: string, message: string, stageNote?: string, badge?: string) => {
    setNotice({ isOpen: true, title, message, stageNote, badge });
  };
  const closeNotice = () => setNotice((prev) => ({ ...prev, isOpen: false }));

  // ── Toast ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Sync issues on mount ──
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
    window.addEventListener('civicpulse_ward_staff_updated', handleSync);
    return () => window.removeEventListener('civicpulse_ward_staff_updated', handleSync);
  }, [selectedWard]);

  // ── Derived: filtered & sorted issues ──
  const filteredIssues = useMemo(() => {
    let list = [...issues];

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter((i) => i.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          (i.assignedTeam || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortOption) {
        case 'last_updated':
          return (b.timeAgo || '').localeCompare(a.timeAgo || '');
        case 'newest':
          return b.id.localeCompare(a.id);
        case 'oldest':
          return a.id.localeCompare(b.id);
        case 'priority_high': {
          const pMap: Record<string, number> = { High: 0, Medium: 1, Low: 2, Others: 3 };
          return (pMap[a.priority] ?? 3) - (pMap[b.priority] ?? 3);
        }
        case 'priority_low': {
          const pMap2: Record<string, number> = { High: 0, Medium: 1, Low: 2, Others: 3 };
          return (pMap2[b.priority] ?? 3) - (pMap2[a.priority] ?? 3);
        }
        default:
          return 0;
      }
    });

    return list;
  }, [issues, statusFilter, searchQuery, sortOption]);

  // ── Status counts ──
  const statusCounts = useMemo<Record<string, number>>(() => {
    return {
      All: issues.length,
      New: issues.filter((i) => i.status === 'New').length,
      'In Progress': issues.filter((i) => i.status === 'In Progress').length,
      Overdue: issues.filter((i) => i.status === 'Overdue').length,
      Resolved: issues.filter((i) => i.status === 'Resolved').length,
      Assigned: issues.filter((i) => i.status === 'Assigned').length,
      Verified: issues.filter((i) => i.status === 'Verified').length,
      'Awaiting Materials': issues.filter((i) => i.status === 'Awaiting Materials').length,
      Closed: issues.filter((i) => i.status === 'Closed').length,
      Reopened: issues.filter((i) => i.status === 'Reopened').length,
    };
  }, [issues]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize));
  const pagedIssues = filteredIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Selected issue ──
  const selectedIssue = useMemo(() => {
    return issues.find((i) => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Auto-select first issue when filter changes
  useEffect(() => {
    if (filteredIssues.length > 0 && !filteredIssues.find((i) => i.id === selectedIssueId)) {
      setSelectedIssueId(filteredIssues[0].id);
    }
  }, [filteredIssues, selectedIssueId]);

  // Sync new status when selected issue changes
  useEffect(() => {
    if (selectedIssue) {
      setNewStatus(selectedIssue.status);
      setWorkNotes('');
      setUploadedPhotos([]);
    }
  }, [selectedIssue]);

  // ── Handlers ──
  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  const handleSelectIssue = (id: string) => {
    setSelectedIssueId(id);
    setActiveTab('details');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxPhotos = 5;
    const remaining = maxPhotos - uploadedPhotos.length;
    if (remaining <= 0) {
      showToast('Maximum 5 photos allowed');
      return;
    }
    const newPhotos: string[] = [];
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          showToast(`File ${file.name} exceeds 5MB limit`);
          return;
        }
        const url = URL.createObjectURL(file);
        newPhotos.push(url);
      });
    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpdate = async () => {
    if (!selectedIssue || isSubmitting) return;

    // Validate transition
    const validTransitions: Partial<Record<StaffIssueStatus, StaffIssueStatus[]>> = {
      New: ['In Progress', 'Verified', 'Assigned'],
      Verified: ['Assigned', 'In Progress'],
      Assigned: ['In Progress'],
      'In Progress': ['Awaiting Materials', 'Resolved', 'Overdue'],
      'Awaiting Materials': ['In Progress', 'Resolved'],
      Overdue: ['In Progress', 'Resolved'],
      Resolved: ['Closed', 'Reopened'],
      Closed: ['Reopened'],
      Reopened: ['In Progress'],
    };

    if (newStatus !== selectedIssue.status) {
      const allowed = validTransitions[selectedIssue.status] || [];
      if (!allowed.includes(newStatus)) {
        showToast(`Cannot transition from ${selectedIssue.status} to ${newStatus}`);
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate brief API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // Add work note if provided
      if (workNotes.trim()) {
        addStaffIssueNote(selectedIssue.id, workNotes.trim(), user?.name || 'Sandeep Jadhav');
      }

      // Update status if changed
      if (newStatus !== selectedIssue.status) {
        updateStaffIssueStatus(
          selectedIssue.id,
          newStatus,
          workNotes.trim() || undefined,
          user?.name || 'Sandeep Jadhav',
          newStatus === 'Resolved' ? {
            note: workNotes.trim() || 'Work verified and completed by Ward 3 maintenance crew.',
            resolvedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            resolvedBy: user?.name || 'Sandeep Jadhav (Ward Staff)',
            afterPhoto: uploadedPhotos[0],
          } : undefined,
          newStatus === 'Resolved' ? 100 : 70
        );
      }

      // Refresh issues
      const updated = getWardStaffIssues(selectedWard);
      setIssues(updated);
      setWorkNotes('');
      setUploadedPhotos([]);

      showToast(
        newStatus !== selectedIssue.status
          ? `Status updated to ${newStatus} successfully`
          : 'Work notes added successfully'
      );
    } catch {
      showToast('Update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Priority badge class ──
  const priorityClass = (p: StaffIssuePriority) => {
    switch (p) {
      case 'High':
        return styles.priorityHigh;
      case 'Medium':
        return styles.priorityMedium;
      case 'Low':
        return styles.priorityLow;
      default:
        return styles.priorityOthers;
    }
  };

  // ── Status badge class ──
  const statusClass = (s: StaffIssueStatus) => {
    switch (s) {
      case 'New':
        return styles.statusNew;
      case 'In Progress':
        return styles.statusInProgress;
      case 'Overdue':
        return styles.statusOverdue;
      case 'Resolved':
        return styles.statusResolved;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <Link href="/" className={styles.brandLink}>
          <span className={styles.logoPulseIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>WARD STAFF PORTAL</div>

        <nav className={styles.sidebarNav}>
          {/* 1. Dashboard */}
          <Link href="/staff/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* 2. Assigned Issues */}
          <Link href="/staff/issues" className={styles.navItem}>
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
          <Link href="/staff/field-operations" className={styles.navItem}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              </svg>
            </span>
            <span className={styles.navLabel}>Field Operations</span>
          </Link>

          {/* 4. Resolution Updates (Active) */}
          <Link
            href="/staff/resolution-updates"
            className={`${styles.navItem} ${styles.navItemActive}`}
            aria-current="page"
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
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

        {/* Sidebar promo card */}
        <div className={styles.sidebarPromo}>
          <Image
            src="/images/dashboard/sidebar-promo-iso.png"
            alt="Ward promo"
            width={220}
            height={110}
            className={styles.sidebarPromoImage}
            priority={false}
          />
          <div className={styles.sidebarPromoContent}>
            <div className={styles.sidebarPromoTitle}>Cleaner wards stronger communities.</div>
            <div className={styles.sidebarPromoSubtext}>Resolve. Maintain. Make a difference.</div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className={styles.main}>
        {/* ── TOP BAR ── */}
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

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
              placeholder="Search issues, report ID, locations, or teams..."
            />
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.wardBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Ward 3
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <button className={styles.notifBtn} aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifDot}>1</span>
            </button>

            <div
              className={styles.profileArea}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              suppressHydrationWarning
            >
              <div className={styles.profileAvatar} suppressHydrationWarning>SJ</div>
              <div>
                <div className={styles.profileName} suppressHydrationWarning>{user?.name || 'Sandeep Jadhav'}</div>
                <div className={styles.profileRole}>Ward Staff</div>
              </div>
              <span className={styles.profileDropdownIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>

              {profileMenuOpen && (
                <div className={styles.profileMenu}>
                  <button className={styles.profileMenuItem} onClick={() => router.push('/staff/dashboard')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`}
                    onClick={handleLogout}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <main className={styles.content}>
          {/* ── BANNER ── */}
          <div className={styles.banner}>
            <div className={styles.bannerBg}>
              <Image
                src="/images/ward/resolution-banner.jpg"
                alt="Resolution work in progress"
                fill
                style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                priority
              />
            </div>
            <div className={styles.bannerOverlay} />
            <div className={styles.bannerContent}>
              <div className={styles.breadcrumb}>
                <Link href="/staff/dashboard">Dashboard</Link>
                <span className={styles.breadcrumbSep}>›</span>
                <span className={styles.breadcrumbActive}>Resolution Updates</span>
              </div>
              <h1 className={styles.bannerTitle}>Resolution Updates</h1>
              <p className={styles.bannerSubtitle}>
                Update issue status, add work notes, upload completion photos and track progress towards a cleaner Mira Bhayandar.
              </p>
            </div>
            <div className={styles.bannerBadge}>
              <div className={styles.bannerBadgeTitle}>
                Resolve Issues<br />Build Cleaner<br />Mira Bhayandar
              </div>
            </div>
          </div>

          {/* ── STATUS FILTER TOOLBAR ── */}
          <div className={styles.toolbar}>
            <div className={styles.statusFilters}>
              {(
                [
                  { key: 'All', dot: styles.dotAll },
                  { key: 'New', dot: styles.dotNew },
                  { key: 'In Progress', dot: styles.dotInProgress },
                  { key: 'Overdue', dot: styles.dotOverdue },
                  { key: 'Resolved', dot: styles.dotResolved },
                ] as { key: StaffIssueStatus | 'All'; dot: string }[]
              ).map((sf) => (
                <button
                  key={sf.key}
                  className={`${styles.statusPill} ${statusFilter === sf.key ? styles.statusPillActive : ''}`}
                  onClick={() => {
                    setStatusFilter(sf.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className={`${styles.statusDot} ${sf.dot}`} />
                  {sf.key} ({statusCounts[sf.key]})
                </button>
              ))}
            </div>

            <div className={styles.toolbarSpacer} />

            <button className={styles.filterBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </button>

            <div className={styles.toolbarSearch}>
              <span className={styles.toolbarSearchIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className={styles.toolbarSearchInput}
                placeholder="Search by report ID, title, or location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className={styles.sortContainer}>
              <span className={styles.sortLabel}>Sort</span>
              <select
                className={styles.sortSelect}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="last_updated">Last Updated</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority_high">Priority (High → Low)</option>
                <option value="priority_low">Priority (Low → High)</option>
              </select>
            </div>
          </div>

          {/* ═══ THREE-COLUMN WORKSPACE ═══ */}
          <div className={styles.workspace}>
            {/* ── LEFT: ISSUE LIST ── */}
            <div className={styles.issueListCol}>
              {pagedIssues.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="15" x2="16" y2="15" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                  <div className={styles.emptyTitle}>No issues found</div>
                  <div className={styles.emptySub}>Try adjusting your filters or search query</div>
                </div>
              ) : (
                pagedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`${styles.issueCard} ${selectedIssueId === issue.id ? styles.issueCardActive : ''}`}
                    onClick={() => handleSelectIssue(issue.id)}
                  >
                    <div className={styles.issueCardContent}>
                      <div className={styles.issueCardId}>{issue.ticketId}</div>
                      <div className={styles.issueCardTitle}>{issue.title}</div>
                      <div className={styles.issueCardLocation}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {issue.location}
                      </div>
                      <div className={styles.issueCardFooter}>
                        <div className={styles.issueCardBadges}>
                          <span className={`${styles.priorityBadge} ${priorityClass(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className={`${styles.statusBadge} ${statusClass(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                        <span className={styles.issueCardTime}>Updated {issue.timeAgo}</span>
                      </div>
                    </div>
                    <div className={styles.issueCardThumb}>
                      <Image
                        src={issue.imageUrl}
                        alt={issue.title}
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <span className={styles.issueCardArrow}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                ))
              )}

              {/* Pagination */}
              {filteredIssues.length > 0 && (
                <div className={styles.pagination}>
                  <button
                    className={`${styles.pageBtn} ${currentPage <= 1 ? styles.pageBtnDisabled : ''}`}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={`${styles.pageBtn} ${currentPage >= totalPages ? styles.pageBtnDisabled : ''}`}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    ›
                  </button>
                  <span className={styles.pageInfo}>
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredIssues.length)} of{' '}
                    {filteredIssues.length} issues
                  </span>
                </div>
              )}
            </div>

            {/* ── CENTRE: ISSUE DETAILS ── */}
            <div className={styles.detailCol}>
              {selectedIssue ? (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <div className={styles.detailId}>{selectedIssue.ticketId}</div>
                      <div className={styles.detailTitle}>{selectedIssue.title}</div>
                    </div>
                    <div className={styles.detailHeaderBadges}>
                      <span className={`${styles.priorityBadge} ${priorityClass(selectedIssue.priority)}`}>
                        {selectedIssue.priority} Priority
                      </span>
                      <span className={`${styles.statusBadge} ${statusClass(selectedIssue.status)}`}>
                        {selectedIssue.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.detailLocation}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {selectedIssue.location}
                  </div>

                  <div className={styles.detailReported}>
                    Reported on {selectedIssue.reportedDate || selectedIssue.assignedDateFull || selectedIssue.assignedDate}
                  </div>

                  {/* Tabs */}
                  <div className={styles.detailTabs}>
                    {(
                      [
                        { key: 'details', label: 'Details' },
                        { key: 'location', label: 'Location' },
                        { key: 'photos', label: `Photos (${selectedIssue.photos?.length || 0})` },
                        { key: 'worklog', label: `Work Log (${selectedIssue.updates?.length || 0})` },
                        { key: 'citizen', label: 'Citizen Details' },
                      ] as { key: DetailTab; label: string }[]
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        className={`${styles.detailTab} ${activeTab === tab.key ? styles.detailTabActive : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className={styles.detailTabContent}>
                    {/* ── Details Tab ── */}
                    {activeTab === 'details' && (
                      <>
                        {/* Photo grid at top */}
                        {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                          <div className={styles.photoGrid}>
                            {selectedIssue.photos.slice(0, 4).map((photo, idx) => (
                              <div
                                key={idx}
                                className={styles.photoGridItem}
                                onClick={() => setLightboxImage(photo)}
                              >
                                <Image
                                  src={photo}
                                  alt={`Evidence ${idx + 1}`}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                                {idx === 3 && selectedIssue.photos!.length > 4 && (
                                  <div className={styles.photoMore}>
                                    +{selectedIssue.photos!.length - 4}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Detail metadata */}
                        <div className={styles.detailMeta}>
                          <div className={styles.detailMetaItem}>
                            <span className={styles.metaLabel}>Category</span>
                            <span className={styles.metaValue}>
                              {CATEGORY_ICONS[selectedIssue.category]}{' '}
                              {selectedIssue.category.charAt(0).toUpperCase() + selectedIssue.category.slice(1)}
                            </span>
                          </div>
                          <div className={styles.detailMetaItem}>
                            <span className={styles.metaLabel}>Priority</span>
                            <span className={styles.metaValue}>↑ {selectedIssue.priority}</span>
                          </div>
                          <div className={styles.detailMetaItem}>
                            <span className={styles.metaLabel}>Current Status</span>
                            <span className={styles.metaValue}>{selectedIssue.status}</span>
                          </div>
                          <div className={styles.detailMetaItem}>
                            <span className={styles.metaLabel}>Assigned Team</span>
                            <span className={styles.metaValue}>
                              {selectedIssue.assignedTeam || `${selectedIssue.assignedWard} - General`}
                            </span>
                          </div>
                          <div className={styles.detailMetaItem}>
                            <span className={styles.metaLabel}>Assigned Date</span>
                            <span className={styles.metaValue}>
                              {selectedIssue.assignedDateFull || selectedIssue.assignedDate}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div className={styles.descriptionSection}>
                          <div className={styles.sectionLabel}>
                            <span className={styles.sectionLabelIcon}>📝</span>
                            Description
                          </div>
                          <p className={styles.descriptionText}>{selectedIssue.description}</p>
                        </div>

                        {/* Current status info box */}
                        <div className={styles.currentStatusBox}>
                          <span className={styles.currentStatusIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </span>
                          <div>
                            <div className={styles.currentStatusLabel}>Current status:</div>
                            <div className={styles.currentStatusText}>
                              {selectedIssue.updates && selectedIssue.updates.length > 0
                                ? `The issue has been ${selectedIssue.status === 'New' ? 'reported and is awaiting field team action' : selectedIssue.status === 'In Progress' ? `assigned to ${selectedIssue.assignedTeam || 'the field team'}. Field work is in progress` : selectedIssue.status === 'Overdue' ? 'overdue and requires immediate attention' : 'marked as resolved'}.`
                                : `Status: ${selectedIssue.status}`}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Location Tab ── */}
                    {activeTab === 'location' && (
                      <div className={styles.locationSection}>
                        <div className={styles.locationHeader}>
                          <div className={styles.locationTitle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            Issue Location
                          </div>
                          <a href="#" className={styles.locationLink}>
                            View on Full Map ↗
                          </a>
                        </div>
                        <div className={styles.locationMap}>
                          <Image
                            src="/images/dashboard/mira-bhayandar-map.png"
                            alt="Location map"
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          <div className={styles.locationPin}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                          </div>
                        </div>
                        <div className={styles.locationAddress}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {selectedIssue.location} — Lat: {selectedIssue.lat.toFixed(4)}, Lng: {selectedIssue.lng.toFixed(4)}
                        </div>
                      </div>
                    )}

                    {/* ── Photos Tab ── */}
                    {activeTab === 'photos' && (
                      <>
                        {selectedIssue.photos && selectedIssue.photos.length > 0 ? (
                          <>
                            <div className={styles.sectionLabel}>Citizen Submitted Photos</div>
                            <div className={styles.photoGrid}>
                              {selectedIssue.photos.map((photo, idx) => (
                                <div
                                  key={idx}
                                  className={styles.photoGridItem}
                                  onClick={() => setLightboxImage(photo)}
                                >
                                  <Image
                                    src={photo}
                                    alt={`Photo ${idx + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📷</div>
                            <div className={styles.emptyTitle}>No photos available</div>
                            <div className={styles.emptySub}>No photos have been uploaded for this issue yet.</div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Work Log Tab ── */}
                    {activeTab === 'worklog' && (
                      <>
                        {selectedIssue.updates && selectedIssue.updates.length > 0 ? (
                          <div className={styles.workLogTimeline}>
                            {selectedIssue.updates.map((update, idx) => (
                              <div key={update.id} className={styles.workLogItem}>
                                <div
                                  className={`${styles.workLogDot} ${
                                    update.type === 'status'
                                      ? styles.workLogDotStatus
                                      : update.type === 'note'
                                      ? styles.workLogDotNote
                                      : update.type === 'created'
                                      ? styles.workLogDotCreated
                                      : update.type === 'assigned'
                                      ? styles.workLogDotAssigned
                                      : styles.workLogDotSurvey
                                  }`}
                                />
                                {idx < selectedIssue.updates!.length - 1 && (
                                  <div className={styles.workLogLine} />
                                )}
                                <div className={styles.workLogContent}>
                                  <div className={styles.workLogTitle}>{update.title}</div>
                                  <div className={styles.workLogActor}>{update.actor}</div>
                                  {update.notes && (
                                    <div className={styles.workLogNotes}>&ldquo;{update.notes}&rdquo;</div>
                                  )}
                                </div>
                                <div className={styles.workLogTime}>{update.timestamp}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <div className={styles.emptyTitle}>No work log entries</div>
                            <div className={styles.emptySub}>Activity will appear here once updates are made.</div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Citizen Details Tab ── */}
                    {activeTab === 'citizen' && (
                      <>
                        {selectedIssue.citizenDetails ? (
                          <div className={styles.citizenInfo}>
                            <div className={styles.citizenRow}>
                              <div className={styles.citizenIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                              <div>
                                <div className={styles.citizenLabel}>Name</div>
                                <div className={styles.citizenValue}>{selectedIssue.citizenDetails.name}</div>
                              </div>
                            </div>
                            <div className={styles.citizenRow}>
                              <div className={styles.citizenIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                              </div>
                              <div>
                                <div className={styles.citizenLabel}>Phone</div>
                                <div className={styles.citizenValue}>{selectedIssue.citizenDetails.phone}</div>
                              </div>
                            </div>
                            <div className={styles.citizenRow}>
                              <div className={styles.citizenIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                  <polyline points="22,6 12,13 2,6" />
                                </svg>
                              </div>
                              <div>
                                <div className={styles.citizenLabel}>Email</div>
                                <div className={styles.citizenValue}>{selectedIssue.citizenDetails.email}</div>
                              </div>
                            </div>
                            <div className={styles.citizenRow}>
                              <div className={styles.citizenIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </div>
                              <div>
                                <div className={styles.citizenLabel}>Address</div>
                                <div className={styles.citizenValue}>{selectedIssue.citizenDetails.address}</div>
                              </div>
                            </div>
                            <div className={styles.citizenRow}>
                              <div className={styles.citizenIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                              <div>
                                <div className={styles.citizenLabel}>Total Reports</div>
                                <div className={styles.citizenValue}>{selectedIssue.citizenDetails.totalReports} reports submitted</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>👤</div>
                            <div className={styles.emptyTitle}>No citizen details available</div>
                            <div className={styles.emptySub}>
                              Reported by {selectedIssue.citizenName || 'Anonymous'}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Issue location below details tab */}
                  {activeTab === 'details' && (
                    <div className={styles.locationSection}>
                      <div className={styles.locationHeader}>
                        <div className={styles.locationTitle}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Issue Location
                        </div>
                        <a
                          href="#"
                          className={styles.locationLink}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('location');
                          }}
                        >
                          View on Full Map ↗
                        </a>
                      </div>
                      <div className={styles.locationMap}>
                        <Image
                          src="/images/dashboard/mira-bhayandar-map.png"
                          alt="Issue location"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <div className={styles.locationPin}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <div className={styles.emptyTitle}>Select an issue</div>
                  <div className={styles.emptySub}>Choose an issue from the list to view details and update its status.</div>
                </div>
              )}
            </div>

            {/* ── RIGHT: UPDATE STATUS PANEL ── */}
            <div className={styles.updateCol}>
              <div className={styles.updateTitle}>
                <span className={styles.updateTitleIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                Update Status
              </div>

              {/* Workflow stages */}
              <div className={styles.workflowStages}>
                <div className={styles.workflowLine} />

                <div className={styles.workflowStage}>
                  <div
                    className={`${styles.workflowDot} ${styles.workflowDotNew} ${
                      selectedIssue?.status === 'New' ? styles.workflowDotActive : ''
                    } ${
                      selectedIssue &&
                      ['In Progress', 'Overdue', 'Resolved'].includes(selectedIssue.status)
                        ? styles.workflowDotCompleted
                        : ''
                    }`}
                  >
                    {selectedIssue &&
                    ['In Progress', 'Overdue', 'Resolved'].includes(selectedIssue.status) ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.workflowStageInfo}>
                    <div className={styles.workflowStageName}>New</div>
                    <div className={styles.workflowStageDesc}>Reported by citizen</div>
                  </div>
                </div>

                <div className={styles.workflowStage}>
                  <div
                    className={`${styles.workflowDot} ${styles.workflowDotProgress} ${
                      selectedIssue?.status === 'In Progress' || selectedIssue?.status === 'Overdue'
                        ? styles.workflowDotActive
                        : ''
                    } ${
                      selectedIssue?.status === 'Resolved' ? styles.workflowDotCompleted : ''
                    }`}
                  >
                    {selectedIssue?.status === 'Resolved' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : selectedIssue?.status === 'In Progress' || selectedIssue?.status === 'Overdue' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.workflowStageInfo}>
                    <div className={styles.workflowStageName}>In Progress</div>
                    <div className={styles.workflowStageDesc}>Field work started</div>
                  </div>
                </div>

                <div className={styles.workflowStage}>
                  <div
                    className={`${styles.workflowDot} ${styles.workflowDotResolved} ${
                      selectedIssue?.status === 'Resolved' ? styles.workflowDotActive : ''
                    }`}
                  >
                    {selectedIssue?.status === 'Resolved' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    )}
                  </div>
                  <div className={styles.workflowStageInfo}>
                    <div className={styles.workflowStageName}>Resolved</div>
                    <div className={styles.workflowStageDesc}>Work completed</div>
                  </div>
                </div>
              </div>

              {/* Change Status */}
              <div className={styles.changeStatusSection}>
                <div className={styles.changeStatusLabel}>Change Status</div>
                <select
                  className={styles.statusSelect}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as StaffIssueStatus)}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Work notes */}
              <div className={styles.notesSection}>
                <div className={styles.notesLabel}>Add work notes (optional)</div>
                <textarea
                  className={styles.notesTextarea}
                  placeholder="E.g. Site visit completed, repair in progress..."
                  value={workNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setWorkNotes(e.target.value);
                    }
                  }}
                  maxLength={500}
                />
                <div
                  className={`${styles.charCounter} ${
                    workNotes.length > 450
                      ? workNotes.length >= 500
                        ? styles.charCounterOver
                        : styles.charCounterNear
                      : ''
                  }`}
                >
                  {workNotes.length}/500
                </div>
              </div>

              {/* Upload Work Photos */}
              <div className={styles.uploadSection}>
                <div className={styles.uploadLabel}>Upload Work Photos (Optional)</div>
                <div
                  className={`${styles.uploadArea} ${uploadedPhotos.length > 0 ? styles.uploadAreaActive : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const fakeEvent = { target: { files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileUpload(fakeEvent);
                    }
                  }}
                >
                  <div className={styles.uploadIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTextHighlight}>Click to upload</span> or drag and drop
                  </div>
                  <div className={styles.uploadHint}>JPEG, PNG, WebP up to 5MB (Max 5 photos)</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {/* Uploaded thumbnails */}
                {uploadedPhotos.length > 0 && (
                  <div className={styles.uploadThumbs}>
                    {uploadedPhotos.map((photo, idx) => (
                      <div key={idx} className={styles.uploadThumb}>
                        <Image
                          src={photo}
                          alt={`Upload ${idx + 1}`}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          className={styles.uploadThumbRemove}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(idx);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                className={`${styles.submitBtn} ${isSubmitting ? styles.submitBtnDisabled : ''}`}
                onClick={handleSubmitUpdate}
                disabled={isSubmitting || !selectedIssue}
              >
                {isSubmitting ? (
                  <>Updating...</>
                ) : (
                  <>
                    Update Status →
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
          <Image
            src={lightboxImage}
            alt="Full-size image"
            width={900}
            height={600}
            className={styles.lightboxImg}
            style={{ objectFit: 'contain' }}
          />
          <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ═══ TOAST ═══ */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* ═══ NOTICE MODAL ═══ */}
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
