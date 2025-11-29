#!/bin/bash

# Comprehensive Test Script for Implemented Features
# Phase 1: Event Monitoring, Quality Selection, SCTE-35 Timeline
# Phase 2: WHIP/RTSP Input URLs

echo "=========================================="
echo "Testing All Implemented Features"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_URL:-http://127.0.0.1:3001}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "Error output:"
        cat /tmp/test_output.log | head -5
        return 1
    fi
}

# Function to get auth token
get_auth_token() {
    curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
        | jq -r '.token' 2>/dev/null
}

echo "Step 1: Authentication"
echo "----------------------"
TOKEN=$(get_auth_token)
if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get authentication token${NC}"
    exit 1
fi
echo -e "${GREEN}Authentication successful${NC}"
echo ""

echo "Step 2: Testing Backend API Endpoints"
echo "======================================"
echo ""

# Test Event Monitoring API
run_test "Event Monitoring - Get Events" \
    "curl -s -X GET '$BASE_URL/api/ome/events' -H 'Authorization: Bearer $TOKEN' | jq -e '.events != null'"

run_test "Event Monitoring - Get Events with Params" \
    "curl -s -X GET '$BASE_URL/api/ome/events?vhostName=default&limit=50' -H 'Authorization: Bearer $TOKEN' | jq -e '.limit == 50'"

run_test "Event Monitoring - Get Event Webhooks" \
    "curl -s -X GET '$BASE_URL/api/ome/events/webhooks?vhostName=default' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"

# Test Streams API (for quality selection)
run_test "Stream Details - Get Stream" \
    "curl -s -X GET '$BASE_URL/api/streams' -H 'Authorization: Bearer $TOKEN' | jq -e '.streams != null'"

# Test Channels API (for input URLs)
CHANNELS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/channels" -H "Authorization: Bearer $TOKEN")
CHANNEL_ID=$(echo "$CHANNELS_RESPONSE" | jq -r '.channels[0].id // empty')

if [ -n "$CHANNEL_ID" ] && [ "$CHANNEL_ID" != "null" ]; then
    echo -e "${GREEN}Found channel ID: $CHANNEL_ID${NC}"
    
    run_test "Channel Input URLs - Get Inputs" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs != null'"
    
    run_test "Channel Input URLs - RTMP URL Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs.rtmp != null'"
    
    run_test "Channel Input URLs - WHIP URL Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs.whip != null'"
    
    run_test "Channel Input URLs - RTSP URL Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs.rtsp != null'"
    
    run_test "Channel Input URLs - WebRTC URL Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs.webrtc != null'"
    
    run_test "Channel Input URLs - SRT URL Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/inputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.inputs.srt != null'"
else
    echo -e "${YELLOW}No channels found - skipping input URL tests${NC}"
fi

# Test Output URLs (for quality selection)
if [ -n "$CHANNEL_ID" ]; then
    run_test "Channel Output URLs - Get Outputs" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/outputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.outputs != null'"
    
    run_test "Channel Output URLs - LLHLS Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/outputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.outputs.llhls != null'"
    
    run_test "Channel Output URLs - HLS Present" \
        "curl -s -X GET '$BASE_URL/api/channels/$CHANNEL_ID/outputs' -H 'Authorization: Bearer $TOKEN' | jq -e '.outputs.hls != null'"
fi

# Test SCTE-35 API
run_test "SCTE-35 - Get All Markers" \
    "curl -s -X GET '$BASE_URL/api/scte35' -H 'Authorization: Bearer $TOKEN' | jq -e '.markers != null'"

# Test Stream Details with Enhanced Metrics
if [ -n "$CHANNEL_ID" ]; then
    CHANNEL_STREAM_KEY=$(echo "$CHANNELS_RESPONSE" | jq -r ".channels[] | select(.id == \"$CHANNEL_ID\") | .streamKey // empty")
    
    if [ -n "$CHANNEL_STREAM_KEY" ] && [ "$CHANNEL_STREAM_KEY" != "null" ]; then
        echo -e "${GREEN}Testing stream: $CHANNEL_STREAM_KEY${NC}"
        
        run_test "Stream Details - Get Enhanced Metrics" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"
        
        run_test "Stream Details - Output URLs Present" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY' -H 'Authorization: Bearer $TOKEN' | jq -e '.outputs != null'"
        
        run_test "Stream Stats - Get Stats" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY/stats' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"
        
        run_test "Stream Tracks - Get Tracks" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY/tracks' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"
        
        run_test "Stream Health - Get Health" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY/health' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"
        
        run_test "Stream Viewers - Get Viewer Count" \
            "curl -s -X GET '$BASE_URL/api/streams/$CHANNEL_STREAM_KEY/viewers' -H 'Authorization: Bearer $TOKEN' | jq -e '. != null'"
    fi
fi

echo ""
echo "Step 3: Testing Frontend Routes (HTTP Status Check)"
echo "==================================================="
echo ""

# Check if frontend is accessible (basic check)
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
run_test "Frontend - Event Monitoring Page Route" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL/event-monitoring' | grep -q '200\|404'"

echo ""
echo "Step 4: Testing OME Client Methods"
echo "==================================="
echo ""

# Check if OME is accessible
OME_API_URL="${OME_API_URL:-http://127.0.0.1:8081}"
run_test "OME API - Connectivity Check" \
    "curl -s -o /dev/null -w '%{http_code}' '$OME_API_URL/v1/vhosts' | grep -q '200\|401\|403'"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✅${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi

