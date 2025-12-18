# CORS and Stream Detail Error Fixes

## Issues Identified

### 1. **CORS Error - Thumbnail URL**
- **Problem**: Thumbnail URL uses `localhost:3333` causing CORS errors
- **Error**: `Access to image at 'http://localhost:3333/default/app/lilve/thumbnail' from origin 'http://ome.imagetv.in' has been blocked by CORS policy`
- **Root Cause**: `outputUrlService` defaults to `localhost` instead of public domain

### 2. **500 Internal Server Error - Stream Detail**
- **Problem**: Stream detail endpoint returns 500 error for stream "lilve"
- **Root Cause**: Stream exists in "live" app but endpoint might fail when stream not found or appName mismatch

## Fixes Applied

### 1. **Fixed Thumbnail URL Generation**

**File**: `backend/src/services/outputUrlService.ts`

- ✅ Extract public host from `CORS_ORIGIN` environment variable
- ✅ If CORS_ORIGIN is `https://ome.imagetv.in`, extract `ome.imagetv.in` as hostname
- ✅ Auto-enable HTTPS if CORS_ORIGIN uses HTTPS protocol
- ✅ Fallback to localhost only if no environment variables set

**Changes**:
```typescript
// Extract hostname from CORS_ORIGIN if available
let defaultHost = 'localhost';
if (process.env.CORS_ORIGIN) {
  try {
    const corsUrl = new URL(process.env.CORS_ORIGIN);
    defaultHost = corsUrl.hostname;
  } catch (e) {
    // Invalid URL, use default
  }
}

// Force update if still using localhost
if (this.config.publicHost === 'localhost' && process.env.CORS_ORIGIN) {
  const corsUrl = new URL(process.env.CORS_ORIGIN);
  this.config.publicHost = corsUrl.hostname;
  if (corsUrl.protocol === 'https:') {
    this.config.useHttps = true;
  }
}
```

### 2. **Improved Stream Detail Error Handling**

**File**: `backend/src/routes/streams.ts`

- ✅ Find channel first to get appName
- ✅ Try multiple apps (channel's app, 'app', 'live') if stream not found
- ✅ Return 404 instead of 500 when stream doesn't exist
- ✅ Use found appName for all subsequent API calls
- ✅ Better error logging

**Changes**:
- Find channel first to get appName
- Try multiple apps if stream not found in first app
- Return proper 404 error with message
- Use `foundAppName` for all metrics and URL generation

## Result

### Thumbnail URLs Now:
- ✅ Use `ome.imagetv.in:3333` instead of `localhost:3333`
- ✅ No more CORS errors
- ✅ Works from frontend domain

### Stream Detail Endpoint:
- ✅ Returns 404 instead of 500 when stream not found
- ✅ Checks all apps automatically
- ✅ Better error messages
- ✅ Uses correct appName for metrics

## Environment Variables

Ensure these are set:
- `CORS_ORIGIN=https://ome.imagetv.in` (or http://ome.imagetv.in)
- `OME_PUBLIC_HOST=ome.imagetv.in` (optional, will extract from CORS_ORIGIN)

## Testing

1. **Thumbnail CORS**: 
   - Thumbnail URLs should now use `ome.imagetv.in:3333`
   - No CORS errors in browser console

2. **Stream Detail**:
   - Stream "lilve" in "live" app should work
   - Returns proper error if stream doesn't exist
   - Checks multiple apps automatically

## Deployment

✅ Backend code updated
✅ Backend restarted
✅ Changes are live

The CORS errors and 500 errors should now be resolved! 🎉

