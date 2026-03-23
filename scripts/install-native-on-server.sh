#!/bin/bash
# Run ON the EC2 server (after repo is cloned to ~/rkellite1 or similar)
# Usage: cd ~/rkellite1 && bash scripts/install-native-on-server.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "📦 RK Ellite — native install from $ROOT"

if ! command -v node &>/dev/null; then
  echo "Install Node.js 20 first: https://github.com/nodesource/distributions"
  exit 1
fi

echo "→ npm install (root)"
npm install
echo "→ npm install (frontend)"
cd frontend && npm install && cd ..

if [ ! -f .env ]; then
  echo "→ Creating .env from .env.host.example — EDIT .env before production!"
  cp .env.host.example .env
fi

echo "→ build:prod (React + copy to public/)"
npm run build:prod

echo "→ PM2"
if ! command -v pm2 &>/dev/null; then
  echo "Install PM2: sudo npm install -g pm2"
  exit 1
fi
pm2 delete rkellite-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✅ App should respond at http://127.0.0.1:5001/api/health"
echo "   Configure Nginx (see docs/deployment/DEPLOY_HOST_NO_DOCKER.md)"
curl -s http://127.0.0.1:5001/api/health || true
echo ""
