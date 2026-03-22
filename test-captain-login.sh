#!/bin/bash

echo "Testing Captain Logins..."
echo "=========================="
echo ""

echo "1. Testing Captain 1 (Lodge-Dine):"
response1=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"captain1@restaurant.com","password":"Captain1!2024@cafe"}')

if echo "$response1" | grep -q "success.*true"; then
    echo "✅ Captain 1 login SUCCESSFUL"
    echo "Response: $response1" | head -c 200
    echo "..."
else
    echo "❌ Captain 1 login FAILED"
    echo "Response: $response1"
fi

echo ""
echo ""

echo "2. Testing Captain 2 (Cafe-Restaurant):"
response2=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"captain2@restaurant.com","password":"Captain2!2024@cafe"}')

if echo "$response2" | grep -q "success.*true"; then
    echo "✅ Captain 2 login SUCCESSFUL"
    echo "Response: $response2" | head -c 200
    echo "..."
else
    echo "❌ Captain 2 login FAILED"
    echo "Response: $response2"
fi

echo ""
echo "=========================="
echo "Test complete!"
