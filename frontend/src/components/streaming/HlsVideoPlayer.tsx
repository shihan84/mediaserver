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
};

export function HlsVideoPlayer({ src, className = '', muted = true, autoPlay = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    // Native HLS (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {
          // autoplay might be blocked; user gesture will be required
        });
      }
      return;
    }

    const Hls = window.Hls;
    if (!Hls || typeof Hls.isSupported !== 'function' || !Hls.isSupported()) {
      setError('HLS is not supported in this browser.');
      return;
    }

    const hls = new Hls({
      liveSyncDuration: 3,
      maxBufferLength: 10,
      lowLatencyMode: true,
    });

    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(src);
    });

    hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
      // Surface fatal errors only; non-fatal are retried internally
      if (data?.fatal) {
        setError(data?.details || data?.type || 'HLS error');
        try {
          hls.destroy();
        } catch {
          // ignore
        }
      }
    });

    // Autoplay attempt
    if (autoPlay) {
      video.play().catch(() => {
        // autoplay might be blocked; user gesture will be required
      });
    }

    return () => {
      try {
        hls.destroy();
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


