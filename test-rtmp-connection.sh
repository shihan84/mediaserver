#!/bin/bash
# Test RTMP connection to OME

RTMP_SERVER="ome.imagetv.in"
RTMP_PORT="1935"
APP_NAME="${1:-live}"
STREAM_KEY="${2:-test}"

echo "Testing RTMP Connection"
echo "======================"
echo "Server: $RTMP_SERVER"
echo "Port: $RTMP_PORT"
echo "Application: $APP_NAME"
echo "Stream Key: $STREAM_KEY"
echo "RTMP URL: rtmp://$RTMP_SERVER:$RTMP_PORT/$APP_NAME/$STREAM_KEY"
echo ""

# Test port connectivity
echo "[1] Testing port connectivity..."
if nc -zv -w 5 $RTMP_SERVER $RTMP_PORT 2>&1 | grep -q "succeeded"; then
    echo "    [OK] Port $RTMP_PORT is accessible"
else
    echo "    [ERROR] Port $RTMP_PORT is not accessible"
    exit 1
fi

# Check OME is running
echo ""
echo "[2] Checking OME service..."
if systemctl is-active --quiet ovenmediaengine; then
    echo "    [OK] OME service is running"
else
    echo "    [ERROR] OME service is not running"
    exit 1
fi

# Check application exists
echo ""
echo "[3] Checking application '$APP_NAME' in OME config..."
if grep -q "<Name>$APP_NAME</Name>" /usr/share/ovenmediaengine/conf/Origin.xml; then
    echo "    [OK] Application '$APP_NAME' found in configuration"
else
    echo "    [ERROR] Application '$APP_NAME' NOT found in configuration"
    echo "    Available applications:"
    grep -A 1 "<Name>" /usr/share/ovenmediaengine/conf/Origin.xml | grep -E "(Name|app|live)" | grep -v "OvenMediaEngine" | grep -v "\*"
    exit 1
fi

echo ""
echo "======================"
echo "Ready to connect!"
echo ""
echo "Use this RTMP URL in OBS/FFmpeg:"
echo "  rtmp://$RTMP_SERVER:$RTMP_PORT/$APP_NAME/$STREAM_KEY"
echo ""
echo "Or test with FFmpeg:"
echo "  ffmpeg -re -i input.mp4 -c copy -f flv rtmp://$RTMP_SERVER:$RTMP_PORT/$APP_NAME/$STREAM_KEY"

