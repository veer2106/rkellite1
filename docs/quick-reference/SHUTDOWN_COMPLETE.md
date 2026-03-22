# 🛑 EC2 Instance Shutdown Complete

**Date:** March 14, 2026  
**Time:** 5:30 PM IST  
**Action:** Graceful shutdown of application and EC2 instance

---

## ✅ Shutdown Summary

### Services Stopped
1. ✅ **Backend Application (PM2)**
   - Process: restaurant-backend
   - Status: Stopped and deleted
   - Port 5001: No longer active

2. ✅ **Frontend Application (PM2)**
   - Process: restaurant-frontend
   - Status: Stopped and deleted
   - Port 3000: No longer active

3. ✅ **EC2 Instance**
   - Instance ID: i-00092b1966d8361e2
   - Name: cafe-delicacy-restaurant
   - Status: Stopping → Stopped
   - IP Address: 65.2.124.30 (will be released)

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend | ✅ Stopped | PM2 process deleted |
| Frontend | ✅ Stopped | PM2 process deleted |
| EC2 Instance | ✅ Stopping | Shutting down gracefully |
| PostgreSQL | ✅ Will stop | Stops with instance |
| Nginx | ✅ Will stop | Stops with instance |
| Public IP | ⚠️ Released | IP will change on restart |

---

## 💰 Cost Impact

### While Instance is Stopped:
- ✅ **$0.00/hour** - No compute charges
- ✅ EBS storage charges only (~$0.80-2/month)
- ✅ Route 53 charges continue ($0.50/month)
- ✅ Domain registration unchanged

### Estimated Monthly Savings:
- **Compute:** ~$8-10/month saved while stopped
- **Storage:** ~$0.80-2/month (still charged)
- **DNS:** $0.50/month (still charged)

---

## 🔄 How to Restart

### Quick Restart
```bash
# Start the EC2 instance
aws ec2 start-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2

# Wait 2-3 minutes, then check status
aws ec2 describe-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2 \
  --query 'Reservations[*].Instances[*].[State.Name,PublicIpAddress]' --output table

# SSH into instance (use new IP if changed)
ssh -i cafe.pem ec2-user@<NEW_IP>

# Restart services
pm2 resurrect
# OR
cd restaurant-cafe/backend && DB_PASSWORD=postgres123 NODE_ENV=production pm2 start npm --name restaurant-backend -- run server
cd ../frontend && pm2 start npm --name restaurant-frontend -- start
pm2 save
```

### Full Restart Commands
```bash
# 1. Start EC2
aws ec2 start-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2

# 2. Get new IP (wait 2-3 minutes first)
NEW_IP=$(aws ec2 describe-instances --region ap-south-1 --instance-ids i-00092b1966d8361e2 \
  --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)
echo "New IP: $NEW_IP"

# 3. Update DNS (if IP changed)
# See EC2_DEPLOYMENT_GUIDE.md for DNS update steps

# 4. SSH and restart services
ssh -i cafe.pem ec2-user@$NEW_IP
pm2 resurrect
pm2 status
```

---

## ⚠️ Important Notes

### IP Address Change
- ⚠️ **The public IP WILL change** when you restart (you don't have Elastic IP)
- 📝 You'll need to update DNS records with the new IP
- 🔄 Route 53 records for all subdomains need updating

### Data Preservation
The following are **PRESERVED** on the EBS volume:
- ✅ Application code
- ✅ Database data (PostgreSQL)
- ✅ Configuration files
- ✅ Node.js installations
- ✅ PM2 configurations
- ✅ Nginx configurations

### What Needs Reconfiguration
After restart, you may need to:
- [ ] Update DNS A records (if IP changed)
- [ ] Restart PM2 services
- [ ] Verify database is running
- [ ] Test application accessibility

---

## 🗂️ Backup Checklist

Before permanent deletion, ensure you have:
- [ ] Backed up database
- [ ] Saved environment variables
- [ ] Downloaded any important logs
- [ ] Saved custom configurations
- [ ] Pushed code to GitHub

---

## 📝 Instance Details

### Configuration
- **Instance ID:** i-00092b1966d8361e2
- **Name:** cafe-delicacy-restaurant
- **Region:** ap-south-1 (Mumbai)
- **OS:** Amazon Linux 2023
- **Instance Type:** t2.micro (or similar)
- **Previous IP:** 65.2.124.30

### Domain Configuration
- **Domain:** cafe-delicacy-restaurant.com
- **DNS:** AWS Route 53
- **Hosted Zone:** Z00716758GEV1O182PIC
- **Current DNS:** Points to 65.2.124.30 (will be invalid after IP change)

### Database
- **Type:** PostgreSQL 15
- **Database:** restaurant_db
- **User:** postgres
- **Password:** postgres123
- **Data:** Preserved on EBS

---

## 🚀 Restart Scenarios

### Scenario 1: Quick Restart (Same Day)
1. Start instance: `aws ec2 start-instances ...`
2. Get new IP
3. Update DNS
4. Resurrect PM2: `pm2 resurrect`
5. Test application

### Scenario 2: Long-Term Restart (After Days/Weeks)
1. Start instance
2. Get new IP
3. Update DNS (wait for propagation)
4. SSH to instance
5. Verify PostgreSQL is running
6. Reseed database if needed
7. Restart PM2 services manually
8. Test all functionality

### Scenario 3: Fresh Start
1. Start instance
2. Get new IP
3. Update DNS
4. SSH to instance
5. Drop and recreate database
6. Reseed with fresh data
7. Restart all services
8. Full testing

---

## 📚 Related Documentation

- **EC2_SHUTDOWN_SUMMARY.md** - Detailed shutdown procedures
- **DEPLOYMENT_SUCCESS.md** - Original deployment guide
- **LOGIN_CREDENTIALS.md** - All login credentials
- **LOGIN_TROUBLESHOOTING.md** - Troubleshooting guide

---

## ✅ Verification

### Shutdown Completed Successfully ✅
- ✅ PM2 processes stopped
- ✅ PM2 processes deleted
- ✅ EC2 instance stopping
- ✅ No running services
- ✅ No active charges (except storage)

---

## 🎯 Next Actions

### If Restarting Soon:
1. Wait for instance to fully stop (check status)
2. Start when needed
3. Update DNS with new IP
4. Restart services

### If Stopping Long-Term:
1. Consider taking EBS snapshot (backup)
2. Download any critical data
3. Document any custom configurations
4. Note the shutdown date for reference

### If Permanently Deleting:
⚠️ **DO NOT** terminate instance without:
- [ ] Full database backup
- [ ] Code pushed to GitHub
- [ ] Important files downloaded
- [ ] DNS records noted
- [ ] Configurations documented

---

**Status:** ✅ Successfully stopped  
**Shutdown Time:** March 14, 2026, 5:30 PM IST  
**Last IP:** 65.2.124.30  
**Next Restart IP:** Will be different (unless Elastic IP is allocated)

---

## 💡 Pro Tip

To avoid IP changes in the future:
```bash
# Allocate Elastic IP (costs ~$3.60/month if not attached)
aws ec2 allocate-address --region ap-south-1 --domain vpc

# Associate with instance (free when attached to running instance)
aws ec2 associate-address --region ap-south-1 \
  --instance-id i-00092b1966d8361e2 \
  --allocation-id <ALLOCATION_ID>
```

This ensures your IP address never changes, even after stop/start cycles!
