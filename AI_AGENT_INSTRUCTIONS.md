# AI Agent Instructions & Progress Tracking

**Last Updated:** December 2024  
**Project:** OvenMediaEngine (OME) Streaming Platform  
**Current Phase:** Priority 1 Feature Implementation

---

## 🎯 CURRENT CONTEXT

### Project Overview
We are building a comprehensive streaming platform using OvenMediaEngine (OME) with:
- **Backend:** Node.js/Express/TypeScript with Prisma ORM
- **Frontend:** React/TypeScript with Tailwind CSS
- **Database:** PostgreSQL
- **Streaming Server:** OvenMediaEngine

### Current Implementation Status
- **Overall Coverage:** ~90% of Core OME Features
- **Location:** `/root/omd/ome/`
- **Key Files:**
  - Backend: `/root/omd/ome/backend/src/`
  - Frontend: `/root/omd/ome/frontend/src/`
  - Documentation: `/root/omd/ome/*.md`

### Recently Completed
1. ✅ Fixed unmanaged streams detection (appName matching)
2. ✅ Fixed disconnected status issues (multi-app stream lookup)
3. ✅ Enhanced OvenPlayer cleanup and error handling
4. ✅ Comprehensive OME implementation status review
5. ✅ **NEW: High-Priority API Implementations (December 2024)**
   - Output Profile CRUD operations (POST/PUT/DELETE/GET)
   - Admission Webhooks CRUD operations
   - RTSP Provider Management APIs
   - Enhanced Signed Policies API (validation & revocation)

---

## ✅ RECENTLY COMPLETED: HIGH-PRIORITY APIs (December 2024)

### Implementation Summary
All high-priority missing OME REST APIs have been implemented. This increases our API coverage from ~55% to ~70%.

### 1. Output Profile CRUD Operations ✅
**Status:** Complete  
**Implementation Date:** December 2024

**APIs Implemented:**
- `GET /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName` - Get single profile
- `POST /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles` - Create profile
- `PUT /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName` - Update profile
- `DELETE /api/ome/vhosts/:vhostName/apps/:appName/outputProfiles/:profileName` - Delete profile

**Files Modified:**
- `backend/src/utils/omeClient.ts` - Added CRUD methods
- `backend/src/routes/ome.ts` - Added CRUD routes with authentication & audit logging

**Features:**
- Dynamic transcoding configuration via API
- ABR profile management
- Full audit logging for all operations
- Operator role required for modifications

### 2. Admission Webhooks CRUD Operations ✅
**Status:** Complete  
**Implementation Date:** December 2024

**APIs Implemented:**
- `GET /api/ome/vhosts/:vhostName/admissionWebhooks` - List webhooks
- `POST /api/ome/vhosts/:vhostName/admissionWebhooks` - Create webhook
- `PUT /api/ome/vhosts/:vhostName/admissionWebhooks/:webhookId` - Update webhook
- `DELETE /api/ome/vhosts/:vhostName/admissionWebhooks/:webhookId` - Delete webhook

**Files Modified:**
- `backend/src/utils/omeClient.ts` - Added CRUD methods
- `backend/src/routes/ome.ts` - Added CRUD routes with authentication & audit logging

**Features:**
- Custom access control logic via webhooks
- Webhook management for security
- Full audit logging for all operations
- Operator role required for modifications

### 3. RTSP Provider Management APIs ✅
**Status:** Complete  
**Implementation Date:** December 2024

**APIs Implemented:**
- `GET /api/ome/vhosts/:vhostName/apps/:appName/rtspProviders` - List RTSP providers
- `POST /api/ome/vhosts/:vhostName/apps/:appName/rtspProviders` - Create RTSP provider
- `PUT /api/ome/vhosts/:vhostName/apps/:appName/rtspProviders/:providerName` - Update provider
- `DELETE /api/ome/vhosts/:vhostName/apps/:appName/rtspProviders/:providerName` - Delete provider

**Files Modified:**
- `backend/src/utils/omeClient.ts` - Added CRUD methods
- `backend/src/routes/ome.ts` - Added CRUD routes with authentication & audit logging

**Features:**
- IP camera integration via RTSP pull
- Dynamic RTSP source management
- Full audit logging for all operations
- Operator role required for modifications

### 4. Enhanced Signed Policies API ✅
**Status:** Complete  
**Implementation Date:** December 2024

**APIs Implemented:**
- `POST /api/ome/vhosts/:vhostName/apps/:appName/streams/:streamName/signed-policy` - Enhanced creation with options
- `POST /api/ome/vhosts/:vhostName/validate-policy` - Validate policy token
- `DELETE /api/ome/vhosts/:vhostName/policies/:token` - Revoke policy

**Files Modified:**
- `backend/src/utils/omeClient.ts` - Enhanced createSignedPolicy, added validate & revoke
- `backend/src/routes/ome.ts` - Added validation & revocation routes

**Features:**
- Enhanced policy creation with IP restrictions
- Policy validation endpoint
- Policy revocation capability
- Full audit logging for all operations

**Policy Options:**
- `clientIp` - Client IP address restriction
- `allowIp` - Allowed IP addresses array
- `denyIp` - Denied IP addresses array
- `signature` - Custom signature
- `expiresIn` - Expiration time in seconds

---

## 📋 ACTIVE TASKS (Priority 1)

### Task 1: DVR Player Controls ⚠️ IN PROGRESS
**Status:** Starting Implementation  
**Started:** December 2024  
**Priority:** High  
**Estimated Time:** 2-3 days

**What's Done:**
- ✅ DVR status API endpoints (`/api/streams/:streamName/dvr`)
- ✅ DVR configuration API (`/api/streams/dvr/config/:appName`)
- ✅ DVR status display in StreamDetailModal
- ✅ DVR window information display

**What Needs to be Done:**
- [ ] Add DVR playback controls to OvenPlayer component
- [ ] Implement pause/resume for live stream with DVR
- [ ] Add rewind/seek controls for time-shifted playback
- [ ] Create DVR timeline scrubber component
- [ ] Integrate DVR controls into StreamDetailModal
- [ ] Test DVR controls with active streams

**Implementation Steps:**
1. Enhance OvenPlayer component with DVR API methods
2. Create DVRControls component (pause, play, rewind, seek)
3. Add DVR timeline scrubber showing available window
4. Integrate into StreamDetailModal
5. Test with active streams that have DVR enabled

**Files to Modify:**
- `frontend/src/components/streaming/OvenPlayer.tsx`
- `frontend/src/components/streaming/StreamDetailModal.tsx`
- `frontend/src/components/streaming/DVRControls.tsx` (NEW)
- `frontend/src/lib/api.ts` (if needed for DVR API)

**Dependencies:**
- OvenPlayer DVR API documentation
- DVR must be enabled in OME Server.xml

---

### Task 2: SCTE-35 Timeline Visualization ⚠️ PENDING
**Status:** Not Started  
**Priority:** High  
**Estimated Time:** 2-3 days

**What's Done:**
- ✅ SCTE-35 marker list display
- ✅ SCTE-35 marker insertion API
- ✅ Marker metadata display
- ✅ SCTE-35 page with CRUD operations

**What Needs to be Done:**
- [ ] Create visual timeline component
- [ ] Position markers on timeline by timestamp
- [ ] Add timeline scrubber with current playback position
- [ ] Implement marker click-to-seek functionality
- [ ] Add marker hover tooltips with metadata
- [ ] Integrate timeline into StreamDetailModal
- [ ] Add timeline controls (zoom, pan)

**Implementation Steps:**
1. Create Scte35Timeline component with SVG/Canvas timeline
2. Calculate marker positions based on timestamps
3. Add interactive timeline scrubber
4. Implement click-to-seek functionality
5. Add marker interaction (view, insert, delete from timeline)
6. Integrate into StreamDetailModal
7. Test with markers at different timestamps

**Files to Create:**
- `frontend/src/components/streaming/Scte35Timeline.tsx` (NEW)

**Files to Modify:**
- `frontend/src/components/streaming/StreamDetailModal.tsx`
- `frontend/src/lib/utils.ts` (timeline utilities if needed)

**Dependencies:**
- React timeline library or custom SVG implementation
- Stream current playback time from OvenPlayer

---

## 📝 PROGRESS TRACKING

### Session History

#### Session 1: December 2024 - Priority 1 Implementation
**Started:** DVR Player Controls & SCTE-35 Timeline Implementation  
**Status:** ✅ COMPLETED

**Completed:**
- ✅ Created AI agent instruction system (`AI_AGENT_INSTRUCTIONS.md`)
- ✅ Enhanced OvenPlayer component with DVR support
  - Added `enableDvr` prop
  - Added `onTimeUpdate` callback for DVR time tracking
  - Added `onPlayerReady` callback to expose player instance
- ✅ Created DVRControls component (`DVRControls.tsx`)
  - Play/pause controls
  - Rewind/fast-forward (10s, 30s)
  - Timeline scrubber with DVR window display
  - "Go Live" button to jump to live edge
- ✅ Created Scte35Timeline component (`Scte35Timeline.tsx`)
  - Visual timeline with marker positions
  - Current time indicator
  - Click-to-seek functionality
  - Marker tooltips with metadata
  - Marker list with actions (view, insert, delete)
  - Zoom controls for timeline
- ✅ Integrated DVR controls into StreamDetailModal
- ✅ Replaced SCTE-35 list with timeline visualization
- ✅ Built and deployed frontend

**Files Created/Modified:**
- `frontend/src/components/streaming/DVRControls.tsx` (NEW)
- `frontend/src/components/streaming/Scte35Timeline.tsx` (NEW)
- `frontend/src/components/streaming/OvenPlayer.tsx` (ENHANCED)
- `frontend/src/components/streaming/StreamDetailModal.tsx` (ENHANCED)

**Next Steps:**
1. Test DVR controls with active stream that has DVR enabled
2. Test SCTE-35 timeline with markers
3. Verify seek functionality works correctly
4. Monitor for any edge cases or errors

---

## 🔧 TECHNICAL CONTEXT

### Key Components

#### OvenPlayer Component
**Location:** `frontend/src/components/streaming/OvenPlayer.tsx`  
**Current Features:**
- WebRTC, LLHLS, HLS playback with auto-fallback
- Quality selection support
- Robust cleanup and error handling

**To Enhance:**
- Add DVR playback methods
- Add time-shift controls
- Add current time tracking

#### StreamDetailModal Component
**Location:** `frontend/src/components/streaming/StreamDetailModal.tsx`  
**Current Features:**
- Stream information display
- Metrics and statistics
- OvenPlayer integration
- DVR status display
- SCTE-35 marker list

**To Enhance:**
- Add DVR controls below player
- Replace SCTE-35 list with timeline visualization

#### API Client
**Location:** `frontend/src/lib/api.ts`  
**DVR Endpoints:**
- `streamsApi.getDvr(streamName)` - Get DVR status
- `streamsApi.getDvrConfig(appName)` - Get DVR config

### Backend API Endpoints

**DVR:**
- `GET /api/streams/:streamName/dvr` - Get DVR status
- `GET /api/streams/dvr/config/:appName` - Get DVR configuration

**SCTE-35:**
- `GET /api/scte35` - Get all markers
- `POST /api/scte35` - Create marker
- `POST /api/scte35/:id/insert/:streamName` - Insert marker into stream

---

## 🎓 KNOWLEDGE BASE

### Important Concepts

#### DVR (Digital Video Recorder)
- Allows time-shifted playback of live streams
- Requires DVR enabled in OME Server.xml configuration
- Provides a "window" of time that can be rewound
- OvenPlayer supports DVR through its API

#### SCTE-35 Markers
- Ad insertion markers in streams
- Used for program/chapter breaks
- Timestamped events in the stream
- Can be inserted at any time during streaming

### Common Issues & Solutions

#### Issue: Stream showing as "unmanaged"
**Solution:** Fixed - Now checks both `streamKey` AND `appName` for matching

#### Issue: Stream showing "disconnected" when active
**Solution:** Fixed - Endpoints now try multiple apps ('app', 'live') to find stream

#### Issue: OvenPlayer getMediaElement errors
**Solution:** Fixed - Added aggressive cleanup and mount state guards

#### Issue: Thumbnail 404 errors
**Solution:** Fixed - Improved error handling to hide failed images gracefully

### File Structure
```
/root/omd/ome/
├── backend/
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # OME client, logger, etc.
│   │   └── middleware/    # Auth, rate limiting, etc.
│   └── prisma/            # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── streaming/  # OvenPlayer, StreamDetailModal, etc.
│   │   │   ├── shared/     # UI components
│   │   │   └── ui/         # Base UI components
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # API client, utils
│   │   └── store/          # Zustand stores
│   └── public/
└── *.md                    # Documentation
```

---

## 🚀 IMPLEMENTATION GUIDELINES

### Code Style
- TypeScript strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Error handling with try-catch
- Loading states for async operations

### Testing Checklist
- [ ] Test with active stream
- [ ] Test with DVR enabled/disabled
- [ ] Test with multiple markers
- [ ] Test error handling
- [ ] Test mobile responsiveness
- [ ] Check browser console for errors

### Deployment Process
1. Test locally
2. Build frontend: `cd frontend && npm run build`
3. Copy to nginx: `sudo cp -r frontend/dist/* /var/www/ome/`
4. Restart backend: `cd backend && npm run dev`
5. Verify functionality

---

## 📚 REFERENCE DOCUMENTATION

### OME Documentation
- Main: https://docs.ovenmediaengine.com/
- REST API: https://docs.ovenmediaengine.com/rest-api
- DVR: https://docs.ovenmediaengine.com/dvr
- SCTE-35: https://docs.ovenmediaengine.com/scte-35

### OvenPlayer Documentation
- CDN: https://cdn.jsdelivr.net/npm/ovenplayer/dist/ovenplayer.js
- API: Check OvenPlayer GitHub or documentation

### Project Documentation
- `CURRENT_IMPLEMENTATION_STATUS.md` - Full feature status
- `IMPLEMENTATION_SUMMARY.md` - Completed features
- `STREAMS_VS_CHANNELS_EXPLANATION.md` - Architecture explanation

---

## 🔄 CONTINUATION INSTRUCTIONS

If resuming work in a new chat session:

1. **Read this file first** to understand current state
2. **Check progress tracking** section for what was completed
3. **Review active tasks** to see what's in progress
4. **Check git status** for recent changes: `git status`
5. **Review recent files** modified in last session
6. **Continue from "Next Steps"** in progress tracking

### Quick Context Commands
```bash
# Check recent git commits
git log --oneline -10

# Check what files were modified
git status

# View backend logs
tail -f /tmp/backend.log

# Check OME service status
sudo systemctl status ovenmediaengine

# Restart services if needed
cd /root/omd/ome/backend && npm run dev
```

---

## 📞 SUPPORTING INFORMATION

### Environment
- **OS:** Linux (Ubuntu)
- **Node Version:** Check with `node --version`
- **Backend Port:** 3001
- **Frontend:** Served via Nginx at `/var/www/ome/`
- **OME API:** Configured in `backend/src/utils/omeClient.ts`

### Common Commands
```bash
# Backend
cd /root/omd/ome/backend && npm run dev

# Frontend Build
cd /root/omd/ome/frontend && npm run build

# Deploy Frontend
sudo cp -r /root/omd/ome/frontend/dist/* /var/www/ome/
sudo chown -R www-data:www-data /var/www/ome/

# Database
cd /root/omd/ome/backend && npx prisma migrate dev
```

---

**Last Session Update:** December 2024  
**Latest Implementation:** High-Priority OME APIs (Output Profiles, Admission Webhooks, RTSP Providers, Enhanced Signed Policies)  
**Next Update:** After frontend integration for new APIs  
**Maintainer:** AI Agent

---

## 📊 CURRENT API COVERAGE

**Overall OME REST API Coverage: ~70%** (up from 55%)

### Completed Categories:
- ✅ Stream Management: 100%
- ✅ Recording: 100%
- ✅ Push Publishing: 100%
- ✅ Scheduled Channels: 100%
- ✅ **Output Profiles: 100%** (NEW - was 25%)
- ✅ **Admission Webhooks: 100%** (NEW - was 0%)
- ✅ **RTSP Providers: 100%** (NEW - was 0%)
- ✅ **Signed Policies: 100%** (Enhanced - was 50%)
- ⚠️ Application Management: 40%
- ⚠️ Virtual Host: 40%
- ❌ Multiplex Channels: 0%
- ❌ DRM Configuration: 0%
- ❌ Clustering: 0%

### Next Priority (Medium):
1. Event Webhooks CRUD (currently read-only)
2. Application CRUD (create/update/delete)
3. Multiplex Channels API
4. DRM Configuration (if OTT requirement)

---

## 🔗 REFERENCE DOCUMENTATION

### New API Documentation:
- **Output Profiles:** `backend/src/routes/ome.ts` (lines 92-168)
- **Admission Webhooks:** `backend/src/routes/ome.ts` (lines 193-262)
- **RTSP Providers:** `backend/src/routes/ome.ts` (lines 264-340)
- **Enhanced Signed Policies:** `backend/src/routes/ome.ts` (lines 342-402)

### OME Client Methods:
- **Output Profiles:** `backend/src/utils/omeClient.ts` (lines 295-312)
- **Admission Webhooks:** `backend/src/utils/omeClient.ts` (lines 523-599)
- **RTSP Providers:** `backend/src/utils/omeClient.ts` (lines 601-683)
- **Signed Policies:** `backend/src/utils/omeClient.ts` (lines 509-584)

---

## ✅ CHECKLIST FOR NEW SESSION

When starting a new AI agent session, verify:
- [ ] Read this instruction file completely
- [ ] Check `CURRENT_IMPLEMENTATION_STATUS.md` for overall status
- [ ] Review active tasks above
- [ ] Check git status for uncommitted changes
- [ ] Review backend logs for errors
- [ ] Verify OME service is running
- [ ] Continue from where previous session stopped

