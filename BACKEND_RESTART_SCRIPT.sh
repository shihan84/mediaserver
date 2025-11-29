#!/bin/bash
# Backend restart script for OME Media Server

cd /root/omd/ome/backend

# Kill existing backend processes
pkill -f "tsx.*index" 2>/dev/null
sleep 2

# Start backend
npm run dev > /tmp/backend.log 2>&1 &

# Wait for startup
sleep 3

# Check if backend is running
if curl -s http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo "[OK] Backend started successfully on port 3001"
    echo "Logs: tail -f /tmp/backend.log"
else
    echo "[ERROR] Backend failed to start. Check logs: tail -f /tmp/backend.log"
    exit 1
fi

