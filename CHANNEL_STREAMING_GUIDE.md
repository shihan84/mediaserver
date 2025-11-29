# Channel Streaming Guide

## Understanding Channels vs Streams

### What is a Channel?
A **Channel** is a database entry that defines:
- Channel name (e.g., "My Live Channel")
- Stream Key (e.g., "my-custom-stream-key-123")
- Settings and configuration
- VOD fallback settings

### What is a Stream?
A **Stream** is an active RTMP/SRT/WebRTC connection that appears in OME when:
- Someone connects to OME using a stream key
- The stream key matches the channel's stream key

## Your Current Channels

Based on your database:
1. **Channel:** `live` | **Stream Key:** `live` | **Status:** Active
2. **Channel:** `test-custom-stream-key` | **Stream Key:** `my-custom-stream-key-123` | **Status:** Active

## How to Stream to Your Channel

### Important Concept
**Channels don't automatically create streams.** Streams are created when you actually connect to OME using the channel's stream key.

### Step-by-Step Process

#### 1. **Create a Channel** (if not already created)
- Go to **Channels** page
- Click "Create Channel"
- Enter:
  - **Channel Name:** e.g., "My Live Channel"
  - **Stream Key:** e.g., "my-stream-key" (must be unique)
  - Description (optional)
- Click "Create"

#### 2. **Get Your Stream Key**
After creating the channel, note the **Stream Key** (e.g., `my-custom-stream-key-123`)

#### 3. **Connect to OME Using Stream Key**

**RTMP URL Format:**
```
rtmp://ome.imagetv.in:1935/app/{STREAM_KEY}
```

**Example for your custom channel:**
```
rtmp://ome.imagetv.in:1935/app/my-custom-stream-key-123
```

#### 4. **Use in Your Streaming Software**

**OBS Studio:**
- Service: Custom
- Server: `rtmp://ome.imagetv.in:1935/app`
- Stream Key: `my-custom-stream-key-123`

**FFmpeg:**
```bash
ffmpeg -i input.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/app/my-custom-stream-key-123
```

#### 5. **Verify Stream Appears**
- Once connected, go to **Streams** page
- The stream should appear with your stream key name
- It will be associated with your channel

## Current Status

### Channel 1: "live"
- **Stream Key:** `live`
- **RTMP URL:** `rtmp://ome.imagetv.in:1935/app/live`
- **Status:** ✅ Working (you confirmed stream is active)

### Channel 2: "test-custom-stream-key"
- **Stream Key:** `my-custom-stream-key-123`
- **RTMP URL:** `rtmp://ome.imagetv.in:1935/app/my-custom-stream-key-123`
- **Status:** ⚠️ Channel exists but no active stream (you need to connect)

## Why Streams Don't Show Until Connected

1. **Channel Creation** = Database entry only
2. **Start Stream Button** = Marks channel as "active" (ready to accept streams)
3. **Actual RTMP Connection** = Creates the stream in OME
4. **Stream Appears** = Only after step 3

## Organizing Your Channels

### Best Practices

1. **Use Descriptive Names:**
   - Channel Name: "Main Live Stream"
   - Stream Key: `main-live-stream`

2. **Use Unique Stream Keys:**
   - Avoid generic names like "live", "test"
   - Use format: `{channel-name}-{date}` or `{purpose}-{id}`

3. **Example Organization:**
   ```
   Channel Name: "Sports Channel"
   Stream Key: "sports-main"
   RTMP URL: rtmp://ome.imagetv.in:1935/app/sports-main

   Channel Name: "News Channel"
   Stream Key: "news-desk"
   RTMP URL: rtmp://ome.imagetv.in:1935/app/news-desk
   ```

## How to Stream to Your Custom Channel

### For Channel: "test-custom-stream-key"

**Use this RTMP URL:**
```
rtmp://ome.imagetv.in:1935/app/my-custom-stream-key-123
```

**In OBS:**
- Server: `rtmp://ome.imagetv.in:1935/app`
- Stream Key: `my-custom-stream-key-123`

**After connecting:**
1. Wait a few seconds
2. Go to **Streams** page
3. Refresh the page
4. You should see a stream named `my-custom-stream-key-123`

## Output URLs

Once your stream is active, output URLs will be:

```
LLHLS: http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/llhls.m3u8
HLS:   http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/playlist.m3u8
DASH:  http://ome.imagetv.in:3333/default/app/my-custom-stream-key-123/manifest.mpd
```

## Troubleshooting

### Issue: Channel created but stream doesn't appear

**Solution:**
1. Make sure you're using the correct stream key
2. Check RTMP URL format: `rtmp://server:1935/app/STREAM_KEY`
3. Verify you're actually connected (check OBS status)
4. Wait a few seconds and refresh Streams page

### Issue: Wrong stream key in use

**Check:**
- Go to Channels page
- Find your channel
- Click "Edit" to see the exact stream key
- Use that exact stream key (case-sensitive)

### Issue: Stream appears but not associated with channel

**Note:** This is normal! Streams in OME are identified by stream key. As long as the stream key matches your channel's stream key, they're connected.

## Quick Reference

| What | How to Get |
|------|------------|
| **Stream Key** | Channels page → View channel → See Stream Key field |
| **RTMP URL** | `rtmp://ome.imagetv.in:1935/app/{STREAM_KEY}` |
| **Output URLs** | Streams page → Click stream → See Output URLs |
| **Check if Active** | Streams page → Look for stream with matching name |

## Next Steps

1. **Create/Edit Channel** on Channels page
2. **Note the Stream Key** from your channel
3. **Connect via RTMP** using the stream key
4. **Verify Stream** appears on Streams page
5. **Get Output URLs** from the stream details
