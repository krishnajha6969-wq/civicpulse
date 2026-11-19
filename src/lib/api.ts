/**
 * CivicPulse — Unified API Client
 * All frontend → backend API calls go through this module.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core fetch wrapper with credentials, error handling, and typed responses
 */
async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Attach token from localStorage if available (fallback for non-cookie auth)
  if (!skipAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('civicpulse_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send cookies
  });

  // Handle no-content responses
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
}

// ═══════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════
export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  googleLogin: (idToken: string) =>
    request<{ user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<any>('/auth/me'),
};

// ═══════════════════════════════════════════
// ISSUES API
// ═══════════════════════════════════════════
export interface IssueFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  wardId?: string;
  search?: string;
  assignedToMe?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const issuesApi = {
  list: (filters: IssueFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    return request<{ issues: any[]; pagination: any }>(`/issues?${params.toString()}`);
  },

  get: (id: string) =>
    request<any>(`/issues/${id}`),

  create: (body: {
    title: string;
    description: string;
    category: string;
    priority?: string;
    latitude: number;
    longitude: number;
    address: string;
    wardId: string;
  }) =>
    request<any>('/issues', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateStatus: (id: string, body: { status: string; note?: string }) =>
    request<any>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  assign: (id: string, body: { teamId?: string; staffId?: string; reason?: string }) =>
    request<any>(`/issues/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  addComment: (id: string, body: { comment: string; visibility?: string }) =>
    request<any>(`/issues/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ═══════════════════════════════════════════
// TEAMS API
// ═══════════════════════════════════════════
export const teamsApi = {
  list: (wardId?: string) => {
    const params = wardId ? `?wardId=${wardId}` : '';
    return request<any[]>(`/teams${params}`);
  },

  updateStatus: (id: string, status: string) =>
    request<any>(`/teams/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ═══════════════════════════════════════════
// WARDS API
// ═══════════════════════════════════════════
export const wardsApi = {
  list: () =>
    request<any[]>('/wards'),

  getStats: (id: string) =>
    request<any>(`/wards/${id}/stats`),
};

// ═══════════════════════════════════════════
// NOTIFICATIONS API
// ═══════════════════════════════════════════
export const notificationsApi = {
  list: (page?: number, unreadOnly?: boolean) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (unreadOnly) params.set('unreadOnly', 'true');
    return request<{ notifications: any[]; unreadCount: number; pagination: any }>(
      `/notifications?${params.toString()}`
    );
  },

  markRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<any>('/notifications/read-all', { method: 'PATCH' }),
};

// ═══════════════════════════════════════════
// REPORTS API
// ═══════════════════════════════════════════
export const reportsApi = {
  dashboard: (wardId?: string) => {
    const params = wardId ? `?wardId=${wardId}` : '';
    return request<any>(`/reports/dashboard${params}`);
  },

  wardAnalytics: (wardId?: string) => {
    const params = wardId ? `?wardId=${wardId}` : '';
    return request<any>(`/reports/ward-analytics${params}`);
  },

  cityOverview: () =>
    request<any>('/reports/city-overview'),
};

// ═══════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════
export const healthCheck = () =>
  request<{ status: string; timestamp: string }>('/../../health', { skipAuth: true });

export { ApiError };
export default { authApi, issuesApi, teamsApi, wardsApi, notificationsApi, reportsApi, healthCheck };
