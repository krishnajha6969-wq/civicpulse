/**
 * CivicPulse Reports & Community Activity Service
 *
 * Scoped to the authenticated citizen and their neighbourhood.
 */

export type ReportCategory =
  | 'roads'
  | 'water'
  | 'waste'
  | 'streetlights'
  | 'drainage'
  | 'parks'
  | 'transport'
  | 'other'
  | 'traffic'
  | string;
export type ReportStatus = 'awaiting' | 'in_progress' | 'resolved';
export type ReportPriority = 'High priority' | 'Medium priority' | 'Low priority';

export interface ReportActivityItem {
  id: string;
  type: 'resolved' | 'progress' | 'assigned' | 'staff_update' | 'status_change';
  title: string;
  description: string;
  timeAgo: string;
  timestamp?: number;
}

export interface ReportTimelineStage {
  stage: 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';
  date: string;
  status: 'completed' | 'current' | 'pending';
}

export interface CivicReport {
  id: string;
  ticketId: string;
  title: string;
  category: ReportCategory;
  location: string;
  status: ReportStatus;
  priority: ReportPriority;
  reportedDate: string;
  timestamp: number;
  imageUrl: string;
  description?: string;
  userId: string;
  lat?: number;
  lng?: number;
  address?: string;
  fullReportedDate?: string;
  photos?: string[];
  timeline?: ReportTimelineStage[];
  updates?: ReportActivityItem[];
  latestUpdate?: {
    title: string;
    description: string;
    timeAgo: string;
  };
}

export interface ReportUpdate {
  id: string;
  type: 'resolved' | 'progress' | 'assigned' | 'staff_update';
  title: string;
  reportTitle: string;
  timeAgo: string;
  timestamp: number;
}

// Map issues for the interactive 'Reports Around You' area
export interface MapIssue {
  id: string;
  title: string;
  location: string;
  category: ReportCategory;
  priority: ReportPriority;
  status: ReportStatus;
  reportedDate: string;
  imageUrl: string;
  topPercent: number; // percentage from top of map container
  leftPercent: number; // percentage from left of map container
  iconType: 'exclamation' | 'water' | 'trash' | 'warning' | 'streetlights';
}

const REPORTS_STORAGE_KEY = 'civicpulse_citizen_reports';

// Initial pre-seeded reports for Rohan Mehta (12 total: 3 in_progress, 7 resolved, 2 awaiting)
export const ROHAN_INITIAL_REPORTS: CivicReport[] = [
  {
    id: 'rep_1',
    ticketId: '#CP-10345',
    title: 'Pothole on Station Road',
    category: 'roads',
    location: 'Mira Road (E)',
    address: 'Station Road, Mira Road (E), Mira Bhayandar, Maharashtra',
    status: 'in_progress',
    priority: 'High priority',
    reportedDate: '2 days ago',
    fullReportedDate: '12 Dec 2024, 04:32 PM',
    timestamp: Date.now() - 200000000,
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: [
      '/images/dashboard/thumb-pothole@2x.jpg',
      '/images/dashboard/thumb-pothole.jpg',
    ],
    description: 'Large pothole on the main road causing inconvenience to vehicles and pedestrians.',
    userId: 'usr_rohan_mehta',
    lat: 19.2952,
    lng: 72.8544,
    timeline: [
      { stage: 'Reported', date: '12 Dec, 4:32 PM', status: 'completed' },
      { stage: 'Assigned', date: '13 Dec, 10:15 AM', status: 'completed' },
      { stage: 'In Progress', date: '14 Dec, 2:20 PM', status: 'current' },
      { stage: 'Resolved', date: '—', status: 'pending' },
    ],
    latestUpdate: {
      title: 'Work in progress',
      description: 'The issue has been assigned to the ward team and repair work has started at the location.',
      timeAgo: '2 hours ago',
    },
    updates: [
      {
        id: 'upd_101',
        type: 'progress',
        title: 'Work in progress',
        description: 'The issue has been assigned to the ward team and repair work has started at the location.',
        timeAgo: '2 hours ago',
      },
      {
        id: 'upd_102',
        type: 'assigned',
        title: 'Ward team assigned',
        description: 'Work order #RD-442 issued to Ward 3 Road Maintenance Unit.',
        timeAgo: '1 day ago',
      },
      {
        id: 'upd_103',
        type: 'staff_update',
        title: 'Inspection completed',
        description: 'Junior engineer inspected depth (18cm) and flagged as high road hazard.',
        timeAgo: '1 day ago',
      },
      {
        id: 'upd_104',
        type: 'status_change',
        title: 'Report verified',
        description: 'Citizen report verified by Municipal Citizen Desk.',
        timeAgo: '2 days ago',
      },
    ],
  },
  {
    id: 'rep_2',
    ticketId: '#CP-10338',
    title: 'Streetlight not working',
    category: 'streetlights',
    location: 'Kanakia Road',
    address: 'Kanakia Road, Mira Road (E), Mira Bhayandar, Maharashtra',
    status: 'resolved',
    priority: 'Medium priority',
    reportedDate: '5 days ago',
    fullReportedDate: '09 Dec 2024, 07:15 PM',
    timestamp: Date.now() - 210000000,
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    photos: ['/images/dashboard/thumb-streetlight@2x.jpg'],
    description: 'Streetlight fixture non-functional between pole #14 and #15.',
    userId: 'usr_rohan_mehta',
    lat: 19.2812,
    lng: 72.8685,
    timeline: [
      { stage: 'Reported', date: '09 Dec, 7:15 PM', status: 'completed' },
      { stage: 'Assigned', date: '10 Dec, 09:30 AM', status: 'completed' },
      { stage: 'In Progress', date: '11 Dec, 11:00 AM', status: 'completed' },
      { stage: 'Resolved', date: '11 Dec, 04:45 PM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Issue resolved',
      description: 'New LED fixture installed and verified by electrical maintenance team.',
      timeAgo: '1 day ago',
    },
    updates: [
      {
        id: 'upd_201',
        type: 'resolved',
        title: 'Issue resolved',
        description: 'New LED fixture installed and verified by electrical maintenance team.',
        timeAgo: '1 day ago',
      },
      {
        id: 'upd_202',
        type: 'progress',
        title: 'Wiring repaired',
        description: 'Underground conduit checked and replacement lamp installed.',
        timeAgo: '2 days ago',
      },
      {
        id: 'upd_203',
        type: 'assigned',
        title: 'Assigned to electrical team',
        description: 'Assigned to Ward 4 Electrical Maintenance Crew.',
        timeAgo: '4 days ago',
      },
    ],
  },
  {
    id: 'rep_3',
    ticketId: '#CP-10342',
    title: 'Garbage overflow',
    category: 'waste',
    location: 'Vardhaman Park',
    address: 'Vardhaman Park, Mira Bhayandar, Maharashtra',
    status: 'awaiting',
    priority: 'Medium priority',
    reportedDate: '3 days ago',
    fullReportedDate: '11 Dec 2024, 09:20 AM',
    timestamp: Date.now() - 220000000,
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    photos: [
      '/images/dashboard/thumb-garbage@2x.jpg',
      '/images/dashboard/thumb-garbage.jpg',
    ],
    description: 'Solid waste container overflowing onto pedestrian walkway.',
    userId: 'usr_rohan_mehta',
    lat: 19.2845,
    lng: 72.8592,
    timeline: [
      { stage: 'Reported', date: '11 Dec, 9:20 AM', status: 'completed' },
      { stage: 'Assigned', date: 'Awaiting', status: 'current' },
      { stage: 'In Progress', date: '—', status: 'pending' },
      { stage: 'Resolved', date: '—', status: 'pending' },
    ],
    latestUpdate: {
      title: 'Awaiting municipal assignment',
      description: 'Report logged and queued for daily sanitation collection vehicle.',
      timeAgo: '3 days ago',
    },
    updates: [
      {
        id: 'upd_301',
        type: 'status_change',
        title: 'Report logged',
        description: 'Notification dispatched to Ward 4 Sanitation Supervisor.',
        timeAgo: '3 days ago',
      },
    ],
  },
  {
    id: 'rep_4',
    ticketId: '#CP-10337',
    title: 'Water leakage',
    category: 'water',
    location: '3rd Cross Lane',
    address: '3rd Cross Lane, Shanti Nagar, Mira Road (E)',
    status: 'resolved',
    priority: 'High priority',
    reportedDate: '6 days ago',
    fullReportedDate: '08 Dec 2024, 11:45 AM',
    timestamp: Date.now() - 230000000,
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    description: 'Drinking water pipeline leak on main connector causing low pressure and water waste.',
    userId: 'usr_rohan_mehta',
    lat: 19.2884,
    lng: 72.8631,
    timeline: [
      { stage: 'Reported', date: '08 Dec, 11:45 AM', status: 'completed' },
      { stage: 'Assigned', date: '08 Dec, 01:20 PM', status: 'completed' },
      { stage: 'In Progress', date: '09 Dec, 10:00 AM', status: 'completed' },
      { stage: 'Resolved', date: '10 Dec, 02:30 PM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Pipeline repaired',
      description: 'Main joint welded and pressure tested successfully.',
      timeAgo: '2 days ago',
    },
    updates: [
      {
        id: 'upd_401',
        type: 'resolved',
        title: 'Pipeline repaired',
        description: 'Leak sealed and normal supply restored.',
        timeAgo: '2 days ago',
      },
      {
        id: 'upd_402',
        type: 'progress',
        title: 'Excavation in progress',
        description: 'Water maintenance team reached pipeline connector.',
        timeAgo: '4 days ago',
      },
    ],
  },
  {
    id: 'rep_5',
    ticketId: '#CP-10329',
    title: 'Park maintenance required',
    category: 'parks',
    location: 'Maxus Park',
    address: 'Maxus Park, Bhayandar (W), Maharashtra',
    status: 'resolved',
    priority: 'Low priority',
    reportedDate: '1 week ago',
    fullReportedDate: '07 Dec 2024, 03:10 PM',
    timestamp: Date.now() - 240000000,
    imageUrl: '/images/dashboard/sidebar-promo-city@2x.jpg',
    photos: ['/images/dashboard/sidebar-promo-city@2x.jpg'],
    description: 'Overgrown bushes and broken wooden bench near the children play area.',
    userId: 'usr_rohan_mehta',
    lat: 19.3014,
    lng: 72.8491,
    timeline: [
      { stage: 'Reported', date: '07 Dec, 3:10 PM', status: 'completed' },
      { stage: 'Assigned', date: '08 Dec, 09:00 AM', status: 'completed' },
      { stage: 'In Progress', date: '09 Dec, 02:00 PM', status: 'completed' },
      { stage: 'Resolved', date: '10 Dec, 11:15 AM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Maintenance completed',
      description: 'Bushes trimmed and bench repaired by horticulture team.',
      timeAgo: '4 days ago',
    },
    updates: [
      {
        id: 'upd_501',
        type: 'resolved',
        title: 'Maintenance completed',
        description: 'Benches repaired and perimeter landscaping trimmed.',
        timeAgo: '4 days ago',
      },
    ],
  },
  {
    id: 'rep_6',
    ticketId: '#CP-10330',
    title: 'Drainage cover damaged',
    category: 'drainage',
    location: 'Shanti Nagar',
    address: 'Shanti Nagar, Sector 4, Mira Road',
    status: 'awaiting',
    priority: 'High priority',
    reportedDate: '1 week ago',
    fullReportedDate: '06 Dec 2024, 02:15 PM',
    timestamp: Date.now() - 7.5 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    description: 'Missing concrete drainage slab poses pedestrian hazard.',
    userId: 'usr_rohan_mehta',
    lat: 19.2884,
    lng: 72.8631,
    timeline: [
      { stage: 'Reported', date: '06 Dec, 2:15 PM', status: 'completed' },
      { stage: 'Assigned', date: 'Awaiting', status: 'current' },
      { stage: 'In Progress', date: '—', status: 'pending' },
      { stage: 'Resolved', date: '—', status: 'pending' },
    ],
    latestUpdate: {
      title: 'Pending slab replacement',
      description: 'Inspection team confirmed size; awaiting delivery from precast yard.',
      timeAgo: '5 days ago',
    },
  },
  {
    id: 'rep_7',
    ticketId: '#CP-10335',
    title: 'Water pipe leak on 3rd Cross',
    category: 'water',
    location: '3rd Cross Lane',
    address: '3rd Cross Lane, Shanti Nagar, Mira Road (E)',
    status: 'in_progress',
    priority: 'High priority',
    reportedDate: '6 days ago',
    fullReportedDate: '08 Dec 2024, 10:20 AM',
    timestamp: Date.now() - 6.5 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    description: 'Secondary line leakage spreading water onto street.',
    userId: 'usr_rohan_mehta',
    lat: 19.2884,
    lng: 72.8631,
    timeline: [
      { stage: 'Reported', date: '08 Dec, 10:20 AM', status: 'completed' },
      { stage: 'Assigned', date: '09 Dec, 11:00 AM', status: 'completed' },
      { stage: 'In Progress', date: '10 Dec, 01:30 PM', status: 'current' },
      { stage: 'Resolved', date: '—', status: 'pending' },
    ],
    latestUpdate: {
      title: 'Replacement valve fitted',
      description: 'Ward plumbing unit has isolated the pipe section.',
      timeAgo: '1 day ago',
    },
  },
  {
    id: 'rep_8',
    ticketId: '#CP-10309',
    title: 'Traffic signal timing issue',
    category: 'traffic',
    location: 'Golden Nest Circle',
    address: 'Golden Nest Circle, Mira Bhayandar',
    status: 'in_progress',
    priority: 'Medium priority',
    reportedDate: '3 weeks ago',
    fullReportedDate: '24 Nov 2024, 05:40 PM',
    timestamp: Date.now() - 21 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    photos: ['/images/dashboard/thumb-streetlight@2x.jpg'],
    description: 'Green light cycle too brief on Northbound lane causing morning backups.',
    userId: 'usr_rohan_mehta',
    lat: 19.2905,
    lng: 72.855,
    timeline: [
      { stage: 'Reported', date: '24 Nov, 5:40 PM', status: 'completed' },
      { stage: 'Assigned', date: '25 Nov, 10:00 AM', status: 'completed' },
      { stage: 'In Progress', date: '01 Dec, 03:00 PM', status: 'current' },
      { stage: 'Resolved', date: '—', status: 'pending' },
    ],
    latestUpdate: {
      title: 'Timing recalibration under review',
      description: 'Traffic police coordinating with municipal electronics division.',
      timeAgo: '4 days ago',
    },
  },
  {
    id: 'rep_9',
    ticketId: '#CP-10320',
    title: 'Uncollected dry waste',
    category: 'waste',
    location: 'Sector 4',
    address: 'Sector 4, Shanti Nagar, Mira Road',
    status: 'resolved',
    priority: 'Low priority',
    reportedDate: '2 weeks ago',
    fullReportedDate: '01 Dec 2024, 11:00 AM',
    timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    photos: ['/images/dashboard/thumb-garbage@2x.jpg'],
    description: 'Dry waste left near street junction after weekly collection.',
    userId: 'usr_rohan_mehta',
    timeline: [
      { stage: 'Reported', date: '01 Dec, 11:00 AM', status: 'completed' },
      { stage: 'Assigned', date: '02 Dec, 09:30 AM', status: 'completed' },
      { stage: 'In Progress', date: '02 Dec, 02:00 PM', status: 'completed' },
      { stage: 'Resolved', date: '03 Dec, 10:45 AM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Waste cleared',
      description: 'Special pickup vehicle dispatched and area swept clean.',
      timeAgo: '1 week ago',
    },
  },
  {
    id: 'rep_10',
    ticketId: '#CP-10315',
    title: 'Open manhole flagged',
    category: 'drainage',
    location: 'Pleasant Park',
    address: 'Pleasant Park, Mira Bhayandar',
    status: 'resolved',
    priority: 'High priority',
    reportedDate: '2 weeks ago',
    fullReportedDate: '28 Nov 2024, 04:30 PM',
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    description: 'Storm drain manhole cover missing near bus stop.',
    userId: 'usr_rohan_mehta',
    timeline: [
      { stage: 'Reported', date: '28 Nov, 4:30 PM', status: 'completed' },
      { stage: 'Assigned', date: '28 Nov, 06:00 PM', status: 'completed' },
      { stage: 'In Progress', date: '29 Nov, 08:30 AM', status: 'completed' },
      { stage: 'Resolved', date: '29 Nov, 01:15 PM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'New cover installed',
      description: 'Heavy-duty ductile iron cover secured and safety verified.',
      timeAgo: '2 weeks ago',
    },
  },
  {
    id: 'rep_11',
    ticketId: '#CP-10301',
    title: 'Park lighting restoration',
    category: 'streetlights',
    location: 'Joggers Park',
    address: 'Joggers Park, Mira Road (E)',
    status: 'resolved',
    priority: 'Low priority',
    reportedDate: '1 month ago',
    fullReportedDate: '15 Nov 2024, 06:15 PM',
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    photos: ['/images/dashboard/thumb-streetlight@2x.jpg'],
    description: 'Walking track lights flickering and switching off intermittently.',
    userId: 'usr_rohan_mehta',
    timeline: [
      { stage: 'Reported', date: '15 Nov, 6:15 PM', status: 'completed' },
      { stage: 'Assigned', date: '16 Nov, 10:00 AM', status: 'completed' },
      { stage: 'In Progress', date: '17 Nov, 02:00 PM', status: 'completed' },
      { stage: 'Resolved', date: '18 Nov, 11:30 AM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Timer unit replaced',
      description: 'Defective circuit timer replaced and track illumination restored.',
      timeAgo: '3 weeks ago',
    },
  },
  {
    id: 'rep_12',
    ticketId: '#CP-10280',
    title: 'Fallen branch clearing',
    category: 'waste',
    location: 'Station Road',
    address: 'Station Road, Bhayandar (W)',
    status: 'resolved',
    priority: 'Low priority',
    reportedDate: '2 months ago',
    fullReportedDate: '20 Oct 2024, 08:00 AM',
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    photos: ['/images/dashboard/thumb-garbage@2x.jpg'],
    description: 'Large tree branch fell on side lane after gusty wind.',
    userId: 'usr_rohan_mehta',
    timeline: [
      { stage: 'Reported', date: '20 Oct, 8:00 AM', status: 'completed' },
      { stage: 'Assigned', date: '20 Oct, 09:15 AM', status: 'completed' },
      { stage: 'In Progress', date: '20 Oct, 11:00 AM', status: 'completed' },
      { stage: 'Resolved', date: '20 Oct, 03:30 PM', status: 'completed' },
    ],
    latestUpdate: {
      title: 'Lane cleared',
      description: 'Branch sawn and hauled away by disaster management squad.',
      timeAgo: '1 month ago',
    },
  },
];

// Pre-seeded recent updates matching the reference image timeline
export const RECENT_UPDATES: ReportUpdate[] = [
  {
    id: 'upd_1',
    type: 'resolved',
    title: 'Your report has been resolved',
    reportTitle: 'Streetlight not working',
    timeAgo: '2 hours ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'upd_2',
    type: 'progress',
    title: 'Work in progress',
    reportTitle: 'Garbage overflow near Vardhaman Park',
    timeAgo: '5 hours ago',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    id: 'upd_3',
    type: 'assigned',
    title: 'Assigned to ward team',
    reportTitle: 'Water leakage on 3rd Cross Lane',
    timeAgo: '1 day ago',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: 'upd_4',
    type: 'staff_update',
    title: 'New update from ward staff',
    reportTitle: 'Footpath damage near school',
    timeAgo: '2 days ago',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
  },
];

// Map interactive demonstration markers
export const MAP_ISSUES: MapIssue[] = [
  {
    id: 'map_pothole',
    title: 'Pothole on Station Road',
    location: 'Mira Road (E)',
    category: 'roads',
    priority: 'High priority',
    status: 'in_progress',
    reportedDate: 'Reported 2 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    topPercent: 54,
    leftPercent: 37,
    iconType: 'exclamation',
  },
  {
    id: 'map_water_1',
    title: 'Pipeline leakage',
    location: 'Sector 3 Main Rd',
    category: 'water',
    priority: 'Medium priority',
    status: 'in_progress',
    reportedDate: 'Reported 1 day ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    topPercent: 56,
    leftPercent: 27,
    iconType: 'water',
  },
  {
    id: 'map_water_2',
    title: 'Valve overflow',
    location: 'Green Valley',
    category: 'water',
    priority: 'Low priority',
    status: 'in_progress',
    reportedDate: 'Reported 3 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    topPercent: 66,
    leftPercent: 54,
    iconType: 'water',
  },
  {
    id: 'map_trash_1',
    title: 'Overflowing community bin',
    location: 'Vardhaman Park',
    category: 'waste',
    priority: 'Medium priority',
    status: 'in_progress',
    reportedDate: 'Reported 2 days ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    topPercent: 50,
    leftPercent: 508 / 10.3,
    iconType: 'trash',
  },
  {
    id: 'map_trash_2',
    title: 'Debris left on pavement',
    location: 'Kanakia Junction',
    category: 'waste',
    priority: 'Low priority',
    status: 'in_progress',
    reportedDate: 'Reported 4 days ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    topPercent: 68,
    leftPercent: 35,
    iconType: 'trash',
  },
  {
    id: 'map_warning_1',
    title: 'Missing manhole barricade',
    location: 'Station Road North',
    category: 'drainage',
    priority: 'High priority',
    status: 'in_progress',
    reportedDate: 'Reported 1 day ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    topPercent: 60,
    leftPercent: 33,
    iconType: 'warning',
  },
  {
    id: 'map_warning_2',
    title: 'Blind turn obstruction',
    location: 'Market Link Road',
    category: 'traffic',
    priority: 'Medium priority',
    status: 'in_progress',
    reportedDate: 'Reported 3 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    topPercent: 58,
    leftPercent: 63,
    iconType: 'warning',
  },
  {
    id: 'map_trash_3',
    title: 'Recycling bin full',
    location: 'Shanti Nagar',
    category: 'waste',
    priority: 'Low priority',
    status: 'resolved',
    reportedDate: 'Reported 5 days ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    topPercent: 61,
    leftPercent: 67,
    iconType: 'trash',
  },
];

/**
 * Fetch reports for a specific citizen.
 * Dynamically computes from persistent storage or initial seeds.
 */
export function getCitizenReports(userId: string): CivicReport[] {
  if (typeof window === 'undefined') {
    return userId === 'usr_rohan_mehta' ? ROHAN_INITIAL_REPORTS : [];
  }

  try {
    const raw = localStorage.getItem(`${REPORTS_STORAGE_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }

  // If user is Rohan Mehta or demo user, seed his reports
  if (userId === 'usr_rohan_mehta' || userId.includes('rohan')) {
    try {
      localStorage.setItem(`${REPORTS_STORAGE_KEY}_${userId}`, JSON.stringify(ROHAN_INITIAL_REPORTS));
    } catch {
      // Ignore
    }
    return ROHAN_INITIAL_REPORTS;
  }

  // Newly registered citizens start with an empty report list
  return [];
}

/**
 * Calculates real counts directly from the user's report records.
 * Never hardcoded.
 */
export function getReportSummaryCounts(reports: CivicReport[]) {
  return {
    total: reports.length,
    inProgress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    awaiting: reports.filter((r) => r.status === 'awaiting').length,
  };
}

export interface NewReportInput {
  title: string;
  category: ReportCategory;
  location: string;
  description: string;
  userId: string;
  imageUrl?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  priority?: ReportPriority;
}

/**
 * Persists a new citizen issue report to user storage.
 * Automatically assigns a unique ticket ID and status.
 */
export function addCitizenReport(input: NewReportInput): CivicReport {
  const current = getCitizenReports(input.userId);
  const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `#CP-${randomTicketNum}`;
  const now = Date.now();

  const defaultThumbByCategory: Record<string, string> = {
    roads: '/images/dashboard/thumb-pothole@2x.jpg',
    waste: '/images/dashboard/thumb-garbage@2x.jpg',
    streetlights: '/images/dashboard/thumb-streetlight@2x.jpg',
    water: '/images/dashboard/phone-report@2x.jpg',
    drainage: '/images/dashboard/thumb-pothole@2x.jpg',
    parks: '/images/dashboard/sidebar-promo-city@2x.jpg',
    transport: '/images/dashboard/phone-report@2x.jpg',
    other: '/images/dashboard/phone-report@2x.jpg',
  };

  const newReport: CivicReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ticketId,
    title: input.title.trim(),
    category: input.category,
    location: input.location.trim(),
    status: 'awaiting',
    priority:
      input.priority ||
      (input.category === 'water' || input.category === 'drainage'
        ? 'High priority'
        : 'Medium priority'),
    reportedDate: 'Just now',
    timestamp: now,
    imageUrl:
      input.imageUrl ||
      (input.photos && input.photos.length > 0
        ? input.photos[0]
        : defaultThumbByCategory[input.category] || '/images/dashboard/phone-report@2x.jpg'),
    description: input.description.trim(),
    userId: input.userId,
    lat: input.lat,
    lng: input.lng,
  };

  const updated = [newReport, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${REPORTS_STORAGE_KEY}_${input.userId}`, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return newReport;
}

