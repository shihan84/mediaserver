# Fix 502 Bad Gateway Error - Quick Guide

## Problem
All API requests return 502 Bad Gateway because nginx cannot reach the backend.

## Status ✅
- ✅ Backend is running on port 3001
- ✅ Backend health endpoint works: `{"status":"ok"}`
- ❌ Nginx is NOT configured to proxy `/api/*` requests

## Quick Fix

### Option 1: Edit Existing Nginx Config

```bash
# 1. Edit your nginx config
sudo nano /etc/nginx/sites-enabled/default

# 2. Add this location block inside the server block:
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
}

# 3. Test config
sudo nginx -t

# 4. Reload nginx
sudo systemctl reload nginx
```

### Option 2: Use the Provided Config File

```bash
# 1. Copy the example config
sudo cp /root/omd/ome/nginx-config-example.conf /etc/nginx/sites-available/ome

# 2. Create symlink (if needed)
sudo ln -s /etc/nginx/sites-available/ome /etc/nginx/sites-enabled/ome

# 3. Test config
sudo nginx -t

# 4. Reload nginx
sudo systemctl reload nginx
```

## Verify It Works

After fixing nginx:

```bash
# Test through nginx
curl http://127.0.0.1/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Or from browser
# Go to: http://ome.imagetv.in/api/health
```

## After Fix

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
2. **Try creating a channel again**
3. **Check browser console** - should see successful API calls instead of 502 errors

## Troubleshooting

If still getting 502:

1. **Check backend is running:**
   ```bash
   curl http://127.0.0.1:3001/health
   ```

2. **Check nginx error log:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify nginx config:**
   ```bash
   sudo nginx -t
   ```

The backend is working - you just need to configure nginx to forward requests to it!
