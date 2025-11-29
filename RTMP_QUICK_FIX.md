# RTMP Connection Quick Fix

## Problem
Unable to connect via RTMP: `rtmp://ome.imagetv.in:1935/live` with stream key `live`

## Root Cause
The RTMP URL is missing the application name (`/app`) in the path.

## Solution

### Correct RTMP URL Format

**Wrong:** ❌
```
rtmp://ome.imagetv.in:1935/live
```

**Correct:** ✅
```
rtmp://ome.imagetv.in:1935/app/live
```

### Full URL Breakdown
- **Protocol:** `rtmp://`
- **Server:** `ome.imagetv.in`
- **Port:** `1935`
- **Application:** `app` ← **This is missing!**
- **Stream Key:** `live`

## Steps to Fix

### 1. Use the Correct URL

In your RTMP streaming software (OBS, FFmpeg, etc.), use:

```
rtmp://ome.imagetv.in:1935/app/live
```

**Stream Key:** Leave empty or use `live` (depends on your software)

### 2. Verify Channel Exists

Make sure you have created a channel with stream key "live" in the application:

1. Go to **Channels** page in the frontend
2. Check if a channel with stream key `live` exists
3. If not, create one with stream key `live`

### 3. Test Connection

Using FFmpeg:

```bash
ffmpeg -re -i input.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/app/live
```

Or with OBS Studio:
- **Server:** `rtmp://ome.imagetv.in:1935/app`
- **Stream Key:** `live`

## Alternative Formats

If your OME is configured differently, you might need:

```
rtmp://ome.imagetv.in:1935/default/app/live
```

## Still Not Working?

1. **Check OME Status:**
   ```bash
   systemctl status ovenmediaengine
   ```

2. **Check Port 1935:**
   ```bash
   netstat -tlnp | grep 1935
   ```

3. **Check OME Logs:**
   ```bash
   journalctl -u ovenmediaengine -f
   ```

4. **Verify Channel:**
   - Check Channels page in frontend
   - Ensure channel with stream key "live" exists

5. **Test with FFmpeg:**
   ```bash
   ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
     -f flv rtmp://ome.imagetv.in:1935/app/live
   ```

## Common Software Settings

### OBS Studio
- **Service:** Custom
- **Server:** `rtmp://ome.imagetv.in:1935/app`
- **Stream Key:** `live`

### FFmpeg
```bash
ffmpeg -i input.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/app/live
```

### vMix
- **Address:** `ome.imagetv.in`
- **Port:** `1935`
- **Stream Key:** `app/live` (include app name in stream key field)

### Wirecast
- **URL:** `rtmp://ome.imagetv.in:1935/app`
- **Stream Name:** `live`
