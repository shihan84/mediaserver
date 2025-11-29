# Stream Connection Issue - Application Not Found

## Problem

When trying to connect via RTMP, OME logs show:
```
Could not find application: #default#live
```

## Root Cause

The application "live" doesn't exist in OME configuration. OME requires applications to be explicitly configured in `Server.xml` or `Origin.xml`.

## Current OME Configuration

By default, OME comes with an application named **"app"**. 

## Solution

You have two options:

### Option 1: Use the default "app" application (RECOMMENDED)

When creating a channel in the dashboard, use **"app"** as the Application Name, or leave it empty (it defaults to "app").

**RTMP URL format:**
```
rtmp://ome.imagetv.in:1935/app/{streamKey}
```

**Example:**
- Channel name: "My Channel"
- App Name: "app" (or leave default)
- Stream Key: "live"
- RTMP URL: `rtmp://ome.imagetv.in:1935/app/live`

### Option 2: Add a new "live" application to OME

If you want to use "live" as the application name, you need to add it to OME's configuration:

1. Edit `/usr/share/ovenmediaengine/conf/Origin.xml`:
   ```xml
   <Applications>
       <Application>
           <Name>app</Name>
           <!-- existing config -->
       </Application>
       <Application>
           <Name>live</Name>
           <Type>live</Type>
           <OutputProfiles>
               <!-- Add output profiles here -->
           </OutputProfiles>
       </Application>
   </Applications>
   ```

2. Restart OME:
   ```bash
   sudo systemctl restart ovenmediaengine
   ```

3. Then use: `rtmp://ome.imagetv.in:1935/live/{streamKey}`

## Recommended Action

**Use Option 1** - it's simpler and doesn't require OME configuration changes. Just make sure:
- When creating channels, use "app" as the Application Name
- Use the RTMP URL format: `rtmp://ome.imagetv.in:1935/app/{your-stream-key}`

## Testing

After fixing, test your connection:

```bash
# Test RTMP port
nc -zv ome.imagetv.in 1935

# Or use OBS/FFmpeg with the correct URL:
rtmp://ome.imagetv.in:1935/app/live
```

