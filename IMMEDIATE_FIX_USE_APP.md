# IMMEDIATE FIX: Use "app" Instead of "live"

## Problem
OME is only loading the "app" application, not "live". Despite adding "live" to the configuration, OME logs show it's not being loaded.

## Solution: Switch to "app" Application

### Step 1: Edit Your Channel in Dashboard
1. Go to: http://ome.imagetv.in/channels
2. Find your channel
3. Click Edit
4. Change **Application Name** from `live` to `app`
5. Click Save

### Step 2: Update Your RTMP Connection

**In OBS Studio:**
- **Server:** `rtmp://ome.imagetv.in:1935/app`
- **Stream Key:** Your stream key (e.g., `live`, `mystream`, etc.)

**Or full URL format:**
```
rtmp://ome.imagetv.in:1935/app/{your-stream-key}
```

**Examples:**
- Stream Key: `live` → URL: `rtmp://ome.imagetv.in:1935/app/live`
- Stream Key: `mystream` → URL: `rtmp://ome.imagetv.in:1935/app/mystream`
- Stream Key: `channel1` → URL: `rtmp://ome.imagetv.in:1935/app/channel1`

### Step 3: Connect
Try connecting now. It should work immediately since "app" is already loaded in OME.

## Why This Works
- OME is successfully loading the "app" application
- The "live" application is not being loaded despite being in the config
- Using "app" avoids this issue completely

## Verify It's Working
After connecting, check OME logs:
```bash
sudo tail -f /var/log/ovenmediaengine/ovenmediaengine.log
```

You should see successful stream creation messages instead of "Could not find application" errors.

