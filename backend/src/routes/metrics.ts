import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get stream metrics
router.get('/streams/:channelId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate, limit = '100' } = req.query;

    const where: any = { channelId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const metrics = await prisma.streamMetrics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

// Create stream metrics (typically called by background job)
router.post('/streams/:channelId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;
    const { bitrate, fps, resolution, viewers, uptime, metadata } = req.body;

    const metric = await prisma.streamMetrics.create({
      data: {
        channelId,
        bitrate,
        fps,
        resolution,
        viewers,
        uptime,
        metadata: metadata || {}
      }
    });

    res.status(201).json({
      message: 'Metrics recorded successfully',
      metric
    });
  } catch (error) {
    next(error);
  }
});

// Get dashboard statistics
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const [
      totalUsers,
      totalChannels,
      activeChannels,
      totalSchedules,
      activeSchedules,
      totalTasks,
      pendingTasks,
      totalScte35Markers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.channel.count(),
      prisma.channel.count({ where: { isActive: true } }),
      prisma.schedule.count(),
      prisma.schedule.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.scte35Marker.count()
    ]);

    res.json({
      statistics: {
        users: { total: totalUsers },
        channels: { total: totalChannels, active: activeChannels },
        schedules: { total: totalSchedules, active: activeSchedules },
        tasks: { total: totalTasks, pending: pendingTasks },
        scte35Markers: { total: totalScte35Markers }
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as metricsRouter };


