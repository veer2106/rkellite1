#!/bin/bash

# Frontend Production Deployment Script
# This script builds and deploys the React frontend on EC2

set -e  # Exit on error

echo "🚀 Starting Frontend Deployment..."
echo "=================================="

# Navigate to frontend directory
cd ~/restaurant-cafe/frontend

# Build the React app
echo ""
echo "📦 Building React application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Install serve globally if not already installed
if ! command -v serve &> /dev/null; then
    echo "📥 Installing 'serve' package globally..."
    npm install -g serve
fi

# Stop any existing frontend process
echo ""
echo "🛑 Stopping existing frontend process (if any)..."
pm2 delete restaurant-frontend 2>/dev/null || echo "No existing process found"

# Start the frontend with PM2
echo ""
echo "🎯 Starting frontend with PM2..."
pm2 serve build 3000 --name restaurant-frontend --spa

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Frontend deployment completed!"
echo "=================================="
pm2 status

echo ""
echo "📊 Frontend is now running on:"
echo "   - Local: http://localhost:3000"
echo "   - Public: http://13.232.173.130:3000"
echo ""
echo "💡 Next steps:"
echo "   1. Install Nginx for reverse proxy"
echo "   2. Configure SSL with Let's Encrypt"
echo "   3. Access via https://app.cafe-delicacy-restaurant.com"
