# 400 Bad Request Error - Debug Guide

## Status
- ✅ 502 errors fixed (nginx working)
- ✅ Backend responding
- ⚠️ Getting 400 Bad Request (validation error)

## Improved Error Logging

I've added better error logging. When you try to create a channel, check:

```bash
# View recent backend logs
tail -50 /tmp/backend.log | grep -A 10 "Creating channel\|Validation error"

# Or watch in real-time
tail -f /tmp/backend.log
```

## Common Causes of 400 Error

### 1. Empty Required Fields
- **Channel Name** must not be empty
- **Stream Key** must not be empty
- Check if fields are being trimmed to empty strings

### 2. Duplicate Stream Key
- Error: "Stream key already exists"
- Solution: Use a different stream key

### 3. Validation Schema Issue
- Check if `appName` field is being sent correctly
- Default should be "app" if not provided

## Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try creating a channel
4. Click on the failed `/api/channels` request
5. Check:
   - **Request Payload** - What data is being sent?
   - **Response** - What error message is returned?

## Expected Request Format

```json
{
  "name": "My Channel",
  "appName": "live",
  "streamKey": "live",
  "description": "Optional description",
  "vodFallbackEnabled": false
}
```

## Next Steps

1. **Try creating a channel again**
2. **Check browser Network tab** - see the exact request/response
3. **Check backend logs** - see validation error details
4. **Share the error message** from either location

The improved logging will show exactly what validation is failing!
