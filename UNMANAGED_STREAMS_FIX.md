# Unmanaged Streams and Disconnected Status Fix

## Issues Identified

### 1. **Unmanaged Streams**
- **Problem**: Streams showing as "Unmanaged" even when they have matching channels
- **Root Cause**: Orphan stream detection only checked `streamKey`, not `appName`
- **Example**: Stream "lilve" in app "live" wasn't matching channel with streamKey "lilve" and appName "live"

### 2. **Disconnected Status**
- **Problem**: Stream health showing "Disconnected" when stream is actually active
- **Root Cause**: 
  - Health endpoint only tried channel's appName or defaulted to 'app'
  - If stream was in 'live' app but channel lookup failed, it defaulted to 'app' and couldn't find stream
  - Outputs endpoint didn't use appName at all when generating URLs

## Fixes Applied

### 1. **Fixed Orphan Stream Detection**

**File**: `frontend/src/pages/StreamsPage.tsx`

**Before**:
```typescript
const orphanStreams = streams.filter((s: any) => 
  !channels.some((ch: any) => ch.streamKey === s.name)
);
```

**After**:
```typescript
const orphanStreams = streams.filter((s: any) => {
  const streamAppName = s.appName || 'app';
  return !channels.some((ch: any) => 
    ch.streamKey === s.name && (ch.appName || 'app') === streamAppName
  );
});
```

**Changes**:
- Now checks both `streamKey` AND `appName` for matching
- Stream "lilve" in app "live" will match channel with streamKey "lilve" and appName "live"
- Only truly unmatched streams will show as "Unmanaged"

### 2. **Fixed Health/Stats/Tracks/Outputs Endpoints**

**File**: `backend/src/routes/streams.ts`

**Changes**:
- **Health Endpoint**: Now tries multiple apps (channel's app, 'app', 'live') if stream not found
- **Stats Endpoint**: Now tries multiple apps if channel not found
- **Tracks Endpoint**: Now tries multiple apps if channel not found
- **Outputs Endpoint**: Now uses correct appName from channel, tries multiple apps if needed

**Health Endpoint Before**:
```typescript
const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
const appName = channel?.appName || 'app';
const health = await omeClient.getStreamHealth(streamName, 'default', appName);
```

**Health Endpoint After**:
```typescript
const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
let health = null;
const appsToTry = channel?.appName ? [channel.appName, 'app', 'live'] : ['app', 'live'];

for (const appName of appsToTry) {
  try {
    health = await omeClient.getStreamHealth(streamName, 'default', appName);
    if (health) {
      foundAppName = appName;
      break;
    }
  } catch (err) {
    // Continue to next app
  }
}
```

**Outputs Endpoint Before**:
```typescript
const outputs = outputUrlService.generateOutputUrls(streamName, ...);
// No appName used!
```

**Outputs Endpoint After**:
```typescript
const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
const appName = channel?.appName || 'app';
const outputs = outputUrlService.generateOutputUrls(streamName, ..., appName);
// Uses correct appName!
```

## Result

✅ **Unmanaged Streams**:
- Streams are now correctly matched with channels using both streamKey AND appName
- Only truly unmatched streams will show as "Unmanaged"
- Stream "lilve" in app "live" will correctly match its channel

✅ **Disconnected Status**:
- Health checks now try multiple apps to find the stream
- Health status will be accurate even if channel lookup fails
- Output URLs now use correct appName
- Streams should show "Connected" when they're actually active

## Files Changed

### Frontend:
- `frontend/src/pages/StreamsPage.tsx` - Fixed orphan stream detection

### Backend:
- `backend/src/routes/streams.ts` - Fixed health, stats, tracks, outputs endpoints to use correct appName

## Testing

1. **Unmanaged Streams**:
   - Stream "lilve" in app "live" should no longer show as "Unmanaged"
   - Only streams without matching channels should show as "Unmanaged"

2. **Disconnected Status**:
   - Active streams should show "Connected" or "Stream Healthy"
   - Health checks should work for streams in any app ('app', 'live', etc.)
   - Output URLs should use correct appName

## Deployment

✅ Backend updated and restarted
✅ Frontend built and deployed
✅ Changes are live

The unmanaged streams and disconnected status issues should now be resolved! 🎉

