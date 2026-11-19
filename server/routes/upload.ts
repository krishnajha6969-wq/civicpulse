import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// ─── POST /api/upload ───
// Placeholder for file upload — in production, integrate with cloud storage (S3, GCS, Cloudinary)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In production, implement multer or busboy for file parsing
    // Then upload to cloud storage and return the URL
    res.status(501).json({
      error: 'File upload endpoint not yet configured',
      message: 'Configure cloud storage (S3/GCS/Cloudinary) and add multer middleware for file uploads',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
