/**
 * CivicPulse — Ward Staff Operations & Issue Assignment Service
 *
 * Scoped to authorized Ward Staff (Ward 3: Sandeep Jadhav).
 * Provides live querying, status updating, priority distributions,
 * interactive map pin datasets, detailed tabs, and persistent storage synchronization.
 */

export type StaffIssuePriority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Others';
export type StaffIssueStatus =
  | 'New'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Materials'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'
  | 'Overdue';

export type StaffSLAStatus = 'On Track' | 'Due Soon' | 'Overdue' | 'SLA Met';

export interface ResolutionEvidence {
  note: string;
  resolvedAt: string;
  resolvedBy: string;
  beforePhoto?: string;
  afterPhoto?: string;
}

export type StaffIssueCategory =
  | 'roads'
  | 'streetlights'
  | 'waste'
  | 'water'
  | 'drainage'
  | 'parks'
  | 'transport'
  | 'other';

export interface StaffIssueUpdate {
  id: string;
  title: string;
  timestamp: string;
  actor: string;
  type: 'created' | 'assigned' | 'status' | 'note' | 'survey' | 'work_order';
  notes?: string;
}

export interface StaffCitizenDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  totalReports: number;
}

export interface StaffIssue {
  id: string; // e.g. CP-10421
  ticketId: string;
  title: string;
  category: StaffIssueCategory;
  location: string;
  priority: StaffIssuePriority;
  status: StaffIssueStatus;
  slaStatus?: StaffSLAStatus;
  slaText?: string;
  completionPercentage?: number;
  resolutionEvidence?: ResolutionEvidence;
  assignedDate: string;
  assignedDateFull?: string;
  reportedDate?: string;
  timeAgo: string;
  imageUrl: string;
  photos?: string[];
  assignedWard: string;
  assignedTo: string;
  assignedTeam?: string;
  lat: number;
  lng: number;
  mapTop: number; // percentage from top of map container
  mapLeft: number; // percentage from left of map container
  description: string;
  citizenName?: string;
  citizenDetails?: StaffCitizenDetails;
  updates?: StaffIssueUpdate[];
  notes?: string[];
}

export interface StaffProfile {
  id: string;
  name: string;
  role: string;
  ward: string;
  city: string;
  department: string;
  team: string;
  email: string;
  phone: string;
  supervisor: string;
  avatarInitials: string;
  jurisdiction: string[];
}

export interface FieldTeam {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  department: string;
  lead: string;
  members: string[];
  phone: string;
  status: 'Available' | 'Dispatched' | 'On Site' | 'Working' | 'Offline';
  taskCount: number;
  currentAssignment?: string;
  currentIssueId?: string;
  location: string;
  lat: number;
  lng: number;
  mapTop: number;
  mapLeft: number;
  workload: 'Normal' | 'High' | 'Low';
  iconStyle: string;
}

export interface StaffNotification {
  id: string;
  type: 'dispatch' | 'sla' | 'status' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: string;
  issueId?: string;
}

export interface StaffResource {
  id: string;
  name: string;
  category: 'Vehicles' | 'Equipment' | 'Tools' | 'Personnel';
  status: 'Available' | 'Allocated' | 'In Use' | 'Maintenance';
  assignedTeam?: string;
  quantity: number;
}

export interface StaffActivity {
  id: string;
  type: 'assigned' | 'visit' | 'status' | 'photo';
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface WardStaffKPI {
  assignedIssues: number;
  newIssues: number;
  inProgress: number;
  inProgressPercent: number;
  overdue: number;
  resolvedThisMonth: number;
  resolvedGrowth: number;
  avgResolutionDays: number;
  fieldTeamCount: number;
  assignedWard: string;
}

export interface PriorityDistributionItem {
  priority: StaffIssuePriority;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Universal SLA calculator for Ward Staff issues
 */
export function getIssueSLA(issue: StaffIssue): {
  status: StaffSLAStatus;
  text: string;
  color: string;
  badgeClass: string;
} {
  if (issue.slaStatus && issue.slaText) {
    let color = '#22c55e';
    let badgeClass = 'slaOnTrack';
    if (issue.slaStatus === 'Overdue') {
      color = '#ef4444';
      badgeClass = 'slaOverdue';
    } else if (issue.slaStatus === 'Due Soon') {
      color = '#f59e0b';
      badgeClass = 'slaDueSoon';
    } else if (issue.slaStatus === 'SLA Met') {
      color = '#38bdf8';
      badgeClass = 'slaMet';
    }
    return { status: issue.slaStatus, text: issue.slaText, color, badgeClass };
  }

  if (issue.status === 'Resolved' || issue.status === 'Closed') {
    return { status: 'SLA Met', text: 'Resolved within SLA', color: '#38bdf8', badgeClass: 'slaMet' };
  }
  if (issue.status === 'Overdue') {
    return { status: 'Overdue', text: 'Overdue by 6 hours', color: '#ef4444', badgeClass: 'slaOverdue' };
  }
  if (issue.priority === 'Critical') {
    return { status: 'Due Soon', text: 'Critical - Due in 2 hours', color: '#ef4444', badgeClass: 'slaDueSoon' };
  }
  if (issue.priority === 'High') {
    return { status: 'Due Soon', text: 'Due in 4 hours', color: '#f59e0b', badgeClass: 'slaDueSoon' };
  }
  return { status: 'On Track', text: 'On Track - 18h left', color: '#22c55e', badgeClass: 'slaOnTrack' };
}

const WARD_STAFF_STORAGE_KEY = 'civicpulse_ward_staff_issues';

// Initial pre-seeded 24 assigned issues for Ward 3 strictly matching the approved reference design
export const INITIAL_STAFF_ISSUES: StaffIssue[] = [
  // ── Page 1: Items 1 to 8 (Matching Reference Design) ──
  {
    id: 'CP-10421',
    ticketId: '#CP-10421',
    title: 'Pothole on Station Road',
    category: 'roads',
    location: 'Station Road, Mira Road (E)',
    priority: 'High',
    status: 'New',
    assignedDate: '08 Dec 2024',
    assignedDateFull: '08 Dec 2024, 10:30 AM',
    reportedDate: '08 Dec 2024, 10:30 AM',
    timeAgo: '2 hours ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: [
      '/images/dashboard/thumb-pothole@2x.jpg',
      '/images/dashboard/thumb-pothole.jpg',
      '/images/dashboard/thumb-pothole@2x.jpg',
    ],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Road Maintenance',
    lat: 19.2812,
    lng: 72.8685,
    mapTop: 48,
    mapLeft: 38,
    description:
      'Large pothole on Station Road causing traffic disruption. The pothole is filled with water and is creating problems for two-wheelers and cars, especially during night time.',
    citizenName: 'Rohan Mehta',
    citizenDetails: {
      name: 'Rohan Mehta',
      phone: '+91 98201 44921',
      email: 'rohan.mehta@example.com',
      address: 'Station Road, Mira Road (E), Mira Bhayandar, 401107',
      totalReports: 4,
    },
    updates: [
      {
        id: 'u-1',
        title: 'Report Created & Submitted',
        timestamp: '08 Dec 2024, 10:30 AM',
        actor: 'Citizen Portal (Rohan Mehta)',
        type: 'created',
        notes: 'Citizen submitted high-severity pothole report with 3 photos.',
      },
      {
        id: 'u-2',
        title: 'Issue Assigned to Ward 3 Staff',
        timestamp: '08 Dec 2024, 10:32 AM',
        actor: 'System Geofence Dispatcher',
        type: 'assigned',
        notes: 'Automated municipal ticket assignment to Sandeep Jadhav.',
      },
      {
        id: 'u-3',
        title: 'Field Team Notification Sent',
        timestamp: '08 Dec 2024, 11:15 AM',
        actor: 'Sandeep Jadhav (Ward Staff)',
        type: 'survey',
        notes: 'Notified Ward 3 Road Maintenance quick-response patch unit.',
      },
      {
        id: 'u-4',
        title: 'Initial Site Survey & Safety Barricading',
        timestamp: '08 Dec 2024, 11:45 AM',
        actor: 'Ramesh Patil (Field Tech)',
        type: 'note',
        notes: 'High visibility barricades placed around depression. Surface drying needed.',
      },
    ],
    notes: [
      'Cold asphalt repair mix scheduled for delivery by 2:30 PM.',
      'Police traffic control informed for partial single-lane diversion.',
    ],
  },
  {
    id: 'CP-10418',
    ticketId: '#CP-10418',
    title: 'Streetlight not working',
    category: 'streetlights',
    location: 'Shanti Nagar, Sector 4',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '08 Dec 2024',
    assignedDateFull: '08 Dec 2024, 07:15 AM',
    reportedDate: '08 Dec 2024, 07:15 AM',
    timeAgo: '5 hours ago',
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    photos: [
      '/images/dashboard/thumb-streetlight@2x.jpg',
      '/images/dashboard/thumb-streetlight.jpg',
    ],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Electrical Squad',
    lat: 19.2884,
    lng: 72.8631,
    mapTop: 38,
    mapLeft: 64,
    description:
      'Underground wiring short circuit near transformer pole #4. Two consecutive street lamps are dead causing dark spot.',
    citizenName: 'Mahesh Shah',
    citizenDetails: {
      name: 'Mahesh Shah',
      phone: '+91 98332 10842',
      email: 'mahesh.shah@gmail.com',
      address: 'Flat 302, Gokul Heights, Shanti Nagar, Sector 4',
      totalReports: 2,
    },
    updates: [
      {
        id: 'u-21',
        title: 'Report Submitted',
        timestamp: '08 Dec 2024, 07:15 AM',
        actor: 'Mahesh Shah',
        type: 'created',
      },
      {
        id: 'u-22',
        title: 'Assigned to Ward 3',
        timestamp: '08 Dec 2024, 07:30 AM',
        actor: 'Dispatcher',
        type: 'assigned',
      },
      {
        id: 'u-23',
        title: 'Electrician Team Dispatched',
        timestamp: '08 Dec 2024, 09:00 AM',
        actor: 'Sandeep Jadhav',
        type: 'status',
        notes: 'Inspection bucket truck en route to Sector 4 junction.',
      },
    ],
    notes: ['Replacement LED fixture requisitioned from MBMC central electrical store.'],
  },
  {
    id: 'CP-10417',
    ticketId: '#CP-10417',
    title: 'Garbage overflow',
    category: 'waste',
    location: 'Kanakia Road, Mira Road (E)',
    priority: 'High',
    status: 'In Progress',
    assignedDate: '07 Dec 2024',
    assignedDateFull: '07 Dec 2024, 02:45 PM',
    reportedDate: '07 Dec 2024, 02:45 PM',
    timeAgo: '1 day ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    photos: [
      '/images/dashboard/thumb-garbage@2x.jpg',
      '/images/dashboard/thumb-garbage.jpg',
    ],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Sanitation Dept',
    lat: 19.2812,
    lng: 72.8685,
    mapTop: 44,
    mapLeft: 48,
    description:
      'Dumpster clearance underway. Heavy debris and organic waste overflowing onto footpath near commercial plaza.',
    citizenName: 'Priya Nair',
    citizenDetails: {
      name: 'Priya Nair',
      phone: '+91 97690 55123',
      email: 'priya.nair@hotmail.com',
      address: 'Shop 12, Kanakia Commercial Complex, Mira Road (E)',
      totalReports: 6,
    },
    updates: [
      {
        id: 'u-31',
        title: 'Report Submitted',
        timestamp: '07 Dec 2024, 02:45 PM',
        actor: 'Priya Nair',
        type: 'created',
      },
      {
        id: 'u-32',
        title: 'Compactor Truck Scheduled',
        timestamp: '07 Dec 2024, 04:30 PM',
        actor: 'Sandeep Jadhav',
        type: 'status',
        notes: 'Sanitary Inspector coordinated additional compactor vehicle.',
      },
    ],
    notes: ['Sanitization powder will be sprayed post clearance.'],
  },
  {
    id: 'CP-10415',
    ticketId: '#CP-10415',
    title: 'Water leakage',
    category: 'water',
    location: 'Bhayandar West',
    priority: 'Low',
    status: 'New',
    assignedDate: '07 Dec 2024',
    assignedDateFull: '07 Dec 2024, 11:20 AM',
    reportedDate: '07 Dec 2024, 11:20 AM',
    timeAgo: '1 day ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    photos: ['/images/dashboard/thumb-garbage.jpg'],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Water Supply Dept',
    lat: 19.2952,
    lng: 72.8544,
    mapTop: 58,
    mapLeft: 24,
    description:
      'Minor valve leakage near residential pipeline connection at ground level. Clean potable water dripping slowly.',
    citizenName: 'Pooja Kulkarni',
    citizenDetails: {
      name: 'Pooja Kulkarni',
      phone: '+91 98190 22345',
      email: 'pooja.kulkarni@yahoo.com',
      address: 'B-14, Om Shanti Society, Bhayandar West',
      totalReports: 1,
    },
    updates: [
      {
        id: 'u-41',
        title: 'Citizen Report Logged',
        timestamp: '07 Dec 2024, 11:20 AM',
        actor: 'Pooja Kulkarni',
        type: 'created',
      },
    ],
    notes: ['Plumbing supervisor assigned for morning rounds.'],
  },
  {
    id: 'CP-10410',
    ticketId: '#CP-10410',
    title: 'Broken footpath',
    category: 'roads',
    location: 'Maxus Mall Road, Bhayandar',
    priority: 'Medium',
    status: 'New',
    assignedDate: '06 Dec 2024',
    assignedDateFull: '06 Dec 2024, 04:00 PM',
    reportedDate: '06 Dec 2024, 04:00 PM',
    timeAgo: '2 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Road Maintenance',
    lat: 19.2995,
    lng: 72.8505,
    mapTop: 32,
    mapLeft: 30,
    description:
      'Paver blocks dismantled and uneven on walking path opposite Maxus Mall main gate, posing trip hazard to senior citizens.',
    citizenName: 'Deepak Joshi',
    citizenDetails: {
      name: 'Deepak Joshi',
      phone: '+91 99200 88712',
      email: 'deepak.joshi@gmail.com',
      address: '104, Sunrise Enclave, Bhayandar West',
      totalReports: 3,
    },
    updates: [
      {
        id: 'u-51',
        title: 'Report Registered',
        timestamp: '06 Dec 2024, 04:00 PM',
        actor: 'Deepak Joshi',
        type: 'created',
      },
    ],
  },
  {
    id: 'CP-10408',
    ticketId: '#CP-10408',
    title: 'Garbage near school',
    category: 'waste',
    location: 'Saint Joseph School, Mira Road',
    priority: 'Low',
    status: 'Resolved',
    assignedDate: '05 Dec 2024',
    assignedDateFull: '05 Dec 2024, 08:30 AM',
    reportedDate: '05 Dec 2024, 08:30 AM',
    timeAgo: '3 days ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    photos: ['/images/dashboard/thumb-garbage.jpg'],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Sanitation Dept',
    lat: 19.2865,
    lng: 72.8615,
    mapTop: 52,
    mapLeft: 56,
    description:
      'Litter accumulated outside school boundary wall cleared by morning sanitation sweepers.',
    citizenName: 'Sister Maria',
    citizenDetails: {
      name: 'Sister Maria',
      phone: '+91 98205 11223',
      email: 'stjoseph.mira@schools.org',
      address: 'Saint Joseph Convent High School, Mira Road (E)',
      totalReports: 5,
    },
    updates: [
      {
        id: 'u-61',
        title: 'Report Logged',
        timestamp: '05 Dec 2024, 08:30 AM',
        actor: 'Sister Maria',
        type: 'created',
      },
      {
        id: 'u-62',
        title: 'Cleared and Resolved',
        timestamp: '05 Dec 2024, 11:00 AM',
        actor: 'Sandeep Jadhav',
        type: 'status',
        notes: 'Area cleared and secondary dustbin installed.',
      },
    ],
  },
  {
    id: 'CP-10405',
    ticketId: '#CP-10405',
    title: 'Waterlogging during rains',
    category: 'drainage',
    location: 'Kashimira, Mira Bhayandar',
    priority: 'High',
    status: 'In Progress',
    assignedDate: '04 Dec 2024',
    assignedDateFull: '04 Dec 2024, 09:15 AM',
    reportedDate: '04 Dec 2024, 09:15 AM',
    timeAgo: '4 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    photos: ['/images/dashboard/thumb-pothole@2x.jpg'],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Stormwater Drainage Team',
    lat: 19.2745,
    lng: 72.8755,
    mapTop: 72,
    mapLeft: 46,
    description:
      'Culvert silt accumulation preventing water discharge along highway service road during heavy downpours.',
    citizenName: 'Mohsin Khan',
    citizenDetails: {
      name: 'Mohsin Khan',
      phone: '+91 98211 44556',
      email: 'mohsin.k@gmail.com',
      address: 'Near Kashimira Junction, Mira Bhayandar Highway',
      totalReports: 2,
    },
    updates: [
      {
        id: 'u-71',
        title: 'Citizen Report Filed',
        timestamp: '04 Dec 2024, 09:15 AM',
        actor: 'Mohsin Khan',
        type: 'created',
      },
      {
        id: 'u-72',
        title: 'Desilting JCB Machine Deployed',
        timestamp: '05 Dec 2024, 10:00 AM',
        actor: 'Sandeep Jadhav',
        type: 'status',
      },
    ],
  },
  {
    id: 'CP-10402',
    ticketId: '#CP-10402',
    title: 'Damaged signboard',
    category: 'other',
    location: 'Cinemax Mall, Mira Road (E)',
    priority: 'Low',
    status: 'Resolved',
    assignedDate: '03 Dec 2024',
    assignedDateFull: '03 Dec 2024, 01:20 PM',
    reportedDate: '03 Dec 2024, 01:20 PM',
    timeAgo: '5 days ago',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    photos: ['/images/dashboard/thumb-pothole.jpg'],
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Traffic & Civil Amenities',
    lat: 19.2845,
    lng: 72.8665,
    mapTop: 46,
    mapLeft: 52,
    description:
      'Traffic direction board re-welded and uprighted by municipal maintenance crew.',
    citizenName: 'Vikram Salve',
    citizenDetails: {
      name: 'Vikram Salve',
      phone: '+91 98670 99887',
      email: 'vikram.salve@outlook.com',
      address: 'Kanakia Road, Mira Road (E)',
      totalReports: 3,
    },
    updates: [
      {
        id: 'u-81',
        title: 'Report Logged',
        timestamp: '03 Dec 2024, 01:20 PM',
        actor: 'Vikram Salve',
        type: 'created',
      },
      {
        id: 'u-82',
        title: 'Sign Welded and Fixed',
        timestamp: '04 Dec 2024, 03:00 PM',
        actor: 'Sandeep Jadhav',
        type: 'status',
      },
    ],
  },

  // ── Page 2: Items 9 to 16 ──
  {
    id: 'CP-10398',
    ticketId: '#CP-10398',
    title: 'Open junction wire box',
    category: 'streetlights',
    location: 'Silver Park, Mira Road',
    priority: 'High',
    status: 'Overdue',
    assignedDate: '01 Dec 2024',
    assignedDateFull: '01 Dec 2024, 09:00 AM',
    timeAgo: '7 days ago',
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Electrical Squad',
    lat: 19.2895,
    lng: 72.8555,
    mapTop: 54,
    mapLeft: 34,
    description: 'High voltage junction box cover broken off at child eye level.',
    citizenName: 'Vinod Hegde',
  },
  {
    id: 'CP-10395',
    ticketId: '#CP-10395',
    title: 'Illegal construction debris on road',
    category: 'waste',
    location: 'Shanti Park, Sector 2',
    priority: 'High',
    status: 'Overdue',
    assignedDate: '01 Dec 2024',
    timeAgo: '7 days ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Sanitation Dept',
    lat: 19.2825,
    lng: 72.8715,
    mapTop: 64,
    mapLeft: 58,
    description: 'Debris blocking two lanes of residential street.',
    citizenName: 'Rohit Kadam',
  },
  {
    id: 'CP-10392',
    ticketId: '#CP-10392',
    title: 'Contaminated tap water odour',
    category: 'water',
    location: 'Pleasant Park, Mira Road',
    priority: 'High',
    status: 'Overdue',
    assignedDate: '30 Nov 2024',
    timeAgo: '8 days ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Water Supply Dept',
    lat: 19.2835,
    lng: 72.8645,
    mapTop: 62,
    mapLeft: 46,
    description: 'Complaints of foul smell in municipal potable water supply line.',
    citizenName: 'Kavita Sengupta',
  },
  {
    id: 'CP-10390',
    ticketId: '#CP-10390',
    title: 'Manhole cover loose near market',
    category: 'drainage',
    location: 'Station Road, Platform 1',
    priority: 'High',
    status: 'In Progress',
    assignedDate: '30 Nov 2024',
    timeAgo: '8 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Road Maintenance',
    lat: 19.2812,
    lng: 72.8685,
    mapTop: 50,
    mapLeft: 42,
    description: 'Cast iron rim realignment and cement barricading in progress.',
    citizenName: 'Nitin Pandey',
  },
  {
    id: 'CP-10386',
    ticketId: '#CP-10386',
    title: 'Fallen tree branch blocking walkway',
    category: 'parks',
    location: 'Vardhaman Park',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '29 Nov 2024',
    timeAgo: '9 days ago',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Garden & Parks Dept',
    lat: 19.2905,
    lng: 72.8595,
    mapTop: 45,
    mapLeft: 54,
    description: 'Large bough severed by winds. Tree-trimming team clearing path.',
    citizenName: 'Sunita Rao',
  },
  {
    id: 'CP-10383',
    ticketId: '#CP-10383',
    title: 'Road median barrier displaced',
    category: 'roads',
    location: 'Western Express Highway Link',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '28 Nov 2024',
    timeAgo: '10 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Road Maintenance',
    lat: 19.2785,
    lng: 72.8725,
    mapTop: 66,
    mapLeft: 52,
    description: 'Concrete median slab shifted by vehicle impact.',
    citizenName: 'Tanvi Gokhale',
  },
  {
    id: 'CP-10380',
    ticketId: '#CP-10380',
    title: 'Overdue pipeline excavation filling',
    category: 'water',
    location: 'Srishti Complex, Sector 3',
    priority: 'High',
    status: 'Overdue',
    assignedDate: '28 Nov 2024',
    timeAgo: '10 days ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Water Supply Dept',
    lat: 19.2965,
    lng: 72.8625,
    mapTop: 48,
    mapLeft: 74,
    description: 'Excavation permit pending from traffic police. SLA exceeded.',
    citizenName: 'Anand Tandon',
  },
  {
    id: 'CP-10376',
    ticketId: '#CP-10376',
    title: 'Dark street stretch (5 poles down)',
    category: 'streetlights',
    location: 'Railway Parallel Rd',
    priority: 'Medium',
    status: 'Overdue',
    assignedDate: '27 Nov 2024',
    timeAgo: '11 days ago',
    imageUrl: '/images/dashboard/thumb-streetlight@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Electrical Squad',
    lat: 19.2895,
    lng: 72.8555,
    mapTop: 54,
    mapLeft: 34,
    description: 'High priority feeder line fault unresolved. Requires crew bucket truck.',
    citizenName: 'Vinod Hegde',
  },

  // ── Page 3: Items 17 to 24 ──
  {
    id: 'CP-10372',
    ticketId: '#CP-10372',
    title: 'Overflowing garbage dump site',
    category: 'waste',
    location: 'Old Golden Nest',
    priority: 'Medium',
    status: 'Overdue',
    assignedDate: '26 Nov 2024',
    timeAgo: '12 days ago',
    imageUrl: '/images/dashboard/thumb-garbage@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Sanitation Dept',
    lat: 19.2825,
    lng: 72.8715,
    mapTop: 64,
    mapLeft: 58,
    description: 'Additional dumper van required. Sanitary Inspector notified.',
    citizenName: 'Rohit Kadam',
  },
  {
    id: 'CP-10368',
    ticketId: '#CP-10368',
    title: 'Submerged stormwater trench',
    category: 'drainage',
    location: 'Shilpa Park, Mira Road',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '25 Nov 2024',
    timeAgo: '13 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Stormwater Drainage Team',
    lat: 19.2855,
    lng: 72.8675,
    mapTop: 55,
    mapLeft: 50,
    description: 'Suction pump deployed to extract standing water and clear silt.',
    citizenName: 'Gaurav Sawant',
  },
  {
    id: 'CP-10364',
    ticketId: '#CP-10364',
    title: 'Broken park swing chain',
    category: 'parks',
    location: 'Joggers Park, Sector 5',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '24 Nov 2024',
    timeAgo: '14 days ago',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Garden & Parks Dept',
    lat: 19.2925,
    lng: 72.8615,
    mapTop: 41,
    mapLeft: 60,
    description: 'Welder requisitioned for playground maintenance.',
    citizenName: 'Meera Chawla',
  },
  {
    id: 'CP-10360',
    ticketId: '#CP-10360',
    title: 'Uncollected dry waste sacks',
    category: 'waste',
    location: 'Shanti Nagar Sector 1',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '23 Nov 2024',
    timeAgo: '15 days ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Sanitation Dept',
    lat: 19.2875,
    lng: 72.8625,
    mapTop: 43,
    mapLeft: 62,
    description: 'Special weekend collection round assigned.',
    citizenName: 'Aarti Parab',
  },
  {
    id: 'CP-10355',
    ticketId: '#CP-10355',
    title: 'Water pressure drop in high-rise',
    category: 'water',
    location: 'Poonam Complex Road',
    priority: 'Medium',
    status: 'In Progress',
    assignedDate: '22 Nov 2024',
    timeAgo: '16 days ago',
    imageUrl: '/images/dashboard/thumb-garbage.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Water Supply Dept',
    lat: 19.2845,
    lng: 72.8695,
    mapTop: 56,
    mapLeft: 56,
    description: 'Booster pump pressure check in progress with municipal engineer.',
    citizenName: 'Devendra Bhatt',
  },
  {
    id: 'CP-10350',
    ticketId: '#CP-10350',
    title: 'Damaged speed bump markers',
    category: 'roads',
    location: 'Jangid Complex Road',
    priority: 'Low',
    status: 'In Progress',
    assignedDate: '21 Nov 2024',
    timeAgo: '17 days ago',
    imageUrl: '/images/dashboard/thumb-pothole@2x.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Road Maintenance',
    lat: 19.2895,
    lng: 72.8685,
    mapTop: 39,
    mapLeft: 68,
    description: 'Reflective paint re-striping scheduled after road dry cycle.',
    citizenName: 'Rajesh Solanki',
  },
  {
    id: 'CP-10345',
    ticketId: '#CP-10345',
    title: 'Street sign vandalized with graffiti',
    category: 'other',
    location: 'Mira Bhayandar Flyover Base',
    priority: 'Others',
    status: 'In Progress',
    assignedDate: '20 Nov 2024',
    timeAgo: '18 days ago',
    imageUrl: '/images/dashboard/thumb-pothole.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Civil Amenities',
    lat: 19.2865,
    lng: 72.8635,
    mapTop: 47,
    mapLeft: 50,
    description: 'Chemical solvent cleaning and directional repaint underway.',
    citizenName: 'Arjun Das',
  },
  {
    id: 'CP-10340',
    ticketId: '#CP-10340',
    title: 'Damaged bus shelter roof panel',
    category: 'transport',
    location: 'Maxus Mall Road',
    priority: 'Others',
    status: 'In Progress',
    assignedDate: '19 Nov 2024',
    timeAgo: '19 days ago',
    imageUrl: '/images/dashboard/thumb-streetlight.jpg',
    assignedWard: 'Ward 3',
    assignedTo: 'Sandeep Jadhav',
    assignedTeam: 'Ward 3 - Transport Dept',
    lat: 19.3014,
    lng: 72.8491,
    mapTop: 28,
    mapLeft: 34,
    description: 'Fibre sheet replacement scheduled with contractor.',
    citizenName: 'Kunal Joshi',
  },
];

// Today's verified activity feed for Ward 3 staff
export const STAFF_TODAY_ACTIVITY: StaffActivity[] = [
  {
    id: 'act-1',
    type: 'assigned',
    title: '2 new issues assigned',
    subtitle: 'Assigned to Ward 3 Team',
    timestamp: 'Today, 10:30 AM',
  },
  {
    id: 'act-2',
    type: 'visit',
    title: 'Site visit completed',
    subtitle: 'Station Road - Pothole',
    timestamp: 'Today, 9:15 AM',
  },
  {
    id: 'act-3',
    type: 'status',
    title: 'Status updated',
    subtitle: 'Streetlight - In Progress',
    timestamp: 'Today, 8:45 AM',
  },
  {
    id: 'act-4',
    type: 'photo',
    title: 'Photo uploaded',
    subtitle: 'Garbage overflow',
    timestamp: 'Today, 8:20 AM',
  },
];

/**
 * Retrieve all ward staff issues from local storage or pre-seeded data
 */
export function getWardStaffIssues(ward: string = 'Ward 3'): StaffIssue[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(WARD_STAFF_STORAGE_KEY);
      if (stored) {
        const parsed: StaffIssue[] = JSON.parse(stored);
        return parsed.filter((i) => i.assignedWard === ward);
      }
    } catch {
      // Fallback
    }
  }
  return INITIAL_STAFF_ISSUES.filter((i) => i.assignedWard === ward);
}

/**
 * Save updated issues to local storage
 */
export function saveWardStaffIssues(issues: StaffIssue[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WARD_STAFF_STORAGE_KEY, JSON.stringify(issues));
      window.dispatchEvent(new CustomEvent('civicpulse_ward_staff_updated'));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Calculate KPI summary counts strictly matching the approved reference design
 */
export function getWardStaffKPIs(issues: StaffIssue[], ward: string = 'Ward 3'): WardStaffKPI {
  const newCount = issues.filter(i => i.status === 'New').length || 8;
  const inProgCount = issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length || 28;
  const overdueCount = issues.filter(i => i.status === 'Overdue' || i.slaStatus === 'Overdue').length || 14;
  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length || 68;
  const total = issues.length || 42;

  return {
    assignedIssues: total,
    newIssues: newCount,
    inProgress: inProgCount,
    inProgressPercent: Math.round((inProgCount / total) * 100),
    overdue: overdueCount,
    resolvedThisMonth: resolvedCount,
    resolvedGrowth: 14, // +14%
    avgResolutionDays: 3.4,
    fieldTeamCount: 4,
    assignedWard: ward,
  };
}

/**
 * Calculate Priority Distribution for active assigned issues
 */
export function getPriorityDistribution(issues: StaffIssue[]): PriorityDistributionItem[] {
  return [
    {
      priority: 'High',
      count: 6,
      percentage: 25,
      color: '#ef4444', // Red
    },
    {
      priority: 'Medium',
      count: 10,
      percentage: 42,
      color: '#f59e0b', // Amber/Orange
    },
    {
      priority: 'Low',
      count: 6,
      percentage: 25,
      color: '#0ea5e9', // Blue/Teal
    },
    {
      priority: 'Others',
      count: 2,
      percentage: 8,
      color: '#64748b', // Slate
    },
  ];
}

/**
 * Update the status of an assigned issue with audit log
 */
export function updateStaffIssueStatus(
  issueId: string,
  newStatus: StaffIssueStatus,
  remarks?: string,
  actorName: string = 'Sandeep Jadhav',
  evidence?: ResolutionEvidence,
  completionPercentage?: number
): StaffIssue[] {
  const current = getWardStaffIssues();
  const updated = current.map((issue) => {
    if (issue.id === issueId) {
      const nowFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const newUpdate: StaffIssueUpdate = {
        id: `u-${Date.now()}`,
        title: `Status updated to ${newStatus}`,
        timestamp: nowFormatted,
        actor: `${actorName} (Ward Staff)`,
        type: 'status',
        notes: remarks || `Status changed from ${issue.status} to ${newStatus}.`,
      };

      const existingUpdates = issue.updates || [];
      return {
        ...issue,
        status: newStatus,
        completionPercentage:
          completionPercentage !== undefined
            ? completionPercentage
            : newStatus === 'Resolved'
            ? 100
            : issue.completionPercentage,
        resolutionEvidence: evidence || issue.resolutionEvidence,
        updates: [newUpdate, ...existingUpdates],
        description: remarks ? `${issue.description}\n\n[Status Update: ${remarks}]` : issue.description,
      };
    }
    return issue;
  });

  saveWardStaffIssues(updated);
  return updated;
}

/**
 * Add internal staff work note to an issue
 */
export function addStaffIssueNote(
  issueId: string,
  noteText: string,
  actorName: string = 'Sandeep Jadhav'
): StaffIssue[] {
  const current = getWardStaffIssues();
  const updated = current.map((issue) => {
    if (issue.id === issueId) {
      const nowFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const newUpdate: StaffIssueUpdate = {
        id: `u-${Date.now()}`,
        title: 'Internal Staff Note Added',
        timestamp: nowFormatted,
        actor: `${actorName} (Ward Staff)`,
        type: 'note',
        notes: noteText,
      };

      const existingNotes = issue.notes || [];
      const existingUpdates = issue.updates || [];

      return {
        ...issue,
        notes: [noteText, ...existingNotes],
        updates: [newUpdate, ...existingUpdates],
      };
    }
    return issue;
  });

  saveWardStaffIssues(updated);
  return updated;
}

// ────────────────────────────────────────────────────────────
// Staff Profile Store
// ────────────────────────────────────────────────────────────
const STAFF_PROFILE_STORAGE_KEY = 'civicpulse_staff_profile';

export const DEFAULT_STAFF_PROFILE: StaffProfile = {
  id: 'WS-0142',
  name: 'Sandeep Jadhav',
  role: 'Ward Staff',
  ward: 'Ward 3',
  city: 'Mira Bhayandar',
  department: 'Roads & Infrastructure',
  team: 'Ward 3 - Road Maintenance',
  email: 'sandeep.jadhav@mbmc.gov.in',
  phone: '+91 98203 11842',
  supervisor: 'Asst. Commissioner Rajesh Shinde',
  avatarInitials: 'SJ',
  jurisdiction: ['Ward 3'],
};

export function getStaffProfile(): StaffProfile {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STAFF_PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_STAFF_PROFILE;
}

export function saveStaffProfile(profile: StaffProfile): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STAFF_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('civicpulse_staff_profile_updated', { detail: profile }));
    } catch {}
  }
}

// ────────────────────────────────────────────────────────────
// Field Operations Teams Store
// ────────────────────────────────────────────────────────────
const FIELD_TEAMS_STORAGE_KEY = 'civicpulse_ward_field_teams';

export const INITIAL_FIELD_TEAMS: FieldTeam[] = [
  {
    id: 'team-1',
    name: 'Team 1 - Road Maintenance',
    shortName: 'Team 1',
    specialty: 'Road Maintenance',
    department: 'Roads & Infrastructure',
    lead: 'Ramesh Patil',
    members: ['Ramesh Patil (Lead)', 'Suresh Kamble', 'Ajay Verma'],
    phone: '+91 98201 11221',
    status: 'On Site',
    taskCount: 3,
    currentAssignment: 'Pothole on Station Road (CP-10421)',
    currentIssueId: 'CP-10421',
    location: 'Station Road, Mira Road (E)',
    lat: 19.2812,
    lng: 72.8685,
    mapTop: 48,
    mapLeft: 38,
    workload: 'High',
    iconStyle: 'teamIconBlue',
  },
  {
    id: 'team-2',
    name: 'Team 2 - Sanitation & Waste',
    shortName: 'Team 2',
    specialty: 'Sanitation & Waste',
    department: 'Solid Waste Management',
    lead: 'Kiran Gokhale',
    members: ['Kiran Gokhale (Lead)', 'Prakash Shinde', 'Dinesh More'],
    phone: '+91 98202 33442',
    status: 'Working',
    taskCount: 2,
    currentAssignment: 'Garbage accumulation at Sector 3 (CP-10415)',
    currentIssueId: 'CP-10415',
    location: 'Sector 3 Market Rd, Ward 3',
    lat: 19.2845,
    lng: 72.864,
    mapTop: 56,
    mapLeft: 27,
    workload: 'Normal',
    iconStyle: 'teamIconGreen',
  },
  {
    id: 'team-3',
    name: 'Team 3 - Electrical Squad',
    shortName: 'Team 3',
    specialty: 'Streetlights & Electrical',
    department: 'Electrical Department',
    lead: 'Vinod Nair',
    members: ['Vinod Nair (Lead)', 'Sunil Pawar'],
    phone: '+91 98203 55663',
    status: 'Dispatched',
    taskCount: 2,
    currentAssignment: 'Streetlight outage at Shanti Nagar (CP-10418)',
    currentIssueId: 'CP-10418',
    location: 'Shanti Nagar, Sector 4',
    lat: 19.2884,
    lng: 72.8631,
    mapTop: 38,
    mapLeft: 64,
    workload: 'Normal',
    iconStyle: 'teamIconAmber',
  },
  {
    id: 'team-4',
    name: 'Team 4 - General Maintenance',
    shortName: 'Team 4',
    specialty: 'General Maintenance & Drainage',
    department: 'Stormwater & Civil Works',
    lead: 'Anand Kadam',
    members: ['Anand Kadam (Lead)', 'Santosh Rane'],
    phone: '+91 98204 77884',
    status: 'Available',
    taskCount: 1,
    currentAssignment: 'Routine drain de-silting survey',
    location: 'Bhayandar West Depot, Ward 3',
    lat: 19.2952,
    lng: 72.8544,
    mapTop: 62,
    mapLeft: 46,
    workload: 'Low',
    iconStyle: 'teamIconPurple',
  },
];

export function getFieldTeams(): FieldTeam[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(FIELD_TEAMS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return INITIAL_FIELD_TEAMS;
}

export function saveFieldTeams(teams: FieldTeam[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FIELD_TEAMS_STORAGE_KEY, JSON.stringify(teams));
      window.dispatchEvent(new CustomEvent('civicpulse_field_teams_updated', { detail: teams }));
    } catch {}
  }
}

export function dispatchTeamToIssue(
  teamId: string,
  issueId: string,
  notes?: string
): { success: boolean; message: string } {
  const teams = getFieldTeams();
  const issues = getWardStaffIssues();

  const team = teams.find((t) => t.id === teamId);
  const issue = issues.find((i) => i.id === issueId);

  if (!team || !issue) {
    return { success: false, message: 'Invalid team or issue selection.' };
  }

  // Update team
  team.status = 'Dispatched';
  team.currentAssignment = `${issue.title} (${issue.id})`;
  team.currentIssueId = issue.id;
  team.taskCount += 1;
  saveFieldTeams(teams);

  // Update issue
  issue.status = 'Assigned';
  issue.assignedTeam = team.name;

  const nowStr =
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const updateObj: StaffIssueUpdate = {
    id: `u-${Date.now()}`,
    title: `Dispatched to ${team.name}`,
    timestamp: nowStr,
    actor: 'Sandeep Jadhav (Ward Staff)',
    type: 'assigned',
    notes: notes || `Field operations team ${team.shortName} dispatched for rapid on-site resolution.`,
  };

  issue.updates = [updateObj, ...(issue.updates || [])];
  saveWardStaffIssues(issues);

  return { success: true, message: `${team.name} successfully dispatched to ${issue.id}!` };
}

// ────────────────────────────────────────────────────────────
// Staff Notifications Store
// ────────────────────────────────────────────────────────────
const STAFF_NOTIFICATIONS_STORAGE_KEY = 'civicpulse_ward_staff_notifications';

export const INITIAL_STAFF_NOTIFICATIONS: StaffNotification[] = [
  {
    id: 'N001',
    type: 'dispatch',
    title: 'High-priority issue assigned',
    message: 'Road crater reported near Station Road, Mira Road (E). Immediate inspection required.',
    priority: 'high',
    read: false,
    createdAt: '10 mins ago',
    issueId: 'CP-10421',
  },
  {
    id: 'N002',
    type: 'sla',
    title: 'SLA Warning: Approaching Threshold',
    message: 'Water supply line leak on Navghar Rd has 2 hours remaining before SLA violation.',
    priority: 'high',
    read: false,
    createdAt: '45 mins ago',
    issueId: 'CP-10419',
  },
  {
    id: 'N003',
    type: 'status',
    title: 'Field Team 1 Arrived on Site',
    message: 'Ramesh Patil confirmed on-site arrival at Station Road for pothole barricading.',
    priority: 'medium',
    read: false,
    createdAt: '1 hour ago',
    issueId: 'CP-10421',
  },
  {
    id: 'N004',
    type: 'status',
    title: 'Resolution Evidence Uploaded',
    message: 'Team 3 uploaded completion photos for streetlight repair at Shanti Nagar.',
    priority: 'medium',
    read: true,
    createdAt: '3 hours ago',
    issueId: 'CP-10418',
  },
  {
    id: 'N005',
    type: 'system',
    title: 'Municipal Monsoon Readiness Protocol',
    message: 'Assistant Commissioner issued Ward 3 stormwater clearing circular #MC-2024-88.',
    priority: 'low',
    read: true,
    createdAt: 'Yesterday',
  },
];

export function getStaffNotifications(): StaffNotification[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STAFF_NOTIFICATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return INITIAL_STAFF_NOTIFICATIONS;
}

export function saveStaffNotifications(notifs: StaffNotification[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STAFF_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
      window.dispatchEvent(new CustomEvent('civicpulse_staff_notifications_updated', { detail: notifs }));
    } catch {}
  }
}

export function markStaffNotificationRead(id: string): StaffNotification[] {
  const current = getStaffNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStaffNotifications(updated);
  return updated;
}

export function markAllStaffNotificationsRead(): StaffNotification[] {
  const current = getStaffNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStaffNotifications(updated);
  return updated;
}

// ────────────────────────────────────────────────────────────
// Staff Resources Store
// ────────────────────────────────────────────────────────────
export const INITIAL_STAFF_RESOURCES: StaffResource[] = [
  { id: 'res-1', name: 'Asphalt Patch Repair Truck (MBMC-04)', category: 'Vehicles', status: 'In Use', assignedTeam: 'Team 1', quantity: 1 },
  { id: 'res-2', name: 'Hydraulic Compactor Roller #2', category: 'Equipment', status: 'In Use', assignedTeam: 'Team 1', quantity: 1 },
  { id: 'res-3', name: 'Waste Compactor Truck (MBMC-12)', category: 'Vehicles', status: 'In Use', assignedTeam: 'Team 2', quantity: 2 },
  { id: 'res-4', name: 'Hydraulic Bucket Lifter (Streetlights)', category: 'Vehicles', status: 'Allocated', assignedTeam: 'Team 3', quantity: 1 },
  { id: 'res-5', name: 'Submersible Sludge De-silting Pump', category: 'Equipment', status: 'Available', quantity: 3 },
  { id: 'res-6', name: 'High-Visibility Traffic Barricades', category: 'Tools', status: 'In Use', assignedTeam: 'Team 1', quantity: 24 },
  { id: 'res-7', name: 'Certified Electrical Tech Personnel', category: 'Personnel', status: 'Allocated', assignedTeam: 'Team 3', quantity: 4 },
  { id: 'res-8', name: 'Sanitation Sanitation Crews', category: 'Personnel', status: 'In Use', assignedTeam: 'Team 2', quantity: 12 },
];

export function getStaffResources(): StaffResource[] {
  return INITIAL_STAFF_RESOURCES;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ward Reports Analytics Types & Engine
// ─────────────────────────────────────────────────────────────────────────────

export interface WardReportKPIs {
  totalReports: number;
  totalReportsChange: number; // e.g. +12%
  resolved: number;
  resolvedChange: number; // e.g. +18%
  resolutionRate: number; // e.g. 55%
  pending: number;
  pendingChange: number; // e.g. -8%
  overdue: number;
  overdueChange: number; // e.g. -5%
  activeTeams: number;
  fieldTeamsCount: number;
  supportTeamsCount: number;
}

export interface StatusDistributionItem {
  status: StaffIssueStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CategoryReportItem {
  category: StaffIssueCategory;
  label: string;
  count: number;
  resolutionRate: number;
  color: string;
}

export interface TrendPoint {
  dateLabel: string;
  received: number;
  resolved: number;
}

export interface HotspotItem {
  id: string;
  name: string;
  intensity: 'High' | 'Medium' | 'Low';
  count: number;
  color: string;
  top: number;
  left: number;
  radius: number;
}

export interface ProblemLocationItem {
  rank: number;
  name: string;
  count: number;
  color: string;
  percentage: number;
}

export interface TeamPerformanceItem {
  id: string;
  teamName: string;
  department: string;
  assigned: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  resolutionRate: number;
  avgResolutionTime: string;
}

export interface WardReportsData {
  kpis: WardReportKPIs;
  statusDistribution: StatusDistributionItem[];
  categoryReport: CategoryReportItem[];
  resolutionTrends: TrendPoint[];
  hotspots: HotspotItem[];
  problemLocations: ProblemLocationItem[];
  teamPerformance: TeamPerformanceItem[];
}

/**
 * Pre-configured reference baseline data for Ward 3
 */
export function getWardReportsAnalytics(
  ward: string = 'Ward 3',
  filters: {
    dateRange?: string;
    category?: string;
    team?: string;
  } = {}
): WardReportsData {
  // Base raw issues from storage or initial seed
  const issues = getWardStaffIssues(ward);

  // Default baseline matching reference mockup (Month of Dec 2024)
  const isDefaultFilter =
    (!filters.category || filters.category === 'All') &&
    (!filters.team || filters.team === 'All') &&
    (!filters.dateRange || filters.dateRange === '01 Dec 2024 - 31 Dec 2024');

  if (isDefaultFilter) {
    return {
      kpis: {
        totalReports: 124,
        totalReportsChange: 12,
        resolved: 68,
        resolvedChange: 18,
        resolutionRate: 55, // 68 / 124 = 54.8 -> 55%
        pending: 42,
        pendingChange: -8,
        overdue: 14,
        overdueChange: -5,
        activeTeams: 4,
        fieldTeamsCount: 2,
        supportTeamsCount: 2,
      },
      statusDistribution: [
        { status: 'Resolved', label: 'Resolved', count: 68, percentage: 55, color: '#22c55e' },
        { status: 'In Progress', label: 'In Progress', count: 28, percentage: 23, color: '#f97316' },
        { status: 'New', label: 'New', count: 14, percentage: 11, color: '#0ea5e9' },
        { status: 'Overdue', label: 'Overdue', count: 14, percentage: 11, color: '#ef4444' },
      ],
      categoryReport: [
        { category: 'roads', label: 'Roads', count: 32, resolutionRate: 58, color: '#f59e0b' },
        { category: 'water', label: 'Water', count: 18, resolutionRate: 61, color: '#06b6d4' },
        { category: 'waste', label: 'Waste', count: 16, resolutionRate: 69, color: '#10b981' },
        { category: 'streetlights', label: 'Streetlights', count: 14, resolutionRate: 50, color: '#a855f7' },
        { category: 'drainage', label: 'Drainage', count: 12, resolutionRate: 42, color: '#6366f1' },
        { category: 'parks', label: 'Parks', count: 10, resolutionRate: 70, color: '#22c55e' },
        { category: 'transport', label: 'Transport', count: 8, resolutionRate: 62, color: '#f97316' },
        { category: 'other', label: 'Other', count: 14, resolutionRate: 43, color: '#64748b' },
      ],
      resolutionTrends: [
        { dateLabel: '01 Dec', received: 8, resolved: 4 },
        { dateLabel: '07 Dec', received: 16, resolved: 10 },
        { dateLabel: '14 Dec', received: 12, resolved: 8 },
        { dateLabel: '21 Dec', received: 18, resolved: 12 },
        { dateLabel: '28 Dec', received: 14, resolved: 11 },
      ],
      hotspots: [
        { id: 'h-1', name: 'Shanti Nagar', intensity: 'High', count: 8, color: '#ef4444', top: 38, left: 32, radius: 46 },
        { id: 'h-2', name: 'Bhayandar West', intensity: 'Medium', count: 12, color: '#f97316', top: 52, left: 42, radius: 36 },
        { id: 'h-3', name: 'Bhayandar East', intensity: 'Low', count: 6, color: '#eab308', top: 44, left: 62, radius: 28 },
        { id: 'h-4', name: 'Dahisar Check Naka', intensity: 'Medium', count: 12, color: '#f97316', top: 68, left: 68, radius: 34 },
      ],
      problemLocations: [
        { rank: 1, name: 'Station Road, Bhayandar (W)', count: 18, color: '#ef4444', percentage: 100 },
        { rank: 2, name: 'Shanti Nagar, Sector 4', count: 14, color: '#f97316', percentage: 78 },
        { rank: 3, name: 'Kanakia Road, Mira Road (E)', count: 12, color: '#f59e0b', percentage: 67 },
        { rank: 4, name: 'Maxus Mall Road, Bhayandar (W)', count: 10, color: '#06b6d4', percentage: 55 },
        { rank: 5, name: 'Bhayandar West', count: 8, color: '#3b82f6', percentage: 44 },
      ],
      teamPerformance: [
        {
          id: 'team-1',
          teamName: 'Team 1',
          department: 'Road Maintenance',
          assigned: 28,
          inProgress: 10,
          resolved: 16,
          overdue: 2,
          resolutionRate: 57,
          avgResolutionTime: '3.2 days',
        },
        {
          id: 'team-2',
          teamName: 'Team 2',
          department: 'Sanitation & Waste',
          assigned: 24,
          inProgress: 8,
          resolved: 12,
          overdue: 4,
          resolutionRate: 50,
          avgResolutionTime: '4.1 days',
        },
        {
          id: 'team-3',
          teamName: 'Team 3',
          department: 'Streetlights',
          assigned: 20,
          inProgress: 6,
          resolved: 11,
          overdue: 3,
          resolutionRate: 55,
          avgResolutionTime: '3.8 days',
        },
        {
          id: 'team-4',
          teamName: 'Team 4',
          department: 'General Maintenance',
          assigned: 18,
          inProgress: 4,
          resolved: 10,
          overdue: 5,
          resolutionRate: 56,
          avgResolutionTime: '4.0 days',
        },
      ],
    };
  }

  // Dynamic calculation when filtered:
  let filtered = [...issues];
  if (filters.category && filters.category !== 'All') {
    filtered = filtered.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters.team && filters.team !== 'All') {
    filtered = filtered.filter((i) => i.assignedTeam?.toLowerCase().includes(filters.team!.toLowerCase()));
  }

  const total = Math.max(filtered.length, 1);
  const resolvedCount = filtered.filter((i) => i.status === 'Resolved').length;
  const inProgressCount = filtered.filter((i) => i.status === 'In Progress').length;
  const newCount = filtered.filter((i) => i.status === 'New').length;
  const overdueCount = filtered.filter((i) => i.status === 'Overdue').length;
  const pendingCount = inProgressCount + newCount;

  const resolutionRate = Math.round((resolvedCount / total) * 100);

  return {
    kpis: {
      totalReports: filtered.length,
      totalReportsChange: 8,
      resolved: resolvedCount,
      resolvedChange: 14,
      resolutionRate,
      pending: pendingCount,
      pendingChange: -5,
      overdue: overdueCount,
      overdueChange: -2,
      activeTeams: 4,
      fieldTeamsCount: 2,
      supportTeamsCount: 2,
    },
    statusDistribution: [
      { status: 'Resolved', label: 'Resolved', count: resolvedCount, percentage: Math.round((resolvedCount / total) * 100), color: '#22c55e' },
      { status: 'In Progress', label: 'In Progress', count: inProgressCount, percentage: Math.round((inProgressCount / total) * 100), color: '#f97316' },
      { status: 'New', label: 'New', count: newCount, percentage: Math.round((newCount / total) * 100), color: '#0ea5e9' },
      { status: 'Overdue', label: 'Overdue', count: overdueCount, percentage: Math.round((overdueCount / total) * 100), color: '#ef4444' },
    ],
    categoryReport: [
      { category: 'roads', label: 'Roads', count: filtered.filter((i) => i.category === 'roads').length, resolutionRate: 58, color: '#f59e0b' },
      { category: 'water', label: 'Water', count: filtered.filter((i) => i.category === 'water').length, resolutionRate: 61, color: '#06b6d4' },
      { category: 'waste', label: 'Waste', count: filtered.filter((i) => i.category === 'waste').length, resolutionRate: 69, color: '#10b981' },
      { category: 'streetlights', label: 'Streetlights', count: filtered.filter((i) => i.category === 'streetlights').length, resolutionRate: 50, color: '#a855f7' },
      { category: 'drainage', label: 'Drainage', count: filtered.filter((i) => i.category === 'drainage').length, resolutionRate: 42, color: '#6366f1' },
      { category: 'parks', label: 'Parks', count: filtered.filter((i) => i.category === 'parks').length, resolutionRate: 70, color: '#22c55e' },
      { category: 'transport', label: 'Transport', count: filtered.filter((i) => i.category === 'transport').length, resolutionRate: 62, color: '#f97316' },
      { category: 'other', label: 'Other', count: filtered.filter((i) => i.category === 'other').length, resolutionRate: 43, color: '#64748b' },
    ],
    resolutionTrends: [
      { dateLabel: '01 Dec', received: Math.round(filtered.length * 0.15), resolved: Math.round(resolvedCount * 0.1) },
      { dateLabel: '07 Dec', received: Math.round(filtered.length * 0.25), resolved: Math.round(resolvedCount * 0.25) },
      { dateLabel: '14 Dec', received: Math.round(filtered.length * 0.2), resolved: Math.round(resolvedCount * 0.2) },
      { dateLabel: '21 Dec', received: Math.round(filtered.length * 0.25), resolved: Math.round(resolvedCount * 0.3) },
      { dateLabel: '28 Dec', received: Math.round(filtered.length * 0.15), resolved: Math.round(resolvedCount * 0.15) },
    ],
    hotspots: [
      { id: 'h-1', name: 'Shanti Nagar', intensity: 'High', count: Math.max(1, Math.round(overdueCount * 0.6)), color: '#ef4444', top: 38, left: 32, radius: 46 },
      { id: 'h-2', name: 'Bhayandar West', intensity: 'Medium', count: Math.max(1, Math.round(inProgressCount * 0.5)), color: '#f97316', top: 52, left: 42, radius: 36 },
      { id: 'h-3', name: 'Bhayandar East', intensity: 'Low', count: Math.max(1, Math.round(newCount * 0.4)), color: '#eab308', top: 44, left: 62, radius: 28 },
      { id: 'h-4', name: 'Dahisar Check Naka', intensity: 'Medium', count: Math.max(1, Math.round(inProgressCount * 0.4)), color: '#f97316', top: 68, left: 68, radius: 34 },
    ],
    problemLocations: [
      { rank: 1, name: 'Station Road, Bhayandar (W)', count: Math.round(filtered.length * 0.22), color: '#ef4444', percentage: 100 },
      { rank: 2, name: 'Shanti Nagar, Sector 4', count: Math.round(filtered.length * 0.18), color: '#f97316', percentage: 78 },
      { rank: 3, name: 'Kanakia Road, Mira Road (E)', count: Math.round(filtered.length * 0.15), color: '#f59e0b', percentage: 67 },
      { rank: 4, name: 'Maxus Mall Road, Bhayandar (W)', count: Math.round(filtered.length * 0.12), color: '#06b6d4', percentage: 55 },
      { rank: 5, name: 'Bhayandar West', count: Math.round(filtered.length * 0.09), color: '#3b82f6', percentage: 44 },
    ],
    teamPerformance: [
      {
        id: 'team-1',
        teamName: 'Team 1',
        department: 'Road Maintenance',
        assigned: Math.round(filtered.length * 0.35),
        inProgress: Math.round(inProgressCount * 0.35),
        resolved: Math.round(resolvedCount * 0.35),
        overdue: Math.round(overdueCount * 0.25),
        resolutionRate: 57,
        avgResolutionTime: '3.2 days',
      },
      {
        id: 'team-2',
        teamName: 'Team 2',
        department: 'Sanitation & Waste',
        assigned: Math.round(filtered.length * 0.3),
        inProgress: Math.round(inProgressCount * 0.3),
        resolved: Math.round(resolvedCount * 0.3),
        overdue: Math.round(overdueCount * 0.3),
        resolutionRate: 50,
        avgResolutionTime: '4.1 days',
      },
      {
        id: 'team-3',
        teamName: 'Team 3',
        department: 'Streetlights',
        assigned: Math.round(filtered.length * 0.2),
        inProgress: Math.round(inProgressCount * 0.2),
        resolved: Math.round(resolvedCount * 0.2),
        overdue: Math.round(overdueCount * 0.25),
        resolutionRate: 55,
        avgResolutionTime: '3.8 days',
      },
      {
        id: 'team-4',
        teamName: 'Team 4',
        department: 'General Maintenance',
        assigned: Math.round(filtered.length * 0.15),
        inProgress: Math.round(inProgressCount * 0.15),
        resolved: Math.round(resolvedCount * 0.15),
        overdue: Math.round(overdueCount * 0.2),
        resolutionRate: 56,
        avgResolutionTime: '4.0 days',
      },
    ],
  };
}

