# Distributor Feature Guide

## Overview

This feature allows you to configure distributors that receive your streams with SCTE-35 markers for ad insertion.

## Two Distributor Types

### 1. HLS/MPD Distributor
**For distributors who need HLS or DASH (MPD) streams with SCTE-35 preroll markers**

**How it works:**
- OME outputs HLS/LLHLS and DASH streams automatically
- SCTE-35 markers inserted via API appear in:
  - **HLS playlists**: As `#EXT-X-CUE-OUT` and `#EXT-X-CUE-IN` tags
  - **DASH MPD**: As EventStream elements
- Preroll markers can be automatically inserted when stream starts
- Manual preroll insertion is also available

**Configuration:**
- HLS URL: Your HLS/LLHLS playback URL (optional, for reference)
- MPD URL: Your DASH MPD URL (optional, for reference)
- Enable SCTE-35: Toggle SCTE-35 marker support
- Preroll Marker: Select SCTE-35 marker to use as preroll
- Auto-Preroll: Automatically insert preroll when stream starts

### 2. SRT Distributor
**For distributors who provide an SRT endpoint and need SCTE-35 markers**

**How it works:**
- OME push publishes your stream to the distributor's SRT endpoint
- SCTE-35 markers are embedded in the MPEG-TS container
- Stream is delivered via SRT protocol with SCTE-35 markers intact

**Configuration:**
- SRT Endpoint: The SRT URL provided by distributor (e.g., `srt://distributor.com:9000`)
- SRT Stream Key: Stream key provided by distributor
- Enable SCTE-35: Toggle SCTE-35 marker support

## How to Use

1. **Create a Channel** (if not already created)
   - Go to Channels page
   - Create a new channel with your stream key

2. **Add Distributor**
   - Navigate to Distributors page
   - Select the channel
   - Click "Add Distributor"
   - Choose type: HLS/MPD or SRT
   - Fill in required fields
   - Configure SCTE-35 settings

3. **For HLS/MPD with Preroll:**
   - Enable SCTE-35
   - Select a preroll marker (or create one in SCTE-35 page)
   - Enable "Auto-Preroll" for automatic insertion
   - Or use "Insert Preroll" button for manual insertion

4. **For SRT:**
   - Enter the SRT endpoint provided by distributor
   - Enter the SRT stream key
   - Enable SCTE-35
   - OME will automatically push publish with SCTE-35 markers

## SCTE-35 Marker Format

SCTE-35 markers inserted via OME API will appear in:
- **HLS**: As CUE-OUT/CUE-IN tags in playlist
- **DASH**: As EventStream in MPD manifest
- **SRT**: Embedded in MPEG-TS container

## API Endpoints

- `GET /api/distributors/channel/:channelId` - Get distributors for channel
- `POST /api/distributors` - Create distributor
- `PUT /api/distributors/:id` - Update distributor
- `DELETE /api/distributors/:id` - Delete distributor
- `POST /api/distributors/:id/insert-preroll` - Manually insert preroll marker

## Technical Details

**HLS/MPD:**
- OME automatically includes SCTE-35 markers in HLS playlists when inserted via API
- Markers appear as standard HLS CUE tags
- DASH MPD includes EventStream elements for SCTE-35

**SRT:**
- OME push publishes stream to SRT endpoint
- SCTE-35 markers are embedded in MPEG-TS container
- Compatible with standard SCTE-35 parsers

