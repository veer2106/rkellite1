# Dev Environment Deployment Guide

## Prerequisites
- New AWS EC2 instance for dev (same region ap-south-1 recommended)
- Security Group open ports 80,443,3002,5005,5433,6380 temporarily for dev
- cafe.pem SSH key

## Quick Deploy
```bash
export DEV_EC2_IP=your.new.dev.ec2.public.ip
bash deploy-docker-ec2-dev.sh
```

## Manual Steps
1. SSH to dev EC2: `ssh -i cafe.pem ec2-user@$DEV_EC2_IP`
2. Run docker-compose -f docker-compose.dev.yml up -d

## Access
- Frontend: http://$DEV_EC2_IP:3002
- Backend: http://$DEV_EC2_IP:5005/api/health
- DB: localhost:5433 / restaurant_db_dev / dev_password_123

## Switch Prod/Dev on same EC2 (if desired)
docker-compose -f docker-compose.yml up -d  # prod
docker-compose -f docker-compose.dev.yml up -d  # dev (stop prod first)

## Update Config
cp .env.dev.example .env
# Edit CLIENT_URL, API_URL with dev IP/domain
docker-compose -f docker-compose.dev.yml restart

**Dev vs Prod:**
| Env | Backend Port | Frontend Port | DB Name | IP |
|-----|--------------|---------------|---------|----|
| Prod | 5001 | 3000 | restaurant_db | 13.233.0.43 |
| Dev | 5005 | 3002 | restaurant_db_dev | $DEV_EC2_IP |
