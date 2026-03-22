#!/bin/bash

# Login first to get a token
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"Admin!2024@cafe"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to login"
  exit 1
fi

echo "Token obtained"
echo ""
echo "Testing GET /api/bookings..."
curl -X GET http://localhost:5001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  2>&1
echo ""
