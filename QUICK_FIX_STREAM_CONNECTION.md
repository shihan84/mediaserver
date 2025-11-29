# Quick Fix: Stream Connection Issue

## Problem
```
Could not find application: #default#live
```

## Root Cause
You're trying to connect to application "live" but it doesn't exist in OME configuration.

## Quick Solution (Choose One)

### Option 1: Add "live" Application (Automated)
```bash
sudo /root/omd/ome/add-ome-application.sh live
```

Then use: `rtmp://ome.imagetv.in:1935/live/{stream-key}`

### Option 2: Use Default "app" Application (No Changes Needed)
1. Edit your channel in the dashboard
2. Change **Application Name** from "live" to "app"
3. Use RTMP URL: `rtmp://ome.imagetv.in:1935/app/{stream-key}`

## Verify Fix

After adding the application, test:

```bash
# Check OME is running
sudo systemctl status ovenmediaengine

# Check logs for errors
sudo tail -20 /var/log/ovenmediaengine/ovenmediaengine.log
```

## Test Connection

Try connecting with OBS or FFmpeg using the correct URL format:

```
rtmp://ome.imagetv.in:1935/{app-name}/{stream-key}
```

Replace:
- `{app-name}` = "app" or "live" (must exist in OME)
- `{stream-key}` = Your channel's stream key

## Common Issues

### Still getting "Could not find application"
1. Verify application was added: Check OME logs after restart
2. Restart OME: `sudo systemctl restart ovenmediaengine`
3. Check XML syntax: `sudo xmllint --noout /usr/share/ovenmediaengine/conf/Origin.xml`

### RTMP Connection Refused
- Check port 1935 is open: `nc -zv 127.0.0.1 1935`
- Check firewall: `sudo ufw status`
- Verify OME is running: `sudo systemctl status ovenmediaengine`

