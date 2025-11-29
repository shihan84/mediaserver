# Stream Display Troubleshooting

## Issue
Streams are not appearing in the Streams tab on the dashboard, even though streams are active in OME.

## Debugging Steps

### 1. Check OME API Directly

```bash
# Check if streams exist in OME
curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams

# Should return: {"message":"OK","response":["stream1","stream2"],"statusCode":200}
```

### 2. Check Backend API

```bash
# Test backend API (need JWT token from login)
# First login:
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Then use the token:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/streams

# Should return: {"streams":[...],"channels":[...]}
```

### 3. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors related to:
   - API calls failing
   - Authentication errors
   - Network errors

### 4. Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the Streams page
4. Look for `/api/streams` request
5. Check:
   - Status code (should be 200)
   - Response body (should contain streams array)
   - Request headers (should include Authorization)

### 5. Verify Stream Object Structure

The frontend expects stream objects with:
- `name` - Stream name (required)
- `input.sourceType` - Source type (e.g., "RTMP", "SRT")
- `createdTime` - Creation timestamp

If streams are returned but not displayed, check console logs for stream structure.

## Common Issues

### Issue 1: Empty Streams Array
**Symptom:** API returns `{"streams":[],"channels":[]}`

**Possible Causes:**
- Stream details fetching failed
- OME API authentication issue
- Response parsing error

**Solution:**
- Check backend logs for errors
- Verify OME API is accessible
- Check authentication credentials

### Issue 2: API Returns 401 Unauthorized
**Symptom:** Network tab shows 401 error

**Solution:**
- Login again to get fresh JWT token
- Check if token expired
- Verify authentication middleware is working

### Issue 3: Streams Array Has Objects But Not Displaying
**Symptom:** Console shows streams array with data, but UI shows "No active streams"

**Possible Causes:**
- Stream object missing required fields
- Frontend filtering out streams
- React key prop issues

**Solution:**
- Check console logs for stream structure
- Verify stream objects have `name` field
- Check React DevTools for component state

### Issue 4: getStream() Fails for Individual Streams
**Symptom:** Stream names fetched but details fail

**Solution:**
- Check OME API response format
- Verify stream name is correct
- Check for network/CORS issues

## Testing Commands

### Test OME Connection
```bash
# Test OME API directly
curl -v -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams
```

### Test Backend Logs
```bash
# If using PM2
pm2 logs ome-backend

# If using systemd
journalctl -u ome-backend -f

# If running manually
# Check terminal output where backend is running
```

### Test Stream Details
```bash
# Get stream details directly from OME
curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams/live
```

## Added Debugging

Recent changes added:
1. **Logging in getStreams()** - Logs stream names and count
2. **Error handling** - Better error messages in frontend
3. **Console logging** - Streams data logged to browser console
4. **Fallback stream objects** - Returns minimal stream object if details fail

## Next Steps

1. **Refresh the page** - Check if streams appear
2. **Check browser console** - Look for errors or debug logs
3. **Check backend logs** - Look for stream fetching logs
4. **Test API directly** - Use curl commands above
5. **Verify stream is active** - Confirm stream is running in OME

## If Still Not Working

1. Check all logs (browser console + backend)
2. Verify OME service is running
3. Test OME API directly
4. Test backend API with curl
5. Check network connectivity between services
