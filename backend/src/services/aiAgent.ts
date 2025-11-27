import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface SystemContext {
  channels: number;
  activeChannels: number;
  streams: any[];
  schedules: number;
  activeSchedules: number;
  tasks: number;
  pendingTasks: number;
  scte35Markers: number;
  recentActivity?: any[];
}

/**
 * Gather system context for AI agent responses
 */
async function gatherSystemContext(userId?: string): Promise<SystemContext> {
  try {
    const [
      channels,
      activeChannels,
      schedules,
      activeSchedules,
      tasks,
      pendingTasks,
      scte35Markers,
      streams
    ] = await Promise.all([
      prisma.channel.count(),
      prisma.channel.count({ where: { isActive: true } }),
      prisma.schedule.count(),
      prisma.schedule.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.scte35Marker.count(),
      prisma.channel.findMany({
        where: { isActive: true },
        select: { id: true, name: true, isActive: true },
        take: 10
      })
    ]);

    return {
      channels,
      activeChannels,
      streams,
      schedules,
      activeSchedules,
      tasks,
      pendingTasks,
      scte35Markers
    };
  } catch (error) {
    logger.error('Failed to gather system context', { error });
    return {
      channels: 0,
      activeChannels: 0,
      streams: [],
      schedules: 0,
      activeSchedules: 0,
      tasks: 0,
      pendingTasks: 0,
      scte35Markers: 0
    };
  }
}

/**
 * Process user message and generate AI agent response
 */
export async function processAIMessage(
  userMessage: string,
  userId: string,
  context?: any
): Promise<string> {
  try {
    const systemContext = await gatherSystemContext(userId);
    const lowerMessage = userMessage.toLowerCase();

    // Help commands
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm your OvenMediaEngine assistant. I can help you with:

- **Channel Management**: Create, configure, and manage streaming channels
- **Stream Operations**: Start/stop streams, monitor stream status
- **SCTE-35 Markers**: Create and insert SCTE-35 markers for ad breaks
- **Scheduling**: Set up channel playout schedules
- **Task Monitoring**: Track background tasks and their progress
- **Troubleshooting**: Help diagnose issues with streams or channels

Current system status:
- ${systemContext.channels} channels (${systemContext.activeChannels} active)
- ${systemContext.schedules} schedules (${systemContext.activeSchedules} active)
- ${systemContext.tasks} tasks (${systemContext.pendingTasks} pending)
- ${systemContext.scte35Markers} SCTE-35 markers

How can I assist you today?`;
    }

    // Channel-related queries
    if (lowerMessage.includes('channel') || lowerMessage.includes('stream')) {
      if (lowerMessage.includes('create') || lowerMessage.includes('new')) {
        return `To create a new channel:
1. Go to the Channels page
2. Click "Create Channel"
3. Enter channel name and description
4. The system will generate a unique stream key
5. Use this stream key to ingest your stream to OvenMediaEngine

You currently have ${systemContext.channels} channels, ${systemContext.activeChannels} of which are active.`;
      }

      if (lowerMessage.includes('start') || lowerMessage.includes('activate')) {
        return `To start a stream:
1. Go to the Streams page
2. Find your channel
3. Click "Start Stream"
4. Use the provided stream key to ingest your content

Make sure OvenMediaEngine is running and configured correctly.`;
      }

      if (lowerMessage.includes('stop') || lowerMessage.includes('deactivate')) {
        return `To stop a stream:
1. Go to the Streams page
2. Find the active stream
3. Click "Stop Stream"

This will deactivate the channel and stop the stream in OvenMediaEngine.`;
      }

      return `Channel Management:
- You have ${systemContext.channels} total channels
- ${systemContext.activeChannels} channels are currently active
- ${systemContext.streams.length} streams are available

You can manage channels from the Channels page. Need help with a specific channel operation?`;
    }

    // SCTE-35 related queries
    if (lowerMessage.includes('scte') || lowerMessage.includes('marker') || lowerMessage.includes('ad break')) {
      if (lowerMessage.includes('preroll') || lowerMessage.includes('template')) {
        return `To create a preroll template:
1. Go to SCTE-35 Markers page
2. Use the API endpoint: POST /api/scte35/templates/preroll
3. Specify name and duration (default: 30 seconds)

Example: Create a 30-second preroll template for ad breaks before content starts.`;
      }

      if (lowerMessage.includes('insert') || lowerMessage.includes('add')) {
        return `To insert an SCTE-35 marker into a stream:
1. Ensure the stream is active
2. Go to Streams page
3. Select your channel
4. Click "Insert SCTE-35 Marker"
5. Choose the marker from your library

You have ${systemContext.scte35Markers} SCTE-35 markers available.`;
      }

      return `SCTE-35 Marker Management:
- You have ${systemContext.scte35Markers} SCTE-35 markers configured
- Markers can be inserted into active streams
- Use preroll templates for standardized ad breaks

Need help creating or inserting a marker?`;
    }

    // Schedule-related queries
    if (lowerMessage.includes('schedule') || lowerMessage.includes('playout')) {
      return `Schedule Management:
- You have ${systemContext.schedules} total schedules
- ${systemContext.activeSchedules} schedules are currently active

To create a schedule:
1. Go to Schedules page
2. Click "Create Schedule"
3. Select channel, start/end time
4. Configure recurrence if needed
5. Set up playlist configuration

Need help with a specific scheduling task?`;
    }

    // Task-related queries
    if (lowerMessage.includes('task') || lowerMessage.includes('progress') || lowerMessage.includes('job')) {
      return `Task Management:
- You have ${systemContext.tasks} total tasks
- ${systemContext.pendingTasks} tasks are pending

Tasks track background operations like:
- Stream processing
- Content transcoding
- Scheduled operations

View tasks on the Tasks page to monitor progress.`;
    }

    // Troubleshooting
    if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('not working')) {
      return `Troubleshooting assistance:

1. **Stream not starting?**
   - Check OvenMediaEngine is running (port 8081)
   - Verify stream key is correct
   - Check channel is active

2. **API errors?**
   - Verify backend is running (port 3001)
   - Check database connection
   - Review logs in backend/logs/

3. **SCTE-35 not inserting?**
   - Ensure stream is active
   - Verify marker configuration
   - Check OME API connection

4. **General issues?**
   - Check system health: /health endpoint
   - Review audit logs for errors
   - Verify all services are running

What specific issue are you experiencing?`;
    }

    // Status queries
    if (lowerMessage.includes('status') || lowerMessage.includes('how many') || lowerMessage.includes('count')) {
      return `System Status Summary:

📊 **Channels**: ${systemContext.channels} total, ${systemContext.activeChannels} active
📅 **Schedules**: ${systemContext.schedules} total, ${systemContext.activeSchedules} active
📋 **Tasks**: ${systemContext.tasks} total, ${systemContext.pendingTasks} pending
🎯 **SCTE-35 Markers**: ${systemContext.scte35Markers} configured

Everything looks good! Need help with any specific operation?`;
    }

    // Default response
    return `I understand you're asking about: "${userMessage}"

I can help you with:
- Managing channels and streams
- Creating and inserting SCTE-35 markers
- Setting up schedules
- Monitoring tasks and progress
- Troubleshooting issues

Try asking:
- "How do I create a channel?"
- "Show me system status"
- "Help with SCTE-35 markers"
- "Troubleshoot stream issues"

Or type "help" for a full list of capabilities.`;
  } catch (error) {
    logger.error('AI agent processing failed', { error, message: userMessage });
    return `I encountered an error processing your message. Please try again or contact support if the issue persists.`;
  }
}

/**
 * Process chat message and generate response asynchronously
 */
export async function processChatMessage(messageId: string): Promise<void> {
  try {
    const chatMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { user: true }
    });

    if (!chatMessage || chatMessage.response) {
      return; // Message not found or already processed
    }

    // Generate AI response
    const response = await processAIMessage(
      chatMessage.message,
      chatMessage.userId,
      chatMessage.context
    );

    // Update message with response
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { response }
    });

    logger.info('AI agent response generated', { messageId, userId: chatMessage.userId });
  } catch (error) {
    logger.error('Failed to process chat message', { error, messageId });
  }
}

