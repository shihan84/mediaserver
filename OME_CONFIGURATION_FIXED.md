# OME Configuration Fixed

## Issue Found
The OME service was failing to start due to a configuration error:
```
[Config] Unknown item found: Server.bind.managers.api.AccessToken
```

## Root Cause
The `<AccessToken>` element was incorrectly placed inside `<Bind><Managers><API>` section. In OME, the AccessToken must be in the top-level `<Managers><API>` section, not inside the `<Bind>` section.

## Fix Applied
1. **Removed** `<AccessToken>` from `<Bind><Managers><API>` section
2. **Moved** `<AccessToken>` to the top-level `<Managers><API>` section (uncommented it)

## Current Status
✅ **OME Service is now running**
- Service status: `active (running)`
- RTMP port 1935: **LISTENING**
- API port 8081: **LISTENING**
- WebRTC/LLHLS port 3333: **LISTENING**

## Configuration Summary

### Ports in Use
- **RTMP (Input):** 1935
- **API:** 8081
- **WebRTC/LLHLS (Output):** 3333
- **SRT (Input):** 9999
- **SRT (Output):** 9998

### Virtual Host & Application
- **Virtual Host:** `default`
- **Application:** `app`
- **API Access Token:** `ome-api-token-2024`

## Correct RTMP Connection URL

Now that OME is running, use this URL format:

```
rtmp://ome.imagetv.in:1935/app/live
```

**Where:**
- `app` = Application name (as configured in OME)
- `live` = Your stream key

### For OBS Studio:
- **Server:** `rtmp://ome.imagetv.in:1935/app`
- **Stream Key:** `live`

### For FFmpeg:
```bash
ffmpeg -i input.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/app/live
```

## API Authentication

The OME API uses **Basic Authentication** with Base64 encoding:

```bash
# Generate auth header
echo -n "ome-api-token-2024" | base64

# Use in API calls
curl -H "Authorization: Basic b21lLWFwaS10b2tlbg==" \
  http://localhost:8081/v1/vhosts/default/apps/app
```

## Verify Everything Works

1. **Check OME status:**
   ```bash
   systemctl status ovenmediaengine
   ```

2. **Check ports:**
   ```bash
   netstat -tlnp | grep -E "(1935|8081|3333)"
   ```

3. **Test RTMP connection:**
   ```bash
   ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
     -f flv rtmp://ome.imagetv.in:1935/app/test-stream
   ```

4. **Check streams:**
   ```bash
   curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
     http://localhost:8081/v1/vhosts/default/apps/app/streams
   ```

## Next Steps

1. **Create a channel** in the frontend with stream key `live`
2. **Connect your RTMP client** using: `rtmp://ome.imagetv.in:1935/app/live`
3. **Verify the stream** appears on the Streams page
4. **Check output URLs** (HLS, DASH, WebRTC) from the Streams page

## Notes

- Make sure port 1935 is open in your firewall
- Ensure your domain `ome.imagetv.in` resolves to this server
- The channel must exist in the database before streaming
- Stream will appear automatically when RTMP connection is established
