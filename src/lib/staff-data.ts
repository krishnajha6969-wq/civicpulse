/**
 * CivicPulse — Ward Staff Operations: Centralized Data Layer
 *
 * Dedicated data models and queries for Mira Bhayandar Municipal Corporation (MBMC)
 * Ward 3 (Supervisor: Sandeep Jadhav).
 * Provides structured datasets for:
 *  - Ward Performance Analytics (KPIs, multi-period trends, category & team efficiency)
 *  - Field Operations & Teams Dispatching
 *  - Issue Resolution Workflow Steps
 *  - Knowledge Base Articles & Support Requests
 *  - Enhanced Operational Notifications
 */

import {
  StaffIssue,
  getWardStaffIssues,
  FieldTeam,
  getFieldTeams,
  StaffIssueStatus,
} from './staff';

// ─── 1. WARD PERFORMANCE DATA ──────────────────────────────────────────────

export interface WardPerformanceKPI {
  totalIssues: number;
  totalIssuesChange: number; // e.g. +8%
  resolutionRate: number; // e.g. 68%
  resolutionRateChange: number;
  avgResolutionDays: number; // e.g. 3.4
  avgResolutionChange: number;
  slaCompliance: number; // e.g. 84%
  slaComplianceChange: number;
  overdueIssues: number;
  overdueChange: number;
  citizenSatisfaction: number; // e.g. 4.3 / 5
  satisfactionChange: number;
}

export interface WardPerformanceTrend {
  periodLabel: string;
  received: number;
  resolved: number;
  slaCompliance: number;
  resolutionRate: number;
}

export interface CategoryPerformance {
  category: string;
  label: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  avgDays: number;
  slaCompliance: number;
  color: string;
}

export interface TeamPerformanceRow {
  id: string;
  teamName: string;
  department: string;
  leader: string;
  assigned: number;
  completed: number;
  pending: number;
  slaCompliance: number;
  avgResolutionTime: string;
  efficiencyScore: number;
}

export interface WardPerformanceData {
  wardName: string;
  kpis: WardPerformanceKPI;
  trends7d: WardPerformanceTrend[];
  trends30d: WardPerformanceTrend[];
  trends3m: WardPerformanceTrend[];
  categoryPerformance: CategoryPerformance[];
  teamPerformance: TeamPerformanceRow[];
}

export function getWardPerformanceData(): WardPerformanceData {
  const issues = getWardStaffIssues();
  const total = issues.length || 42;
  const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const overdue = issues.filter(i => i.status === 'Overdue' || i.slaStatus === 'Overdue').length;
  const resolutionRate = Math.round((resolved / total) * 100);

  return {
    wardName: 'Ward 3 (Mira Bhayandar)',
    kpis: {
      totalIssues: total,
      totalIssuesChange: 8,
      resolutionRate: resolutionRate > 0 ? resolutionRate : 68,
      resolutionRateChange: 12,
      avgResolutionDays: 3.4,
      avgResolutionChange: -0.6,
      slaCompliance: 84,
      slaComplianceChange: 5,
      overdueIssues: overdue > 0 ? overdue : 6,
      overdueChange: -2,
      citizenSatisfaction: 4.3,
      satisfactionChange: 0.3,
    },
    trends7d: [
      { periodLabel: 'Mon 13 Nov', received: 6, resolved: 5, slaCompliance: 86, resolutionRate: 83 },
      { periodLabel: 'Tue 14 Nov', received: 8, resolved: 7, slaCompliance: 88, resolutionRate: 87 },
      { periodLabel: 'Wed 15 Nov', received: 5, resolved: 6, slaCompliance: 92, resolutionRate: 100 },
      { periodLabel: 'Thu 16 Nov', received: 9, resolved: 8, slaCompliance: 84, resolutionRate: 89 },
      { periodLabel: 'Fri 17 Nov', received: 7, resolved: 6, slaCompliance: 82, resolutionRate: 86 },
      { periodLabel: 'Sat 18 Nov', received: 4, resolved: 5, slaCompliance: 90, resolutionRate: 100 },
      { periodLabel: 'Sun 19 Nov', received: 3, resolved: 4, slaCompliance: 95, resolutionRate: 100 },
    ],
    trends30d: [
      { periodLabel: 'Week 1', received: 28, resolved: 24, slaCompliance: 82, resolutionRate: 86 },
      { periodLabel: 'Week 2', received: 34, resolved: 31, slaCompliance: 85, resolutionRate: 91 },
      { periodLabel: 'Week 3', received: 29, resolved: 26, slaCompliance: 81, resolutionRate: 90 },
      { periodLabel: 'Week 4', received: 33, resolved: 30, slaCompliance: 88, resolutionRate: 91 },
    ],
    trends3m: [
      { periodLabel: 'September', received: 112, resolved: 98, slaCompliance: 79, resolutionRate: 87 },
      { periodLabel: 'October', received: 130, resolved: 119, slaCompliance: 83, resolutionRate: 91 },
      { periodLabel: 'November', received: 124, resolved: 111, slaCompliance: 86, resolutionRate: 90 },
    ],
    categoryPerformance: [
      { category: 'roads', label: 'Roads & Pavements', total: 18, resolved: 12, resolutionRate: 67, avgDays: 4.1, slaCompliance: 78, color: '#f59e0b' },
      { category: 'waste', label: 'Sanitation & Garbage', total: 14, resolved: 11, resolutionRate: 79, avgDays: 1.8, slaCompliance: 91, color: '#10b981' },
      { category: 'streetlights', label: 'Street Lighting', total: 12, resolved: 9, resolutionRate: 75, avgDays: 2.2, slaCompliance: 88, color: '#a855f7' },
      { category: 'water', label: 'Water Supply', total: 10, resolved: 7, resolutionRate: 70, avgDays: 2.5, slaCompliance: 80, color: '#06b6d4' },
      { category: 'drainage', label: 'Drainage & Stormwater', total: 8, resolved: 5, resolutionRate: 63, avgDays: 3.8, slaCompliance: 75, color: '#6366f1' },
      { category: 'parks', label: 'Public Parks', total: 6, resolved: 5, resolutionRate: 83, avgDays: 2.0, slaCompliance: 94, color: '#22c55e' },
      { category: 'transport', label: 'Traffic & Signage', total: 5, resolved: 4, resolutionRate: 80, avgDays: 2.7, slaCompliance: 85, color: '#f97316' },
      { category: 'other', label: 'General Civic', total: 4, resolved: 3, resolutionRate: 75, avgDays: 3.0, slaCompliance: 82, color: '#64748b' },
    ],
    teamPerformance: [
      {
        id: 'team-1',
        teamName: 'Team 1 — Road Maintenance',
        department: 'Engineering & Pavements',
        leader: 'Rahul Patil',
        assigned: 16,
        completed: 12,
        pending: 4,
        slaCompliance: 82,
        avgResolutionTime: '3.1 days',
        efficiencyScore: 89,
      },
      {
        id: 'team-2',
        teamName: 'Team 2 — Sanitation & Waste',
        department: 'Public Health & Hygiene',
        leader: 'Priya Desai',
        assigned: 14,
        completed: 12,
        pending: 2,
        slaCompliance: 93,
        avgResolutionTime: '1.6 days',
        efficiencyScore: 95,
      },
      {
        id: 'team-3',
        teamName: 'Team 3 — Streetlights & Electrical',
        department: 'Electrical Works',
        leader: 'Amit Sharma',
        assigned: 11,
        completed: 8,
        pending: 3,
        slaCompliance: 86,
        avgResolutionTime: '2.1 days',
        efficiencyScore: 88,
      },
      {
        id: 'team-4',
        teamName: 'Team 4 — General Maintenance',
        department: 'Civic Infrastructure',
        leader: 'Suresh Nair',
        assigned: 9,
        completed: 6,
        pending: 3,
        slaCompliance: 80,
        avgResolutionTime: '3.6 days',
        efficiencyScore: 81,
      },
    ],
  };
}

// ─── 2. FIELD TEAMS ENHANCED ──────────────────────────────────────────────

export interface FieldTeamEnhanced {
  id: string;
  teamName: string;
  department: string;
  status: 'Available' | 'On Assignment' | 'Busy' | 'Offline';
  leader: string;
  members: number;
  phone: string;
  vehicle: string;
  currentIssueId?: string;
  currentLocation: string;
  tasksToday: number;
  tasksCompleted: number;
  lat: number;
  lng: number;
}

export const INITIAL_FIELD_TEAMS_ENHANCED: FieldTeamEnhanced[] = [
  {
    id: 'team-1',
    teamName: 'Team 1 — Road Maintenance',
    department: 'Roads & Infrastructure',
    status: 'On Assignment',
    leader: 'Rahul Patil',
    members: 5,
    phone: '+91 98201 44101',
    vehicle: 'MH-04-AY-1182 (Tipper Truck)',
    currentIssueId: 'CP-1048',
    currentLocation: 'Station Road, Bhayandar (W)',
    tasksToday: 5,
    tasksCompleted: 3,
    lat: 19.3032,
    lng: 72.8524,
  },
  {
    id: 'team-2',
    teamName: 'Team 2 — Sanitation & Waste',
    department: 'Sanitation & Solid Waste',
    status: 'Available',
    leader: 'Priya Desai',
    members: 4,
    phone: '+91 98201 44102',
    vehicle: 'MH-04-BW-4890 (Compactor Van)',
    currentLocation: 'Sector 4 Depot, Shanti Nagar',
    tasksToday: 4,
    tasksCompleted: 4,
    lat: 19.2985,
    lng: 72.8592,
  },
  {
    id: 'team-3',
    teamName: 'Team 3 — Streetlights & Electrical',
    department: 'Electrical Maintenance',
    status: 'Busy',
    leader: 'Amit Sharma',
    members: 3,
    phone: '+91 98201 44103',
    vehicle: 'MH-04-CK-7712 (Hydraulic Ladder)',
    currentIssueId: 'CP-1051',
    currentLocation: 'Kanakia Road, Mira Road (E)',
    tasksToday: 4,
    tasksCompleted: 2,
    lat: 19.2891,
    lng: 72.8687,
  },
  {
    id: 'team-4',
    teamName: 'Team 4 — General Maintenance',
    department: 'Civil Works & Drainage',
    status: 'Available',
    leader: 'Suresh Nair',
    members: 4,
    phone: '+91 98201 44104',
    vehicle: 'MH-04-DF-3341 (Utility Van)',
    currentLocation: 'Ward 3 Municipal Office',
    tasksToday: 3,
    tasksCompleted: 2,
    lat: 19.301,
    lng: 72.855,
  },
];

const STORAGE_KEY_FIELD_TEAMS_ENHANCED = 'civicpulse_staff_field_teams_enhanced';

export function getFieldTeamsEnhanced(): FieldTeamEnhanced[] {
  if (typeof window === 'undefined') return INITIAL_FIELD_TEAMS_ENHANCED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIELD_TEAMS_ENHANCED);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_FIELD_TEAMS_ENHANCED;
}

export function saveFieldTeamsEnhanced(teams: FieldTeamEnhanced[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FIELD_TEAMS_ENHANCED, JSON.stringify(teams));
  } catch {}
}

export function dispatchTeamEnhanced(teamId: string, issueId: string, location: string): FieldTeamEnhanced[] {
  const teams = getFieldTeamsEnhanced();
  const updated = teams.map(t => {
    if (t.id === teamId) {
      return {
        ...t,
        status: 'On Assignment' as const,
        currentIssueId: issueId,
        currentLocation: location,
        tasksToday: t.tasksToday + 1,
      };
    }
    return t;
  });
  saveFieldTeamsEnhanced(updated);
  return updated;
}

// ─── 3. RESOLUTION WORKFLOW STEPS ──────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
  actor?: string;
}

export function getIssueWorkflowSteps(status: StaffIssueStatus, reportedDate: string = '18 Nov 2026, 09:15 AM'): WorkflowStep[] {
  const steps: { id: string; label: string; description: string }[] = [
    { id: 'reported', label: 'Reported', description: 'Citizen submitted grievance via CivicPulse portal' },
    { id: 'assigned', label: 'Assigned', description: 'Routed to Ward 3 & Field Supervisor Sandeep Jadhav' },
    { id: 'dispatched', label: 'Team Dispatched', description: 'Field team dispatched with equipment' },
    { id: 'work_started', label: 'Work Started', description: 'On-site maintenance initiated by team' },
    { id: 'resolution_submitted', label: 'Resolution Submitted', description: 'Completion evidence & before/after photos uploaded' },
    { id: 'verified', label: 'Supervisor Verified', description: 'Ward supervisor inspected & approved work quality' },
    { id: 'resolved', label: 'Fully Resolved', description: 'Issue closed & notification dispatched to citizen' },
  ];

  let activeIndex = 0;
  switch (status) {
    case 'New':
      activeIndex = 0;
      break;
    case 'Verified':
    case 'Assigned':
      activeIndex = 1;
      break;
    case 'In Progress':
    case 'Awaiting Materials':
      activeIndex = 3;
      break;
    case 'Resolution Submitted' as StaffIssueStatus:
      activeIndex = 4;
      break;
    case 'Resolved':
    case 'Closed':
      activeIndex = 6;
      break;
    case 'Overdue':
      activeIndex = 2;
      break;
    default:
      activeIndex = 1;
  }

  return steps.map((step, idx) => {
    let completed = idx < activeIndex;
    let current = idx === activeIndex;
    if (status === 'Resolved' || status === 'Closed') {
      completed = true;
      current = idx === 6;
    }

    let timestamp: string | undefined;
    let actor: string | undefined;

    if (idx === 0) {
      timestamp = reportedDate;
      actor = 'Citizen Portal (Mobile)';
    } else if (idx === 1 && completed) {
      timestamp = '18 Nov 2026, 10:30 AM';
      actor = 'MBMC Central Dispatcher';
    } else if (idx === 2 && completed) {
      timestamp = '18 Nov 2026, 11:45 AM';
      actor = 'Supervisor Sandeep Jadhav';
    } else if (idx === 3 && completed) {
      timestamp = '18 Nov 2026, 01:15 PM';
      actor = 'Field Team Leader';
    } else if (idx === 4 && completed) {
      timestamp = '18 Nov 2026, 04:30 PM';
      actor = 'Field Team Upload';
    } else if (idx === 5 && completed) {
      timestamp = '18 Nov 2026, 05:10 PM';
      actor = 'Supervisor Sandeep Jadhav';
    } else if (idx === 6 && completed) {
      timestamp = '18 Nov 2026, 05:30 PM';
      actor = 'System Auto-Closure';
    }

    return {
      id: step.id,
      label: step.label,
      description: step.description,
      completed,
      current,
      timestamp,
      actor,
    };
  });
}

// ─── 4. KNOWLEDGE BASE & HELP ARTICLES ─────────────────────────────────────

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  readTime: number;
  summary: string;
  content: string[];
  tags: string[];
  popular?: boolean;
}

export interface HelpCategory {
  id: string;
  label: string;
  count: number;
  icon: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', label: 'Getting Started', count: 6, icon: 'book' },
  { id: 'issue-management', label: 'Issue Management', count: 8, icon: 'layers' },
  { id: 'field-operations', label: 'Field Operations', count: 6, icon: 'map-pin' },
  { id: 'resolution-process', label: 'Resolution Process', count: 6, icon: 'check-circle' },
  { id: 'reports-analytics', label: 'Reports & Analytics', count: 5, icon: 'bar-chart' },
  { id: 'account-settings', label: 'Account & Settings', count: 4, icon: 'settings' },
  { id: 'technical-support', label: 'Technical Support', count: 5, icon: 'headphones' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'gs-1',
    title: 'Ward Staff Portal Overview & Shift Handover',
    category: 'getting-started',
    categoryLabel: 'Getting Started',
    readTime: 4,
    popular: true,
    summary: 'A complete orientation of the CivicPulse operations dashboard, KPI monitors, and daily shift procedures.',
    tags: ['dashboard', 'shift', 'orientation'],
    content: [
      'The CivicPulse Ward Staff Portal is designed for field supervisors and municipal coordinators in Mira Bhayandar Municipal Corporation (MBMC). As a Ward Supervisor, your primary portal responsibilities include reviewing incoming citizen complaints, dispatching qualified field teams, monitoring real-time SLA deadlines, and validating resolution proof before closure.',
      'Upon signing in each morning, check the KPI summary bar: pay particular attention to the "Overdue" and "Critical" metrics. The Assigned Issues page will display all open tickets under Ward 3 jurisdiction, ordered by urgent SLA timers.',
      'During shift handovers, supervisors can add internal shift handover notes under each issue so the incoming officer is aware of material delays or ongoing road resurfacing permits.',
    ],
  },
  {
    id: 'im-1',
    title: 'How to Accept, Re-prioritize, and Assign Issues',
    category: 'issue-management',
    categoryLabel: 'Issue Management',
    readTime: 5,
    popular: true,
    summary: 'Detailed guide on inspecting new tickets, assessing site severity, and assigning to dedicated field teams.',
    tags: ['assign', 'priority', 'sla'],
    content: [
      'When an issue arrives with "New" status, the supervisor must review the citizen-provided photo, GPS coordinates, and description. If the citizen reported a severe pothole that occupies more than half a lane on an arterial road (like Station Road), upgrade the priority from Medium to High or Critical.',
      'To assign an issue: Open the issue detail panel, click "Assign Team", select one of the four municipal units (Road Maintenance, Sanitation, Streetlights, or General Maintenance), and confirm.',
      'The assigned team leader immediately receives a mobile push notification and the issue status transitions to "Assigned" while the SLA timer begins tracking.',
    ],
  },
  {
    id: 'fo-1',
    title: 'Managing Municipal Field Teams & Real-Time Dispatch',
    category: 'field-operations',
    categoryLabel: 'Field Operations',
    readTime: 6,
    popular: true,
    summary: 'How to view team vehicle locations, assign emergency work orders, and re-balance crew workloads.',
    tags: ['teams', 'dispatch', 'fleet', 'map'],
    content: [
      'The Field Operations workspace gives you an interactive SVG map showing all four ward teams and active issue clusters across Ward 3.',
      'Teams marked "Available" in green can be assigned instantly using the "Dispatch" button on their card. When a team is already "On Assignment", you can either queue a secondary task or view their estimated finish time.',
      'In emergency events (such as water pipe bursts or fallen trees blocking traffic), use the Emergency Dispatch modal to re-route the closest team immediately, overriding standard FIFO queues.',
    ],
  },
  {
    id: 'rp-1',
    title: 'Uploading Resolution Evidence and Before/After Photos',
    category: 'resolution-process',
    categoryLabel: 'Resolution Process',
    readTime: 4,
    popular: true,
    summary: 'Standards for municipal work verification, photographic proof, and supervisor sign-off.',
    tags: ['photos', 'evidence', 'verification', 'closure'],
    content: [
      'MBMC quality audit protocols mandate that no civic grievance may be marked "Resolved" without verifiable before-and-after photographic evidence and a work completion summary.',
      'In the Resolution Updates page, select the active issue from the left panel. Enter the resolution description detailing materials used (e.g., "1.2 MT hot-mix asphalt laid and compacted") and upload the completion photo.',
      'Once submitted, the supervisor clicks "Supervisor Verify". Only after verification does the system mark the issue as Fully Resolved and notify the citizen with a rating request.',
    ],
  },
  {
    id: 'ra-1',
    title: 'Understanding Ward Analytics & SLA Compliance Reports',
    category: 'reports-analytics',
    categoryLabel: 'Reports & Analytics',
    readTime: 5,
    summary: 'How to interpret category breakdowns, resolution rates, and export monthly audit reports.',
    tags: ['analytics', 'kpi', 'export', 'audit'],
    content: [
      'Ward Reports aggregate performance data across all 8 civic categories: Roads, Water, Sanitation, Streetlights, Drainage, Parks, Transport, and General.',
      'SLA Compliance is calculated as the percentage of issues resolved within the municipal service guarantee (e.g., 24 hours for streetlights, 48 hours for potholes). The MBMC target for Ward 3 is maintaining at least 80% SLA compliance.',
      'Use the "Download Report" button to export formatted CSV or PDF audit summaries suitable for submission to the Municipal Commissioner.',
    ],
  },
  {
    id: 'ts-1',
    title: 'Offline Field Syncing & Mobile Access Troubleshooting',
    category: 'technical-support',
    categoryLabel: 'Technical Support',
    readTime: 3,
    summary: 'Steps to resolve connectivity drops and sync local updates once network coverage is restored.',
    tags: ['offline', 'sync', 'troubleshooting'],
    content: [
      'When field teams are operating in basement pump rooms or low-signal zones along Dahisar Creek, the CivicPulse web application buffers status updates in local browser storage.',
      'Do not clear browser cache or refresh the page while offline. As soon as connectivity is restored, the green "Syncing" indicator will confirm that pending photos and timeline logs have reached the server.',
      'If synchronization fails, click "Retry Pending Sync" under Settings > System Status or contact the MBMC IT Helpdesk.',
    ],
  },
];

export function getHelpCategories(): HelpCategory[] {
  return HELP_CATEGORIES;
}

export function getHelpArticles(categoryId?: string, search?: string): HelpArticle[] {
  let list = HELP_ARTICLES;
  if (categoryId && categoryId !== 'all') {
    list = list.filter(a => a.category === categoryId);
  }
  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)));
  }
  return list;
}

export function getHelpArticle(id: string): HelpArticle | null {
  return HELP_ARTICLES.find(a => a.id === id) || null;
}

export interface SupportTicketSubmission {
  id: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  submittedAt: string;
  status: 'Open' | 'Under Review' | 'Resolved';
}

const STORAGE_KEY_SUPPORT_TICKETS = 'civicpulse_staff_support_tickets';

export function submitSupportTicket(data: Omit<SupportTicketSubmission, 'id' | 'submittedAt' | 'status'>): SupportTicketSubmission {
  const newTicket: SupportTicketSubmission = {
    ...data,
    id: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
    submittedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'Open',
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_SUPPORT_TICKETS) || '[]');
      existing.unshift(newTicket);
      localStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(existing));
    } catch {}
  }
  return newTicket;
}

// ─── 5. ENHANCED OPERATIONAL NOTIFICATIONS ────────────────────────────────

export interface StaffNotificationEnhanced {
  id: string;
  type: 'assignment' | 'sla_warning' | 'status_update' | 'team_update' | 'system' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  issueId?: string;
  actionUrl?: string;
}

export const INITIAL_STAFF_NOTIFICATIONS_ENHANCED: StaffNotificationEnhanced[] = [
  {
    id: 'notif-1',
    type: 'emergency',
    title: 'Urgent: Water Main Rupture',
    message: 'Pressurized water leak reported near Station Road Junction. Immediate team dispatch requested.',
    timestamp: '10 mins ago',
    read: false,
    priority: 'high',
    issueId: 'CP-1048',
    actionUrl: '/staff/field-operations',
  },
  {
    id: 'notif-2',
    type: 'sla_warning',
    title: 'SLA Warning: CP-1042 Due in 1 hour',
    message: 'Pothole complaint on Kanakia Road will breach municipal SLA guarantee at 11:30 AM.',
    timestamp: '25 mins ago',
    read: false,
    priority: 'high',
    issueId: 'CP-1042',
    actionUrl: '/staff/issues',
  },
  {
    id: 'notif-3',
    type: 'assignment',
    title: 'New Issue Routed to Ward 3',
    message: 'Damaged streetlight pole at Shanti Nagar Sector 4 assigned to your queue.',
    timestamp: '1 hour ago',
    read: false,
    priority: 'medium',
    issueId: 'CP-1053',
    actionUrl: '/staff/issues',
  },
  {
    id: 'notif-4',
    type: 'team_update',
    title: 'Team 2 Completed Sanitation Run',
    message: 'Priya Desai (Team 2) marked garbage clearance completed at Bhayandar West market.',
    timestamp: '2 hours ago',
    read: true,
    priority: 'low',
    issueId: 'CP-1039',
    actionUrl: '/staff/resolution-updates',
  },
  {
    id: 'notif-5',
    type: 'status_update',
    title: 'Citizen Verified Resolution',
    message: 'Citizen Rohit Verma rated repair on Drainage CP-1035 with 5 stars: "Fast and clean work".',
    timestamp: '3 hours ago',
    read: true,
    priority: 'low',
    issueId: 'CP-1035',
    actionUrl: '/staff/ward-reports',
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'Scheduled Portal Maintenance',
    message: 'MBMC IT maintenance window tonight 11:00 PM - 01:00 AM IST. Offline mode active during window.',
    timestamp: '5 hours ago',
    read: true,
    priority: 'low',
    actionUrl: '/staff/help',
  },
];

const STORAGE_KEY_STAFF_NOTIFS_ENHANCED = 'civicpulse_staff_notifications_enhanced';

export function getStaffNotificationsEnhanced(): StaffNotificationEnhanced[] {
  if (typeof window === 'undefined') return INITIAL_STAFF_NOTIFICATIONS_ENHANCED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_NOTIFS_ENHANCED);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_STAFF_NOTIFICATIONS_ENHANCED;
}

export function saveStaffNotificationsEnhanced(notifs: StaffNotificationEnhanced[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_NOTIFS_ENHANCED, JSON.stringify(notifs));
  } catch {}
}

export function markStaffNotificationReadEnhanced(id: string): StaffNotificationEnhanced[] {
  const notifs = getStaffNotificationsEnhanced();
  const updated = notifs.map(n => (n.id === id ? { ...n, read: true } : n));
  saveStaffNotificationsEnhanced(updated);
  return updated;
}

export function markAllStaffNotificationsReadEnhanced(): StaffNotificationEnhanced[] {
  const notifs = getStaffNotificationsEnhanced();
  const updated = notifs.map(n => ({ ...n, read: true }));
  saveStaffNotificationsEnhanced(updated);
  return updated;
}
