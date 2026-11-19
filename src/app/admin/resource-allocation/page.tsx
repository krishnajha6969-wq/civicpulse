'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, DEFAULT_SUPER_ADMIN, AuthUser } from '../../../lib/auth';
import {
  AllocatedResource,
  ResourceType,
  ResourceStatus,
  ResourcePriority,
  RESOURCE_ALLOCATION_KPIS,
  RESOURCE_DEMAND_OVERVIEW,
  RESOURCE_UTILIZATION_BREAKDOWN,
  WARD_RESOURCE_DEMAND_DATA,
  AI_RESOURCE_RECOMMENDATIONS_DATA,
  ACTIVE_DEPLOYMENTS_LIST,
  RESOURCE_INVENTORY_DATA,
  INITIAL_RESOURCE_ALLOCATIONS,
  RESOURCE_UTILIZATION_INSIGHTS,
  AIResourceRecommendation,
  ActiveDeploymentMapItem,
} from '../../../lib/admin';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './resource-allocation.module.css';

export default function ResourceAllocationPage() {
  const router = useRouter();

  // Authentication State
  const [user] = useState<AuthUser | null>(() => {
    const current = getCurrentUser();
    if (current && current.role === 'super_admin') {
      return current;
    }
    return DEFAULT_SUPER_ADMIN;
  });

  // Top header menus
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [selectedGlobalWard, setSelectedGlobalWard] = useState('All Wards');

  // Filter Bar State
  const [selectedWardFilter, setSelectedWardFilter] = useState('All Wards');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Resources');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('All Priorities');
  const [searchQuery, setSearchQuery] = useState('');

  // Map state
  const [mapZoom, setMapZoom] = useState(1);
  const [activeDeploymentTab, setActiveDeploymentTab] = useState<'all' | 'deployed' | 'available'>('all');

  // Notice modal
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

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // ALLOCATION DATA & STATE
  // -------------------------------------------------------------
  const [allocations, setAllocations] = useState<AllocatedResource[]>(INITIAL_RESOURCE_ALLOCATIONS);
  const [activeDeployments, setActiveDeployments] = useState<ActiveDeploymentMapItem[]>(ACTIVE_DEPLOYMENTS_LIST);

  // Selected item for View details
  const [selectedResource, setSelectedResource] = useState<AllocatedResource | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Allocate Resource Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    type: 'Road Maintenance' as ResourceType,
    resourceId: 'RMT-01',
    targetWard: 'Ward 3',
    priority: 'High' as ResourcePriority,
    reason: '',
    duration: '1 day',
  });

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAllocation, setPendingAllocation] = useState<typeof allocateForm | null>(null);

  // Reallocate Resource Modal State
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [reallocateTarget, setReallocateTarget] = useState<AllocatedResource | null>(null);
  const [reallocateWard, setReallocateWard] = useState('Ward 1');
  const [reallocateReason, setReallocateReason] = useState('');

  // Filtered Allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter((item) => {
      const matchWard = selectedWardFilter === 'All Wards' || item.assignedWard === selectedWardFilter;
      const matchType = selectedTypeFilter === 'All Resources' || item.type === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === 'All Status' || item.status === selectedStatusFilter;
      const matchPriority = selectedPriorityFilter === 'All Priorities' || item.priority === selectedPriorityFilter;
      const matchSearch =
        !searchQuery.trim() ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.currentTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assignedWard.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teamLead.toLowerCase().includes(searchQuery.toLowerCase());

      return matchWard && matchType && matchStatus && matchPriority && matchSearch;
    });
  }, [allocations, selectedWardFilter, selectedTypeFilter, selectedStatusFilter, selectedPriorityFilter, searchQuery]);

  // Open Allocate Modal from Recommendations
  const handleApplyRecommendation = (rec: AIResourceRecommendation) => {
    setAllocateForm({
      type: rec.resourceType,
      resourceId: `${rec.resourceType.slice(0, 3).toUpperCase()}-01`,
      targetWard: rec.ward,
      priority: rec.level,
      reason: rec.reasons.join(', '),
      duration: '1 day',
    });
    setShowAllocateModal(true);
  };

  // Submit Allocate Form -> Opens Confirmation Dialog
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.reason.trim()) {
      showToast('⚠️ Please enter an assignment reason.');
      return;
    }
    setPendingAllocation({ ...allocateForm });
    setShowAllocateModal(false);
    setShowConfirmModal(true);
  };

  // Finalize Allocation
  const handleFinalizeAllocation = () => {
    if (!pendingAllocation) return;

    const newAllocation: AllocatedResource = {
      id: pendingAllocation.resourceId || `RES-${Math.floor(100 + Math.random() * 900)}`,
      type: pendingAllocation.type,
      assignedWard: pendingAllocation.targetWard,
      currentTask: pendingAllocation.reason,
      status: 'Deployed',
      priority: pendingAllocation.priority,
      teamLead: 'Field Supervisor',
      teamSize: 5,
      deploymentTime: 'Just now',
      expectedCompletion: pendingAllocation.duration,
      equipment: ['Field Equipment Rig', 'Safety Kit'],
      recentActivity: `Dispatched to ${pendingAllocation.targetWard} for ${pendingAllocation.reason}`,
      eta: 'En Route',
      locationMarker: { xPercent: 50, yPercent: 50 },
    };

    setAllocations((prev) => [newAllocation, ...prev]);

    // Add to active deployments list
    setActiveDeployments((prev) => [
      {
        id: newAllocation.id,
        name: `${newAllocation.type} ${newAllocation.id}`,
        ward: newAllocation.assignedWard,
        status: 'En Route',
        eta: '15 min',
        type: newAllocation.type,
        xPercent: 52,
        yPercent: 48,
      },
      ...prev,
    ]);

    setShowConfirmModal(false);
    setPendingAllocation(null);
    showToast(`✓ ${newAllocation.id} deployed to ${newAllocation.assignedWard} successfully!`);
  };

  // Open Reallocation
  const handleOpenReallocate = (res: AllocatedResource) => {
    setReallocateTarget(res);
    setReallocateWard(res.assignedWard === 'Ward 1' ? 'Ward 2' : 'Ward 1');
    setReallocateReason('');
    setShowReallocateModal(true);
  };

  // Confirm Reallocation
  const handleConfirmReallocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reallocateTarget) return;

    setAllocations((prev) =>
      prev.map((item) =>
        item.id === reallocateTarget.id
          ? {
              ...item,
              assignedWard: reallocateWard,
              recentActivity: `Reallocated from ${item.assignedWard} to ${reallocateWard}. Reason: ${reallocateReason || 'Emergency demand balancing'}`,
              deploymentTime: 'Just now',
            }
          : item
      )
    );

    setActiveDeployments((prev) =>
      prev.map((d) =>
        d.id.includes(reallocateTarget.id)
          ? {
              ...d,
              ward: reallocateWard,
              status: 'En Route',
              eta: '12 min',
            }
          : d
      )
    );

    setShowReallocateModal(false);
    setReallocateTarget(null);
    showToast(`✓ ${reallocateTarget.id} reallocated to ${reallocateWard}!`);
  };

  // Helper for status badge class
  const getStatusBadgeClass = (status: ResourceStatus) => {
    switch (status) {
      case 'Available':
        return styles.statusAvailable;
      case 'Deployed':
        return styles.statusDeployed;
      case 'Maintenance':
        return styles.statusMaintenance;
      case 'Unavailable':
        return styles.statusUnavailable;
      default:
        return '';
    }
  };

  // Helper for priority badge class
  const getPriorityBadgeClass = (p: ResourcePriority) => {
    switch (p) {
      case 'Critical':
        return styles.priorityCritical;
      case 'High':
        return styles.priorityHigh;
      case 'Medium':
        return styles.priorityMedium;
      case 'Low':
        return styles.priorityLow;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #091a2f 0%, #0d2847 100%)',
            border: '1px solid #14b8a6',
            color: '#5eead4',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0, 242, 254, 0.25)',
            zIndex: 999,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Notice Modal */}
      <NoticeModal
        isOpen={notice.isOpen}
        onClose={closeNotice}
        title={notice.title}
        message={notice.message}
        stageNote={notice.stageNote}
        badge={notice.badge}
      />

      {/* ============================================================
          SIDEBAR (Exact CivicPulse Shell)
          ============================================================ */}
      <aside className={styles.sidebar}>
        <Link href="/admin/dashboard" className={styles.brandLink}>
          <div className={styles.brandIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className={styles.brandText}>CivicPulse</span>
        </Link>

        <div className={styles.sidebarSectionLabel}>ADMIN PORTAL</div>

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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
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

          {/* ACTIVE NAV ITEM: Resource Allocation */}
          <Link href="/admin/resource-allocation" className={`${styles.navItem} ${styles.navItemActive}`}>
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

          <Link
            href="/admin/system-administration"
            className={styles.navItem}
          >
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

        {/* Sidebar Promo Card */}
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
          MAIN CONTENT WRAPPER
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

          <div className={styles.headerRight}>
            {/* Global Ward Selector */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.wardSelect}
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
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className={styles.bellBtn}
              onClick={() =>
                openNotice(
                  'Resource Alerts',
                  '14 Critical resource requirements active. Ward 3 has 1 squad deficit for high-traffic road repairs.',
                  'Priority: High',
                  '8 Active Alerts'
                )
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.bellBadge}>8</span>
            </button>

            {/* Admin User Profile */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className={styles.profileAvatar}>SA</div>
                <div className={styles.profileMeta}>
                  <span className={styles.profileName}>{user?.name || 'Admin User'}</span>
                  <span className={styles.profileRole}>Super Admin</span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openNotice('Admin Profile', 'Role: Super Admin. Authorized to dispatch municipal machinery and personnel across all city wards.');
                    }}
                  >
                    Account Settings
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openNotice('Audit Log', 'Audit trail: 4 field team reallocations approved in the last 24 hours.');
                    }}
                  >
                    Audit Logs
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    style={{ color: '#f87171' }}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      router.push('/login');
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className={styles.pageBody}>
          {/* Header Row (Section 5) */}
          <div className={styles.headerRow}>
            <div>
              <div className={styles.breadcrumb}>
                <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
                  Dashboard
                </Link>
                <span>&gt;</span>
                <span style={{ color: '#e2e8f0' }}>Resource Allocation</span>
              </div>
              <h1 className={styles.pageTitle}>Resource Allocation</h1>
              <p className={styles.pageSubtitle}>
                Deploy municipal teams and resources where they are needed most based on issue priority, ward demand and operational availability.
              </p>
            </div>

            <div className={styles.headerControls}>
              <div className={styles.lastUpdatedBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Last updated: 2 min ago</span>
              </div>

              <div className={styles.dateRangeBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>01 Dec 2024 – 31 Dec 2024</span>
              </div>

              <button
                type="button"
                className={styles.btnRefresh}
                onClick={() => showToast('✓ Municipal resource telemetry refreshed with latest field reports.')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Filter Bar (Section 6 & 30) */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              {/* Ward Filter */}
              <select
                className={styles.filterSelect}
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
              >
                <option value="All Wards">All Wards</option>
                <option value="Ward 1">Ward 1</option>
                <option value="Ward 2">Ward 2</option>
                <option value="Ward 3">Ward 3</option>
                <option value="Ward 4">Ward 4</option>
                <option value="Ward 5">Ward 5</option>
              </select>

              {/* Resource Type Filter */}
              <select
                className={styles.filterSelect}
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              >
                <option value="All Resources">All Resources</option>
                <option value="Road Maintenance">Road Maintenance</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage">Drainage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Emergency Response">Emergency Response</option>
                <option value="General Field Team">General Field Team</option>
              </select>

              {/* Availability Filter */}
              <select
                className={styles.filterSelect}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Available">Available</option>
                <option value="Deployed">Deployed</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Unavailable">Unavailable</option>
              </select>

              {/* Priority Filter */}
              <select
                className={styles.filterSelect}
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              >
                <option value="All Priorities">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Search Field */}
              <div className={styles.searchField}>
                <span className={styles.searchFieldIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className={styles.searchFieldInput}
                  placeholder="Search resource ID, task, ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Allocate Action Button */}
            <button
              type="button"
              className={styles.btnPrimaryAction}
              onClick={() => {
                setAllocateForm({
                  type: 'Road Maintenance',
                  resourceId: 'RMT-01',
                  targetWard: 'Ward 3',
                  priority: 'High',
                  reason: '',
                  duration: '1 day',
                });
                setShowAllocateModal(true);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Allocate Resource</span>
            </button>
          </div>

          {/* KPI Cards (Section 7) */}
          <div className={styles.kpiGrid}>
            {/* Card 1: Available Resources */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{RESOURCE_ALLOCATION_KPIS.availableResources}</span>
                <span className={styles.kpiLabel}>Available Resources</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{RESOURCE_ALLOCATION_KPIS.availableSecondary}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Deployed */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{RESOURCE_ALLOCATION_KPIS.currentlyDeployed}</span>
                <span className={styles.kpiLabel}>Currently Deployed</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{RESOURCE_ALLOCATION_KPIS.deployedSecondary}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Utilization */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{RESOURCE_ALLOCATION_KPIS.resourceUtilization}%</span>
                <span className={styles.kpiLabel}>Resource Utilization</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{RESOURCE_ALLOCATION_KPIS.utilizationSecondary}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Critical Demand */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconRed}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{RESOURCE_ALLOCATION_KPIS.criticalResourceNeeds}</span>
                <span className={styles.kpiLabel}>Critical Resource Needs</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendRed}>{RESOURCE_ALLOCATION_KPIS.criticalSecondary}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              RESOURCE DEPLOYMENT MAP & ACTIVE DEPLOYMENTS (Section 17 & 18)
              ============================================================ */}
          <div className={styles.mapDeploymentGrid}>
            {/* Left: Map */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <span>Resource Deployment Map</span>
                  </h2>
                  <p className={styles.panelSubtitle}>
                    Visualise active teams, resource gaps and high-priority issue clusters across Mira Bhayandar.
                  </p>
                </div>
              </div>

              {/* Map Viewport */}
              <div className={styles.mapViewport}>
                <svg
                  className={styles.mapSvg}
                  viewBox="0 0 600 350"
                  style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center', transition: 'transform 0.25s ease' }}
                >
                  <defs>
                    <radialGradient id="hotspotRed" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="hotspotOrange" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="hotspotYellow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#eab308" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Ward Boundary Outlines */}
                  <path
                    d="M 60 90 L 180 70 L 260 110 L 220 220 L 100 240 Z"
                    fill="#0d1b33"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />
                  <path
                    d="M 180 70 L 340 50 L 400 130 L 260 110 Z"
                    fill="#0a172e"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />
                  <path
                    d="M 260 110 L 400 130 L 440 230 L 320 260 L 220 220 Z"
                    fill="#0c1932"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />
                  <path
                    d="M 320 260 L 440 230 L 530 280 L 420 330 Z"
                    fill="#0e1f3c"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />
                  <path
                    d="M 100 240 L 220 220 L 320 260 L 280 330 L 130 320 Z"
                    fill="#091428"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.6"
                  />

                  {/* Region Labels */}
                  <text x="130" y="140" fill="#64748b" fontSize="12" fontWeight="600" textAnchor="middle">
                    Bhayandar West
                  </text>
                  <text x="310" y="90" fill="#64748b" fontSize="12" fontWeight="600" textAnchor="middle">
                    Bhayandar East
                  </text>
                  <text x="320" y="190" fill="#94a3b8" fontSize="14" fontWeight="700" textAnchor="middle">
                    Mira Bhayandar
                  </text>
                  <text x="210" y="275" fill="#e2e8f0" fontSize="13" fontWeight="700" textAnchor="middle">
                    Mira Road
                  </text>
                  <text x="440" y="270" fill="#64748b" fontSize="12" fontWeight="600" textAnchor="middle">
                    Mira Road East
                  </text>

                  {/* Hotspots */}
                  <circle cx="210" cy="270" r="50" fill="url(#hotspotRed)" />
                  <circle cx="150" cy="150" r="32" fill="url(#hotspotOrange)" />
                  <circle cx="340" cy="110" r="28" fill="url(#hotspotYellow)" />
                  <circle cx="430" cy="250" r="30" fill="url(#hotspotOrange)" />

                  {/* Interactive Resource Pins */}
                  {/* Pin 1: Road Team R-03 (Ward 3) */}
                  <g
                    transform="translate(350, 150)"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      openNotice(
                        'Road Team R-03',
                        'En Route to GCC Corridor, Ward 3 for critical pothole repair. ETA: 18 min. 6 technicians, Asphalt Paver #2.',
                        'Priority: Critical',
                        'Active Deployment'
                      )
                    }
                  >
                    <circle cx="0" cy="0" r="10" fill="#10b981" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                      R
                    </text>
                  </g>

                  {/* Pin 2: Waste Team W-02 (Ward 5) */}
                  <g
                    transform="translate(180, 260)"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      openNotice(
                        'Waste Team W-02',
                        'On-Site at Sector 7, Ward 5. Garbage overflow collection ongoing. 8 technicians, Compactor Truck #09.',
                        'Priority: High',
                        'On-Site Operation'
                      )
                    }
                  >
                    <circle cx="0" cy="0" r="10" fill="#0284c7" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#0284c7" strokeWidth="1.5" opacity="0.6" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                      W
                    </text>
                  </g>

                  {/* Pin 3: Water Team WS-01 (Ward 1) */}
                  <g
                    transform="translate(440, 240)"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      openNotice(
                        'Water Team WS-01',
                        'Available on standby at Ward 1 Base Station. Ready for immediate deployment. 5 crew members, Mini Excavator.',
                        'Status: Available',
                        'Ready for Deployment'
                      )
                    }
                  >
                    <circle cx="0" cy="0" r="10" fill="#00f2fe" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#00f2fe" strokeWidth="1.5" opacity="0.6" />
                    <text x="0" y="4" fill="#070d18" fontSize="9" fontWeight="800" textAnchor="middle">
                      H
                    </text>
                  </g>

                  {/* Pin 4: Drainage Team D-04 (Ward 2) */}
                  <g
                    transform="translate(140, 110)"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      openNotice(
                        'Drainage Team D-04',
                        'Currently in Central Garage for hydraulic maintenance. Scheduled return to service: 11:30 AM.',
                        'Status: Maintenance',
                        'Fleet Service'
                      )
                    }
                  >
                    <circle cx="0" cy="0" r="10" fill="#f59e0b" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
                    <text x="0" y="4" fill="#070d18" fontSize="9" fontWeight="800" textAnchor="middle">
                      D
                    </text>
                  </g>
                </svg>

                {/* Map Zoom Controls */}
                <div className={styles.mapControls}>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.min(1.6, z + 0.15))}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.mapControlBtn}
                    onClick={() => setMapZoom((z) => Math.max(0.85, z - 0.15))}
                    title="Zoom out"
                  >
                    −
                  </button>
                </div>

                {/* Map Legend */}
                <div className={styles.mapLegend}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Legend</div>
                  <div className={styles.legendRow}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                    <span>Critical Hotspot</span>
                  </div>
                  <div className={styles.legendRow}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    <span>Deployed Crew</span>
                  </div>
                  <div className={styles.legendRow}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f2fe' }} />
                    <span>Available Standby</span>
                  </div>
                  <div className={styles.legendRow}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                    <span>In Maintenance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Active Deployments (Section 18) */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                    <span>Active Deployments</span>
                  </h2>
                  <p className={styles.panelSubtitle}>Current field personnel and assigned operations</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: activeDeploymentTab === 'all' ? 'rgba(20,184,166,0.18)' : 'transparent',
                      color: activeDeploymentTab === 'all' ? '#5eead4' : '#94a3b8',
                      border: 'none',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveDeploymentTab('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: activeDeploymentTab === 'deployed' ? 'rgba(20,184,166,0.18)' : 'transparent',
                      color: activeDeploymentTab === 'deployed' ? '#5eead4' : '#94a3b8',
                      border: 'none',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveDeploymentTab('deployed')}
                  >
                    Deployed
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: activeDeploymentTab === 'available' ? 'rgba(20,184,166,0.18)' : 'transparent',
                      color: activeDeploymentTab === 'available' ? '#5eead4' : '#94a3b8',
                      border: 'none',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveDeploymentTab('available')}
                  >
                    Available
                  </button>
                </div>
              </div>

              <div className={styles.deploymentsList}>
                {activeDeployments
                  .filter((d) => {
                    if (activeDeploymentTab === 'deployed') return d.status === 'On Site' || d.status === 'En Route';
                    if (activeDeploymentTab === 'available') return d.status === 'Available';
                    return true;
                  })
                  .map((item) => (
                    <div key={item.id} className={styles.deploymentItem}>
                      <div className={styles.deploymentInfo}>
                        <span className={styles.deploymentName}>{item.name}</span>
                        <div className={styles.deploymentMeta}>
                          <span style={{ color: '#cbd5e1' }}>{item.ward}</span>
                          <span>•</span>
                          <span>{item.type}</span>
                          {item.eta && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#38bdf8' }}>ETA: {item.eta}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        className={`${styles.statusBadge} ${
                          item.status === 'Available'
                            ? styles.statusAvailable
                            : item.status === 'Maintenance'
                            ? styles.statusMaintenance
                            : styles.statusDeployed
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* ============================================================
              CHARTS SECTION: DEMAND OVERVIEW & UTILIZATION (Sections 8 & 9)
              ============================================================ */}
          <div className={styles.chartsGrid}>
            {/* Chart 1: Resource Demand Overview (Horizontal Bar) */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Resource Demand Overview</h2>
                  <p className={styles.panelSubtitle}>Current demand for municipal resources by category.</p>
                </div>
                <span style={{ fontSize: 11.5, color: '#38bdf8', fontWeight: 600 }}>55 Total Open Demands</span>
              </div>

              <div className={styles.demandBarsList}>
                {RESOURCE_DEMAND_OVERVIEW.map((item) => {
                  const maxDemand = 20;
                  const pct = Math.round((item.demand / maxDemand) * 100);
                  const fillClass =
                    item.level === 'critical'
                      ? styles.fillCritical
                      : item.level === 'high'
                      ? styles.fillHigh
                      : styles.fillNormal;

                  return (
                    <div key={item.category} className={styles.demandBarRow}>
                      <span className={styles.demandBarLabel}>{item.category}</span>
                      <div className={styles.demandBarTrack}>
                        <div className={`${styles.demandBarFill} ${fillClass}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.demandBarValue}>{item.demand}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Resource Utilization (Donut Chart) */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Resource Utilization</h2>
                  <p className={styles.panelSubtitle}>Current fleet & personnel operational state.</p>
                </div>
                <button
                  type="button"
                  className={styles.tableActionBtn}
                  style={{ background: 'rgba(20,184,166,0.12)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.25)' }}
                  onClick={() =>
                    openNotice(
                      'Resource Utilization Breakdown',
                      'Total 82 registered resources: 28 currently deployed on field (34%), 42 ready on standby (51%), 8 under scheduled servicing (10%), and 4 undergoing repairs (5%).',
                      'Overall Capacity: 68%',
                      'Fleet Status'
                    )
                  }
                >
                  View Details
                </button>
              </div>

              <div className={styles.donutContainer}>
                {/* SVG Donut */}
                <div className={styles.donutSvgWrap}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="65" fill="none" stroke="#091222" strokeWidth="22" />
                    {/* Deployed: 28 / 82 = 34.1% -> stroke-dasharray = 139.3, 408.4 */}
                    <circle
                      cx="90"
                      cy="90"
                      r="65"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="22"
                      strokeDasharray="139 408"
                      strokeDashoffset="0"
                    />
                    {/* Available: 42 / 82 = 51.2% -> stroke-dasharray = 209, 408.4 */}
                    <circle
                      cx="90"
                      cy="90"
                      r="65"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="22"
                      strokeDasharray="209 408"
                      strokeDashoffset="-139"
                    />
                    {/* Maintenance: 8 / 82 = 9.7% -> stroke-dasharray = 40, 408.4 */}
                    <circle
                      cx="90"
                      cy="90"
                      r="65"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="22"
                      strokeDasharray="40 408"
                      strokeDashoffset="-348"
                    />
                    {/* Unavailable: 4 / 82 = 4.9% -> stroke-dasharray = 20, 408.4 */}
                    <circle
                      cx="90"
                      cy="90"
                      r="65"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="22"
                      strokeDasharray="20 408"
                      strokeDashoffset="-388"
                    />
                  </svg>
                  <div className={styles.donutCenterLabel}>
                    <span className={styles.donutCenterValue}>68%</span>
                    <span className={styles.donutCenterSub}>Utilized</span>
                  </div>
                </div>

                {/* Legend */}
                <div className={styles.donutLegend}>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.donutLegendLeft}>
                      <span className={styles.donutLegendDot} style={{ background: '#0284c7' }} />
                      <span>Deployed</span>
                    </div>
                    <span className={styles.donutLegendValue}>{RESOURCE_UTILIZATION_BREAKDOWN.deployed}</span>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.donutLegendLeft}>
                      <span className={styles.donutLegendDot} style={{ background: '#10b981' }} />
                      <span>Available</span>
                    </div>
                    <span className={styles.donutLegendValue}>{RESOURCE_UTILIZATION_BREAKDOWN.available}</span>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.donutLegendLeft}>
                      <span className={styles.donutLegendDot} style={{ background: '#f59e0b' }} />
                      <span>Maintenance</span>
                    </div>
                    <span className={styles.donutLegendValue}>{RESOURCE_UTILIZATION_BREAKDOWN.maintenance}</span>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.donutLegendLeft}>
                      <span className={styles.donutLegendDot} style={{ background: '#ef4444' }} />
                      <span>Unavailable</span>
                    </div>
                    <span className={styles.donutLegendValue}>{RESOURCE_UTILIZATION_BREAKDOWN.unavailable}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>Total Resources</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{RESOURCE_UTILIZATION_BREAKDOWN.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              WARD RESOURCE DEMAND TABLE (Sections 10 & 11)
              ============================================================ */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Ward Resource Demand</h2>
                <p className={styles.panelSubtitle}>Compare resource requirements and gaps across wards.</p>
              </div>
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Total Deficit: 8 Squads</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Ward</th>
                    <th className={styles.th}>Open Issues</th>
                    <th className={styles.th}>Critical</th>
                    <th className={styles.th}>High</th>
                    <th className={styles.th}>Resources Needed</th>
                    <th className={styles.th}>Resources Assigned</th>
                    <th className={styles.th}>Gap Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {WARD_RESOURCE_DEMAND_DATA.map((row) => (
                    <tr key={row.ward}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <line x1="9" y1="22" x2="9" y2="22.01" />
                            <line x1="15" y1="22" x2="15.01" y2="22.01" />
                          </svg>
                          <strong style={{ color: '#ffffff' }}>{row.ward}</strong>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{row.openIssues}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#f87171', fontWeight: 700 }}>{row.criticalIssues}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#fb923c', fontWeight: 600 }}>{row.highIssues}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#cbd5e1' }}>{row.resourcesNeeded}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#5eead4', fontWeight: 600 }}>{row.resourcesAssigned}</span>
                      </td>
                      <td className={styles.td}>
                        {row.resourcesAssigned >= row.resourcesNeeded ? (
                          <span className={styles.gapBadgeAdequate}>✓ Adequate</span>
                        ) : (
                          <span className={styles.gapBadgeShort}>
                            {row.gap} {row.gap === 1 ? 'resource' : 'resources'} short
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================
              AI-ASSISTED RESOURCE RECOMMENDATIONS (Sections 12 - 16 & 27)
              ============================================================ */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>AI-Assisted Resource Recommendations</span>
                </h2>
                <p className={styles.panelSubtitle}>
                  Priority-based resource recommendations based on issue severity, demand, location and resource availability.
                </p>
              </div>
            </div>

            {/* Allocation Priority Factors Explainer (Section 27) */}
            <div className={styles.aiFactorsBanner}>
              <div className={styles.aiFormulaText}>
                <span style={{ color: '#94a3b8', fontWeight: 600, marginRight: 4 }}>Decision Framework:</span>
                <span className={styles.aiFormulaToken}>Issue Severity</span>
                <span>+</span>
                <span className={styles.aiFormulaToken}>Affected Population</span>
                <span>+</span>
                <span className={styles.aiFormulaToken}>Complaint Frequency</span>
                <span>+</span>
                <span className={styles.aiFormulaToken}>Resource Gap</span>
                <span>+</span>
                <span className={styles.aiFormulaToken}>Location Risk</span>
                <span>+</span>
                <span className={styles.aiFormulaToken}>Resource Availability</span>
                <span>=</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Recommended Deployment</span>
              </div>
            </div>

            {/* Recommendation Cards Grid (Sections 13 - 16) */}
            <div className={styles.aiRecGrid}>
              {AI_RESOURCE_RECOMMENDATIONS_DATA.map((rec) => (
                <div key={rec.id} className={styles.aiRecCard}>
                  <div>
                    <div className={styles.aiRecHeader}>
                      <span className={`${styles.priorityBadge} ${getPriorityBadgeClass(rec.level)}`}>
                        {rec.level}
                      </span>
                      <div className={styles.priorityScoreCircle}>
                        <span>Score: {rec.priorityScore}/100</span>
                      </div>
                    </div>

                    <h3 className={styles.aiRecTitle} style={{ marginTop: 12 }}>
                      {rec.title}
                    </h3>
                    <div style={{ fontSize: 11.5, color: '#38bdf8', marginTop: 3 }}>{rec.ward}</div>

                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                        Key Priority Factors
                      </span>
                      <ul className={styles.aiRecReasons} style={{ marginTop: 6 }}>
                        {rec.reasons.map((r, i) => (
                          <li key={i} className={styles.aiRecReasonItem}>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={styles.aiRecFooter}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Recommended Action</div>
                      <div className={styles.aiActionLabel}>{rec.recommendedAction}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.btnAllocateAction}
                      onClick={() => handleApplyRecommendation(rec)}
                    >
                      Allocate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              RESOURCE INVENTORY (Sections 19 & 20)
              ============================================================ */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Resource Inventory</h2>
                <p className={styles.panelSubtitle}>Overview of total fleet teams and equipment availability by department.</p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Resource Category</th>
                    <th className={styles.th}>Total Fleet</th>
                    <th className={styles.th}>Available</th>
                    <th className={styles.th}>Deployed</th>
                    <th className={styles.th}>Maintenance</th>
                    <th className={styles.th}>Utilization Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {RESOURCE_INVENTORY_DATA.map((item) => (
                    <tr key={item.category}>
                      <td className={styles.td}>
                        <strong style={{ color: '#f1f5f9' }}>{item.category}</strong>
                      </td>
                      <td className={styles.td}>{item.total}</td>
                      <td className={styles.td}>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>{item.available}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{item.deployed}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#fbbf24' }}>{item.maintenance}</span>
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 90, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${item.utilization}%`,
                                height: '100%',
                                background: item.utilization > 60 ? '#f97316' : '#14b8a6',
                                borderRadius: 4,
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>{item.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================
              CURRENT RESOURCE ALLOCATION TABLE (Sections 21, 30, 31)
              ============================================================ */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Current Resource Allocation</h2>
                <p className={styles.panelSubtitle}>
                  Real-time assignment roster of municipal crews, assigned tasks, and deployment status.
                </p>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Showing {filteredAllocations.length} of {allocations.length} resources
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Resource ID</th>
                    <th className={styles.th}>Resource Type</th>
                    <th className={styles.th}>Assigned Ward</th>
                    <th className={styles.th}>Current Task</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Priority</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.td}>
                        <span style={{ color: '#00f2fe', fontWeight: 700 }}>{item.id}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#e2e8f0' }}>{item.type}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#cbd5e1' }}>{item.assignedWard}</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: '#cbd5e1', fontSize: 12.5 }}>{item.currentTask}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.priorityBadge} ${getPriorityBadgeClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className={`${styles.tableActionBtn} ${styles.btnViewAction}`}
                            onClick={() => {
                              setSelectedResource(item);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </button>

                          {item.status === 'Available' ? (
                            <button
                              type="button"
                              className={`${styles.tableActionBtn}`}
                              style={{ background: 'rgba(16,185,129,0.14)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                              onClick={() => {
                                setAllocateForm({
                                  type: item.type,
                                  resourceId: item.id,
                                  targetWard: item.assignedWard,
                                  priority: item.priority,
                                  reason: item.currentTask,
                                  duration: '1 day',
                                });
                                setShowAllocateModal(true);
                              }}
                            >
                              Allocate
                            </button>
                          ) : item.status === 'Deployed' ? (
                            <button
                              type="button"
                              className={`${styles.tableActionBtn} ${styles.btnReallocateAction}`}
                              onClick={() => handleOpenReallocate(item)}
                            >
                              Reallocate
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAllocations.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No allocated resources match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================
              RESOURCE UTILIZATION INSIGHTS (Section 26)
              ============================================================ */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <h2 className={styles.panelTitle} style={{ fontSize: 16 }}>Resource Utilization Insights</h2>
              <p className={styles.panelSubtitle}>Key strategic indicators for municipal resource optimisation</p>
            </div>

            <div className={styles.insightsGrid}>
              {RESOURCE_UTILIZATION_INSIGHTS.map((ins) => (
                <div key={ins.id} className={styles.insightCard}>
                  <div className={styles.insightHeader}>
                    <div className={styles.insightTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>{ins.title}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background:
                          ins.type === 'danger'
                            ? 'rgba(239,68,68,0.18)'
                            : ins.type === 'warning'
                            ? 'rgba(249,115,22,0.18)'
                            : 'rgba(20,184,166,0.18)',
                        color:
                          ins.type === 'danger' ? '#f87171' : ins.type === 'warning' ? '#fb923c' : '#5eead4',
                      }}
                    >
                      {ins.badge}
                    </span>
                  </div>
                  <p className={styles.insightDetail}>{ins.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              QUICK RESOURCE ACTIONS BAR (Mockup Footer)
              ============================================================ */}
          <div className={styles.quickActionsPanel}>
            <div className={styles.quickActionsMeta}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div>
                <strong style={{ color: '#ffffff', fontSize: 14 }}>Resource Actions</strong>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                  Quick actions to manage, deploy and optimize municipal resources.
                </p>
              </div>
            </div>

            <div className={styles.quickActionBtns}>
              <button
                type="button"
                className={`${styles.quickBtn} ${styles.quickBtnPrimary}`}
                onClick={() => {
                  setAllocateForm({
                    type: 'Road Maintenance',
                    resourceId: 'RMT-01',
                    targetWard: 'Ward 3',
                    priority: 'High',
                    reason: '',
                    duration: '1 day',
                  });
                  setShowAllocateModal(true);
                }}
              >
                + Allocate Teams
              </button>

              <button
                type="button"
                className={styles.quickBtn}
                onClick={() =>
                  openNotice(
                    'Direct Field Crew Dispatch',
                    'Direct emergency dispatch triggered. 3 available standby squads placed on active notice.',
                    'Dispatch Active',
                    'Operations'
                  )
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Deploy Resources</span>
              </button>

              <button
                type="button"
                className={styles.quickBtn}
                onClick={() =>
                  openNotice(
                    'Maintenance Schedule',
                    'Central Depot scheduled maintenance: 4 vehicles booked for oil and hydraulic checks on Friday.',
                    'Workshop Capacity: Normal',
                    'Fleet Maintenance'
                  )
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Schedule Maintenance</span>
              </button>

              <button
                type="button"
                className={styles.quickBtn}
                onClick={() =>
                  openNotice(
                    'Resource Inventory Report',
                    'Municipal Fleet Audit: 82 total assets, 18 specialised squads, 42 ready units across 5 wards.',
                    'Inventory Validated',
                    'Audit Report'
                  )
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>View Resource Inventory</span>
              </button>

              <button
                type="button"
                className={styles.quickBtn}
                onClick={() =>
                  openNotice(
                    'Allocation Report Generated',
                    'Downloaded civicpulse-resource-allocation-dec2024.csv including ward demand gaps and active squad telemetry.',
                    'Export Complete',
                    'CSV Export'
                  )
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Allocation Report</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================
          MODAL 1: ALLOCATE RESOURCE (Section 22)
          ============================================================ */}
      {showAllocateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAllocateModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Allocate Municipal Resource</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAllocateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleProceedToConfirmation}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Resource Type</label>
                    <select
                      className={styles.formSelect}
                      value={allocateForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as ResourceType;
                        const prefix = newType.slice(0, 3).toUpperCase();
                        setAllocateForm({
                          ...allocateForm,
                          type: newType,
                          resourceId: `${prefix}-01`,
                        });
                      }}
                    >
                      <option value="Road Maintenance">Road Maintenance</option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Drainage">Drainage</option>
                      <option value="Streetlight">Streetlight</option>
                      <option value="Emergency Response">Emergency Response</option>
                      <option value="General Field Team">General Field Team</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Available Resource Unit</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={allocateForm.resourceId}
                      onChange={(e) => setAllocateForm({ ...allocateForm, resourceId: e.target.value })}
                      placeholder="e.g. RMT-01"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Ward</label>
                    <select
                      className={styles.formSelect}
                      value={allocateForm.targetWard}
                      onChange={(e) => setAllocateForm({ ...allocateForm, targetWard: e.target.value })}
                    >
                      <option value="Ward 1">Ward 1</option>
                      <option value="Ward 2">Ward 2</option>
                      <option value="Ward 3">Ward 3</option>
                      <option value="Ward 4">Ward 4</option>
                      <option value="Ward 5">Ward 5</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Deployment Priority</label>
                    <select
                      className={styles.formSelect}
                      value={allocateForm.priority}
                      onChange={(e) => setAllocateForm({ ...allocateForm, priority: e.target.value as ResourcePriority })}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assignment Reason / Objective</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter reason for deployment (e.g. Critical road repairs, pothole clearing)..."
                    value={allocateForm.reason}
                    onChange={(e) => setAllocateForm({ ...allocateForm, reason: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Expected Duration</label>
                  <select
                    className={styles.formSelect}
                    value={allocateForm.duration}
                    onChange={(e) => setAllocateForm({ ...allocateForm, duration: e.target.value })}
                  >
                    <option value="2 hours">2 hours</option>
                    <option value="4 hours">4 hours</option>
                    <option value="8 hours">8 hours</option>
                    <option value="1 day">1 day</option>
                    <option value="3 days">3 days</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowAllocateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Allocate Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: ALLOCATION CONFIRMATION (Section 23)
          ============================================================ */}
      {showConfirmModal && pendingAllocation && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalContainer} style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#10b981' }}>
                Confirm Resource Allocation
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                You are about to deploy{' '}
                <strong style={{ color: '#ffffff' }}>
                  {pendingAllocation.type} ({pendingAllocation.resourceId})
                </strong>{' '}
                to <strong style={{ color: '#00f2fe' }}>{pendingAllocation.targetWard}</strong> for:
              </p>
              <div
                style={{
                  background: '#091222',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  color: '#5eead4',
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 10,
                }}
              >
                &ldquo;{pendingAllocation.reason}&rdquo;
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                <span>Priority: <strong style={{ color: '#fb923c' }}>{pendingAllocation.priority}</strong></span>
                <span>Duration: <strong style={{ color: '#ffffff' }}>{pendingAllocation.duration}</strong></span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleFinalizeAllocation}
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: RESOURCE REALLOCATION (Section 24)
          ============================================================ */}
      {showReallocateModal && reallocateTarget && (
        <div className={styles.modalOverlay} onClick={() => setShowReallocateModal(false)}>
          <div className={styles.modalContainer} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reallocate Resource: {reallocateTarget.id}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowReallocateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmReallocate}>
              <div className={styles.modalBody}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Current Assignment</span>
                  <span className={styles.detailValue}>
                    {reallocateTarget.assignedWard} • {reallocateTarget.currentTask}
                  </span>
                </div>

                <div className={styles.formGroup} style={{ marginTop: 10 }}>
                  <label className={styles.formLabel}>New Target Ward</label>
                  <select
                    className={styles.formSelect}
                    value={reallocateWard}
                    onChange={(e) => setReallocateWard(e.target.value)}
                  >
                    {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5']
                      .filter((w) => w !== reallocateTarget.assignedWard)
                      .map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reallocation Reason</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter reason for redeploying to new ward (e.g. Higher priority road incident in Ward 3)..."
                    value={reallocateReason}
                    onChange={(e) => setReallocateReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowReallocateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Confirm Reallocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: RESOURCE DETAILS (Section 25)
          ============================================================ */}
      {showViewModal && selectedResource && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className={styles.modalTitle}>{selectedResource.id} Details</h3>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedResource.status)}`}>
                  {selectedResource.status}
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Resource Type</span>
                  <span className={styles.detailValue}>{selectedResource.type}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Assigned Ward</span>
                  <span className={styles.detailValue}>{selectedResource.assignedWard}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Priority</span>
                  <span className={`${styles.priorityBadge} ${getPriorityBadgeClass(selectedResource.priority)}`}>
                    {selectedResource.priority}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Team Lead</span>
                  <span className={styles.detailValue}>{selectedResource.teamLead}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Crew Size</span>
                  <span className={styles.detailValue}>{selectedResource.teamSize} Technicians</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Deployment Time</span>
                  <span className={styles.detailValue}>{selectedResource.deploymentTime}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Expected Completion</span>
                  <span className={styles.detailValue}>{selectedResource.expectedCompletion}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status / ETA</span>
                  <span className={styles.detailValue} style={{ color: '#38bdf8' }}>
                    {selectedResource.eta || 'Standby'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Current Task</span>
                  <span className={styles.detailValue} style={{ fontSize: 13.5 }}>
                    {selectedResource.currentTask}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Allocated Equipment Rig</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {selectedResource.equipment.map((eq, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#e2e8f0',
                        }}
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Recent Field Activity</span>
                  <span className={styles.detailValue} style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                    {selectedResource.recentActivity}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              {selectedResource.status === 'Deployed' && (
                <button
                  type="button"
                  className={styles.btnSubmit}
                  style={{ background: '#f59e0b' }}
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenReallocate(selectedResource);
                  }}
                >
                  Reallocate Team
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
