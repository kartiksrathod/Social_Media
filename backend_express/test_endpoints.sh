#!/bin/bash

# SocialVibe Express Backend - API Test Script
# This script tests all major endpoints

BASE_URL="http://localhost:8001/api"
TOKEN=""

echo "=========================================="
echo "SocialVibe Express Backend - API Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
status=$(echo "$response" | tail -n1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (Status: $status)${NC}"
fi
echo ""

# Test 2: Signup
echo "Test 2: User Signup"
USERNAME="testuser_$(date +%s)"
EMAIL="test_$(date +%s)@example.com"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"username":"'$USERNAME'","email":"'$EMAIL'","password":"testpass123"}')
status=$(echo "$response" | tail -n1)
if [ "$status" = "201" ]; then
    TOKEN=$(echo "$response" | head -n1 | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    echo -e "${GREEN}✓ Signup successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Signup failed (Status: $status)${NC}"
    echo "$response"
fi
echo ""

# Test 3: Get Current User
if [ -n "$TOKEN" ]; then
    echo "Test 3: Get Current User"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me" \
      -H "Authorization: Bearer $TOKEN")
    status=$(echo "$response" | tail -n1)
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ Get current user successful${NC}"
    else
        echo -e "${RED}✗ Get current user failed (Status: $status)${NC}"
    fi
    echo ""
fi

# Test 4: Create Post
if [ -n "$TOKEN" ]; then
    echo "Test 4: Create Post"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/posts" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"text":"Hello from Express! #nodejs #mern #testing"}')
    status=$(echo "$response" | tail -n1)
    if [ "$status" = "201" ]; then
        echo -e "${GREEN}✓ Create post successful${NC}"
        POST_ID=$(echo "$response" | head -n1 | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -n1)
        echo "Post ID: $POST_ID"
    else
        echo -e "${RED}✗ Create post failed (Status: $status)${NC}"
    fi
    echo ""
fi

# Test 5: Get Feed
if [ -n "$TOKEN" ]; then
    echo "Test 5: Get Feed"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/posts/feed" \
      -H "Authorization: Bearer $TOKEN")
    status=$(echo "$response" | tail -n1)
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ Get feed successful${NC}"
    else
        echo -e "${RED}✗ Get feed failed (Status: $status)${NC}"
    fi
    echo ""
fi

# Test 6: Trending Hashtags
echo "Test 6: Get Trending Hashtags"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/hashtags/trending")
status=$(echo "$response" | tail -n1)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ Get trending hashtags successful${NC}"
else
    echo -e "${RED}✗ Get trending hashtags failed (Status: $status)${NC}"
fi
echo ""

# Test 7: Like Post
if [ -n "$TOKEN" ] && [ -n "$POST_ID" ]; then
    echo "Test 7: Like Post"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/posts/$POST_ID/like" \
      -H "Authorization: Bearer $TOKEN")
    status=$(echo "$response" | tail -n1)
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ Like post successful${NC}"
    else
        echo -e "${RED}✗ Like post failed (Status: $status)${NC}"
    fi
    echo ""
fi

# Test 8: Get Explore Posts
if [ -n "$TOKEN" ]; then
    echo "Test 8: Get Explore Posts"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/posts/explore" \
      -H "Authorization: Bearer $TOKEN")
    status=$(echo "$response" | tail -n1)
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ Get explore posts successful${NC}"
    else
        echo -e "${RED}✗ Get explore posts failed (Status: $status)${NC}"
    fi
    echo ""
fi

echo "=========================================="
echo "Test suite completed"
echo "=========================================="
