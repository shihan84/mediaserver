# Stream Dashboard Fix

## Issue
Stream started successfully via RTMP but was not appearing on the dashboard.

## Root Causes Found

### 1. **Authentication Mismatch** ✅ FIXED
- **Problem:** Backend was using `Bearer` token authentication
- **Reality:** OME API requires `Basic` authentication with Base64-encoded token
- **Fix:** Changed authentication in `omeClient.ts` from `Bearer` to `Basic`

### 2. **Response Format Parsing** ✅ FIXED  
- **Problem:** OME API returns streams in format: `{message: "OK", response: ["stream1"], statusCode: 200}`
- **Issue:** Backend was not extracting the `response.response` array
- **Fix:** Updated `getStreams()` to:
  1. Extract stream names from `response.response` array
  2. Fetch full details for each stream
  3. Return array of stream objects with details

## Changes Made

### File: `backend/src/utils/omeClient.ts`

1. **Authentication Fix:**
```typescript
// Before:
config.headers['Authorization'] = `Bearer ${this.apiKey}`;

// After:
const authToken = Buffer.from(this.apiKey).toString('base64');
config.headers['Authorization'] = `Basic ${authToken}`;
```

2. **Response Parsing Fix:**
```typescript
async getStreams() {
  const result = await this.request('GET', '/v1/vhosts/default/apps/app/streams');
  let streamNames: string[] = [];
  
  if (result && result.response && Array.isArray(result.response)) {
    streamNames = result.response;
  }
  
  // Fetch full details for each stream
  if (streamNames.length > 0) {
    const streamPromises = streamNames.map((streamName: string) => 
      this.getStream(streamName).catch((err) => {
        logger.warn('Failed to fetch stream details', { streamName, error: err.message });
        return { name: streamName, state: 'unknown' };
      })
    );
    return await Promise.all(streamPromises);
  }
  
  return [];
}
```

3. **Other Methods Updated:**
- `getStream()` - Extracts `response.response`
- `getMetrics()` - Extracts `response.response`
- `getOutputProfiles()` - Extracts `response.response`

## Verification Steps

### 1. Check Backend is Running
```bash
ps aux | grep "node.*backend\|tsx.*index"
```

### 2. Test OME API Directly
```bash
# Should return stream list
curl -s -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams
```

### 3. Test Backend API (Need valid JWT token)
```bash
# Login first to get token, then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/streams
```

### 4. Check Dashboard
1. Open frontend in browser
2. Navigate to **Streams** page
3. You should see the active stream "live" in the "OME Active Streams" section
4. Stream should show:
   - Stream name: "live"
   - Source type: RTMP
   - Output URLs (LLHLS, HLS, DASH, WebRTC, SRT, Thumbnail)
   - Metrics and statistics

## Expected Behavior

After these fixes:

1. **Stream Detection:**
   - When you connect via RTMP: `rtmp://ome.imagetv.in:1935/app/live`
   - OME detects the stream
   - Backend fetches stream list from OME API correctly
   - Frontend displays the stream on Streams page

2. **Stream Details:**
   - Clicking on a stream card shows:
     - Full stream details
     - Input tracks (Video, Audio)
     - Output tracks (encoded streams)
     - All output URLs
     - Metrics

3. **Auto-refresh:**
   - Frontend polls every 5 seconds
   - New streams appear automatically
   - Streams disappear when disconnected

## If Still Not Working

1. **Check Backend Logs:**
   ```bash
   # If running with tsx watch, check terminal output
   # Or check logs if running as service
   journalctl -u ome-backend -f
   ```

2. **Verify OME Connection:**
   ```bash
   # Test OME API directly
   curl -v -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
     http://localhost:8081/v1/vhosts/default/apps/app/streams
   ```

3. **Check Environment Variables:**
   ```bash
   cd /root/omd/ome/backend
   cat .env | grep OME_
   # Should show:
   # OME_API_URL=http://localhost:8081
   # OME_API_KEY=ome-api-token-2024
   ```

4. **Restart Backend:**
   ```bash
   # If running manually, restart it
   # The tsx watch should auto-reload, but you can restart:
   pkill -f "tsx.*index"
   cd /root/omd/ome/backend
   npm run dev
   ```

## Current Status

✅ **Fixed:**
- OME API authentication (Bearer → Basic)
- Response parsing for stream list
- Stream details fetching

✅ **Working:**
- OME service running on port 8081
- RTMP server listening on port 1935
- Stream "live" is active in OME

🔄 **Next Steps:**
- Refresh the dashboard/Streams page
- The stream should now appear
- If not, check browser console for errors
