#!/bin/bash
# Deploy to EC2 without running docker build (uses existing API image on the server).
#
# Prerequisites on EC2:
#   - Image already present: e.g. docker load -i api.tar
#   - Or set API_IMAGE to pull from a registry first
#
# Usage:
#   export EC2_IP=13.232.134.214
#   export SSH_KEY=./rkellite.pem
#   export SKIP_BUILD=1
#   # optional: export API_IMAGE=youruser/rkellite:latest
#   bash deploy-no-build.sh

export SKIP_BUILD="${SKIP_BUILD:-1}"
exec "$(dirname "$0")/deploy-new-instance.sh"
