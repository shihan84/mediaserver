# OME Full Feature Implementation Plan

**Date:** December 2024  
**Based on:** [OvenMediaEngine Documentation](https://docs.ovenmediaengine.com/)

---

## 🎯 Goals

1. ✅ Implement all OME features from documentation
2. ✅ Remove duplicate tabs/navigation items
3. ✅ Add professional inline live player (like Flussonic/Wowza/Nimble)
4. ✅ Organize UI for optimal user experience

---

## 📋 Navigation Reorganization

### Current Issues:
- ❌ "Schedules" and "Scheduled Channels" are confusing/duplicate
- ❌ Some features hidden or not easily accessible

### Proposed Structure:

**1. Dashboard** (`/`)
- Overview statistics

**2. Streaming** (Main Category)
- **Live Streams** (`/streams`) - WITH INLINE PLAYER
  - Active streams with embedded player
  - Stream metrics and controls
  - Real-time monitoring
- **Channels** (`/channels`)
  - Channel management
  - Input/Output URLs
- **Content Schedules** (`/content-schedules`) - MERGED
  - Scheduled Channels (OME native)
  - Program Scheduling
  - VOD Playlists

**3. Content Management**
- **Recordings** (`/recordings`)
- **Push Publishing** (`/push-publishing`)
- **SCTE-35 Markers** (`/scte35`)
- **Distributors** (`/distributors`)

**4. System Configuration**
- **OME Management** (`/ome-management`)
  - Virtual Hosts
  - Applications
  - Output Profiles
  - RTSP Providers
- **Access Control** (`/access-control`)
  - Admission Webhooks
  - Signed Policies
- **Event Monitoring** (`/event-monitoring`)

**5. Administration**
- Users
- Tasks
- Chat
- Settings

---

## 🎥 Inline Live Player Implementation

### Requirements:
- Show player directly on StreamsPage (not just modal)
- Professional layout like Flussonic/Wowza/Nimble
- Side-by-side: Player + Metrics + Controls
- Real-time updates
- Quality selection
- DVR controls when available

### Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Streams Page Header                                     │
├─────────────────┬───────────────────────────────────────┤
│                 │ Stream Info & Controls                │
│                 ├───────────────────────────────────────┤
│   Live Player   │ Metrics Dashboard                     │
│   (OvenPlayer)  │ - Bitrate                             │
│                 │ - Viewers                             │
│                 │ - Health                              │
│                 ├───────────────────────────────────────┤
│                 │ Output URLs                           │
│                 │ Recording Status                      │
└─────────────────┴───────────────────────────────────────┘
```

---

## ✅ Features to Implement

### 1. Output Profiles Management UI
- **Page:** `/ome-management` (new tab)
- **Features:**
  - List all output profiles
  - Create/Edit/Delete profiles
  - Transcoding settings
  - ABR configuration

### 2. Admission Webhooks UI
- **Page:** `/access-control` (new page)
- **Features:**
  - List webhooks
  - Create/Edit/Delete
  - Test webhook endpoints
  - Webhook logs

### 3. RTSP Provider Management UI
- **Page:** `/ome-management` (new tab)
- **Features:**
  - List RTSP providers
  - Add IP camera sources
  - Edit/Delete providers
  - Connection status

### 4. Enhanced Signed Policies UI
- **Page:** `/access-control` (new tab)
- **Features:**
  - Create policies with IP restrictions
  - Validate policies
  - Revoke policies
  - Policy history

---

## 🔧 Implementation Steps

1. ✅ Fix SchedulesPage React error #310
2. ⏳ Reorganize navigation (merge schedules)
3. ⏳ Add inline player to StreamsPage
4. ⏳ Create Output Profiles UI
5. ⏳ Create Access Control page (Webhooks + Policies)
6. ⏳ Add RTSP Provider UI
7. ⏳ Update all routes and navigation

---

## 📊 Current Status

| Task | Status |
|------|--------|
| Fix SchedulesPage error | ✅ Done |
| Navigation reorganization | ⏳ Pending |
| Inline live player | ⏳ Pending |
| Output Profiles UI | ⏳ Pending |
| Access Control UI | ⏳ Pending |
| RTSP Provider UI | ⏳ Pending |

---

## 🎨 UI/UX Improvements

### StreamsPage with Inline Player:
- Grid layout: Player on left, info on right
- Responsive: Stacks on mobile
- Auto-select first active stream
- Quick switch between streams
- Real-time metrics update

### Professional Features:
- Stream preview thumbnails
- Multi-stream view (grid)
- Stream health indicators
- Quick actions toolbar
- Export stream URLs

---

## 📝 Notes

- Keep existing modal as "Full Details" view
- Inline player for quick preview/monitoring
- Full modal for detailed analysis
- Follow Flussonic/Wowza/Nimble design patterns

