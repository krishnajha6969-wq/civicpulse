/**
 * CivicPulse Shared Authentication & Session Boundary Management
 * 
 * Provides shared identity definitions and persistent client session verification.
 */

export type UserRole = 'citizen' | 'ward_staff' | 'super_admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedWard?: string; // For ward staff scoping
  location?: string;
  avatarUrl?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  division?: string;
  assignedTeam?: string;
  teamSpecialty?: string;
  joiningDate?: string;
  createdAt?: string;
}

export interface SessionState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'civicpulse_session_user';
const USERS_STORAGE_KEY = 'civicpulse_registered_users';
const SIGNED_OUT_KEY = 'civicpulse_signed_out';

// Pre-seeded default citizen account matching the approved reference design
export const DEFAULT_CITIZEN: AuthUser = {
  id: 'usr_rohan_mehta',
  name: 'Rohan Mehta',
  email: 'rohan.mehta@example.com',
  role: 'citizen',
  location: 'Mira Bhayandar',
  avatarUrl: '/images/dashboard/user-avatar@2x.jpg',
  createdAt: '2026-09-01T10:00:00.000Z',
};

// Pre-seeded default Ward Staff account matching the approved reference design
export const DEFAULT_WARD_STAFF: AuthUser = {
  id: 'usr_sandeep_jadhav',
  name: 'Sandeep Jadhav',
  email: 'sandeep.jadhav@mbmc.gov.in',
  role: 'ward_staff',
  assignedWard: 'Ward 3',
  location: 'Ward 3, Mira Bhayandar',
  phone: '+91 98765 43210',
  employeeId: 'MBMC-WS-0142',
  department: 'Road Maintenance',
  division: 'Public Works',
  assignedTeam: 'Team 1',
  teamSpecialty: 'Road Maintenance',
  joiningDate: '15 Jan 2023',
  createdAt: '2023-01-15T09:00:00.000Z',
};

// Pre-seeded default Super Admin account matching the approved reference design
export const DEFAULT_SUPER_ADMIN: AuthUser = {
  id: 'usr_super_admin',
  name: 'Admin User',
  email: 'admin@mbmc.gov.in',
  role: 'super_admin',
  location: 'Mira Bhayandar Municipal Corporation',
  phone: '+91 22 2819 2828',
  employeeId: 'MBMC-HQ-0001',
  department: 'Central Administration',
  division: 'Commissioner Office',
  createdAt: '2023-01-01T00:00:00.000Z',
};

// In-memory session reference
let currentSessionUser: AuthUser | null = null;

export function getCurrentUser(): AuthUser | null {
  if (currentSessionUser) {
    return currentSessionUser;
  }

  // Check localStorage in browser environment
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem(SIGNED_OUT_KEY) === 'true') {
        return null;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentSessionUser = JSON.parse(stored) as AuthUser;
        return currentSessionUser;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // Default initial session for verified citizen Rohan Mehta
  return DEFAULT_CITIZEN;
}

export function setCurrentUser(user: AuthUser | null): void {
  currentSessionUser = user;
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.removeItem(SIGNED_OUT_KEY);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(SIGNED_OUT_KEY, 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function logout(): void {
  setCurrentUser(null);
}

/**
 * Register a new citizen and automatically sign them in
 */
export function registerCitizen(name: string, email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const newUser: AuthUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    role: 'citizen',
    location: 'Mira Bhayandar',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
      const users: AuthUser[] = usersStr ? JSON.parse(usersStr) : [];
      // Remove any existing entry with same email
      const filtered = users.filter((u) => u.email !== normalizedEmail);
      filtered.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore storage errors
    }
  }

  setCurrentUser(newUser);
  return newUser;
}

/**
 * Sign in a citizen by email
 */
export function loginCitizen(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();

  // If email matches the default citizen Rohan Mehta
  if (normalizedEmail.includes('rohan') || normalizedEmail === DEFAULT_CITIZEN.email) {
    setCurrentUser(DEFAULT_CITIZEN);
    return DEFAULT_CITIZEN;
  }

  // Check registered users in storage
  if (typeof window !== 'undefined') {
    try {
      const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersStr) {
        const users: AuthUser[] = JSON.parse(usersStr);
        const found = users.find((u) => u.email === normalizedEmail);
        if (found) {
          setCurrentUser(found);
          return found;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Derive friendly name from email if not previously registered
  const namePart = normalizedEmail.split('@')[0];
  const formattedName = namePart
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const authenticatedUser: AuthUser = {
    id: `usr_${Date.now()}`,
    name: formattedName || 'Citizen',
    email: normalizedEmail,
    role: 'citizen',
    location: 'Mira Bhayandar',
    createdAt: new Date().toISOString(),
  };

  setCurrentUser(authenticatedUser);
  return authenticatedUser;
}

/**
 * Sign in as authorized ward staff (e.g. Sandeep Jadhav, Ward 3)
 */
export function loginWardStaff(ward: string = 'Ward 3'): AuthUser {
  const staffUser: AuthUser = {
    ...DEFAULT_WARD_STAFF,
    assignedWard: ward,
  };
  setCurrentUser(staffUser);
  return staffUser;
}

/**
 * Sign in as authorized super admin (Admin User)
 */
export function loginSuperAdmin(): AuthUser {
  setCurrentUser(DEFAULT_SUPER_ADMIN);
  return DEFAULT_SUPER_ADMIN;
}

/**
 * Update current user profile fields and persist to storage
 */
export function updateUserProfile(updates: Partial<AuthUser>): AuthUser {
  const current = getCurrentUser() || DEFAULT_WARD_STAFF;
  const updated: AuthUser = {
    ...current,
    ...updates,
  };
  setCurrentUser(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('civicpulse_user_updated', { detail: updated }));
  }

  return updated;
}

export interface StaffNotificationPreferences {
  newAssignments: boolean;
  statusUpdates: boolean;
  overdueAlerts: boolean;
  fieldTeamUpdates: boolean;
  systemAnnouncements: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: StaffNotificationPreferences = {
  newAssignments: true,
  statusUpdates: true,
  overdueAlerts: true,
  fieldTeamUpdates: false,
  systemAnnouncements: true,
};

const NOTIF_PREFS_KEY = 'civicpulse_staff_notification_prefs';

export function getNotificationPreferences(): StaffNotificationPreferences {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(NOTIF_PREFS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  return DEFAULT_NOTIFICATION_PREFS;
}

export function saveNotificationPreferences(prefs: StaffNotificationPreferences): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }
  }
}

export interface StaffAppPreferences {
  language: string;
  theme: string;
}

export const DEFAULT_APP_PREFS: StaffAppPreferences = {
  language: 'English',
  theme: 'Dark (Default)',
};

const APP_PREFS_KEY = 'civicpulse_staff_app_prefs';

export function getAppPreferences(): StaffAppPreferences {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(APP_PREFS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  return DEFAULT_APP_PREFS;
}

export function saveAppPreferences(prefs: StaffAppPreferences): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APP_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }
  }
}

