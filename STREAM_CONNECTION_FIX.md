# Stream Connection Fix - Complete Solution

## Problem
Streams not appearing on dashboard even though:
- Stream is active in OME (confirmed via direct API call)
- Backend is running
- Frontend is working

## Root Cause
**IPv6/IPv4 Connection Issue:**
- Backend trying to connect to `::1:8081` (IPv6 localhost)
- OME only listening on IPv4 (`127.0.0.1:8081`)
- Error: `connect ECONNREFUSED ::1:8081`

## Fixes Applied

### 1. **Updated .env file** ✅
Changed `OME_API_URL` from:
```
OME_API_URL=http://localhost:8081
```
To:
```
OME_API_URL=http://127.0.0.1:8081
```

### 2. **Added Code-Level Fix** ✅
Updated `backend/src/utils/omeClient.ts` to automatically convert `localhost` to `127.0.0.1`:
```typescript
// Fix IPv6/IPv4 issue: Use 127.0.0.1 instead of localhost to force IPv4
let OME_API_URL = process.env.OME_API_URL || 'http://127.0.0.1:8081';
// Replace localhost with 127.0.0.1 to avoid IPv6 connection issues
if (OME_API_URL.includes('localhost')) {
  OME_API_URL = OME_API_URL.replace('localhost', '127.0.0.1');
}
```

## Verification

### Test OME API Directly:
```bash
# This works (confirmed):
curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://127.0.0.1:8081/v1/vhosts/default/apps/app/streams

# Returns: {"message":"OK","response":["live"],"statusCode":200}
```

### Restart Backend:
The backend has been restarted with the new configuration. It should now:
1. Connect to OME API successfully
2. Fetch stream list
3. Fetch stream details for each stream
4. Return streams to frontend

## Next Steps

1. **Refresh your browser** - Go to Streams page and refresh (F5)
2. **Check browser console** - Look for any errors (F12 → Console)
3. **Check Network tab** - Verify `/api/streams` returns data
4. **Verify backend logs** - Should see "Fetched stream names from OME" messages

## Expected Result

After fix, you should see:
- ✅ **Active Streams count** in summary card
- ✅ **Active Channels section** with your "live" stream
- ✅ Stream details showing:
  - Stream name: "live"
  - Source type: RTMP
  - Stream key
  - RTMP URL
  - Output URLs (LLHLS, HLS, DASH, etc.)

## If Still Not Working

1. **Verify backend restarted:**
   ```bash
   ps aux | grep "tsx.*index"
   ```

2. **Check latest backend logs:**
   ```bash
   tail -50 /tmp/backend.log | grep -E "(OMEClient|Fetched stream|Error)"
   ```

3. **Test backend API manually:**
   ```bash
   # Get JWT token by logging in, then:
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/streams
   ```

4. **Verify OME is accessible:**
   ```bash
   curl -v http://127.0.0.1:8081/v1/vhosts/default/apps/app/streams \
     -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)"
   ```

The fix should work now. Please refresh your browser and check the Streams page!
