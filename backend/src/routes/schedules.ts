import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { createScheduleSchema, updateScheduleSchema } from '../utils/validation';
import { auditLog } from '../utils/auditLog';

const router = Router();
const prisma = new PrismaClient();

// Get all schedules
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50', channelId, isActive, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (channelId) where.channelId = channelId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({ startTime: { gte: new Date(startDate as string) } });
      }
      if (endDate) {
        where.OR.push({ endTime: { lte: new Date(endDate as string) } });
      }
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.schedule.count({ where })
    ]);

    res.json({
      schedules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get schedule by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        channel: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

// Create schedule
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(createScheduleSchema)(req.body);
    const { startTime, endTime } = data;

    // Validate time range
    if (new Date(startTime) >= new Date(endTime)) {
      throw new AppError('End time must be after start time', 400, 'VALIDATION_ERROR');
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    const schedule = await prisma.schedule.create({
      data: {
        ...data,
        userId: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      },
      include: {
        channel: true
      }
    });

    auditLog(req.user!.id, 'SCHEDULE_CREATED', 'Schedule', { scheduleId: schedule.id, channelId: data.channelId }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
  } catch (error) {
    next(error);
  }
});

// Update schedule
router.put('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(updateScheduleSchema)(req.body);

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: req.params.id }
    });

    if (!existingSchedule) {
      throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    // Validate time range if both are provided
    if (data.startTime && data.endTime) {
      if (new Date(data.startTime) >= new Date(data.endTime)) {
        throw new AppError('End time must be after start time', 400, 'VALIDATION_ERROR');
      }
    }

    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        channel: true
      }
    });

    auditLog(req.user!.id, 'SCHEDULE_UPDATED', 'Schedule', { scheduleId: schedule.id, changes: data }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error) {
    next(error);
  }
});

// Delete schedule
router.delete('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id }
    });

    if (!schedule) {
      throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    await prisma.schedule.delete({
      where: { id: req.params.id }
    });

    auditLog(req.user!.id, 'SCHEDULE_DELETED', 'Schedule', { scheduleId: req.params.id }, req.ip, req.get('user-agent'));

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as schedulesRouter };


