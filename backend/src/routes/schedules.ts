import { Router, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';
import { omeClient } from '../utils/omeClient';

const router = Router();

// Get all schedules (from all OME Scheduled Channels)
// Each Program in a Scheduled Channel is treated as a "schedule"
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName, status } = req.query;
    const now = new Date();
    
    // Get all scheduled channels from OME
    const result = await omeClient.getScheduledChannels();
    let channels: any[] = [];
    
    if (result && result.response) {
      if (Array.isArray(result.response)) {
        channels = result.response;
      } else if (result.response.scheduledChannels && Array.isArray(result.response.scheduledChannels)) {
        channels = result.response.scheduledChannels;
      }
    } else if (Array.isArray(result)) {
      channels = result;
    } else if (result && result.scheduledChannels && Array.isArray(result.scheduledChannels)) {
      channels = result.scheduledChannels;
    }

    // Extract all programs as schedules
    const allSchedules: any[] = [];
    
    channels.forEach((channel: any) => {
      // Filter by channel name if provided
      if (channelName && channel.name !== channelName) {
        return;
      }

      const channelName_val = channel.name || channel.stream?.name || 'unknown';
      const programs = channel.programs || [];
      
      programs.forEach((program: any, index: number) => {
        const scheduledTime = new Date(program.scheduled);
        const programEndTime = new Date(scheduledTime);
        
        // Calculate end time from items duration
        if (program.items && Array.isArray(program.items)) {
          const totalDuration = program.items.reduce((sum: number, item: any) => {
            return sum + (item.duration || 0);
          }, 0);
          programEndTime.setTime(programEndTime.getTime() + totalDuration);
        } else {
          // Default to 1 hour if no duration
          programEndTime.setTime(programEndTime.getTime() + 3600000);
        }

        let scheduleStatus = 'upcoming';
        if (programEndTime < now) {
          scheduleStatus = 'past';
        } else if (scheduledTime <= now && programEndTime >= now) {
          scheduleStatus = 'current';
        }

        // Filter by status if provided
        if (status && scheduleStatus !== status) {
          return;
        }

        allSchedules.push({
          id: `${channelName_val}-${program.name || index}`,
          name: program.name || `Program ${index + 1}`,
          channelName: channelName_val,
          scheduledTime: program.scheduled,
          startTime: scheduledTime.toISOString(),
          endTime: programEndTime.toISOString(),
          repeat: program.repeat || false,
          items: program.items || [],
          status: scheduleStatus,
          isActive: true
        });
      });
    });

    // Sort by scheduled time
    allSchedules.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    res.json({
      schedules: allSchedules
    });
  } catch (error) {
    next(error);
  }
});

// Get schedule by ID (format: channelName-programName)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const [channelName, programName] = req.params.id.split('-');
    
    const result = await omeClient.getScheduledChannel(channelName);
    let channel: any = null;
    
    if (result && result.response) {
      channel = result.response;
    } else if (result && typeof result === 'object') {
      channel = result;
    }

    if (!channel) {
      throw new AppError('Scheduled channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    const programs = channel.programs || [];
    const program = programs.find((p: any) => (p.name || '') === programName);

    if (!program) {
      throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    const scheduledTime = new Date(program.scheduled);
    const programEndTime = new Date(scheduledTime);
    
    if (program.items && Array.isArray(program.items)) {
      const totalDuration = program.items.reduce((sum: number, item: any) => {
        return sum + (item.duration || 0);
      }, 0);
      programEndTime.setTime(programEndTime.getTime() + totalDuration);
    } else {
      programEndTime.setTime(programEndTime.getTime() + 3600000);
    }

    res.json({
      schedule: {
        id: req.params.id,
        name: program.name || 'Program',
        channelName: channelName,
        scheduledTime: program.scheduled,
        startTime: scheduledTime.toISOString(),
        endTime: programEndTime.toISOString(),
        repeat: program.repeat || false,
        items: program.items || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create schedule (adds a program to an existing scheduled channel or creates a new one)
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { channelName, programName, scheduled, repeat, items, streamConfig } = req.body;

    if (!channelName || !scheduled || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Channel name, scheduled time, and at least one item are required', 400, 'VALIDATION_ERROR');
    }

    // Validate items
    for (const item of items) {
      if (!item.url || (!item.url.startsWith('file://') && !item.url.startsWith('stream://'))) {
        throw new AppError('Items must have a valid URL starting with file:// or stream://', 400, 'VALIDATION_ERROR');
      }
    }

    // Try to get existing channel
    let existingChannel: any = null;
    try {
      const result = await omeClient.getScheduledChannel(channelName);
      if (result && result.response) {
        existingChannel = result.response;
      } else if (result && typeof result === 'object') {
        existingChannel = result;
      }
    } catch (err) {
      // Channel doesn't exist, we'll create it
    }

    const newProgram = {
      name: programName || undefined,
      scheduled: new Date(scheduled).toISOString(),
      repeat: repeat || false,
      items: items.map((item: any) => ({
        url: item.url,
        start: item.start || undefined,
        duration: item.duration || undefined
      }))
    };

    if (existingChannel) {
      // Update existing channel - add new program
      const programs = existingChannel.programs || [];
      programs.push(newProgram);
      
      await omeClient.updateScheduledChannel(channelName, {
        programs
      });
    } else {
      // Create new scheduled channel
      await omeClient.createScheduledChannel(channelName, {
        stream: streamConfig || {
          name: channelName,
          bypassTranscoder: false,
          videoTrack: true,
          audioTrack: true
        },
        programs: [newProgram]
      });
    }

    auditLog(req.user!.id, 'SCHEDULE_CREATED', 'Schedule', { channelName, programName }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: {
        channelName,
        programName,
        scheduled,
        repeat,
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update schedule (updates a program in a scheduled channel)
router.put('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const [channelName, programName] = req.params.id.split('-');
    const { scheduled, repeat, items } = req.body;

    // Get existing channel
    const result = await omeClient.getScheduledChannel(channelName);
    let channel: any = null;
    
    if (result && result.response) {
      channel = result.response;
    } else if (result && typeof result === 'object') {
      channel = result;
    }

    if (!channel) {
      throw new AppError('Scheduled channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    const programs = channel.programs || [];
    const programIndex = programs.findIndex((p: any) => (p.name || '') === programName);

    if (programIndex === -1) {
      throw new AppError('Schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    // Update program
    if (scheduled) programs[programIndex].scheduled = new Date(scheduled).toISOString();
    if (repeat !== undefined) programs[programIndex].repeat = repeat;
    if (items && Array.isArray(items)) {
      // Validate items
      for (const item of items) {
        if (!item.url || (!item.url.startsWith('file://') && !item.url.startsWith('stream://'))) {
          throw new AppError('Items must have a valid URL starting with file:// or stream://', 400, 'VALIDATION_ERROR');
        }
      }
      programs[programIndex].items = items.map((item: any) => ({
        url: item.url,
        start: item.start || undefined,
        duration: item.duration || undefined
      }));
    }

    await omeClient.updateScheduledChannel(channelName, {
      programs
    });

    auditLog(req.user!.id, 'SCHEDULE_UPDATED', 'Schedule', { channelName, programName }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Schedule updated successfully',
      schedule: {
        channelName,
        programName,
        ...programs[programIndex]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete schedule (removes a program from a scheduled channel)
router.delete('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const [channelName, programName] = req.params.id.split('-');

    // Get existing channel
    const result = await omeClient.getScheduledChannel(channelName);
    let channel: any = null;
    
    if (result && result.response) {
      channel = result.response;
    } else if (result && typeof result === 'object') {
      channel = result;
    }

    if (!channel) {
      throw new AppError('Scheduled channel not found', 404, 'CHANNEL_NOT_FOUND');
    }

    const programs = (channel.programs || []).filter((p: any) => (p.name || '') !== programName);

    // If no programs left, delete the entire scheduled channel
    if (programs.length === 0) {
      await omeClient.deleteScheduledChannel(channelName);
    } else {
      // Update channel with remaining programs
      await omeClient.updateScheduledChannel(channelName, {
        programs
      });
    }

    auditLog(req.user!.id, 'SCHEDULE_DELETED', 'Schedule', { channelName, programName }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as schedulesRouter };
