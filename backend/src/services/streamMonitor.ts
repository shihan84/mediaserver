import { PrismaClient } from '@prisma/client';
import { omeClient } from '../utils/omeClient';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface StreamStatus {
  isActive: boolean;
  lastChecked: Date;
}

class StreamMonitorService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private streamStatuses: Map<string, StreamStatus> = new Map();
  private checkInterval: number = 10000; // Check every 10 seconds

  start() {
    if (this.monitoringInterval) {
      logger.warn('Stream monitor already running');
      return;
    }

    logger.info('Starting stream monitor service');
    this.monitoringInterval = setInterval(() => {
      this.checkStreams();
    }, this.checkInterval);

    // Initial check
    this.checkStreams();
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Stream monitor service stopped');
    }
  }

  private async checkStreams() {
    try {
      const channels = await prisma.channel.findMany({
        where: {
          isActive: true,
          vodFallbackEnabled: true
        }
      });

      for (const channel of channels) {
        await this.checkChannelStream(channel);
      }
    } catch (error: any) {
      logger.error('Error checking streams', { error: error.message });
    }
  }

  private async checkChannelStream(channel: any) {
    try {
      // Check if stream exists in OME
      const stream = await omeClient.getStream(channel.streamKey);
      const isStreamActive = stream && stream.state === 'streaming';

      const lastStatus = this.streamStatuses.get(channel.id);
      const wasActive = lastStatus?.isActive || false;

      this.streamStatuses.set(channel.id, {
        isActive: isStreamActive,
        lastChecked: new Date()
      });

      // If stream dropped and we have VOD fallback enabled
      if (wasActive && !isStreamActive && channel.vodFallbackEnabled) {
        logger.info('Stream dropped, activating VOD fallback', {
          channelId: channel.id,
          channelName: channel.name
        });

        await this.activateVodFallback(channel);
      }

      // If stream recovered, deactivate VOD fallback
      if (!wasActive && isStreamActive) {
        logger.info('Stream recovered, deactivating VOD fallback', {
          channelId: channel.id,
          channelName: channel.name
        });

        await this.deactivateVodFallback(channel);
      }
    } catch (error: any) {
      // Stream doesn't exist or error checking
      const lastStatus = this.streamStatuses.get(channel.id);
      const wasActive = lastStatus?.isActive || false;

      if (wasActive && channel.vodFallbackEnabled) {
        logger.warn('Stream check failed, activating VOD fallback', {
          channelId: channel.id,
          channelName: channel.name,
          error: error.message
        });

        // Wait for fallback delay before activating
        setTimeout(async () => {
          await this.activateVodFallback(channel);
        }, (channel.vodFallbackDelay || 5) * 1000);
      }

      this.streamStatuses.set(channel.id, {
        isActive: false,
        lastChecked: new Date()
      });
    }
  }

  private async activateVodFallback(channel: any) {
    try {
      const vodFiles = channel.vodFallbackFiles as string[] || [];
      
      if (vodFiles.length === 0) {
        logger.warn('No VOD fallback files configured', {
          channelId: channel.id
        });
        return;
      }

      // Use OME's FallbackProgram feature for automatic VOD fallback
      // According to OME docs: FallbackProgram switches automatically when 
      // there's no program scheduled or an error occurs
      // Format: file://path or http://url
      const fallbackItems = vodFiles.map((file) => {
        // Ensure proper file:// or http:// format
        const url = file.startsWith('file://') || file.startsWith('http://') || file.startsWith('https://')
          ? file
          : `file://${file}`;
        return { url };
      });

      // Create scheduled channel with FallbackProgram and a persistent live program
      // Pattern: Persistent Live Channel with FallbackProgram
      // The live stream program runs continuously, FallbackProgram activates when stream drops
      const schedule = [
        {
          type: 'FallbackProgram',
          items: fallbackItems
        },
        {
          type: 'Program',
          name: 'live',
          scheduled: '2000-01-01T00:00:00.000Z', // Set to past to always be active
          repeat: true,
          items: [
            {
              url: `stream://default/app/${channel.streamKey}`,
              duration: -1 // Play indefinitely
            }
          ]
        }
      ];

      try {
        // Try to update existing scheduled channel
        await omeClient.updateScheduledChannel(channel.name, schedule);
        logger.info('VOD fallback activated via scheduled channel update', {
          channelId: channel.id,
          channelName: channel.name
        });
      } catch (error: any) {
        // If doesn't exist, create it
        if (error.response?.status === 404) {
          await omeClient.createScheduledChannel(channel.name, schedule);
          logger.info('VOD fallback activated via new scheduled channel', {
            channelId: channel.id,
            channelName: channel.name
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      logger.error('Failed to activate VOD fallback', {
        channelId: channel.id,
        error: error.message
      });
    }
  }

  private async deactivateVodFallback(channel: any) {
    try {
      // Delete scheduled channel to stop VOD playback
      await omeClient.deleteScheduledChannel(channel.name);
      logger.info('VOD fallback deactivated', {
        channelId: channel.id,
        channelName: channel.name
      });
    } catch (error: any) {
      // Scheduled channel might not exist, which is fine
      if (error.response?.status !== 404) {
        logger.error('Failed to deactivate VOD fallback', {
          channelId: channel.id,
          error: error.message
        });
      }
    }
  }
}

export const streamMonitorService = new StreamMonitorService();

