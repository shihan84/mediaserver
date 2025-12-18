# Stream Detection Fix

## Issue
User streaming to `rtmp://ome.imagetv.in/live` with stream key `live` was not showing as active.

## Root Cause
1. **Backend was only checking "app" application**: The `getStreams()` method was hardcoded to only fetch streams from `/v1/vhosts/default/apps/app/streams`
2. **User's stream is in "live" application**: The stream was in the "live" application, not "app"
3. **Matching logic didn't consider appName**: Frontend matching only used streamKey, not appName

## Fix Applied

### Backend Changes (`backend/src/utils/omeClient.ts`)
- ✅ Updated `getStreams()` to check ALL applications (fetches app list first)
- ✅ Falls back to checking both "app" and "live" applications if app list unavailable
- ✅ Each stream now includes `appName` property
- ✅ Updated `getStream()` to accept `vhostName` and `appName` parameters

### Backend Routes (`backend/src/routes/streams.ts`)
- ✅ Enhanced stream-channel matching to use both `streamKey` AND `appName`
- ✅ Returns streams with matched channel information

### Frontend Changes
- ✅ **ChannelsPage.tsx**: Updated matching logic to match by both `streamKey` and `appName`
- ✅ **StreamsPage.tsx**: Updated matching logic to match by both `streamKey` and `appName`

## How It Works Now

1. **Backend fetches streams from all applications**:
   - Checks available applications via API
   - Falls back to checking "app" and "live" if needed
   - Each stream includes its `appName`

2. **Matching Logic**:
   - Frontend creates a map using key: `${appName}:${streamKey}`
   - Channels are matched using: `${channel.appName}:${channel.streamKey}`
   - This ensures streams from "live" app match channels with appName="live"

3. **Your Stream**:
   - RTMP URL: `rtmp://ome.imagetv.in/live`
   - Application: `live`
   - Stream Key: `live`
   - Should now be detected if channel has `appName="live"` and `streamKey="live"`

## Testing

After restarting backend:
1. Check if stream is detected: Visit `/api/streams` endpoint
2. Should see stream with `appName: "live"` and `name: "live"`
3. Should match with channel that has `appName="live"` and `streamKey="live"`

## Next Steps

1. ✅ Backend restarted with new code
2. ✅ Frontend updated
3. 🔄 **Restart backend** if not already done
4. 🔄 **Clear browser cache** to see updated frontend
5. 🔄 Verify channel in database has correct `appName="live"`

## Verification Commands

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs
tail -f /tmp/backend.log

# Verify OME has the stream (requires OME API key)
curl http://127.0.0.1:8081/v1/vhosts/default/apps/live/streams
```

