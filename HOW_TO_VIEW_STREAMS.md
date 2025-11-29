# How to View/Play Live Streams

## Quick Answer

### 1. **On the Dashboard (Easiest Way)**

Go to the **Streams** page in your dashboard:

1. Navigate to **Streams** page in the frontend
2. Find your stream "live" in the "OME Active Streams" section
3. Click on the stream card to expand it
4. You'll see all **Output URLs**:
   - **LLHLS** (Low Latency HLS) - Best for web players
   - **HLS** - Standard HLS
   - **DASH** - MPEG-DASH
   - **WebRTC** - Low latency, browser native
   - **SRT** - For SRT players
   - **Thumbnail** - Still image

5. **Copy the URL** you want and use it in a player (see below)

### 2. **Via API**

Get output URLs via API:
```bash
# Get stream outputs (need JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/streams/live/outputs

# Or for channel outputs
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/channels/CHANNEL_ID/outputs
```

---

## Video Players for Testing

### Option 1: **Web Browser Players** (Recommended for Quick Testing)

#### A. Using HLS.js (Best for HLS/LLHLS)

Create a simple HTML player:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Live Stream Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
    <h1>Live Stream Viewer</h1>
    <video id="video" controls width="1280" height="720"></video>
    
    <script>
        const video = document.getElementById('video');
        const streamUrl = 'http://ome.imagetv.in:3333/default/app/live/llhls.m3u8';
        
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', function() {
                video.play();
            });
        }
    </script>
</body>
</html>
```

#### B. Using Video.js (Professional Player)

```html
<!DOCTYPE html>
<html>
<head>
    <link href="https://vjs.zencdn.net/8.5.2/video-js.css" rel="stylesheet">
    <title>Live Stream Player</title>
</head>
<body>
    <video-js
        id="player"
        class="vjs-default-skin"
        controls
        preload="auto"
        width="1280"
        height="720"
        data-setup='{}'>
        <source src="http://ome.imagetv.in:3333/default/app/live/llhls.m3u8" type="application/x-mpegURL">
    </video-js>
    
    <script src="https://vjs.zencdn.net/8.5.2/video.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@videojs/http-streaming@3.0.2/dist/videojs-http-streaming.min.js"></script>
</body>
</html>
```

#### C. Using DASH.js (For DASH streams)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Live Stream Player (DASH)</title>
    <script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
</head>
<body>
    <h1>Live Stream Viewer (DASH)</h1>
    <video id="video" controls width="1280" height="720"></video>
    
    <script>
        const video = document.getElementById('video');
        const streamUrl = 'http://ome.imagetv.in:3333/default/app/live/manifest.mpd';
        
        const player = dashjs.MediaPlayer().create();
        player.initialize(video, streamUrl, true);
    </script>
</body>
</html>
```

### Option 2: **Desktop Players**

#### A. VLC Media Player (Free, Cross-platform)

1. **Download VLC:** https://www.videolan.org/vlc/
2. **Open Network Stream:**
   - Press `Ctrl+N` (Windows/Linux) or `Cmd+N` (Mac)
   - Or: Media → Open Network Stream
3. **Enter URL:**
   ```
   http://ome.imagetv.in:3333/default/app/live/llhls.m3u8
   ```
   Or for HLS:
   ```
   http://ome.imagetv.in:3333/default/app/live/playlist.m3u8
   ```
4. Click **Play**

#### B. MPV Player (Free, Open-source)

```bash
# Install MPV
sudo apt install mpv  # Ubuntu/Debian
brew install mpv      # macOS

# Play stream
mpv http://ome.imagetv.in:3333/default/app/live/llhls.m3u8
```

#### C. FFplay (Comes with FFmpeg)

```bash
# Play HLS stream
ffplay http://ome.imagetv.in:3333/default/app/live/llhls.m3u8

# Play DASH stream
ffplay http://ome.imagetv.in:3333/default/app/live/manifest.mpd
```

### Option 3: **Mobile Apps**

#### iOS (iPhone/iPad)
- **Native Safari** - Supports HLS natively
- **VLC for Mobile** - Free app from App Store
- **Just open URL in Safari:**
  ```
  http://ome.imagetv.in:3333/default/app/live/llhls.m3u8
  ```

#### Android
- **VLC for Android** - Free app from Play Store
- **MX Player** - Popular video player
- **Open Network Stream** and enter URL

### Option 4: **Online Players** (No Installation)

1. **HLS.js Demo:**
   - Go to: https://hls-js.netlify.app/demo/
   - Paste your LLHLS URL:
     ```
     http://ome.imagetv.in:3333/default/app/live/llhls.m3u8
     ```

2. **DASH.js Reference Player:**
   - Go to: https://reference.dashif.org/dash.js/latest/samples/dash-if-reference-player/index.html
   - Enter your DASH URL:
     ```
     http://ome.imagetv.in:3333/default/app/live/manifest.mpd
     ```

---

## URL Format Reference

Based on your OME configuration:

### Server Info
- **Host:** `ome.imagetv.in`
- **Port:** `3333` (LLHLS/HLS/DASH)
- **Virtual Host:** `default`
- **Application:** `app`
- **Stream Name:** `live`

### Output URLs

| Format | URL |
|--------|-----|
| **LLHLS** | `http://ome.imagetv.in:3333/default/app/live/llhls.m3u8` |
| **HLS** | `http://ome.imagetv.in:3333/default/app/live/playlist.m3u8` |
| **DASH** | `http://ome.imagetv.in:3333/default/app/live/manifest.mpd` |
| **WebRTC** | `webrtc://ome.imagetv.in:3333/default/app/live` |
| **SRT** | `srt://ome.imagetv.in:9998?streamid=default/app/live` |
| **Thumbnail** | `http://ome.imagetv.in:3333/default/app/live/thumbnail` |

---

## Quick Test Commands

### Test with cURL
```bash
# Check if stream is accessible
curl -I http://ome.imagetv.in:3333/default/app/live/llhls.m3u8

# Should return HTTP 200 OK
```

### Test with FFmpeg
```bash
# Play stream
ffplay http://ome.imagetv.in:3333/default/app/live/llhls.m3u8

# Or record stream (test if it works)
ffmpeg -i http://ome.imagetv.in:3333/default/app/live/llhls.m3u8 \
  -t 10 -c copy test-output.ts
```

---

## Browser Compatibility

### LLHLS/HLS Support
- ✅ **Safari** (macOS/iOS) - Native support
- ✅ **Chrome/Edge** - With HLS.js library
- ✅ **Firefox** - With HLS.js library
- ⚠️ **IE11** - Not supported

### WebRTC Support
- ✅ **Chrome** - Native support
- ✅ **Firefox** - Native support
- ✅ **Edge** - Native support
- ✅ **Safari** - Native support (macOS 11+, iOS 11+)

### DASH Support
- ✅ **Chrome/Edge** - With dash.js
- ✅ **Firefox** - With dash.js
- ⚠️ **Safari** - Limited support

---

## Troubleshooting

### If stream doesn't play:

1. **Check CORS:** Make sure OME allows cross-origin requests (should be enabled by default)

2. **Check Firewall:** Port 3333 must be open
   ```bash
   sudo ufw allow 3333/tcp
   ```

3. **Check Stream is Active:**
   ```bash
   curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
     http://localhost:8081/v1/vhosts/default/apps/app/streams
   ```

4. **Check Playlist URL:**
   ```bash
   curl http://ome.imagetv.in:3333/default/app/live/llhls.m3u8
   # Should return M3U8 playlist
   ```

5. **Browser Console:** Check for CORS errors or network errors (F12 → Console)

---

## Recommended Setup for Testing

1. **Quick Test:** Use HLS.js demo page
   - https://hls-js.netlify.app/demo/
   - Paste your LLHLS URL

2. **Desktop Testing:** Use VLC
   - Install VLC
   - Open Network Stream
   - Enter LLHLS URL

3. **Production:** Use Video.js or your preferred player library
   - Most professional and feature-rich
   - Better error handling
   - Supports captions, ads, etc.

---

## Next Steps

1. **Get your stream URL** from the Streams page in dashboard
2. **Choose a player** from the options above
3. **Test the stream** to verify it's working
4. **Embed in your website** if needed

The stream URL will be available on the Streams page once you expand the stream card!
