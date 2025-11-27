# Accessing Backend on Port 3001

## Current Status

- **Backend:** Running on port 3001
- **Local Access:** Working (http://localhost:3001)
- **Domain Access:** Not working (http://obe.imagetv.in:3001)
- **Firewall:** UFW inactive

## Issue Analysis

The backend is listening on all interfaces (`*:3001`), but you cannot access it via the domain. Possible causes:

1. **DNS not configured** - Domain doesn't resolve
2. **Port 3001 blocked** - Cloud provider firewall or network rules
3. **No reverse proxy** - Direct port access not recommended for production

## Solutions

### Option 1: Use Reverse Proxy (Recommended)

Set up Nginx to proxy requests from port 80/443 to port 3001. This is the recommended production approach.

**Advantages:**
- Standard ports (80/443) - no need to specify port in URL
- SSL/HTTPS support
- Better security
- Standard practice

**Steps:**

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

2. Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/obe.imagetv.in
```

3. Add configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name obe.imagetv.in;

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
    }

    # Frontend (when deployed)
    location / {
        root /root/omd/ome/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

4. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/obe.imagetv.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx
```

5. Access via: `http://obe.imagetv.in/api/health`

### Option 2: Open Port 3001 Directly (Not Recommended)

If you need direct access to port 3001:

1. **Check Cloud Provider Firewall:**
   - Most cloud providers (AWS, DigitalOcean, etc.) have a firewall/security group
   - You need to allow inbound traffic on port 3001
   - Check your cloud provider's console

2. **Open Port in UFW (if enabled):**
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

3. **Check iptables:**
```bash
sudo iptables -L -n | grep 3001
```

4. **Test access:**
```bash
curl http://obe.imagetv.in:3001/health
```

### Option 3: Use IP Address Directly

If DNS isn't configured yet, you can test with IP:

```bash
curl http://38.242.229.221:3001/health
```

## Quick Test Commands

```bash
# Test local access
curl http://localhost:3001/health

# Test via IP (if port is open)
curl http://38.242.229.221:3001/health

# Test via domain (requires DNS + port open)
curl http://obe.imagetv.in:3001/health

# Check if port is listening
netstat -tlnp | grep 3001

# Check DNS resolution
dig obe.imagetv.in +short
```

## Recommended Setup

For production, use Option 1 (Reverse Proxy):

1. **Install Nginx**
2. **Configure reverse proxy** (port 80 → 3001)
3. **Set up SSL** with Certbot (port 443)
4. **Access via:** `https://obe.imagetv.in/api`

This way:
- No need to specify port in URL
- Standard HTTPS on port 443
- Better security
- Frontend and backend on same domain

## Troubleshooting

### Cannot access via domain:3001

1. **Check DNS:**
   ```bash
   dig obe.imagetv.in +short
   ```
   Should return: `38.242.229.221`

2. **Check Cloud Provider Firewall:**
   - AWS: Security Groups
   - DigitalOcean: Cloud Firewall
   - Azure: Network Security Groups
   - Allow inbound TCP port 3001

3. **Check if port is accessible:**
   ```bash
   # From another machine
   telnet obe.imagetv.in 3001
   # Or
   nc -zv obe.imagetv.in 3001
   ```

4. **Check backend logs:**
   ```bash
   # Check if requests are reaching the server
   tail -f /root/omd/ome/backend/logs/combined.log
   ```

### Backend not responding

1. **Check if backend is running:**
   ```bash
   ps aux | grep "tsx watch"
   ```

2. **Check backend logs:**
   ```bash
   cd /root/omd/ome/backend
   tail -f logs/combined.log
   ```

3. **Restart backend:**
   ```bash
   pkill -f "tsx watch"
   cd /root/omd/ome/backend
   npm run dev
   ```

## Next Steps

1. **Set up Nginx reverse proxy** (recommended)
2. **Configure DNS** (if not done)
3. **Set up SSL certificate** (after DNS)
4. **Deploy frontend** to `/root/omd/ome/frontend/dist`
5. **Test all endpoints**

