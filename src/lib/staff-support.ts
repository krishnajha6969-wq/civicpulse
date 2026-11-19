/**
 * CivicPulse — Ward Staff Help & Support Services & Knowledge Base
 *
 * Provides structured documentation, guides, FAQs, system health indicators,
 * and support ticket submission for Mira Bhayandar municipal staff.
 */

export interface HelpCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  categoryId: string;
  summary: string;
  readingTime: string;
  popularRank?: number;
  sections: {
    heading: string;
    steps?: string[];
    content?: string;
  }[];
  tips?: string[];
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Maintenance';
  latency: string;
  uptime: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  description: string;
  relatedIssueId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  staffName: string;
  staffEmail: string;
  createdAt: string;
  status: 'Open' | 'Under Review' | 'Resolved';
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', name: 'Getting Started', count: 6, icon: 'book' },
  { id: 'issue-management', name: 'Issue Management', count: 8, icon: 'clipboard' },
  { id: 'field-operations', name: 'Field Operations', count: 6, icon: 'tool' },
  { id: 'resolution-process', name: 'Resolution Process', count: 6, icon: 'check-circle' },
  { id: 'reports-analytics', name: 'Reports & Analytics', count: 5, icon: 'bar-chart' },
  { id: 'account-settings', name: 'Account & Settings', count: 4, icon: 'settings' },
  { id: 'technical-support', name: 'Technical Support', count: 5, icon: 'life-buoy' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Getting Started ──
  {
    id: 'art-view-assigned-issues',
    title: 'How to view assigned issues',
    categoryId: 'getting-started',
    summary: 'Learn how to view and filter issues assigned to your ward',
    readingTime: '5 min read',
    popularRank: 3,
    sections: [
      {
        heading: 'Navigating to the Assigned Issues Workspace',
        steps: [
          'Log in to the Ward Staff Portal using your MBMC staff credentials.',
          'Click on "Assigned Issues" in the primary left navigation sidebar.',
          'Review the summary KPI bar at the top to see current counts for High Priority, In Progress, and Overdue grievances.',
          'Use the category tabs (Roads, Water, Waste, Streetlights, etc.) to refine your list.',
          'Click any issue row to open the complete issue dossier and inspection photos.',
        ],
      },
      {
        heading: 'Filtering and Searching',
        content:
          'You can filter issues by priority (High, Medium, Low), status (New, In Progress, Overdue, Resolved), or assigned field team. The search bar at the top right of the table instantly searches by ticket number (e.g. CP-10421), street name, or citizen complainant name.',
      },
    ],
    tips: [
      'High priority road trenching and open drain issues are highlighted with red alerts and must be reviewed within 2 hours of assignment.',
    ],
  },
  {
    id: 'art-updating-status',
    title: 'Updating issue status',
    categoryId: 'getting-started',
    summary: 'Step-by-step guide to update issue status and add notes',
    readingTime: '7 min read',
    popularRank: 1,
    sections: [
      {
        heading: 'Standard Status Workflow',
        steps: [
          'Open the issue card or row from either the Dashboard or Assigned Issues table.',
          'Click the "Update Status" button located in the issue action panel or workbench.',
          'Select the new status from the dropdown: "New", "In Progress", "Under Review", or "Resolved".',
          'Enter detailed work notes describing the on-ground actions taken (e.g., "Asphalt patch applied, roller compaction completed").',
          'Attach post-repair evidence photos if the issue is being marked as Resolved.',
          'Click "Save Status Update" to notify the citizen and record an audit log.',
        ],
      },
      {
        heading: 'Audit Trail and Accountability',
        content:
          'Every status update logs your staff ID, timestamp, and geo-coordinates. Citizens receive an automated SMS notification when their grievance moves to "In Progress" and "Resolved".',
      },
    ],
    tips: [
      'Never mark an issue as "Resolved" without uploading at least one clear photograph of the completed repair.',
    ],
  },
  {
    id: 'art-uploading-photos',
    title: 'Uploading completion photos',
    categoryId: 'getting-started',
    summary: 'Learn how to upload before and after photos',
    readingTime: '4 min read',
    popularRank: 2,
    sections: [
      {
        heading: 'Photo Evidence Requirements',
        steps: [
          'Navigate to "Resolution Updates" from the sidebar navigation.',
          'Select the specific issue ticket from the left panel.',
          'In the right workbench, scroll to the "Photo Evidence & Verification" zone.',
          'Click "Browse or Drop Photos" to upload camera images directly from your mobile device or desktop.',
          'Ensure the photo clearly captures the fixed asset (e.g. repaved road surface, replaced streetlight bulb) and surrounding landmarks.',
          'Click "Upload & Attach Proof".',
        ],
      },
      {
        heading: 'Supported Formats & Limits',
        content:
          'The system accepts JPG, PNG, and WebP files up to 5MB each. Geo-tagged photographs with EXIF coordinates are automatically validated against the original complaint location.',
      },
    ],
    tips: [
      'Take photos in landscape orientation during daylight hours for maximum verification clarity.',
    ],
  },
  {
    id: 'art-accessing-map',
    title: 'Accessing field operations map',
    categoryId: 'getting-started',
    summary: 'How to use the map to view issue locations and team routes',
    readingTime: '6 min read',
    popularRank: 4,
    sections: [
      {
        heading: 'Using the Interactive GIS Map',
        steps: [
          'Click "Field Operations" from the primary sidebar.',
          'The central map displays live issue markers across Ward 3.',
          'Use the zoom controls (+ / −) to inspect specific lanes in Mira Road, Shanti Nagar, or Bhayandar.',
          'Click on any colored marker to view the ticket number, severity, and assigned team.',
          'Use the priority filter chips (High, Medium, Low) to isolate critical clusters.',
        ],
      },
      {
        heading: 'Routing and Route Optimization',
        content:
          'The right panel displays the scheduled daily route stops for Team 1 and Team 2, showing sequential inspection waypoints to minimize travel time between sites.',
      },
    ],
    tips: [
      'Use the Recenter button (⌖) to reset the map camera to Ward 3 civic boundaries.',
    ],
  },
  {
    id: 'art-priority-status',
    title: 'Understanding priority and status',
    categoryId: 'getting-started',
    summary: 'Learn about different priority levels and issue statuses',
    readingTime: '3 min read',
    popularRank: 6,
    sections: [
      {
        heading: 'Priority Classifications',
        steps: [
          'High Priority (Red): Safety hazards, major water main bursts, road cave-ins. SLA: 24 hours.',
          'Medium Priority (Orange): Non-functioning streetlights, garbage overflow, drainage clogs. SLA: 48 hours.',
          'Low Priority (Blue): Minor paver blocks displacement, park bench repairs. SLA: 5-7 days.',
        ],
      },
      {
        heading: 'Issue Status Lifecycle',
        content:
          'Reports transition through 4 strict stages: New -> In Progress -> Under Review -> Resolved. Any report exceeding its SLA threshold automatically enters Overdue state and alerts the Ward Officer.',
      },
    ],
  },
  {
    id: 'art-generating-reports',
    title: 'Generating ward reports',
    categoryId: 'getting-started',
    summary: 'How to view analytics and download reports',
    readingTime: '5 min read',
    popularRank: 7,
    sections: [
      {
        heading: 'Generating Analytics Summaries',
        steps: [
          'Navigate to "Ward Reports" from the sidebar.',
          'Select the desired reporting period (e.g., 01 Dec 2024 - 31 Dec 2024, Last 30 Days).',
          'Filter by category or team to isolate department metrics.',
          'Inspect the Issue Status Distribution donut, category bar chart, and resolution trend spline.',
          'Click "Download Report" in the top toolbar to generate a comprehensive CSV audit export.',
        ],
      },
    ],
    tips: [
      'Monthly audit exports include team resolution ratios, average resolution time in days, and overdue ticket logs.',
    ],
  },

  // ── Account & Settings ──
  {
    id: 'art-resetting-password',
    title: 'Resetting your password',
    categoryId: 'account-settings',
    summary: 'Security guide for updating staff login password and recovery credentials',
    readingTime: '3 min read',
    popularRank: 5,
    sections: [
      {
        heading: 'Updating Your Staff Password',
        steps: [
          'Click on "Profile & Settings" in the sidebar.',
          'In the right column, navigate to the "Change Password" panel.',
          'Enter your current temporary or established password.',
          'Enter a new password of at least 8 characters, containing numbers and special characters.',
          'Re-enter the new password in the confirmation box and click "Update Password".',
        ],
      },
    ],
    tips: [
      'Passwords must be rotated every 90 days in accordance with MBMC Municipal Cyber Security Standards.',
    ],
  },

  // ── Issue Management ──
  {
    id: 'art-bulk-assignment',
    title: 'Reassigning issues to specialized teams',
    categoryId: 'issue-management',
    summary: 'How to transfer tasks between Road, Sanitation, and Electrical squads',
    readingTime: '4 min read',
    sections: [
      {
        heading: 'Reassignment Process',
        steps: [
          'Open the issue card in "Assigned Issues".',
          'Click the team badge (e.g. "Team 1 - Road Maintenance").',
          'Choose the appropriate department team from the dropdown list.',
          'Provide a brief rationale (e.g. "Electrical conduit damaged during pothole excavation").',
          'Confirm transfer to notify the receiving team supervisor.',
        ],
      },
    ],
  },
  {
    id: 'art-handling-duplicates',
    title: 'Managing related and duplicate reports',
    categoryId: 'issue-management',
    summary: 'Merging citizen reports submitted for the same geographic location',
    readingTime: '5 min read',
    sections: [
      {
        heading: 'Duplicate Detection',
        content:
          'When multiple citizens report the same pothole or broken streetlight within 50 meters, CivicPulse AI groups them under a single master ticket to prevent redundant work orders.',
      },
    ],
  },

  // ── Field Operations ──
  {
    id: 'art-gps-troubleshooting',
    title: 'Mobile GPS coordinates and live field tracking',
    categoryId: 'field-operations',
    summary: 'Ensuring accurate location capture during on-site inspections',
    readingTime: '4 min read',
    sections: [
      {
        heading: 'Location Accuracy',
        steps: [
          'Ensure Location Services are enabled on your field smartphone or tablet.',
          'Allow browser permission when prompted by CivicPulse.',
          'If the pin is slightly offset due to high-rise building interference, drag the pin manually to the exact street curb.',
        ],
      },
    ],
  },

  // ── Technical Support ──
  {
    id: 'art-offline-mode',
    title: 'Using CivicPulse during intermittent network connectivity',
    categoryId: 'technical-support',
    summary: 'How offline queueing and background sync work in the field',
    readingTime: '4 min read',
    sections: [
      {
        heading: 'Offline Sync Protocol',
        content:
          'When working in underground basements or low-signal zones, CivicPulse caches your status updates and inspection photos locally. Once cellular connection is restored, the queue syncs automatically with MBMC central servers.',
      },
    ],
  },
];

export const SYSTEM_SERVICES: SystemServiceStatus[] = [
  { id: 'srv-db', name: 'Core Municipal Database', status: 'Operational', latency: '24ms', uptime: '99.98%' },
  { id: 'srv-gis', name: 'GIS Spatial Map Server', status: 'Operational', latency: '42ms', uptime: '99.95%' },
  { id: 'srv-sms', name: 'Citizen SMS Notification Gateway', status: 'Operational', latency: '65ms', uptime: '99.90%' },
  { id: 'srv-ai', name: 'AI Issue Prioritization Engine', status: 'Operational', latency: '88ms', uptime: '99.85%' },
  { id: 'srv-cdn', name: 'Photo Evidence CDN Storage', status: 'Operational', latency: '31ms', uptime: '99.99%' },
];

const SUPPORT_TICKETS_KEY = 'civicpulse_staff_support_tickets';

export function getStaffSupportTickets(): SupportTicket[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPPORT_TICKETS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
  }
  return [];
}

export function submitStaffSupportTicket(data: {
  subject: string;
  category: string;
  description: string;
  relatedIssueId?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  staffName?: string;
  staffEmail?: string;
}): SupportTicket {
  const newTicket: SupportTicket = {
    id: `req-${Date.now()}`,
    ticketNumber: `SR-${Math.floor(10000 + Math.random() * 90000)}`,
    subject: data.subject.trim(),
    category: data.category,
    description: data.description.trim(),
    relatedIssueId: data.relatedIssueId?.trim() || undefined,
    priority: data.priority || 'Medium',
    staffName: data.staffName || 'Sandeep Jadhav',
    staffEmail: data.staffEmail || 'sandeep.jadhav@mbmc.gov.in',
    createdAt: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    status: 'Open',
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getStaffSupportTickets();
      const updated = [newTicket, ...current];
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return newTicket;
}
