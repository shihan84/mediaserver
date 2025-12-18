import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, Rewind, FastForward, SkipBack, SkipForward } from 'lucide-react';

interface DVRControlsProps {
  playerInstance: any;
  dvrStatus: {
    enabled: boolean;
    available: boolean;
    window: number | null; // DVR window in seconds
  };
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

/**
 * DVR Controls Component
 * Provides time-shift playback controls for live streams with DVR enabled
 */
export function DVRControls({
  dvrStatus,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
}: DVRControlsProps) {
  const [seekTime, setSeekTime] = useState(currentTime);
  const [isSeeking, setIsSeeking] = useState(false);

  // Update seek time when current time changes (but not while seeking)
  useEffect(() => {
    if (!isSeeking) {
      setSeekTime(currentTime);
    }
  }, [currentTime, isSeeking]);

  if (!dvrStatus.enabled || !dvrStatus.available) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (newTime: number) => {
    // Clamp seek time to valid range
    const clampedTime = Math.max(0, Math.min(newTime, duration || 0));
    setSeekTime(clampedTime);
    setIsSeeking(true);
    onSeek(clampedTime);
    
    // Reset seeking flag after a short delay
    setTimeout(() => {
      setIsSeeking(false);
    }, 100);
  };

  const handleRewind = (seconds: number = 10) => {
    handleSeek(currentTime - seconds);
  };

  const handleFastForward = (seconds: number = 10) => {
    handleSeek(currentTime + seconds);
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setSeekTime(newTime);
    setIsSeeking(true);
  };

  const handleTimelineMouseUp = () => {
    onSeek(seekTime);
    setTimeout(() => {
      setIsSeeking(false);
    }, 100);
  };

  // Calculate live edge position (if duration is the DVR window)
  const liveEdge = duration || 0;
  const isAtLiveEdge = Math.abs(currentTime - liveEdge) < 1;

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">DVR Controls</span>
          {isAtLiveEdge && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">LIVE</span>
          )}
        </div>
        <div className="text-muted-foreground">
          {formatTime(currentTime)} / {dvrStatus.window ? formatTime(dvrStatus.window) : '--:--'}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={duration || dvrStatus.window || 0}
          value={seekTime}
          step="1"
          onChange={handleTimelineChange}
          onMouseUp={handleTimelineMouseUp}
          onTouchEnd={handleTimelineMouseUp}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          disabled={!duration && !dvrStatus.window}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(0)}</span>
          <span>{formatTime(duration || dvrStatus.window || 0)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRewind(30)}
          disabled={currentTime <= 0}
          title="Rewind 30 seconds"
        >
          <SkipBack className="w-4 h-4" />
          <span className="ml-1 text-xs">30s</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRewind(10)}
          disabled={currentTime <= 0}
          title="Rewind 10 seconds"
        >
          <Rewind className="w-4 h-4" />
          <span className="ml-1 text-xs">10s</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onPlayPause}
          className="px-6"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Play
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFastForward(10)}
          disabled={isAtLiveEdge}
          title="Fast forward 10 seconds"
        >
          <span className="mr-1 text-xs">10s</span>
          <FastForward className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFastForward(30)}
          disabled={isAtLiveEdge}
          title="Fast forward 30 seconds"
        >
          <span className="mr-1 text-xs">30s</span>
          <SkipForward className="w-4 h-4" />
        </Button>

        {!isAtLiveEdge && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeek(liveEdge)}
            title="Jump to live"
            className="ml-2"
          >
            <span className="text-xs">Go Live</span>
          </Button>
        )}
      </div>

      {/* DVR Window Info */}
      {dvrStatus.window && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          DVR Window: {dvrStatus.window} seconds
        </div>
      )}
    </div>
  );
}

