# RTMP Connection Debug Guide

## Current Status
- ✅ Application "live" exists in OME configuration
- ✅ OME service is running
- ✅ Port 1935 is accessible
- ⚠️ Still getting: "Could not find application: #default#live"

## Most Likely Causes

### 1. Incorrect RTMP URL Format

**CORRECT Format:**
```
rtmp://ome.imagetv.in:1935/{app-name}/{stream-key}
```

**Examples:**
- `rtmp://ome.imagetv.in:1935/live/mystream`
- `rtmp://ome.imagetv.in:1935/live/live`
- `rtmp://ome.imagetv.in:1935/app/test`

**WRONG Formats (causes errors):**
- `rtmp://ome.imagetv.in:1935/default/live/mystream` ❌ (includes /default/)
- `rtmp://ome.imagetv.in:1935/live` ❌ (missing stream key)
- `rtmp://ome.imagetv.in:1935/live/` ❌ (trailing slash)

### 2. OBS/Streaming Software Settings

**In OBS Studio:**
1. Settings → Stream
2. Service: Custom
3. Server: `rtmp://ome.imagetv.in:1935/live`
4. Stream Key: `{your-stream-key}`

**OR:**
1. Server: `rtmp://ome.imagetv.in:1935`
2. Stream Key: `live/{your-stream-key}`

### 3. OME Configuration Not Reloaded

If you just added the application, OME might need a full restart:
```bash
sudo systemctl stop ovenmediaengine
sudo systemctl start ovenmediaengine
```

## Diagnostic Steps

### Step 1: Verify Application Exists
```bash
grep -A 1 "<Name>live</Name>" /usr/share/ovenmediaengine/conf/Origin.xml
```

### Step 2: Test Port
```bash
nc -zv ome.imagetv.in 1935
```

### Step 3: Check OME Logs
```bash
sudo tail -f /var/log/ovenmediaengine/ovenmediaengine.log
```
Then try connecting and watch for errors.

### Step 4: Test with FFmpeg
```bash
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/live/test
```

## What to Check in Your Streaming Software

1. **Server/RTMP URL:**
   - Should be: `rtmp://ome.imagetv.in:1935/live`
   - NOT: `rtmp://ome.imagetv.in:1935/default/live`

2. **Stream Key:**
   - Should be just the stream key (e.g., `mystream`)
   - NOT: `live/mystream` (if URL already includes /live)

3. **Full URL Structure:**
   - OBS combines Server + Stream Key
   - If Server = `rtmp://ome.imagetv.in:1935/live`
   - And Stream Key = `mystream`
   - Final URL = `rtmp://ome.imagetv.in:1935/live/mystream` ✅

## Alternative: Use "app" Application

If "live" still doesn't work, try the default "app" application:

1. Edit your channel in dashboard
2. Change Application Name to: `app`
3. Use RTMP URL: `rtmp://ome.imagetv.in:1935/app/{stream-key}`

This should definitely work since "app" is the default application.

