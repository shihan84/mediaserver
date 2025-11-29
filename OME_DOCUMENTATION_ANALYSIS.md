# OME Documentation Analysis & Implementation Recommendations

**Date:** November 29, 2025  
**Source:** OvenMediaEngine Official Documentation

## Current Implementation Status

### ✅ Implemented Features

1. **Stream Management**
   - Get all streams
   - Get stream details
   - Stream output URLs (LLHLS, HLS, DASH, WebRTC, SRT)
   - Thumbnail URLs

2. **Metrics & Statistics**
   - Database metrics tracking
   - OME metrics integration (basic)

3. **Player Integration**
   - HTML5 video player (basic)
   - HLS/LLHLS support via native browser player

## Missing Features from OME Documentation

### 1. **OvenPlayer Integration** (RECOMMENDED)

**What:** OvenPlayer is the official open-source HTML5 player optimized for OME
**Why:** Provides better WebRTC support, lower latency, and more features than native HTML5 video

**Implementation:**
```html
<script src="https://cdn.jsdelivr.net/npm/ovenplayer/dist/ovenplayer.js"></script>
```

```javascript
const player = OvenPlayer.create('player-div-id', {
    sources: [
        {
            type: 'webrtc',
            file: 'ws://ome.imagetv.in:3333/app/stream_name'
        },
        {
            type: 'llhls',
            file: 'http://ome.imagetv.in:3333/app/stream_name/llhls.m3u8'
        }
    ],
    autoFallback: true,
    webrtcConfig: {
        timeoutMaxRetry: 3,
        connectionTimeout: 5000
    }
});
```

**Benefits:**
- Automatic protocol fallback (WebRTC → LLHLS → HLS)
- Better error handling
- Sub-second latency for WebRTC
- Adaptive bitrate support
- Customizable UI

**Reference:** [OvenPlayer Documentation](https://docs.ovenplayer.com/)

---

### 2. **Enhanced Stream Metrics** (RECOMMENDED)

**Current:** Basic metrics from database and OME API

**Available from OME:**
- **Ingress Metrics:** Bitrate, codec, resolution, framerate, packet loss, RTT
- **Egress Metrics:** Viewer count, bitrate per output, connection stats
- **Transcoding Metrics:** CPU usage, encoding time, quality metrics
- **Real-time Statistics:** Per-stream detailed statistics

**OME API Endpoints:**
```
GET /v1/vhosts/{vhost}/apps/{app}/streams/{stream}/stats
GET /v1/vhosts/{vhost}/apps/{app}/streams/{stream}/tracks
GET /v1/stats/current/vhosts/{vhost}/apps/{app}/streams/{stream}
```

**Implementation:**
```typescript
// backend/src/utils/omeClient.ts
async getStreamStats(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  return await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/stats`);
}

async getStreamTracks(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  return await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/tracks`);
}
```

**Benefits:**
- Detailed codec information
- Video/audio track details
- Network quality metrics
- Transcoding performance data

---

### 3. **Event Monitoring** (ENHANCED)

**Current:** Basic event logging

**OME Supports:**
- Application creation/deletion events
- Stream start/stop events
- REST API call events
- Real-time event webhooks

**Implementation:**
```typescript
// WebSocket or polling for events
async getEvents(vhostName: string = 'default', limit: number = 100) {
  return await this.request('GET', `/v1/vhosts/${vhostName}/events?limit=${limit}`);
}
```

**Use Cases:**
- Real-time stream notifications
- System health monitoring
- Troubleshooting assistance

---

### 4. **Adaptive Bitrate Streaming (ABR)** (DISPLAY)

**Current:** Output profiles support, but not visualized

**Enhancement:** Display available renditions in stream detail view

**OME Provides:**
- Multiple output profiles
- Automatic quality switching
- Rendition information per profile

**Implementation:**
- Already fetching output profiles
- Display them in StreamDetailModal with quality indicators
- Show which rendition is currently active

---

### 5. **WebRTC Signaling URLs** (MISSING)

**Current:** WebRTC URL format: `webrtc://host:port/path`

**Correct OME WebRTC Format:**
```
ws://host:port/app/stream_name  (WebSocket signaling)
```

**For OvenPlayer:**
```javascript
{
    type: 'webrtc',
    file: 'ws://ome.imagetv.in:3333/app/stream_name'
}
```

**Fix:** Update `outputUrlService.ts` to generate correct WebRTC signaling URLs

---

### 6. **Stream Health Status** (NEW)

**OME Provides:**
- Stream state (connected, disconnected, error)
- Health status indicators
- Connection quality metrics

**Implementation:**
```typescript
// Check stream health
async getStreamHealth(streamName: string) {
  const stream = await this.getStream(streamName);
  const stats = await this.getStreamStats(streamName);
  
  return {
    isHealthy: stream.state === 'connected',
    quality: stats.quality,
    packetLoss: stats.packetLoss,
    latency: stats.latency
  };
}
```

---

### 7. **Real-time Viewer Count** (ENHANCED)

**Current:** Basic viewer count from database metrics

**OME Provides:**
- Real-time viewer count per stream
- Per-protocol viewer count (HLS, WebRTC, etc.)
- Historical viewer statistics

**Implementation:**
```typescript
// Get real-time viewer count
async getViewerCount(streamName: string) {
  const stats = await this.getStreamStats(streamName);
  return {
    total: stats.viewers?.total || 0,
    webrtc: stats.viewers?.webrtc || 0,
    hls: stats.viewers?.hls || 0,
    llhls: stats.viewers?.llhls || 0
  };
}
```

---

### 8. **Stream Recording Status** (INTEGRATE)

**Current:** Recording API exists but not shown in stream details

**Enhancement:** Display recording status in stream detail view

**Features:**
- Show if recording is active
- Display recording file path
- Show recording duration

---

### 9. **Push Publishing Status** (INTEGRATE)

**Current:** Push publishing API exists but not shown in stream details

**Enhancement:** Display active push publishing destinations in stream detail view

**Features:**
- List active push publishing targets
- Show push status and statistics
- Allow stopping push publishing from stream details

---

### 10. **SCTE-35 Markers Display** (ENHANCED)

**Current:** Can insert markers, but not shown in stream details

**Enhancement:** Display inserted markers in stream timeline

**Features:**
- Show inserted markers
- Display marker timeline
- Show marker metadata

---

## Implementation Priority

### High Priority (Immediate Impact)
1. ✅ **OvenPlayer Integration** - Better player experience
2. ✅ **Enhanced Stream Metrics** - More detailed statistics
3. ✅ **WebRTC Signaling URLs** - Fix WebRTC playback

### Medium Priority (Enhanced Features)
4. ✅ **Stream Health Status** - Better monitoring
5. ✅ **Real-time Viewer Count** - Accurate statistics
6. ✅ **Recording/Push Publishing Status** - Complete stream view

### Low Priority (Nice to Have)
7. ✅ **Event Monitoring** - Advanced monitoring
8. ✅ **ABR Visualization** - Quality indicators
9. ✅ **SCTE-35 Timeline** - Marker visualization

---

## Code References

### OME Official Documentation
- [OME REST API](https://docs.ovenmediaengine.com/rest-api)
- [OvenPlayer Documentation](https://docs.ovenplayer.com/)
- [OME Streaming Protocols](https://docs.ovenmediaengine.com/streaming/)
- [OME Monitoring](https://docs.ovenmediaengine.com/dev/logs-and-statistics)

### Our Implementation
- `backend/src/utils/omeClient.ts` - OME API client
- `backend/src/services/outputUrlService.ts` - URL generation
- `frontend/src/components/StreamDetailModal.tsx` - Stream detail view
- `frontend/src/pages/StreamsPage.tsx` - Streams listing

---

## Missing OME API Methods (To Add)

### Enhanced Metrics & Statistics

```typescript
// backend/src/utils/omeClient.ts - ADD THESE METHODS:

async getStreamStats(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  const result = await this.request('GET', `/v1/stats/current/vhosts/${vhostName}/apps/${appName}/streams/${streamName}`);
  return result.response || result;
}

async getStreamTracks(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  const result = await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/tracks`);
  return result.response || result;
}

// Get detailed ingress/egress statistics
async getStreamStatistics(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  const result = await this.request('GET', `/v1/vhosts/${vhostName}/apps/${appName}/streams/${streamName}/stats`);
  return result.response || result;
}
```

**Benefits:**
- Video/audio track details (codec, bitrate, resolution, framerate)
- Ingress statistics (packet loss, RTT, bandwidth)
- Egress statistics (viewer count per protocol, bitrate)
- Transcoding metrics (CPU usage, encoding time)

---

### Stream Health & Quality

```typescript
async getStreamHealth(streamName: string, vhostName: string = 'default', appName: string = 'app') {
  try {
    const stream = await this.getStream(streamName);
    const stats = await this.getStreamStatistics(streamName, vhostName, appName);
    
    return {
      state: stream.state,
      connected: stream.state === 'connected',
      quality: {
        bitrate: stats.ingress?.bitrate,
        packetLoss: stats.ingress?.packetLoss,
        latency: stats.ingress?.rtt,
        viewers: stats.egress?.totalViewers
      }
    };
  } catch (err) {
    return { state: 'unknown', connected: false };
  }
}
```

---

## Implementation Recommendations

### Immediate Actions (High Priority)

1. **✅ Integrate OvenPlayer** 
   - Replace native HTML5 video with OvenPlayer
   - Better WebRTC support
   - Automatic protocol fallback
   - Lower latency

2. **✅ Add Enhanced Metrics Endpoints**
   - Implement `getStreamStats`, `getStreamTracks`, `getStreamStatistics`
   - Display detailed codec/quality information
   - Show network quality metrics

3. **✅ Fix WebRTC URLs**
   - Update outputUrlService to generate correct WebSocket URLs
   - Format: `ws://host:port/app/stream_name` (not `webrtc://`)

### Short-term (Medium Priority)

4. **✅ Stream Health Indicators**
   - Add health status badge (healthy/unhealthy/error)
   - Display connection quality metrics
   - Show packet loss and latency warnings

5. **✅ Real-time Viewer Count**
   - Show per-protocol viewer count
   - Display viewer trends over time

6. **✅ Recording/Push Publishing Integration**
   - Show active recording status in stream details
   - Display push publishing destinations
   - Allow control actions from stream view

### Long-term (Nice to Have)

7. **Event Monitoring Dashboard**
   - Real-time event feed
   - Stream lifecycle events
   - System health events

8. **ABR Visualization**
   - Show available renditions
   - Display currently active quality
   - Allow manual quality selection

9. **SCTE-35 Marker Timeline**
   - Visual timeline of inserted markers
   - Marker metadata display
   - Marker insertion controls

---

## Next Steps

1. **Integrate OvenPlayer** in StreamDetailModal
2. **Add enhanced metrics endpoints** in backend
3. **Fix WebRTC URLs** in outputUrlService
4. **Add stream health indicators** to UI
5. **Display recording/push publishing status** in stream details

---

## Code Examples

### OvenPlayer Integration Example

```tsx
// frontend/src/components/OvenPlayer.tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    OvenPlayer: any;
  }
}

interface OvenPlayerProps {
  streamName: string;
  appName?: string;
  sources: Array<{
    type: 'webrtc' | 'llhls' | 'hls';
    file: string;
    label?: string;
  }>;
}

export function OvenPlayer({ streamName, appName = 'app', sources }: OvenPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!playerRef.current || !window.OvenPlayer) return;

    const playerConfig = {
      sources,
      autoFallback: true,
      webrtcConfig: {
        timeoutMaxRetry: 3,
        connectionTimeout: 5000
      },
      hlsConfig: {
        maxBufferLength: 10
      }
    };

    playerInstanceRef.current = window.OvenPlayer.create(
      playerRef.current,
      playerConfig
    );

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.remove();
      }
    };
  }, [sources]);

  return (
    <div>
      <div ref={playerRef} style={{ width: '100%', height: 'auto' }} />
      <script src="https://cdn.jsdelivr.net/npm/ovenplayer/dist/ovenplayer.js" />
    </div>
  );
}
```

### Enhanced Metrics Display Example

```tsx
// In StreamDetailModal.tsx
const { data: streamStats } = useQuery({
  queryKey: ['stream-stats', streamName],
  queryFn: async () => {
    const response = await streamsApi.getStats(streamName);
    return response.data;
  },
  enabled: open && !!streamName,
  refetchInterval: 3000, // Update every 3 seconds
});

// Display enhanced metrics
{streamStats && (
  <Card>
    <CardHeader>
      <CardTitle>Detailed Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Video Codec</p>
          <p className="font-medium">{streamStats.video?.codec || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Audio Codec</p>
          <p className="font-medium">{streamStats.audio?.codec || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Packet Loss</p>
          <p className="font-medium">{streamStats.ingress?.packetLoss || 0}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Latency (RTT)</p>
          <p className="font-medium">{streamStats.ingress?.rtt || 0}ms</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## References

- [OME REST API Documentation](https://docs.ovenmediaengine.com/rest-api)
- [OvenPlayer Documentation](https://docs.ovenplayer.com/)
- [OME Monitoring & Statistics](https://docs.ovenmediaengine.com/dev/logs-and-statistics)
- [OME Streaming Protocols](https://docs.ovenmediaengine.com/streaming/)
- [OME Adaptive Bitrate Streaming](https://docs.ovenmediaengine.com/dev/streaming/hls)

