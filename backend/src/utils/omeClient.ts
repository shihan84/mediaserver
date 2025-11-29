import axios from 'axios';
import { logger } from './logger';

// Fix IPv6/IPv4 issue: Use 127.0.0.1 instead of localhost to force IPv4
let OME_API_URL = process.env.OME_API_URL || 'http://127.0.0.1:8081';
// Replace localhost with 127.0.0.1 to avoid IPv6 connection issues
if (OME_API_URL.includes('localhost')) {
  OME_API_URL = OME_API_URL.replace('localhost', '127.0.0.1');
}

const OME_API_KEY = process.env.OME_API_KEY || '';

class OMEClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = OME_API_URL;
    this.apiKey = OME_API_KEY;
    logger.info('OMEClient initialized', { baseURL: this.baseURL });
  }

  private async request(method: string, endpoint: string, data?: any) {
    try {
      const config: any = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (this.apiKey) {
        // OME API uses Basic authentication with Base64 encoded token
        const authToken = Buffer.from(this.apiKey).toString('base64');
        config.headers['Authorization'] = `Basic ${authToken}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      logger.error('OME API request failed', {
        method,
        endpoint,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getStreams() {
    try {
      const result = await this.request('GET', '/v1/vhosts/default/apps/app/streams');
      // OME returns streams in response.response array format: {message: "OK", response: ["stream1", "stream2"], statusCode: 200}
      let streamNames: string[] = [];
      
      if (result && result.response && Array.isArray(result.response)) {
        streamNames = result.response;
      } else if (Array.isArray(result)) {
        streamNames = result;
      }
      
      logger.info('Fetched stream names from OME', { streamNames, count: streamNames.length });
      
      // Fetch full details for each stream
      if (streamNames.length > 0) {
        const streamPromises = streamNames.map(async (streamName: string) => {
          try {
            const streamDetail = await this.getStream(streamName);
            logger.debug('Fetched stream detail', { streamName, hasResponse: !!streamDetail });
            return streamDetail;
          } catch (err: any) {
            logger.warn('Failed to fetch stream details', { streamName, error: err.message });
            // Return minimal stream object so it still shows up in the list
            return { name: streamName, state: 'unknown', input: { sourceType: 'Unknown' } };
          }
        });
        const streams = await Promise.all(streamPromises);
        logger.info('Fetched stream details', { count: streams.length, streams: streams.map((s: any) => s?.name || 'unknown') });
        // Filter out any null/undefined streams
        return streams.filter((s: any) => s && s.name);
      }
      
      logger.info('No streams found in OME');
      return [];
    } catch (error: any) {
      logger.error('Error fetching streams', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getStream(streamName: string) {
    const result = await this.request('GET', `/v1/vhosts/default/apps/app/streams/${streamName}`);
    // OME returns stream details in response.response
    return result.response || result;
  }

  async createStream(config: any) {
    return this.request('POST', '/v1/vhosts/default/apps/app/streams', config);
  }

  async deleteStream(streamName: string) {
    return this.request('DELETE', `/v1/vhosts/default/apps/app/streams/${streamName}`);
  }

  async insertScte35(streamName: string, marker: any) {
    return this.request('POST', `/v1/vhosts/default/apps/app/streams/${streamName}/scte35`, marker);
  }

  async getMetrics(streamName?: string) {
    const endpoint = streamName
      ? `/v1/vhosts/default/apps/app/streams/${streamName}/metrics`
      : '/v1/vhosts/default/apps/app/metrics';
    const result = await this.request('GET', endpoint);
    return result.response || result;
  }

  // Recording endpoints (https://docs.ovenmediaengine.com/recording)
  async startRecording(streamName: string, filePath: string, infoPath?: string) {
    return this.request('POST', `/v1/vhosts/default/apps/app/streams/${streamName}/record`, {
      filePath,
      infoPath: infoPath || filePath.replace('.ts', '.xml')
    });
  }

  async stopRecording(streamName: string) {
    return this.request('DELETE', `/v1/vhosts/default/apps/app/streams/${streamName}/record`);
  }

  async getRecordingStatus(streamName: string) {
    return this.request('GET', `/v1/vhosts/default/apps/app/streams/${streamName}/record`);
  }

  // Push Publishing endpoints (https://docs.ovenmediaengine.com/push-publishing)
  async startPushPublishing(streamName: string, protocol: string, url: string, streamKey?: string) {
    return this.request('POST', `/v1/vhosts/default/apps/app/streams/${streamName}/push`, {
      protocol, // 'srt', 'rtmp', 'mpegts'
      url,
      streamKey
    });
  }

  async stopPushPublishing(streamName: string, id: string) {
    return this.request('DELETE', `/v1/vhosts/default/apps/app/streams/${streamName}/push/${id}`);
  }

  async getPushPublishingStatus(streamName: string) {
    return this.request('GET', `/v1/vhosts/default/apps/app/streams/${streamName}/push`);
  }

  // Scheduled Channels endpoints (https://docs.ovenmediaengine.com/rest-api/v1/virtualhost/application/scheduledchannel-api)
  async getScheduledChannels() {
    return this.request('GET', '/v1/vhosts/default/apps/app/scheduledChannels');
  }

  async createScheduledChannel(name: string, schedule: any[]) {
    return this.request('POST', '/v1/vhosts/default/apps/app/scheduledChannels', {
      name,
      schedule
    });
  }

  async getScheduledChannel(channelName: string) {
    return this.request('GET', `/v1/vhosts/default/apps/app/scheduledChannels/${channelName}`);
  }

  async updateScheduledChannel(channelName: string, schedule: any[]) {
    return this.request('PUT', `/v1/vhosts/default/apps/app/scheduledChannels/${channelName}`, {
      schedule
    });
  }

  async deleteScheduledChannel(channelName: string) {
    return this.request('DELETE', `/v1/vhosts/default/apps/app/scheduledChannels/${channelName}`);
  }

  // Virtual Hosts and Applications (https://docs.ovenmediaengine.com/rest-api)
  async getVirtualHosts() {
    return this.request('GET', '/v1/vhosts');
  }

  async getVirtualHost(vhostName: string) {
    return this.request('GET', `/v1/vhosts/${vhostName}`);
  }

  async getApplications(vhostName: string = 'default') {
    return this.request('GET', `/v1/vhosts/${vhostName}/apps`);
  }

  async getApplication(vhostName: string, appName: string) {
    return this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}`);
  }

  // Statistics and Monitoring (https://docs.ovenmediaengine.com/rest-api)
  async getServerStats() {
    return this.request('GET', '/v1/stats/current');
  }

  async getServerConfig() {
    return this.request('GET', '/v1/vhosts/default');
  }

  // Thumbnail endpoints (https://docs.ovenmediaengine.com/thumbnail)
  async getThumbnail(streamName: string) {
    return this.request('GET', `/v1/vhosts/default/apps/app/streams/${streamName}/thumbnail`);
  }

  // Output profiles (transcoding) (https://docs.ovenmediaengine.com/rest-api)
  async getOutputProfiles(vhostName: string = 'default', appName: string = 'app') {
    const result = await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/outputProfiles`);
    return result.response || result;
  }

  // Enhanced Stream Statistics & Metrics (https://docs.ovenmediaengine.com/rest-api)
  
  /**
   * Get real-time statistics for a stream
   * Returns detailed ingress/egress statistics
   */
  async getStreamStats(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      const result = await this.request('GET', `/v1/stats/current/vhosts/${vhostName}/apps/${appName}/streams/${streamName}`);
      return result.response || result;
    } catch (error: any) {
      logger.warn('Could not fetch stream stats', { streamName, vhostName, appName, error: error.message });
      return null;
    }
  }

  /**
   * Get stream tracks information (video/audio codec, bitrate, resolution, etc.)
   */
  async getStreamTracks(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      const result = await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/tracks`);
      return result.response || result;
    } catch (error: any) {
      logger.warn('Could not fetch stream tracks', { streamName, vhostName, appName, error: error.message });
      return null;
    }
  }

  /**
   * Get detailed stream statistics (ingress/egress)
   */
  async getStreamStatistics(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      const result = await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/stats`);
      return result.response || result;
    } catch (error: any) {
      logger.warn('Could not fetch stream statistics', { streamName, vhostName, appName, error: error.message });
      return null;
    }
  }

  /**
   * Get stream health status and quality metrics
   */
  async getStreamHealth(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      const stream = await this.getStream(streamName);
      const stats = await this.getStreamStatistics(streamName, vhostName, appName);
      
      return {
        state: stream?.state || 'unknown',
        connected: stream?.state === 'connected' || stream?.state === 'published',
        quality: {
          bitrate: stats?.ingress?.bitrate || null,
          packetLoss: stats?.ingress?.packetLoss || null,
          latency: stats?.ingress?.rtt || null,
          viewers: stats?.egress?.totalViewers || 0
        },
        stream: stream,
        statistics: stats
      };
    } catch (err: any) {
      logger.warn('Could not determine stream health', { streamName, error: err.message });
      return { 
        state: 'unknown', 
        connected: false,
        quality: {}
      };
    }
  }

  /**
   * Get real-time viewer count per protocol
   */
  async getViewerCount(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      const stats = await this.getStreamStats(streamName, vhostName, appName);
      if (!stats) return null;

      return {
        total: stats.viewers?.total || stats.viewers || 0,
        webrtc: stats.viewers?.webrtc || 0,
        hls: stats.viewers?.hls || 0,
        llhls: stats.viewers?.llhls || 0,
        dash: stats.viewers?.dash || 0,
        srt: stats.viewers?.srt || 0
      };
    } catch (error: any) {
      logger.warn('Could not fetch viewer count', { streamName, error: error.message });
      return null;
    }
  }

  // Event Monitoring (https://docs.ovenmediaengine.com/rest-api)
  
  /**
   * Get events from OME
   * Events include: application creation/deletion, stream start/stop, REST API calls
   */
  async getEvents(vhostName: string = 'default', limit: number = 100, offset: number = 0) {
    try {
      const result = await this.request('GET', `/v1/vhosts/${vhostName}/events?limit=${limit}&offset=${offset}`);
      return result.response || result;
    } catch (error: any) {
      logger.warn('Could not fetch events', { vhostName, error: error.message });
      return null;
    }
  }

  /**
   * Get event webhook configuration
   */
  async getEventWebhooks(vhostName: string = 'default') {
    try {
      const vhost = await this.getVirtualHost(vhostName);
      return vhost?.eventWebhooks || null;
    } catch (error: any) {
      logger.warn('Could not fetch event webhooks', { vhostName, error: error.message });
      return null;
    }
  }

  // DVR (Digital Video Recorder) Functionality
  
  /**
   * Get DVR configuration for an application
   * DVR allows live rewind and time-shifted playback
   */
  async getDvrConfiguration(vhostName: string = 'default', appName: string = 'app') {
    try {
      const app = await this.getApplication(vhostName, appName);
      return app?.dvr || app?.dvrConfiguration || null;
    } catch (error: any) {
      logger.warn('Could not fetch DVR configuration', { vhostName, appName, error: error.message });
      return null;
    }
  }

  /**
   * Get DVR status for a stream (available rewind window)
   */
  async getDvrStatus(streamName: string, vhostName: string = 'default', appName: string = 'app') {
    try {
      // Try to get DVR information from stream stats
      const stream = await this.getStream(streamName, vhostName, appName);
      const stats = await this.getStreamStatistics(streamName, vhostName, appName);
      
      return {
        enabled: stream?.dvrEnabled || false,
        window: stream?.dvrWindow || null, // DVR window in seconds
        available: stream?.dvrAvailable || false,
        stats: stats
      };
    } catch (error: any) {
      logger.warn('Could not fetch DVR status', { streamName, error: error.message });
      return {
        enabled: false,
        window: null,
        available: false
      };
    }
  }

  // Advanced Security Features
  
  /**
   * Create a signed policy for stream access
   * Signed policies allow time-limited access to streams
   */
  async createSignedPolicy(
    streamName: string,
    expiresIn: number, // seconds until expiration
    vhostName: string = 'default',
    appName: string = 'app'
  ) {
    try {
      // OME signed policy creation endpoint
      const result = await this.request('POST', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/signed-policy`, {
        expiresIn,
        timestamp: Math.floor(Date.now() / 1000)
      });
      return result.response || result;
    } catch (error: any) {
      logger.warn('Could not create signed policy', { streamName, error: error.message });
      throw error;
    }
  }

  /**
   * Get admission webhook configuration
   * Admission webhooks allow custom access control logic
   */
  async getAdmissionWebhooks(vhostName: string = 'default') {
    try {
      const vhost = await this.getVirtualHost(vhostName);
      return vhost?.admissionWebhooks || null;
    } catch (error: any) {
      logger.warn('Could not fetch admission webhooks', { vhostName, error: error.message });
      return null;
    }
  }
}

export const omeClient = new OMEClient();


