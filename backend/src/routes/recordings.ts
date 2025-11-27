import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';

const router = Router();
const prisma = new PrismaClient();

// Start recording for a stream
router.post('/:streamName/start', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const { filePath, infoPath } = req.body;

    if (!filePath) {
      throw new AppError('File path is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.startRecording(streamName, filePath, infoPath);

    auditLog(req.user!.id, 'RECORDING_STARTED', 'Recording', { streamName, filePath }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Recording started successfully',
      streamName,
      filePath,
      infoPath: infoPath || filePath.replace('.ts', '.xml'),
      result
    });
  } catch (error) {
    next(error);
  }
});

// Stop recording for a stream
router.post('/:streamName/stop', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;

    const result = await omeClient.stopRecording(streamName);

    auditLog(req.user!.id, 'RECORDING_STOPPED', 'Recording', { streamName }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Recording stopped successfully',
      streamName,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Get recording status
router.get('/:streamName/status', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;

    const status = await omeClient.getRecordingStatus(streamName);

    res.json({
      streamName,
      recording: status
    });
  } catch (error) {
    next(error);
  }
});

export { router as recordingsRouter };

