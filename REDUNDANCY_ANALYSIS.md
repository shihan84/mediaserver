# Redundancy Analysis Report

## Found Redundancies

### 1. ⚠️ Push Publishing vs Distributor (SRT) - PARTIAL OVERLAP

**Issue**: Both features handle SRT push publishing

**Push Publishing** (`/api/push-publishing`):
- Generic push publishing for SRT/RTMP/MPEG-TS
- Manual control per stream
- No distributor context
- Direct OME API wrapper

**Distributor (SRT)** (`/api/distributors`):
- SRT-specific distributor configuration
- Automatic push publishing setup
- Distributor metadata (name, SCTE-35 config)
- Channel-based organization

**Recommendation**: 
- Keep both but clarify purpose:
  - **Push Publishing**: For ad-hoc/one-time re-streaming
  - **Distributor**: For permanent distributor relationships with SCTE-35

### 2. ⚠️ Schedule vs ScheduledChannel - DIFFERENT PURPOSES (NOT REDUNDANT)

**Schedule** (Database model):
- Time-based content scheduling
- Recurring schedules
- Playlist-based content
- User-created schedules

**ScheduledChannel** (OME native):
- OME's scheduled channel API
- VOD playout with FallbackProgram
- Used for VOD fallback on stream drop
- OME-managed channels

**Status**: ✅ NOT REDUNDANT - Different purposes
- Schedule: User scheduling system
- ScheduledChannel: OME's VOD fallback mechanism

### 3. ⚠️ StreamsPage vs ChannelsPage - POTENTIAL OVERLAP

**ChannelsPage**: 
- Channel management (CRUD)
- Stream key management
- VOD fallback configuration

**StreamsPage**:
- Active stream monitoring
- Stream metrics
- Stream start/stop

**Status**: ✅ NOT REDUNDANT - Different purposes
- Channels: Configuration
- Streams: Runtime monitoring

### 4. ✅ No Other Major Redundancies Found

All other features serve distinct purposes:
- Recordings: Stream recording management
- SCTE-35: Marker management
- Distributors: Distributor configuration
- OME Management: Server stats/configuration
- Tasks: Background job management
- Chat: AI assistant
- Users: User management

## Recommendations

### 1. Clarify Push Publishing vs Distributor
- Add documentation explaining when to use each
- Consider deprecating manual push publishing for SRT in favor of Distributor
- Keep Push Publishing for RTMP/MPEG-TS use cases

### 2. Consider Consolidation Options
- **Option A**: Keep both Push Publishing and Distributor (current)
  - Pros: Flexibility, different use cases
  - Cons: Some confusion possible
  
- **Option B**: Make Distributor the primary way for SRT
  - Pros: Clearer purpose, better organization
  - Cons: Less flexibility for one-off pushes

### 3. UI Improvements
- Add tooltips/help text explaining differences
- Consider renaming "Push Publishing" to "Re-streaming" for clarity
- Add links between related features

## Conclusion

**Overall Status**: ✅ Minimal redundancy
- Most features serve distinct purposes
- Only minor overlap between Push Publishing and Distributor (SRT)
- No critical redundancies requiring immediate action

**Action Items**:
1. Add documentation clarifying Push Publishing vs Distributor
2. Consider UI improvements for clarity
3. Monitor user feedback for confusion
