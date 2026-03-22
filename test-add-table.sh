#!/bin/bash

# Test script for adding section-specific tables
# Usage: ./test-add-table.sh

echo "🧪 Testing Section-Specific Table Creation"
echo "=========================================="
echo ""

# First, login as admin to get token
echo "📝 Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin!2024@cafe"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test 1: Add a table to Lodge-Dine
echo "Test 1: Adding table LD-11 to Lodge-Dine section"
echo "------------------------------------------------"
RESPONSE1=$(curl -s -X POST http://localhost:5001/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableNumber": "LD-11",
    "section": "lodge-dine",
    "seats": 6,
    "location": "Terrace"
  }')

echo "Response: $RESPONSE1"
echo ""

# Test 2: Add a table to Cafe-Restaurant
echo "Test 2: Adding table CR-11 to Cafe-Restaurant section"
echo "------------------------------------------------------"
RESPONSE2=$(curl -s -X POST http://localhost:5001/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableNumber": "CR-11",
    "section": "cafe-restaurant",
    "seats": 4,
    "location": "Garden View"
  }')

echo "Response: $RESPONSE2"
echo ""

# Test 3: Add a VIP table
echo "Test 3: Adding VIP table to Lodge-Dine"
echo "---------------------------------------"
RESPONSE3=$(curl -s -X POST http://localhost:5001/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableNumber": "LD-VIP-01",
    "section": "lodge-dine",
    "seats": 8,
    "location": "VIP Lounge"
  }')

echo "Response: $RESPONSE3"
echo ""

# Test 4: Try to add duplicate table (should fail)
echo "Test 4: Attempting to add duplicate table LD-11 (should fail)"
echo "--------------------------------------------------------------"
RESPONSE4=$(curl -s -X POST http://localhost:5001/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableNumber": "LD-11",
    "section": "lodge-dine",
    "seats": 4,
    "location": "Main Hall"
  }')

echo "Response: $RESPONSE4"
echo ""

# Test 5: Get all Lodge-Dine tables
echo "Test 5: Fetching all Lodge-Dine tables"
echo "---------------------------------------"
RESPONSE5=$(curl -s -X GET "http://localhost:5001/api/tables?section=lodge-dine" \
  -H "Authorization: Bearer $TOKEN")

TABLE_COUNT=$(echo $RESPONSE5 | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "Total Lodge-Dine tables: $TABLE_COUNT"
echo ""

# Test 6: Get all Cafe-Restaurant tables
echo "Test 6: Fetching all Cafe-Restaurant tables"
echo "--------------------------------------------"
RESPONSE6=$(curl -s -X GET "http://localhost:5001/api/tables?section=cafe-restaurant" \
  -H "Authorization: Bearer $TOKEN")

TABLE_COUNT2=$(echo $RESPONSE6 | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "Total Cafe-Restaurant tables: $TABLE_COUNT2"
echo ""

echo "=========================================="
echo "✅ Testing completed!"
echo "=========================================="
