import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import teamRoutes from './routes/teams';
import wardRoutes from './routes/wards';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Security & Parsing ───
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CivicPulse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// ─── 404 Handler ───
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║          CivicPulse API Server               ║
║──────────────────────────────────────────────║
║  Status:  Running                            ║
║  Port:    ${PORT}                                ║
║  Env:     ${process.env.NODE_ENV || 'development'}                       ║
║  Health:  http://localhost:${PORT}/health         ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
