import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { createDistributorSchema, updateDistributorSchema } from '../utils/validation';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all distributors for a channel
router.get('/channel/:channelId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;

    const distributors = await prisma.distributor.findMany({
      where: { channelId },
      include: {
        prerollMarker: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ distributors });
  } catch (error) {
    next(error);
  }
});

// Get distributor by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            streamKey: true
          }
        },
        prerollMarker: true
      }
    });

    if (!distributor) {
      throw new AppError('Distributor not found', 404, 'DISTRIBUTOR_NOT_FOUND');
    }

    res.json({ distributor });
  } catch (error) {
    next(error);
  }
});

// Create distributor
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(createDistributorSchema)(req.body);

    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    // If preroll marker is specified, verify it exists
    if (data.prerollMarkerId) {
      const marker = await prisma.scte35Marker.findUnique({
        where: { id: data.prerollMarkerId }
      });
      if (!marker) {
        throw new AppError('Preroll marker not found', 404, 'MARKER_NOT_FOUND');
      }
    }

    const distributor = await prisma.distributor.create({
      data,
      include: {
        prerollMarker: true
      }
    });

    // Setup distributor output based on type
    if (distributor.isActive) {
      await setupDistributorOutput(distributor, channel);
    }

    auditLog(req.user!.id, 'DISTRIBUTOR_CREATED', 'Distributor', { distributorId: distributor.id, type: distributor.type }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Distributor created successfully',
      distributor
    });
  } catch (error) {
    next(error);
  }
});

// Update distributor
router.put('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(updateDistributorSchema)(req.body);

    const existingDistributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
      include: { channel: true }
    });

    if (!existingDistributor) {
      throw new AppError('Distributor not found', 404, 'DISTRIBUTOR_NOT_FOUND');
    }

    // If preroll marker is specified, verify it exists
    if (data.prerollMarkerId) {
      const marker = await prisma.scte35Marker.findUnique({
        where: { id: data.prerollMarkerId }
      });
      if (!marker) {
        throw new AppError('Preroll marker not found', 404, 'MARKER_NOT_FOUND');
      }
    }

    const distributor = await prisma.distributor.update({
      where: { id: req.params.id },
      data,
      include: {
        channel: true,
        prerollMarker: true
      }
    });

    // Update distributor output if active
    if (distributor.isActive) {
      await setupDistributorOutput(distributor, distributor.channel);
    }

    auditLog(req.user!.id, 'DISTRIBUTOR_UPDATED', 'Distributor', { distributorId: distributor.id, changes: data }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Distributor updated successfully',
      distributor
    });
  } catch (error) {
    next(error);
  }
});

// Delete distributor
router.delete('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id }
    });

    if (!distributor) {
      throw new AppError('Distributor not found', 404, 'DISTRIBUTOR_NOT_FOUND');
    }

    // Stop SRT push publishing if active
    if (distributor.type === 'SRT' && distributor.isActive) {
      try {
        const pushStatus = await omeClient.getPushPublishingStatus(distributor.channelId);
        if (pushStatus?.items) {
          for (const item of pushStatus.items) {
            if (item.url === distributor.srtEndpoint) {
              await omeClient.stopPushPublishing(distributor.channelId, item.id);
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to stop SRT push publishing', { error });
      }
    }

    await prisma.distributor.delete({
      where: { id: req.params.id }
    });

    auditLog(req.user!.id, 'DISTRIBUTOR_DELETED', 'Distributor', { distributorId: req.params.id }, req.ip, req.get('user-agent'));

    res.json({ message: 'Distributor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Insert preroll marker for HLS/MPD distributor
router.post('/:id/insert-preroll', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
      include: {
        channel: true,
        prerollMarker: true
      }
    });

    if (!distributor) {
      throw new AppError('Distributor not found', 404, 'DISTRIBUTOR_NOT_FOUND');
    }

    if (distributor.type !== 'HLS_MPD') {
      throw new AppError('Preroll insertion is only available for HLS/MPD distributors', 400, 'INVALID_DISTRIBUTOR_TYPE');
    }

    if (!distributor.prerollMarker) {
      throw new AppError('No preroll marker configured for this distributor', 400, 'NO_PREROLL_MARKER');
    }

    // Insert SCTE-35 preroll marker into stream
    const streamName = distributor.channel.name || distributor.channel.id;
    const scte35Data = {
      id: distributor.prerollMarker.id,
      type: distributor.prerollMarker.type,
      duration: distributor.prerollMarker.duration,
      cueOut: distributor.prerollMarker.cueOut,
      cueIn: distributor.prerollMarker.cueIn,
      timeSignal: distributor.prerollMarker.timeSignal,
      spliceId: distributor.prerollMarker.spliceId,
      programId: distributor.prerollMarker.programId,
      outOfNetwork: distributor.prerollMarker.outOfNetwork,
      autoReturn: distributor.prerollMarker.autoReturn,
      breakDuration: distributor.prerollMarker.breakDuration,
      availNum: distributor.prerollMarker.availNum,
      availsExpected: distributor.prerollMarker.availsExpected,
      metadata: distributor.prerollMarker.metadata || {}
    };

    await omeClient.insertScte35(streamName, scte35Data);

    auditLog(req.user!.id, 'PREROLL_INSERTED', 'Distributor', { distributorId: distributor.id, markerId: distributor.prerollMarker.id }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Preroll marker inserted successfully',
      distributor,
      marker: distributor.prerollMarker
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to setup distributor output
async function setupDistributorOutput(distributor: any, channel: any) {
  try {
    if (distributor.type === 'SRT') {
      // Start SRT push publishing with SCTE-35 support
      if (distributor.srtEndpoint && distributor.srtStreamKey) {
        await omeClient.startPushPublishing(
          channel.streamKey,
          'srt',
          distributor.srtEndpoint,
          distributor.srtStreamKey
        );
        logger.info('SRT push publishing started for distributor', {
          distributorId: distributor.id,
          endpoint: distributor.srtEndpoint
        });
      }
    } else if (distributor.type === 'HLS_MPD') {
      // HLS/MPD output is automatically available via OME
      // SCTE-35 markers inserted via API will appear in HLS playlists
      // For automatic preroll, we'll insert it when stream starts
      if (distributor.autoPreroll && distributor.prerollMarker) {
        // This will be handled by stream start monitoring
        logger.info('HLS/MPD distributor configured with auto-preroll', {
          distributorId: distributor.id
        });
      }
    }
  } catch (error: any) {
    logger.error('Failed to setup distributor output', {
      distributorId: distributor.id,
      error: error.message
    });
    throw error;
  }
}

export { router as distributorsRouter };

