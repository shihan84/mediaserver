import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Hls?: any;
  }
}

type Props = {
  src: string;
  className?: string;
  muted?: boolean;
  autoPlay?: boolean;
  onFatalError?: (reason: string) => void;
};

export function HlsVideoPlayer({ src, className = '', muted = true, autoPlay = true, onFatalError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    const ensureScript = (scriptSrc: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${scriptSrc}"]`);
        if (existing) return resolve();
        const s = document.createElement('script');
        s.src = scriptSrc;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${scriptSrc}`));
        document.head.appendChild(s);
      });

    // Native HLS (Safari). Chrome may return a truthy value but still fail to parse the manifest,
    // causing DEMUXER_ERROR_COULD_NOT_PARSE. Restrict native path to Safari.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {
          // autoplay might be blocked; user gesture will be required
        });
      }
      return;
    }

    let cancelled = false;
    let hls: any = null;
    let mediaRecoverAttempts = 0;

    (async () => {
      try {
        // Make sure hls.js is present even if OvenPlayer isn't mounted
        if (!window.Hls) {
          await ensureScript('/hls.min.js?v=3');
        }

        const Hls = window.Hls;
        if (!Hls || typeof Hls.isSupported !== 'function' || !Hls.isSupported()) {
          if (!cancelled) setError('HLS is not supported in this browser.');
          return;
        }

        // Ensure we aren't leaving a previous direct-manifest src set
        try {
          video.removeAttribute('src');
          // eslint-disable-next-line no-param-reassign
          (video as any).srcObject = null;
          video.load();
        } catch {
          // ignore
        }

        hls = new Hls({
          // OME LLHLS manifests work fine in normal mode; lowLatencyMode has caused
          // `bufferAppendError` / unstable playback in some browsers.
          lowLatencyMode: false,
          enableWorker: true,
          backBufferLength: 30,
          liveSyncDurationCount: 3,
          maxBufferLength: 30,
          // Be a bit more tolerant for live streams
          maxBufferHole: 1.0,
        });

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
          // Non-fatal errors are retried internally by hls.js.
          if (!data?.fatal) return;

          // Try to recover from MEDIA_ERROR (commonly emitted as bufferAppendError).
          if (data?.type === Hls.ErrorTypes?.MEDIA_ERROR && mediaRecoverAttempts < 2) {
            mediaRecoverAttempts += 1;
            try {
              hls.recoverMediaError();
              return;
            } catch {
              // fall through to fatal handling
            }
          }

          const reason = data?.details || data?.type || 'HLS error';
          if (!cancelled) setError(reason);
          onFatalError?.(reason);
          try {
            hls.destroy();
          } catch {
            // ignore
          }
        });

        // Autoplay attempt
        if (autoPlay) {
          video.play().catch(() => {
            // autoplay might be blocked; user gesture will be required
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to initialize HLS');
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (hls) hls.destroy();
      } catch {
        // ignore
      }
    };
  }, [src, autoPlay]);

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
    <video
      ref={videoRef}
      className={className}
      controls
      playsInline
      muted={muted}
      autoPlay={autoPlay}
    />
  );
}


