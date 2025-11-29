import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';
import { logger } from '../utils/logger';
import { outputUrlService } from '../services/outputUrlService';

const router = Router();
const prisma = new PrismaClient();

// Get all streams from OME
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const streams = await omeClient.getStreams();
    
    // Sync with database channels
    const dbChannels = await prisma.channel.findMany({
      where: { isActive: true }
    });

    res.json({
      streams: streams || [],
      channels: dbChannels
    });
  } catch (error) {
    next(error);
  }
});

// Get stream details
router.get('/:streamName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const stream = await omeClient.getStream(streamName);
    
    // Get metrics from OME
    let omeMetrics = null;
    try {
      omeMetrics = await omeClient.getMetrics(streamName);
    } catch (err) {
      // Metrics might not be available, continue without them
    }
    
    // Get metrics from database
    const dbMetrics = await prisma.streamMetrics.findMany({
      where: {
        channelId: streamName,
        timestamp: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Generate output URLs
    let outputUrls = null;
    let outputProfiles: string[] = [];
    try {
      // Try to get output profiles from OME
      const profiles = await omeClient.getOutputProfiles();
      outputProfiles = profiles?.outputProfiles?.map((p: any) => p.name) || [];
      outputUrls = outputUrlService.generateOutputUrls(streamName, outputProfiles);
    } catch (err) {
      // If profiles not available, generate URLs without profiles
      outputUrls = outputUrlService.generateOutputUrls(streamName);
    }

    res.json({
      stream,
      omeMetrics,
      metrics: dbMetrics,
      outputs: outputUrls
    });
  } catch (error) {
    next(error);
  }
});

// Get stream output URLs
router.get('/:streamName/outputs', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    
    // Get output profiles from OME
    let outputProfiles: string[] = [];
    try {
      const profiles = await omeClient.getOutputProfiles();
      outputProfiles = profiles?.outputProfiles?.map((p: any) => p.name) || [];
    } catch (err) {
      logger.warn('Could not fetch output profiles, using default URLs only', { streamName });
    }

    // Generate all output URLs
    const outputs = outputUrlService.generateOutputUrls(streamName, outputProfiles.length > 0 ? outputProfiles : undefined);

    res.json({
      streamName,
      outputs
    });
  } catch (error) {
    next(error);
  }
});

// Start stream
router.post('/:channelId/start', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;
    
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    // Update channel status
    await prisma.channel.update({
      where: { id: channelId },
      data: { isActive: true }
    });

    // Check for distributors with auto-preroll enabled
    const distributors = await prisma.distributor.findMany({
      where: {
        channelId: channelId,
        isActive: true,
        autoPreroll: true,
        type: 'HLS_MPD',
        prerollMarkerId: { not: null }
      },
      include: {
        prerollMarker: true
      }
    });

    // Insert preroll markers for HLS/MPD distributors
    for (const distributor of distributors) {
      if (distributor.prerollMarker) {
        try {
          const streamName = channel.name || channelId;
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
          logger.info('Auto-preroll marker inserted', {
            distributorId: distributor.id,
            markerId: distributor.prerollMarker.id
          });
        } catch (error: any) {
          logger.warn('Failed to insert auto-preroll marker', {
            distributorId: distributor.id,
            error: error.message
          });
        }
      }
    }

    // Note: OME streams are typically started by external encoders/ingest sources
    // This endpoint marks the channel as active in our system
    // The actual stream should be ingested to OME using the channel's stream key
    // SCTE-35 markers will appear in HLS/LLHLS playlists and SRT streams
    
    auditLog(req.user!.id, 'STREAM_STARTED', 'Stream', { channelId, channelName: channel.name }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Stream started successfully',
      channel: {
        ...channel,
        isActive: true
      },
      streamKey: channel.streamKey,
      prerollInserted: distributors.length > 0,
      note: 'Stream should be ingested to OME using the stream key above. SCTE-35 markers will appear in HLS/MPD and SRT outputs.'
    });
  } catch (error) {
    next(error);
  }
});

// Stop stream
router.post('/:channelId/stop', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;
    
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    // Try to stop the stream in OME if it exists
    try {
      const streamName = channel.name || channelId;
      const stream = await omeClient.getStream(streamName);
      if (stream) {
        // If stream exists, try to delete it (OME doesn't have explicit stop, deletion stops it)
        await omeClient.deleteStream(streamName);
      }
    } catch (err) {
      // Stream might not exist, continue with marking channel as inactive
    }

    // Update channel status
    await prisma.channel.update({
      where: { id: channelId },
      data: { isActive: false }
    });
    
    auditLog(req.user!.id, 'STREAM_STOPPED', 'Stream', { channelId, channelName: channel.name }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Stream stopped successfully',
      channel: {
        ...channel,
        isActive: false
      }
    });
  } catch (error) {
    next(error);
  }
});

// Insert SCTE-35 marker into stream
router.post('/:channelId/scte35', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelId } = req.params;
    const { markerId } = req.body;

    if (!markerId) {
      throw new AppError('Marker ID is required', 400, 'VALIDATION_ERROR');
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new AppError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    const marker = await prisma.scte35Marker.findUnique({
      where: { id: markerId }
    });

    if (!marker) {
      throw new AppError('SCTE-35 marker not found', 404, 'MARKER_NOT_FOUND');
    }

    // Prepare SCTE-35 marker data for OME
    const streamName = channel.name || channelId;
    const scte35Data = {
      id: marker.id,
      type: marker.type,
      duration: marker.duration,
      cueOut: marker.cueOut,
      cueIn: marker.cueIn,
      timeSignal: marker.timeSignal,
      spliceId: marker.spliceId,
      programId: marker.programId,
      outOfNetwork: marker.outOfNetwork,
      autoReturn: marker.autoReturn,
      breakDuration: marker.breakDuration,
      availNum: marker.availNum,
      availsExpected: marker.availsExpected,
      metadata: marker.metadata || {}
    };

    // Insert SCTE-35 marker into OME stream
    try {
      await omeClient.insertScte35(streamName, scte35Data);
    } catch (err: any) {
      // If stream doesn't exist or insertion fails, log but don't fail the request
      throw new AppError(
        `Failed to insert SCTE-35 marker: ${err.message || 'Stream may not be active'}`,
        400,
        'SCTE35_INSERTION_ERROR'
      );
    }
    
    auditLog(req.user!.id, 'SCTE35_INSERTED', 'Stream', { channelId, markerId, markerType: marker.type }, req.ip, req.get('user-agent'));

    res.json({
      message: 'SCTE-35 marker inserted successfully',
      marker,
      streamName
    });
  } catch (error) {
    next(error);
  }
});

export { router as streamsRouter };


