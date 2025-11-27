#!/bin/bash
echo "=== Testing All Features ==="
echo ""

BASE_URL="http://ome.imagetv.in"
TOKEN=""

# Test 1: Health Check
echo "[1] Testing Health Endpoint..."
HEALTH=$(curl -s $BASE_URL/health)
echo "   Health: $HEALTH"
echo ""

# Test 2: Login
echo "[2] Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}')
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo "   [OK] Login successful"
else
  echo "   [ERROR] Login failed"
  exit 1
fi
echo ""

# Test 3: Get Current User
echo "[3] Testing Get Current User..."
USER=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/auth/me)
echo "   User: $(echo $USER | grep -o '"username":"[^"]*' | cut -d'"' -f4)"
echo ""

# Test 4: Dashboard Metrics
echo "[4] Testing Dashboard Metrics..."
METRICS=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/metrics/dashboard)
echo "   Metrics retrieved: $(echo $METRICS | grep -o '"total":[0-9]*' | head -1)"
echo ""

# Test 5: Channels
echo "[5] Testing Channels..."
CHANNELS=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/channels)
CHANNEL_COUNT=$(echo $CHANNELS | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   Channels: $CHANNEL_COUNT"
echo ""

# Test 6: SCTE-35 Markers
echo "[6] Testing SCTE-35 Markers..."
SCTE35=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/scte35)
SCTE35_COUNT=$(echo $SCTE35 | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   SCTE-35 Markers: $SCTE35_COUNT"
echo ""

# Test 7: Schedules
echo "[7] Testing Schedules..."
SCHEDULES=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/schedules)
SCHEDULE_COUNT=$(echo $SCHEDULES | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   Schedules: $SCHEDULE_COUNT"
echo ""

# Test 8: Streams
echo "[8] Testing Streams..."
STREAMS=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/streams)
echo "   Streams endpoint: OK"
echo ""

# Test 9: Tasks
echo "[9] Testing Tasks..."
TASKS=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/tasks)
TASK_COUNT=$(echo $TASKS | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   Tasks: $TASK_COUNT"
echo ""

# Test 10: Chat
echo "[10] Testing Chat..."
CHAT=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/chat)
CHAT_COUNT=$(echo $CHAT | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   Chat messages: $CHAT_COUNT"
echo ""

# Test 11: Users
echo "[11] Testing Users..."
USERS=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/users)
USER_COUNT=$(echo $USERS | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "   Users: $USER_COUNT"
echo ""

# Test 12: API Docs
echo "[12] Testing API Documentation..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api-docs)
echo "   API Docs status: $DOCS"
echo ""

echo "=== All Tests Complete ==="
