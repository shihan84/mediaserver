# Custom Application Name Feature

## Problem
Previously, channels could only use the default OME application "app". Users wanted to create channels with custom application names (e.g., "live") but the RTMP URLs were hardcoded to use "app".

## Solution
Added support for custom `appName` per channel in the database and throughout the system.

## Changes Made

### 1. Database Schema
- Added `appName` field to `Channel` model (default: "app")
- Added index on `appName` for better query performance

### 2. Backend Changes
- **Validation**: Updated `createChannelSchema` to accept `appName` (optional, defaults to "app")
- **Routes**: Updated channel creation/update to handle `appName`
- **Output URLs**: Updated `outputUrlService.generateOutputUrls()` to accept `appName` parameter
- **Channel Routes**: Updated `/api/channels/:id/outputs` to use channel's `appName`

### 3. Frontend Changes
- **ChannelsPage**: Added "OME Application Name" input field in create/edit forms
- **StreamsPage**: Updated `getRtmpUrl()` to accept and use `appName` from channel
- **Forms**: Added appName field with default value "app" and helpful placeholder text

## Usage

### Creating a Channel with Custom App Name

1. **Via Frontend:**
   - Go to Channels page
   - Click "Create Channel"
   - Enter:
     - Channel Name: "My Live Channel"
     - **OME Application Name: "live"** (new field)
     - Stream Key: "live"
   - Click "Create"

2. **RTMP URL Generated:**
   - Old format: `rtmp://server:1935/app/live`
   - New format: `rtmp://server:1935/live/live` (uses appName from channel)

### Important Notes

**OME Application Requirements:**
- The application must exist in OME's configuration (Server.xml)
- If the application doesn't exist, OME may reject the stream or create it dynamically (depends on OME settings)
- Default application "app" should always work out of the box

**For Custom Applications:**
1. **Add to OME Server.xml:**
   ```xml
   <Applications>
       <Application>
           <Name>live</Name>
           <!-- Your app configuration -->
       </Application>
   </Applications>
   ```
2. **Restart OME:**
   ```bash
   sudo systemctl restart ovenmediaengine
   ```

### Migration

To add the `appName` column to existing channels:
```sql
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "appName" TEXT DEFAULT 'app';
UPDATE "Channel" SET "appName" = 'app' WHERE "appName" IS NULL;
CREATE INDEX IF NOT EXISTS "Channel_appName_idx" ON "Channel"("appName");
```

## API Changes

### Create Channel
```json
POST /api/channels
{
  "name": "My Channel",
  "appName": "live",  // NEW: Optional, defaults to "app"
  "streamKey": "my-stream-key",
  ...
}
```

### Update Channel
```json
PUT /api/channels/:id
{
  "appName": "live",  // NEW: Can be updated
  ...
}
```

### RTMP URL Format
```
rtmp://{host}:{port}/{appName}/{streamKey}
```

Examples:
- Default: `rtmp://ome.imagetv.in:1935/app/stream1`
- Custom: `rtmp://ome.imagetv.in:1935/live/live`

## Testing

1. Create a channel with appName "live" and streamKey "live"
2. Verify RTMP URL shows: `rtmp://server:1935/live/live`
3. Connect via RTMP using that URL
4. Verify stream appears in OME and on dashboard

## Troubleshooting

**Stream not appearing:**
- Verify the application exists in OME Server.xml
- Check OME logs for errors
- Ensure application is properly configured in OME

**Wrong RTMP URL:**
- Check channel's `appName` in database
- Refresh frontend page
- Clear browser cache if needed
