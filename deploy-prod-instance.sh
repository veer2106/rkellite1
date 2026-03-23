#!/bin/bash
# Deploy to existing production EC2 (Elastic IP 13.233.0.43)
# Uses cafe.pem by default — override if needed:
#   export SSH_KEY=/path/to/key.pem
#
# Usage:
#   chmod 400 cafe.pem
#   bash deploy-prod-instance.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export EC2_IP="${EC2_IP:-13.233.0.43}"
export SSH_KEY="${SSH_KEY:-$SCRIPT_DIR/cafe.pem}"

echo "Using EC2_IP=$EC2_IP  SSH_KEY=$SSH_KEY"
echo ""

exec bash "$SCRIPT_DIR/deploy-new-instance.sh"
