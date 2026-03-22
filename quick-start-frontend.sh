#!/bin/bash

# Quick Frontend Start Script (Development Mode)
# This runs the frontend without building - much faster!

echo "🚀 Starting Frontend in Development Mode..."
echo "============================================"

# Navigate to frontend directory
cd ~/restaurant-cafe/frontend

# Stop any existing frontend process
echo "🛑 Stopping existing frontend process..."
pm2 delete restaurant-frontend 2>/dev/null || echo "No existing process found"

# Set environment variable for production API
export REACT_APP_API_URL=http://localhost:5001

# Start frontend in development mode with PM2
echo "🎯 Starting frontend with PM2..."
pm2 start npm --name "restaurant-frontend" -- start

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Frontend started successfully!"
echo "=================================="
pm2 status

echo ""
echo "📊 Frontend is now running on:"
echo "   - Public: http://13.232.173.130:3000"
echo ""
echo "💡 To view logs: pm2 logs restaurant-frontend"
