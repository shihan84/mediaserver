# Channel Organization Best Practices

## Current Setup Analysis

Your OME is configured with:
- **Virtual Host:** `default`
- **Application:** `app`
- **Port:** `1935` (RTMP)

All channels use the same application (`app`), which is correct for most setups.

## Understanding the Structure

```
OME Server
├── Virtual Host: default
    └── Application: app
        ├── Stream: live (active)
        ├── Stream: my-custom-stream-key-123 (when connected)
        └── Stream: [any-stream-key] (when connected)
```

## Channel vs Stream Relationship

### Channel (Database Entry)
- Created in your dashboard
- Stores configuration
- Has a unique stream key
- Can be active/inactive

### Stream (OME Active Connection)
- Created when someone connects via RTMP/SRT/WebRTC
- Uses the stream key to identify it
- Appears in Streams page when active
- Automatically uses the channel's stream key

## How It Works

1. **Create Channel** → Database entry with stream key
2. **Mark Active** → Channel is ready to accept streams
3. **Connect via RTMP** → Use channel's stream key
4. **Stream Appears** → OME creates stream, shows in dashboard

## Recommended Organization

### Option 1: Simple (Current Setup) ✅
All channels in one application (`app`):

```
Channels:
- Channel 1: streamKey = "channel1"
- Channel 2: streamKey = "channel2"
- Channel 3: streamKey = "channel3"

RTMP URLs:
- rtmp://server:1935/app/channel1
- rtmp://server:1935/app/channel2
- rtmp://server:1935/app/channel3
```

**Pros:**
- Simple setup
- Easy to manage
- All channels in one place

**Cons:**
- Less isolation
- Harder to separate by purpose

### Option 2: By Purpose (Advanced)
Use different stream key prefixes:

```
Channels:
- Sports: streamKey = "sports-main"
- News: streamKey = "news-desk"
- Events: streamKey = "event-2024"

RTMP URLs:
- rtmp://server:1935/app/sports-main
- rtmp://server:1935/app/news-desk
- rtmp://server:1935/app/event-2024
```

**Pros:**
- Better organization
- Easy to identify purpose
- Scalable

### Option 3: Multiple Applications (Most Advanced)
Requires OME configuration changes:

```
Virtual Host: default
├── Application: sports
│   └── Streams: sports-main, sports-live
├── Application: news
│   └── Streams: news-desk, news-studio
└── Application: events
    └── Streams: event-2024-01, event-2024-02
```

**RTMP URLs:**
- `rtmp://server:1935/sports/sports-main`
- `rtmp://server:1935/news/news-desk`
- `rtmp://server:1935/events/event-2024-01`

**Note:** This requires OME Server.xml configuration changes.

## For Your Current Setup

### Recommended Approach: Keep It Simple ✅

1. **All channels in `app` application** (current setup)
2. **Use descriptive stream keys:**
   ```
   Channel Name: "Main Live Stream"
   Stream Key: "main-live"
   
   Channel Name: "Backup Stream"
   Stream Key: "backup-stream"
   ```

3. **Naming Convention:**
   - Use lowercase
   - Use hyphens instead of spaces
   - Be descriptive: `sports-main`, `news-desk`, `event-2024`

## How to Stream to Your Channel

### For Channel: "test-custom-stream-key"

**Your Stream Key:** `my-custom-stream-key-123`

**RTMP Connection:**
```
rtmp://ome.imagetv.in:1935/app/my-custom-stream-key-123
```

**Steps:**
1. Open OBS Studio (or your streaming software)
2. Go to Settings → Stream
3. Service: Custom
4. Server: `rtmp://ome.imagetv.in:1935/app`
5. Stream Key: `my-custom-stream-key-123`
6. Click "Start Streaming"

**After connecting:**
- Wait 2-3 seconds
- Go to Streams page
- You should see a stream named `my-custom-stream-key-123`

## Output URLs Format

Once streaming, output URLs follow this pattern:

```
Base URL: http://ome.imagetv.in:3333/default/app/{STREAM_KEY}

LLHLS: http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/llhls.m3u8
HLS:   http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/playlist.m3u8
DASH:  http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/manifest.mpd
```

## Stream Key Rules

1. **Must be unique** across all channels
2. **Case-sensitive** (usually lowercase recommended)
3. **No spaces** (use hyphens: `my-stream-key`)
4. **Alphanumeric + hyphens/underscores** recommended

## Quick Checklist

✅ Channel created in dashboard
✅ Stream key noted
✅ RTMP URL constructed: `rtmp://server:1935/app/{streamKey}`
✅ Connected via RTMP using the stream key
✅ Stream appears on Streams page
✅ Output URLs available

## Summary

- **Current setup is correct** - using `default/app` for all channels
- **To stream to a channel:** Use its stream key in RTMP URL
- **Stream key = Channel identifier** - must match exactly
- **Stream appears automatically** when you connect with correct stream key

Your channels are properly organized. You just need to connect to them using the correct stream keys!
