import { Router, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { omeClient } from '../utils/omeClient';
import { auditLog } from '../utils/auditLog';

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

// Get single output profile
router.get('/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, profileName } = req.params;

    const profile = await omeClient.getOutputProfile(vhostName, appName, profileName);

    res.json({
      outputProfile: profile
    });
  } catch (error) {
    next(error);
  }
});

// Create output profile
router.post('/vhosts/:vhostName/apps/:appName/outputProfiles', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName } = req.params;
    const profile = req.body;

    if (!profile.name) {
      throw new AppError('Profile name is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.createOutputProfile(vhostName, appName, profile);

    auditLog(req.user!.id, 'OUTPUT_PROFILE_CREATED', 'OutputProfile', { 
      vhostName, 
      appName, 
      profileName: profile.name 
    }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Output profile created successfully',
      outputProfile: result
    });
  } catch (error) {
    next(error);
  }
});

// Update output profile
router.put('/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, profileName } = req.params;
    const profile = req.body;

    const result = await omeClient.updateOutputProfile(vhostName, appName, profileName, profile);

    auditLog(req.user!.id, 'OUTPUT_PROFILE_UPDATED', 'OutputProfile', { 
      vhostName, 
      appName, 
      profileName 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Output profile updated successfully',
      outputProfile: result
    });
  } catch (error) {
    next(error);
  }
});

// Delete output profile
router.delete('/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, profileName } = req.params;

    await omeClient.deleteOutputProfile(vhostName, appName, profileName);

    auditLog(req.user!.id, 'OUTPUT_PROFILE_DELETED', 'OutputProfile', { 
      vhostName, 
      appName, 
      profileName 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Output profile deleted successfully'
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

// Event Monitoring endpoints
router.get('/events', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName = 'default', limit = '100', offset = '0' } = req.query;

    const events = await omeClient.getEvents(
      vhostName as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      events: events || [],
      vhostName,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/events/webhooks', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName = 'default' } = req.query;

    const webhooks = await omeClient.getEventWebhooks(vhostName as string);

    res.json({
      webhooks: webhooks || null,
      vhostName
    });
  } catch (error) {
    next(error);
  }
});

// Admission Webhooks CRUD
router.get('/vhosts/:vhostName/admissionWebhooks', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName } = req.params;
    const webhooks = await omeClient.getAdmissionWebhooks(vhostName);
    res.json({
      admissionWebhooks: webhooks || []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/vhosts/:vhostName/admissionWebhooks', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName } = req.params;
    const webhook = req.body;

    if (!webhook.url) {
      throw new AppError('Webhook URL is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.createAdmissionWebhook(vhostName, webhook);

    auditLog(req.user!.id, 'ADMISSION_WEBHOOK_CREATED', 'AdmissionWebhook', { 
      vhostName, 
      url: webhook.url 
    }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Admission webhook created successfully',
      admissionWebhook: result
    });
  } catch (error) {
    next(error);
  }
});

router.put('/vhosts/:vhostName/admissionWebhooks/:webhookId', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, webhookId } = req.params;
    const webhook = req.body;

    const result = await omeClient.updateAdmissionWebhook(vhostName, webhookId, webhook);

    auditLog(req.user!.id, 'ADMISSION_WEBHOOK_UPDATED', 'AdmissionWebhook', { 
      vhostName, 
      webhookId 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Admission webhook updated successfully',
      admissionWebhook: result
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/vhosts/:vhostName/admissionWebhooks/:webhookId', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, webhookId } = req.params;

    await omeClient.deleteAdmissionWebhook(vhostName, webhookId);

    auditLog(req.user!.id, 'ADMISSION_WEBHOOK_DELETED', 'AdmissionWebhook', { 
      vhostName, 
      webhookId 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Admission webhook deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// RTSP Provider Management
router.get('/vhosts/:vhostName/apps/:appName/rtspProviders', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName } = req.params;
    const providers = await omeClient.getRtspProviders(vhostName, appName);
    res.json({
      rtspProviders: providers || []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/vhosts/:vhostName/apps/:appName/rtspProviders', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName } = req.params;
    const provider = req.body;

    if (!provider.url) {
      throw new AppError('RTSP URL is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.createRtspProvider(vhostName, appName, provider);

    auditLog(req.user!.id, 'RTSP_PROVIDER_CREATED', 'RtspProvider', { 
      vhostName, 
      appName, 
      url: provider.url 
    }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'RTSP provider created successfully',
      rtspProvider: result
    });
  } catch (error) {
    next(error);
  }
});

router.put('/vhosts/:vhostName/apps/:appName/rtspProviders/:providerName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, providerName } = req.params;
    const provider = req.body;

    const result = await omeClient.updateRtspProvider(vhostName, appName, providerName, provider);

    auditLog(req.user!.id, 'RTSP_PROVIDER_UPDATED', 'RtspProvider', { 
      vhostName, 
      appName, 
      providerName 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'RTSP provider updated successfully',
      rtspProvider: result
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/vhosts/:vhostName/apps/:appName/rtspProviders/:providerName', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, providerName } = req.params;

    await omeClient.deleteRtspProvider(vhostName, appName, providerName);

    auditLog(req.user!.id, 'RTSP_PROVIDER_DELETED', 'RtspProvider', { 
      vhostName, 
      appName, 
      providerName 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'RTSP provider deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Enhanced Signed Policies
router.post('/vhosts/:vhostName/apps/:appName/streams/:streamName/signed-policy', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, appName, streamName } = req.params;
    const { expiresIn, clientIp, allowIp, denyIp, signature } = req.body;

    if (!expiresIn || expiresIn <= 0) {
      throw new AppError('Valid expiresIn (seconds) is required', 400, 'VALIDATION_ERROR');
    }

    const policy = await omeClient.createSignedPolicy(streamName, expiresIn, vhostName, appName, {
      clientIp,
      allowIp,
      denyIp,
      signature
    });

    auditLog(req.user!.id, 'SIGNED_POLICY_CREATED', 'SignedPolicy', { 
      vhostName, 
      appName, 
      streamName 
    }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Signed policy created successfully',
      policy
    });
  } catch (error) {
    next(error);
  }
});

router.post('/vhosts/:vhostName/validate-policy', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName } = req.params;
    const { token } = req.body;

    if (!token) {
      throw new AppError('Policy token is required', 400, 'VALIDATION_ERROR');
    }

    const result = await omeClient.validateSignedPolicy(token, vhostName);

    res.json({
      valid: result.valid || false,
      policy: result.policy || null
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/vhosts/:vhostName/policies/:token', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vhostName, token } = req.params;

    await omeClient.revokeSignedPolicy(token, vhostName);

    auditLog(req.user!.id, 'SIGNED_POLICY_REVOKED', 'SignedPolicy', { 
      vhostName, 
      token: token.substring(0, 20) + '...' 
    }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Signed policy revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as omeRouter };

