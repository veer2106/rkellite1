# Dual Environment: Prod + Dev on Same EC2

Deploy production and development environments side-by-side on the **same AWS EC2 instance** with the **same static IP**, using a shared Nginx for routing.

## Architecture

| Environment | Subdomain | API Port | Frontend | Database |
|-------------|-----------|----------|----------|----------|
| **Prod** | app.domain.com, api.domain.com | 5001 | Served by API (5001) | restaurant_db |
| **Dev** | dev.domain.com | 5005 | Dev server (3002) | restaurant_db_dev |

- **Same static IP** – both use the same Elastic IP
- **Separate containers** – different Docker Compose projects
- **Separate databases** – prod and dev have isolated data
- **Single Nginx** – host nginx routes by subdomain

## Prerequisites

- Prod already deployed (or will be deployed by the script)
- Domain with DNS access
- Ports 80, 443 open in Security Group

## Quick Deploy

```bash
export EC2_IP=13.233.0.43
export DOMAIN=cafe-delicacy-restaurant.com
export SSH_KEY=./cafe.pem

bash deploy-dual-env.sh
```

## DNS Setup

Add an A record for the dev subdomain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | dev | YOUR_EC2_STATIC_IP | 300 |

Example: `dev.cafe-delicacy-restaurant.com` → `13.233.0.43`

## SSL (HTTPS)

After DNS propagates, add the dev subdomain to your certificate:

```bash
ssh -i cafe.pem ec2-user@$EC2_IP

sudo certbot certonly --nginx -d dev.cafe-delicacy-restaurant.com
# Or expand existing cert:
sudo certbot certonly --nginx -d cafe-delicacy-restaurant.com -d app.cafe-delicacy-restaurant.com -d dev.cafe-delicacy-restaurant.com --expand
```

Then update `/etc/nginx/conf.d/rkellite-dual.conf` with HTTPS server blocks (see `nginx/conf.d/dual-env-prod-dev.conf.example`).

## Manual Steps

### 1. Configure `.env.dev`

```bash
cp .env.dev.example .env.dev
# Edit .env.dev: replace YOUR_DOMAIN with your domain
```

### 2. Start Prod (without nginx container)

```bash
docker compose stop nginx  # if using docker nginx
docker compose up -d db redis api
```

### 3. Start Dev

```bash
docker compose -p rkellite-dev -f docker-compose.dev.yml --env-file .env.dev up -d
```

### 4. Configure Nginx

Copy and customize the example config:

```bash
cp nginx/conf.d/dual-env-prod-dev.conf.example /etc/nginx/conf.d/rkellite-dual.conf
# Replace YOUR_DOMAIN with your domain
sudo nginx -t && sudo systemctl reload nginx
```

## Nginx Config Reference

- **Prod**: `app.domain.com`, `api.domain.com` → `http://127.0.0.1:5001` (API serves both)
- **Dev**: `dev.domain.com` → `/api/` to `5005`, `/` to `3002`

See `nginx/conf.d/dual-env-prod-dev.conf.example` for the full config.

## Useful Commands

```bash
# Prod logs
docker compose logs -f

# Dev logs  
docker compose -p rkellite-dev -f docker-compose.dev.yml logs -f

# Restart dev only
docker compose -p rkellite-dev -f docker-compose.dev.yml restart

# Stop dev (prod keeps running)
docker compose -p rkellite-dev -f docker-compose.dev.yml down
```

## Access URLs

- **Prod**: https://app.yourdomain.com
- **Dev**: https://dev.yourdomain.com  
- **API Health**: https://dev.yourdomain.com/api/health
