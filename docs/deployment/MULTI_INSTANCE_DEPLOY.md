# Multi-Instance Deployment on Single EC2

Run multiple independent app instances on the same EC2 instance. Each instance has its own:

- **PostgreSQL database** (different port, different DB name)
- **Redis** (different port)
- **API + Frontend** (different port)
- **Docker image** (can use different image tags per instance)

## Quick Start

### 1. Configure instance env files

```bash
# Copy and edit for each instance
cp envs/instance1.env.example .env.instance1
cp envs/instance2.env.example .env.instance2

# Edit .env.instance1, .env.instance2 - set:
# - DB_PASSWORD, JWT_SECRET
# - FRONTEND_URL, API_URL (your EC2 IP or domain)
# - Ensure ports are unique: 5001/5432/6379 for instance1, 5002/5433/6380 for instance2
```

### 2. Deploy

```bash
# From your machine (with EC2 key)
EC2_IP=13.233.0.43 SSH_KEY=./cafe.pem ./deploy-multi-instance.sh

# Or deploy only instance 1
EC2_IP=13.233.0.43 INSTANCES=1 ./deploy-multi-instance.sh
```

### 3. Access

- Instance 1: `http://YOUR_EC2_IP:5001`
- Instance 2: `http://YOUR_EC2_IP:5002`
- Instance 3: `http://YOUR_EC2_IP:5003`

## Port Allocation

| Instance | API Port | PostgreSQL (host) | Redis (host) |
|----------|----------|-------------------|--------------|
| 1        | 5001     | 5432              | 6379         |
| 2        | 5002     | 5433              | 6380         |
| 3        | 5003     | 5434              | 6381         |

## Using Different Images Per Instance

To run different image versions (e.g. `restaurant-cafe:v1` and `restaurant-cafe:v2`):

1. Build images locally and push to a registry, or build on EC2.
2. In `.env.instance2` add:
   ```
   DOCKER_IMAGE=restaurant-cafe:v2
   ```
3. Update `docker-compose.multi-instance.yml` to support `DOCKER_IMAGE` - use `image: ${DOCKER_IMAGE:-restaurant-cafe:latest}` and remove/skip build for that service when image is provided.

The current compose always builds. For pre-built images, you can:

```bash
# Build image for instance 2 with tag
docker build -t restaurant-cafe:instance2 --build-arg REACT_APP_API_URL=/api .

# In .env.instance2 add (and we need to update compose to use image when set)
DOCKER_IMAGE=restaurant-cafe:instance2
```

## EC2 Security Group

Ensure these ports are open in your EC2 security group:

- 5001, 5002, 5003 (API/frontend)
- 22 (SSH)
- 80, 443 (if using Nginx in front)

## Useful Commands

```bash
# Logs for instance 1
ssh -i cafe.pem ec2-user@EC2_IP 'cd restaurant-cafe && docker compose -f docker-compose.multi-instance.yml -p instance1 --env-file .env.instance1 logs -f'

# Stop instance 2
ssh -i cafe.pem ec2-user@EC2_IP 'cd restaurant-cafe && docker compose -f docker-compose.multi-instance.yml -p instance2 --env-file .env.instance2 down'

# Restart instance 1
ssh -i cafe.pem ec2-user@EC2_IP 'cd restaurant-cafe && docker compose -f docker-compose.multi-instance.yml -p instance1 --env-file .env.instance1 restart'
```

## Nginx Reverse Proxy (Optional)

To use subdomains instead of ports, configure Nginx on the EC2 host. See `nginx/conf.d/multi-instance.conf.example`.
