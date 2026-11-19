import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// ─── GET /api/teams ───
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wardId = req.query.wardId as string | undefined;

    const where: any = {};
    
    if (req.user!.role === 'WARD_STAFF') {
      const staffUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (staffUser?.wardId) where.wardId = staffUser.wardId;
    } else if (wardId) {
      where.wardId = wardId;
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        ward: { select: { name: true, wardNumber: true } },
        teamLeader: { select: { id: true, name: true, email: true, profileImage: true } },
        members: { select: { id: true, name: true, email: true, profileImage: true } },
        _count: { select: { assignedIssues: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ─── PATCH /api/teams/:id/status ───
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const team = await prisma.team.update({
      where: { id: req.params.id as string },
      data: { status },
      include: {
        ward: { select: { name: true, wardNumber: true } },
        teamLeader: { select: { id: true, name: true } },
        _count: { select: { assignedIssues: true, members: true } },
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Update team status error:', error);
    res.status(500).json({ error: 'Failed to update team status' });
  }
});

export default router;
