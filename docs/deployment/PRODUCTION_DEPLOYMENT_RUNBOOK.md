# Production Deployment Runbook

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Status:** Production Ready  
**Audience:** DevOps Engineers, Release Managers

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedure](#deployment-procedure)
3. [Domain Configuration](#domain-configuration)
4. [SSL/TLS Setup](#ssltls-setup)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Emergency Procedures](#emergency-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Pre-Deployment Checklist

### Code & Testing
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review approved (2+ reviewers)
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Breaking changes documented
- [ ] Release notes prepared

### Infrastructure
- [ ] Target environment verified
- [ ] Database backups completed
- [ ] Secrets rotated (if needed)
- [ ] DNS records validated
- [ ] SSL certificates valid
- [ ] Load balancer configured
- [ ] Auto-scaling policies verified

### Team & Communication
- [ ] On-call engineer assigned
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan reviewed
- [ ] Team communication channels ready

---

## Deployment Procedure

### Phase 1: Pre-Deployment (T-30 minutes)

```bash
#!/bin/bash
# pre-deployment.sh

set -euo pipefail

echo "=== RESTAURANT CAFE - PRE-DEPLOYMENT PHASE ==="
echo "Start Time: $(date)"

# 1. Verify environment variables
echo "[1/7] Verifying environment..."
required_vars=(
  "AWS_REGION"
  "AWS_ACCOUNT_ID"
  "DOCKER_REGISTRY"
  "ENVIRONMENT"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Required variable $var not set"
    exit 1
  fi
done

# 2. Create database backup
echo "[2/7] Creating database backup..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --format=custom \
  > "/tmp/$BACKUP_NAME" 2>&1

# Upload to S3
aws s3 cp "/tmp/$BACKUP_NAME" \
  "s3://restaurant-cafe-backups/pre-deployment/$BACKUP_NAME" \
  --sse AES256

echo "✓ Database backup created: $BACKUP_NAME"

# 3. Verify current deployment
echo "[3/7] Verifying current deployment..."
CURRENT_TASK=$(aws ecs describe-services \
  --cluster restaurant-cafe-prod \
  --services restaurant-cafe-api \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Current task definition: $CURRENT_TASK"

# 4. Health check current deployment
echo "[4/7] Running health checks..."
for i in {1..3}; do
  if curl -f https://api.restaurant-cafe.com/api/health > /dev/null 2>&1; then
    echo "✓ Health check passed (attempt $i)"
    break
  fi
  if [ $i -eq 3 ]; then
    echo "ERROR: Health check failed"
    exit 1
  fi
  sleep 5
done

# 5. Lock deployment (prevent concurrent deployments)
echo "[5/7] Acquiring deployment lock..."
aws dynamodb put-item \
  --table-name deployment-locks \
  --item '{"deployment_id": {"S": "'$(uuidgen)'"},"timestamp": {"N": "'$(date +%s)'"},"status": {"S": "locked"}}'

# 6. Notify monitoring
echo "[6/7] Notifying monitoring systems..."
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:deployment-notifications \
  --subject "Restaurant Cafe - Deployment Starting" \
  --message "Production deployment initiated at $(date)"

# 7. Archive logs
echo "[7/7] Archiving current logs..."
tar -czf "logs_$(date +%Y%m%d_%H%M%S).tar.gz" \
  /var/log/restaurant-cafe/ 2>/dev/null || true

aws s3 cp logs_*.tar.gz \
  s3://restaurant-cafe-backups/logs/ \
  --sse AES256

echo "=== PRE-DEPLOYMENT PHASE COMPLETE ==="
echo "Ready to proceed with deployment"
```

### Phase 2: Deployment (T-0 to T+15 minutes)

```bash
#!/bin/bash
# deploy-production.sh

set -euo pipefail

echo "=== RESTAURANT CAFE - PRODUCTION DEPLOYMENT ==="
echo "Start Time: $(date)"

ENVIRONMENT="production"
CLUSTER="restaurant-cafe-prod"
SERVICE="restaurant-cafe-api"
REGION="us-east-1"
IMAGE_TAG="${1:-latest}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${YELLOW}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Get new image
log_info "Step 1: Pulling new Docker image..."
NEW_IMAGE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/restaurant-cafe:${IMAGE_TAG}"

# Verify image exists
aws ecr describe-images \
  --repository-name restaurant-cafe \
  --image-ids imageTag=$IMAGE_TAG \
  --region $REGION > /dev/null || {
  log_error "Docker image not found: $NEW_IMAGE"
  exit 1
}
log_success "Docker image verified: $NEW_IMAGE"

# Step 2: Get current task definition
log_info "Step 2: Retrieving current task definition..."
CURRENT_TASK=$(aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION \
  --query 'services[0].taskDefinition' \
  --output text)

TASK_DEF_ARN=$(aws ecs describe-task-definition \
  --task-definition $CURRENT_TASK \
  --region $REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

log_success "Current task definition: $TASK_DEF_ARN"

# Step 3: Create new task definition
log_info "Step 3: Creating new task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $CURRENT_TASK \
  --region $REGION)

NEW_TASK=$(echo $TASK_DEF | jq \
  ".taskDefinition | 
   del(.taskDefinitionArn) | 
   del(.revision) | 
   del(.status) | 
   del(.requiresAttributes) | 
   del(.compatibilities) | 
   del(.registeredAt) | 
   del(.registeredBy) | 
   .containerDefinitions[0].image = \"$NEW_IMAGE\"")

NEW_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json "$(echo $NEW_TASK)" \
  --region $REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

log_success "New task definition registered: $NEW_TASK_ARN"

# Step 4: Blue-Green Deployment
log_info "Step 4: Updating ECS service (Blue-Green deployment)..."

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $NEW_TASK_ARN \
  --region $REGION \
  --force-new-deployment > /dev/null

log_success "Service update initiated"

# Step 5: Wait for deployment
log_info "Step 5: Waiting for deployment to stabilize..."
WAIT_ATTEMPTS=0
MAX_WAIT_ATTEMPTS=30

while [ $WAIT_ATTEMPTS -lt $MAX_WAIT_ATTEMPTS ]; do
  RUNNING=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region $REGION \
    --query 'services[0].runningCount' \
    --output text)
  
  DESIRED=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region $REGION \
    --query 'services[0].desiredCount' \
    --output text)
  
  log_info "Progress: $RUNNING/$DESIRED tasks running"
  
  if [ "$RUNNING" -eq "$DESIRED" ]; then
    log_success "All tasks running"
    break
  fi
  
  WAIT_ATTEMPTS=$((WAIT_ATTEMPTS + 1))
  sleep 10
done

if [ $WAIT_ATTEMPTS -eq $MAX_WAIT_ATTEMPTS ]; then
  log_error "Deployment timeout - not all tasks started"
  exit 1
fi

# Step 6: Health checks
log_info "Step 6: Running health checks..."
HEALTH_CHECKS=0
MAX_HEALTH_CHECKS=10

while [ $HEALTH_CHECKS -lt $MAX_HEALTH_CHECKS ]; do
  if curl -f https://api.restaurant-cafe.com/api/health > /dev/null 2>&1; then
    log_success "Application is healthy"
    break
  fi
  
  HEALTH_CHECKS=$((HEALTH_CHECKS + 1))
  log_info "Health check attempt $HEALTH_CHECKS/$MAX_HEALTH_CHECKS"
  sleep 5
done

if [ $HEALTH_CHECKS -eq $MAX_HEALTH_CHECKS ]; then
  log_error "Health checks failed - initiating rollback"
  exit 1
fi

# Step 7: Verify database connectivity
log_info "Step 7: Verifying database connectivity..."
if ! curl -f https://api.restaurant-cafe.com/api/health/db > /dev/null 2>&1; then
  log_error "Database connectivity check failed"
  exit 1
fi
log_success "Database connectivity verified"

echo ""
log_success "=== PRODUCTION DEPLOYMENT SUCCESSFUL ==="
echo "Deployment completed at: $(date)"
echo "New image: $NEW_IMAGE"
echo "New task definition: $NEW_TASK_ARN"
```

### Phase 3: Monitoring & Validation (T+15 to T+60 minutes)

```bash
#!/bin/bash
# post-deployment-monitor.sh

set -euo pipefail

echo "=== POST-DEPLOYMENT MONITORING ==="
MONITOR_DURATION=3600  # 1 hour
MONITOR_INTERVAL=60    # Check every 1 minute
ELAPSED=0

# Thresholds
ERROR_RATE_THRESHOLD=5          # 5%
RESPONSE_TIME_THRESHOLD=5000    # 5 seconds
CPU_THRESHOLD=80                # 80%
MEMORY_THRESHOLD=85             # 85%

while [ $ELAPSED -lt $MONITOR_DURATION ]; do
  echo "[$(date)] Monitoring... ($((ELAPSED/60)) minutes elapsed)"
  
  # Check error rate
  ERROR_RATE=$(aws cloudwatch get-metric-statistics \
    --metric-name HTTPServerError \
    --namespace AWS/ApplicationELB \
    --start-time $(date -u -d '1 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)
  
  # Check response time
  RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
    --metric-name TargetResponseTime \
    --namespace AWS/ApplicationELB \
    --start-time $(date -u -d '1 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)
  
  # Check if thresholds exceeded
  if (( $(echo "$ERROR_RATE > $ERROR_RATE_THRESHOLD" | bc -l) )); then
    echo "❌ ERROR: Error rate ($ERROR_RATE%) exceeds threshold ($ERROR_RATE_THRESHOLD%)"
    echo "Initiating automatic rollback..."
    ./rollback-deployment.sh
    exit 1
  fi
  
  if (( $(echo "$RESPONSE_TIME > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
    echo "⚠️  WARNING: Response time ($RESPONSE_TIME ms) exceeds threshold ($RESPONSE_TIME_THRESHOLD ms)"
  fi
  
  ELAPSED=$((ELAPSED + MONITOR_INTERVAL))
  sleep $MONITOR_INTERVAL
done

echo "✓ Post-deployment monitoring completed successfully"
```

---

## Domain Configuration

### Route 53 DNS Setup

```bash
#!/bin/bash
# setup-dns.sh

HOSTED_ZONE_ID="Z1234567890ABC"  # Your Route 53 hosted zone ID
DOMAIN="restaurant-cafe.com"
ALB_DNS="restaurant-cafe-alb-1234567890.us-east-1.elb.amazonaws.com"

# Create Route 53 records
cat > dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "$ALB_DNS",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$ALB_DNS"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d111111abcdef8.cloudfront.net"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "admin.$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d222222abcdef8.cloudfront.net"}]
      }
    }
  ]
}
EOF

# Apply changes
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns-records.json

echo "✓ DNS records created successfully"
```

---

## SSL/TLS Setup

### Using AWS Certificate Manager

```bash
#!/bin/bash
# setup-ssl.sh

DOMAIN="restaurant-cafe.com"
REGION="us-east-1"

# Request certificate
CERT_ARN=$(aws acm request-certificate \
  --domain-name $DOMAIN \
  --subject-alternative-names "*.$DOMAIN" \
  --validation-method DNS \
  --region $REGION \
  --tags Key=Name,Value=restaurant-cafe-ssl \
  --query 'CertificateArn' \
  --output text)

echo "✓ Certificate requested: $CERT_ARN"
echo "⚠️  Please validate the DNS records in your domain registrar"
echo "⚠️  Certificate will be issued after DNS validation"
```

### Using Let's Encrypt with Certbot

```bash
#!/bin/bash
# setup-letsencrypt.sh

DOMAIN="restaurant-cafe.com"
CERT_DIR="/etc/nginx/ssl"

# Install certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Request certificate
certbot certonly \
  --webroot \
  -w /usr/share/nginx/html \
  -d $DOMAIN \
  -d api.$DOMAIN \
  -d app.$DOMAIN \
  --agree-tos \
  --email admin@$DOMAIN \
  --non-interactive

# Setup auto-renewal
echo "0 0 1 * * /usr/bin/certbot renew --quiet" | crontab -

echo "✓ SSL certificates installed"
echo "Location: /etc/letsencrypt/live/$DOMAIN/"
```

---

## Post-Deployment Verification

### Comprehensive Verification Script

```bash
#!/bin/bash
# post-deployment-verify.sh

set -euo pipefail

echo "=== POST-DEPLOYMENT VERIFICATION ==="
FAILED=0

# Test 1: API Health Check
echo "Test 1: API Health Check..."
if curl -f https://api.restaurant-cafe.com/api/health > /dev/null 2>&1; then
  echo "✓ API health check passed"
else
  echo "✗ API health check failed"
  FAILED=$((FAILED + 1))
fi

# Test 2: Database Connection
echo "Test 2: Database Connection..."
if curl -f https://api.restaurant-cafe.com/api/health/db > /dev/null 2>&1; then
  echo "✓ Database connection successful"
else
  echo "✗ Database connection failed"
  FAILED=$((FAILED + 1))
fi

# Test 3: Frontend Access
echo "Test 3: Frontend Access..."
if curl -f https://app.restaurant-cafe.com/ > /dev/null 2>&1; then
  echo "✓ Frontend is accessible"
else
  echo "✗ Frontend is not accessible"
  FAILED=$((FAILED + 1))
fi

# Test 4: API Endpoint Response
echo "Test 4: API Endpoint Response..."
RESPONSE=$(curl -s -w "%{http_code}" https://api.restaurant-cafe.com/api/auth/me)
HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" -eq 401 ]; then  # Expected: unauthorized without token
  echo "✓ API endpoint responding correctly"
else
  echo "✗ API endpoint returned unexpected status: $HTTP_CODE"
  FAILED=$((FAILED + 1))
fi

# Test 5: SSL Certificate
echo "Test 5: SSL Certificate..."
CERT_EXPIRY=$(echo | openssl s_client -servername restaurant-cafe.com \
  -connect restaurant-cafe.com:443 2>/dev/null | \
  openssl x509 -noout -dates | grep notAfter)
echo "Certificate: $CERT_EXPIRY"

# Test 6: Response Time
echo "Test 6: Response Time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.restaurant-cafe.com/api/health)
echo "Response time: ${RESPONSE_TIME} seconds"
if (( $(echo "$RESPONSE_TIME < 2" | bc -l) )); then
  echo "✓ Response time acceptable"
else
  echo "⚠️  Response time may be slow"
fi

# Test 7: Database Availability
echo "Test 7: Database Availability..."
DB_RESPONSE=$(curl -s https://api.restaurant-cafe.com/api/health/db | jq -r '.database' 2>/dev/null || echo "unknown")
if [ "$DB_RESPONSE" = "connected" ]; then
  echo "✓ Database is available"
else
  echo "⚠️  Database status: $DB_RESPONSE"
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "✓ All verification tests passed"
  exit 0
else
  echo "✗ $FAILED test(s) failed"
  exit 1
fi
```

---

## Rollback Procedure

### Automated Rollback

```bash
#!/bin/bash
# rollback-deployment.sh

set -euo pipefail

echo "=== INITIATING ROLLBACK PROCEDURE ==="
echo "Time: $(date)"

CLUSTER="restaurant-cafe-prod"
SERVICE="restaurant-cafe-api"
REGION="us-east-1"

# Step 1: Get previous task definition
echo "[1/5] Retrieving previous task definition..."
CURRENT_TASK=$(aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION \
  --query 'services[0].taskDefinition' \
  --output text)

# Get list of task definitions for this service
PREVIOUS_TASK=$(aws ecs list-task-definitions \
  --family-prefix "${CURRENT_TASK%:*}" \
  --region $REGION \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

if [ -z "$PREVIOUS_TASK" ] || [ "$PREVIOUS_TASK" = "None" ]; then
  echo "ERROR: No previous task definition found"
  exit 1
fi

echo "Previous task definition: $PREVIOUS_TASK"

# Step 2: Notify stakeholders
echo "[2/5] Notifying stakeholders..."
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:deployment-notifications \
  --subject "Restaurant Cafe - ROLLBACK IN PROGRESS" \
  --message "Automatic rollback initiated at $(date). Reverting to: $PREVIOUS_TASK"

# Step 3: Switch back to previous version
echo "[3/5] Reverting to previous version..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $PREVIOUS_TASK \
  --region $REGION \
  --force-new-deployment

# Step 4: Wait for rollback
echo "[4/5] Waiting for rollback to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION

# Step 5: Verify
echo "[5/5] Verifying rollback..."
HEALTH_RETRIES=0
while [ $HEALTH_RETRIES -lt 5 ]; do
  if curl -f https://api.restaurant-cafe.com/api/health > /dev/null 2>&1; then
    echo "✓ Application is healthy - rollback successful"
    
    # Send success notification
    aws sns publish \
      --topic-arn arn:aws:sns:us-east-1:ACCOUNT:deployment-notifications \
      --subject "Restaurant Cafe - ROLLBACK SUCCESSFUL" \
      --message "Rollback completed successfully at $(date)"
    
    exit 0
  fi
  
  HEALTH_RETRIES=$((HEALTH_RETRIES + 1))
  sleep 10
done

echo "ERROR: Rollback verification failed"
exit 1
```

---

## Emergency Procedures

### Database Recovery

```bash
#!/bin/bash
# emergency-db-recovery.sh

BACKUP_DATE=${1:-latest}
BACKUP_BUCKET="s3://restaurant-cafe-backups"

echo "=== EMERGENCY DATABASE RECOVERY ==="
echo "Backup date: $BACKUP_DATE"

# List available backups
echo "Available backups:"
aws s3 ls $BACKUP_BUCKET/database/ | grep $BACKUP_DATE

# Restore from backup
BACKUP_FILE=$(aws s3 ls $BACKUP_BUCKET/database/ | \
  grep $BACKUP_DATE | \
  awk '{print $NF}' | \
  sort -r | \
  head -1)

echo "Restoring from: $BACKUP_FILE"

# Download backup
aws s3 cp "$BACKUP_BUCKET/database/$BACKUP_FILE" /tmp/$BACKUP_FILE

# Extract if compressed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip /tmp/$BACKUP_FILE
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
pg_restore -d restaurant_db /tmp/$BACKUP_FILE

echo "✓ Database recovery completed"
```

### Critical Bug Hotfix Deployment

```bash
#!/bin/bash
# hotfix-deploy.sh

HOTFIX_BRANCH=$1

if [ -z "$HOTFIX_BRANCH" ]; then
  echo "Usage: ./hotfix-deploy.sh <branch-name>"
  exit 1
fi

echo "=== EMERGENCY HOTFIX DEPLOYMENT ==="
echo "Branch: $HOTFIX_BRANCH"

# Checkout hotfix branch
git checkout $HOTFIX_BRANCH
git pull origin $HOTFIX_BRANCH

# Build and push immediately
docker build -t restaurant-cafe:hotfix-$(date +%s) .
docker push restaurant-cafe:hotfix-$(date +%s)

# Deploy directly to production (skip staging)
./deploy-production.sh hotfix-$(date +%s)

echo "✓ Hotfix deployed"
```

---

## Monitoring & Alerts

### CloudWatch Alarms Setup

```bash
#!/bin/bash
# setup-monitoring.sh

SNS_TOPIC="arn:aws:sns:us-east-1:ACCOUNT:deployment-alerts"

# High Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name restaurant-cafe-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name HTTPServerError \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC

# High Response Time Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name restaurant-cafe-high-response-time \
  --alarm-description "Alert when response time exceeds 5 seconds" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC

# Database Connection Pool Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name restaurant-cafe-db-connection-pool-high \
  --alarm-description "Alert when database connection pool exceeds 80%" \
  --metric-name DatabaseConnectionPoolUtilization \
  --namespace RestaurantCafe \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC

echo "✓ Monitoring alarms configured"
```

---

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Review Schedule:** Quarterly
