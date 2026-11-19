import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// ─── GET /api/wards ───
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { issues: true, users: true, teams: true },
        },
      },
      orderBy: { wardNumber: 'asc' },
    });

    res.json(wards);
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
});

// ─── GET /api/wards/:id/stats ───
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const ward = await prisma.ward.findUnique({ where: { id } });

    if (!ward) {
      res.status(404).json({ error: 'Ward not found' });
      return;
    }

    const [totalIssues, byStatus, byCategory, byPriority] = await Promise.all([
      prisma.issue.count({ where: { wardId: id } }),
      prisma.issue.groupBy({
        by: ['status'],
        where: { wardId: id },
        _count: true,
      }),
      prisma.issue.groupBy({
        by: ['category'],
        where: { wardId: id },
        _count: true,
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        where: { wardId: id },
        _count: true,
      }),
    ]);

    const resolved = byStatus.find(s => s.status === 'RESOLVED')?._count || 0;
    const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

    res.json({
      ward,
      stats: {
        totalIssues,
        resolved,
        resolutionRate,
        byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
        byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
        byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
      },
    });
  } catch (error) {
    console.error('Get ward stats error:', error);
    res.status(500).json({ error: 'Failed to fetch ward statistics' });
  }
});

export default router;
