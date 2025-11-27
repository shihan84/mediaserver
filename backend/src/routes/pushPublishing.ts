import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';

const router = Router();
const prisma = new PrismaClient();

// Start push publishing (re-streaming)
router.post('/:streamName/start', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const { protocol, url, streamKey } = req.body;

    if (!protocol || !url) {
      throw new AppError('Protocol and URL are required', 400, 'VALIDATION_ERROR');
    }

    if (!['srt', 'rtmp', 'mpegts'].includes(protocol.toLowerCase())) {
      throw new AppError('Protocol must be srt, rtmp, or mpegts', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.startPushPublishing(streamName, protocol, url, streamKey);

    auditLog(req.user!.id, 'PUSH_PUBLISHING_STARTED', 'PushPublishing', { streamName, protocol, url }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Push publishing started successfully',
      streamName,
      protocol,
      url,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Stop push publishing
router.post('/:streamName/stop/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName, id } = req.params;

    const result = await omeClient.stopPushPublishing(streamName, id);

    auditLog(req.user!.id, 'PUSH_PUBLISHING_STOPPED', 'PushPublishing', { streamName, id }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Push publishing stopped successfully',
      streamName,
      id,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Get push publishing status
router.get('/:streamName/status', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;

    const status = await omeClient.getPushPublishingStatus(streamName);

    res.json({
      streamName,
      pushPublishing: status
    });
  } catch (error) {
    next(error);
  }
});

export { router as pushPublishingRouter };

