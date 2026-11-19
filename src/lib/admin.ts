/**
 * CivicPulse — Super Admin Central Administration Service
 *
 * City-wide analytics, ward distributions, geographic mapping,
 * KPI aggregation, and live administration telemetry.
 */

export interface AdminKPIs {
  totalReports: number;
  totalReportsGrowth: string;
  resolved: number;
  resolvedGrowth: string;
  resolutionRate: string;
  pending: number;
  pendingGrowth: string;
  pendingNote: string;
  overdue: number;
  overdueGrowth: string;
  overdueNote: string;
  totalWards: number;
  activeTeams: number;
}

export interface WardPerformanceRow {
  id: number;
  name: string;
  shortName: string;
  totalIssues: number;
  resolved: number;
  pending: number;
  overdue: number;
  resolutionRate: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  received: number;
  resolved: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'resolved' | 'new' | 'progress' | 'staff';
  title: string;
  subtitle: string;
  timeAgo: string;
}

export interface AdminMapPin {
  id: string;
  ticketId: string;
  title: string;
  ward: string;
  category: string;
  status: 'New' | 'In Progress' | 'Overdue' | 'Resolved';
  top: number; // percentage in container
  left: number; // percentage in container
}

export const CITY_KPIS: AdminKPIs = {
  totalReports: 1248,
  totalReportsGrowth: '↑ 12%',
  resolved: 892,
  resolvedGrowth: '↑ 18%',
  resolutionRate: '72%',
  pending: 312,
  pendingGrowth: '↓ 8%',
  pendingNote: 'Under review/assigned',
  overdue: 144,
  overdueGrowth: '↓ 5%',
  overdueNote: 'Needs immediate attention',
  totalWards: 4,
  activeTeams: 24,
};

export const WARD_PERFORMANCE: WardPerformanceRow[] = [
  {
    id: 1,
    name: 'Ward 1 - Mira Road',
    shortName: 'Ward 1',
    totalIssues: 312,
    resolved: 230,
    pending: 62,
    overdue: 20,
    resolutionRate: 74,
  },
  {
    id: 2,
    name: 'Ward 2 - Bhayandar West',
    shortName: 'Ward 2',
    totalIssues: 280,
    resolved: 205,
    pending: 55,
    overdue: 20,
    resolutionRate: 73,
  },
  {
    id: 3,
    name: 'Ward 3 - Bhayandar East',
    shortName: 'Ward 3',
    totalIssues: 356,
    resolved: 240,
    pending: 90,
    overdue: 26,
    resolutionRate: 67,
  },
  {
    id: 4,
    name: 'Ward 4 - Dahisar Check Naka',
    shortName: 'Ward 4',
    totalIssues: 300,
    resolved: 217,
    pending: 75,
    overdue: 18,
    resolutionRate: 72,
  },
];

export const CATEGORIES_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'Roads', count: 312, percentage: 25, color: '#3b82f6' },
  { category: 'Waste Management', count: 280, percentage: 22, color: '#10b981' },
  { category: 'Streetlights', count: 224, percentage: 18, color: '#f59e0b' },
  { category: 'Drainage', count: 168, percentage: 13, color: '#a855f7' },
  { category: 'Water Supply', count: 152, percentage: 12, color: '#ef4444' },
  { category: 'Others', count: 112, percentage: 10, color: '#06b6d4' },
];

export const RESOLUTION_TRENDS: Record<string, TrendDataPoint[]> = {
  'Last 30 Days': [
    { date: '1 Oct', received: 45, resolved: 22 },
    { date: '7 Oct', received: 60, resolved: 38 },
    { date: '14 Oct', received: 55, resolved: 32 },
    { date: '21 Oct', received: 74, resolved: 52 },
    { date: '28 Oct', received: 65, resolved: 48 },
  ],
  'Last 7 Days': [
    { date: '22 Oct', received: 58, resolved: 40 },
    { date: '23 Oct', received: 62, resolved: 44 },
    { date: '24 Oct', received: 68, resolved: 50 },
    { date: '25 Oct', received: 71, resolved: 49 },
    { date: '26 Oct', received: 64, resolved: 46 },
    { date: '27 Oct', received: 69, resolved: 51 },
    { date: '28 Oct', received: 65, resolved: 48 },
  ],
  'Last 90 Days': [
    { date: 'Aug W1', received: 180, resolved: 135 },
    { date: 'Aug W3', received: 210, resolved: 155 },
    { date: 'Sep W1', received: 230, resolved: 172 },
    { date: 'Sep W3', received: 250, resolved: 190 },
    { date: 'Oct W1', received: 280, resolved: 215 },
    { date: 'Oct W3', received: 298, resolved: 225 },
  ],
  'Year to Date': [
    { date: 'Jan', received: 650, resolved: 480 },
    { date: 'Mar', received: 780, resolved: 590 },
    { date: 'May', received: 920, resolved: 710 },
    { date: 'Jul', received: 1050, resolved: 810 },
    { date: 'Sep', received: 1180, resolved: 890 },
    { date: 'Oct', received: 1248, resolved: 892 },
  ],
};

export const RECENT_ACTIVITIES: AdminActivityItem[] = [
  {
    id: 'act-1',
    type: 'resolved',
    title: 'Issue CP-10421 resolved',
    subtitle: 'Pothole on Station Road (Ward 1)',
    timeAgo: '10 mins ago',
  },
  {
    id: 'act-2',
    type: 'new',
    title: 'New issue reported',
    subtitle: 'Streetlight not working (Ward 3)',
    timeAgo: '25 mins ago',
  },
  {
    id: 'act-3',
    type: 'progress',
    title: 'Status updated to In Progress',
    subtitle: 'Garbage overflow (Ward 2)',
    timeAgo: '1 hour ago',
  },
  {
    id: 'act-4',
    type: 'staff',
    title: 'New staff member added',
    subtitle: 'Team 4 - General Maintenance',
    timeAgo: '2 hours ago',
  },
];

export const MAP_PINS: AdminMapPin[] = [
  // Ward 1 - Mira Road (Blue)
  { id: 'p1', ticketId: 'CP-10421', title: 'Pothole on Station Road', ward: 'Ward 1', category: 'Roads', status: 'Resolved', top: 38, left: 30 },
  { id: 'p2', ticketId: 'CP-10488', title: 'Open manhole near Shanti Park', ward: 'Ward 1', category: 'Drainage', status: 'In Progress', top: 48, left: 24 },
  { id: 'p3', ticketId: 'CP-10512', title: 'Flickering streetlights at Sector 4', ward: 'Ward 1', category: 'Streetlights', status: 'New', top: 52, left: 35 },
  { id: 'p4', ticketId: 'CP-10390', title: 'Broken curb at Western Express Flyover', ward: 'Ward 1', category: 'Roads', status: 'Overdue', top: 51, left: 29 },

  // Ward 2 - Bhayandar West (Amber)
  { id: 'p5', ticketId: 'CP-10433', title: 'Garbage overflow Maxus Mall', ward: 'Ward 2', category: 'Waste Management', status: 'In Progress', top: 58, left: 39 },
  { id: 'p6', ticketId: 'CP-10499', title: 'Water leakage Subhash Chandra Road', ward: 'Ward 2', category: 'Water Supply', status: 'Overdue', top: 66, left: 36 },
  { id: 'p7', ticketId: 'CP-10520', title: 'Park bench broken at Oval Ground', ward: 'Ward 2', category: 'Others', status: 'Resolved', top: 64, left: 44 },
  { id: 'p8', ticketId: 'CP-10541', title: 'Debris blocking walkway', ward: 'Ward 2', category: 'Roads', status: 'New', top: 72, left: 41 },

  // Ward 3 - Bhayandar East (Red)
  { id: 'p9', ticketId: 'CP-10405', title: 'Potholes along Navghar Road', ward: 'Ward 3', category: 'Roads', status: 'Overdue', top: 49, left: 51 },
  { id: 'p10', ticketId: 'CP-10476', title: 'Illegal dumping near flyover pillar', ward: 'Ward 3', category: 'Waste Management', status: 'Overdue', top: 57, left: 52 },
  { id: 'p11', ticketId: 'CP-10515', title: 'Streetlight pole tilted near temple', ward: 'Ward 3', category: 'Streetlights', status: 'In Progress', top: 54, left: 56 },
  { id: 'p12', ticketId: 'CP-10534', title: 'Water pipe leak near Golden Nest', ward: 'Ward 3', category: 'Water Supply', status: 'Resolved', top: 44, left: 58 },

  // Ward 4 - Dahisar Check Naka (Green)
  { id: 'p13', ticketId: 'CP-10410', title: 'Toll plaza streetlight grid failure', ward: 'Ward 4', category: 'Streetlights', status: 'Resolved', top: 64, left: 56 },
  { id: 'p14', ticketId: 'CP-10462', title: 'Stormwater drain blockage NH 48', ward: 'Ward 4', category: 'Drainage', status: 'In Progress', top: 69, left: 62 },
  { id: 'p15', ticketId: 'CP-10505', title: 'Construction debris on shoulder', ward: 'Ward 4', category: 'Roads', status: 'New', top: 56, left: 65 },
  { id: 'p16', ticketId: 'CP-10555', title: 'Traffic signal timing fault Check Naka', ward: 'Ward 4', category: 'Others', status: 'Resolved', top: 61, left: 59 },
];

export type IssueStatus = 'New' | 'In Progress' | 'Overdue' | 'Resolved';
export type IssuePriority = 'High' | 'Medium' | 'Low';
export type IssueCategory = 'Roads' | 'Streetlights' | 'Waste' | 'Water Supply' | 'Drainage' | 'Others';

export interface AdminIssue {
  id: string; // e.g. CP-10421
  index: number;
  ticketId: string;
  title: string;
  category: IssueCategory;
  location: string;
  ward: string; // 'Ward 1'
  wardFullName: string; // 'Ward 1 - Mira Road'
  priority: IssuePriority;
  status: IssueStatus;
  assignedTeam: string; // 'Team 1' or 'Unassigned'
  assignedTeamFull: string; // 'Team 1 - Road Maintenance'
  reportedDate: string; // '01 Dec 2024'
  reportedDateTime: string; // '01 Dec 2024, 10:24 AM'
  reportedBy: string; // 'Citizen'
  lastUpdated: string; // '02 Dec 2024, 02:15 PM'
  imageUrl: string;
  photos: string[];
  description: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
  mapTop: number;
  mapLeft: number;
  history: {
    title: string;
    actor: string;
    time: string;
    status: IssueStatus;
  }[];
}

export const ALL_ISSUES_SUMMARY = {
  totalIssues: 1248,
  newIssues: 212,
  inProgress: 312,
  overdue: 144,
  resolved: 892,
};

export const ADMIN_ISSUES_LIST: AdminIssue[] = [
  {
    id: 'CP-10421',
    index: 1,
    ticketId: 'CP-10421',
    title: 'Pothole on Station Road',
    category: 'Roads',
    location: 'Station Road, Mira Road',
    ward: 'Ward 1',
    wardFullName: 'Ward 1 - Mira Road',
    priority: 'High',
    status: 'In Progress',
    assignedTeam: 'Team 1',
    assignedTeamFull: 'Team 1 - Road Maintenance',
    reportedDate: '01 Dec 2024',
    reportedDateTime: '01 Dec 2024, 10:24 AM',
    reportedBy: 'Citizen',
    lastUpdated: '02 Dec 2024, 02:15 PM',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    photos: [
      '/images/dashboard/thumb-pothole.jpg',
      '/images/dashboard/thumb-pothole@2x.jpg',
      '/images/ward/banner.jpg',
    ],
    description: 'Deep road cavity and cracked bitumen creating extreme hazard for two-wheelers and buses opposite the railway station gate.',
    citizenName: 'Amit Verma',
    citizenPhone: '+91 98201 44552',
    citizenEmail: 'amit.verma@example.com',
    mapTop: 38,
    mapLeft: 30,
    history: [
      { title: 'Field crew assigned', actor: 'Admin User', time: '01 Dec 2024, 11:00 AM', status: 'In Progress' },
      { title: 'Cold-mix asphalt dispatched', actor: 'Team 1 Leader', time: '02 Dec 2024, 02:15 PM', status: 'In Progress' },
    ],
  },
  {
    id: 'CP-10420',
    index: 2,
    ticketId: 'CP-10420',
    title: 'Streetlight not working',
    category: 'Streetlights',
    location: 'Shanti Nagar, Bhayandar',
    ward: 'Ward 3',
    wardFullName: 'Ward 3 - Bhayandar East',
    priority: 'Medium',
    status: 'New',
    assignedTeam: 'Unassigned',
    assignedTeamFull: 'Unassigned',
    reportedDate: '01 Dec 2024',
    reportedDateTime: '01 Dec 2024, 09:15 AM',
    reportedBy: 'Citizen',
    lastUpdated: '01 Dec 2024, 09:15 AM',
    imageUrl: '/images/dashboard/thumb-streetlight.jpg',
    photos: [
      '/images/dashboard/thumb-streetlight.jpg',
      '/images/dashboard/thumb-streetlight@2x.jpg',
    ],
    description: 'High-mast LED pole #24 flickering and completely dark during night hours causing pedestrian security risk.',
    citizenName: 'Priya Sharma',
    citizenPhone: '+91 98334 11223',
    citizenEmail: 'priya.s@example.com',
    mapTop: 54,
    mapLeft: 56,
    history: [
      { title: 'Issue logged via Citizen Mobile App', actor: 'Citizen Portal', time: '01 Dec 2024, 09:15 AM', status: 'New' },
    ],
  },
  {
    id: 'CP-10419',
    index: 3,
    ticketId: 'CP-10419',
    title: 'Garbage overflow',
    category: 'Waste',
    location: 'Kanakia Road, Mira Road',
    ward: 'Ward 2',
    wardFullName: 'Ward 2 - Bhayandar West',
    priority: 'High',
    status: 'Overdue',
    assignedTeam: 'Team 2',
    assignedTeamFull: 'Team 2 - Sanitation Squad',
    reportedDate: '30 Nov 2024',
    reportedDateTime: '30 Nov 2024, 03:40 PM',
    reportedBy: 'Citizen',
    lastUpdated: '02 Dec 2024, 11:30 AM',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    photos: [
      '/images/dashboard/thumb-garbage.jpg',
      '/images/dashboard/thumb-garbage@2x.jpg',
    ],
    description: 'Large community bin spilled onto pedestrian sidewalk with municipal waste attracting stray cattle and blocking traffic.',
    citizenName: 'Rohan Mehta',
    citizenPhone: '+91 98765 43210',
    citizenEmail: 'rohan.mehta@example.com',
    mapTop: 58,
    mapLeft: 39,
    history: [
      { title: 'SLA Escalation triggered (>48 hrs)', actor: 'System Monitor', time: '02 Dec 2024, 11:30 AM', status: 'Overdue' },
    ],
  },
  {
    id: 'CP-10418',
    index: 4,
    ticketId: 'CP-10418',
    title: 'Water leakage',
    category: 'Water Supply',
    location: 'Maxus Mall Road, Bhayandar',
    ward: 'Ward 3',
    wardFullName: 'Ward 3 - Bhayandar East',
    priority: 'Low',
    status: 'Resolved',
    assignedTeam: 'Team 3',
    assignedTeamFull: 'Team 3 - Water Supply Department',
    reportedDate: '29 Nov 2024',
    reportedDateTime: '29 Nov 2024, 11:10 AM',
    reportedBy: 'Staff Patrol',
    lastUpdated: '01 Dec 2024, 04:20 PM',
    imageUrl: '/images/dashboard/welcome-street-scene.jpg',
    photos: [
      '/images/dashboard/welcome-street-scene.jpg',
    ],
    description: 'Underground pipeline flange joint fracture successfully sealed with high-tensile clamp. Pressure restored to 2.4 bar.',
    citizenName: 'Mukesh Parekh',
    citizenPhone: '+91 98199 87654',
    citizenEmail: 'm.parekh@domain.com',
    mapTop: 44,
    mapLeft: 58,
    history: [
      { title: 'Pipeline clamp welded and pressure tested', actor: 'Team 3 Engineer', time: '01 Dec 2024, 04:20 PM', status: 'Resolved' },
    ],
  },
  {
    id: 'CP-10417',
    index: 5,
    ticketId: 'CP-10417',
    title: 'Broken drain cover',
    category: 'Drainage',
    location: 'Dahisar Check Naka',
    ward: 'Ward 4',
    wardFullName: 'Ward 4 - Dahisar Check Naka',
    priority: 'Medium',
    status: 'In Progress',
    assignedTeam: 'Team 4',
    assignedTeamFull: 'Team 4 - Stormwater Ops',
    reportedDate: '29 Nov 2024',
    reportedDateTime: '29 Nov 2024, 08:30 AM',
    reportedBy: 'Citizen',
    lastUpdated: '30 Nov 2024, 01:45 PM',
    imageUrl: '/images/dashboard/reports-map-view.jpg',
    photos: [
      '/images/dashboard/reports-map-view.jpg',
    ],
    description: 'RCC stormwater slab dislodged near entrance lane to highway check-post. Barricades installed pending new slab casting.',
    citizenName: 'Sunil Deshmukh',
    citizenPhone: '+91 98212 90909',
    citizenEmail: 'sunil.desh@gmail.com',
    mapTop: 69,
    mapLeft: 62,
    history: [
      { title: 'Safety barrier placed and replacement ordered', actor: 'Team 4 Field Officer', time: '30 Nov 2024, 01:45 PM', status: 'In Progress' },
    ],
  },
  {
    id: 'CP-10416',
    index: 6,
    ticketId: 'CP-10416',
    title: 'Park lights defective',
    category: 'Streetlights',
    location: 'Peace Garden, Mira Road',
    ward: 'Ward 1',
    wardFullName: 'Ward 1 - Mira Road',
    priority: 'Low',
    status: 'Resolved',
    assignedTeam: 'Team 1',
    assignedTeamFull: 'Team 1 - Electrical Wing',
    reportedDate: '28 Nov 2024',
    reportedDateTime: '28 Nov 2024, 06:15 PM',
    reportedBy: 'Citizen',
    lastUpdated: '30 Nov 2024, 10:00 AM',
    imageUrl: '/images/dashboard/thumb-streetlight.jpg',
    photos: ['/images/dashboard/thumb-streetlight.jpg'],
    description: 'Jogging track floodlights repaired and timer module replaced.',
    citizenName: 'Aarti Joshi',
    citizenPhone: '+91 98205 33441',
    citizenEmail: 'aarti.j@example.com',
    mapTop: 48,
    mapLeft: 24,
    history: [
      { title: 'Capacitor bank replaced', actor: 'Team 1 Lead', time: '30 Nov 2024, 10:00 AM', status: 'Resolved' },
    ],
  },
  {
    id: 'CP-10415',
    index: 7,
    ticketId: 'CP-10415',
    title: 'Open transformer gate',
    category: 'Others',
    location: 'Near Old Toll Booth, Dahisar',
    ward: 'Ward 4',
    wardFullName: 'Ward 4 - Dahisar Check Naka',
    priority: 'High',
    status: 'Overdue',
    assignedTeam: 'Team 4',
    assignedTeamFull: 'Team 4 - Safety Inspection',
    reportedDate: '27 Nov 2024',
    reportedDateTime: '27 Nov 2024, 02:20 PM',
    reportedBy: 'Staff Patrol',
    lastUpdated: '01 Dec 2024, 09:00 AM',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    photos: ['/images/dashboard/thumb-pothole.jpg'],
    description: 'High voltage distribution kiosk lock broken and door swinging open into footpath.',
    citizenName: 'Rajesh Nair',
    citizenPhone: '+91 98200 12345',
    citizenEmail: 'r.nair@mbmc.gov.in',
    mapTop: 64,
    mapLeft: 56,
    history: [
      { title: 'Notice sent to MSEDCL electric department', actor: 'Ward 4 Officer', time: '01 Dec 2024, 09:00 AM', status: 'Overdue' },
    ],
  },
  {
    id: 'CP-10414',
    index: 8,
    ticketId: 'CP-10414',
    title: 'Fallen tree branch blocking lane',
    category: 'Roads',
    location: 'Indralok Phase 3',
    ward: 'Ward 2',
    wardFullName: 'Ward 2 - Bhayandar West',
    priority: 'Medium',
    status: 'Resolved',
    assignedTeam: 'Team 2',
    assignedTeamFull: 'Team 2 - Tree Pruning Cell',
    reportedDate: '26 Nov 2024',
    reportedDateTime: '26 Nov 2024, 07:45 AM',
    reportedBy: 'Citizen',
    lastUpdated: '26 Nov 2024, 01:30 PM',
    imageUrl: '/images/dashboard/welcome-street-scene.jpg',
    photos: ['/images/dashboard/welcome-street-scene.jpg'],
    description: 'Large gulmohar branch cleared using chainsaws and removed via dumper truck.',
    citizenName: 'Devendra Patil',
    citizenPhone: '+91 98331 45454',
    citizenEmail: 'd.patil@outlook.com',
    mapTop: 64,
    mapLeft: 44,
    history: [
      { title: 'Branch cleared and traffic restored', actor: 'Team 2 Operator', time: '26 Nov 2024, 01:30 PM', status: 'Resolved' },
    ],
  },
];

export interface CityAnalyticsKPIs {
  totalReports: number;
  totalReportsTrend: string;
  resolutionRate: string;
  resolutionRateTrend: string;
  avgResolutionTime: string;
  avgResolutionTimeTrend: string;
  overdueIssues: number;
  overdueIssuesTrend: string;
}

export const CITY_ANALYTICS_KPIS: CityAnalyticsKPIs = {
  totalReports: 1248,
  totalReportsTrend: '+12%',
  resolutionRate: '72%',
  resolutionRateTrend: '+8%',
  avgResolutionTime: '2.4 days',
  avgResolutionTimeTrend: '-18%',
  overdueIssues: 144,
  overdueIssuesTrend: '-5%',
};

export interface VolumeTrendPoint {
  date: string;
  received: number;
  resolved: number;
}

export const VOLUME_TREND_SERIES: Record<string, VolumeTrendPoint[]> = {
  'Last 30 Days': [
    { date: '1 Dec', received: 28, resolved: 20 },
    { date: '5 Dec', received: 45, resolved: 28 },
    { date: '10 Dec', received: 58, resolved: 38 },
    { date: '15 Dec', received: 65, resolved: 46 },
    { date: '20 Dec', received: 70, resolved: 52 },
    { date: '25 Dec', received: 78, resolved: 58 },
    { date: '31 Dec', received: 84, resolved: 65 },
  ],
  'Last 7 Days': [
    { date: '25 Dec', received: 78, resolved: 58 },
    { date: '26 Dec', received: 72, resolved: 55 },
    { date: '27 Dec', received: 80, resolved: 62 },
    { date: '28 Dec', received: 75, resolved: 59 },
    { date: '29 Dec', received: 82, resolved: 63 },
    { date: '30 Dec', received: 79, resolved: 61 },
    { date: '31 Dec', received: 84, resolved: 65 },
  ],
  'Last 90 Days': [
    { date: 'Oct W1', received: 190, resolved: 140 },
    { date: 'Oct W3', received: 220, resolved: 165 },
    { date: 'Nov W1', received: 245, resolved: 180 },
    { date: 'Nov W3', received: 270, resolved: 205 },
    { date: 'Dec W1', received: 295, resolved: 220 },
    { date: 'Dec W3', received: 320, resolved: 240 },
  ],
  'This Year': [
    { date: 'Jan-Feb', received: 420, resolved: 310 },
    { date: 'Mar-Apr', received: 580, resolved: 440 },
    { date: 'May-Jun', received: 750, resolved: 560 },
    { date: 'Jul-Aug', received: 910, resolved: 690 },
    { date: 'Sep-Oct', received: 1100, resolved: 820 },
    { date: 'Nov-Dec', received: 1248, resolved: 892 },
  ],
};

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export const STATUS_DISTRIBUTION: StatusDistributionItem[] = [
  { status: 'Resolved', count: 892, percentage: 72, color: '#10b981' },
  { status: 'In Progress', count: 312, percentage: 25, color: '#f59e0b' },
  { status: 'New', count: 217, percentage: 17, color: '#0284c7' },
  { status: 'Overdue', count: 144, percentage: 12, color: '#ef4444' },
];

export interface WardPerformanceRowData {
  ward: string;
  shortName: string;
  totalIssues: number;
  resolved: number;
  resolutionRate: number;
  avgResolution: string;
  overdue: number;
  performance: 'Excellent' | 'Good' | 'Needs Attention';
}

export const WARD_PERFORMANCE_COMPARISON: WardPerformanceRowData[] = [
  {
    ward: 'Ward 1',
    shortName: 'Ward 1',
    totalIssues: 248,
    resolved: 186,
    resolutionRate: 75,
    avgResolution: '2.1 days',
    overdue: 18,
    performance: 'Good',
  },
  {
    ward: 'Ward 2',
    shortName: 'Ward 2',
    totalIssues: 214,
    resolved: 142,
    resolutionRate: 66,
    avgResolution: '3.2 days',
    overdue: 29,
    performance: 'Needs Attention',
  },
  {
    ward: 'Ward 3',
    shortName: 'Ward 3',
    totalIssues: 291,
    resolved: 224,
    resolutionRate: 77,
    avgResolution: '1.9 days',
    overdue: 14,
    performance: 'Excellent',
  },
  {
    ward: 'Ward 4',
    shortName: 'Ward 4',
    totalIssues: 198,
    resolved: 143,
    resolutionRate: 72,
    avgResolution: '2.5 days',
    overdue: 21,
    performance: 'Good',
  },
  {
    ward: 'Ward 5',
    shortName: 'Ward 5',
    totalIssues: 297,
    resolved: 197,
    resolutionRate: 66,
    avgResolution: '3.0 days',
    overdue: 34,
    performance: 'Needs Attention',
  },
];

export interface AIPriorityFeaturedCard {
  level: 'CRITICAL' | 'HIGH PRIORITY' | 'MEDIUM PRIORITY';
  title: string;
  ward: string;
  priorityScore: number;
  scoreColor: string;
  factors: string[];
  actionLabel: string;
  category: string;
  ticketId: string;
}

export const AI_PRIORITY_FEATURED: AIPriorityFeaturedCard[] = [
  {
    level: 'CRITICAL',
    title: 'Severe road damage near major junction',
    ward: 'Ward 1',
    priorityScore: 94,
    scoreColor: '#ef4444',
    factors: [
      'High public impact',
      'High severity',
      'High traffic exposure',
      'Multiple reports',
      'Increasing recurrence',
    ],
    actionLabel: 'Immediate Attention',
    category: 'Roads',
    ticketId: 'CP-10421',
  },
  {
    level: 'HIGH PRIORITY',
    title: 'Water supply disruption — Ward 4',
    ward: 'Ward 4',
    priorityScore: 86,
    scoreColor: '#f97316',
    factors: [
      'High affected population',
      'Multiple complaints',
      'Service disruption',
      'Recurring issue',
    ],
    actionLabel: 'Assign Resources',
    category: 'Water Supply',
    ticketId: 'CP-10499',
  },
  {
    level: 'MEDIUM PRIORITY',
    title: 'Streetlight failures — Ward 2',
    ward: 'Ward 2',
    priorityScore: 68,
    scoreColor: '#eab308',
    factors: [
      'Public safety hazard',
      'High pedestrian footfall',
      'Night visibility disruption',
      'Overdue electrical dispatch',
    ],
    actionLabel: 'Schedule Maintenance',
    category: 'Streetlights',
    ticketId: 'CP-10512',
  },
];

export interface TopAIPriorityRow {
  rank: number;
  issue: string;
  ward: string;
  priority: 'Critical' | 'High' | 'Medium';
  priorityScore: number;
  suggestedAction: string;
  category: string;
}

export const TOP_AI_PRIORITY_ISSUES: TopAIPriorityRow[] = [
  {
    rank: 1,
    issue: 'Pothole on Mira Road',
    ward: 'Ward 1',
    priority: 'Critical',
    priorityScore: 94,
    suggestedAction: 'Assign Road Repair Team',
    category: 'Roads',
  },
  {
    rank: 2,
    issue: 'Overflowing Waste Bin – Sector 5',
    ward: 'Ward 2',
    priority: 'High',
    priorityScore: 86,
    suggestedAction: 'Dispatch Sanitation Team',
    category: 'Waste Management',
  },
  {
    rank: 3,
    issue: 'Water Leakage – GCC Road',
    ward: 'Ward 3',
    priority: 'Medium',
    priorityScore: 78,
    suggestedAction: 'Schedule Maintenance',
    category: 'Water Supply',
  },
  {
    rank: 4,
    issue: 'Non-working Streetlight – Station Rd',
    ward: 'Ward 4',
    priority: 'Medium',
    priorityScore: 72,
    suggestedAction: 'Assign Electrical Team',
    category: 'Streetlights',
  },
  {
    rank: 5,
    issue: 'Blocked Drain – Bhayandar West',
    ward: 'Ward 5',
    priority: 'Medium',
    priorityScore: 68,
    suggestedAction: 'Clear Drain & Inspect',
    category: 'Drainage',
  },
];

export interface ResourceAllocationCard {
  department: string;
  recommendation: string;
  reason: string;
  icon: string;
  badgeColor: string;
}

export const RESOURCE_ALLOCATION_RECOMMENDATIONS: ResourceAllocationCard[] = [
  {
    department: 'Road Maintenance',
    recommendation: '8 field teams recommended',
    reason: 'High number of critical road-related reports',
    icon: '🛣️',
    badgeColor: '#3b82f6',
  },
  {
    department: 'Waste Management',
    recommendation: '5 additional teams recommended',
    reason: 'High complaint volume in multiple wards',
    icon: '🗑️',
    badgeColor: '#10b981',
  },
  {
    department: 'Water Supply',
    recommendation: '3 emergency response teams',
    reason: 'High-impact recurring service disruptions',
    icon: '💧',
    badgeColor: '#06b6d4',
  },
  {
    department: 'Streetlight Maintenance',
    recommendation: '2 maintenance teams',
    reason: 'Growing number of unresolved reports',
    icon: '💡',
    badgeColor: '#f59e0b',
  },
];

export interface HotspotData {
  id: string;
  name: string;
  ward: string;
  density: 'Critical' | 'High' | 'Medium' | 'Low';
  issuesCount: number;
  primaryCategory: string;
  xPercent: number;
  yPercent: number;
  color: string;
}

export const HOTSPOT_DATA: HotspotData[] = [
  {
    id: 'hs-1',
    name: 'Mira Road Junction',
    ward: 'Ward 1',
    density: 'Critical',
    issuesCount: 58,
    primaryCategory: 'Roads',
    xPercent: 48,
    yPercent: 72,
    color: '#ef4444',
  },
  {
    id: 'hs-2',
    name: 'Bhayandar West Station',
    ward: 'Ward 2',
    density: 'High',
    issuesCount: 38,
    primaryCategory: 'Waste Management',
    xPercent: 32,
    yPercent: 44,
    color: '#f97316',
  },
  {
    id: 'hs-3',
    name: 'Bhayandar East Industrial',
    ward: 'Ward 3',
    density: 'Medium',
    issuesCount: 26,
    primaryCategory: 'Drainage',
    xPercent: 78,
    yPercent: 40,
    color: '#eab308',
  },
  {
    id: 'hs-4',
    name: 'Mira Road East Hub',
    ward: 'Ward 1',
    density: 'High',
    issuesCount: 42,
    primaryCategory: 'Streetlights',
    xPercent: 82,
    yPercent: 62,
    color: '#f97316',
  },
  {
    id: 'hs-5',
    name: 'Dahisar Check Naka Border',
    ward: 'Ward 4',
    density: 'Low',
    issuesCount: 16,
    primaryCategory: 'Traffic',
    xPercent: 20,
    yPercent: 55,
    color: '#14b8a6',
  },
];

export const KEY_CITY_INSIGHTS = [
  {
    id: 'ins-1',
    title: 'Road-related issues increased 18% this month.',
    category: 'Roads',
    trend: '+18%',
    isAlert: true,
    icon: '⚠️',
  },
  {
    id: 'ins-2',
    title: 'Ward 3 has the highest resolution rate at 77%.',
    category: 'Performance',
    trend: '77%',
    isAlert: false,
    icon: '🏆',
  },
  {
    id: 'ins-3',
    title: '144 issues currently require overdue attention.',
    category: 'Overdue',
    trend: '144 Overdue',
    isAlert: true,
    icon: '⏱️',
  },
  {
    id: 'ins-4',
    title: 'Waste and road complaints represent the largest share of reported issues.',
    category: 'Volume',
    trend: '47% of total',
    isAlert: false,
    icon: '📊',
  },
];

export interface WardPerformanceAnalyticsRow {
  rank: number;
  ward: string;
  shortName: string;
  totalReports: number;
  unresolved: number;
  overdue: number;
  resolutionRate: number;
  avgResolutionTime: string;
}

export const WARD_PERFORMANCE_ANALYTICS: WardPerformanceAnalyticsRow[] = [
  {
    rank: 1,
    ward: 'Ward 1 – Mira Road',
    shortName: 'Ward 1',
    totalReports: 312,
    unresolved: 82,
    overdue: 20,
    resolutionRate: 74,
    avgResolutionTime: '2.1 days',
  },
  {
    rank: 2,
    ward: 'Ward 2 – Bhayandar West',
    shortName: 'Ward 2',
    totalReports: 280,
    unresolved: 75,
    overdue: 20,
    resolutionRate: 73,
    avgResolutionTime: '2.4 days',
  },
  {
    rank: 3,
    ward: 'Ward 3 – Bhayandar East',
    shortName: 'Ward 3',
    totalReports: 356,
    unresolved: 116,
    overdue: 26,
    resolutionRate: 67,
    avgResolutionTime: '2.8 days',
  },
  {
    rank: 4,
    ward: 'Ward 4 – Dahisar Check Naka',
    shortName: 'Ward 4',
    totalReports: 300,
    unresolved: 93,
    overdue: 18,
    resolutionRate: 72,
    avgResolutionTime: '2.3 days',
  },
];

export interface AIPrioritisedIssue {
  rank: number;
  id: string;
  ticketId: string;
  title: string;
  category: IssueCategory;
  ward: string;
  priorityScore: number;
  keyFactors: string;
  explanation: string;
}

export const AI_PRIORITISED_ISSUES: AIPrioritisedIssue[] = [
  {
    rank: 1,
    id: 'CP-10421',
    ticketId: 'CP-10421',
    title: 'Pothole on Station Road',
    category: 'Roads',
    ward: 'Ward 1',
    priorityScore: 92,
    keyFactors: 'High severity, high traffic, 6 days old',
    explanation: 'Major road damage in high-traffic area affecting public safety and causing multiple complaints',
  },
  {
    rank: 2,
    id: 'CP-10419',
    ticketId: 'CP-10419',
    title: 'Garbage overflow',
    category: 'Waste',
    ward: 'Ward 2',
    priorityScore: 87,
    keyFactors: 'High impact, 4 days old, recurring',
    explanation: 'Recurring garbage overflow with public health concerns in high-density area',
  },
  {
    rank: 3,
    id: 'CP-10417',
    ticketId: 'CP-10417',
    title: 'Streetlight not working',
    category: 'Streetlights',
    ward: 'Ward 3',
    priorityScore: 82,
    keyFactors: 'Safety issue, 5 days old',
    explanation: 'Non-functional streetlight in residential area affecting public safety at night',
  },
  {
    rank: 4,
    id: 'CP-10418',
    ticketId: 'CP-10418',
    title: 'Water leakage',
    category: 'Water Supply',
    ward: 'Ward 3',
    priorityScore: 78,
    keyFactors: 'Medium impact, 4 days old',
    explanation: 'Water leakage causing wastage and road damage',
  },
  {
    rank: 5,
    id: 'CP-10416',
    ticketId: 'CP-10416',
    title: 'Broken drain cover',
    category: 'Drainage',
    ward: 'Ward 4',
    priorityScore: 76,
    keyFactors: 'Safety risk, 3 days old',
    explanation: 'Open drain cover creating accident risk for pedestrians and vehicles',
  },
];



// ============================================================================
// WARD & USER MANAGEMENT DATA
// ============================================================================

export interface WardManagementItem {
  id: string;
  wardNumber: number;
  name: string;
  status: 'Active' | 'Inactive';
  areaKm2: number;
  population: number;
  totalIssues: number;
  resolutionRate: number;
  officerInCharge: string;
  contactNumber: string;
  email: string;
  officeAddress: string;
  criticalIssuesCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

export type SystemUserRole = 'Admin' | 'Ward Officer' | 'Staff' | 'Viewer';

export interface SystemUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: SystemUserRole;
  assignedWards: string[];
  status: 'Active' | 'Inactive';
  avatarInitials: string;
  avatarColor: string;
  phone: string;
  lastActive: string;
  createdDate: string;
}

export const WARD_MANAGEMENT_DATA: WardManagementItem[] = [
  {
    id: 'ward-1',
    wardNumber: 1,
    name: 'Ward 1',
    status: 'Active',
    areaKm2: 6.2,
    population: 125340,
    totalIssues: 248,
    resolutionRate: 75,
    officerInCharge: 'Rohit Sharma',
    contactNumber: '+91 98201 44521',
    email: 'rohit.sharma@civicpulse.in',
    officeAddress: 'Municipal Office Bldg, Sector 2, Station Road, Mira Road East, 401107',
    criticalIssuesCount: 14,
    inProgressCount: 48,
    resolvedCount: 186,
  },
  {
    id: 'ward-2',
    wardNumber: 2,
    name: 'Ward 2',
    status: 'Active',
    areaKm2: 5.8,
    population: 110892,
    totalIssues: 214,
    resolutionRate: 66,
    officerInCharge: 'Pooja Kadam',
    contactNumber: '+91 98203 11842',
    email: 'pooja.kadam@civicpulse.in',
    officeAddress: 'Ward 2 Civic Center, Shanti Park, Silver Park Rd, Mira Road, 401107',
    criticalIssuesCount: 19,
    inProgressCount: 54,
    resolvedCount: 141,
  },
  {
    id: 'ward-3',
    wardNumber: 3,
    name: 'Ward 3',
    status: 'Active',
    areaKm2: 7.1,
    population: 138765,
    totalIssues: 291,
    resolutionRate: 77,
    officerInCharge: 'Amit Verma',
    contactNumber: '+91 98205 99314',
    email: 'amit.verma@civicpulse.in',
    officeAddress: 'Zonal Municipal Complex, GCC Club Road, Mira Bhayandar Highway, 401107',
    criticalIssuesCount: 16,
    inProgressCount: 51,
    resolvedCount: 224,
  },
  {
    id: 'ward-4',
    wardNumber: 4,
    name: 'Ward 4',
    status: 'Active',
    areaKm2: 6.5,
    population: 120430,
    totalIssues: 198,
    resolutionRate: 72,
    officerInCharge: 'Sneha Deshmukh',
    contactNumber: '+91 98202 77150',
    email: 'sneha.deshmukh@civicpulse.in',
    officeAddress: 'Bhayandar West Sub-Office, Near Maxus Mall, 150 Feet Rd, Bhayandar West, 401101',
    criticalIssuesCount: 12,
    inProgressCount: 43,
    resolvedCount: 143,
  },
  {
    id: 'ward-5',
    wardNumber: 5,
    name: 'Ward 5',
    status: 'Active',
    areaKm2: 7.0,
    population: 132210,
    totalIssues: 297,
    resolutionRate: 66,
    officerInCharge: 'Manish Borkar',
    contactNumber: '+91 98204 66289',
    email: 'manish.borkar@civicpulse.in',
    officeAddress: 'Coastal Ward Directorate, Uttan Road, Rai Gaon, Bhayandar West, 401106',
    criticalIssuesCount: 23,
    inProgressCount: 78,
    resolvedCount: 196,
  },
];

export const SYSTEM_USERS_DATA: SystemUser[] = [
  {
    id: 'usr-1',
    userId: 'CP-U101',
    name: 'Rohit Sharma',
    email: 'rohit.sharma@civicpulse.in',
    role: 'Ward Officer',
    assignedWards: ['Ward 1'],
    status: 'Active',
    avatarInitials: 'RS',
    avatarColor: '#0284c7',
    phone: '+91 98201 44521',
    lastActive: '5 minutes ago',
    createdDate: '12 Jan 2024',
  },
  {
    id: 'usr-2',
    userId: 'CP-U102',
    name: 'Pooja Kadam',
    email: 'pooja.kadam@civicpulse.in',
    role: 'Ward Officer',
    assignedWards: ['Ward 2'],
    status: 'Active',
    avatarInitials: 'PK',
    avatarColor: '#0284c7',
    phone: '+91 98203 11842',
    lastActive: '12 minutes ago',
    createdDate: '15 Jan 2024',
  },
  {
    id: 'usr-3',
    userId: 'CP-U103',
    name: 'Amit Verma',
    email: 'amit.verma@civicpulse.in',
    role: 'Ward Officer',
    assignedWards: ['Ward 3'],
    status: 'Active',
    avatarInitials: 'AV',
    avatarColor: '#0284c7',
    phone: '+91 98205 99314',
    lastActive: '1 hour ago',
    createdDate: '18 Jan 2024',
  },
  {
    id: 'usr-4',
    userId: 'CP-U104',
    name: 'Sneha Deshmukh',
    email: 'sneha.deshmukh@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 4'],
    status: 'Active',
    avatarInitials: 'SD',
    avatarColor: '#d97706',
    phone: '+91 98202 77150',
    lastActive: '34 minutes ago',
    createdDate: '24 Jan 2024',
  },
  {
    id: 'usr-5',
    userId: 'CP-U105',
    name: 'Manish Borkar',
    email: 'manish.borkar@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 5'],
    status: 'Active',
    avatarInitials: 'MB',
    avatarColor: '#d97706',
    phone: '+91 98204 66289',
    lastActive: '2 hours ago',
    createdDate: '01 Feb 2024',
  },
  {
    id: 'usr-6',
    userId: 'CP-U106',
    name: 'Aditi Patil',
    email: 'aditi.patil@civicpulse.in',
    role: 'Viewer',
    assignedWards: ['All Wards'],
    status: 'Active',
    avatarInitials: 'AD',
    avatarColor: '#9333ea',
    phone: '+91 98208 33912',
    lastActive: 'Just now',
    createdDate: '05 Feb 2024',
  },
  {
    id: 'usr-7',
    userId: 'CP-U107',
    name: 'Admin User',
    email: 'admin@civicpulse.in',
    role: 'Admin',
    assignedWards: ['All Wards'],
    status: 'Active',
    avatarInitials: 'SA',
    avatarColor: '#ef4444',
    phone: '+91 98200 00001',
    lastActive: 'Active now',
    createdDate: '01 Jan 2024',
  },
  // Additional users for pagination (Total 28)
  {
    id: 'usr-8',
    userId: 'CP-U108',
    name: 'Nikhil Kulkarni',
    email: 'nikhil.kulkarni@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 1'],
    status: 'Active',
    avatarInitials: 'NK',
    avatarColor: '#0ea5e9',
    phone: '+91 98201 55678',
    lastActive: '4 hours ago',
    createdDate: '10 Feb 2024',
  },
  {
    id: 'usr-9',
    userId: 'CP-U109',
    name: 'Kavita Shinde',
    email: 'kavita.shinde@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 2'],
    status: 'Active',
    avatarInitials: 'KS',
    avatarColor: '#10b981',
    phone: '+91 98202 88990',
    lastActive: '3 hours ago',
    createdDate: '14 Feb 2024',
  },
  {
    id: 'usr-10',
    userId: 'CP-U110',
    name: 'Rajesh Gupta',
    email: 'rajesh.gupta@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 3'],
    status: 'Active',
    avatarInitials: 'RG',
    avatarColor: '#f59e0b',
    phone: '+91 98203 77441',
    lastActive: '1 day ago',
    createdDate: '18 Feb 2024',
  },
  {
    id: 'usr-11',
    userId: 'CP-U111',
    name: 'Sunita More',
    email: 'sunita.more@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 4'],
    status: 'Active',
    avatarInitials: 'SM',
    avatarColor: '#6366f1',
    phone: '+91 98204 11223',
    lastActive: '2 days ago',
    createdDate: '22 Feb 2024',
  },
  {
    id: 'usr-12',
    userId: 'CP-U112',
    name: 'Deepak Patil',
    email: 'deepak.patil@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 5'],
    status: 'Active',
    avatarInitials: 'DP',
    avatarColor: '#ec4899',
    phone: '+91 98205 33445',
    lastActive: '6 hours ago',
    createdDate: '25 Feb 2024',
  },
  {
    id: 'usr-13',
    userId: 'CP-U113',
    name: 'Vikas Mane',
    email: 'vikas.mane@civicpulse.in',
    role: 'Ward Officer',
    assignedWards: ['Ward 1'],
    status: 'Active',
    avatarInitials: 'VM',
    avatarColor: '#0284c7',
    phone: '+91 98206 55667',
    lastActive: '30 mins ago',
    createdDate: '01 Mar 2024',
  },
  {
    id: 'usr-14',
    userId: 'CP-U114',
    name: 'Priya Rao',
    email: 'priya.rao@civicpulse.in',
    role: 'Viewer',
    assignedWards: ['Ward 2'],
    status: 'Active',
    avatarInitials: 'PR',
    avatarColor: '#8b5cf6',
    phone: '+91 98207 77889',
    lastActive: '4 hours ago',
    createdDate: '05 Mar 2024',
  },
  {
    id: 'usr-15',
    userId: 'CP-U115',
    name: 'Anand Rane',
    email: 'anand.rane@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 3'],
    status: 'Active',
    avatarInitials: 'AR',
    avatarColor: '#14b8a6',
    phone: '+91 98208 99001',
    lastActive: '1 hour ago',
    createdDate: '10 Mar 2024',
  },
  {
    id: 'usr-16',
    userId: 'CP-U116',
    name: 'Swati Parab',
    email: 'swati.parab@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 4'],
    status: 'Active',
    avatarInitials: 'SP',
    avatarColor: '#f97316',
    phone: '+91 98209 11224',
    lastActive: '5 hours ago',
    createdDate: '15 Mar 2024',
  },
  {
    id: 'usr-17',
    userId: 'CP-U117',
    name: 'Ganesh Mhatre',
    email: 'ganesh.mhatre@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 5'],
    status: 'Active',
    avatarInitials: 'GM',
    avatarColor: '#06b6d4',
    phone: '+91 98210 22335',
    lastActive: 'Just now',
    createdDate: '20 Mar 2024',
  },
  {
    id: 'usr-18',
    userId: 'CP-U118',
    name: 'Tanvi Joshi',
    email: 'tanvi.joshi@civicpulse.in',
    role: 'Viewer',
    assignedWards: ['All Wards'],
    status: 'Active',
    avatarInitials: 'TJ',
    avatarColor: '#a855f7',
    phone: '+91 98211 33446',
    lastActive: '2 days ago',
    createdDate: '24 Mar 2024',
  },
  {
    id: 'usr-19',
    userId: 'CP-U119',
    name: 'Sagar Sawant',
    email: 'sagar.sawant@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 1'],
    status: 'Active',
    avatarInitials: 'SS',
    avatarColor: '#10b981',
    phone: '+91 98212 44557',
    lastActive: '3 hours ago',
    createdDate: '28 Mar 2024',
  },
  {
    id: 'usr-20',
    userId: 'CP-U120',
    name: 'Meera Shah',
    email: 'meera.shah@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 2'],
    status: 'Active',
    avatarInitials: 'MS',
    avatarColor: '#e11d48',
    phone: '+91 98213 55668',
    lastActive: '1 day ago',
    createdDate: '02 Apr 2024',
  },
  {
    id: 'usr-21',
    userId: 'CP-U121',
    name: 'Ajay Kamble',
    email: 'ajay.kamble@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 3'],
    status: 'Inactive',
    avatarInitials: 'AK',
    avatarColor: '#64748b',
    phone: '+91 98214 66779',
    lastActive: '12 days ago',
    createdDate: '06 Apr 2024',
  },
  {
    id: 'usr-22',
    userId: 'CP-U122',
    name: 'Ritu Kapoor',
    email: 'ritu.kapoor@civicpulse.in',
    role: 'Viewer',
    assignedWards: ['Ward 4'],
    status: 'Active',
    avatarInitials: 'RK',
    avatarColor: '#9333ea',
    phone: '+91 98215 77880',
    lastActive: '6 hours ago',
    createdDate: '11 Apr 2024',
  },
  {
    id: 'usr-23',
    userId: 'CP-U123',
    name: 'Vikram Bhosle',
    email: 'vikram.bhosle@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 5'],
    status: 'Active',
    avatarInitials: 'VB',
    avatarColor: '#d97706',
    phone: '+91 98216 88991',
    lastActive: '45 mins ago',
    createdDate: '16 Apr 2024',
  },
  {
    id: 'usr-24',
    userId: 'CP-U124',
    name: 'Neha Dubey',
    email: 'neha.dubey@civicpulse.in',
    role: 'Admin',
    assignedWards: ['All Wards'],
    status: 'Active',
    avatarInitials: 'ND',
    avatarColor: '#ef4444',
    phone: '+91 98217 99002',
    lastActive: '2 hours ago',
    createdDate: '20 Apr 2024',
  },
  {
    id: 'usr-25',
    userId: 'CP-U125',
    name: 'Sandeep Tiwari',
    email: 'sandeep.tiwari@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 1'],
    status: 'Active',
    avatarInitials: 'ST',
    avatarColor: '#0284c7',
    phone: '+91 98218 11225',
    lastActive: '1 hour ago',
    createdDate: '25 Apr 2024',
  },
  {
    id: 'usr-26',
    userId: 'CP-U126',
    name: 'Archana Tambe',
    email: 'archana.tambe@civicpulse.in',
    role: 'Viewer',
    assignedWards: ['Ward 2'],
    status: 'Active',
    avatarInitials: 'AT',
    avatarColor: '#8b5cf6',
    phone: '+91 98219 22336',
    lastActive: '5 hours ago',
    createdDate: '30 Apr 2024',
  },
  {
    id: 'usr-27',
    userId: 'CP-U127',
    name: 'Sachin Chavan',
    email: 'sachin.chavan@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 3'],
    status: 'Active',
    avatarInitials: 'SC',
    avatarColor: '#10b981',
    phone: '+91 98220 33447',
    lastActive: 'Just now',
    createdDate: '04 May 2024',
  },
  {
    id: 'usr-28',
    userId: 'CP-U128',
    name: 'Pranav Dalvi',
    email: 'pranav.dalvi@civicpulse.in',
    role: 'Staff',
    assignedWards: ['Ward 4'],
    status: 'Active',
    avatarInitials: 'PD',
    avatarColor: '#0ea5e9',
    phone: '+91 98221 44558',
    lastActive: '20 mins ago',
    createdDate: '08 May 2024',
  },
];

// ============================================================================
// RESOURCE ALLOCATION DATA & TYPES
// ============================================================================

export type ResourceType =
  | 'Road Maintenance'
  | 'Waste Management'
  | 'Water Supply'
  | 'Drainage'
  | 'Streetlight'
  | 'Emergency Response'
  | 'General Field Team';

export type ResourceStatus = 'Available' | 'Deployed' | 'Maintenance' | 'Unavailable';
export type ResourcePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AllocatedResource {
  id: string;
  type: ResourceType;
  assignedWard: string;
  currentTask: string;
  status: ResourceStatus;
  priority: ResourcePriority;
  teamLead: string;
  teamSize: number;
  deploymentTime: string;
  expectedCompletion: string;
  equipment: string[];
  recentActivity: string;
  eta?: string;
  locationMarker?: { xPercent: number; yPercent: number };
}

export interface WardResourceDemandItem {
  ward: string;
  openIssues: number;
  criticalIssues: number;
  highIssues: number;
  resourcesNeeded: number;
  resourcesAssigned: number;
  gap: number;
}

export interface ResourceInventoryCategory {
  category: ResourceType;
  total: number;
  available: number;
  deployed: number;
  maintenance: number;
  utilization: number;
}

export interface AIResourceRecommendation {
  id: string;
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  ward: string;
  priorityScore: number;
  reasons: string[];
  recommendedAction: string;
  recommendedQuantity: number;
  resourceType: ResourceType;
}

export interface ActiveDeploymentMapItem {
  id: string;
  name: string;
  ward: string;
  status: 'En Route' | 'On Site' | 'Available' | 'Maintenance' | 'Unavailable';
  eta?: string;
  type: ResourceType;
  xPercent: number;
  yPercent: number;
}

export const RESOURCE_ALLOCATION_KPIS = {
  availableResources: 42,
  availableSecondary: 'Ready for deployment',
  currentlyDeployed: 28,
  deployedSecondary: 'Across 5 wards',
  resourceUtilization: 68,
  utilizationSecondary: '+6% vs last week',
  criticalResourceNeeds: 14,
  criticalSecondary: 'Requires attention',
};

export const RESOURCE_DEMAND_OVERVIEW: { category: ResourceType; demand: number; level: 'critical' | 'high' | 'normal' }[] = [
  { category: 'Road Maintenance', demand: 18, level: 'critical' },
  { category: 'Waste Management', demand: 12, level: 'high' },
  { category: 'Water Supply', demand: 9, level: 'high' },
  { category: 'Drainage', demand: 7, level: 'normal' },
  { category: 'Streetlight', demand: 5, level: 'normal' },
  { category: 'Emergency Response', demand: 4, level: 'normal' },
];

export const RESOURCE_UTILIZATION_BREAKDOWN = {
  deployed: 28,
  available: 42,
  maintenance: 8,
  unavailable: 4,
  total: 82,
  utilizationRate: 68,
};

export const WARD_RESOURCE_DEMAND_DATA: WardResourceDemandItem[] = [
  {
    ward: 'Ward 1',
    openIssues: 62,
    criticalIssues: 4,
    highIssues: 18,
    resourcesNeeded: 12,
    resourcesAssigned: 10,
    gap: 2,
  },
  {
    ward: 'Ward 2',
    openIssues: 51,
    criticalIssues: 3,
    highIssues: 15,
    resourcesNeeded: 10,
    resourcesAssigned: 8,
    gap: 2,
  },
  {
    ward: 'Ward 3',
    openIssues: 74,
    criticalIssues: 5,
    highIssues: 22,
    resourcesNeeded: 14,
    resourcesAssigned: 13,
    gap: 1,
  },
  {
    ward: 'Ward 4',
    openIssues: 43,
    criticalIssues: 1,
    highIssues: 12,
    resourcesNeeded: 8,
    resourcesAssigned: 7,
    gap: 1,
  },
  {
    ward: 'Ward 5',
    openIssues: 58,
    criticalIssues: 3,
    highIssues: 17,
    resourcesNeeded: 11,
    resourcesAssigned: 9,
    gap: 2,
  },
];

export const AI_RESOURCE_RECOMMENDATIONS_DATA: AIResourceRecommendation[] = [
  {
    id: 'REC-01',
    level: 'Critical',
    title: 'Deploy Road Maintenance Team to Ward 3',
    ward: 'Ward 3',
    priorityScore: 94,
    reasons: [
      '5 critical road-related issues',
      'High traffic exposure on GCC corridor',
      '22 high-priority issues pending',
      'Resource gap of 1 road squad detected',
    ],
    recommendedAction: 'Deploy 2 Road Teams',
    recommendedQuantity: 2,
    resourceType: 'Road Maintenance',
  },
  {
    id: 'REC-02',
    level: 'High',
    title: 'Deploy Water Response Team to Ward 1',
    ward: 'Ward 1',
    priorityScore: 87,
    reasons: [
      'Multiple water-supply disruption complaints',
      'High affected population (1,25,340)',
      'Increasing unresolved pipeline reports',
    ],
    recommendedAction: 'Deploy 1 Water Team',
    recommendedQuantity: 1,
    resourceType: 'Water Supply',
  },
  {
    id: 'REC-03',
    level: 'High',
    title: 'Increase Waste Management Capacity in Ward 5',
    ward: 'Ward 5',
    priorityScore: 81,
    reasons: [
      'High waste complaint volume',
      'Recurring overflow in commercial sectors',
      'Existing team operating near 92% capacity',
    ],
    recommendedAction: 'Deploy 2 Waste Teams',
    recommendedQuantity: 2,
    resourceType: 'Waste Management',
  },
];

export const ACTIVE_DEPLOYMENTS_LIST: ActiveDeploymentMapItem[] = [
  {
    id: 'R-03',
    name: 'Road Team R-03',
    ward: 'Ward 3',
    status: 'En Route',
    eta: '18 min',
    type: 'Road Maintenance',
    xPercent: 68,
    yPercent: 44,
  },
  {
    id: 'W-02',
    name: 'Waste Team W-02',
    ward: 'Ward 5',
    status: 'On Site',
    type: 'Waste Management',
    xPercent: 28,
    yPercent: 62,
  },
  {
    id: 'WS-01',
    name: 'Water Team WS-01',
    ward: 'Ward 1',
    status: 'Available',
    type: 'Water Supply',
    xPercent: 74,
    yPercent: 65,
  },
  {
    id: 'D-04',
    name: 'Drainage Team D-04',
    ward: 'Ward 2',
    status: 'Maintenance',
    type: 'Drainage',
    xPercent: 32,
    yPercent: 36,
  },
];

export const RESOURCE_INVENTORY_DATA: ResourceInventoryCategory[] = [
  {
    category: 'Road Maintenance',
    total: 12,
    available: 4,
    deployed: 7,
    maintenance: 1,
    utilization: 67,
  },
  {
    category: 'Waste Management',
    total: 10,
    available: 3,
    deployed: 6,
    maintenance: 1,
    utilization: 60,
  },
  {
    category: 'Water Supply',
    total: 8,
    available: 2,
    deployed: 5,
    maintenance: 1,
    utilization: 63,
  },
  {
    category: 'Drainage',
    total: 6,
    available: 2,
    deployed: 3,
    maintenance: 1,
    utilization: 50,
  },
  {
    category: 'Streetlight',
    total: 5,
    available: 3,
    deployed: 2,
    maintenance: 0,
    utilization: 40,
  },
  {
    category: 'Emergency Response',
    total: 4,
    available: 2,
    deployed: 2,
    maintenance: 0,
    utilization: 50,
  },
  {
    category: 'General Field Team',
    total: 10,
    available: 6,
    deployed: 3,
    maintenance: 1,
    utilization: 33,
  },
];

export const INITIAL_RESOURCE_ALLOCATIONS: AllocatedResource[] = [
  {
    id: 'RMT-03',
    type: 'Road Maintenance',
    assignedWard: 'Ward 3',
    currentTask: 'Pothole repairs on GCC Road',
    status: 'Deployed',
    priority: 'Critical',
    teamLead: 'Vikram Shinde',
    teamSize: 6,
    deploymentTime: '08:30 AM',
    expectedCompletion: '04:30 PM',
    equipment: ['Asphalt Paver #2', 'Compactor Roller', 'Safety Barricades'],
    recentActivity: 'Patched 8 high-depth potholes near flyover ramp',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 68, yPercent: 44 },
  },
  {
    id: 'WST-02',
    type: 'Waste Management',
    assignedWard: 'Ward 5',
    currentTask: 'Garbage overflow & bin clearance',
    status: 'Deployed',
    priority: 'High',
    teamLead: 'Ramesh Pawar',
    teamSize: 8,
    deploymentTime: '07:00 AM',
    expectedCompletion: '02:00 PM',
    equipment: ['Compactor Truck #09', 'Heavy Dumper #03', 'Hydraulic Loader'],
    recentActivity: 'Cleared 4.2 tonnes of organic waste from Sector 7 market',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 28, yPercent: 62 },
  },
  {
    id: 'WTR-01',
    type: 'Water Supply',
    assignedWard: 'Ward 1',
    currentTask: 'Pipeline disruption & valve replacement',
    status: 'Available',
    priority: 'Critical',
    teamLead: 'Suresh Patil',
    teamSize: 5,
    deploymentTime: 'Standby at Base',
    expectedCompletion: 'Immediate Dispatch',
    equipment: ['Excavator Mini', 'Pipeline Pressure Gauge', 'Submersible Pump'],
    recentActivity: 'Repaired underground main valve at Station Road junction',
    eta: 'Base Station',
    locationMarker: { xPercent: 74, yPercent: 65 },
  },
  {
    id: 'DRN-04',
    type: 'Drainage',
    assignedWard: 'Ward 2',
    currentTask: 'Drain cleaning & culvert de-choking',
    status: 'Maintenance',
    priority: 'Medium',
    teamLead: 'Ganesh Jadhav',
    teamSize: 4,
    deploymentTime: 'In Depot',
    expectedCompletion: '11:30 AM (Post-servicing)',
    equipment: ['Suction Tanker #04', 'High-Pressure Jetting Unit'],
    recentActivity: 'Vehicle scheduled hydraulic hose maintenance at central garage',
    eta: 'Central Depot',
    locationMarker: { xPercent: 32, yPercent: 36 },
  },
  {
    id: 'SLT-01',
    type: 'Streetlight',
    assignedWard: 'Ward 3',
    currentTask: 'Dark zone streetlight cable restoration',
    status: 'Deployed',
    priority: 'High',
    teamLead: 'Anil Gupta',
    teamSize: 4,
    deploymentTime: '09:00 AM',
    expectedCompletion: '03:00 PM',
    equipment: ['Hydraulic Cherry Picker #01', 'Multi-meter Kit', 'LED Fixtures'],
    recentActivity: 'Replaced 12 sodium lamps with 90W LED fixtures on Sector 4 road',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 64, yPercent: 49 },
  },
  {
    id: 'ERT-02',
    type: 'Emergency Response',
    assignedWard: 'Ward 4',
    currentTask: 'Fallen tree branch & carriageway clearing',
    status: 'Deployed',
    priority: 'Critical',
    teamLead: 'Mahesh Kadam',
    teamSize: 7,
    deploymentTime: '09:15 AM',
    expectedCompletion: '12:30 PM',
    equipment: ['Chainsaw Rig', 'Heavy Winch Crane', 'Traffic Warning Beacons'],
    recentActivity: 'Cleared 60% of obstructed eastbound carriageway',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 42, yPercent: 52 },
  },
  {
    id: 'RMT-01',
    type: 'Road Maintenance',
    assignedWard: 'Ward 1',
    currentTask: 'Manhole rim levelling & speed-bump repainting',
    status: 'Available',
    priority: 'Medium',
    teamLead: 'Dinesh Sawant',
    teamSize: 5,
    deploymentTime: 'Standby',
    expectedCompletion: 'Ready for Tasking',
    equipment: ['Thermoplastic Paint Applicator', 'Pavement Cutter'],
    recentActivity: 'Completed road levelling near Silver Park round-about',
    eta: 'Ward 1 Yard',
    locationMarker: { xPercent: 78, yPercent: 58 },
  },
  {
    id: 'WST-04',
    type: 'Waste Management',
    assignedWard: 'Ward 2',
    currentTask: 'Commercial market container collection',
    status: 'Deployed',
    priority: 'High',
    teamLead: 'Kishore More',
    teamSize: 6,
    deploymentTime: '08:00 AM',
    expectedCompletion: '01:30 PM',
    equipment: ['Hook-lift Container Truck #05', 'Bin Washing Rig'],
    recentActivity: 'Serviced 14 bulk bins across fish market corridor',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 36, yPercent: 40 },
  },
  {
    id: 'WTR-03',
    type: 'Water Supply',
    assignedWard: 'Ward 4',
    currentTask: 'Low water pressure telemetry inspection',
    status: 'Maintenance',
    priority: 'Low',
    teamLead: 'Pravin Rane',
    teamSize: 3,
    deploymentTime: 'Inspection Workshop',
    expectedCompletion: 'Tomorrow 09:00 AM',
    equipment: ['Acoustic Leak Detector', 'Ultrasonic Flowmeter'],
    recentActivity: 'Diagnostic calibration of flow sensors',
    eta: 'Workshop',
    locationMarker: { xPercent: 46, yPercent: 56 },
  },
  {
    id: 'DRN-02',
    type: 'Drainage',
    assignedWard: 'Ward 5',
    currentTask: 'Stormwater culvert pre-monsoon desilting',
    status: 'Available',
    priority: 'High',
    teamLead: 'Deepak Kamble',
    teamSize: 5,
    deploymentTime: 'Standby at Sub-office',
    expectedCompletion: 'Ready for Tasking',
    equipment: ['Sludge Pump 15HP', 'Safety Tripod Harness'],
    recentActivity: 'Cleared 250 meters of main drainage line at Uttan road',
    eta: 'Sub-office Yard',
    locationMarker: { xPercent: 24, yPercent: 68 },
  },
  {
    id: 'GFT-01',
    type: 'General Field Team',
    assignedWard: 'Ward 1',
    currentTask: 'Encroachment & footpath survey',
    status: 'Deployed',
    priority: 'Low',
    teamLead: 'Sachin Tambe',
    teamSize: 4,
    deploymentTime: '09:30 AM',
    expectedCompletion: '02:00 PM',
    equipment: ['GIS Tablet #03', 'Distance Measuring Wheel'],
    recentActivity: 'Surveyed 1.8km stretch along railway station perimeter',
    eta: 'Active On-Site',
    locationMarker: { xPercent: 82, yPercent: 62 },
  },
  {
    id: 'GFT-03',
    type: 'General Field Team',
    assignedWard: 'Ward 3',
    currentTask: 'Municipal garden tree-trimming & fence check',
    status: 'Available',
    priority: 'Medium',
    teamLead: 'Arun Naik',
    teamSize: 4,
    deploymentTime: 'Standby at Central Zone',
    expectedCompletion: 'Ready for Tasking',
    equipment: ['Pole Pruner Kit', 'Green Waste Shredder'],
    recentActivity: 'Completed boundary fence restoration at Shanti Park',
    eta: 'Central Zone Base',
    locationMarker: { xPercent: 60, yPercent: 42 },
  },
];

export const RESOURCE_UTILIZATION_INSIGHTS = [
  {
    id: 'ins-1',
    title: 'High Demand',
    detail: 'Road maintenance resources are operating at 67% utilisation across city corridors.',
    type: 'warning',
    icon: 'activity',
    badge: 'Demand Alert',
  },
  {
    id: 'ins-2',
    title: 'Resource Gap',
    detail: 'Ward 3 currently has the highest resource requirement with 74 open issues and 1 squad shortage.',
    type: 'danger',
    icon: 'alert-triangle',
    badge: 'Shortage Detected',
  },
  {
    id: 'ins-3',
    title: 'Maintenance',
    detail: '4 vehicles and equipment rigs are currently in central depot workshops for routine servicing.',
    type: 'neutral',
    icon: 'tool',
    badge: 'Depot Fleet',
  },
  {
    id: 'ins-4',
    title: 'Reallocation Opportunity',
    detail: '2 available teams in Ward 1 can be reassigned to high-priority Ward 3 road repair tickets.',
    type: 'success',
    icon: 'repeat',
    badge: 'Optimization',
  },
];

// ============================================================================
// SYSTEM ADMINISTRATION CONFIGURATION & AUDIT DATA
// ============================================================================

export interface SystemOverviewKPIs {
  uptime: string;
  uptimeSecondary: string;
  recordsProcessed: string;
  recordsSecondary: string;
  activeUsers: number;
  usersSecondary: string;
  securityHealth: string;
  securitySecondary: string;
}

export interface GeneralConfigState {
  municipality: string;
  timeZone: string;
  language: string;
  dateFormat: string;
  autoRefreshInterval: string;
}

export interface IssueManagementConfigState {
  autoAssignIssues: boolean;
  duplicateDetection: boolean;
  automaticEscalation: boolean;
  overdueThreshold: string;
  defaultPriority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface AIPrioritisationConfigState {
  enabled: boolean;
  factors: {
    severity: boolean;
    publicImpact: boolean;
    complaintFrequency: boolean;
    locationRisk: boolean;
    issueAge: boolean;
    historicalRecurrence: boolean;
  };
  weights: {
    severity: number;
    publicImpact: number;
    complaintFrequency: number;
    locationRisk: number;
    issueAge: number;
    historicalRecurrence: number;
  };
  recommendationMode: 'Human Review Required' | 'Assisted Recommendation' | 'Automatic Recommendation';
}

export interface NotificationSettingsState {
  newIssueNotifications: boolean;
  criticalIssueAlerts: boolean;
  overdueIssueAlerts: boolean;
  resolutionNotifications: boolean;
  systemAlerts: boolean;
}

export interface SecuritySettingsState {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  failedLoginProtection: boolean;
  auditLogging: boolean;
}

export interface DataBackupConfigState {
  lastBackupTime: string;
  lastBackupStatus: 'Successful' | 'Warning' | 'Failed';
  backupFrequency: string;
  dataRetention: string;
  automaticBackup: boolean;
}

export interface ServiceHealthItem {
  id: string;
  name: string;
  description: string;
  status: 'Operational' | 'Degraded' | 'Prototype' | 'Configuration Required';
}

export interface AuditLogItem {
  id: string;
  time: string;
  administrator: string;
  action: string;
  module: 'System Administration' | 'Ward Management' | 'City Analytics' | 'Resource Allocation' | 'Reports & Export';
  status: 'Success' | 'Warning' | 'Failed';
}

export const SYSTEM_OVERVIEW_KPIS: SystemOverviewKPIs = {
  uptime: '99.8%',
  uptimeSecondary: 'Last 30 days',
  recordsProcessed: '1.24M',
  recordsSecondary: 'Current database',
  activeUsers: 28,
  usersSecondary: 'Across 5 wards',
  securityHealth: '98%',
  securitySecondary: 'All major checks passed',
};

export const INITIAL_GENERAL_CONFIG: GeneralConfigState = {
  municipality: 'Mira-Bhayandar Municipal Corporation',
  timeZone: 'Asia/Kolkata (IST)',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  autoRefreshInterval: '30 seconds',
};

export const INITIAL_ISSUE_MANAGEMENT_CONFIG: IssueManagementConfigState = {
  autoAssignIssues: true,
  duplicateDetection: true,
  automaticEscalation: true,
  overdueThreshold: '48 hours',
  defaultPriority: 'Medium',
};

export const INITIAL_AI_PRIORITISATION_CONFIG: AIPrioritisationConfigState = {
  enabled: true,
  factors: {
    severity: true,
    publicImpact: true,
    complaintFrequency: true,
    locationRisk: true,
    issueAge: true,
    historicalRecurrence: true,
  },
  weights: {
    severity: 30,
    publicImpact: 25,
    complaintFrequency: 15,
    locationRisk: 15,
    issueAge: 10,
    historicalRecurrence: 5,
  },
  recommendationMode: 'Human Review Required',
};

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  newIssueNotifications: true,
  criticalIssueAlerts: true,
  overdueIssueAlerts: true,
  resolutionNotifications: true,
  systemAlerts: true,
};

export const INITIAL_SECURITY_SETTINGS: SecuritySettingsState = {
  twoFactorAuth: true,
  sessionTimeout: '30 minutes',
  passwordExpiry: '90 days',
  failedLoginProtection: true,
  auditLogging: true,
};

export const INITIAL_DATA_BACKUP_CONFIG: DataBackupConfigState = {
  lastBackupTime: 'Today, 02:00 AM',
  lastBackupStatus: 'Successful',
  backupFrequency: 'Daily',
  dataRetention: '365 days',
  automaticBackup: true,
};

export const SYSTEM_HEALTH_SERVICES: ServiceHealthItem[] = [
  {
    id: 'srv-api',
    name: 'API Server',
    description: 'Core application services',
    status: 'Operational',
  },
  {
    id: 'srv-db',
    name: 'Database',
    description: 'Data storage and management',
    status: 'Operational',
  },
  {
    id: 'srv-auth',
    name: 'Authentication Service',
    description: 'User login and access control',
    status: 'Operational',
  },
  {
    id: 'srv-notif',
    name: 'Notification Service',
    description: 'Alerts and user notifications',
    status: 'Operational',
  },
  {
    id: 'srv-map',
    name: 'Map Service',
    description: 'Location and map data',
    status: 'Operational',
  },
  {
    id: 'srv-ai',
    name: 'AI Recommendation Engine',
    description: 'Priority recommendation service',
    status: 'Prototype',
  },
];

export const SYSTEM_PERFORMANCE_METRICS = {
  cpuUsage: 42,
  memoryUsage: 61,
  databaseUsage: 38,
  apiResponseMs: 124,
};

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    time: '10:42 PM',
    administrator: 'Admin User',
    action: 'Updated AI priority weights',
    module: 'System Administration',
    status: 'Success',
  },
  {
    id: 'log-2',
    time: '09:18 PM',
    administrator: 'Admin User',
    action: 'Updated Ward 3 configuration',
    module: 'Ward Management',
    status: 'Success',
  },
  {
    id: 'log-3',
    time: '08:51 PM',
    administrator: 'Admin User',
    action: 'Exported analytics report',
    module: 'Reports & Export',
    status: 'Success',
  },
  {
    id: 'log-4',
    time: '07:35 PM',
    administrator: 'Admin User',
    action: 'Changed notification settings',
    module: 'System Administration',
    status: 'Success',
  },
  {
    id: 'log-5',
    time: '06:12 PM',
    administrator: 'Admin User',
    action: 'Reallocated Road Team R-03 to Ward 3',
    module: 'Resource Allocation',
    status: 'Success',
  },
  {
    id: 'log-6',
    time: '04:45 PM',
    administrator: 'Admin User',
    action: 'Approved high-priority ticket escalation',
    module: 'City Analytics',
    status: 'Success',
  },
  {
    id: 'log-7',
    time: '02:30 PM',
    administrator: 'Admin User',
    action: 'Automated database snapshot completed',
    module: 'System Administration',
    status: 'Success',
  },
];

/* ============================================================
   REPORTS & EXPORT — Data Layer
   ============================================================ */

export interface ReportTypeCard {
  id: string;
  title: string;
  icon: string; // icon key
  description: string;
  includes: string[];
}

export const REPORT_TYPES: ReportTypeCard[] = [
  {
    id: 'city-performance',
    title: 'City Performance Report',
    icon: 'chart',
    description: 'City-wide issue volume, resolution performance, overdue issues and trends.',
    includes: ['Total issues', 'Resolution rate', 'Average resolution time', 'Overdue issues', 'Category distribution', 'Monthly trends'],
  },
  {
    id: 'ward-performance',
    title: 'Ward Performance Report',
    icon: 'map',
    description: 'Compare civic issue performance across wards.',
    includes: ['Issues by ward', 'Resolution rate', 'Average resolution time', 'Critical issues', 'Resource gaps', 'Ward ranking'],
  },
  {
    id: 'issue-analysis',
    title: 'Issue Analysis Report',
    icon: 'alert',
    description: 'Analyse civic complaints by category, severity, location and status.',
    includes: ['Issue categories', 'Severity', 'Status', 'Location', 'Issue trends', 'Priority distribution'],
  },
  {
    id: 'resource-allocation',
    title: 'Resource Allocation Report',
    icon: 'briefcase',
    description: 'Review municipal resource utilisation and deployment across wards.',
    includes: ['Available resources', 'Deployed resources', 'Resource utilisation', 'Resource gaps', 'Ward demand', 'Reallocation activity'],
  },
  {
    id: 'ai-prioritisation',
    title: 'AI Prioritisation Report',
    icon: 'spark',
    description: 'Review AI-assisted priority recommendations and high-impact civic issues.',
    includes: ['Priority score', 'Severity', 'Public impact', 'Complaint frequency', 'Location risk', 'Recommended action'],
  },
  {
    id: 'system-activity',
    title: 'System Activity Report',
    icon: 'activity',
    description: 'Review administrative actions, system activity and operational events.',
    includes: ['Admin activity', 'User activity', 'Configuration changes', 'Resource allocation activity', 'Report generation', 'System events'],
  },
];

export interface ReportRecord {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedBy: string;
  date: string;
  format: 'PDF' | 'Excel' | 'CSV';
  status: 'Generated' | 'Scheduled' | 'Processing' | 'Failed';
}

export const RECENT_REPORTS: ReportRecord[] = [
  {
    id: 'report-001',
    name: 'December City Performance',
    type: 'City Performance',
    period: '01 Dec – 31 Dec 2024',
    generatedBy: 'Admin User',
    date: '31 Dec 2024',
    format: 'PDF',
    status: 'Generated',
  },
  {
    id: 'report-002',
    name: 'Ward Performance — December',
    type: 'Ward Performance',
    period: '01 Dec – 31 Dec 2024',
    generatedBy: 'Admin User',
    date: '31 Dec 2024',
    format: 'Excel',
    status: 'Generated',
  },
  {
    id: 'report-003',
    name: 'Resource Allocation Summary',
    type: 'Resource Allocation',
    period: '01 Dec – 31 Dec 2024',
    generatedBy: 'Admin User',
    date: '30 Dec 2024',
    format: 'PDF',
    status: 'Generated',
  },
  {
    id: 'report-004',
    name: 'Issue Analysis Report',
    type: 'Issue Analysis',
    period: '01 Dec – 31 Dec 2024',
    generatedBy: 'Admin User',
    date: '29 Dec 2024',
    format: 'CSV',
    status: 'Generated',
  },
];

export interface ScheduledReport {
  id: string;
  reportName: string;
  frequency: string;
  nextRun: string;
  recipient: string;
  status: 'Active' | 'Paused';
}

export const SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: 'sched-001',
    reportName: 'Weekly Ward Performance',
    frequency: 'Every Monday',
    nextRun: 'Mon, 09:00 AM',
    recipient: 'Admin User',
    status: 'Active',
  },
  {
    id: 'sched-002',
    reportName: 'Monthly City Performance',
    frequency: '1st of every month',
    nextRun: '01 Jan, 09:00 AM',
    recipient: 'Admin User',
    status: 'Active',
  },
  {
    id: 'sched-003',
    reportName: 'Resource Allocation Summary',
    frequency: 'Every Friday',
    nextRun: 'Fri, 09:00 AM',
    recipient: 'Admin User',
    status: 'Active',
  },
];

export interface ReportingKPIs {
  totalIssues: number;
  totalIssuesSub: string;
  resolvedIssues: number;
  resolvedSub: string;
  overdueIssues: number;
  overdueSub: string;
  reportsGenerated: number;
  reportsSub: string;
}

export const REPORTS_KPIS: ReportingKPIs = {
  totalIssues: 1248,
  totalIssuesSub: 'Selected period',
  resolvedIssues: 892,
  resolvedSub: '72% resolution rate',
  overdueIssues: 144,
  overdueSub: '12% of total',
  reportsGenerated: 18,
  reportsSub: 'This month',
};

export interface ReportingActivity {
  total: number;
  pdf: number;
  excel: number;
  csv: number;
  mostGenerated: string;
  mostActivePeriod: string;
}

export const REPORTING_ACTIVITY: ReportingActivity = {
  total: 18,
  pdf: 9,
  excel: 6,
  csv: 3,
  mostGenerated: 'City Performance',
  mostActivePeriod: 'December 2024',
};

export const EXPORT_HISTORY_DATA = [
  { week: '1 Dec', count: 3 },
  { week: '5 Dec', count: 5 },
  { week: '10 Dec', count: 2 },
  { week: '15 Dec', count: 7 },
  { week: '20 Dec', count: 4 },
  { week: '25 Dec', count: 6 },
  { week: '31 Dec', count: 3 },
];

export const REPORT_PREVIEW_WARD_DATA = [
  { ward: 'Ward A', reports: 180, resolved: 148, rate: '79%' },
  { ward: 'Ward B', reports: 176, resolved: 128, rate: '73%' },
  { ward: 'Ward C', reports: 160, resolved: 116, rate: '72%' },
  { ward: 'Ward D', reports: 152, resolved: 104, rate: '68%' },
  { ward: 'Ward E', reports: 144, resolved: 96, rate: '67%' },
];

export const REPORT_PREVIEW_CATEGORY_DATA = [
  { name: 'Roads', value: 312, pct: '25%', color: '#14b8a6' },
  { name: 'Waste', value: 280, pct: '22%', color: '#f59e0b' },
  { name: 'Streetlights', value: 224, pct: '18%', color: '#3b82f6' },
  { name: 'Drainage', value: 168, pct: '13%', color: '#8b5cf6' },
  { name: 'Water Supply', value: 152, pct: '12%', color: '#06b6d4' },
  { name: 'Other', value: 112, pct: '10%', color: '#64748b' },
];

export const CUSTOM_REPORT_METRICS = [
  'Total Issues',
  'Resolved Issues',
  'Pending Issues',
  'Overdue Issues',
  'Resolution Rate',
  'Average Resolution Time',
  'Priority Distribution',
  'Resource Utilisation',
  'Ward Performance',
  'Issue Trends',
];

/* ============================================================
   SETTINGS — Data Layer & Configuration State
   ============================================================ */

export interface ConnectedIntegrationItem {
  id: string;
  name: string;
  service: string;
  status: 'Connected' | 'Configured' | 'Not Configured';
  maskedKey: string;
}

export interface IssueCategorySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AdminSessionItem {
  id: string;
  user: string;
  device: string;
  location: string;
  status: string;
  isCurrent: boolean;
}

export interface CivicPulseSettingsState {
  // General
  platformName: string;
  platformDescription: string;
  municipality: string;
  defaultWard: string;
  defaultDashboard: string;
  timeZone: string;
  language: string;
  dateFormat: string;
  autoRefreshInterval: string;

  // Notifications
  newIssueNotifications: boolean;
  criticalIssueAlerts: boolean;
  overdueIssueAlerts: boolean;
  resolutionNotifications: boolean;
  systemAlerts: boolean;
  resourceShortageAlerts: boolean;
  weeklySummary: boolean;

  // Issue & Workflow
  autoAssignIssues: boolean;
  duplicateDetection: boolean;
  automaticEscalation: boolean;
  overdueThreshold: string;
  defaultPriority: 'Critical' | 'High' | 'Medium' | 'Low';
  requireLocation: boolean;
  requirePhoto: boolean;
  defaultSla: string;
  escalationThreshold: string;

  // Localization & Accessibility
  langEnglish: boolean;
  langMarathi: boolean;
  langHindi: boolean;
  highContrastMode: boolean;
  largerText: boolean;
  reduceMotion: boolean;
  keyboardNavigation: boolean;
  currency: string;
  firstDayOfWeek: string;

  // Data & Privacy
  dataRetentionPeriod: string;
  auditLogRetention: string;
  allowDataExport: boolean;
  anonymiseCitizenData: boolean;
  automaticBackup: boolean;

  // System Preferences
  showWardBoundaries: boolean;
  enableAIRecommendations: boolean;
  enableBetaFeatures: boolean;
  defaultAnalyticsPeriod: string;
  showCriticalAlerts: boolean;
  showResourceWarnings: boolean;

  // Security
  sessionTimeout: string;
  requireReauth: boolean;
  twoFactorAuth: boolean;
  loginAttemptProtection: boolean;
  auditLogging: boolean;

  // Advanced
  apiMode: 'Development' | 'Staging' | 'Production';
  debugMode: boolean;
  detailedErrorLogging: boolean;
  performanceMonitoring: boolean;
  maintenanceMode: boolean;
}

export const INITIAL_SETTINGS_STATE: CivicPulseSettingsState = {
  platformName: 'CivicPulse',
  platformDescription: 'Smart city civic issue management and municipal resource coordination platform.',
  municipality: 'Mira-Bhayandar Municipal Corporation',
  defaultWard: 'All Wards',
  defaultDashboard: 'Admin Dashboard',
  timeZone: 'Asia/Kolkata (IST)',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  autoRefreshInterval: '30 seconds',

  newIssueNotifications: true,
  criticalIssueAlerts: true,
  overdueIssueAlerts: true,
  resolutionNotifications: true,
  systemAlerts: true,
  resourceShortageAlerts: true,
  weeklySummary: false,

  autoAssignIssues: true,
  duplicateDetection: true,
  automaticEscalation: true,
  overdueThreshold: '48 hours',
  defaultPriority: 'Medium',
  requireLocation: true,
  requirePhoto: false,
  defaultSla: '48 hours',
  escalationThreshold: '90%',

  langEnglish: true,
  langMarathi: true,
  langHindi: true,
  highContrastMode: false,
  largerText: false,
  reduceMotion: false,
  keyboardNavigation: true,
  currency: 'INR (₹)',
  firstDayOfWeek: 'Monday',

  dataRetentionPeriod: '365 days',
  auditLogRetention: '3 years',
  allowDataExport: true,
  anonymiseCitizenData: false,
  automaticBackup: true,

  showWardBoundaries: true,
  enableAIRecommendations: true,
  enableBetaFeatures: false,
  defaultAnalyticsPeriod: 'Last 30 Days',
  showCriticalAlerts: true,
  showResourceWarnings: true,

  sessionTimeout: '1 hour',
  requireReauth: true,
  twoFactorAuth: false,
  loginAttemptProtection: true,
  auditLogging: true,

  apiMode: 'Development',
  debugMode: false,
  detailedErrorLogging: true,
  performanceMonitoring: true,
  maintenanceMode: false,
};

export const INITIAL_INTEGRATIONS_LIST: ConnectedIntegrationItem[] = [
  {
    id: 'int-map',
    name: 'Map Service (e.g. Google Maps)',
    service: 'OpenStreetMap / Map Provider',
    status: 'Connected',
    maskedKey: 'pk.eyJ1IjoibWlyYWJoYXlhbmRhciIsImEiOi••••••••••••',
  },
  {
    id: 'int-email',
    name: 'Email Service',
    service: 'Municipal SMTP Relay',
    status: 'Connected',
    maskedKey: 'smtp://svc-civicpulse:••••••••••••@mail.mbmc.gov.in:587',
  },
  {
    id: 'int-sms',
    name: 'SMS Service',
    service: 'Gov SMS Gateway',
    status: 'Not Configured',
    maskedKey: '••••••••••••',
  },
  {
    id: 'int-push',
    name: 'Push Notifications',
    service: 'Web Push Service',
    status: 'Not Configured',
    maskedKey: '••••••••••••',
  },
];

export const INITIAL_ISSUE_CATEGORIES: IssueCategorySetting[] = [
  { id: 'cat-roads', name: 'Roads', description: 'Potholes, road damage, tar repair', enabled: true },
  { id: 'cat-waste', name: 'Waste Management', description: 'Overflowing bins, garbage collection', enabled: true },
  { id: 'cat-streetlights', name: 'Streetlights', description: 'Non-working pole lamps, electrical lines', enabled: true },
  { id: 'cat-drainage', name: 'Drainage', description: 'Blocked storm drains, sewage overflow', enabled: true },
  { id: 'cat-water', name: 'Water Supply', description: 'Pipeline leakages, low pressure supply', enabled: true },
  { id: 'cat-traffic', name: 'Traffic', description: 'Signals, congestion bottlenecks, illegal parking', enabled: true },
  { id: 'cat-other', name: 'Other', description: 'General civic complaints', enabled: true },
];

export const INITIAL_ADMIN_SESSIONS: AdminSessionItem[] = [
  {
    id: 'sess-1',
    user: 'Admin User (Super Admin)',
    device: 'Windows / Chrome 128',
    location: 'Maharashtra, India',
    status: 'Current Session',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    user: 'Admin User (Super Admin)',
    device: 'Android / Chrome Mobile',
    location: 'Mumbai, India',
    status: 'Active 2h ago',
    isCurrent: false,
  },
];

/* ============================================================
   HELP & SUPPORT — Data Layer
   ============================================================ */

export interface SupportKPIs {
  supportAvailability: string;
  supportAvailabilitySub: string;
  openTickets: number;
  openTicketsSub: string;
  resolvedTickets: number;
  resolvedTicketsSub: string;
  systemAvailability: string;
  systemAvailabilitySub: string;
}

export const SUPPORT_KPIS: SupportKPIs = {
  supportAvailability: '24/7',
  supportAvailabilitySub: 'Administrative support centre',
  openTickets: 3,
  openTicketsSub: 'Requires attention',
  resolvedTickets: 12,
  resolvedTicketsSub: 'This month',
  systemAvailability: '99.9%',
  systemAvailabilitySub: 'Demo Status',
};

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I assign an issue to a ward?',
    answer: 'Open All Issues & City Map, select the issue, review its location and assign it to the appropriate ward or responsible team.',
    category: 'Issues',
  },
  {
    id: 'faq-2',
    question: 'How do I generate a city report?',
    answer: 'Open Reports & Export, select the required report type and filters, configure the report and generate the report preview.',
    category: 'Reports',
  },
  {
    id: 'faq-3',
    question: 'How do I change administrator settings?',
    answer: 'Open Settings from the Admin Portal sidebar and update the required configuration.',
    category: 'Settings',
  },
  {
    id: 'faq-4',
    question: 'How do I manage users and wards?',
    answer: 'Open Ward & User Management to manage ward information, users, roles and administrative assignments.',
    category: 'Ward Management',
  },
  {
    id: 'faq-5',
    question: 'How do I view critical civic issues?',
    answer: 'Use All Issues & City Map or City Analytics and filter issues according to priority and status.',
    category: 'City Analytics',
  },
  {
    id: 'faq-6',
    question: 'What should I do if the system is not responding?',
    answer: 'Check System Status first. If the problem continues, create a support ticket with the affected module and a description of the issue.',
    category: 'Dashboard',
  },
];

export interface DocumentationGuide {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: string;
}

export const DOCUMENTATION_GUIDES: DocumentationGuide[] = [
  {
    id: 'doc-getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of the Admin Portal.',
    icon: 'rocket',
    content: 'Welcome to CivicPulse. The Super Admin Portal gives you end-to-end command of municipal operations, GIS mapping, field resource deployment, and issue resolution lifecycles.',
  },
  {
    id: 'doc-issue-mgmt',
    title: 'Issue Management',
    description: 'Review and manage civic issues.',
    icon: 'flag',
    content: 'Review incoming citizen reports, detect duplicates, assign issues to designated wards, and monitor resolution SLA timers.',
  },
  {
    id: 'doc-city-analytics',
    title: 'City Analytics',
    description: 'Interpret trends and insights.',
    icon: 'chart',
    content: 'Understand citywide issue volume trends, category breakdown, ward resolution velocity, and AI-assisted prioritization scores.',
  },
  {
    id: 'doc-resource-alloc',
    title: 'Resource Allocation',
    description: 'Monitor and allocate resources.',
    icon: 'layers',
    content: 'Deploy specialized field crews (Roads, Waste, Water, Electrical), track vehicle utilization, and manage inter-ward resource rebalancing.',
  },
  {
    id: 'doc-reports-export',
    title: 'Reports & Export',
    description: 'Generate and export administrative reports.',
    icon: 'document',
    content: 'Compile comprehensive administrative reports in PDF, Excel, and CSV formats. Schedule automated weekly or monthly summaries.',
  },
  {
    id: 'doc-system-admin',
    title: 'System Administration',
    description: 'Configure system-level settings and controls.',
    icon: 'gear',
    content: 'Manage municipality metadata, database backup schedules, notification rules, security policies, and application audit trails.',
  },
];

export interface SupportTicketActivityItem {
  date: string;
  author: string;
  note: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  module: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  description: string;
  activity: SupportTicketActivityItem[];
}

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'CIV-001',
    subject: 'Unable to export report',
    module: 'Reports & Export',
    priority: 'High',
    status: 'In Progress',
    createdAt: '17 Nov 2026',
    updatedAt: '17 Nov 2026',
    description: 'The report preview is generated correctly, but the export action does not complete.',
    activity: [
      { date: '17 Nov 2026, 09:30 AM', author: 'Admin User', note: 'Ticket created.' },
      { date: '17 Nov 2026, 10:15 AM', author: 'Support Team', note: 'Ticket acknowledged.' },
      { date: '17 Nov 2026, 11:00 AM', author: 'Support Team', note: 'Issue is currently being investigated by backend engineering.' },
    ],
  },
  {
    id: 'CIV-002',
    subject: 'Ward assignment not updating',
    module: 'Ward & User Management',
    priority: 'Medium',
    status: 'Open',
    createdAt: '16 Nov 2026',
    updatedAt: '16 Nov 2026',
    description: 'Field officer reassignment for Ward 3 takes multiple attempts before updating in the roster.',
    activity: [
      { date: '16 Nov 2026, 04:20 PM', author: 'Admin User', note: 'Ticket created.' },
      { date: '16 Nov 2026, 05:00 PM', author: 'Support Team', note: 'Assigned to Municipal Data Team.' },
    ],
  },
  {
    id: 'CIV-003',
    subject: 'Analytics chart loading issue',
    module: 'City Analytics',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '14 Nov 2026',
    updatedAt: '15 Nov 2026',
    description: 'Trend graph showed minor visual latency when switching between 7-day and 30-day filters.',
    activity: [
      { date: '14 Nov 2026, 02:10 PM', author: 'Admin User', note: 'Ticket created.' },
      { date: '15 Nov 2026, 11:45 AM', author: 'Support Team', note: 'Client cache optimization applied. Resolution verified.' },
    ],
  },
];

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'Operational' | 'Prototype' | 'Not Configured';
}

export const SYSTEM_SERVICES_STATUS: SystemServiceStatus[] = [
  { id: 'app', name: 'CivicPulse Web Application', status: 'Operational' },
  { id: 'api', name: 'API Services', status: 'Operational' },
  { id: 'db', name: 'Database', status: 'Operational' },
  { id: 'auth', name: 'Authentication', status: 'Prototype' },
  { id: 'map', name: 'Map Services', status: 'Operational' },
  { id: 'report', name: 'Report Services', status: 'Operational' },
];

export interface SupportResourceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SUPPORT_RESOURCES_LIST: SupportResourceItem[] = [
  { id: 'res-guide', title: 'User Guide', description: 'Step-by-step instructions for administrators.', icon: 'book' },
  { id: 'res-trouble', title: 'Troubleshooting', description: 'Common problems and solutions.', icon: 'wrench' },
  { id: 'res-notes', title: 'Release Notes', description: 'Recent changes and improvements.', icon: 'file' },
  { id: 'res-security', title: 'Security Guidelines', description: 'Best practices for secure administration.', icon: 'shield' },
];
