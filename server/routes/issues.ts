import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Helper to safely extract string param from Express 5
const paramId = (req: AuthRequest): string => paramId(req) as string;

// ─── GET /api/issues ───
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const priority = req.query.priority as string | undefined;
    const wardId = req.query.wardId as string | undefined;
    const search = req.query.search as string | undefined;
    const assignedToMe = req.query.assignedToMe as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where: any = {};

    // Ward staff can only see their ward's issues
    if (req.user!.role === 'WARD_STAFF') {
      const staffUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (staffUser?.wardId) where.wardId = staffUser.wardId;
    }

    // Citizens see only their own issues
    if (req.user!.role === 'CITIZEN') {
      where.reportedBy = req.user!.userId;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (wardId && req.user!.role === 'SUPER_ADMIN') where.wardId = wardId;

    if (assignedToMe === 'true') {
      where.assignedStaffId = req.user!.userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { issueNumber: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          ward: { select: { name: true, wardNumber: true } },
          reporter: { select: { id: true, name: true, email: true, profileImage: true } },
          assignedTeam: { select: { id: true, name: true, department: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
          attachments: { select: { id: true, fileUrl: true, fileType: true } },
          _count: { select: { comments: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// ─── GET /api/issues/:id ───
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issue: any = await prisma.issue.findUnique({
      where: { id: paramId(req) },
      include: {
        ward: true,
        reporter: { select: { id: true, name: true, email: true, phone: true, profileImage: true } },
        assignedTeam: { select: { id: true, name: true, department: true, status: true } },
        assignedStaff: { select: { id: true, name: true, email: true, profileImage: true } },
        attachments: true,
        statusHistory: {
          include: { changer: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' as const },
        },
        comments: {
          include: { author: { select: { id: true, name: true, role: true, profileImage: true } } },
          orderBy: { createdAt: 'desc' as const },
        },
        assignments: {
          include: {
            staff: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
            assigner: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: 'desc' as const },
        },
      },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Citizens can only see citizen-visible comments
    if (req.user!.role === 'CITIZEN') {
      issue.comments = issue.comments.filter((c: any) => c.visibility === 'CITIZEN_VISIBLE');
    }

    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// ─── POST /api/issues ───
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority, latitude, longitude, address, wardId } = req.body;

    if (!title || !description || !category || !latitude || !longitude || !address || !wardId) {
      res.status(400).json({ error: 'Missing required fields: title, description, category, latitude, longitude, address, wardId' });
      return;
    }

    const count = await prisma.issue.count();
    const issueNumber = `CP-${(1000 + count + 1).toString()}`;

    const issue = await prisma.issue.create({
      data: {
        issueNumber,
        title,
        description,
        category,
        priority: priority || 'MEDIUM',
        status: 'NEW',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        wardId,
        reportedBy: req.user!.userId,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        ward: { select: { name: true, wardNumber: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.issueStatusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: 'NEW',
        newStatus: 'NEW',
        changedBy: req.user!.userId,
        note: 'Issue reported by citizen',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ISSUE_CREATED',
        entityType: 'ISSUE',
        entityId: issue.id,
        metadata: { issueNumber, category, wardId },
      },
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// ─── PATCH /api/issues/:id/status ───
router.patch('/:id/status', authenticateToken, requireRole('WARD_STAFF', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const issue = await prisma.issue.findUnique({ where: { id: paramId(req) } });
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const updateData: any = { status };
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();

    const updated = await prisma.issue.update({
      where: { id: paramId(req) },
      data: updateData,
      include: {
        ward: { select: { name: true, wardNumber: true } },
        assignedTeam: { select: { id: true, name: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    await prisma.issueStatusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: issue.status,
        newStatus: status,
        changedBy: req.user!.userId,
        note: note || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: issue.reportedBy,
        type: 'STATUS_CHANGED',
        title: `Issue ${issue.issueNumber} status updated`,
        message: `Your issue "${issue.title}" status changed to ${status}`,
        issueId: issue.id,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ─── PATCH /api/issues/:id/assign ───
router.patch('/:id/assign', authenticateToken, requireRole('WARD_STAFF', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, staffId, reason } = req.body;

    if (!teamId && !staffId) {
      res.status(400).json({ error: 'teamId or staffId is required' });
      return;
    }

    const issue = await prisma.issue.findUnique({ where: { id: paramId(req) } });
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const updated = await prisma.issue.update({
      where: { id: paramId(req) },
      data: {
        assignedTeamId: teamId || issue.assignedTeamId,
        assignedStaffId: staffId || issue.assignedStaffId,
        status: issue.status === 'NEW' ? 'ASSIGNED' : issue.status,
      },
      include: {
        ward: { select: { name: true, wardNumber: true } },
        assignedTeam: { select: { id: true, name: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    await prisma.issueAssignment.create({
      data: {
        issueId: issue.id,
        teamId: teamId || null,
        staffId: staffId || null,
        assignedBy: req.user!.userId,
        reason: reason || null,
      },
    });

    if (issue.status === 'NEW') {
      await prisma.issueStatusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: issue.status,
          newStatus: 'ASSIGNED',
          changedBy: req.user!.userId,
          note: 'Issue assigned to team/staff',
        },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({ error: 'Failed to assign issue' });
  }
});

// ─── POST /api/issues/:id/comments ───
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { comment, visibility } = req.body;

    if (!comment) {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const issue = await prisma.issue.findUnique({ where: { id: paramId(req) } });
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const newComment = await prisma.issueComment.create({
      data: {
        issueId: paramId(req),
        userId: req.user!.userId,
        comment,
        visibility: visibility || 'CITIZEN_VISIBLE',
      },
      include: {
        author: { select: { id: true, name: true, role: true, profileImage: true } },
      },
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
