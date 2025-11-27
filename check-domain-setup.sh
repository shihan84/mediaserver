#!/bin/bash
echo "=== Domain Setup Check for obe.imagetv.in ==="
echo ""

echo "[1] Checking Certbot installation..."
if command -v certbot &> /dev/null; then
    echo "    [OK] Certbot installed: $(certbot --version)"
else
    echo "    [ERROR] Certbot not found"
fi

echo ""
echo "[2] Checking SSL certificates..."
if [ -d "/etc/letsencrypt/live/obe.imagetv.in" ]; then
    echo "    [OK] Certificate found"
    sudo certbot certificates | grep -A 5 "obe.imagetv.in"
else
    echo "    [WARN] No certificate found for obe.imagetv.in"
fi

echo ""
echo "[3] Checking DNS resolution..."
DNS_RESULT=$(dig +short obe.imagetv.in 2>&1)
if [ -n "$DNS_RESULT" ] && [ "$DNS_RESULT" != "NXDOMAIN" ]; then
    echo "    [OK] Domain resolves to: $DNS_RESULT"
else
    echo "    [ERROR] Domain does not resolve (NXDOMAIN)"
    echo "    [INFO] Configure DNS A record pointing to this server"
fi

echo ""
echo "[4] Checking web server..."
if command -v nginx &> /dev/null; then
    echo "    [OK] Nginx installed: $(nginx -v 2>&1)"
    if systemctl is-active --quiet nginx; then
        echo "    [OK] Nginx is running"
    else
        echo "    [WARN] Nginx is not running"
    fi
elif command -v apache2 &> /dev/null; then
    echo "    [OK] Apache installed"
else
    echo "    [WARN] No web server found (Nginx recommended)"
fi

echo ""
echo "[5] Checking ports..."
if command -v netstat &> /dev/null; then
    PORT80=$(sudo netstat -tlnp | grep :80 | head -1)
    PORT443=$(sudo netstat -tlnp | grep :443 | head -1)
    if [ -n "$PORT80" ]; then
        echo "    [OK] Port 80 is listening"
    else
        echo "    [WARN] Port 80 is not listening"
    fi
    if [ -n "$PORT443" ]; then
        echo "    [OK] Port 443 is listening"
    else
        echo "    [WARN] Port 443 is not listening"
    fi
fi

echo ""
echo "[6] Testing HTTP access..."
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://obe.imagetv.in 2>&1)
if [ "$HTTP_TEST" = "200" ] || [ "$HTTP_TEST" = "301" ] || [ "$HTTP_TEST" = "302" ]; then
    echo "    [OK] HTTP accessible (Status: $HTTP_TEST)"
else
    echo "    [WARN] HTTP not accessible (Status: $HTTP_TEST)"
fi

echo ""
echo "[7] Testing HTTPS access..."
HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://obe.imagetv.in 2>&1)
if [ "$HTTPS_TEST" = "200" ]; then
    echo "    [OK] HTTPS accessible (Status: $HTTPS_TEST)"
elif [ "$HTTPS_TEST" = "000" ]; then
    echo "    [WARN] HTTPS not accessible (Connection failed)"
else
    echo "    [WARN] HTTPS returned status: $HTTPS_TEST"
fi

echo ""
echo "=== Check Complete ==="
