import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CivicPulse database...\n');

  // ═══════════════════════════════════════════
  // 1. WARDS
  // ═══════════════════════════════════════════
  console.log('📍 Creating wards...');
  const wards = await Promise.all([
    prisma.ward.upsert({
      where: { wardNumber: 1 },
      update: {},
      create: { wardNumber: 1, name: 'Mira Road East', description: 'Eastern Mira Road zone, covering Kashimira to Shanti Nagar' },
    }),
    prisma.ward.upsert({
      where: { wardNumber: 2 },
      update: {},
      create: { wardNumber: 2, name: 'Mira Road West', description: 'Western Mira Road zone, covering Silver Park to Sheetal Nagar' },
    }),
    prisma.ward.upsert({
      where: { wardNumber: 3 },
      update: {},
      create: { wardNumber: 3, name: 'Mira Bhayandar', description: 'Central zone covering Bhayandar East and West' },
    }),
    prisma.ward.upsert({
      where: { wardNumber: 4 },
      update: {},
      create: { wardNumber: 4, name: 'Bhayandar East', description: 'Bhayandar East zone, Navghar to Uttan Road' },
    }),
    prisma.ward.upsert({
      where: { wardNumber: 5 },
      update: {},
      create: { wardNumber: 5, name: 'Bhayandar West', description: 'Bhayandar West zone, covering Bhayandar station area' },
    }),
  ]);

  const ward3 = wards[2]; // Primary ward
  console.log(`   ✓ ${wards.length} wards created (primary: Ward 3 — ${ward3.name})`);

  // ═══════════════════════════════════════════
  // 2. USERS
  // ═══════════════════════════════════════════
  console.log('👥 Creating users...');
  const citizenPassword = await bcrypt.hash('Password@123', 12);
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const adminPassword = await bcrypt.hash('Admin@123', 12);

  const citizen = await prisma.user.upsert({
    where: { email: 'rohan.mehta@example.com' },
    update: {},
    create: {
      email: 'rohan.mehta@example.com',
      name: 'Rohan Mehta',
      passwordHash: citizenPassword,
      phone: '+91 98765 12345',
      role: 'CITIZEN',
      wardId: ward3.id,
    },
  });

  const wardStaff = await prisma.user.upsert({
    where: { email: 'sandeep.jadhav@mbmc.gov.in' },
    update: {},
    create: {
      email: 'sandeep.jadhav@mbmc.gov.in',
      name: 'Sandeep Jadhav',
      passwordHash: staffPassword,
      phone: '+91 98765 43210',
      role: 'WARD_STAFF',
      wardId: ward3.id,
      employeeId: 'MBMC-WS-0142',
      department: 'Road Maintenance',
      division: 'Infrastructure',
    },
  });

  const staffAnjali = await prisma.user.upsert({
    where: { email: 'anjali.patil@mbmc.gov.in' },
    update: {},
    create: {
      email: 'anjali.patil@mbmc.gov.in',
      name: 'Anjali Patil',
      passwordHash: staffPassword,
      phone: '+91 98765 11111',
      role: 'WARD_STAFF',
      wardId: ward3.id,
      employeeId: 'MBMC-WS-0156',
      department: 'Sanitation & Waste',
      division: 'Public Health',
    },
  });

  const staffRajesh = await prisma.user.upsert({
    where: { email: 'rajesh.kumar@mbmc.gov.in' },
    update: {},
    create: {
      email: 'rajesh.kumar@mbmc.gov.in',
      name: 'Rajesh Kumar',
      passwordHash: staffPassword,
      phone: '+91 98765 22222',
      role: 'WARD_STAFF',
      wardId: ward3.id,
      employeeId: 'MBMC-WS-0163',
      department: 'Streetlights & Electrical',
      division: 'Electrical',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mbmc.gov.in' },
    update: {},
    create: {
      email: 'admin@mbmc.gov.in',
      name: 'Commissioner Priya Sharma',
      passwordHash: adminPassword,
      phone: '+91 22 2812 4000',
      role: 'SUPER_ADMIN',
      employeeId: 'MBMC-HQ-0001',
      department: 'Central Administration',
      division: 'Commissioner Office',
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: 'priya.deshmukh@example.com' },
    update: {},
    create: {
      email: 'priya.deshmukh@example.com',
      name: 'Priya Deshmukh',
      passwordHash: citizenPassword,
      phone: '+91 98765 33333',
      role: 'CITIZEN',
      wardId: ward3.id,
    },
  });

  const citizen3 = await prisma.user.upsert({
    where: { email: 'amit.shah@example.com' },
    update: {},
    create: {
      email: 'amit.shah@example.com',
      name: 'Amit Shah',
      passwordHash: citizenPassword,
      phone: '+91 98765 44444',
      role: 'CITIZEN',
      wardId: wards[0].id,
    },
  });

  console.log(`   ✓ Users: citizen=${citizen.name}, staff=${wardStaff.name}, admin=${admin.name}`);

  // ═══════════════════════════════════════════
  // 3. TEAMS
  // ═══════════════════════════════════════════
  console.log('🛠️  Creating teams...');
  const team1 = await prisma.team.upsert({
    where: { id: 'team-road-maintenance-ward3' },
    update: {},
    create: {
      id: 'team-road-maintenance-ward3',
      name: 'Team 1 — Road Maintenance',
      department: 'Road Maintenance',
      wardId: ward3.id,
      teamLeaderId: wardStaff.id,
      status: 'AVAILABLE',
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: 'team-sanitation-ward3' },
    update: {},
    create: {
      id: 'team-sanitation-ward3',
      name: 'Team 2 — Sanitation & Waste',
      department: 'Sanitation & Waste',
      wardId: ward3.id,
      teamLeaderId: staffAnjali.id,
      status: 'ON_ASSIGNMENT',
    },
  });

  const team3 = await prisma.team.upsert({
    where: { id: 'team-streetlights-ward3' },
    update: {},
    create: {
      id: 'team-streetlights-ward3',
      name: 'Team 3 — Streetlights & Electrical',
      department: 'Streetlights & Electrical',
      wardId: ward3.id,
      teamLeaderId: staffRajesh.id,
      status: 'AVAILABLE',
    },
  });

  const team4 = await prisma.team.upsert({
    where: { id: 'team-general-ward3' },
    update: {},
    create: {
      id: 'team-general-ward3',
      name: 'Team 4 — General Maintenance',
      department: 'General Maintenance',
      wardId: ward3.id,
      status: 'BUSY',
    },
  });

  // Link staff to teams
  await prisma.user.update({ where: { id: wardStaff.id }, data: { teamId: team1.id } });
  await prisma.user.update({ where: { id: staffAnjali.id }, data: { teamId: team2.id } });
  await prisma.user.update({ where: { id: staffRajesh.id }, data: { teamId: team3.id } });

  console.log(`   ✓ 4 teams created for Ward 3`);

  // ═══════════════════════════════════════════
  // 4. ISSUES
  // ═══════════════════════════════════════════
  console.log('📋 Creating issues...');

  const issueData = [
    {
      issueNumber: 'CP-1001', title: 'Large pothole on Mira-Bhayandar Road near Jangid Complex',
      description: 'Deep pothole approximately 2 feet wide near Jangid Complex, causing accidents. Multiple vehicles have been damaged. Needs immediate filling and road repair.',
      category: 'ROADS' as const, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const,
      latitude: 19.2812, longitude: 72.8544, address: 'Mira-Bhayandar Road, near Jangid Complex, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team1.id, assignedStaffId: wardStaff.id,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1002', title: 'Garbage overflow at Shanti Park community bin',
      description: 'Community waste bin has been overflowing for 3 days. Stray animals are scattering garbage across the street. Residents have complained about the smell and health hazards.',
      category: 'WASTE' as const, priority: 'HIGH' as const, status: 'ASSIGNED' as const,
      latitude: 19.2756, longitude: 72.8498, address: 'Shanti Park, Sector 7, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team2.id, assignedStaffId: staffAnjali.id,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1003', title: 'Streetlight not working on Maxus Mall Road',
      description: 'Three consecutive streetlights are not functioning on the stretch near Maxus Mall. This creates a safety hazard for pedestrians and vehicles at night.',
      category: 'STREETLIGHT' as const, priority: 'MEDIUM' as const, status: 'NEW' as const,
      latitude: 19.2834, longitude: 72.8562, address: 'Maxus Mall Road, Bhayandar West, Ward 3',
      reportedBy: citizen.id,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1004', title: 'Water supply disruption in Sector 11',
      description: 'No water supply for the past 24 hours in the entire Sector 11 residential area. Over 200 families are affected.',
      category: 'WATER_SUPPLY' as const, priority: 'CRITICAL' as const, status: 'IN_PROGRESS' as const,
      latitude: 19.2789, longitude: 72.8521, address: 'Sector 11, Mira Road East, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1005', title: 'Drainage blockage causing waterlogging near Mira Road Station',
      description: 'Severe drain blockage causing knee-deep waterlogging during rain near the east exit of Mira Road railway station. Commuters cannot walk to auto stands.',
      category: 'DRAINAGE' as const, priority: 'HIGH' as const, status: 'RESOLUTION_SUBMITTED' as const,
      latitude: 19.2815, longitude: 72.8537, address: 'Near Mira Road Station East Exit, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      resolvedAt: null,
    },
    {
      issueNumber: 'CP-1006', title: 'Broken road divider on SH 42',
      description: 'Road divider is broken at two points on State Highway 42 near the petrol pump. Vehicles are crossing over illegally, creating accident risk.',
      category: 'ROADS' as const, priority: 'MEDIUM' as const, status: 'RESOLVED' as const,
      latitude: 19.2801, longitude: 72.8555, address: 'SH 42, near Indian Oil Petrol Pump, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team1.id, assignedStaffId: wardStaff.id,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1007', title: 'Illegal parking on footpath near market area',
      description: 'Vehicles are regularly parked on the footpath outside the vegetable market, forcing pedestrians to walk on the main road.',
      category: 'TRAFFIC' as const, priority: 'LOW' as const, status: 'ASSIGNED' as const,
      latitude: 19.2778, longitude: 72.8510, address: 'Vegetable Market, Sector 5, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1008', title: 'Open manhole on residential lane',
      description: 'Manhole cover is missing on a residential lane near Sunrise Heights. This is extremely dangerous, especially at night. A child almost fell in yesterday.',
      category: 'PUBLIC_SAFETY' as const, priority: 'CRITICAL' as const, status: 'IN_PROGRESS' as const,
      latitude: 19.2792, longitude: 72.8530, address: 'Lane 4, Sunrise Heights, Sector 9, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1009', title: 'Road resurfacing needed on Penkarpada Road',
      description: 'The entire stretch of Penkarpada Road has deteriorated. Multiple potholes, uneven surface, and broken edges make it hazardous for two-wheelers.',
      category: 'ROADS' as const, priority: 'MEDIUM' as const, status: 'NEW' as const,
      latitude: 19.2825, longitude: 72.8541, address: 'Penkarpada Road, Ward 3',
      reportedBy: citizen.id,
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1010', title: 'Waste not collected from residential societies for 4 days',
      description: 'Door-to-door waste collection has stopped in Rainbow Towers and Silver Creek societies. Over 500 flats are affected. Garbage is piling up in common areas.',
      category: 'WASTE' as const, priority: 'HIGH' as const, status: 'RESOLVED' as const,
      latitude: 19.2770, longitude: 72.8505, address: 'Rainbow Towers, Silver Creek, Sector 8, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team2.id, assignedStaffId: staffAnjali.id,
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1011', title: 'Flickering streetlights near school zone',
      description: 'Streetlights near Shri Saraswati School are flickering constantly. Parents are concerned about children\'s safety during evening tuitions.',
      category: 'STREETLIGHT' as const, priority: 'MEDIUM' as const, status: 'ASSIGNED' as const,
      latitude: 19.2805, longitude: 72.8548, address: 'Near Shri Saraswati School, Sector 6, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team3.id, assignedStaffId: staffRajesh.id,
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1012', title: 'Low water pressure in Bhayandar East',
      description: 'Water pressure has been extremely low in floors above 3rd in all buildings in Sector 12. Residents on higher floors get no water during peak hours.',
      category: 'WATER_SUPPLY' as const, priority: 'HIGH' as const, status: 'ON_HOLD' as const,
      latitude: 19.2798, longitude: 72.8528, address: 'Sector 12, Bhayandar East, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1013', title: 'Traffic signal malfunction at Kashimira Junction',
      description: 'Traffic signal at Kashimira Junction is stuck on green for all directions. This has caused multiple near-accidents. Traffic constable has been managing manually.',
      category: 'TRAFFIC' as const, priority: 'CRITICAL' as const, status: 'RESOLVED' as const,
      latitude: 19.2830, longitude: 72.8560, address: 'Kashimira Junction, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team3.id,
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1014', title: 'Stagnant water breeding mosquitoes near nallah',
      description: 'Stagnant water has accumulated near the open nallah (drainage channel) behind Paradise Apartments. Residents report increased mosquito breeding and dengue concerns.',
      category: 'DRAINAGE' as const, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const,
      latitude: 19.2785, longitude: 72.8515, address: 'Behind Paradise Apartments, Sector 10, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team2.id,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1015', title: 'Damaged footpath tiles in commercial area',
      description: 'Footpath tiles are broken and uneven outside the shopping complex on Station Road. Senior citizens and wheelchair users cannot navigate safely.',
      category: 'ROADS' as const, priority: 'LOW' as const, status: 'NEW' as const,
      latitude: 19.2810, longitude: 72.8540, address: 'Station Road Shopping Complex, Ward 3',
      reportedBy: citizen.id,
      dueAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1016', title: 'Construction debris dumped on public road',
      description: 'Large piles of construction debris have been dumped on the main road near Green Meadows society. This is blocking one lane of traffic.',
      category: 'WASTE' as const, priority: 'MEDIUM' as const, status: 'VERIFICATION_PENDING' as const,
      latitude: 19.2795, longitude: 72.8525, address: 'Near Green Meadows Society, Sector 7, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team2.id, assignedStaffId: staffAnjali.id,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1017', title: 'Burst water pipe flooding road',
      description: 'A major water pipeline has burst on the main road near Suresh Baug. Water is flooding the entire road for the past 6 hours. Traffic is completely disrupted.',
      category: 'WATER_SUPPLY' as const, priority: 'CRITICAL' as const, status: 'RESOLVED' as const,
      latitude: 19.2820, longitude: 72.8550, address: 'Near Suresh Baug, Main Road, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team4.id,
      resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1018', title: 'Public park bench broken and rusted',
      description: 'Two benches in the children\'s park at Sector 3 are broken and have sharp rusted edges. This is dangerous for children playing in the park.',
      category: 'OTHER' as const, priority: 'LOW' as const, status: 'ASSIGNED' as const,
      latitude: 19.2775, longitude: 72.8508, address: 'Children\'s Park, Sector 3, Ward 3',
      reportedBy: citizen2.id, assignedTeamId: team4.id,
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1019', title: 'Tree fallen blocking residential road',
      description: 'A large banyan tree has fallen across the road in Lane 2, blocking access to 15 residential buildings. Emergency removal required.',
      category: 'PUBLIC_SAFETY' as const, priority: 'CRITICAL' as const, status: 'IN_PROGRESS' as const,
      latitude: 19.2808, longitude: 72.8545, address: 'Lane 2, Sector 4, Ward 3',
      reportedBy: citizen.id, assignedTeamId: team1.id, assignedStaffId: wardStaff.id,
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      issueNumber: 'CP-1020', title: 'Damaged storm drain cover on main road',
      description: 'Storm drain cover is cracked and partially collapsed on the busy section of Kashimira Road. Heavy vehicles passing over it may cause it to break completely.',
      category: 'DRAINAGE' as const, priority: 'HIGH' as const, status: 'NEW' as const,
      latitude: 19.2835, longitude: 72.8558, address: 'Kashimira Road, Ward 3',
      reportedBy: citizen2.id,
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const data of issueData) {
    await prisma.issue.upsert({
      where: { issueNumber: data.issueNumber },
      update: {},
      create: {
        ...data,
        wardId: ward3.id,
      },
    });
  }

  console.log(`   ✓ ${issueData.length} issues seeded for Ward 3`);

  // ═══════════════════════════════════════════
  // 5. STATUS HISTORY for seeded issues
  // ═══════════════════════════════════════════
  console.log('📊 Creating status history...');
  const allIssues = await prisma.issue.findMany({ where: { wardId: ward3.id } });

  for (const issue of allIssues) {
    const existingHistory = await prisma.issueStatusHistory.findFirst({ where: { issueId: issue.id } });
    if (!existingHistory) {
      await prisma.issueStatusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: 'NEW',
          newStatus: issue.status,
          changedBy: wardStaff.id,
          note: 'Initial status set during system setup',
        },
      });
    }
  }
  console.log(`   ✓ Status history created for ${allIssues.length} issues`);

  // ═══════════════════════════════════════════
  // 6. SAMPLE COMMENTS
  // ═══════════════════════════════════════════
  console.log('💬 Creating sample comments...');
  const issue1 = allIssues.find(i => i.issueNumber === 'CP-1001');
  if (issue1) {
    await prisma.issueComment.createMany({
      data: [
        {
          issueId: issue1.id,
          userId: wardStaff.id,
          comment: 'Site inspection completed. Pothole is approximately 2x1.5 feet, 8 inches deep. Material ordered for repair.',
          visibility: 'CITIZEN_VISIBLE',
        },
        {
          issueId: issue1.id,
          userId: wardStaff.id,
          comment: 'Internal note: Need JCB for surrounding asphalt removal before filling. Estimated completion by Friday.',
          visibility: 'INTERNAL',
        },
        {
          issueId: issue1.id,
          userId: citizen.id,
          comment: 'Thank you for looking into this. The pothole has gotten bigger after yesterday\'s rain. Please prioritize.',
          visibility: 'CITIZEN_VISIBLE',
        },
      ],
      skipDuplicates: true,
    });
  }
  console.log('   ✓ Sample comments created');

  // ═══════════════════════════════════════════
  // 7. SAMPLE NOTIFICATIONS
  // ═══════════════════════════════════════════
  console.log('🔔 Creating sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: wardStaff.id,
        type: 'ISSUE_ASSIGNED',
        title: 'New Issue Assigned: CP-1001',
        message: 'Large pothole on Mira-Bhayandar Road has been assigned to your team.',
        issueId: issue1?.id,
      },
      {
        userId: wardStaff.id,
        type: 'SLA_WARNING',
        title: 'SLA Warning: CP-1004',
        message: 'Issue CP-1004 (Water supply disruption) is approaching its SLA deadline.',
        issueId: allIssues.find(i => i.issueNumber === 'CP-1004')?.id,
      },
      {
        userId: citizen.id,
        type: 'STATUS_CHANGED',
        title: 'Issue CP-1001 Updated',
        message: 'Your reported issue "Large pothole on Mira-Bhayandar Road" is now In Progress.',
        issueId: issue1?.id,
      },
      {
        userId: citizen2.id,
        type: 'STATUS_CHANGED',
        title: 'Issue CP-1010 Resolved',
        message: 'Your reported issue "Waste not collected from residential societies" has been resolved.',
        issueId: allIssues.find(i => i.issueNumber === 'CP-1010')?.id,
        isRead: true,
      },
      {
        userId: wardStaff.id,
        type: 'ISSUE_ASSIGNED',
        title: 'Critical Issue: CP-1019',
        message: 'Tree fallen blocking residential road — requires immediate attention.',
        issueId: allIssues.find(i => i.issueNumber === 'CP-1019')?.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('   ✓ Sample notifications created');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('─────────────────────────────────────────');
  console.log('  Test Accounts:');
  console.log('  Citizen:    rohan.mehta@example.com / Password@123');
  console.log('  Ward Staff: sandeep.jadhav@mbmc.gov.in / Staff@123');
  console.log('  Admin:      admin@mbmc.gov.in / Admin@123');
  console.log('─────────────────────────────────────────\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
