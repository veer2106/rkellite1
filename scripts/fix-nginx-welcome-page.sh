#!/bin/bash
# Run ON the EC2 server (SSH in first). Fixes "Welcome to nginx!" / default Fedora page.
#
# Usage:
#   cd ~/rkellite1 && git pull && bash scripts/fix-nginx-welcome-page.sh
#
set -e
ROOT="${ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"

if [ ! -f nginx/nginx.host-no-docker.conf.example ]; then
  echo "Run this from the rkellite1 repo root (nginx/nginx.host-no-docker.conf.example missing)."
  exit 1
fi

echo "→ Installing rkellite reverse proxy to /etc/nginx/conf.d/rkellite.conf"
sudo cp nginx/nginx.host-no-docker.conf.example /etc/nginx/conf.d/rkellite.conf
sudo chmod 644 /etc/nginx/conf.d/rkellite.conf

echo "→ Removing conf.d/default.conf if present (distro default site)"
sudo rm -f /etc/nginx/conf.d/default.conf

echo "→ Replacing /etc/nginx/nginx.conf with minimal main (no stock server{} block)"
sudo cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.$(date +%s)"
if [ -f nginx/nginx.main.amazon-linux-2023.conf ]; then
  sudo cp nginx/nginx.main.amazon-linux-2023.conf /etc/nginx/nginx.conf
else
  echo "   (fallback: comment embedded server in existing nginx.conf)"
  if sudo grep -q '^    server {$' /etc/nginx/nginx.conf 2>/dev/null; then
    sudo sed -i '/^    server {$/,/^    }$/s/^/#RKELLITE_DISABLED /' /etc/nginx/nginx.conf
  fi
fi

echo "→ Testing and reloading nginx"
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✅ Server-side nginx is fixed."
echo ""
echo "Verify on the SERVER:"
echo "  curl -sI http://127.0.0.1/ | grep -i x-rkellite"
echo "  curl -s http://127.0.0.1/ | head -c 120"
echo ""
curl -sI http://127.0.0.1/ | grep -i x-rkellite || true
curl -s http://127.0.0.1/ | head -c 120 || true
echo ""
echo ""
echo "If your BROWSER still shows 'Welcome to nginx':"
echo "  • Open EXACTLY: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo YOUR_PUBLIC_IP)/"
echo "  • Do NOT use https:// unless SSL is configured (use http://)"
echo "  • If you use a DOMAIN: run  nslookup yourdomain.com  — it must point to THIS instance's public IP"
echo "  • Try Incognito / another device (cache)"
echo ""
