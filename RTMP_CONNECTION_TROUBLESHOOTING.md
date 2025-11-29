# RTMP Connection Troubleshooting Guide

## RTMP URL Format

According to OME documentation, the RTMP URL format is:

```
rtmp://{server}:{port}/{vhost}/{app}/{streamKey}
```

### Default Configuration
- **VHost:** `default`
- **App:** `app`
- **RTMP Port:** `1935`

## Your Case

You're trying to connect with:
- **Server:** `ome.imagetv.in`
- **Port:** `1935`
- **Stream Key:** `live`
- **URL you're using:** `rtmp://ome.imagetv.in:1935/live` ❌

### Correct RTMP URL

The correct RTMP URL should be:

```
rtmp://ome.imagetv.in:1935/app/live
```

Or if your OME is configured differently:

```
rtmp://ome.imagetv.in:1935/default/app/live
```

## Troubleshooting Steps

### 1. Verify Channel Exists

First, make sure you have a channel with stream key "live" in your database:

```bash
# Check via API
curl -X GET http://ome.imagetv.in:3001/api/channels \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or check in the frontend Channels page.

### 2. Verify OME Virtual Host and App Configuration

Check your OME configuration:

```bash
# Get virtual hosts
curl -X GET http://ome.imagetv.in:8081/v1/vhosts \
  -H "Authorization: Bearer YOUR_OME_API_KEY"

# Get applications for default vhost
curl -X GET http://ome.imagetv.in:8081/v1/vhosts/default/apps \
  -H "Authorization: Bearer YOUR_OME_API_KEY"
```

### 3. Check Environment Variables

Verify your backend `.env` file has correct settings:

```bash
cd /root/omd/ome/backend
cat .env | grep -E "OME_|VHOST|APP"
```

Expected values:
```
OME_VHOST=default
OME_APP=app
OME_HOST=ome.imagetv.in
OME_PUBLIC_PORT=3333
```

### 4. Check OME Publisher Settings

OME may require publisher authentication. Check your OME configuration file (usually `/usr/share/ovenmediaengine/conf/Server.xml` or similar):

```xml
<Applications>
  <Application>
    <Name>app</Name>
    <Providers>
      <RTMP>
        <Publisher>
          <!-- Check if authentication is required -->
          <Authentication>
            <!-- If enabled, you need to configure access control -->
          </Authentication>
        </Publisher>
      </RTMP>
    </Providers>
  </Application>
</Applications>
```

### 5. Verify RTMP Port is Open

Check if RTMP port 1935 is accessible:

```bash
# Test port connectivity
nc -zv ome.imagetv.in 1935

# Check if OME is listening on port 1935
netstat -tlnp | grep 1935
```

### 6. Check OME Logs

Check OME server logs for RTMP connection errors:

```bash
# OME logs location (may vary)
tail -f /var/log/ovenmediaengine/ovenmediaengine.log
# or
journalctl -u ovenmediaengine -f
```

### 7. Test with FFmpeg

Test the connection using FFmpeg:

```bash
# Test RTMP connection
ffmpeg -re -i test_video.mp4 -c copy -f flv rtmp://ome.imagetv.in:1935/app/live

# Or with a test pattern
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -f flv rtmp://ome.imagetv.in:1935/app/live
```

### 8. Check Firewall Rules

Ensure port 1935 is open in your firewall:

```bash
# UFW (Ubuntu)
sudo ufw allow 1935/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=1935/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 1935 -j ACCEPT
```

## Common Issues and Solutions

### Issue 1: "Connection Refused"
- **Cause:** OME not running or port 1935 not open
- **Solution:** Start OME service and open firewall port

### Issue 2: "Stream Key Not Found"
- **Cause:** Channel doesn't exist or stream key doesn't match
- **Solution:** Create channel with matching stream key in the application

### Issue 3: "Authentication Failed"
- **Cause:** OME publisher authentication enabled
- **Solution:** Disable authentication in OME config or configure proper credentials

### Issue 4: "Invalid URL Format"
- **Cause:** Incorrect RTMP URL format
- **Solution:** Use format: `rtmp://server:1935/app/streamKey`

### Issue 5: "App Not Found"
- **Cause:** Application name doesn't match OME configuration
- **Solution:** Check OME config and use correct app name (usually "app")

## Quick Reference

| Component | Value | Description |
|-----------|-------|-------------|
| RTMP Server | `ome.imagetv.in` | Your OME server hostname |
| RTMP Port | `1935` | Standard RTMP port |
| Virtual Host | `default` | Default OME virtual host |
| Application | `app` | Default application name |
| Stream Key | `live` | Your channel's stream key |
| **Correct URL** | `rtmp://ome.imagetv.in:1935/app/live` | Use this format |

## Still Having Issues?

1. Verify channel exists: Check Channels page in frontend
2. Check OME status: `systemctl status ovenmediaengine`
3. Review OME logs for specific error messages
4. Verify network connectivity to RTMP port
5. Test with a simple FFmpeg command
6. Check OME configuration file for custom settings

## Next Steps

Once connected successfully, you can:
- View the stream on the Streams page
- Check output URLs (HLS, DASH, WebRTC, etc.)
- Monitor stream metrics
- Start/stop recording
- Configure push publishing to other platforms
