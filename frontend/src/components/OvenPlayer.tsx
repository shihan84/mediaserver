import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    OvenPlayer: any;
  }
}

interface OvenPlayerProps {
  sources: Array<{
    type: 'webrtc' | 'llhls' | 'hls';
    file: string;
    label?: string;
  }>;
  className?: string;
  onError?: (error: any) => void;
  onReady?: () => void;
  onQualityChange?: (quality: string) => void;
  enableQualitySelection?: boolean;
  renditions?: Array<{
    name: string;
    resolution?: string;
    bitrate?: number;
    llhls?: string;
    hls?: string;
  }>;
}

/**
 * OvenPlayer React Component
 * Official HTML5 player optimized for OvenMediaEngine
 * Supports WebRTC, LLHLS, and HLS with automatic fallback
 */
export function OvenPlayer({ 
  sources, 
  className = '', 
  onError, 
  onReady, 
  onQualityChange,
  enableQualitySelection = false,
  renditions = []
}: OvenPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load OvenPlayer script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ovenplayer/dist/ovenplayer.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      setIsLoading(false);
    };
    script.onerror = () => {
      setError('Failed to load OvenPlayer script');
      setIsLoading(false);
      if (onError) {
        onError(new Error('OvenPlayer script failed to load'));
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before loading
      if (!scriptLoadedRef.current) {
        document.head.removeChild(script);
      }
    };
  }, [onError]);

  // Initialize player when script is loaded and sources are available
  useEffect(() => {
    if (!playerRef.current || !window.OvenPlayer || !sources || sources.length === 0) {
      return;
    }

    // Clean up existing player instance
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.remove();
      } catch (e) {
        // Player might already be removed
      }
      playerInstanceRef.current = null;
    }

    try {
      const playerConfig = {
        sources,
        autoFallback: true,
        timecode: true,
        controls: true,
        mute: false,
        autoplay: true,
        webrtcConfig: {
          timeoutMaxRetry: 3,
          connectionTimeout: 5000,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        },
        hlsConfig: {
          maxBufferLength: 10,
          liveSyncDuration: 3
        }
      };

      playerInstanceRef.current = window.OvenPlayer.create(
        playerRef.current,
        playerConfig
      );

      // Event handlers
      if (playerInstanceRef.current) {
        playerInstanceRef.current.on('ready', () => {
          setIsLoading(false);
          setError(null);
          if (onReady) {
            onReady();
          }
        });

        playerInstanceRef.current.on('error', (err: any) => {
          setError(err.message || 'Player error occurred');
          if (onError) {
            onError(err);
          }
        });

        playerInstanceRef.current.on('stateChanged', (state: any) => {
          if (state.newstate === 'playing') {
            setIsLoading(false);
            setError(null);
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize player');
      if (onError) {
        onError(err);
      }
      setIsLoading(false);
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerInstanceRef.current = null;
      }
    };
  }, [sources, onError, onReady]);

  if (error) {
    return (
      <div className={`bg-black rounded-lg flex items-center justify-center aspect-video ${className}`}>
        <div className="text-white text-center p-4">
          <p className="text-sm font-medium mb-2">Player Error</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading player...</p>
          </div>
        </div>
      )}
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
}

