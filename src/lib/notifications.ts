/**
 * CivicPulse Notifications Data Service
 * 
 * Provides notification models, persistence, and state management
 * scoped strictly to the authenticated citizen.
 */

import { CivicReport, getCitizenReports, ReportPriority, ReportStatus } from './reports';

export type NotificationCategory = 'updates' | 'announcements' | 'system';
export type NotificationVisualType = 'resolved' | 'in_progress' | 'assigned' | 'warning' | 'announcement' | 'system';

export interface NotificationTimelineItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: 'resolved' | 'progress' | 'assigned' | 'submitted';
}

export interface CivicNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  previewMessage: string;
  category: NotificationCategory;
  visualType: NotificationVisualType;
  badgeLabel: string;
  timestamp: number;
  timeAgo: string;
  isRead: boolean;

  // Associated report reference if category === 'updates'
  reportId?: string;
  reportTicketId?: string;
  reportTitle?: string;
  reportStatus?: ReportStatus;
  reportPriority?: ReportPriority;
  reportLocation?: string;
  reportReportedDate?: string;
  reportImageUrl?: string;

  // Recent updates timeline for the notification
  timeline?: NotificationTimelineItem[];

  // Announcement specific details
  announcementDetails?: {
    ward?: string;
    department?: string;
    effectiveDate?: string;
  };
}

const NOTIFICATIONS_STORAGE_PREFIX = 'civicpulse_citizen_notifications';

// Pre-seeded initial notifications matching the approved visual reference design
export const ROHAN_INITIAL_NOTIFICATIONS: CivicNotification[] = [
  {
    id: 'notif_1',
    userId: 'usr_rohan_mehta',
    title: 'Your report has been resolved',
    previewMessage: 'Your report "Water leakage on 3rd Cross Lane" has been resolved. Thank you for helping make your city better!',
    message: 'Your report "Water leakage on 3rd Cross Lane" (#CP-10337) has been resolved. The issue has been fixed by the ward team.\n\nThank you for helping make Mira Bhayandar a cleaner, safer and stronger city!',
    category: 'updates',
    visualType: 'resolved',
    badgeLabel: 'Update',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    timeAgo: '2 hours ago',
    isRead: false,
    reportId: 'rep_4',
    reportTicketId: '#CP-10337',
    reportTitle: 'Water leakage on 3rd Cross Lane',
    reportStatus: 'resolved',
    reportPriority: 'Medium priority',
    reportLocation: '3rd Cross Lane, Mira Bhayandar',
    reportReportedDate: 'Reported on 08 Dec 2024, 11:20 AM',
    reportImageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    timeline: [
      {
        id: 'tl_1',
        title: 'Issue resolved',
        description: 'The repair work has been completed and the issue is now resolved.',
        timeAgo: '2 hours ago',
        type: 'resolved',
      },
      {
        id: 'tl_2',
        title: 'Work in progress',
        description: 'The ward team started the repair work at the location.',
        timeAgo: '1 day ago',
        type: 'progress',
      },
      {
        id: 'tl_3',
        title: 'Assigned to ward team',
        description: 'The issue has been assigned to Ward Team A.',
        timeAgo: '2 days ago',
        type: 'assigned',
      },
      {
        id: 'tl_4',
        title: 'Report submitted',
        description: 'You reported this issue.',
        timeAgo: '5 days ago',
        type: 'submitted',
      },
    ],
  },
  {
    id: 'notif_2',
    userId: 'usr_rohan_mehta',
    title: 'Work in progress',
    previewMessage: 'The issue "Pothole on Station Road" has been assigned to the ward team and repair work has started.',
    message: 'The issue "Pothole on Station Road" (#CP-10345) has been assigned to the ward team and repair work has started.\n\nRoad maintenance crew and bitumen surfacing equipment are currently active on site.',
    category: 'updates',
    visualType: 'in_progress',
    badgeLabel: 'Update',
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    timeAgo: '5 hours ago',
    isRead: false,
    reportId: 'rep_1',
    reportTicketId: '#CP-10345',
    reportTitle: 'Pothole on Station Road',
    reportStatus: 'in_progress',
    reportPriority: 'High priority',
    reportLocation: 'Station Road, Mira Road (E)',
    reportReportedDate: 'Reported on 12 Dec 2024, 04:32 PM',
    reportImageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    timeline: [
      {
        id: 'tl_21',
        title: 'Work in progress',
        description: 'The ward team started the repair work at the location.',
        timeAgo: '5 hours ago',
        type: 'progress',
      },
      {
        id: 'tl_22',
        title: 'Assigned to ward team',
        description: 'The issue has been assigned to Ward Team 3 Road Maintenance Unit.',
        timeAgo: '1 day ago',
        type: 'assigned',
      },
      {
        id: 'tl_23',
        title: 'Report submitted',
        description: 'You reported this issue.',
        timeAgo: '2 days ago',
        type: 'submitted',
      },
    ],
  },
  {
    id: 'notif_3',
    userId: 'usr_rohan_mehta',
    title: 'Waste collection schedule update',
    previewMessage: 'Garbage collection timing in Ward 5 has been updated. Please check the new schedule.',
    message: 'Garbage collection timing in Ward 5 has been updated. Please check the new schedule to ensure timely household waste pickup.\n\nMorning collection will now run from 07:00 AM to 09:30 AM daily.',
    category: 'announcements',
    visualType: 'announcement',
    badgeLabel: 'Announcement',
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    timeAgo: '1 day ago',
    isRead: false,
    announcementDetails: {
      ward: 'Ward 5 (Mira Road East)',
      department: 'Solid Waste Management',
      effectiveDate: 'Effective immediately',
    },
    timeline: [
      {
        id: 'tl_31',
        title: 'Announcement published',
        description: 'New schedule circular issued by Municipal Sanitation Bureau.',
        timeAgo: '1 day ago',
        type: 'progress',
      },
      {
        id: 'tl_32',
        title: 'Ward review completed',
        description: 'Route optimization plan approved for Ward 5 residential blocks.',
        timeAgo: '2 days ago',
        type: 'assigned',
      },
    ],
  },
  {
    id: 'notif_4',
    userId: 'usr_rohan_mehta',
    title: 'Your report has been assigned',
    previewMessage: 'Your report "Streetlight not working" has been assigned to Ward Team B.',
    message: 'Your report "Streetlight not working" (#CP-10338) has been assigned to Ward Team B.\n\nElectrical maintenance crew will inspect the circuit and fixture on Kanakia Road.',
    category: 'updates',
    visualType: 'assigned',
    badgeLabel: 'Update',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    timeAgo: '2 days ago',
    isRead: true,
    reportId: 'rep_2',
    reportTicketId: '#CP-10338',
    reportTitle: 'Streetlight not working',
    reportStatus: 'resolved',
    reportPriority: 'Medium priority',
    reportLocation: 'Kanakia Road, Mira Road (E)',
    reportReportedDate: 'Reported on 09 Dec 2024, 07:15 PM',
    reportImageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    timeline: [
      {
        id: 'tl_41',
        title: 'Assigned to ward team',
        description: 'The issue has been assigned to Ward Team B Electrical Crew.',
        timeAgo: '2 days ago',
        type: 'assigned',
      },
      {
        id: 'tl_42',
        title: 'Report submitted',
        description: 'You reported this issue.',
        timeAgo: '3 days ago',
        type: 'submitted',
      },
    ],
  },
  {
    id: 'notif_5',
    userId: 'usr_rohan_mehta',
    title: 'New update on your report',
    previewMessage: 'There is a new update on "Garbage overflow near Vardhaman Park".',
    message: 'There is a new update on "Garbage overflow near Vardhaman Park" (#CP-10342).\n\nThe sanitation supervisor conducted an on-site survey and scheduled an extra waste collection truck.',
    category: 'updates',
    visualType: 'warning',
    badgeLabel: 'Update',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    timeAgo: '3 days ago',
    isRead: true,
    reportId: 'rep_3',
    reportTicketId: '#CP-10342',
    reportTitle: 'Garbage overflow',
    reportStatus: 'awaiting',
    reportPriority: 'Medium priority',
    reportLocation: 'Vardhaman Park, Mira Bhayandar',
    reportReportedDate: 'Reported on 11 Dec 2024, 09:20 AM',
    reportImageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    timeline: [
      {
        id: 'tl_51',
        title: 'Supervisor update',
        description: 'High waste volume noted; dispatching auxiliary collection unit.',
        timeAgo: '3 days ago',
        type: 'progress',
      },
      {
        id: 'tl_52',
        title: 'Report submitted',
        description: 'You reported this issue.',
        timeAgo: '4 days ago',
        type: 'submitted',
      },
    ],
  },
  {
    id: 'notif_6',
    userId: 'usr_rohan_mehta',
    title: 'Welcome to CivicPulse!',
    previewMessage: 'Thank you for joining CivicPulse. Start by reporting an issue in your area.',
    message: 'Thank you for joining CivicPulse! Mira Bhayandar Municipal Corporation is committed to citizen-first civic governance.\n\nYou can submit road, water, waste, and lighting issues with photos, track resolution milestones in real time, and verify ward progress.',
    category: 'system',
    visualType: 'system',
    badgeLabel: 'System',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    timeAgo: '5 days ago',
    isRead: true,
    timeline: [
      {
        id: 'tl_61',
        title: 'Account verified',
        description: 'Citizen profile activated with Mira Bhayandar municipal jurisdiction.',
        timeAgo: '5 days ago',
        type: 'progress',
      },
      {
        id: 'tl_62',
        title: 'Welcome to CivicPulse',
        description: 'Welcome to the unified civic response system.',
        timeAgo: '5 days ago',
        type: 'submitted',
      },
    ],
  },
];

function notifyListeners(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('civicpulse_notifications_updated'));
  }
}

/**
 * Fetch all notifications for a specific citizen.
 * Dynamically reconciles with user reports if available.
 */
export function getCitizenNotifications(userId: string): CivicNotification[] {
  if (!userId) return [];

  if (typeof window === 'undefined') {
    return userId === 'usr_rohan_mehta' || userId.includes('rohan') ? ROHAN_INITIAL_NOTIFICATIONS : [];
  }

  try {
    const raw = localStorage.getItem(`${NOTIFICATIONS_STORAGE_PREFIX}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }

  // Pre-seed demo notifications for Rohan Mehta
  if (userId === 'usr_rohan_mehta' || userId.includes('rohan')) {
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_PREFIX}_${userId}`, JSON.stringify(ROHAN_INITIAL_NOTIFICATIONS));
    } catch {
      // Ignore storage errors
    }
    return ROHAN_INITIAL_NOTIFICATIONS;
  }

  // Brand-new registered citizens start with a clean state (honest empty state)
  return [];
}

/**
 * Save notifications list for a specific citizen
 */
export function saveCitizenNotifications(userId: string, notifications: CivicNotification[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_PREFIX}_${userId}`, JSON.stringify(notifications));
      notifyListeners();
    } catch {
      // Ignore
    }
  }
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(userId: string, notificationId: string): CivicNotification[] {
  const current = getCitizenNotifications(userId);
  const updated = current.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
  saveCitizenNotifications(userId, updated);
  return updated;
}

/**
 * Mark a single notification as unread
 */
export function markNotificationAsUnread(userId: string, notificationId: string): CivicNotification[] {
  const current = getCitizenNotifications(userId);
  const updated = current.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n));
  saveCitizenNotifications(userId, updated);
  return updated;
}

/**
 * Mark all notifications for this citizen as read
 */
export function markAllNotificationsAsRead(userId: string): CivicNotification[] {
  const current = getCitizenNotifications(userId);
  const updated = current.map((n) => ({ ...n, isRead: true }));
  saveCitizenNotifications(userId, updated);
  return updated;
}

/**
 * Calculate unread count for a citizen
 */
export function getUnreadNotificationCount(userId: string, category?: NotificationCategory | 'all'): number {
  const list = getCitizenNotifications(userId);
  if (!category || category === 'all') {
    return list.filter((n) => !n.isRead).length;
  }
  return list.filter((n) => n.category === category && !n.isRead).length;
}

/**
 * Calculate tab counts (unread counts per tab matching reference image)
 */
export function getNotificationTabCounts(notifications: CivicNotification[]) {
  return {
    all: notifications.filter((n) => !n.isRead).length,
    updates: notifications.filter((n) => n.category === 'updates' && !n.isRead).length,
    announcements: notifications.filter((n) => n.category === 'announcements' && !n.isRead).length,
    system: notifications.filter((n) => n.category === 'system' && !n.isRead).length,
    totalAll: notifications.length,
    totalUpdates: notifications.filter((n) => n.category === 'updates').length,
    totalAnnouncements: notifications.filter((n) => n.category === 'announcements').length,
    totalSystem: notifications.filter((n) => n.category === 'system').length,
  };
}
