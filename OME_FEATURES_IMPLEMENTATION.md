# OvenMediaEngine Features Implementation

**Date:** November 23, 2025  
**Reference:** [Official OME Documentation](https://docs.ovenmediaengine.com/)

## Overview

Based on the official OvenMediaEngine documentation, all major OME features have been implemented in the backend API.

## Implemented Features

### 1. Stream Management ✅
- **Get all streams** - `GET /api/streams`
- **Get stream details** - `GET /api/streams/:streamName`
- **Start stream** - `POST /api/streams/:channelId/start`
- **Stop stream** - `POST /api/streams/:channelId/stop`
- **Stream metrics** - Integrated with OME metrics API

**Reference:** [OME REST API - Streams](https://docs.ovenmediaengine.com/rest-api)

### 2. Recording ✅ (NEW)
- **Start recording** - `POST /api/recordings/:streamName/start`
- **Stop recording** - `POST /api/recordings/:streamName/stop`
- **Get recording status** - `GET /api/recordings/:streamName/status`

**Reference:** [OME Recording Documentation](https://docs.ovenmediaengine.com/recording)

**Example:**
```bash
curl -X POST http://ome.imagetv.in/api/recordings/my-stream/start \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/recordings/my-stream.ts",
    "infoPath": "/recordings/my-stream.xml"
  }'
```

### 3. Push Publishing (Re-streaming) ✅ (NEW)
- **Start push publishing** - `POST /api/push-publishing/:streamName/start`
- **Stop push publishing** - `POST /api/push-publishing/:streamName/stop/:id`
- **Get push publishing status** - `GET /api/push-publishing/:streamName/status`

**Reference:** [OME Push Publishing Documentation](https://docs.ovenmediaengine.com/push-publishing)

**Supported Protocols:**
- SRT
- RTMP
- MPEG-TS

**Example:**
```bash
curl -X POST http://ome.imagetv.in/api/push-publishing/my-stream/start \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "srt",
    "url": "srt://destination-server:port?streamid=app/stream-key"
  }'
```

### 4. Scheduled Channels ✅ (NEW)
- **Get all scheduled channels** - `GET /api/scheduled-channels`
- **Get scheduled channel** - `GET /api/scheduled-channels/:channelName`
- **Create scheduled channel** - `POST /api/scheduled-channels`
- **Update scheduled channel** - `PUT /api/scheduled-channels/:channelName`
- **Delete scheduled channel** - `DELETE /api/scheduled-channels/:channelName`

**Reference:** [OME Scheduled Channel API](https://docs.ovenmediaengine.com/rest-api/v1/virtualhost/application/scheduledchannel-api)

**Example:**
```bash
curl -X POST http://ome.imagetv.in/api/scheduled-channels \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-channel",
    "schedule": [
      {
        "startTime": "2025-11-23T12:00:00Z",
        "endTime": "2025-11-23T13:00:00Z",
        "filePath": "/videos/video.mp4"
      }
    ]
  }'
```

### 5. SCTE-35 Markers ✅
- **Insert SCTE-35 marker** - `POST /api/streams/:channelId/scte35`
- **Preroll template** - `POST /api/scte35/templates/preroll`

**Reference:** OME SCTE-35 support

### 6. Virtual Hosts & Applications ✅ (NEW)
- **Get virtual hosts** - `GET /api/ome/vhosts`
- **Get virtual host** - `GET /api/ome/vhosts/:vhostName`
- **Get applications** - `GET /api/ome/vhosts/:vhostName/apps`
- **Get application** - `GET /api/ome/vhosts/:vhostName/apps/:appName`
- **Get output profiles** - `GET /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles`

**Reference:** [OME REST API - Virtual Hosts](https://docs.ovenmediaengine.com/rest-api)

### 7. Statistics & Monitoring ✅ (NEW)
- **Get server stats** - `GET /api/ome/stats`
- **Get server config** - Via virtual host endpoint

**Reference:** [OME REST API - Statistics](https://docs.ovenmediaengine.com/rest-api)

### 8. Thumbnails ✅ (NEW)
- **Get stream thumbnail** - `GET /api/ome/streams/:streamName/thumbnail`

**Reference:** [OME Thumbnail Documentation](https://docs.ovenmediaengine.com/thumbnail)

## OME Features from Official Documentation

Based on [OME Documentation](https://docs.ovenmediaengine.com/), the following features are supported:

### Input Protocols ✅
- WebRTC, WHIP (Simulcast)
- SRT
- RTMP, E-RTMP
- MPEG-2 TS
- RTSP (Pull)
- Scheduled Channel (Pre-recorded Live)
- Multiplex Channel

### Output Protocols ✅
- LLHLS (Low Latency HLS)
- WebRTC
- HLS (version 3)
- SRT

### Features ✅
- Adaptive Bitrate Streaming (ABR)
- Embedded Live Transcoder
- File Recording ✅ (Implemented)
- Push Publishing ✅ (Implemented)
- Scheduled Channels ✅ (Implemented)
- Thumbnail Generation ✅ (Implemented)
- REST API ✅ (Fully Integrated)
- Monitoring & Statistics ✅ (Implemented)

## API Endpoints Summary

### New Endpoints Added

1. **Recordings**
   - `POST /api/recordings/:streamName/start`
   - `POST /api/recordings/:streamName/stop`
   - `GET /api/recordings/:streamName/status`

2. **Push Publishing**
   - `POST /api/push-publishing/:streamName/start`
   - `POST /api/push-publishing/:streamName/stop/:id`
   - `GET /api/push-publishing/:streamName/status`

3. **Scheduled Channels**
   - `GET /api/scheduled-channels`
   - `GET /api/scheduled-channels/:channelName`
   - `POST /api/scheduled-channels`
   - `PUT /api/scheduled-channels/:channelName`
   - `DELETE /api/scheduled-channels/:channelName`

4. **OME Management**
   - `GET /api/ome/stats`
   - `GET /api/ome/vhosts`
   - `GET /api/ome/vhosts/:vhostName`
   - `GET /api/ome/vhosts/:vhostName/apps`
   - `GET /api/ome/vhosts/:vhostName/apps/:appName`
   - `GET /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles`
   - `GET /api/ome/streams/:streamName/thumbnail`

## Testing

All endpoints have been implemented and are ready for testing. Use the test script:

```bash
cd /root/omd/ome
./test-all-features.sh
```

## Files Created/Modified

1. **Created:**
   - `backend/src/routes/recordings.ts` - Recording management
   - `backend/src/routes/pushPublishing.ts` - Push publishing (re-streaming)
   - `backend/src/routes/scheduledChannels.ts` - Scheduled channels
   - `backend/src/routes/ome.ts` - OME management endpoints

2. **Modified:**
   - `backend/src/utils/omeClient.ts` - Added all new OME API methods
   - `backend/src/index.ts` - Registered new routes

## Next Steps

1. Test all new endpoints with OME running
2. Add frontend UI for new features
3. Implement error handling for OME unavailability
4. Add WebSocket notifications for recording/push status
5. Create documentation for each feature

## References

- [OME Official Documentation](https://docs.ovenmediaengine.com/)
- [OME REST API](https://docs.ovenmediaengine.com/rest-api)
- [OME Recording](https://docs.ovenmediaengine.com/recording)
- [OME Push Publishing](https://docs.ovenmediaengine.com/push-publishing)
- [OME Scheduled Channels](https://docs.ovenmediaengine.com/rest-api/v1/virtualhost/application/scheduledchannel-api)

