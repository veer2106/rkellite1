# Deploy Without Build

Use this when the **API image already exists** on the EC2 host (from a previous build, `docker load`, or a registry).

## Quick command

```bash
export EC2_IP=13.232.134.214
export SSH_KEY=./rkellite.pem
export SKIP_BUILD=1
bash deploy-new-instance.sh
```

Or:

```bash
bash deploy-no-build.sh
```

## Prerequisites

1. **Image name** must match what Compose expects (project `restaurant-cafe` + service `api`):

   - Usually: `restaurant-cafe_api` (underscore) — check with `docker images` on the server after a normal build.

2. **Load image on EC2** (from your laptop):

   ```bash
   # Local: build and save
   docker compose build api
   docker save restaurant-cafe_api:latest -o api.tar
   scp -i rkellite.pem api.tar ec2-user@13.232.134.214:~

   # On EC2
   docker load -i ~/api.tar
   ```

3. **Or pull from a registry**:

   ```bash
   export SKIP_BUILD=1
   export API_IMAGE=yourdockerhub/rkellite:latest
   bash deploy-new-instance.sh
   ```

   You must tag the image on the server as `restaurant-cafe_api:latest` after pull, **or** adjust `docker-compose.yml` to use `image: ${API_IMAGE}` for the `api` service.

## What runs

- Same as full deploy: clone/pull repo, `.env`, then `docker compose up -d --no-build db redis api nginx`
- **No** `docker compose build` / `docker build`
