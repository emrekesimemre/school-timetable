import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import teachersRouter from './routes/teachers';
import gradesRouter from './routes/grades';
import subjectsRouter from './routes/subjects';
import classroomsRouter from './routes/classrooms';
import constraintsRouter from './routes/constraints';
import assignmentsRouter from './routes/assignments';
import settingsRouter from './routes/settings';
import generateRouter from './routes/generate';
import { errorHandler, notFound } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/teachers', teachersRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/classrooms', classroomsRouter);
app.use('/api/constraints', constraintsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/generate-timetable', generateRouter);
app.use('/api/timetable', generateRouter);

// ─── 404 & Error Handling ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 School Timetable API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Env: ${process.env.NODE_ENV ?? 'development'}\n`);
});

export default app;
