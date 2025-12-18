# Streams vs Channels - Explained

## Overview

**Channels** and **Streams** are related but serve different purposes in the OME Enterprise system.

---

## 📺 Channel (Configuration/Definition)

### What is a Channel?
A **Channel** is a **configuration/template** stored in your database that defines:
- Where streams should be ingested
- What settings to use
- Input/output URLs
- VOD fallback settings
- Channel metadata

### Characteristics:
- ✅ **Persistent**: Always exists in the database
- ✅ **Configuration**: Defines how to handle streams
- ✅ **Template**: Ready to receive streams anytime
- ✅ **Can be inactive**: Exists even when no one is streaming

### Channel Contains:
```
- Name: "My Live Channel"
- Description: "Main streaming channel"
- appName: "live" (OME application name)
- streamKey: "live" (unique identifier)
- Input URLs: rtmp://..., webrtc://..., etc.
- Output URLs: llhls://..., hls://..., etc.
- VOD Fallback: Settings for when stream drops
- Status: Active/Inactive
```

### Example:
```sql
Channel {
  id: "123",
  name: "Main Live Stream",
  appName: "live",
  streamKey: "live",
  isActive: true,
  createdAt: "2024-01-01"
}
```

---

## 🎬 Stream (Live Media)

### What is a Stream?
A **Stream** is the **actual live media** currently being broadcasted:
- Real-time video/audio data flowing through OME
- Exists only when someone is actively streaming
- Comes from OME (not our database)
- Has real-time metrics (viewers, bitrate, health)

### Characteristics:
- ⏰ **Temporary**: Only exists while streaming
- 📊 **Real-time**: Live data with metrics
- 🔄 **Dynamic**: Starts when streaming begins, ends when it stops
- 📡 **From OME**: Detected from OvenMediaEngine server

### Stream Contains:
```
- name: "live" (stream identifier)
- appName: "live" (which OME app it's in)
- state: "streaming" (current state)
- input: { sourceType: "RTMP", ... }
- viewers: { total: 5, webrtc: 2, hls: 3 }
- bitrate: 2500000
- fps: 30
- health: { connected: true, ... }
```

### Example:
```json
Stream {
  name: "live",
  appName: "live",
  state: "streaming",
  input: {
    sourceType: "RTMP",
    url: "rtmp://..."
  },
  createdAt: "2024-12-01T12:00:00Z"
}
```

---

## 🔗 How They Work Together

### Relationship:

```
Channel (Database)          Stream (OME Server)
─────────────────          ────────────────────
[Configuration]            [Live Media]
      │                           │
      │                           │
      └───────────┬───────────────┘
                  │
          Matched by:
      • appName + streamKey
                  │
          Creates:
      • Active Channel
      • Live Metrics
      • Viewer Counts
```

### Matching Logic:

1. **Channel** has: `appName="live"`, `streamKey="live"`
2. **Stream** appears in OME: `name="live"`, `appName="live"`
3. **System matches** them: `${appName}:${streamKey}` = `"live:live"`
4. **Result**: Channel shows as "Active" with live metrics

---

## 📋 Practical Examples

### Example 1: Channel Without Stream
```
Channel: "Morning Show"
- appName: "live"
- streamKey: "morning-show"
- Status: Inactive (no stream)

→ Channel exists, ready to receive stream
→ No live metrics (no active stream)
```

### Example 2: Stream Without Channel (Orphan Stream)
```
Stream: "random-stream"
- appName: "app"
- name: "random-stream"
- Status: Streaming

→ Stream is active in OME
→ No matching channel in database
→ Appears as "Unmanaged Stream"
```

### Example 3: Channel With Active Stream
```
Channel: "Main Live Stream"
- appName: "live"
- streamKey: "live"
- Status: Active ✅

Stream: "live"
- appName: "live"
- name: "live"
- Viewers: 10
- Bitrate: 2500 kbps

→ Matched! Channel shows live metrics
→ Shows viewer count, bitrate, health
```

---

## 🎯 Key Differences Summary

| Aspect | Channel | Stream |
|--------|---------|--------|
| **Type** | Configuration | Live Media |
| **Storage** | Database | OME Server |
| **Persistence** | Always exists | Only when streaming |
| **Purpose** | Define settings | Carry video/audio |
| **Contains** | URLs, settings, metadata | Real-time metrics, viewers |
| **Created by** | Admin/Operator | Streamer/Broadcaster |
| **Can exist alone** | Yes (inactive) | Yes (orphaned) |

---

## 🔄 Lifecycle

### When You Create a Channel:
1. ✅ Channel saved to database
2. ✅ Configuration stored
3. ✅ Input/Output URLs generated
4. ⏳ Waiting for stream to start

### When Stream Starts:
1. 📡 Broadcaster connects: `rtmp://ome.imagetv.in/live/live`
2. 🎬 OME detects stream
3. 🔍 System matches stream to channel
4. ✅ Channel becomes "Active"
5. 📊 Live metrics start appearing

### When Stream Stops:
1. 📡 Broadcaster disconnects
2. 🎬 OME removes stream
3. ⚠️ Channel becomes "Inactive"
4. 📊 Metrics stop updating

---

## 💡 Why Both?

### Channels Provide:
- ✅ **Organization**: Manage multiple streaming endpoints
- ✅ **Configuration**: Set up URLs, settings once
- ✅ **Persistence**: Keep info even when not streaming
- ✅ **Planning**: Prepare channels before streaming

### Streams Provide:
- ✅ **Live Status**: Know what's actually streaming
- ✅ **Real-time Metrics**: Viewers, bitrate, health
- ✅ **Detection**: Find active broadcasts automatically
- ✅ **Monitoring**: Watch stream health in real-time

---

## 🎯 In Your Case

**Your Situation:**
- Streaming to: `rtmp://ome.imagetv.in/live`
- Stream key: `live`
- Application: `live`

**This Creates:**
- ✅ **Stream** in OME: `name="live"`, `appName="live"` (exists while streaming)
- ⚠️ **Channel** in database: Should have `appName="live"`, `streamKey="live"`

**To See Your Stream:**
1. Create/Edit channel with:
   - `appName: "live"`
   - `streamKey: "live"`
2. System will match stream to channel
3. Channel becomes "Active" with live metrics

---

## 🔧 System Architecture

```
┌─────────────────────────────────────────────┐
│          OME Enterprise System              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Channel    │      │    Stream    │   │
│  │  (Database)  │◄─────┤  (OME API)   │   │
│  │              │Match │              │   │
│  │ - Config     │      │ - Live Media │   │
│  │ - Settings   │      │ - Metrics    │   │
│  │ - URLs       │      │ - Viewers    │   │
│  └──────────────┘      └──────────────┘   │
│         │                     │            │
│         └─────────┬───────────┘            │
│                   │                        │
│         ┌─────────▼─────────┐             │
│         │  Active Channel   │             │
│         │  with Live Metrics│             │
│         └───────────────────┘             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ Summary

**Channels = Configuration/Definition**
- Always in database
- Defines how to handle streams
- Ready to receive streams

**Streams = Live Media**
- Only exists while streaming
- Contains real-time data
- Detected from OME

**They Work Together:**
- Channel defines the endpoint
- Stream is the actual broadcast
- When matched = Active Channel with metrics

---

## 🚀 Your Use Case

For `rtmp://ome.imagetv.in/live` with stream key `live`:

1. **Create Channel** (if not exists):
   - Name: "Live Stream"
   - appName: `live`
   - streamKey: `live`

2. **Start Streaming**:
   - Connect to RTMP URL
   - Stream appears in OME

3. **System Matches**:
   - Finds channel with matching appName + streamKey
   - Shows as "Active" with live metrics

4. **View Metrics**:
   - Viewers count
   - Bitrate
   - Stream health
   - All in real-time!

---

**In short: Channels are the configuration, Streams are the live media!** 🎬

