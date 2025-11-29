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
    
    // Find channel by streamKey to get appName
    let channelAppName: string | undefined;
    let channel = null;
    try {
      channel = await prisma.channel.findFirst({
        where: { streamKey: streamName }
      });
      channelAppName = channel?.appName;
    } catch (err) {
      logger.warn('Could not find channel for stream', { streamName });
    }

    // Get enhanced metrics from OME
    let omeMetrics = null;
    let streamStats = null;
    let streamTracks = null;
    let streamStatistics = null;
    let streamHealth = null;
    let viewerCount = null;

    try {
      omeMetrics = await omeClient.getMetrics(streamName);
    } catch (err) {
      // Metrics might not be available, continue without them
    }

    try {
      streamStats = await omeClient.getStreamStats(streamName, 'default', channelAppName || 'app');
      streamTracks = await omeClient.getStreamTracks(streamName, 'default', channelAppName || 'app');
      streamStatistics = await omeClient.getStreamStatistics(streamName, 'default', channelAppName || 'app');
      streamHealth = await omeClient.getStreamHealth(streamName, 'default', channelAppName || 'app');
      viewerCount = await omeClient.getViewerCount(streamName, 'default', channelAppName || 'app');
    } catch (err) {
      logger.warn('Could not fetch enhanced metrics', { streamName, error: err });
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

    // Get recording status if available
    let recordingStatus = null;
    try {
      recordingStatus = await omeClient.getRecordingStatus(streamName);
    } catch (err) {
      // Recording might not be active
    }

    // Get push publishing status if available
    let pushPublishingStatus = null;
    try {
      pushPublishingStatus = await omeClient.getPushPublishingStatus(streamName);
    } catch (err) {
      // Push publishing might not be active
    }

    // Generate output URLs
    let outputUrls = null;
    let outputProfiles: string[] = [];
    try {
      // Try to get output profiles from OME
      const profiles = await omeClient.getOutputProfiles(channelAppName || 'app');
      outputProfiles = profiles?.outputProfiles?.map((p: any) => p.name) || [];
      outputUrls = outputUrlService.generateOutputUrls(streamName, outputProfiles, channelAppName);
    } catch (err) {
      // If profiles not available, generate URLs without profiles
      outputUrls = outputUrlService.generateOutputUrls(streamName, undefined, channelAppName);
    }

    res.json({
      stream,
      channel,
      omeMetrics,
      streamStats,
      streamTracks,
      streamStatistics,
      streamHealth,
      viewerCount,
      recordingStatus,
      pushPublishingStatus,
      metrics: dbMetrics,
      outputs: outputUrls
    });
  } catch (error) {
    next(error);
  }
});

// Get enhanced stream statistics
router.get('/:streamName/stats', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    
    // Find channel to get appName
    const channel = await prisma.channel.findFirst({
      where: { streamKey: streamName }
    });
    const appName = channel?.appName || 'app';

    const stats = await omeClient.getStreamStats(streamName, 'default', appName);
    
    res.json({
      streamName,
      stats: stats || null
    });
  } catch (error) {
    next(error);
  }
});

// Get stream tracks (video/audio details)
router.get('/:streamName/tracks', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    
    const channel = await prisma.channel.findFirst({
      where: { streamKey: streamName }
    });
    const appName = channel?.appName || 'app';

    const tracks = await omeClient.getStreamTracks(streamName, 'default', appName);
    
    res.json({
      streamName,
      tracks: tracks || null
    });
  } catch (error) {
    next(error);
  }
});

// Get stream health status
router.get('/:streamName/health', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    
    const channel = await prisma.channel.findFirst({
      where: { streamKey: streamName }
    });
    const appName = channel?.appName || 'app';

    const health = await omeClient.getStreamHealth(streamName, 'default', appName);
    
    res.json({
      streamName,
      health
    });
  } catch (error) {
    next(error);
  }
});

// Get viewer count per protocol
router.get('/:streamName/viewers', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    
    const channel = await prisma.channel.findFirst({
      where: { streamKey: streamName }
    });
    const appName = channel?.appName || 'app';

    const viewers = await omeClient.getViewerCount(streamName, 'default', appName);
    
    res.json({
      streamName,
      viewers: viewers || { total: 0, webrtc: 0, hls: 0, llhls: 0, dash: 0, srt: 0 }
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

// Get DVR status for a stream
router.get('/:streamName/dvr', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
    const dvrStatus = await omeClient.getDvrStatus(streamName, 'default', channel?.appName);
    res.json({
      streamName,
      dvr: dvrStatus
    });
  } catch (error) {
    next(error);
  }
});

// Get DVR configuration for application
router.get('/dvr/config/:appName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { appName } = req.params;
    const dvrConfig = await omeClient.getDvrConfiguration('default', appName);
    res.json({
      appName,
      dvrConfiguration: dvrConfig
    });
  } catch (error) {
    next(error);
  }
});

// Create signed policy for stream access
router.post('/:streamName/signed-policy', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const { expiresIn = 3600 } = req.body; // Default 1 hour
    const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
    
    const policy = await omeClient.createSignedPolicy(
      streamName,
      expiresIn,
      'default',
      channel?.appName
    );
    
    auditLog(req.user!.id, 'SIGNED_POLICY_CREATED', 'Security', { streamName, expiresIn }, req.ip, req.get('user-agent'));
    
    res.json({
      message: 'Signed policy created successfully',
      streamName,
      policy,
      expiresIn
    });
  } catch (error) {
    next(error);
  }
});

// Get admission webhooks configuration
router.get('/security/admission-webhooks', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName = 'default' } = req.query;
    const webhooks = await omeClient.getAdmissionWebhooks(vhostName as string);
    res.json({
      vhostName,
      admissionWebhooks: webhooks
    });
  } catch (error) {
    next(error);
  }
});

export { router as streamsRouter };


