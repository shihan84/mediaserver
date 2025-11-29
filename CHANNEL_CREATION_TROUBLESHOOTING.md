# Channel Creation Troubleshooting

## Current Status ✅

- ✅ Database migration applied (appName column exists)
- ✅ Prisma Client regenerated
- ✅ Backend running on port 3001
- ✅ Direct database test: Channel creation works
- ✅ Validation schema works correctly

## Common Issues and Solutions

### 1. Frontend Validation Error

**Check:** Browser console (F12 → Console tab)

**Common causes:**
- Missing required fields (name, streamKey)
- Invalid characters in fields
- Duplicate channel name or stream key

**Solution:**
- Ensure Channel Name and Stream Key are filled
- Use unique names/keys
- Check browser console for specific error

### 2. Authentication Error

**Check:** Are you logged in?

**Solution:**
- Make sure you're logged in as ADMIN or OPERATOR role
- Check browser Network tab → Request Headers → Authorization header exists
- Try logging out and back in

### 3. Duplicate Stream Key Error

**Error:** "Stream key already exists"

**Solution:**
- Use a different stream key
- Or delete/edit the existing channel with that stream key

### 4. API Error

**Check:** Browser Network tab (F12 → Network)

**Solution:**
- Look for `/api/channels` POST request
- Check the response status and error message
- Verify backend is accessible

## Debug Steps

### 1. Check Browser Console
```javascript
// Open browser console (F12)
// Look for errors when clicking "Create Channel"
```

### 2. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Create Channel"
4. Find the `/api/channels` request
5. Check:
   - Status code (should be 201 for success)
   - Request payload (verify all fields)
   - Response body (error message if any)

### 3. Test Backend Directly

```bash
# Get JWT token by logging in first, then:
curl -X POST http://localhost:3001/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "test-channel",
    "appName": "app",
    "streamKey": "test-key-123"
  }'
```

### 4. Check Backend Logs

```bash
tail -f /tmp/backend.log
# Then try creating a channel and watch for errors
```

## Expected Successful Response

```json
{
  "message": "Channel created successfully",
  "channel": {
    "id": "...",
    "name": "test-channel",
    "appName": "app",
    "streamKey": "test-key-123",
    ...
  }
}
```

## What Error Are You Seeing?

Please provide:
1. **Exact error message** from the frontend
2. **Browser console errors** (if any)
3. **Network request details** from DevTools
4. **What you're trying to create:**
   - Channel Name:
   - App Name:
   - Stream Key:

This will help identify the exact issue!
