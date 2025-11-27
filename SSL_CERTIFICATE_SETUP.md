# SSL Certificate Setup Guide for obe.imagetv.in

## Current Status

- **Certbot:** Installed (version 2.9.0)
- **SSL Certificates:** Not yet issued
- **Domain DNS:** Not resolving (NXDOMAIN)
- **Web Server:** Not installed (Nginx/Apache)
- **HTTPS:** Not accessible

## Prerequisites Checklist

Before obtaining an SSL certificate, ensure:

1. [ ] Domain DNS is configured and pointing to this server
2. [ ] Domain resolves correctly (check with: `dig obe.imagetv.in`)
3. [ ] Port 80 (HTTP) is open and accessible
4. [ ] Port 443 (HTTPS) is open and accessible
5. [ ] Web server (Nginx) is installed and configured

## Step 1: Configure DNS

The domain `obe.imagetv.in` must have an A record pointing to your server's public IP address.

### Check Current DNS Status

```bash
# Check if domain resolves
dig obe.imagetv.in +short

# Check DNS propagation
nslookup obe.imagetv.in
```

### Required DNS Records

Add an A record in your DNS provider:
- **Type:** A
- **Name:** obe (or @ for root domain)
- **Value:** Your server's public IP address
- **TTL:** 3600 (or default)

## Step 2: Install and Configure Nginx

### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Basic Nginx Configuration

Create initial configuration file: `/etc/nginx/sites-available/obe.imagetv.in`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name obe.imagetv.in;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Temporary: Redirect to backend health check
    location / {
        return 200 "Domain configured. Ready for SSL certificate.";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/obe.imagetv.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 3: Obtain SSL Certificate

### Using Certbot (Standalone Mode)

If Nginx is not yet configured, use standalone mode:

```bash
# Stop any service using port 80
sudo systemctl stop nginx  # if running

# Obtain certificate
sudo certbot certonly --standalone -d obe.imagetv.in

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email with EFF
```

### Using Certbot (Webroot Mode - Recommended)

If Nginx is configured:

```bash
sudo certbot --nginx -d obe.imagetv.in
```

This will:
- Automatically configure Nginx
- Obtain the certificate
- Set up automatic renewal

## Step 4: Configure Nginx for Production

After obtaining the certificate, update Nginx configuration:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name obe.imagetv.in;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name obe.imagetv.in;

    ssl_certificate /etc/letsencrypt/live/obe.imagetv.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obe.imagetv.in/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React build)
    location / {
        root /root/omd/ome/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

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
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Verify SSL Certificate

### Check Certificate Status

```bash
# List certificates
sudo certbot certificates

# Test certificate
openssl s_client -connect obe.imagetv.in:443 -servername obe.imagetv.in < /dev/null
```

### Test HTTPS Access

```bash
curl -I https://obe.imagetv.in
```

## Step 6: Automatic Renewal

Certbot sets up automatic renewal. Verify it's configured:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

Certificates are valid for 90 days and auto-renew 30 days before expiration.

## Troubleshooting

### Domain Not Resolving

1. Check DNS records: `dig obe.imagetv.in`
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify A record points to correct IP

### Port 80 Not Accessible

1. Check firewall: `sudo ufw status`
2. Open port 80: `sudo ufw allow 80/tcp`
3. Check if another service is using port 80: `sudo lsof -i :80`

### Certbot Fails

1. Ensure domain resolves to this server
2. Check port 80 is accessible from internet
3. Verify no firewall blocking Let's Encrypt
4. Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Nginx Configuration Errors

1. Test configuration: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify file permissions on certificate files

## Quick Setup Script

Once DNS is configured, you can use this quick setup:

```bash
#!/bin/bash
# Quick SSL setup for obe.imagetv.in

DOMAIN="obe.imagetv.in"

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install nginx -y
fi

# Create basic Nginx config for certbot
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    location / {
        return 200 "Ready for SSL";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com

echo "SSL certificate setup complete!"
```

## Next Steps After SSL Setup

1. Update backend CORS_ORIGIN to use HTTPS
2. Deploy frontend build to `/root/omd/ome/frontend/dist`
3. Configure Nginx with full production settings
4. Test all endpoints (API, WebSocket)
5. Set up monitoring and logging

## Notes

- Let's Encrypt has rate limits (50 certificates per domain per week)
- Certificates auto-renew via systemd timer
- Keep email address updated for renewal notifications
- Test renewal process before certificates expire

