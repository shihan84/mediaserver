# Quick Fix: Streams Not Showing in Dashboard

## Immediate Steps

### 1. **Refresh Your Browser**
- Press `Ctrl+F5` (or `Cmd+Shift+R` on Mac) to hard refresh
- This ensures you have the latest frontend code

### 2. **Check Browser Console**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - Error messages (red text)
   - "Streams data:" log messages
   - Any API errors

### 3. **Check Network Tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Find `/api/streams` request
5. Check:
   - Status: Should be 200
   - Response: Should show `{"streams":[...],"channels":[...]}`

### 4. **Verify Stream is Active**
```bash
# Check if stream exists in OME
curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams

# Should return stream names like: {"message":"OK","response":["live"],"statusCode":200}
```

### 5. **Test Backend API**
```bash
# First, login to get token (replace with your credentials):
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Then test streams endpoint:
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/streams

# Should return streams and channels
```

## What Was Fixed

1. **Better Error Handling** - Frontend now shows error messages
2. **Debug Logging** - Console logs stream data for debugging
3. **Stream Structure** - Fixed sourceType to check `input.sourceType`
4. **Backend Logging** - Added logs for stream fetching process

## If Still Not Working

### Check Backend Logs
Look at the terminal where backend is running (if using `npm run dev`), or:
```bash
# Check if backend process is running
ps aux | grep "tsx\|node.*backend"

# Check for errors in logs
```

### Common Issues

**Issue:** "No active streams in OME" message
- **Cause:** Stream details fetching failed
- **Fix:** Check backend logs for errors

**Issue:** Blank page or error message
- **Cause:** API call failed
- **Fix:** Check Network tab for API errors

**Issue:** Streams show but can't expand
- **Cause:** Stream object missing fields
- **Fix:** Check console logs for stream structure

## Next Steps

1. **Refresh browser** (hard refresh: Ctrl+F5)
2. **Check console** for "Streams data:" log
3. **Check Network** tab for API response
4. **Check backend logs** for stream fetching

The stream should now appear if it's active in OME!
