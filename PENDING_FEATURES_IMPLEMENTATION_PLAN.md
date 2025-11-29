# Pending Features Implementation Plan

**Date:** November 29, 2025  
**Status:** Ready for Implementation

---

## Overview

This document outlines the phased implementation plan for all pending OME features identified in the comprehensive comparison.

**Total Pending Features:** 10 features  
**Estimated Timeline:** 4-6 phases  
**Priority Levels:** High (3), Medium (4), Low (3)

---

## Phase 1: High Priority UI Enhancements (Week 1)

### 1.1 Event Monitoring Dashboard ✅
**Status:** Ready to implement  
**Effort:** Medium  
**Impact:** High

**Tasks:**
- [ ] Create Event Monitoring API endpoint in backend
- [ ] Add event fetching methods to omeClient
- [ ] Create EventMonitoringPage component
- [ ] Add real-time event feed with WebSocket updates
- [ ] Display stream lifecycle events
- [ ] Add event filtering and search
- [ ] Create event timeline visualization

**Backend:**
- Add `getEvents()` method to omeClient
- Create `/api/ome/events` endpoint
- Add WebSocket support for real-time events

**Frontend:**
- Create `EventMonitoringPage.tsx`
- Add event timeline component
- Real-time event updates

---

### 1.2 Manual Quality Selection UI ✅
**Status:** Ready to implement  
**Effort:** Low  
**Impact:** Medium

**Tasks:**
- [ ] Add quality selector to OvenPlayer component
- [ ] Display available renditions in StreamDetailModal
- [ ] Allow manual quality selection
- [ ] Show currently active quality
- [ ] Add quality indicators (resolution, bitrate)

**Frontend:**
- Enhance OvenPlayer with quality selection
- Add quality dropdown in StreamDetailModal
- Display rendition information

---

### 1.3 SCTE-35 Timeline Visualization ✅
**Status:** Ready to implement  
**Effort:** Medium  
**Impact:** Medium

**Tasks:**
- [ ] Create SCTE-35 timeline component
- [ ] Display markers on timeline
- [ ] Show marker metadata on hover/click
- [ ] Add marker insertion controls from timeline
- [ ] Integrate timeline into StreamDetailModal

**Frontend:**
- Create `Scte35Timeline.tsx` component
- Timeline visualization with markers
- Marker interaction (view, insert, delete)

---

## Phase 2: Input Protocol Support (Week 2)

### 2.1 WHIP Protocol Support ✅
**Status:** Ready to implement  
**Effort:** Medium  
**Impact:** Medium

**Tasks:**
- [ ] Add WHIP URL generation to outputUrlService
- [ ] Create WHIP ingest endpoint
- [ ] Add WHIP support documentation
- [ ] Update channel creation to support WHIP

**Backend:**
- Add WHIP URL generation
- Update stream creation to handle WHIP

**Frontend:**
- Add WHIP option in channel creation
- Display WHIP ingest URLs

---

### 2.2 RTSP Pull Support ✅
**Status:** Ready to implement  
**Effort:** Medium  
**Impact:** Medium

**Tasks:**
- [ ] Add RTSP pull configuration to channels
- [ ] Create RTSP pull API endpoint
- [ ] Add RTSP URL input in channel creation
- [ ] Display RTSP pull status in stream details

**Backend:**
- Add RTSP pull configuration
- Create RTSP pull management endpoints

**Frontend:**
- Add RTSP pull options in channel creation
- Display RTSP pull status

---

### 2.3 MPEG-2 TS Input Support ✅
**Status:** Ready to implement  
**Effort:** Low  
**Impact:** Low

**Tasks:**
- [ ] Add MPEG-2 TS documentation
- [ ] Add MPEG-2 TS URL generation
- [ ] Update channel creation UI

**Backend:**
- Add MPEG-2 TS URL support
- Documentation updates

---

## Phase 3: Advanced Features (Week 3)

### 3.1 DVR Functionality ✅
**Status:** Ready to implement  
**Effort:** High  
**Impact:** Medium

**Tasks:**
- [ ] Configure DVR in OME Server.xml
- [ ] Add DVR API endpoints
- [ ] Create DVR player controls (pause, rewind, seek)
- [ ] Display DVR window information
- [ ] Add DVR status to stream details

**Backend:**
- Add DVR configuration endpoints
- Get DVR status and window

**Frontend:**
- Add DVR controls to OvenPlayer
- Display DVR window
- Time-shift playback controls

---

### 3.2 Advanced Security Features ✅
**Status:** Ready to implement  
**Effort:** High  
**Impact:** High

**Tasks:**
- [ ] Implement Admission Webhooks
- [ ] Add Signed Policies support
- [ ] Create security configuration UI
- [ ] Add stream-level access control
- [ ] Implement token-based stream access

**Backend:**
- Admission webhook endpoints
- Signed policy generation
- Access control middleware

**Frontend:**
- Security configuration page
- Access control UI

---

## Phase 4: Enterprise Features (Week 4)

### 4.1 Multiplex Channels ✅
**Status:** Ready to implement  
**Effort:** High  
**Impact:** Low

**Tasks:**
- [ ] Add multiplex channel configuration
- [ ] Create multiplex channel API
- [ ] Add UI for multiplex channel management
- [ ] Display multiplex channel status

**Backend:**
- Multiplex channel endpoints
- Channel combination logic

**Frontend:**
- Multiplex channel management UI

---

### 4.2 Clustering Support (Optional) ✅
**Status:** Documentation only  
**Effort:** Very High  
**Impact:** Low (Enterprise only)

**Tasks:**
- [ ] Create clustering documentation
- [ ] Add origin-edge configuration guide
- [ ] Document load balancing setup

**Note:** This is primarily a configuration/documentation task as clustering is configured in OME itself.

---

## Implementation Order

### Sprint 1: High Priority UI (Days 1-5)
1. ✅ Event Monitoring Dashboard
2. ✅ Manual Quality Selection
3. ✅ SCTE-35 Timeline

### Sprint 2: Input Protocols (Days 6-10)
4. ✅ WHIP Support
5. ✅ RTSP Pull Support
6. ✅ MPEG-2 TS Documentation

### Sprint 3: Advanced Features (Days 11-15)
7. ✅ DVR Functionality
8. ✅ Advanced Security

### Sprint 4: Enterprise (Days 16-20)
9. ✅ Multiplex Channels
10. ✅ Clustering Documentation

---

## Success Criteria

Each phase should:
- ✅ Have working backend API endpoints
- ✅ Have functional frontend UI
- ✅ Include comprehensive error handling
- ✅ Have documentation updates
- ✅ Pass all tests

---

## Dependencies

- Phase 1: No dependencies
- Phase 2: Requires Phase 1 UI components
- Phase 3: Requires Phase 1 & 2
- Phase 4: Can be done independently

---

## Risk Assessment

| Feature | Risk Level | Mitigation |
|---------|------------|------------|
| Event Monitoring | Low | Standard API integration |
| Quality Selection | Low | OvenPlayer API supports this |
| SCTE-35 Timeline | Medium | Requires timeline visualization |
| WHIP Protocol | Medium | New protocol integration |
| RTSP Pull | Medium | Configuration complexity |
| DVR | High | OME configuration changes needed |
| Advanced Security | High | Complex security implementation |
| Multiplex Channels | High | Complex OME configuration |

