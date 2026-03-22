# 🛑 EC2 Instance Shutdown - Cafe Delicacy Restaurant

**Date:** March 14, 2026  
**Action:** EC2 Instance Stopped  
**Reason:** User requested to stop backend and instance  

---

## Instance Details

- **Instance ID:** i-00092b1966d8361e2
- **Instance Name:** cafe-delicacy-restaurant
- **Region:** ap-south-1 (Mumbai)
- **Public IP:** 13.232.173.130
- **Status:** ✅ STOPPED
- **Previous State:** running → stopping → stopped

---

## What Was Stopped

### 1. Backend Application ✅
- **PM2 Process:** restaurant-backend
- **Status:** Stopped (instance shutdown)
- **Port:** 5001
- **Database:** PostgreSQL will stop with instance

### 2. EC2 Instance ✅
- **Status:** Successfully stopped via AWS CLI
- **Command Used:** `aws ec2 stop-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2`

---

## Impact of Stopping

### Services Now Unavailable ❌
- ❌ Backend API (http://13.232.173.130:5001)
- ❌ PostgreSQL Database
- ❌ SSH Access
- ❌ All PM2 processes

### DNS Still Active ✅
- ✅ Domain: cafe-delicacy-restaurant.com
- ✅ Route 53 Hosted Zone: Z00716758GEV1O182PIC
- ✅ DNS records pointing to 13.232.173.130 (but instance is stopped)

---

## Cost Savings 💰

**While Stopped:**
- ✅ No EC2 compute charges (only EBS storage charges)
- ✅ Estimated savings: ~$0.02-0.05 per hour (depending on instance type)
- ⚠️ Still paying for:
  - EBS volume storage (~$0.10/GB/month)
  - Elastic IP (if allocated and not attached)
  - Route 53 hosted zone ($0.50/month)

---

## How to Restart the Instance

### Option 1: AWS CLI
```bash
# Start the instance
aws ec2 start-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2

# Check status
aws ec2 describe-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2 \
  --query 'Reservations[*].Instances[*].[State.Name,PublicIpAddress]' --output table

# Wait for it to be running, then SSH
ssh -i cafe.pem ec2-user@13.232.173.130
```

### Option 2: AWS Console
1. Go to AWS Console → EC2 → Instances
2. Select instance `i-00092b1966d8361e2`
3. Click "Instance State" → "Start Instance"
4. Wait for status to change to "running"

---

## What Happens When You Restart

### ✅ Will Auto-Start
- PostgreSQL (system service)
- SSH daemon

### ❌ Will NOT Auto-Start (Manual intervention required)
- PM2 processes (backend)
- Frontend (if it was running)

### Commands to Run After Restart
```bash
# SSH into instance
ssh -i cafe.pem ec2-user@13.232.173.130

# Check PostgreSQL
sudo systemctl status postgresql

# Resurrect PM2 processes (if you saved them)
pm2 resurrect
# OR start manually
cd restaurant-cafe/backend
pm2 start npm --name restaurant-backend -- run server

# Check status
pm2 status
pm2 logs restaurant-backend
```

---

## Important Notes ⚠️

### Public IP Address
- **Current IP:** 13.232.173.130
- **⚠️ WARNING:** If you don't have an Elastic IP, the public IP **MAY CHANGE** when you restart!
- **Recommendation:** Allocate an Elastic IP to keep the same IP address

### To Allocate Elastic IP (Optional)
```bash
# Allocate Elastic IP
aws ec2 allocate-address --region ap-south-1 --domain vpc

# Associate it with your instance
aws ec2 associate-address --region ap-south-1 \
  --instance-id i-00092b1966d8361e2 \
  --allocation-id <ALLOCATION_ID_FROM_ABOVE>
```

### DNS Records
- If IP changes, you'll need to update Route 53 records
- All 4 A records point to 13.232.173.130

---

## Deployment State Preserved ✅

### On EBS Volume (Persisted)
- ✅ All code (restaurant-cafe repository)
- ✅ Node.js and npm installations
- ✅ PostgreSQL database data
- ✅ Docker and Docker Compose
- ✅ Git repository
- ✅ Environment variables (.env files)
- ✅ PM2 configuration (if saved)

### Will Need Reconfiguration
- PM2 processes (if not configured for auto-start)
- Environment variables in current shell session
- Any temporary files or caches

---

## Quick Restart Guide

### 1. Start Instance
```bash
aws ec2 start-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2
```

### 2. Wait for Running State (2-3 minutes)
```bash
aws ec2 describe-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2 \
  --query 'Reservations[*].Instances[*].State.Name' --output text
```

### 3. Get New Public IP (if changed)
```bash
aws ec2 describe-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2 \
  --query 'Reservations[*].Instances[*].PublicIpAddress' --output text
```

### 4. SSH and Start Services
```bash
ssh -i cafe.pem ec2-user@<NEW_IP_IF_CHANGED>
pm2 resurrect  # Or start services manually
pm2 status
```

---

## Alternative: Terminate Instance (Permanent Deletion)

⚠️ **WARNING:** Only do this if you want to permanently delete everything!

```bash
# This will DELETE the instance and all data
aws ec2 terminate-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2
```

**Before terminating, make sure you:**
- ✅ Have backup of database
- ✅ Have code pushed to GitHub
- ✅ Have downloaded any important logs or files
- ✅ Understand you'll lose all data on EBS volumes

---

## Cost While Stopped

| Item | Status | Cost |
|------|--------|------|
| EC2 Compute | Stopped | $0.00/hour |
| EBS Storage | Active | ~$0.10/GB/month |
| Route 53 Zone | Active | $0.50/month |
| Data Transfer | None | $0.00 |
| **Estimated Total** | | **~$0.50-2.00/month** |

---

## Next Steps Options

### Option A: Keep Stopped (Save Money)
- Instance stopped but preserved
- Can restart anytime
- Minimal costs (~$0.50-2/month)

### Option B: Restart and Continue Deployment
1. Start instance
2. Complete frontend deployment
3. Install Nginx
4. Configure SSL
5. Go live with domain

### Option C: Terminate and Delete
- Permanently remove instance
- Delete EBS volumes
- Keep Route 53 for future use
- Minimal costs (only Route 53 ~$0.50/month)

---

**Status:** ✅ Successfully stopped  
**Last Action:** March 14, 2026  
**Stopped By:** User request  
**Reason:** Pausing deployment process
