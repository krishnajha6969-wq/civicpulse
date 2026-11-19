'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, logout, loginSuperAdmin, DEFAULT_SUPER_ADMIN, AuthUser } from '../../../lib/auth';
import {
  WARD_MANAGEMENT_DATA,
  SYSTEM_USERS_DATA,
  WardManagementItem,
  SystemUser,
  SystemUserRole,
} from '../../../lib/admin';
import NoticeModal from '../../../components/ui/NoticeModal';
import styles from './ward-management.module.css';

export default function WardManagementPage() {
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [selectedGlobalWard, setSelectedGlobalWard] = useState('All Wards');

  // Tabs: 'wards' | 'users'
  const [activeTab, setActiveTab] = useState<'wards' | 'users'>('wards');

  // Modal notice state
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

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // WARD MANAGEMENT STATE
  // -------------------------------------------------------------
  const [wards, setWards] = useState<WardManagementItem[]>(WARD_MANAGEMENT_DATA);
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState<WardManagementItem | null>(null);

  const [showAddWard, setShowAddWard] = useState(false);
  const [showEditWard, setShowEditWard] = useState(false);
  const [showViewWard, setShowViewWard] = useState(false);

  // Ward Form State
  const [wardFormData, setWardFormData] = useState({
    name: '',
    areaKm2: '',
    population: '',
    officerInCharge: '',
    contactNumber: '',
    email: '',
    officeAddress: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) return wards;
    const q = wardSearch.toLowerCase();
    return wards.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.officerInCharge.toLowerCase().includes(q) ||
        w.officeAddress.toLowerCase().includes(q)
    );
  }, [wards, wardSearch]);

  // Open Add Ward
  const handleOpenAddWard = () => {
    const nextNum = wards.length + 1;
    setWardFormData({
      name: `Ward ${nextNum}`,
      areaKm2: '6.0',
      population: '120000',
      officerInCharge: '',
      contactNumber: '+91 98200 00000',
      email: '',
      officeAddress: `Ward ${nextNum} Office, Mira Bhayandar`,
      status: 'Active',
    });
    setShowAddWard(true);
  };

  // Save New Ward
  const handleSaveAddWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardFormData.name.trim()) return;

    const newWard: WardManagementItem = {
      id: `ward-${Date.now()}`,
      wardNumber: wards.length + 1,
      name: wardFormData.name.trim(),
      status: wardFormData.status,
      areaKm2: parseFloat(wardFormData.areaKm2) || 6.0,
      population: parseInt(wardFormData.population, 10) || 120000,
      totalIssues: 0,
      resolutionRate: 100,
      officerInCharge: wardFormData.officerInCharge.trim() || 'Officer In-Charge',
      contactNumber: wardFormData.contactNumber.trim() || '+91 98200 00000',
      email: wardFormData.email.trim() || `${wardFormData.name.toLowerCase().replace(/\s+/g, '')}@civicpulse.in`,
      officeAddress: wardFormData.officeAddress.trim() || 'Mira Bhayandar Municipal Area',
      criticalIssuesCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
    };

    setWards((prev) => [...prev, newWard]);
    setShowAddWard(false);
    showToast(`✓ ${newWard.name} has been added successfully!`);
  };

  // Open Edit Ward
  const handleOpenEditWard = (w: WardManagementItem) => {
    setSelectedWard(w);
    setWardFormData({
      name: w.name,
      areaKm2: w.areaKm2.toString(),
      population: w.population.toString(),
      officerInCharge: w.officerInCharge,
      contactNumber: w.contactNumber,
      email: w.email,
      officeAddress: w.officeAddress,
      status: w.status,
    });
    setShowEditWard(true);
  };

  // Save Edit Ward
  const handleSaveEditWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;

    setWards((prev) =>
      prev.map((w) =>
        w.id === selectedWard.id
          ? {
              ...w,
              name: wardFormData.name.trim() || w.name,
              areaKm2: parseFloat(wardFormData.areaKm2) || w.areaKm2,
              population: parseInt(wardFormData.population, 10) || w.population,
              officerInCharge: wardFormData.officerInCharge.trim() || w.officerInCharge,
              contactNumber: wardFormData.contactNumber.trim() || w.contactNumber,
              email: wardFormData.email.trim() || w.email,
              officeAddress: wardFormData.officeAddress.trim() || w.officeAddress,
              status: wardFormData.status,
            }
          : w
      )
    );

    setShowEditWard(false);
    setSelectedWard(null);
    showToast(`✓ ${wardFormData.name} updated successfully!`);
  };

  // Open View Ward
  const handleOpenViewWard = (w: WardManagementItem) => {
    setSelectedWard(w);
    setShowViewWard(true);
  };

  // -------------------------------------------------------------
  // USER MANAGEMENT STATE
  // -------------------------------------------------------------
  const [users, setUsers] = useState<SystemUser[]>(SYSTEM_USERS_DATA);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);

  // User Form State
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff' as SystemUserRole,
    assignedWard: 'Ward 1',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch.trim() ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.userId.toLowerCase().includes(userSearch.toLowerCase());

      const matchRole =
        roleFilter === 'All Roles' || u.role.toLowerCase() === roleFilter.toLowerCase();

      return matchSearch && matchRole;
    });
  }, [users, userSearch, roleFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, roleFilter]);

  // Open Add User
  const handleOpenAddUser = () => {
    setUserFormData({
      name: '',
      email: '',
      phone: '+91 98200 00000',
      role: 'Staff',
      assignedWard: 'Ward 1',
      status: 'Active',
    });
    setShowAddUser(true);
  };

  // Save New User
  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) return;

    const initials = userFormData.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const roleColors: Record<SystemUserRole, string> = {
      Admin: '#ef4444',
      'Ward Officer': '#0284c7',
      Staff: '#d97706',
      Viewer: '#9333ea',
    };

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      userId: `CP-U${100 + users.length + 1}`,
      name: userFormData.name.trim(),
      email: userFormData.email.trim(),
      role: userFormData.role,
      assignedWards: [userFormData.assignedWard],
      status: userFormData.status,
      avatarInitials: initials || 'US',
      avatarColor: roleColors[userFormData.role] || '#0284c7',
      phone: userFormData.phone.trim() || '+91 98200 00000',
      lastActive: 'Just now',
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setUsers((prev) => [newUser, ...prev]);
    setShowAddUser(false);
    showToast(`✓ User ${newUser.name} created successfully!`);
  };

  // Open Edit User
  const handleOpenEditUser = (u: SystemUser) => {
    setSelectedUser(u);
    setUserFormData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      assignedWard: u.assignedWards[0] || 'All Wards',
      status: u.status,
    });
    setShowEditUser(true);
  };

  // Save Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: userFormData.name.trim() || u.name,
              email: userFormData.email.trim() || u.email,
              phone: userFormData.phone.trim() || u.phone,
              role: userFormData.role,
              assignedWards: [userFormData.assignedWard],
              status: userFormData.status,
            }
          : u
      )
    );

    setShowEditUser(false);
    setSelectedUser(null);
    showToast(`✓ User ${userFormData.name} updated successfully!`);
  };

  // Open Delete User
  const handleOpenDeleteUser = (u: SystemUser) => {
    setSelectedUser(u);
    setShowDeleteUser(true);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = () => {
    if (!selectedUser) return;
    const name = selectedUser.name;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setShowDeleteUser(false);
    setSelectedUser(null);
    showToast(`✓ User ${name} removed from system.`);
  };

  // Helper for role badge CSS class
  const getRoleBadgeClass = (role: SystemUserRole) => {
    switch (role) {
      case 'Admin':
        return styles.roleAdmin;
      case 'Ward Officer':
        return styles.roleWardOfficer;
      case 'Staff':
        return styles.roleStaff;
      case 'Viewer':
        return styles.roleViewer;
      default:
        return '';
    }
  };

  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const activePercent = Math.round((activeUsersCount / users.length) * 100);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
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
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{toastMessage}</span>
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
          SIDEBAR
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

          {/* ACTIVE NAV ITEM: Ward & User Management */}
          <Link href="/admin/ward-management" className={`${styles.navItem} ${styles.navItemActive}`}>
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
        {/* Top Header */}
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
                  'Administrative Notifications',
                  'You have 8 unread notifications: 3 Ward 1 escalations, 2 staff assignment requests, and 3 SLA alerts.',
                  'System priority: High',
                  '8 New Alerts'
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
                      openNotice('Admin Profile', 'Role: Super Admin. Full administrative privileges over all wards, staff, and system telemetry.');
                    }}
                  >
                    Account Settings
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      openNotice('Audit Log', 'Latest Super Admin session initiated at 00:48 IST from Mira Bhayandar HQ.');
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
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
              Dashboard
            </Link>
            <span>&gt;</span>
            <span style={{ color: '#e2e8f0' }}>Ward & User Management</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className={styles.pageTitle}>Ward & User Management</h1>
            <p className={styles.pageSubtitle}>
              Manage city wards, ward officials, and system users with role-based access and permissions.
            </p>
          </div>

          {/* Top Tab Switcher */}
          <div className={styles.tabSwitcher}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'wards' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('wards')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <line x1="9" y1="22" x2="9" y2="22.01" />
                <line x1="15" y1="22" x2="15.01" y2="22.01" />
                <line x1="9" y1="6" x2="9.01" y2="6" />
                <line x1="15" y1="6" x2="15.01" y2="6" />
                <line x1="9" y1="10" x2="9.01" y2="10" />
                <line x1="15" y1="10" x2="15.01" y2="10" />
                <line x1="9" y1="14" x2="9.01" y2="14" />
                <line x1="15" y1="14" x2="15.01" y2="14" />
                <line x1="9" y1="18" x2="9.01" y2="18" />
                <line x1="15" y1="18" x2="15.01" y2="18" />
              </svg>
              <span>Ward Management</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>User Management</span>
            </button>
          </div>

          {/* KPI Cards Row (Always Visible) */}
          <div className={styles.kpiGrid}>
            {/* Card 1: Total Wards */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <line x1="9" y1="9" x2="9" y2="9.01" />
                  <line x1="9" y1="13" x2="9" y2="13.01" />
                  <line x1="9" y1="17" x2="9" y2="17.01" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{wards.length}</span>
                <span className={styles.kpiLabel}>Total Wards</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>↑ 0 new wards</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Users */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconGreen}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{users.length}</span>
                <span className={styles.kpiLabel}>Total Users</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>↑ 12% vs last month</span>
                </div>
              </div>
            </div>

            {/* Card 3: Active Roles */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconAmber}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>4</span>
                <span className={styles.kpiLabel}>Active Roles</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendMuted} style={{ fontSize: 10.5 }}>
                    Admin, Ward Officer, Staff, Viewer
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Active Users */}
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconSquircle} ${styles.iconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
              <div className={styles.kpiMeta}>
                <span className={styles.kpiNumber}>{activeUsersCount}</span>
                <span className={styles.kpiLabel}>Active Users</span>
                <div className={styles.kpiBadgeRow}>
                  <span className={styles.trendGreen}>{activePercent}% of total users</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              MAIN CONTENT PANELS
              When activeTab === 'wards': Split Layout (Ward Mgmt Left, User Mgmt Right - Exactly like mockup)
              When activeTab === 'users': Full-Width User Mgmt
              ============================================================ */}
          {activeTab === 'wards' ? (
            <div className={styles.splitLayout}>
              {/* LEFT COLUMN: WARD MANAGEMENT */}
              <div className={styles.sectionPanel}>
                <div className={styles.sectionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="22" x2="9" y2="22.01" />
                      <line x1="15" y1="22" x2="15.01" y2="22.01" />
                    </svg>
                    <h2 className={styles.sectionTitle}>Ward Management</h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.searchBar}>
                      <span className={styles.searchBarIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className={styles.searchBarInput}
                        placeholder="Search ward (e.g., Ward 1)..."
                        value={wardSearch}
                        onChange={(e) => setWardSearch(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnAdd}
                      onClick={handleOpenAddWard}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Ward</span>
                    </button>
                  </div>
                </div>

                {/* Ward Cards Grid */}
                <div className={styles.wardCardsGrid}>
                  {filteredWards.map((w) => (
                    <div key={w.id} className={styles.wardCard}>
                      <div className={styles.wardCardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <line x1="9" y1="6" x2="9.01" y2="6" />
                            <line x1="15" y1="6" x2="15.01" y2="6" />
                          </svg>
                          <span className={styles.wardName}>{w.name}</span>
                        </div>
                        <span className={styles.wardStatusBadge}>{w.status}</span>
                      </div>

                      <div className={styles.wardCardBody}>
                        <div className={styles.wardStatRow}>
                          <span className={styles.wardStatIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </span>
                          <span className={styles.wardStatLabel}>Area</span>
                          <span className={styles.wardStatValue}>{w.areaKm2} km²</span>
                        </div>

                        <div className={styles.wardStatRow}>
                          <span className={styles.wardStatIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                          </span>
                          <span className={styles.wardStatLabel}>Population</span>
                          <span className={styles.wardStatValue}>{w.population.toLocaleString('en-IN')}</span>
                        </div>

                        <div className={styles.wardStatRow}>
                          <span className={styles.wardStatIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </span>
                          <span className={styles.wardStatLabel}>Total Issues</span>
                          <span className={styles.wardStatValue}>{w.totalIssues}</span>
                        </div>

                        <div className={styles.wardStatRow}>
                          <span className={styles.wardStatIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </span>
                          <span className={styles.wardStatLabel}>Resolution Rate</span>
                          <div className={styles.resolutionHighlight}>
                            <span className={styles.resolutionValue}>{w.resolutionRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.wardCardFooter}>
                        <button
                          type="button"
                          className={styles.btnView}
                          onClick={() => handleOpenViewWard(w)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => handleOpenEditWard(w)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: USER MANAGEMENT (SPLIT VIEW) */}
              <div className={styles.sectionPanel}>
                <div className={styles.sectionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <h2 className={styles.sectionTitle}>User Management</h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className={styles.searchBar}>
                      <span className={styles.searchBarIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className={styles.searchBarInput}
                        placeholder="Search user (name, email, ID)..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className={styles.filterSelect}
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="All Roles">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Ward Officer">Ward Officer</option>
                      <option value="Staff">Staff</option>
                      <option value="Viewer">Viewer</option>
                    </select>

                    <button
                      type="button"
                      className={styles.btnAdd}
                      onClick={handleOpenAddUser}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className={styles.userTableWrap}>
                  <table className={styles.userTable}>
                    <thead>
                      <tr>
                        <th className={styles.userTh}>#</th>
                        <th className={styles.userTh}>User</th>
                        <th className={styles.userTh}>Role</th>
                        <th className={styles.userTh}>Assigned Ward(s)</th>
                        <th className={styles.userTh}>Status</th>
                        <th className={styles.userTh}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u, idx) => (
                        <tr key={u.id}>
                          <td className={styles.userTd}>
                            <span style={{ color: '#64748b', fontSize: 12 }}>
                              {(currentPage - 1) * usersPerPage + idx + 1}
                            </span>
                          </td>
                          <td className={styles.userTd}>
                            <div className={styles.userInfoCol}>
                              <div
                                className={styles.avatarCircle}
                                style={{ backgroundColor: u.avatarColor || '#0284c7' }}
                              >
                                {u.avatarInitials}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className={styles.userName}>{u.name}</span>
                                <span className={styles.userEmail}>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.userTd}>
                            <span className={`${styles.roleBadge} ${getRoleBadgeClass(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className={styles.userTd}>
                            <span style={{ color: '#cbd5e1' }}>{u.assignedWards.join(', ')}</span>
                          </td>
                          <td className={styles.userTd}>
                            <div
                              className={`${styles.statusDot} ${
                                u.status === 'Active' ? styles.statusActive : styles.statusInactive
                              }`}
                            >
                              <span className={styles.statusText}>{u.status}</span>
                            </div>
                          </td>
                          <td className={styles.userTd}>
                            <div className={styles.actionBtns}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                title="Edit user"
                                onClick={() => handleOpenEditUser(u)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtnDanger}
                                title="Delete user"
                                onClick={() => handleOpenDeleteUser(u)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            No users found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={styles.paginationBar}>
                  <div className={styles.paginationInfo}>
                    Showing {(currentPage - 1) * usersPerPage + (filteredUsers.length > 0 ? 1 : 0)} –{' '}
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className={styles.paginationBtns}>
                    <button
                      type="button"
                      className={styles.pageBtnNav}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.pageBtnNav}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* FULL WIDTH USER MANAGEMENT VIEW */
            <div className={styles.sectionPanel}>
              <div className={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h2 className={styles.sectionTitle} style={{ fontSize: 18 }}>System User Management</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div className={styles.searchBar} style={{ width: 280 }}>
                    <span className={styles.searchBarIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className={styles.searchBarInput}
                      placeholder="Search user (name, email, ID)..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className={styles.filterSelect}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Ward Officer">Ward Officer</option>
                    <option value="Staff">Staff</option>
                    <option value="Viewer">Viewer</option>
                  </select>

                  <button
                    type="button"
                    className={styles.btnAdd}
                    onClick={handleOpenAddUser}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>+ Add User</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className={styles.userTableWrap}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th className={styles.userTh}>#</th>
                      <th className={styles.userTh}>User</th>
                      <th className={styles.userTh}>Role</th>
                      <th className={styles.userTh}>Assigned Ward(s)</th>
                      <th className={styles.userTh}>Phone</th>
                      <th className={styles.userTh}>Last Active</th>
                      <th className={styles.userTh}>Status</th>
                      <th className={styles.userTh}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u, idx) => (
                      <tr key={u.id}>
                        <td className={styles.userTd}>
                          <span style={{ color: '#64748b', fontSize: 12 }}>
                            {(currentPage - 1) * usersPerPage + idx + 1}
                          </span>
                        </td>
                        <td className={styles.userTd}>
                          <div className={styles.userInfoCol}>
                            <div
                              className={styles.avatarCircle}
                              style={{ backgroundColor: u.avatarColor || '#0284c7' }}
                            >
                              {u.avatarInitials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className={styles.userName}>{u.name}</span>
                              <span className={styles.userEmail}>{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.userTd}>
                          <span className={`${styles.roleBadge} ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className={styles.userTd}>
                          <span style={{ color: '#cbd5e1' }}>{u.assignedWards.join(', ')}</span>
                        </td>
                        <td className={styles.userTd}>
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{u.phone}</span>
                        </td>
                        <td className={styles.userTd}>
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{u.lastActive}</span>
                        </td>
                        <td className={styles.userTd}>
                          <div
                            className={`${styles.statusDot} ${
                              u.status === 'Active' ? styles.statusActive : styles.statusInactive
                            }`}
                          >
                            <span className={styles.statusText}>{u.status}</span>
                          </div>
                        </td>
                        <td className={styles.userTd}>
                          <div className={styles.actionBtns}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title="Edit user"
                              onClick={() => handleOpenEditUser(u)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtnDanger}
                              title="Delete user"
                              onClick={() => handleOpenDeleteUser(u)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No users found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  Showing {(currentPage - 1) * usersPerPage + (filteredUsers.length > 0 ? 1 : 0)} –{' '}
                  {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className={styles.paginationBtns}>
                  <button
                    type="button"
                    className={styles.pageBtnNav}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtnNav}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================
          MODAL 1: ADD WARD
          ============================================================ */}
      {showAddWard && (
        <div className={styles.modalOverlay} onClick={() => setShowAddWard(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New City Ward</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAddWard(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAddWard}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ward Name / Identifier</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={wardFormData.name}
                      onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
                      placeholder="e.g. Ward 6"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.formSelect}
                      value={wardFormData.status}
                      onChange={(e) => setWardFormData({ ...wardFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Geographic Area (km²)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={wardFormData.areaKm2}
                      onChange={(e) => setWardFormData({ ...wardFormData, areaKm2: e.target.value })}
                      placeholder="e.g. 6.4"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Estimated Population</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={wardFormData.population}
                      onChange={(e) => setWardFormData({ ...wardFormData, population: e.target.value })}
                      placeholder="e.g. 125000"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Officer in Charge</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={wardFormData.officerInCharge}
                    onChange={(e) => setWardFormData({ ...wardFormData, officerInCharge: e.target.value })}
                    placeholder="e.g. Ramesh Nair"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact Phone</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={wardFormData.contactNumber}
                      onChange={(e) => setWardFormData({ ...wardFormData, contactNumber: e.target.value })}
                      placeholder="+91 98200 00000"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Official Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={wardFormData.email}
                      onChange={(e) => setWardFormData({ ...wardFormData, email: e.target.value })}
                      placeholder="ward6@civicpulse.in"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ward Office Address</label>
                  <textarea
                    className={styles.formTextarea}
                    value={wardFormData.officeAddress}
                    onChange={(e) => setWardFormData({ ...wardFormData, officeAddress: e.target.value })}
                    placeholder="Enter physical ward office building & landmark..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowAddWard(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave}>
                  Save Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: EDIT WARD
          ============================================================ */}
      {showEditWard && selectedWard && (
        <div className={styles.modalOverlay} onClick={() => setShowEditWard(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit {selectedWard.name}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowEditWard(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditWard}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ward Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={wardFormData.name}
                      onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.formSelect}
                      value={wardFormData.status}
                      onChange={(e) => setWardFormData({ ...wardFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Area (km²)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={wardFormData.areaKm2}
                      onChange={(e) => setWardFormData({ ...wardFormData, areaKm2: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Population</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={wardFormData.population}
                      onChange={(e) => setWardFormData({ ...wardFormData, population: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Officer in Charge</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={wardFormData.officerInCharge}
                    onChange={(e) => setWardFormData({ ...wardFormData, officerInCharge: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Contact Phone</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={wardFormData.contactNumber}
                      onChange={(e) => setWardFormData({ ...wardFormData, contactNumber: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={wardFormData.email}
                      onChange={(e) => setWardFormData({ ...wardFormData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Office Address</label>
                  <textarea
                    className={styles.formTextarea}
                    value={wardFormData.officeAddress}
                    onChange={(e) => setWardFormData({ ...wardFormData, officeAddress: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowEditWard(false)}
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

      {/* ============================================================
          MODAL 3: VIEW WARD
          ============================================================ */}
      {showViewWard && selectedWard && (
        <div className={styles.modalOverlay} onClick={() => setShowViewWard(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className={styles.modalTitle}>{selectedWard.name} Details</h3>
                <span className={styles.wardStatusBadge}>{selectedWard.status}</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowViewWard(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.viewGrid}>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Area</span>
                  <span className={styles.viewValue}>{selectedWard.areaKm2} km²</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Population</span>
                  <span className={styles.viewValue}>{selectedWard.population.toLocaleString('en-IN')} residents</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Total Issues Reported</span>
                  <span className={styles.viewValue}>{selectedWard.totalIssues}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Resolution Rate</span>
                  <span className={styles.viewValue} style={{ color: '#14b8a6', fontWeight: 700 }}>
                    {selectedWard.resolutionRate}%
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Resolved Issues</span>
                  <span className={styles.viewValue} style={{ color: '#10b981' }}>
                    {selectedWard.resolvedCount}
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>In Progress</span>
                  <span className={styles.viewValue} style={{ color: '#f59e0b' }}>
                    {selectedWard.inProgressCount}
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Critical Issues</span>
                  <span className={styles.viewValue} style={{ color: '#ef4444' }}>
                    {selectedWard.criticalIssuesCount}
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Officer in Charge</span>
                  <span className={styles.viewValue}>{selectedWard.officerInCharge}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Contact Phone</span>
                  <span className={styles.viewValue}>{selectedWard.contactNumber}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Official Email</span>
                  <span className={styles.viewValue}>{selectedWard.email}</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Office Location & Address</span>
                  <span className={styles.viewValue} style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {selectedWard.officeAddress}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowViewWard(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.btnSave}
                onClick={() => {
                  setShowViewWard(false);
                  handleOpenEditWard(selectedWard);
                }}
              >
                Edit Ward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: ADD USER
          ============================================================ */}
      {showAddUser && (
        <div className={styles.modalOverlay} onClick={() => setShowAddUser(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add System User</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAddUser(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAddUser}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kulkarni"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Official Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      placeholder="ramesh.k@civicpulse.in"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>System Role</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as SystemUserRole })}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Ward Officer">Ward Officer</option>
                      <option value="Staff">Staff</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Assigned Ward</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.assignedWard}
                      onChange={(e) => setUserFormData({ ...userFormData, assignedWard: e.target.value })}
                    >
                      <option value="All Wards">All Wards</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="+91 98200 12345"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Status</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 5: EDIT USER
          ============================================================ */}
      {showEditUser && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowEditUser(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit User: {selectedUser.name}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowEditUser(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditUser}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Official Email</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>System Role</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as SystemUserRole })}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Ward Officer">Ward Officer</option>
                      <option value="Staff">Staff</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Assigned Ward</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.assignedWard}
                      onChange={(e) => setUserFormData({ ...userFormData, assignedWard: e.target.value })}
                    >
                      <option value="All Wards">All Wards</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Account Status</label>
                    <select
                      className={styles.formSelect}
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowEditUser(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave}>
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 6: DELETE USER CONFIRMATION
          ============================================================ */}
      {showDeleteUser && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteUser(false)}>
          <div className={styles.modalContainer} style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>
                Remove User
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowDeleteUser(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong style={{ color: '#ffffff' }}>{selectedUser.name}</strong> ({selectedUser.email}) from the CivicPulse Super Admin portal?
              </p>
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10 }}>
                This user will lose access immediately. This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowDeleteUser(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDelete}
                onClick={handleConfirmDeleteUser}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
