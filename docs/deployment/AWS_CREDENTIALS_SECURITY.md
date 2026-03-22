# 🔐 Secure AWS Credentials Setup Guide

**Status:** ✅ Critical Security Guide  
**Date:** March 8, 2026  
**Priority:** MUST READ FIRST

---

## ⚠️ CRITICAL SECURITY WARNING

### What You Did Wrong
You shared AWS credentials in a chat interface:
```
❌ EXPOSED: aws_access_key_id=AKIA******************
❌ EXPOSED: aws_secret_access_key=************************************
```

### Why This Is Dangerous
1. **Immediate Risk:** Anyone with these keys can:
   - Access your AWS account
   - Delete databases and data
   - Launch expensive compute resources
   - Incur huge billing charges
   - Access sensitive data

2. **Legal Risk:** Your account could be used for:
   - Cryptocurrency mining
   - Botnet command and control
   - Illegal content hosting

3. **Compliance Risk:** May violate regulations (GDPR, HIPAA, PCI-DSS)

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Deactivate Exposed Credentials (RIGHT NOW!)
```bash
# Go to AWS Console in your browser
# URL: https://console.aws.amazon.com

# 1. Click on your username (top-right)
# 2. Select "My Security Credentials"
# 3. Click "Access keys" section
# 4. Find the exposed key: AKIA******************
# 5. Click "Delete" or "Deactivate"
# 6. Confirm deletion

# THIS MUST BE DONE IN THE NEXT 5 MINUTES!
```

### Step 2: Check AWS Billing
```bash
# Check for suspicious activity
# 1. Go to AWS Console
# 2. Click "Billing Dashboard"
# 3. Look for unexpected charges
# 4. Review "Cost Explorer" for anomalies
# 5. Check "Billing Preferences" email for alerts

# If you see suspicious charges:
# - Contact AWS Support immediately
# - File a security report: https://aws.amazon.com/security/abuse/
```

### Step 3: Review Account Activity
```bash
# Check what was accessed
# 1. Go to AWS Console
# 2. Search for "CloudTrail"
# 3. Click "Event history"
# 4. Review events since you shared the keys
# 5. Look for any unauthorized access

# Check EC2 instances
# 1. Go to EC2 Dashboard
# 2. Check "Instances" for unknown resources
# 3. Check "Security Groups" for unexpected rules
# 4. Check "Volumes" for orphaned storage
```

---

## ✅ The Right Way to Handle AWS Credentials

### Principle 1: Never Share Credentials
```
❌ NEVER share credentials in:
  - Chat/Slack/Teams
  - Email
  - Code repositories
  - Screenshots
  - Documentation
  - Support tickets

✅ ALWAYS use:
  - AWS Secrets Manager
  - 1Password/LastPass (encrypted)
  - Environment variables (local only)
  - AWS IAM roles (preferred)
```

### Principle 2: Use Separate IAM Users
```
❌ DON'T use: Root AWS account
❌ DON'T use: Single admin user for everything
❌ DON'T use: Long-lived access keys

✅ DO use: 
  - Separate IAM user for each application
  - Separate IAM user for each developer
  - Different access levels (principle of least privilege)
  - Temporary security credentials when possible
```

### Principle 3: Rotate Credentials Regularly
```
❌ DON'T keep same credentials for 1+ year
✅ DO rotate every 90 days

Rotation schedule:
- Every 90 days: Create new access keys
- Delete old access keys after 30 days of testing
- Update all applications with new keys
- Update local AWS CLI config
```

---

## 🔑 Create Secure AWS Credentials

### Step 1: Create New IAM User
```bash
# In AWS Console:
# 1. Go to IAM → Users
# 2. Click "Create user"
# 3. Username: "restaurant-cafe-deploy" (or your choice)
# 4. Uncheck "Provide user access to AWS Management Console"
# 5. Click "Next"
# 6. Click "Attach policies directly"
# 7. Search and attach:
#    ✓ AmazonEC2FullAccess (for EC2)
#    ✓ AmazonRDSFullAccess (for database)
#    ✓ AmazonECS_FullAccess (for containers)
#    ✓ AmazonElastiCacheFullAccess (for cache)
#    ✓ ElasticLoadBalancingFullAccess (for load balancer)
# 8. Click "Create user"
```

### Step 2: Generate Access Keys
```bash
# In AWS Console:
# 1. Click the new user: "restaurant-cafe-deploy"
# 2. Go to "Security credentials" tab
# 3. Click "Create access key"
# 4. Select "Application running outside AWS"
# 5. Click "Next"
# 6. Click "Create access key"
# 7. IMPORTANT: Download the .csv file (click "Download .csv file")
# 8. Save it securely in your password manager
# 9. Click "Done"
```

### Step 3: Secure Storage
```bash
# Option 1: AWS Secrets Manager (RECOMMENDED)
aws secretsmanager create-secret \
  --name restaurant-cafe/aws-credentials \
  --description "AWS credentials for restaurant-cafe deployment" \
  --secret-string '{
    "access_key_id": "YOUR_NEW_AKIA_KEY",
    "secret_access_key": "YOUR_NEW_SECRET_KEY",
    "region": "us-east-1"
  }'

# Option 2: 1Password / LastPass
# 1. Open your password manager
# 2. Create new login for "AWS - restaurant-cafe-deploy"
# 3. Store:
#    - Username: AKIA... (access key)
#    - Password: (secret key)
#    - URL: https://aws.amazon.com
# 4. Encrypt and backup

# Option 3: Local Configuration (Less Secure)
# Only on your personal computer, never on shared machines
cat > ~/.aws/credentials << 'EOF'
[restaurant-cafe-deploy]
aws_access_key_id = YOUR_NEW_AKIA_KEY
aws_secret_access_key = YOUR_NEW_SECRET_KEY
region = us-east-1
EOF

chmod 600 ~/.aws/credentials
```

---

## 🔧 Setup AWS CLI Safely

### Step 1: Install AWS CLI
```bash
# On macOS
brew install awscli

# On Linux
sudo apt install awscli

# On Windows
# Download from: https://aws.amazon.com/cli/
```

### Step 2: Configure AWS CLI
```bash
# Method 1: Interactive (SAFER - credentials never echo'd)
aws configure --profile restaurant-cafe-deploy

# When prompted:
# AWS Access Key ID: [paste from CSV]
# AWS Secret Access Key: [paste from CSV]
# Default region: us-east-1
# Default output format: json

# Method 2: Environment variables (for CI/CD only)
export AWS_ACCESS_KEY_ID="[your_access_key]"
export AWS_SECRET_ACCESS_KEY="[your_secret_key]"
export AWS_DEFAULT_REGION="us-east-1"

# Method 3: Use AWS SSO (MOST SECURE for teams)
aws sso configure --profile restaurant-cafe-deploy
```

### Step 3: Verify Configuration
```bash
# Test with named profile
aws sts get-caller-identity --profile restaurant-cafe-deploy

# Expected output:
# {
#   "UserId": "AIDAI...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/restaurant-cafe-deploy"
# }

# If you see this, credentials are working!
```

---

## 🚫 Credentials in Code Prevention

### Step 1: Create .env File
```bash
# In project root: restaurant-cafe/.env
cat > .env << 'EOF'
# DO NOT COMMIT THIS FILE!
# AWS credentials should NOT be in .env

# Instead, use:
# - AWS_PROFILE environment variable
# - AWS role attached to EC2 instance
# - AWS Secrets Manager for sensitive values

# Application settings (SAFE to commit):
NODE_ENV=production
PORT=5001
JWT_SECRET=store_in_secrets_manager_not_here

# Database (use AWS Secrets Manager):
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_USER=cafe_user
# DB_PASSWORD should come from AWS Secrets Manager at runtime
EOF

chmod 600 .env
```

### Step 2: Setup .gitignore
```bash
# Verify .gitignore has these entries
cat >> .gitignore << 'EOF'
# Credentials
.env
.env.local
.env.*.local
.aws/credentials
.aws/config
aws_credentials.csv

# Never commit
*.key
*.pem
*.txt (if contains passwords)
*.md (if contains sensitive info)
EOF
```

### Step 3: Remove Any Committed Credentials
```bash
# Check if credentials were ever committed
git log -p -S "AKIA" -- .

# If found, use git-filter-branch to remove
# ONLY if no one else has cloned the repo
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push only if no one else cloned
git push origin --force --all
git push origin --force --tags
```

---

## 🔐 Use AWS Secrets Manager

### Store Credentials Safely
```bash
# Store database password
aws secretsmanager create-secret \
  --name restaurant-cafe/db-password \
  --secret-string "VeerDag@123456"

# Store JWT secret
aws secretsmanager create-secret \
  --name restaurant-cafe/jwt-secret \
  --secret-string "VeerDag@123456"

# Store API keys
aws secretsmanager create-secret \
  --name restaurant-cafe/smtp-password \
  --secret-string "VeerDag@123456"

# List all secrets
aws secretsmanager list-secrets
```

### Retrieve Secrets in Application
```bash
# Option 1: In Node.js application
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager();

async function getSecret(secretName) {
  try {
    const response = await client.getSecretValue({ 
      SecretId: secretName 
    }).promise();
    return response.SecretString;
  } catch (error) {
    console.error('Failed to get secret:', error);
    throw error;
  }
}

// Usage
const dbPassword = await getSecret('restaurant-cafe/db-password');

// Option 2: Environment variables set by Docker/ECS
// Task definition automatically injects from Secrets Manager
```

---

## 🆔 Use IAM Roles (RECOMMENDED FOR EC2)

### Setup EC2 Role
```bash
# Create IAM role
aws iam create-role \
  --role-name restaurant-cafe-ec2-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name restaurant-cafe-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name restaurant-cafe-ec2-profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name restaurant-cafe-ec2-profile \
  --role-name restaurant-cafe-ec2-role

# When launching EC2, assign this instance profile
# No access keys needed on the instance!
```

### Benefits of IAM Roles
✅ No credentials on EC2 instance  
✅ Automatic credential rotation  
✅ Fine-grained permissions  
✅ Audit trail in CloudTrail  
✅ Can be revoked immediately  

---

## 📋 Credentials Audit Checklist

### Weekly
- [ ] Check IAM users list for unauthorized accounts
- [ ] Review CloudTrail for suspicious activity
- [ ] Check access key age (should be < 90 days)
- [ ] Verify no root account access keys exist

### Monthly
- [ ] Rotate all active access keys
- [ ] Review IAM policies for least privilege
- [ ] Check for unused access keys (older than 90 days)
- [ ] Audit S3 bucket permissions

### Quarterly
- [ ] Security audit of all credentials
- [ ] Review AWS security recommendations
- [ ] Update IAM policies
- [ ] Check for compliance violations

---

## 📚 AWS Security Best Practices

### Credential Management
1. **Never hardcode credentials**
2. **Use IAM roles when possible**
3. **Rotate access keys every 90 days**
4. **Use temporary security credentials (STS)**
5. **Enable MFA on all accounts**
6. **Monitor API calls (CloudTrail)**
7. **Use AWS Secrets Manager for secrets**
8. **Audit access regularly**

### IAM Best Practices
1. **Create individual IAM users** (not shared)
2. **Apply least privilege principle**
3. **Use groups for permission management**
4. **Enable MFA for all users**
5. **Use roles for applications**
6. **Remove unused users/keys**
7. **Monitor with CloudTrail**
8. **Enable access analyzer**

### Code Security
1. **Never commit credentials** (.gitignore)
2. **Use environment variables**
3. **Scan code before commit** (git hooks)
4. **Use AWS Secrets Manager**
5. **Rotate secrets regularly**
6. **Audit all repository access**
7. **Use branch protection rules**
8. **Require code review**

---

## 🆘 If Credentials Are Compromised

### Immediate Actions (WITHIN 5 MINUTES)
1. [ ] Deactivate compromised access keys in AWS Console
2. [ ] Check AWS Billing Dashboard for charges
3. [ ] Review CloudTrail for unauthorized access
4. [ ] Check EC2 for unauthorized instances
5. [ ] Check RDS for unauthorized databases

### Short-term (WITHIN 1 HOUR)
6. [ ] Create new access keys with AWS CLI
7. [ ] Update all applications with new keys
8. [ ] Rotate all secrets in Secrets Manager
9. [ ] Force password reset for all IAM users
10. [ ] Enable MFA if not already enabled

### Long-term (WITHIN 24 HOURS)
11. [ ] Delete old compromised keys
12. [ ] Audit all IAM permissions
13. [ ] Review and update security policies
14. [ ] Implement credential monitoring
15. [ ] Conduct security training for team

---

## 📞 Support Resources

### AWS Security
- AWS Security Hub: https://console.aws.amazon.com/securityhub
- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- AWS Secrets Manager: https://aws.amazon.com/secrets-manager/
- AWS CloudTrail: https://aws.amazon.com/cloudtrail/

### If Your Account Is Compromised
- AWS Abuse Report: https://aws.amazon.com/security/abuse/
- AWS Support: https://console.aws.amazon.com/support
- Email: abuse@amazonaws.com

### Tools for Credential Management
- 1Password: https://1password.com
- LastPass: https://www.lastpass.com
- AWS Secrets Manager: https://aws.amazon.com/secrets-manager/
- HashiCorp Vault: https://www.vaultproject.io

---

## ✅ Final Checklist

After Reading This Guide:
- [ ] I understand why sharing credentials is dangerous
- [ ] I have deactivated the exposed credentials
- [ ] I have created new IAM user for deployment
- [ ] I have stored credentials securely
- [ ] I have configured AWS CLI with new credentials
- [ ] I have verified credentials work
- [ ] I have added .env to .gitignore
- [ ] I will never share credentials again
- [ ] I will rotate credentials every 90 days
- [ ] I will use IAM roles when possible

---

**Status:** ✅ Critical Security Guide  
**Last Updated:** March 8, 2026  
**Read Time:** 15-20 minutes

**Next Step:** Return to EC2_QUICK_START.md after securing your credentials
