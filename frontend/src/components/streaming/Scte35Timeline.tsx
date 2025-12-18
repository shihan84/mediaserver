import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Clock, Plus, Trash2, Eye } from 'lucide-react';

interface SCTE35Marker {
  id: string;
  name: string;
  type: string;
  timestamp?: number; // Timestamp in seconds from stream start
  cueOut?: boolean;
  cueIn?: boolean;
  duration?: number;
  [key: string]: any;
}

interface Scte35TimelineProps {
  markers: SCTE35Marker[];
  currentTime?: number; // Current playback time in seconds
  duration?: number; // Total duration/DVR window in seconds
  onMarkerClick?: (marker: SCTE35Marker) => void;
  onMarkerInsert?: (markerId: string, streamName: string) => void;
  onMarkerDelete?: (markerId: string) => void;
  streamName?: string;
  readonly?: boolean;
}

/**
 * SCTE-35 Timeline Visualization Component
 * Displays markers on a visual timeline with click-to-seek functionality
 */
export function Scte35Timeline({
  markers,
  currentTime = 0,
  duration = 3600, // Default 1 hour window
  onMarkerClick,
  onMarkerInsert,
  onMarkerDelete,
  streamName,
  readonly = false,
}: Scte35TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1); // Timeline zoom level

  // Calculate marker positions as percentage of timeline
  const getMarkerPosition = (marker: SCTE35Marker): number => {
    if (marker.timestamp !== undefined) {
      return Math.min(100, Math.max(0, (marker.timestamp / duration) * 100));
    }
    // If no timestamp, distribute markers evenly (fallback)
    const index = markers.indexOf(marker);
    return (index / Math.max(1, markers.length - 1)) * 100;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || readonly) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const seekTime = (percentage / 100) * duration;

    if (onMarkerClick) {
      // Create a temporary marker at click position for seeking
      onMarkerClick({
        id: 'seek',
        name: 'Seek',
        type: 'SEEK',
        timestamp: seekTime,
      } as SCTE35Marker);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerColor = (type: string): string => {
    const t = type?.toUpperCase() || '';
    if (t.includes('CUE_OUT') || t.includes('OUT')) return 'bg-red-500';
    if (t.includes('CUE_IN') || t.includes('IN')) return 'bg-green-500';
    if (t.includes('SPLICE_INSERT')) return 'bg-blue-500';
    if (t.includes('TIME_SIGNAL')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getMarkerLabel = (marker: SCTE35Marker): string => {
    if (marker.name) return marker.name;
    if (marker.type) return marker.type.replace('_', ' ');
    return 'Marker';
  };

  // Note: Markers are displayed individually - grouping logic can be added if needed for overlapping markers

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <h3 className="font-semibold">SCTE-35 Timeline</h3>
          <span className="text-xs text-muted-foreground">
            ({markers.length} marker{markers.length !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            −
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
          >
            +
          </Button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Time Scale */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <span key={ratio}>{formatTime(ratio * duration)}</span>
          ))}
        </div>

        {/* Timeline Track */}
        <div
          ref={timelineRef}
          className="relative h-16 bg-gray-100 rounded-lg border-2 border-gray-300 cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
          style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center' }}
        >
          {/* Current Time Indicator */}
          {currentTime > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
            </div>
          )}

          {/* Markers */}
          {markers.map((marker) => {
            const position = getMarkerPosition(marker);
            const color = getMarkerColor(marker.type);
            const isHovered = hoveredMarker === marker.id;

            return (
              <div
                key={marker.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 group"
                style={{ left: `${position}%` }}
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {/* Marker Point */}
                <div
                  className={`w-4 h-4 ${color} rounded-full border-2 border-white shadow-lg cursor-pointer transition-all ${
                    isHovered ? 'scale-125' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMarkerClick) {
                      onMarkerClick(marker);
                    }
                  }}
                />

                {/* Marker Line */}
                <div
                  className={`absolute top-1/2 left-1/2 w-0.5 h-12 ${color} opacity-50 transform -translate-x-1/2 -translate-y-full`}
                />

                {/* Marker Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-30">
                    <div className="font-semibold">{getMarkerLabel(marker)}</div>
                    <div className="text-gray-300 mt-1">
                      {marker.timestamp !== undefined ? formatTime(marker.timestamp) : 'No timestamp'}
                    </div>
                    {marker.type && (
                      <div className="text-gray-400 mt-1">{marker.type}</div>
                    )}
                    {marker.duration && (
                      <div className="text-gray-400">Duration: {formatTime(marker.duration)}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Live Edge Indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600 opacity-75" />
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 px-2 py-0.5 bg-red-600 text-white text-xs rounded">
            LIVE
          </div>
        </div>
      </div>

      {/* Marker List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {markers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No SCTE-35 markers available</p>
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-3 h-3 rounded-full ${getMarkerColor(marker.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{getMarkerLabel(marker)}</div>
                  <div className="text-xs text-muted-foreground">
                    {marker.timestamp !== undefined
                      ? formatTime(marker.timestamp)
                      : 'No timestamp'} • {marker.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onMarkerClick) {
                      onMarkerClick(marker);
                    }
                  }}
                  title="Seek to marker"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {!readonly && streamName && onMarkerInsert && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkerInsert(marker.id, streamName)}
                    title="Insert marker into stream"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                {!readonly && onMarkerDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkerDelete(marker.id)}
                    title="Delete marker"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

