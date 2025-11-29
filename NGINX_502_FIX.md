# Nginx 502 Bad Gateway Fix

## Problem
Frontend getting 502 Bad Gateway errors when trying to access API endpoints:
- `/api/channels`
- `/api/metrics/dashboard`
- All API requests failing

## Root Cause
Nginx cannot reach the backend server on port 3001. This means:
1. Backend might not be running
2. Nginx proxy configuration is incorrect
3. Backend is running but not accessible from nginx

## Solution

### Step 1: Verify Backend is Running

```bash
# Check if backend process is running
ps aux | grep "tsx.*index" | grep -v grep

# Test backend directly
curl http://127.0.0.1:3001/health

# Check backend logs
tail -f /tmp/backend.log
```

### Step 2: Fix Nginx Configuration

The nginx config needs to proxy `/api/*` requests to the backend.

**Edit nginx config:**
```bash
sudo nano /etc/nginx/sites-enabled/default
# or
sudo nano /etc/nginx/conf.d/default.conf
```

**Add/Update this location block:**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

**Important:** The `proxy_pass` should be `http://127.0.0.1:3001` (without trailing slash) or `http://127.0.0.1:3001/` (with trailing slash). 

**With trailing slash:**
- Request: `/api/channels` → Backend: `/api/channels`
- Request: `/api/channels/123` → Backend: `/api/channels/123`

**Without trailing slash:**
- Request: `/api/channels` → Backend: `/api/channels`
- Request: `/api/channels/123` → Backend: `/api/channels/123`

Both work, but prefer without trailing slash for consistency.

### Step 3: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Or restart nginx
sudo systemctl restart nginx
```

### Step 4: Verify It Works

```bash
# Test through nginx
curl http://127.0.0.1/api/health
# or from external
curl http://ome.imagetv.in/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Step 5: Start Backend (if not running)

```bash
cd /root/omd/ome/backend
npm run dev > /tmp/backend.log 2>&1 &
```

Or create a systemd service for automatic startup.

## Complete Nginx Config Example

```nginx
server {
    listen 80;
    server_name ome.imagetv.in;

    # Frontend static files
    location / {
        root /root/omd/ome/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 3001 is in use
sudo netstat -tlnp | grep 3001

# Check backend logs
tail -f /tmp/backend.log

# Check for errors
grep -i error /tmp/backend.log
```

### Nginx Errors
```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Connection Refused
If you see "connection refused" in nginx error logs:
- Backend is not running → Start it
- Backend is on wrong port → Check PORT in backend .env
- Firewall blocking → Check iptables/ufw

## Quick Fix Command

```bash
# 1. Ensure backend is running
cd /root/omd/ome/backend && npm run dev > /tmp/backend.log 2>&1 &

# 2. Wait a few seconds for backend to start
sleep 5

# 3. Verify backend is up
curl http://127.0.0.1:3001/health

# 4. Test through nginx (after fixing config)
curl http://127.0.0.1/api/health
```

After fixing nginx and restarting backend, refresh your browser - the 502 errors should be gone!
