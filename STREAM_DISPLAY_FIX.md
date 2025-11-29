# Stream Display Fix - IPv6/IPv4 Connection Issue

## Problem
Backend was unable to connect to OME API, causing streams not to appear on the dashboard.

## Root Cause
**IPv6/IPv4 Connection Issue:**
- Backend was configured with `OME_API_URL=http://localhost:8081`
- `localhost` was resolving to IPv6 (`::1`) instead of IPv4 (`127.0.0.1`)
- OME server might only be listening on IPv4
- Error: `connect ECONNREFUSED ::1:8081`

## Fix Applied
Changed `OME_API_URL` from `http://localhost:8081` to `http://127.0.0.1:8081` in `backend/.env`

This forces IPv4 connection which should work reliably.

## Verification Steps

1. **Check OME API directly:**
   ```bash
   curl -H "Authorization: Basic $(echo -n 'ome-api-token-2024' | base64)" \
     http://127.0.0.1:8081/v1/vhosts/default/apps/app/streams
   ```

2. **Check backend can connect:**
   - Backend should now connect successfully
   - Check backend logs for successful stream fetching
   - No more "ECONNREFUSED ::1:8081" errors

3. **Refresh Streams page:**
   - Streams should now appear in the dashboard
   - Active streams should show up in "Active Channels" section

## If Still Not Working

1. **Verify OME is running:**
   ```bash
   systemctl status ovenmediaengine
   netstat -tlnp | grep 8081
   ```

2. **Check backend logs:**
   ```bash
   tail -f /tmp/backend.log
   # or if using systemd:
   journalctl -u ome-backend -f
   ```

3. **Test backend API:**
   - Login to get JWT token
   - Call `/api/streams` endpoint
   - Check response for streams array

4. **Check firewall:**
   ```bash
   sudo ufw status
   # Make sure port 8081 is accessible locally
   ```

## After Fix

- Backend can now connect to OME API
- Streams should appear on Streams page
- Channel-stream matching should work correctly
- All stream details should load properly
