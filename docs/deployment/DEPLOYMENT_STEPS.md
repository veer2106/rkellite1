# 🚀 Quick Deployment Steps - Restaurant Cafe

**Last Updated:** March 8, 2026  
**Status:** Ready for Deployment  
**Target:** Production on AWS

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [AWS Infrastructure Setup](#aws-infrastructure-setup)
4. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
5. [Database & Application Deployment](#database--application-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🏠 Local Development Setup

### Step 1: Prerequisites
```bash
# Check versions
node --version          # Should be v18+
npm --version          # Should be v9+
postgres --version     # Should be v13+
docker --version       # For containerization

# Install if missing
# macOS with Homebrew:
brew install node postgresql redis
```

### Step 2: Clone & Install
```bash
cd /Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe

# Install all dependencies
npm run install-all

# Or manually:
npm install                  # Root
cd backend && npm install    # Backend
cd ../frontend && npm install # Frontend
```

### Step 3: Environment Setup
```bash
# Create .env file in project root
cat > .env << 'EOF'
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=restaurant_db

# Server
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS (for later deployment)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=app_password
EOF
```

### Step 4: Database Setup
```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database and seed
cd backend
node seedDatabase.js

# Verify
psql -d restaurant_db -c "SELECT COUNT(*) FROM \"Users\";"
```

### Step 5: Run Locally
```bash
# Terminal 1 - Backend
cd backend
npm run server
# Expected: "✓ Server running on http://localhost:5001"

# Terminal 2 - Frontend
cd frontend
npm start
# Expected: Opens http://localhost:3000
```

### Step 6: Verify Application
```bash
# Backend health check
curl http://localhost:5001/api/health

# Frontend loads
open http://localhost:3000

# Login with:
# Email: admin@restaurant.com
# Password: admin123
```

---

## ✅ Pre-Deployment Checklist

### Code Quality ✓
- [ ] All tests passing
```bash
npm run test
npm run test:integration
```

- [ ] No console errors or warnings
```bash
npm run lint
```

- [ ] Security scan completed
```bash
npm audit
npm audit fix
```

### Database ✓
- [ ] Database migrations tested
```bash
npm run migrate
```

- [ ] Database backup created
```bash
pg_dump -U postgres restaurant_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Documentation ✓
- [ ] Deployment guide reviewed
- [ ] Runbook procedures understood
- [ ] Architecture diagram reviewed

### Team ✓
- [ ] On-call engineer identified
- [ ] Stakeholders notified
- [ ] Rollback plan discussed

---

## ☁️ AWS Infrastructure Setup

### Step 1: Setup AWS Account
```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure
# Enter:
# AWS Access Key ID: [your_access_key]
# AWS Secret Access Key: [your_secret_key]
# Default region: us-east-1
# Default output: json

# Verify
aws sts get-caller-identity
```

### Step 2: Create S3 Bucket for Terraform State
```bash
# Create bucket
aws s3 mb s3://restaurant-cafe-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket restaurant-cafe-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name restaurant-cafe-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### Step 3: Setup Infrastructure with Terraform
```bash
# Install Terraform
brew install terraform

# Initialize Terraform
cd terraform
terraform init \
  -backend-config="bucket=restaurant-cafe-terraform-state" \
  -backend-config="key=prod/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=restaurant-cafe-terraform-lock"

# Plan infrastructure
terraform plan -var-file="prod.tfvars" -out=tfplan

# Apply infrastructure (this takes 15-20 minutes)
terraform apply tfplan

# Get outputs (save these!)
terraform output -json > outputs.json
```

### Step 4: Retrieve Infrastructure Details
```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier restaurant-cafe-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Get ECS cluster name
aws ecs list-clusters --query 'clusterArns[0]' --output text

# Get ALB DNS
aws elbv2 describe-load-balancers \
  --names restaurant-cafe-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

---

## 🔄 CI/CD Pipeline Setup

### Step 1: Setup GitHub Repository Secrets
```bash
# Navigate to GitHub repo settings → Secrets

# Add these secrets:
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
DOCKER_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
DB_PASSWORD=your_secure_password
JWT_SECRET=your_secret_key
```

### Step 2: Create ECR Repository
```bash
# Create repository
aws ecr create-repository \
  --repository-name restaurant-cafe \
  --region us-east-1

# Get login token and login to Docker
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com
```

### Step 3: Push GitHub Actions Workflow
```bash
# The workflow file should be at:
# .github/workflows/main.yml
# (Already created in previous setup)

# Verify by checking
git log --oneline -- .github/workflows/main.yml

# Push to GitHub
git add .github/workflows/main.yml
git commit -m "Add CI/CD pipeline workflow"
git push origin Setup-branch
```

### Step 4: Trigger First Deployment
```bash
# Push a commit to trigger pipeline
git add .
git commit -m "Trigger CI/CD pipeline"
git push origin Setup-branch

# Monitor in GitHub Actions
open https://github.com/veereshpaidcoders/restaurant-cafe/actions
```

---

## 🗄️ Database & Application Deployment

### Step 1: Prepare Database
```bash
# Create RDS database instance (if not done via Terraform)
aws rds create-db-instance \
  --db-instance-identifier restaurant-cafe-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --publicly-accessible false \
  --multi-az \
  --backup-retention-period 30

# Wait for database to be available (5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier restaurant-cafe-db

# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier restaurant-cafe-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database ready at: $DB_ENDPOINT"
```

### Step 2: Run Database Migrations
```bash
# Connect to RDS database
psql -h $DB_ENDPOINT -U postgres -d restaurant_db

# Or run seed script via ECS task
aws ecs run-task \
  --cluster restaurant-cafe-cluster \
  --task-definition restaurant-cafe-seed:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

### Step 3: Deploy Application to ECS
```bash
# Create ECS task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster restaurant-cafe-cluster \
  --service-name restaurant-cafe-api \
  --task-definition restaurant-cafe:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=5001

# Wait for service to stabilize
aws ecs wait services-stable \
  --cluster restaurant-cafe-cluster \
  --services restaurant-cafe-api
```

### Step 4: Deploy Frontend to S3 & CloudFront
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://restaurant-cafe-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC \
  --paths "/*"
```

---

## ✔️ Post-Deployment Verification

### Step 1: Health Checks
```bash
# Check API health
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names restaurant-cafe-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

curl http://$ALB_DNS/api/health
# Expected response: {"status":"ok","timestamp":"..."}

# Check database connectivity
curl http://$ALB_DNS/api/users
# Should return user list

# Check frontend
open http://app.restaurant-cafe.com
# Should load login page
```

### Step 2: Functional Tests
```bash
# Login test
curl -X POST http://$ALB_DNS/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'

# Create order test
curl -X POST http://$ALB_DNS/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":1,"quantity":2}]}'

# Check inventory
curl http://$ALB_DNS/api/inventory
```

### Step 3: Monitoring Dashboard
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=restaurant-cafe-api \
  --start-time 2026-03-08T00:00:00Z \
  --end-time 2026-03-08T01:00:00Z \
  --period 300 \
  --statistics Average,Maximum

# View Grafana dashboard
open http://grafana.restaurant-cafe.com
# Login: admin / admin

# View CloudWatch dashboard
open https://console.aws.amazon.com/cloudwatch
```

### Step 4: Error Checking
```bash
# Check application logs
aws logs tail /aws/ecs/restaurant-cafe-api --follow

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names restaurant-cafe-cpu-high \
  --query 'MetricAlarms[0].StateValue'

# Check ECS service events
aws ecs describe-services \
  --cluster restaurant-cafe-cluster \
  --services restaurant-cafe-api \
  --query 'services[0].events[0:5]'
```

---

## 📊 Monitoring & Maintenance

### Step 1: Setup CloudWatch Alarms
```bash
# CPU High
aws cloudwatch put-metric-alarm \
  --alarm-name restaurant-cafe-cpu-high \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts

# Error Rate High
aws cloudwatch put-metric-alarm \
  --alarm-name restaurant-cafe-error-rate-high \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name ErrorRate \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Step 2: Setup Automated Backups
```bash
# Database backups (already configured in RDS)
# Check backup window
aws rds describe-db-instances \
  --db-instance-identifier restaurant-cafe-db \
  --query 'DBInstances[0].PreferredBackupWindow'

# Configure backup retention
aws rds modify-db-instance \
  --db-instance-identifier restaurant-cafe-db \
  --backup-retention-period 30 \
  --apply-immediately
```

### Step 3: Setup Log Rotation
```bash
# Configure CloudWatch Logs retention
aws logs put-retention-policy \
  --log-group-name /aws/ecs/restaurant-cafe-api \
  --retention-in-days 30
```

### Step 4: Regular Maintenance Tasks
```bash
# Weekly: Check logs for errors
aws logs tail /aws/ecs/restaurant-cafe-api --since 7d

# Monthly: Review costs
aws ce get-cost-and-usage \
  --time-period Start=2026-03-01,End=2026-03-08 \
  --granularity MONTHLY \
  --metrics "UnblendedCost"

# Quarterly: Update dependencies
npm update --all

# Annually: Security audit
npm audit
terraform plan -var-file="prod.tfvars" | grep -i "replace"
```

---

## 🔧 Troubleshooting

### Issue: Database Connection Failed
```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-xxx \
  --query 'SecurityGroups[0].IpPermissions'

# Verify RDS endpoint
aws rds describe-db-instances \
  --query 'DBInstances[0].Endpoint'

# Test connection
psql -h $DB_ENDPOINT -U postgres -d restaurant_db -c "SELECT 1"
```

### Issue: ECS Task Failing
```bash
# Check task logs
aws ecs describe-tasks \
  --cluster restaurant-cafe-cluster \
  --tasks arn:aws:ecs:... \
  --query 'tasks[0].containers[0].lastStatus'

# View container logs
aws logs tail /aws/ecs/restaurant-cafe-api --follow

# Restart service
aws ecs update-service \
  --cluster restaurant-cafe-cluster \
  --service restaurant-cafe-api \
  --force-new-deployment
```

### Issue: High CPU/Memory Usage
```bash
# Scale up
aws ecs update-service \
  --cluster restaurant-cafe-cluster \
  --service restaurant-cafe-api \
  --desired-count 5

# Check for memory leaks
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=restaurant-cafe-api \
  --start-time 2026-03-08T00:00:00Z \
  --end-time 2026-03-08T24:00:00Z \
  --period 300 \
  --statistics Average,Maximum
```

### Issue: Deployment Failures
```bash
# Rollback to previous version
aws ecs update-service \
  --cluster restaurant-cafe-cluster \
  --service restaurant-cafe-api \
  --task-definition restaurant-cafe:$(($CURRENT_VERSION - 1))

# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name restaurant-cafe-stack \
  --query 'StackEvents[0:5]'

# Review GitHub Actions logs
open https://github.com/veereshpaidcoders/restaurant-cafe/actions
```

---

## 📞 Support & Next Steps

### Quick Links
- 📚 **Full Guide:** [ENTERPRISE_DEPLOYMENT_GUIDE.md](ENTERPRISE_DEPLOYMENT_GUIDE.md)
- 🔄 **CI/CD Pipeline:** [CICD_PIPELINE_GUIDE.md](CICD_PIPELINE_GUIDE.md)
- 🏗️ **Architecture:** [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- 📋 **Runbook:** [PRODUCTION_DEPLOYMENT_RUNBOOK.md](PRODUCTION_DEPLOYMENT_RUNBOOK.md)
- 🗂️ **Documentation Index:** [ENTERPRISE_DOCUMENTATION_INDEX.md](ENTERPRISE_DOCUMENTATION_INDEX.md)

### Recommended Order
1. ✅ Complete **Local Development Setup** (Steps 1-6)
2. ✅ Run **Pre-Deployment Checklist** (Step 7)
3. ✅ Setup **AWS Infrastructure** (Step 8-11)
4. ✅ Configure **CI/CD Pipeline** (Step 12-15)
5. ✅ Deploy **Database & Application** (Step 16-19)
6. ✅ Verify **Post-Deployment** (Step 20-23)
7. ✅ Setup **Monitoring & Maintenance** (Step 24-27)

### Estimated Timeline
- Local setup: **30 minutes**
- AWS infrastructure: **20-30 minutes**
- CI/CD pipeline: **15 minutes**
- Database deployment: **10 minutes**
- Application deployment: **10 minutes**
- Verification: **15 minutes**
- **Total: ~2 hours**

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** March 8, 2026  
**Version:** 1.0.0
