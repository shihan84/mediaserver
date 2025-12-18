# Channels Page Enhancement Plan

## Current State
- Simple table view
- No live metrics
- No real-time stream status
- Basic channel information only

## Planned Enhancements

### 1. Live Stream Metrics Integration
- Fetch active streams and match to channels
- Display real-time metrics (viewers, bitrate, health, status)
- Auto-refresh metrics every 5 seconds

### 2. Card-Based Organization
- Active Channels (with live metrics)
- Inactive Channels (ready to stream)
- Better visual organization

### 3. Metrics Display Per Channel
- Viewer count
- Bitrate
- Stream health status
- Video/Audio track info
- Protocol-specific viewer counts

### 4. Quick Actions
- View stream details (opens StreamDetailModal)
- View channel URLs
- Start/Stop stream controls

### Implementation Steps
1. Add streams API integration
2. Create ChannelMetricsCard component
3. Organize channels by active/inactive
4. Add metrics polling for active channels
5. Update UI with card-based layout

