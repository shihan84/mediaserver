# Frontend Reorganization Plan

**Date:** 2024-12-19
**Status:** Planning → Implementation

## Current Structure Analysis

### Issues Identified:
1. **Flat Navigation**: 15 items in single list - hard to navigate
2. **No Feature Grouping**: Related features scattered (Streams, Recordings, Push Publishing)
3. **Component Organization**: All components in single folder, no feature-based structure
4. **Page Organization**: All pages flat, no logical grouping
5. **No Visual Hierarchy**: Everything has equal weight in navigation

---

## Proposed Reorganization

### 1. Navigation Structure (Grouped by Feature Domain)

```
📊 Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Streaming
  ├─ Streams
  ├─ Channels
  └─ Scheduled Channels

📹 Content Management
  ├─ SCTE-35 Markers
  ├─ Distributors
  ├─ Recordings
  └─ Push Publishing

⚙️ System Management
  ├─ OME Management
  ├─ Event Monitoring
  └─ Metrics

👥 Administration
  ├─ Users
  ├─ Tasks
  ├─ Chat
  └─ Settings
```

### 2. Folder Structure Reorganization

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── streaming/
│   │   ├── StreamsPage.tsx
│   │   ├── ChannelsPage.tsx
│   │   └── ScheduledChannelsPage.tsx
│   ├── content/
│   │   ├── Scte35Page.tsx
│   │   ├── DistributorsPage.tsx
│   │   ├── RecordingsPage.tsx
│   │   └── PushPublishingPage.tsx
│   ├── system/
│   │   ├── OMEManagementPage.tsx
│   │   ├── EventMonitoringPage.tsx
│   │   └── MetricsPage.tsx (if separate)
│   ├── administration/
│   │   ├── UsersPage.tsx
│   │   ├── TasksPage.tsx
│   │   └── SettingsPage.tsx
│   ├── chat/
│   │   └── ChatPage.tsx
│   └── auth/
│       └── LoginPage.tsx
├── components/
│   ├── streaming/
│   │   ├── StreamDetailModal.tsx
│   │   ├── ChannelDetailModal.tsx
│   │   └── OvenPlayer.tsx
│   ├── content/
│   │   └── (content-specific components)
│   ├── system/
│   │   └── (system-specific components)
│   └── ui/
│       └── (shared UI components)
├── features/
│   ├── streaming/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── content/
│   └── system/
└── layouts/
    └── DashboardLayout.tsx
```

### 3. Navigation Groups

**Group 1: Dashboard** (Single item)
- Overview & Statistics

**Group 2: Streaming** (Core streaming features)
- Streams (Active streams, playback, metrics)
- Channels (Channel management, input/output URLs)
- Scheduled Channels (Time-based channel scheduling)

**Group 3: Content Management** (Content-related features)
- SCTE-35 Markers (Ad insertion markers)
- Distributors (Stream distribution management)
- Recordings (Stream recording)
- Push Publishing (Push streams to external services)

**Group 4: System Management** (Infrastructure & monitoring)
- OME Management (Virtual hosts, applications, profiles)
- Event Monitoring (Real-time event dashboard)
- Metrics (Detailed metrics - if separate from dashboard)

**Group 5: Administration** (User & system admin)
- Users (User management)
- Tasks (Task management)
- Chat (AI agent chat)
- Settings (User settings, system configuration)

---

## Implementation Steps

### Phase 1: Navigation Reorganization ✅
- [ ] Create grouped navigation structure in DashboardLayout
- [ ] Add collapsible sections or visual grouping
- [ ] Update route paths (optional - can keep current paths)

### Phase 2: Folder Structure ✅
- [ ] Create feature-based folders in `pages/`
- [ ] Move pages to appropriate folders
- [ ] Update all imports in App.tsx
- [ ] Move components to feature folders
- [ ] Update component imports across the app

### Phase 3: Component Organization ✅
- [ ] Group components by feature domain
- [ ] Create feature-specific hooks/utils folders
- [ ] Extract shared utilities

### Phase 4: Testing & Verification ✅
- [ ] Verify all routes work
- [ ] Test navigation
- [ ] Verify all imports resolved
- [ ] Check for broken links

---

## Benefits of Reorganization

1. **Better Navigation**: Grouped items easier to find
2. **Scalability**: Easy to add new features in appropriate groups
3. **Maintainability**: Related code grouped together
4. **Clearer Structure**: New developers understand organization quickly
5. **Feature Isolation**: Easier to work on specific features
6. **Reduced Cognitive Load**: Fewer items visible at once

---

## Navigation Implementation Options

### Option 1: Collapsible Groups (Recommended)
- Each group can be expanded/collapsed
- Shows/hides items within group
- Saves space, improves UX

### Option 2: Visual Separation
- Groups separated by dividers/labels
- Always visible
- Simpler implementation

### Option 3: Hybrid
- Important items always visible (Dashboard)
- Other groups collapsible
- Best of both worlds

---

## Migration Strategy

1. **Keep routes unchanged** (backward compatible)
2. **Move files incrementally**
3. **Update imports systematically**
4. **Test after each phase**
5. **No breaking changes to URLs**

---

## Priority Order

1. ✅ Navigation grouping (high impact, low risk)
2. ✅ Component organization (medium impact, low risk)
3. ✅ Folder structure (medium impact, medium risk)
4. ✅ Feature hooks/utils (low impact, medium risk)

---

## Notes

- Keep all existing routes functional
- Maintain backward compatibility
- Update documentation after reorganization
- Consider lazy loading for feature modules

