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
        config.headers['Authorization'] = `Bearer ${this.apiKey}`;
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
    return this.request('GET', '/v1/vhosts/default/apps/app/streams');
  }

  async getStream(streamName: string) {
    return this.request('GET', `/v1/vhosts/default/apps/app/streams/${streamName}`);
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
    return this.request('GET', endpoint);
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
    return this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/outputProfiles`);
  }
}

export const omeClient = new OMEClient();


