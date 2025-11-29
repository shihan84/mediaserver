# Complete Guide: Creating Live Channels with All OME Options

**Last Updated:** 2025-01-23  
**Reference:** [OME Official Documentation](https://docs.ovenmediaengine.com/)

## Overview

This guide outlines the comprehensive approach for creating live streaming channels in OvenMediaEngine with all available features and options.

---

## Channel Creation Architecture

### 1. **Database Channel Model** (Prisma)
The channel is stored in PostgreSQL with metadata:

```typescript
{
  name: string,              // Unique channel name
  description?: string,      // Channel description
  streamKey: string,         // Unique stream key for ingestion
  isActive: boolean,         // Channel status
  vodFallbackEnabled: boolean, // Enable VOD fallback
  vodFallbackFiles: string[], // Array of VOD file paths/URLs
  vodFallbackDelay: number,   // Seconds before fallback activates
  config: object,            // Additional channel configuration
  metadata: object           // Custom metadata
}
```

### 2. **OME Scheduled Channel** (Persistent Live Channel)
When VOD fallback is enabled, creates an OME Scheduled Channel that:
- Continuously plays live stream (`stream://default/app/{streamKey}`)
- Automatically falls back to VOD files when live stream drops
- Returns to live stream when it becomes available again

### 3. **OME Stream** (Runtime)
Created when stream starts via ingest (RTMP, SRT, WebRTC, etc.)

---

## Complete Channel Creation Process

### Step 1: Create Database Channel Record

**Endpoint:** `POST /api/channels`

**Required Fields:**
```json
{
  "name": "my-live-channel",
  "streamKey": "unique-stream-key-123",
  "description": "My live streaming channel"
}
```

**Optional Fields:**
```json
{
  "vodFallbackEnabled": true,
  "vodFallbackFiles": [
    "file:///path/to/slideshow.mp4",
    "http://example.com/fallback-video.mp4"
  ],
  "vodFallbackDelay": 5,
  "config": {
    "customSetting": "value"
  },
  "metadata": {
    "category": "sports",
    "quality": "HD"
  }
}
```

**Implementation:** `backend/src/routes/channels.ts:82-119`

---

### Step 2: Setup OME Scheduled Channel (if VOD Fallback Enabled)

**Automatic Setup:** When `vodFallbackEnabled: true`, the system automatically:

1. Creates OME Scheduled Channel with two programs:
   - **FallbackProgram:** Activates when live stream is unavailable
   - **Main Program:** Continuous live stream (`stream://default/app/{streamKey}`)

**Implementation:** `backend/src/services/scheduledChannelService.ts:18-96`

**OME Schedule Structure:**
```json
{
  "schedule": [
    {
      "type": "FallbackProgram",
      "items": [
        { "url": "file:///path/to/vod1.mp4" },
        { "url": "file:///path/to/vod2.mp4" }
      ]
    },
    {
      "type": "Program",
      "name": "live",
      "scheduled": "2000-01-01T00:00:00.000Z",
      "repeat": true,
      "items": [
        {
          "url": "stream://default/app/unique-stream-key-123",
          "duration": -1
        }
      ]
    }
  ]
}
```

**Reference:** [OME Persistent Live Channel Pattern](https://docs.ovenmediaengine.com/live-source/scheduled-channel#application--persistent-live-channel)

---

### Step 3: Configure Input Protocols

OME supports multiple input protocols. The channel's `streamKey` is used for:

#### A. **RTMP/RTMPS Ingestion**
```bash
# RTMP URL: rtmp://server:1935/app/streamKey
# Example: rtmp://ome-server:1935/app/unique-stream-key-123
```

#### B. **SRT Ingestion**
```bash
# SRT URL: srt://server:9998?streamid=app/streamKey
# Example: srt://ome-server:9998?streamid=app/unique-stream-key-123
```

#### C. **WebRTC/WHIP Ingestion**
```javascript
// WebRTC publish URL: webrtc://server/app/streamKey
// WHIP endpoint: https://server:3333/app/streamKey
```

#### D. **MPEG-2 TS (UDP/TCP)**
```bash
# UDP: udp://server:4000
# TCP: tcp://server:4001
# Configured in OME config for specific streamKey
```

#### E. **RTSP Pull**
```bash
# Configured as scheduled channel item:
{
  "type": "Program",
  "items": [
    {
      "url": "rtsp://source-server:554/stream",
      "duration": 3600
    }
  ]
}
```

**Note:** The stream key must match the channel's `streamKey` field for proper routing.

---

### Step 4: Configure Output Protocols (Transcoding)

OME automatically generates outputs based on configured Output Profiles in the Application.

**Check Available Output Profiles:**
```bash
GET /api/ome/vhosts/default/apps/app/outputProfiles
```

**Common Output Profiles:**
- **LLHLS** (Low Latency HLS): `https://server/app/streamKey/llhls.m3u8`
- **HLS**: `https://server/app/streamKey/playlist.m3u8`
- **WebRTC**: `webrtc://server/app/streamKey`
- **SRT**: `srt://server:9998?streamid=app/streamKey`

**Transcoding Options:**
- Adaptive Bitrate Streaming (ABR)
- Resolution scaling (1080p, 720p, 480p, etc.)
- Bitrate controls
- Codec selection (H.264, H.265, VP8, VP9, AV1)

**Configuration:** Done in OME Server Configuration (`Server.xml`)

---

### Step 5: Setup Distributors (HLS/MPD/SRT Outputs)

**Create Distributor for Channel:**

**Endpoint:** `POST /api/distributors`

```json
{
  "channelId": "channel-uuid",
  "name": "hls-distributor",
  "type": "HLS_MPD",
  "hlsUrl": "https://cdn.example.com/app/streamKey/playlist.m3u8",
  "mpdUrl": "https://cdn.example.com/app/streamKey/manifest.mpd",
  "scte35Enabled": true,
  "autoPreroll": true,
  "prerollMarkerId": "marker-uuid",
  "config": {
    "cdn": "cloudflare",
    "region": "us-east"
  }
}
```

**For SRT Distribution:**
```json
{
  "channelId": "channel-uuid",
  "name": "srt-distributor",
  "type": "SRT",
  "srtEndpoint": "srt://cdn-server:9998",
  "srtStreamKey": "distributed-stream-key",
  "scte35Enabled": true
}
```

---

### Step 6: Configure Additional Features

#### A. **Recording**

Start recording when stream is active:

```bash
POST /api/recordings/{streamName}/start
{
  "filePath": "/recordings/channel-name/recording.ts",
  "infoPath": "/recordings/channel-name/recording.xml"
}
```

**Implementation:** `backend/src/routes/recordings.ts`

#### B. **Push Publishing (Re-streaming)**

Push stream to external destinations:

```bash
POST /api/push-publishing/{streamName}/start
{
  "protocol": "rtmp",  // rtmp, srt, mpegts
  "url": "rtmp://destination-server:1935/app/stream",
  "streamKey": "destination-key"
}
```

**Implementation:** `backend/src/routes/pushPublishing.ts`

#### C. **SCTE-35 Markers**

Insert ad markers, cue points:

```bash
POST /api/streams/{channelId}/scte35
{
  "markerId": "marker-uuid"
}
```

**Implementation:** `backend/src/routes/streams.ts:153+`

---

## Complete Channel Creation Example

### Full Workflow:

```typescript
// 1. Create Channel with VOD Fallback
const channelResponse = await fetch('/api/channels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    name: 'sports-live',
    streamKey: 'sports-2025-01-23',
    description: 'Live Sports Channel',
    vodFallbackEnabled: true,
    vodFallbackFiles: [
      'file:///var/vod/slideshow.mp4',
      'http://cdn.example.com/default-loop.mp4'
    ],
    vodFallbackDelay: 5,
    config: {
      category: 'sports',
      priority: 'high'
    }
  })
});

const { channel } = await channelResponse.json();

// 2. Create HLS/MPD Distributor
const distributorResponse = await fetch('/api/distributors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    channelId: channel.id,
    name: 'sports-hls-cdn',
    type: 'HLS_MPD',
    hlsUrl: 'https://cdn.example.com/app/sports-2025-01-23/playlist.m3u8',
    mpdUrl: 'https://cdn.example.com/app/sports-2025-01-23/manifest.mpd',
    scte35Enabled: true,
    autoPreroll: true,
    prerollMarkerId: 'preroll-ad-uuid'
  })
});

// 3. Start Ingest (Client-side)
// Use RTMP, SRT, WebRTC, etc. with streamKey: 'sports-2025-01-23'

// 4. Stream automatically starts in OME
// VOD fallback activates if stream drops

// 5. (Optional) Start Recording
await fetch('/api/recordings/sports-2025-01-23/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    filePath: '/recordings/sports-2025-01-23.ts',
    infoPath: '/recordings/sports-2025-01-23.xml'
  })
});

// 6. (Optional) Start Push Publishing
await fetch('/api/push-publishing/sports-2025-01-23/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TOKEN'
  },
  body: JSON.stringify({
    protocol: 'rtmp',
    url: 'rtmp://social-platform.com/live',
    streamKey: 'platform-stream-key'
  })
});
```

---

## Available OME Features Summary

### ✅ Input Protocols
1. **RTMP/RTMPS** - Standard RTMP ingestion
2. **SRT** - Secure Reliable Transport
3. **WebRTC** - Browser-based publishing
4. **WHIP** - WebRTC-HTTP Ingestion Protocol
5. **MPEG-2 TS** - UDP/TCP transport stream
6. **RTSP Pull** - Pull streams from RTSP sources
7. **Scheduled Channel** - Pre-recorded content

### ✅ Output Protocols
1. **LLHLS** - Low Latency HLS (< 3s latency)
2. **HLS** - HTTP Live Streaming
3. **DASH (MPD)** - Dynamic Adaptive Streaming
4. **WebRTC** - Low latency playback
5. **SRT** - Secure Reliable Transport output

### ✅ Features
1. **Adaptive Bitrate (ABR)** - Automatic quality adjustment
2. **Live Transcoding** - Real-time encoding/decoding
3. **VOD Fallback** - Automatic fallback to VOD content
4. **Recording** - File-based recording
5. **Push Publishing** - Re-stream to external platforms
6. **SCTE-35** - Ad insertion and cue points
7. **Thumbnails** - Automatic thumbnail generation
8. **Statistics** - Real-time metrics and monitoring

---

## Best Practices

### 1. **Stream Key Naming**
- Use unique, descriptive names: `{category}-{date}-{id}`
- Example: `sports-2025-01-23-game1`
- Avoid special characters

### 2. **VOD Fallback Files**
- Use absolute paths or full URLs
- Prefer `file://` for local files
- Test fallback files before enabling
- Use multiple files for looping

### 3. **Error Handling**
- Always check if OME service is running
- Handle VOD fallback setup failures gracefully
- Log all channel operations for debugging

### 4. **Security**
- Use unique stream keys per channel
- Validate stream keys on ingest
- Enable authentication for OME API
- Use HTTPS for all external URLs

### 5. **Monitoring**
- Monitor stream metrics via `/api/metrics/streams/{channelId}`
- Set up alerts for stream failures
- Track VOD fallback activations
- Monitor recording disk space

---

## Configuration Files Reference

### OME Server Configuration (`Server.xml`)
Located at: `/usr/share/ovenmediaengine/conf/Server.xml`

Key sections:
- **VirtualHosts** - Domain/host configuration
- **Applications** - App-level settings
- **Providers** - Input protocol configuration
- **Publishers** - Output protocol configuration
- **OutputProfiles** - Transcoding profiles

### Application Configuration
- Input Providers: RTMP, SRT, WebRTC, etc.
- Output Publishers: HLS, LLHLS, WebRTC, etc.
- Output Profiles: Resolution, bitrate, codec settings

---

## API Reference

### Channel Management
- `POST /api/channels` - Create channel
- `PUT /api/channels/:id` - Update channel
- `GET /api/channels/:id` - Get channel details
- `DELETE /api/channels/:id` - Delete channel

### Stream Operations
- `POST /api/streams/:channelId/start` - Start stream (returns stream key)
- `POST /api/streams/:channelId/stop` - Stop stream
- `GET /api/streams/:streamName` - Get stream details

### Scheduled Channels (VOD Fallback)
- `GET /api/scheduled-channels` - List all scheduled channels
- `POST /api/scheduled-channels` - Create scheduled channel
- `PUT /api/scheduled-channels/:name` - Update scheduled channel
- `DELETE /api/scheduled-channels/:name` - Delete scheduled channel

### Distributors
- `POST /api/distributors` - Create distributor
- `GET /api/distributors/channel/:channelId` - Get channel distributors
- `PUT /api/distributors/:id` - Update distributor
- `DELETE /api/distributors/:id` - Delete distributor

### Recording
- `POST /api/recordings/:streamName/start` - Start recording
- `POST /api/recordings/:streamName/stop` - Stop recording
- `GET /api/recordings/:streamName/status` - Get recording status

### Push Publishing
- `POST /api/push-publishing/:streamName/start` - Start push publishing
- `POST /api/push-publishing/:streamName/stop/:id` - Stop push publishing
- `GET /api/push-publishing/:streamName/status` - Get push status

### SCTE-35
- `POST /api/streams/:channelId/scte35` - Insert SCTE-35 marker
- `POST /api/scte35/templates/preroll` - Create preroll template

---

## Troubleshooting

### Channel Not Receiving Streams
1. Verify stream key matches exactly
2. Check OME input provider is enabled
3. Verify network connectivity to OME server
4. Check OME logs: `/var/log/ovenmediaengine/`

### VOD Fallback Not Working
1. Verify scheduled channel was created
2. Check VOD file paths are accessible
3. Verify file formats are supported
4. Check OME scheduled channel logs

### Output URLs Not Accessible
1. Verify Output Profiles are configured
2. Check Application Publisher settings
3. Verify Virtual Host domain settings
4. Test with direct OME API calls

---

## Additional Resources

- [OME Official Documentation](https://docs.ovenmediaengine.com/)
- [OME REST API Reference](https://docs.ovenmediaengine.com/rest-api)
- [Scheduled Channels Guide](https://docs.ovenmediaengine.com/live-source/scheduled-channel)
- [Push Publishing Guide](https://docs.ovenmediaengine.com/push-publishing)
- [Recording Guide](https://docs.ovenmediaengine.com/recording)

---

## Implementation Files

- Channel Routes: `backend/src/routes/channels.ts`
- Scheduled Channel Service: `backend/src/services/scheduledChannelService.ts`
- OME Client: `backend/src/utils/omeClient.ts`
- Distributor Routes: `backend/src/routes/distributors.ts`
- Recording Routes: `backend/src/routes/recordings.ts`
- Push Publishing Routes: `backend/src/routes/pushPublishing.ts`

