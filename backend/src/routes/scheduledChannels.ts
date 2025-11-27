import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';

const router = Router();
const prisma = new PrismaClient();

// Get all scheduled channels
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const channels = await omeClient.getScheduledChannels();

    res.json({
      scheduledChannels: channels || []
    });
  } catch (error) {
    next(error);
  }
});

// Get scheduled channel by name
router.get('/:channelName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName } = req.params;

    const channel = await omeClient.getScheduledChannel(channelName);

    res.json({
      scheduledChannel: channel
    });
  } catch (error) {
    next(error);
  }
});

// Create scheduled channel
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, schedule } = req.body;

    if (!name || !schedule || !Array.isArray(schedule)) {
      throw new AppError('Name and schedule array are required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.createScheduledChannel(name, schedule);

    auditLog(req.user!.id, 'SCHEDULED_CHANNEL_CREATED', 'ScheduledChannel', { name }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Scheduled channel created successfully',
      scheduledChannel: result
    });
  } catch (error) {
    next(error);
  }
});

// Update scheduled channel
router.put('/:channelName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName } = req.params;
    const { schedule } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      throw new AppError('Schedule array is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.updateScheduledChannel(channelName, schedule);

    auditLog(req.user!.id, 'SCHEDULED_CHANNEL_UPDATED', 'ScheduledChannel', { channelName }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Scheduled channel updated successfully',
      scheduledChannel: result
    });
  } catch (error) {
    next(error);
  }
});

// Delete scheduled channel
router.delete('/:channelName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName } = req.params;

    await omeClient.deleteScheduledChannel(channelName);

    auditLog(req.user!.id, 'SCHEDULED_CHANNEL_DELETED', 'ScheduledChannel', { channelName }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Scheduled channel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as scheduledChannelsRouter };

