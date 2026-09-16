import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import kategoriRoutes from './routes/kategori';
import kegiatanRutinRoutes from './routes/kegiatanRutin';
import kegiatanDinamisRoutes from './routes/kegiatanDinamis';
import calendarRoutes from './routes/calendar';
import iotRoutes from './routes/iot';
import analyticsRoutes from './routes/analytics';
import sharedRoutes from './routes/shared';
import magicPasteRoutes from './routes/magicPaste';
import scheduleMoveRoutes from './routes/scheduleMove';

// Initialize services
import './services/telegramBot';
import { startCronJobs } from './services/cronJobs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/shared', sharedRoutes);
app.use('/api/iot', iotRoutes);

// Protected routes (auth required)
app.use('/api/auth', authMiddleware, authRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use('/api/kategori', authMiddleware, kategoriRoutes);
app.use('/api/rutin', authMiddleware, kegiatanRutinRoutes);
app.use('/api/dinamis', authMiddleware, kegiatanDinamisRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/schedule', authMiddleware, magicPasteRoutes);
app.use('/api/schedule', authMiddleware, scheduleMoveRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
