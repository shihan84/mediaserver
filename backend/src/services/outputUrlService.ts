import { logger } from '../utils/logger';

    interface OMEConfig {
      publicHost: string;
      publicPort: number;
      publicPortHttp: number;
      srtPort: number;
      webrtcPort: number;
      vhost: string;
      app: string;
      useHttps: boolean;
    }

    interface GenerateUrlsOptions {
      appName?: string; // Override default app name
    }

/**
 * Service to generate OME output URLs for streams
 * Based on OME standard URL patterns
 */
class OutputUrlService {
  private config: OMEConfig;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      publicHost: process.env.OME_PUBLIC_HOST || process.env.OME_HOST || 'localhost',
      publicPort: parseInt(process.env.OME_PUBLIC_PORT || '3333'),
      publicPortHttp: parseInt(process.env.OME_PUBLIC_PORT_HTTP || '3334'),
      srtPort: parseInt(process.env.OME_SRT_PORT || '9998'),
      webrtcPort: parseInt(process.env.OME_WEBRTC_PORT || '3333'),
      vhost: process.env.OME_VHOST || 'default',
      app: process.env.OME_APP || 'app',
      useHttps: process.env.OME_USE_HTTPS === 'true' || false,
    };
  }

  /**
   * Generate all output URLs for a stream
   */
      generateOutputUrls(streamName: string, outputProfiles?: string[], appName?: string): {
    llhls: string;
    hls: string;
    dash: string;
    webrtc: string;
    srt: string;
    thumbnail: string;
    profiles?: Array<{
      name: string;
      llhls: string;
      hls: string;
      dash: string;
    }>;
  } {
    const protocol = this.config.useHttps ? 'https' : 'http';
    const baseUrl = `${protocol}://${this.config.publicHost}:${this.config.publicPort}`;
    const baseUrlHttp = `http://${this.config.publicHost}:${this.config.publicPortHttp}`;
    // Use provided appName or default from config
    const app = appName || this.config.app;
    const streamPath = `${this.config.vhost}/${app}/${streamName}`;

    const outputs = {
      llhls: `${baseUrl}/${streamPath}/llhls.m3u8`,
      hls: `${baseUrl}/${streamPath}/playlist.m3u8`,
      dash: `${baseUrl}/${streamPath}/manifest.mpd`,
      webrtc: `webrtc://${this.config.publicHost}:${this.config.webrtcPort}/${streamPath}`,
      srt: `srt://${this.config.publicHost}:${this.config.srtPort}?streamid=${streamPath}`,
      thumbnail: `${baseUrl}/${streamPath}/thumbnail`,
    };

    // Add output profile-specific URLs if profiles are provided
    if (outputProfiles && outputProfiles.length > 0) {
      const profiles = outputProfiles.map((profile) => ({
        name: profile,
        llhls: `${baseUrl}/${streamPath}/${profile}/llhls.m3u8`,
        hls: `${baseUrl}/${streamPath}/${profile}/playlist.m3u8`,
        dash: `${baseUrl}/${streamPath}/${profile}/manifest.mpd`,
      }));

      return {
        ...outputs,
        profiles,
      };
    }

    return outputs;
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(config: Partial<OMEConfig>) {
    this.config = { ...this.config, ...config };
    logger.info('Output URL service config updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): OMEConfig {
    return { ...this.config };
  }
}

export const outputUrlService = new OutputUrlService();

