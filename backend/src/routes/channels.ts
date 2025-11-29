import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { createChannelSchema, updateChannelSchema } from '../utils/validation';
import { auditLog } from '../utils/auditLog';
import { randomUUID } from 'crypto';
import { scheduledChannelService } from '../services/scheduledChannelService';
import { logger } from '../utils/logger';
import { outputUrlService } from '../services/outputUrlService';
import { omeClient } from '../utils/omeClient';

const router = Router();
const prisma = new PrismaClient();

// Get all channels
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50', isActive, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        include: {
          _count: {
            select: { schedules: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.channel.count({ where })
    ]);

    res.json({
      channels,
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

// Get channel by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: req.params.id },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' }
        },
        distributors: {
          where: { isActive: true }
        }
      }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    res.json({ channel });
  } catch (error) {
    next(error);
  }
});

// Get channel output URLs
router.get('/:id/outputs', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: req.params.id },
      include: {
        distributors: {
          where: { isActive: true },
          include: {
            prerollMarker: true
          }
        }
      }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    // Use streamKey or channel name for URL generation
    const streamName = channel.streamKey || channel.name;
    const appName = channel.appName || 'app';

    // Get output profiles from OME
    let outputProfiles: string[] = [];
    try {
      const profiles = await omeClient.getOutputProfiles(channel.appName || 'app');
      outputProfiles = profiles?.outputProfiles?.map((p: any) => p.name) || [];
    } catch (err) {
      logger.warn('Could not fetch output profiles', { channelId: channel.id });
    }

    // Generate OME output URLs using channel's appName
    const omeOutputs = outputUrlService.generateOutputUrls(streamName, outputProfiles.length > 0 ? outputProfiles : undefined, appName);

    // Get distributor URLs (CDN/manual URLs)
    const distributorUrls = channel.distributors.map((dist) => ({
      id: dist.id,
      name: dist.name,
      type: dist.type,
      hlsUrl: dist.hlsUrl,
      mpdUrl: dist.mpdUrl,
      srtEndpoint: dist.srtEndpoint,
      srtStreamKey: dist.srtStreamKey,
    }));

    res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        streamKey: channel.streamKey,
        isActive: channel.isActive
      },
      outputs: omeOutputs,
      distributors: distributorUrls
    });
  } catch (error) {
    next(error);
  }
});

// Create channel
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    logger.info('Creating channel', { body: req.body });
    const data = validateRequest(createChannelSchema)(req.body);
    logger.info('Channel data validated', { data });
    
    // Check if streamKey already exists
    const existingChannel = await prisma.channel.findFirst({
      where: { streamKey: data.streamKey }
    });
    if (existingChannel) {
      throw new AppError('Stream key already exists', 400, 'STREAM_KEY_EXISTS');
    }

    const channel = await prisma.channel.create({
      data
    });

    // Setup OME scheduled channel with VOD fallback if enabled
    if (channel.vodFallbackEnabled) {
      try {
        await scheduledChannelService.setupChannelWithVodFallback(channel);
      } catch (error: any) {
        logger.warn('Failed to setup scheduled channel, but channel was created', {
          channelId: channel.id,
          error: error.message
        });
      }
    }

    auditLog(req.user!.id, 'CHANNEL_CREATED', 'Channel', { channelId: channel.id }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });
  } catch (error) {
    next(error);
  }
});

// Update channel
router.put('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(updateChannelSchema)(req.body);

    const existingChannel = await prisma.channel.findUnique({
      where: { id: req.params.id }
    });

    if (!existingChannel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    // Check if streamKey is being updated and if it already exists
    if (data.streamKey && data.streamKey !== existingChannel.streamKey) {
      const duplicateChannel = await prisma.channel.findFirst({
        where: { 
          streamKey: data.streamKey,
          id: { not: req.params.id }
        }
      });
      if (duplicateChannel) {
        throw new AppError('Stream key already exists', 400, 'STREAM_KEY_EXISTS');
      }
    }

    const channel = await prisma.channel.update({
      where: { id: req.params.id },
      data
    });

    // Update OME scheduled channel with VOD fallback if enabled
    try {
      await scheduledChannelService.handleChannelUpdate(channel);
    } catch (error: any) {
      logger.warn('Failed to update scheduled channel', {
        channelId: channel.id,
        error: error.message
      });
    }

    auditLog(req.user!.id, 'CHANNEL_UPDATED', 'Channel', { channelId: channel.id, changes: data }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Channel updated successfully',
      channel
    });
  } catch (error) {
    next(error);
  }
});

// Delete channel
router.delete('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: req.params.id }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    await prisma.channel.delete({
      where: { id: req.params.id }
    });

    auditLog(req.user!.id, 'CHANNEL_DELETED', 'Channel', { channelId: req.params.id }, req.ip, req.get('user-agent'));

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as channelsRouter };

