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
    const result = await omeClient.getScheduledChannels();
    // Handle different response formats from OME
    let channels = [];
    
    if (result && result.response) {
      // If response is wrapped
      if (Array.isArray(result.response)) {
        channels = result.response;
      } else if (result.response.scheduledChannels && Array.isArray(result.response.scheduledChannels)) {
        channels = result.response.scheduledChannels;
      } else if (typeof result.response === 'object' && result.response !== null) {
        // Try to extract array from object
        const keys = Object.keys(result.response);
        if (keys.length > 0 && Array.isArray(result.response[keys[0]])) {
          channels = result.response[keys[0]];
        }
      }
    } else if (Array.isArray(result)) {
      channels = result;
    } else if (result && result.scheduledChannels && Array.isArray(result.scheduledChannels)) {
      channels = result.scheduledChannels;
    }

    // Ensure each channel has a schedule array
    channels = channels.map((ch: any) => ({
      ...ch,
      schedule: Array.isArray(ch.schedule) ? ch.schedule : []
    }));

    res.json({
      scheduledChannels: channels
    });
  } catch (error) {
    next(error);
  }
});

// Get scheduled channel by name
router.get('/:channelName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName } = req.params;

    const result = await omeClient.getScheduledChannel(channelName);
    // Handle different response formats
    let channel = null;
    
    if (result && result.response) {
      channel = result.response;
    } else if (result && typeof result === 'object') {
      channel = result;
    }

    // Ensure schedule is always an array
    if (channel && !Array.isArray(channel.schedule)) {
      channel.schedule = [];
    }

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
    const { stream, fallbackProgram, programs } = req.body;

    if (!stream || !programs || !Array.isArray(programs)) {
      throw new AppError('Stream configuration and programs array are required', 400, 'VALIDATION_ERROR');
    }

    const channelData = {
      stream,
      fallbackProgram,
      programs
    };

    const channelName = stream.name || req.body.name;
    const result = await omeClient.createScheduledChannel(channelName, channelData);

    auditLog(req.user!.id, 'SCHEDULED_CHANNEL_CREATED', 'ScheduledChannel', { name: channelName }, req.ip, req.get('user-agent'));

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
    const { fallbackProgram, programs } = req.body;

    if (!programs || !Array.isArray(programs)) {
      throw new AppError('Programs array is required', 400, 'VALIDATION_ERROR');
    }

    const updateData = {
      fallbackProgram,
      programs
    };

    const result = await omeClient.updateScheduledChannel(channelName, updateData);

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

