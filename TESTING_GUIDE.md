# Testing Guide for Implemented Features

**Date:** November 29, 2025  
**Version:** 1.0

---

## Overview

This guide provides comprehensive testing instructions for all implemented features from Phase 1 and Phase 2.

---

## Prerequisites

1. **Backend Running:**
   ```bash
   cd /root/omd/ome/backend
   npm run dev
   ```

2. **Frontend Running:**
   ```bash
   cd /root/omd/ome/frontend
   npm run dev
   ```

3. **OME Service Running:**
   ```bash
   sudo systemctl status ovenmediaengine
   ```

4. **Database Access:**
   - PostgreSQL should be running
   - Database should be migrated

---

## Quick Test Script

Run the automated test script:

```bash
cd /root/omd/ome
chmod +x test-implemented-features.sh
./test-implemented-features.sh
```

Or with custom configuration:

```bash
API_URL=http://ome.imagetv.in:3001 \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=Admin123! \
./test-implemented-features.sh
```

---

## Manual Testing Guide

### 1. Event Monitoring Dashboard

#### Backend API Tests

**Get Events:**
```bash
curl -X GET "http://127.0.0.1:3001/api/ome/events" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "events": [],
  "vhostName": "default",
  "limit": 100,
  "offset": 0
}
```

**Get Events with Filters:**
```bash
curl -X GET "http://127.0.0.1:3001/api/ome/events?vhostName=default&limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Event Webhooks:**
```bash
curl -X GET "http://127.0.0.1:3001/api/ome/events/webhooks?vhostName=default" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Frontend UI Tests

1. **Navigate to Event Monitoring:**
   - Open browser: `http://localhost:5173`
   - Login with admin credentials
   - Click "Event Monitoring" in sidebar

2. **Verify Features:**
   - ✅ Events list is displayed
   - ✅ Filter by event type works
   - ✅ Auto-refresh toggle works (5s interval)
   - ✅ Statistics cards show counts
   - ✅ Event details are visible
   - ✅ Virtual host filter works

3. **Test Auto-Refresh:**
   - Enable auto-refresh
   - Create/stop a stream
   - Verify events appear automatically

---

### 2. Manual Quality Selection

#### Backend API Tests

**Get Stream Details (with Output Profiles):**
```bash
# Get stream name first
STREAM_NAME="your-stream-key"

curl -X GET "http://127.0.0.1:3001/api/streams/$STREAM_NAME" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response includes:**
```json
{
  "outputs": {
    "llhls": "http://.../llhls.m3u8",
    "hls": "http://.../playlist.m3u8",
    "profiles": [
      {
        "name": "720p",
        "llhls": "http://.../720p/llhls.m3u8",
        "hls": "http://.../720p/playlist.m3u8"
      }
    ]
  }
}
```

**Get Channel Output URLs:**
```bash
CHANNEL_ID="your-channel-id"

curl -X GET "http://127.0.0.1:3001/api/channels/$CHANNEL_ID/outputs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Frontend UI Tests

1. **Navigate to Streams Page:**
   - Click "Streams" in sidebar
   - Click on any active stream card

2. **Verify Quality Selection:**
   - ✅ Quality dropdown appears (if profiles available)
   - ✅ "Auto (Adaptive)" option is default
   - ✅ Profile names are listed
   - ✅ Selecting a quality updates player
   - ✅ Active quality is highlighted
   - ✅ Output profiles section shows all renditions

3. **Test Quality Switching:**
   - Select different quality from dropdown
   - Verify player updates to selected quality
   - Check network tab for correct URL being used

---

### 3. SCTE-35 Timeline Visualization

#### Backend API Tests

**Get All SCTE-35 Markers:**
```bash
curl -X GET "http://127.0.0.1:3001/api/scte35" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Insert SCTE-35 Marker into Stream:**
```bash
CHANNEL_ID="your-channel-id"
MARKER_ID="your-marker-id"

curl -X POST "http://127.0.0.1:3001/api/streams/$CHANNEL_ID/scte35" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markerId": "'$MARKER_ID'"}'
```

#### Frontend UI Tests

1. **Create SCTE-35 Marker:**
   - Navigate to "SCTE-35" page
   - Click "Create Marker"
   - Fill in marker details
   - Submit form

2. **View Markers in Stream Details:**
   - Navigate to "Streams" page
   - Click on an active stream
   - Scroll to "SCTE-35 Markers" section

3. **Verify Features:**
   - ✅ Available markers are displayed
   - ✅ Marker types are shown (Cue Out, Cue In)
   - ✅ Marker details are visible
   - ✅ "Insert" button is available for each marker
   - ✅ Inserting marker shows success message

4. **Test Marker Insertion:**
   - Click "Insert" button on a marker
   - Verify success toast appears
   - Check backend logs for marker insertion

---

### 4. WHIP Protocol Support

#### Backend API Tests

**Get Channel Input URLs:**
```bash
CHANNEL_ID="your-channel-id"

curl -X GET "http://127.0.0.1:3001/api/channels/$CHANNEL_ID/inputs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "channel": {
    "id": "...",
    "name": "...",
    "streamKey": "...",
    "appName": "..."
  },
  "inputs": {
    "rtmp": "rtmp://...",
    "webrtc": "ws://...",
    "whip": "http://.../whip",
    "srt": "srt://...",
    "rtsp": "rtsp://..."
  }
}
```

**Verify WHIP URL Format:**
```bash
# Extract WHIP URL
curl -X GET "http://127.0.0.1:3001/api/channels/$CHANNEL_ID/inputs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq -r '.inputs.whip'

# Should output: http://HOST:PORT/vhost/app/stream/whip
```

#### Frontend UI Tests

1. **Navigate to Channels Page:**
   - Click "Channels" in sidebar
   - View channel list

2. **Access Input URLs:**
   - Click on a channel
   - Navigate to "Input URLs" section (to be implemented in UI)
   - Verify WHIP URL is displayed

3. **Test WHIP URL:**
   - Copy WHIP URL
   - Verify format: `http://host:port/vhost/app/stream/whip`
   - Use in WHIP-compatible client

---

### 5. RTSP Pull Support

#### Backend API Tests

**Verify RTSP URL in Input URLs:**
```bash
CHANNEL_ID="your-channel-id"

curl -X GET "http://127.0.0.1:3001/api/channels/$CHANNEL_ID/inputs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq -r '.inputs.rtsp'

# Should output: rtsp://HOST:554/app/stream
```

#### Frontend UI Tests

1. **Access RTSP URL:**
   - Same as WHIP (via Input URLs endpoint)
   - Verify RTSP URL format

2. **Test RTSP URL:**
   - Copy RTSP URL
   - Use in RTSP client or FFmpeg

---

## Integration Tests

### Test Complete Flow: Create Channel → Get Input URLs → Stream → View in Dashboard

1. **Create a Channel:**
   ```bash
   curl -X POST "http://127.0.0.1:3001/api/channels" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "test-channel",
       "streamKey": "test-stream",
       "appName": "app"
     }'
   ```

2. **Get Input URLs:**
   ```bash
   CHANNEL_ID="channel-id-from-step-1"
   curl -X GET "http://127.0.0.1:3001/api/channels/$CHANNEL_ID/inputs" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Start Streaming:**
   - Use OBS or FFmpeg with RTMP URL from step 2
   - Stream should appear in "Streams" page

4. **View Stream Details:**
   - Click on stream in Streams page
   - Verify all features work:
     - ✅ Quality selection
     - ✅ SCTE-35 markers
     - ✅ Output URLs
     - ✅ Metrics

5. **Check Event Monitoring:**
   - Navigate to Event Monitoring page
   - Verify stream creation events appear

---

## Troubleshooting

### Event Monitoring Not Showing Events

1. **Check OME Service:**
   ```bash
   sudo systemctl status ovenmediaengine
   ```

2. **Check OME API:**
   ```bash
   curl -X GET "http://127.0.0.1:8081/v1/vhosts" \
     -H "Authorization: Basic $(echo -n 'YOUR_API_KEY' | base64)"
   ```

3. **Check Backend Logs:**
   ```bash
   tail -f /tmp/backend.log
   ```

### Quality Selection Not Working

1. **Verify Output Profiles:**
   ```bash
   curl -X GET "http://127.0.0.1:3001/api/ome/vhosts/default/apps/app/outputProfiles" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Check Stream Has Profiles:**
   - Ensure stream is active
   - Verify OME has output profiles configured

### SCTE-35 Markers Not Appearing

1. **Verify Markers Exist:**
   ```bash
   curl -X GET "http://127.0.0.1:3001/api/scte35" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Check Channel Association:**
   - Markers should appear for channels
   - Verify channel ID matches

---

## Test Checklist

### Backend APIs
- [ ] Event Monitoring - Get Events
- [ ] Event Monitoring - Get Events with Filters
- [ ] Event Monitoring - Get Webhooks
- [ ] Channel Input URLs - All protocols (RTMP, WHIP, RTSP, WebRTC, SRT)
- [ ] Channel Output URLs - With profiles
- [ ] Stream Details - Enhanced metrics
- [ ] SCTE-35 - Get Markers
- [ ] SCTE-35 - Insert Marker

### Frontend UI
- [ ] Event Monitoring Page - Loads and displays events
- [ ] Event Monitoring - Filters work
- [ ] Event Monitoring - Auto-refresh works
- [ ] Quality Selection - Dropdown appears
- [ ] Quality Selection - Switching works
- [ ] SCTE-35 Timeline - Markers displayed
- [ ] SCTE-35 Timeline - Insert works
- [ ] Stream Details - All sections load
- [ ] Navigation - Event Monitoring link works

### Integration
- [ ] Create Channel → Get Input URLs → Stream → View Details
- [ ] Stream Events appear in Event Monitoring
- [ ] Quality profiles load for active streams
- [ ] SCTE-35 markers available for channels

---

## Success Criteria

✅ All backend API endpoints return correct responses  
✅ All frontend pages load without errors  
✅ Quality selection updates player correctly  
✅ Event monitoring shows real-time events  
✅ SCTE-35 markers can be inserted into streams  
✅ Input URLs are correctly formatted for all protocols  

---

**Last Updated:** November 29, 2025

