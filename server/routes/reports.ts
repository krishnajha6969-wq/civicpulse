import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// ─── GET /api/reports/dashboard ───
// Summary stats for dashboard KPI cards
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wardId = req.query.wardId as string | undefined;

    const where: any = {};
    if (req.user!.role === 'WARD_STAFF') {
      const staffUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (staffUser?.wardId) where.wardId = staffUser.wardId;
    } else if (wardId) {
      where.wardId = wardId;
    }

    const [
      totalIssues,
      byStatus,
      byPriority,
      byCategory,
      overdueCount,
      recentIssues,
      resolvedThisMonth,
      newThisWeek,
    ] = await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.groupBy({ by: ['status'], where, _count: true }),
      prisma.issue.groupBy({ by: ['priority'], where, _count: true }),
      prisma.issue.groupBy({ by: ['category'], where, _count: true }),
      prisma.issue.count({
        where: {
          ...where,
          dueAt: { lt: new Date() },
          status: { notIn: ['RESOLVED', 'REJECTED'] },
        },
      }),
      prisma.issue.findMany({
        where,
        include: {
          reporter: { select: { name: true } },
          assignedTeam: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.issue.count({
        where: {
          ...where,
          status: 'RESOLVED',
          resolvedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.issue.count({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s._count]));
    const resolved = statusMap['RESOLVED'] || 0;
    const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

    res.json({
      kpis: {
        totalIssues,
        resolved,
        resolutionRate,
        pending: totalIssues - resolved - (statusMap['REJECTED'] || 0),
        overdue: overdueCount,
        newThisWeek,
        resolvedThisMonth,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        assigned: statusMap['ASSIGNED'] || 0,
      },
      byStatus: statusMap,
      byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
      recentIssues,
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ─── GET /api/reports/ward-analytics ───
router.get('/ward-analytics', authenticateToken, requireRole('WARD_STAFF', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wardId = req.query.wardId as string | undefined;

    const where: any = {};
    if (req.user!.role === 'WARD_STAFF') {
      const staffUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (staffUser?.wardId) where.wardId = staffUser.wardId;
    } else if (wardId) {
      where.wardId = wardId;
    }

    // Team performance
    const teams = await prisma.team.findMany({
      where: where.wardId ? { wardId: where.wardId } : {},
      include: {
        _count: { select: { assignedIssues: true, members: true } },
        assignedIssues: {
          select: { status: true, priority: true, createdAt: true, resolvedAt: true },
        },
      },
    });

    const teamPerformance = teams.map(team => {
      const issues = team.assignedIssues;
      const resolved = issues.filter(i => i.status === 'RESOLVED').length;
      const inProgress = issues.filter(i => i.status === 'IN_PROGRESS').length;
      const overdue = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'REJECTED').length;

      // Avg resolution time (days)
      const resolvedIssues = issues.filter(i => i.resolvedAt);
      const avgResolutionMs = resolvedIssues.length > 0
        ? resolvedIssues.reduce((sum, i) => sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()), 0) / resolvedIssues.length
        : 0;
      const avgResolutionDays = Math.round(avgResolutionMs / (1000 * 60 * 60 * 24) * 10) / 10;

      return {
        teamId: team.id,
        teamName: team.name,
        department: team.department,
        memberCount: team._count.members,
        totalAssigned: issues.length,
        resolved,
        inProgress,
        overdue,
        resolutionRate: issues.length > 0 ? Math.round((resolved / issues.length) * 100) : 0,
        avgResolutionDays,
        status: team.status,
      };
    });

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentIssues = await prisma.issue.findMany({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, resolvedAt: true, status: true },
    });

    const dailyTrend: { date: string; received: number; resolved: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const received = recentIssues.filter(issue => issue.createdAt.toISOString().split('T')[0] === dateStr).length;
      const resolved = recentIssues.filter(issue => issue.resolvedAt && issue.resolvedAt.toISOString().split('T')[0] === dateStr).length;
      dailyTrend.push({ date: dateStr, received, resolved });
    }

    res.json({
      teamPerformance,
      dailyTrend,
    });
  } catch (error) {
    console.error('Ward analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch ward analytics' });
  }
});

// ─── GET /api/reports/city-overview ───
router.get('/city-overview', authenticateToken, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { issues: true, teams: true, users: true } },
        issues: {
          select: { status: true, priority: true, category: true, createdAt: true },
        },
      },
      orderBy: { wardNumber: 'asc' },
    });

    const wardSummaries = wards.map(ward => {
      const resolved = ward.issues.filter(i => i.status === 'RESOLVED').length;
      return {
        id: ward.id,
        wardNumber: ward.wardNumber,
        name: ward.name,
        totalIssues: ward.issues.length,
        resolved,
        resolutionRate: ward.issues.length > 0 ? Math.round((resolved / ward.issues.length) * 100) : 0,
        teams: ward._count.teams,
        staff: ward._count.users,
      };
    });

    const totalIssues = wards.reduce((sum, w) => sum + w.issues.length, 0);
    const totalResolved = wards.reduce((sum, w) => sum + w.issues.filter(i => i.status === 'RESOLVED').length, 0);

    res.json({
      cityKpis: {
        totalWards: wards.length,
        totalIssues,
        totalResolved,
        overallResolutionRate: totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0,
      },
      wards: wardSummaries,
    });
  } catch (error) {
    console.error('City overview error:', error);
    res.status(500).json({ error: 'Failed to fetch city overview' });
  }
});

export default router;
