# Frontend Issues Found and Fixed

**Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Issues Discovered

### ❌ Issue 1: Signed Policy API Mismatch
**Location:** `frontend/src/lib/api.ts` and `backend/src/routes/streams.ts`
**Problem:** 
- Frontend sends: `{ expiresIn: number }`
- Backend expects: `{ expiresIn: number }` (correct)
- But backend calls `omeClient.createSignedPolicy()` with wrong parameter order

**Backend Current Implementation:**
```typescript
const policy = await omeClient.createSignedPolicy(
  streamName,      // Wrong - should be vhostName
  expiresIn,       // Wrong - should be appName
  'default',       // Wrong - should be streamName
  channel?.appName // Wrong - should be policyId
);
```

**Actual omeClient.createSignedPolicy Signature:**
```typescript
async createSignedPolicy(
  vhostName: string,
  appName: string,
  streamName: string,
  policyId: string,
  expireTime: number, // Unix timestamp, not seconds!
  viewers?: number,
  allowedIp?: string
)
```

**Fix Required:**
1. Backend needs to generate a policyId
2. Convert expiresIn (seconds) to Unix timestamp
3. Pass parameters in correct order
4. Frontend needs to send policyId (optional) or backend generates one

### ⚠️ Issue 2: Signed Policy UI Form
**Location:** `frontend/src/components/StreamDetailModal.tsx`
**Problem:** 
- Form uses `getElementById` (not React pattern)
- Should use React state instead
- Missing policyId field in UI

### ✅ Other Findings

#### Working Correctly:
- ✅ Event Monitoring API integration
- ✅ Channel Input/Output URLs
- ✅ Stream Details API integration
- ✅ DVR Status API integration
- ✅ SCTE-35 API integration
- ✅ OvenPlayer script loading
- ✅ All other API endpoints

#### Minor Issues:
- ⚠️ Bundle size > 500KB (performance optimization needed)
- ⚠️ OvenPlayer requires internet (CDN dependency)
- ⚠️ No offline handling
- ⚠️ Error messages could be more user-friendly

## Recommended Fixes

### 1. Fix Signed Policy Backend
```typescript
// In backend/src/routes/streams.ts
router.post('/:streamName/signed-policy', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { streamName } = req.params;
    const { policyId, expiresIn = 3600, viewers, allowedIp } = req.body;
    const channel = await prisma.channel.findFirst({ where: { streamKey: streamName } });
    const appName = channel?.appName || 'app';
    const vhostName = 'default';
    
    // Generate policyId if not provided
    const finalPolicyId = policyId || `policy-${Date.now()}`;
    
    // Convert expiresIn (seconds) to Unix timestamp
    const expireTime = Math.floor(Date.now() / 1000) + expiresIn;
    
    const policy = await omeClient.createSignedPolicy(
      vhostName,
      appName,
      streamName,
      finalPolicyId,
      expireTime,
      viewers,
      allowedIp
    );
    
    res.json({
      message: 'Signed policy created successfully',
      policy: policy,
      policyId: finalPolicyId,
      expiresAt: new Date(expireTime * 1000).toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

### 2. Fix Signed Policy Frontend
```typescript
// In frontend/src/lib/api.ts
createSignedPolicy: (streamName: string, data: { 
  policyId?: string; 
  expiresIn?: number; 
  viewers?: number; 
  allowedIp?: string 
}) => api.post(`/streams/${streamName}/signed-policy`, data),

// In frontend/src/components/StreamDetailModal.tsx
// Use React state instead of getElementById
const [policyId, setPolicyId] = useState('');
const [policyExpiresIn, setPolicyExpiresIn] = useState(3600);
```

## Status

**Critical Issues:** 1 (Signed Policy API)
**Minor Issues:** 3 (UI patterns, performance, error messages)
**Overall Status:** ⚠️ **Needs Fix Before Production Use**

All other features appear to be working correctly from a code perspective.

