# Quick Guide: How to Get Output URLs for Streams

**Last Updated:** 2025-01-23

## Quick Answer

There are **3 ways** to get output URLs for your streams:

---

## Method 1: Get Channel Output URLs (RECOMMENDED) ⭐

**Endpoint:** `GET /api/channels/:channelId/outputs`

**Returns:**
- Auto-generated OME output URLs (HLS, LLHLS, DASH, WebRTC, SRT)
- Distributor URLs (CDN/manual URLs)
- Output profile-specific URLs (if transcoding enabled)

**Example:**
```bash
curl -X GET http://localhost:3001/api/channels/{channel-uuid}/outputs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "channel": {
    "id": "channel-uuid",
    "name": "my-channel",
    "streamKey": "my-stream-key",
    "isActive": true
  },
  "outputs": {
    "llhls": "https://stream.example.com:3333/default/app/my-stream-key/llhls.m3u8",
    "hls": "https://stream.example.com:3333/default/app/my-stream-key/playlist.m3u8",
    "dash": "https://stream.example.com:3333/default/app/my-stream-key/manifest.mpd",
    "webrtc": "webrtc://stream.example.com:3333/default/app/my-stream-key",
    "srt": "srt://stream.example.com:9998?streamid=default/app/my-stream-key",
    "thumbnail": "https://stream.example.com:3333/default/app/my-stream-key/thumbnail",
    "profiles": [
      {
        "name": "720p",
        "llhls": "https://stream.example.com:3333/default/app/my-stream-key/720p/llhls.m3u8",
        "hls": "https://stream.example.com:3333/default/app/my-stream-key/720p/playlist.m3u8",
        "dash": "https://stream.example.com:3333/default/app/my-stream-key/720p/manifest.mpd"
      }
    ]
  },
  "distributors": [
    {
      "id": "distributor-uuid",
      "name": "cdn-distributor",
      "type": "HLS_MPD",
      "hlsUrl": "https://cdn.example.com/app/my-stream-key/playlist.m3u8",
      "mpdUrl": "https://cdn.example.com/app/my-stream-key/manifest.mpd"
    }
  ]
}
```

---

## Method 2: Get Stream Output URLs

**Endpoint:** `GET /api/streams/:streamName/outputs`

**Returns:**
- Auto-generated OME output URLs only
- Output profile-specific URLs (if transcoding enabled)

**Example:**
```bash
curl -X GET http://localhost:3001/api/streams/my-stream-key/outputs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "streamName": "my-stream-key",
  "outputs": {
    "llhls": "https://stream.example.com:3333/default/app/my-stream-key/llhls.m3u8",
    "hls": "https://stream.example.com:3333/default/app/my-stream-key/playlist.m3u8",
    "dash": "https://stream.example.com:3333/default/app/my-stream-key/manifest.mpd",
    "webrtc": "webrtc://stream.example.com:3333/default/app/my-stream-key",
    "srt": "srt://stream.example.com:9998?streamid=default/app/my-stream-key",
    "thumbnail": "https://stream.example.com:3333/default/app/my-stream-key/thumbnail"
  }
}
```

---

## Method 3: Stream Details (Includes URLs)

**Endpoint:** `GET /api/streams/:streamName`

**Returns:**
- Stream information from OME
- Stream metrics
- **Output URLs** (now included in response)

**Example:**
```bash
curl -X GET http://localhost:3001/api/streams/my-stream-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "stream": {
    "name": "my-stream-key",
    "sourceType": "rtmp",
    ...
  },
  "outputs": {
    "llhls": "https://stream.example.com:3333/default/app/my-stream-key/llhls.m3u8",
    "hls": "https://stream.example.com:3333/default/app/my-stream-key/playlist.m3u8",
    ...
  },
  "omeMetrics": { ... },
  "metrics": [ ... ]
}
```

---

## Configuration

Output URLs are generated based on environment variables in `backend/.env`:

```env
# OME Public URL Configuration
OME_PUBLIC_HOST=stream.example.com
OME_PUBLIC_PORT=3333
OME_PUBLIC_PORT_HTTP=3334
OME_SRT_PORT=9998
OME_WEBRTC_PORT=3333
OME_VHOST=default
OME_APP=app
OME_USE_HTTPS=true
```

If not set, defaults are used:
- Host: `localhost`
- HTTPS Port: `3333`
- HTTP Port: `3334`
- SRT Port: `9998`
- VHost: `default`
- App: `app`
- HTTPS: `false`

---

## URL Patterns

All URLs follow OME's standard patterns:

- **LLHLS:** `https://{host}:{port}/{vhost}/{app}/{streamName}/llhls.m3u8`
- **HLS:** `https://{host}:{port}/{vhost}/{app}/{streamName}/playlist.m3u8`
- **DASH:** `https://{host}:{port}/{vhost}/{app}/{streamName}/manifest.mpd`
- **WebRTC:** `webrtc://{host}:{port}/{vhost}/{app}/{streamName}`
- **SRT:** `srt://{host}:{port}?streamid={vhost}/{app}/{streamName}`
- **Thumbnail:** `https://{host}:{port}/{vhost}/{app}/{streamName}/thumbnail`

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get channel outputs
const response = await fetch('/api/channels/channel-uuid/outputs', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { outputs, distributors } = await response.json();

// Use in video player
const hlsUrl = outputs.hls;
const llhlsUrl = outputs.llhls; // For lower latency

// Or use distributor URL (CDN)
const cdnUrl = distributors.find(d => d.type === 'HLS_MPD')?.hlsUrl;
```

### React Example

```tsx
const { data } = useQuery({
  queryKey: ['channel-outputs', channelId],
  queryFn: async () => {
    const response = await api.get(`/channels/${channelId}/outputs`);
    return response.data;
  }
});

// Use HLS URL in player
<HlsPlayer src={data?.outputs?.hls} />
```

---

## Recommended Approach

**Use Method 1** (`GET /api/channels/:channelId/outputs`) because it:
- ✅ Returns both OME URLs and CDN/distributor URLs
- ✅ Includes output profiles for ABR streaming
- ✅ Provides complete channel context
- ✅ Best for displaying in UI

---

## Frontend Integration

The frontend API client can be updated to use these endpoints:

```typescript
// Add to frontend/src/lib/api.ts
export const channelsApi = {
  // ... existing methods
  getOutputs: (id: string) => api.get(`/channels/${id}/outputs`),
};

export const streamsApi = {
  // ... existing methods
  getOutputs: (streamName: string) => api.get(`/streams/${streamName}/outputs`),
};
```

---

## Troubleshooting

### URLs not working?

1. **Check OME is running** - URLs are only valid when OME is active
2. **Verify environment variables** - Ensure `OME_PUBLIC_HOST` matches your server
3. **Check ports** - Default ports may differ, update in `.env`
4. **Verify stream is active** - Stream must be ingesting for URLs to work

### Output profiles missing?

- Output profiles are fetched from OME automatically
- If profiles don't appear, OME may not have transcoding configured
- Check OME config for OutputProfile settings

---

## Files Modified

- ✅ `backend/src/services/outputUrlService.ts` - NEW: URL generation service
- ✅ `backend/src/routes/streams.ts` - Added outputs endpoint and included URLs in stream details
- ✅ `backend/src/routes/channels.ts` - Added outputs endpoint for channels

