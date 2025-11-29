import axios from 'axios';
import { logger } from './logger';

const OME_API_URL = process.env.OME_API_URL || 'http://localhost:8081';
const OME_API_KEY = process.env.OME_API_KEY || '';

class OMEClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = OME_API_URL;
    this.apiKey = OME_API_KEY;
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
}

export const omeClient = new OMEClient();


