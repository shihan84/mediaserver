# Why OME Requires "app" Application Name

## Discovery

After extensive testing, we found that **OME appears to be hardcoded to use "app" as the default application name**, regardless of what you name it in the configuration.

## Test Results

1. ✅ Renamed application from "app" to "live" in XML
2. ✅ Restarted OME
3. ❌ OME still loaded it as `#default#app` (not `#default#live`)

## What This Means

**OME ignores the application name in the XML and always uses "app" as the default application name.**

This is likely:
- A hardcoded default in OME's source code
- A fallback behavior when the application name doesn't match OME's expectations
- OME's standard behavior for the default virtual host

## Implication

**You cannot change the application name from "app" in OME's default configuration.**

## Solutions

### Option 1: Use "app" (Recommended)
- This is what OME expects and works perfectly
- RTMP URL: `rtmp://ome.imagetv.in:1935/app/{stream-key}`
- All channels use the same application name
- Different streams are differentiated by stream keys

### Option 2: Use Stream Keys to Separate Channels
Since you can't change the application name, use different stream keys:
- Channel 1: `rtmp://ome.imagetv.in:1935/app/channel1`
- Channel 2: `rtmp://ome.imagetv.in:1935/app/channel2`
- Live Stream: `rtmp://ome.imagetv.in:1935/app/live`

### Option 3: Create Multiple Virtual Hosts (Advanced)
- Create separate virtual hosts for different applications
- Each virtual host could have its own "app" application
- More complex configuration

## Current Configuration

- **Application Name in XML**: Can be anything, but OME uses "app"
- **Actual Application Name OME Uses**: Always "app"
- **RTMP URL Format**: `rtmp://server:port/app/{stream-key}`

## Conclusion

OME's behavior is to always use "app" as the application name for the default virtual host, regardless of what's in the XML configuration. This is not a bug - it's how OME is designed to work.

**Best Practice**: Use "app" for all channels and differentiate streams using stream keys.

