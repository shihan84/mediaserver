import { PrismaClient } from '@prisma/client';
import { omeClient } from '../utils/omeClient';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Service to manage OME Scheduled Channels with VOD fallback
 * Based on OME documentation: https://docs.ovenmediaengine.com/live-source/scheduled-channel
 * 
 * Uses FallbackProgram feature for automatic VOD fallback when stream drops
 */
class ScheduledChannelService {
  /**
   * Create or update a scheduled channel with live stream and VOD fallback
   * Implements "Persistent Live Channel" pattern from OME docs
   */
  async setupChannelWithVodFallback(channel: any) {
    try {
      if (!channel.vodFallbackEnabled || !channel.vodFallbackFiles || (channel.vodFallbackFiles as string[]).length === 0) {
        logger.info('VOD fallback not enabled for channel', { channelId: channel.id });
        return;
      }

      const vodFiles = channel.vodFallbackFiles as string[];

      // Format VOD files for FallbackProgram
      // OME expects: file://path or http://url format
      const fallbackItems = vodFiles.map((file) => {
        let url = file;
        // Convert relative paths to file:// format
        if (!file.startsWith('file://') && !file.startsWith('http://') && !file.startsWith('https://')) {
          // If it's an absolute path, add file://
          if (file.startsWith('/')) {
            url = `file://${file}`;
          } else {
            // Relative path - OME will resolve from MediaRootDir
            url = `file://${file}`;
          }
        }
        return { url };
      });

      // Create schedule following OME's Persistent Live Channel pattern
      // This creates a channel that:
      // 1. Plays live stream (stream://default/app/{streamKey}) continuously
      // 2. Automatically falls back to VOD files when live stream is unavailable
      // 3. Returns to live stream when it becomes available again
      const schedule = [
        {
          // FallbackProgram: Automatically activates when live stream is unavailable
          type: 'FallbackProgram',
          items: fallbackItems
        },
        {
          // Main program: Live stream that runs continuously
          type: 'Program',
          name: 'live',
          scheduled: '2000-01-01T00:00:00.000Z', // Set to past to always be active
          repeat: true,
          items: [
            {
              url: `stream://default/app/${channel.streamKey}`,
              duration: -1 // Play indefinitely until stream stops
            }
          ]
        }
      ];

      try {
        // Try to update existing scheduled channel
        await omeClient.updateScheduledChannel(channel.name, schedule);
        logger.info('Scheduled channel updated with VOD fallback', {
          channelId: channel.id,
          channelName: channel.name
        });
      } catch (error: any) {
        // If doesn't exist, create it
        if (error.response?.status === 404) {
          await omeClient.createScheduledChannel(channel.name, schedule);
          logger.info('Scheduled channel created with VOD fallback', {
            channelId: channel.id,
            channelName: channel.name
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      logger.error('Failed to setup scheduled channel with VOD fallback', {
        channelId: channel.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove scheduled channel (disables VOD fallback)
   */
  async removeScheduledChannel(channelName: string) {
    try {
      await omeClient.deleteScheduledChannel(channelName);
      logger.info('Scheduled channel removed', { channelName });
    } catch (error: any) {
      // Channel might not exist, which is fine
      if (error.response?.status !== 404) {
        logger.error('Failed to remove scheduled channel', {
          channelName,
          error: error.message
        });
        throw error;
      }
    }
  }

  /**
   * Setup scheduled channel when channel is created/updated
   */
  async handleChannelUpdate(channel: any) {
    if (channel.vodFallbackEnabled) {
      await this.setupChannelWithVodFallback(channel);
    } else {
      // Remove scheduled channel if VOD fallback is disabled
      await this.removeScheduledChannel(channel.name);
    }
  }
}

export const scheduledChannelService = new ScheduledChannelService();

