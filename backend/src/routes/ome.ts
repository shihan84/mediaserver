import { Router, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { omeClient } from '../utils/omeClient';

const router = Router();

// Get server statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await omeClient.getServerStats();

    res.json({
      stats
    });
  } catch (error) {
    next(error);
  }
});

// Get virtual hosts
router.get('/vhosts', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const vhosts = await omeClient.getVirtualHosts();

    res.json({
      virtualHosts: vhosts || []
    });
  } catch (error) {
    next(error);
  }
});

// Get virtual host details
router.get('/vhosts/:vhostName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName } = req.params;

    const vhost = await omeClient.getVirtualHost(vhostName);

    res.json({
      virtualHost: vhost
    });
  } catch (error) {
    next(error);
  }
});

// Get applications
router.get('/vhosts/:vhostName/apps', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName } = req.params;

    const apps = await omeClient.getApplications(vhostName);

    res.json({
      applications: apps || []
    });
  } catch (error) {
    next(error);
  }
});

// Get application details
router.get('/vhosts/:vhostName/apps/:appName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName } = req.params;

    const app = await omeClient.getApplication(vhostName, appName);

    res.json({
      application: app
    });
  } catch (error) {
    next(error);
  }
});

// Get output profiles (transcoding)
router.get('/vhosts/:vhostName/apps/:appName/outputProfiles', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName } = req.params;

    const profiles = await omeClient.getOutputProfiles(vhostName, appName);

    res.json({
      outputProfiles: profiles || []
    });
  } catch (error) {
    next(error);
  }
});

// Get thumbnail for stream
router.get('/streams/:streamName/thumbnail', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;

    const thumbnail = await omeClient.getThumbnail(streamName);

    res.json({
      streamName,
      thumbnail
    });
  } catch (error) {
    next(error);
  }
});

export { router as omeRouter };

