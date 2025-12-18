# Rate Limit (429) Error Fix

## Problem
Frontend was experiencing 429 "Too Many Requests" errors due to:
- Multiple components polling every 5 seconds
- Rate limit was too strict (100 requests per 15 minutes)
- No exponential backoff on 429 errors

## Solution Applied

### 1. **Increased Backend Rate Limits**
- **Before**: 100 requests per 15 minutes
- **After**: 500 requests per 15 minutes (5x increase)
- **API Rate Limiter**: Increased from 60 to 120 requests per minute

### 2. **Reduced Frontend Polling Frequency**

All polling intervals increased to reduce request load:

| Component | Before | After |
|-----------|--------|-------|
| StreamsPage | 5s | 10s |
| ChannelsPage | 10s | 15s |
| ChannelMetricsCard | 5s | 15s |
| StreamDetailModal | 5s | 10s |
| EventMonitoringPage | 5s | 15s |
| RecordingsPage | 5s | 15s |
| PushPublishingPage | 5s | 15s |
| SchedulesPage | 30s | 30s (no change) |

### 3. **Added Exponential Backoff**

**React Query Configuration** (`main.tsx`):
- Retry up to 3 times for 429 errors
- Exponential backoff: 2s, 4s, 8s
- Normal retry logic for other errors

**API Interceptor** (`lib/api.ts`):
- 429 errors logged as warnings (not toast spam)
- Allows react-query to handle retry with backoff

## Results

✅ Reduced request frequency by 50-66%
✅ Increased rate limits to accommodate real-time polling
✅ Added intelligent retry logic with exponential backoff
✅ Better error handling without user-facing spam

## Request Reduction

**Before** (with multiple components):
- StreamsPage: 12 requests/min
- ChannelsPage: 6 requests/min  
- ChannelMetricsCard: 12 requests/min × N cards
- StreamDetailModal: 12 requests/min × 2 queries
- Total: ~60+ requests/min (exceeding limit)

**After**:
- StreamsPage: 6 requests/min
- ChannelsPage: 4 requests/min
- ChannelMetricsCard: 4 requests/min × N cards
- StreamDetailModal: 6 requests/min × 2 queries
- Total: ~30-40 requests/min (within limits)

## Files Changed

### Backend:
- `backend/src/middleware/rateLimiter.ts` - Increased limits

### Frontend:
- `frontend/src/pages/StreamsPage.tsx` - 10s polling
- `frontend/src/pages/ChannelsPage.tsx` - 15s polling
- `frontend/src/components/streaming/ChannelMetricsCard.tsx` - 15s polling
- `frontend/src/components/streaming/StreamDetailModal.tsx` - 10s polling
- `frontend/src/pages/EventMonitoringPage.tsx` - 15s polling
- `frontend/src/pages/RecordingsPage.tsx` - 15s polling
- `frontend/src/pages/PushPublishingPage.tsx` - 15s polling
- `frontend/src/main.tsx` - Exponential backoff for 429 errors
- `frontend/src/lib/api.ts` - Better 429 error handling

## Deployment

✅ Backend restarted with new rate limits
✅ Frontend built and deployed
✅ Changes are live

## Next Steps

1. Clear browser cache
2. Monitor for 429 errors
3. If still occurring, may need to further increase intervals or rate limits

The rate limit issue should now be resolved! 🎉

