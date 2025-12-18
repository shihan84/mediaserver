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
  enableDvr?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayerReady?: (playerInstance: any) => void;
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
  onQualityChange: _onQualityChange,
  enableQualitySelection: _enableQualitySelection,
  renditions: _renditions,
  enableDvr = false,
  onTimeUpdate,
  onPlayerReady
}: OvenPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load OvenPlayer script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // OvenPlayer's HLS provider expects global `Hls` (hls.js) to be loaded.
    const ensureScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        // If already present, skip.
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return resolve();

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        // Same-origin scripts to avoid CSP issues
        // Cache-bust to ensure clients pick up updated self-hosted scripts.
        await ensureScript('/hls.min.js?v=2');
        await ensureScript('/ovenplayer.js?v=2');
        scriptLoadedRef.current = true;
        setIsLoading(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to load player scripts');
        setIsLoading(false);
        onError?.(e);
      }
    })();

    return () => {
      // No script tag cleanup: scripts are shared across the app and safe to keep cached.
    };
  }, [onError]);

  // Initialize player when script is loaded and sources are available
  useEffect(() => {
    if (!playerRef.current || !window.OvenPlayer || !sources || sources.length === 0) {
      return;
    }

    let isMounted = true;
    let cleanupTimeout: NodeJS.Timeout | null = null;
    let currentPlayerInstance: any = null;

    // Keep the declared source types (webrtc/llhls/hls). OvenPlayer's HLS stack
    // relies on hls.js being loaded globally (we load /hls.min.js above).
    const normalizedSources = sources;

    // Clean up existing player instance aggressively
    if (playerInstanceRef.current) {
      try {
        const oldPlayer = playerInstanceRef.current;
        // Stop any ongoing operations first
        try {
          if (typeof oldPlayer.stop === 'function') {
            oldPlayer.stop();
          }
          if (typeof oldPlayer.pause === 'function') {
            oldPlayer.pause();
          }
          // Remove all event listeners to prevent callbacks
          if (typeof oldPlayer.off === 'function') {
            oldPlayer.off(); // Remove all listeners
          }
        } catch (e) {
          // Ignore - player might be in invalid state
        }
        // Then remove the player
        if (typeof oldPlayer.remove === 'function') {
          oldPlayer.remove();
        }
      } catch (e) {
        // Player might already be removed or in invalid state
        console.warn('Error removing player instance:', e);
      }
      playerInstanceRef.current = null;
    }

    // Small delay to ensure DOM is ready and previous player is fully cleaned up
    const initTimeout = setTimeout(() => {
      // Check mount state BEFORE doing anything
      if (!isMounted || !playerRef.current || !window.OvenPlayer) {
        return;
      }

      try {
        const playerConfig = {
          sources: normalizedSources,
          autoFallback: true,
          // Avoid OvenPlayer progressbar/timecode null deref bugs seen in some builds
          // (Uncaught TypeError: Cannot read properties of null (reading 'isTimecodeMode')).
          timecode: false,
          controls: true,
          // Allow autoplay in modern browsers
          mute: true,
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

        // Verify DOM element still exists before creating player
        if (!playerRef.current || !isMounted) {
          return;
        }

        try {
          // Final mount check before creating player
          if (!isMounted || !playerRef.current) {
            return;
          }

          currentPlayerInstance = window.OvenPlayer.create(
            playerRef.current,
            playerConfig
          );
          
          // Verify player was created successfully
          if (!currentPlayerInstance) {
            throw new Error('OvenPlayer.create returned null');
          }

          // Store reference only if still mounted
          if (isMounted) {
            playerInstanceRef.current = currentPlayerInstance;
          } else {
            // Component unmounted during creation, clean up immediately
            try {
              if (typeof currentPlayerInstance.remove === 'function') {
                currentPlayerInstance.remove();
              }
            } catch (e) {
              // Ignore cleanup errors
            }
            return;
          }

          // Event handlers with null checks and mount checks
          if (playerInstanceRef.current && isMounted) {
            try {
              // Wrap event handlers to prevent errors if player is destroyed
              const safeOn = (event: string, handler: (...args: any[]) => void) => {
                try {
                  if (!isMounted || !playerInstanceRef.current) {
                    return;
                  }
                  const player = playerInstanceRef.current;
                  
                  // Verify player is still valid before adding listener
                  if (typeof player.on === 'function') {
                    // Wrap handler to check mount state before executing
                    const safeHandler = (...args: any[]) => {
                      if (isMounted && playerInstanceRef.current === player) {
                        try {
                          handler(...args);
                        } catch (err) {
                          console.warn(`Error in ${event} handler:`, err);
                        }
                      }
                    };
                    player.on(event, safeHandler);
                  }
                } catch (e) {
                  console.warn(`Error setting up ${event} handler:`, e);
                }
              };

              safeOn('ready', () => {
                if (isMounted && playerInstanceRef.current) {
                  setIsLoading(false);
                  setError(null);
                  if (onReady) {
                    onReady();
                  }
                }
              });

              safeOn('error', (err: any) => {
                if (isMounted) {
                  // High-signal diagnostic to identify why HLS/LLHLS init fails in production.
                  // (Can be removed once stable.)
                  console.error('OvenPlayer error event:', err);
                  const errorMsg = err?.message || 'Player error occurred';
                  setError(errorMsg);
                  setIsLoading(false);
                  if (onError) {
                    onError(err);
                  }
                }
              });

              safeOn('stateChanged', (state: any) => {
                if (isMounted && state?.newstate === 'playing' && playerInstanceRef.current) {
                  setIsLoading(false);
                  setError(null);
                }
              });

              // Time update for DVR support
              if (enableDvr && onTimeUpdate) {
                safeOn('timeUpdate', (timeData: any) => {
                  if (isMounted && playerInstanceRef.current) {
                    try {
                      const currentTime = timeData?.currentTime || 0;
                      const duration = timeData?.duration || 0;
                      onTimeUpdate(currentTime, duration);
                    } catch (err) {
                      console.warn('Error in timeUpdate handler:', err);
                    }
                  }
                });
              }

              // Expose player instance for external control
              if (onPlayerReady && isMounted) {
                onPlayerReady(playerInstanceRef.current);
              }
            } catch (handlerErr) {
              console.warn('Error setting up player event handlers:', handlerErr);
              if (isMounted) {
                setIsLoading(false);
              }
            }
          }
        } catch (createErr: any) {
          // Player creation might fail - handle gracefully
          if (isMounted) {
            console.warn('Failed to create OvenPlayer instance:', createErr);
            setIsLoading(false);
            setError('Failed to initialize player. Please refresh the page.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMsg = err?.message || 'Failed to initialize player';
          setError(errorMsg);
          setIsLoading(false);
          if (onError) {
            onError(err);
          }
        }
      }
    }, 100);

      return () => {
        // Set unmounted flag FIRST to prevent any new operations
        isMounted = false;
        
        // Clear init timeout immediately
        clearTimeout(initTimeout);
        
        // Clear any pending cleanup timeout
        if (cleanupTimeout) {
          clearTimeout(cleanupTimeout);
        }
        
        // Immediate aggressive cleanup - don't delay
        const player = playerInstanceRef.current || currentPlayerInstance;
        if (player) {
          try {
            // Stop all operations immediately
            try {
              if (typeof player.stop === 'function') {
                player.stop();
              }
              if (typeof player.pause === 'function') {
                player.pause();
              }
            } catch (e) {
              // Ignore - player might be in invalid state
            }
            
            // Remove all event listeners to prevent callbacks
            try {
              if (typeof player.off === 'function') {
                player.off(); // Remove all listeners
              }
            } catch (e) {
              // Ignore - listeners might already be removed
            }
            
            // Finally remove the player
            try {
              if (typeof player.remove === 'function') {
                player.remove();
              }
            } catch (e) {
              // Ignore cleanup errors - player might already be destroyed
            }
          } catch (e) {
            // Ignore all cleanup errors
          }
          playerInstanceRef.current = null;
          currentPlayerInstance = null;
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

