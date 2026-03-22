# AWS Elastic IP Setup Guide - Static IP for EC2

**Date:** March 15, 2026  
**Purpose:** Make EC2 instance IP address static to avoid domain remapping after restarts

---

## 🎯 Problem

When an EC2 instance stops and starts again, it gets a **new public IP address**, which means:
- ❌ You need to update DNS records every time
- ❌ Domain mapping breaks after restart
- ❌ SSH connection strings change
- ❌ Inconvenient for production use

---

## ✅ Solution: Elastic IP (EIP)

An **Elastic IP** is a static, public IPv4 address that:
- ✅ Stays the same even after instance restart
- ✅ Can be reassigned to different instances
- ✅ Free when associated with a running instance
- ✅ Perfect for production environments

---

## 📋 Step-by-Step Guide

### Step 1: Allocate an Elastic IP

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **EC2 Dashboard**

2. **Navigate to Elastic IPs**
   ```
   EC2 Dashboard → Network & Security → Elastic IPs
   ```

3. **Allocate New Address**
   - Click **"Allocate Elastic IP address"** button
   - Network Border Group: Keep default (usually your region)
   - Public IPv4 address pool: **Amazon's pool of IPv4 addresses**
   - Tags (Optional):
     ```
     Name: restaurant-cafe-eip
     Project: Restaurant Cafe Management
     Environment: Production
     ```
   - Click **"Allocate"**

4. **Note the Elastic IP**
   - You'll see something like: `54.123.45.67`
   - **Write this down** - this is your new static IP!

---

### Step 2: Associate Elastic IP with Your EC2 Instance

1. **Select the Elastic IP**
   - In Elastic IPs list, select the IP you just created
   - Click **"Actions"** dropdown
   - Click **"Associate Elastic IP address"**

2. **Configure Association**
   ```
   Resource type: Instance
   Instance: [Select your EC2 instance - restaurant-cafe]
   Private IP address: [Auto-filled - leave as is]
   Reassociation: ☑ Allow this Elastic IP to be reassociated
   ```

3. **Associate**
   - Click **"Associate"**
   - You'll see: "Successfully associated Elastic IP"

4. **Verify**
   - Go to **EC2 Dashboard → Instances**
   - Select your instance
   - Check **"Elastic IP addresses"** field
   - Should show your new static IP

---

### Step 3: Update Your Domain DNS Records

Now update your domain to point to the **new static IP**.

#### For Namecheap (or similar providers):

1. **Login to Namecheap**
   - Go to Domain List
   - Click "Manage" on your domain

2. **Update A Record**
   ```
   Type: A Record
   Host: @ (for root domain) or www (for subdomain)
   Value: YOUR_ELASTIC_IP (e.g., 54.123.45.67)
   TTL: Automatic or 300
   ```

3. **Save Changes**
   - DNS propagation takes 5-30 minutes

#### Example DNS Configuration:
```
Type    Host    Value               TTL
────────────────────────────────────────
A       @       54.123.45.67        300
A       www     54.123.45.67        300
```

---

### Step 4: Update SSH Connection

Your SSH connection will now use the **static IP**.

#### Old SSH Command (dynamic IP - changes):
```bash
ssh -i your-key.pem ec2-user@ec2-12-34-56-78.compute.amazonaws.com
```

#### New SSH Command (static IP - never changes):
```bash
ssh -i your-key.pem ec2-user@54.123.45.67
```

Or create an SSH config:
```bash
# ~/.ssh/config
Host restaurant-cafe
    HostName 54.123.45.67
    User ec2-user
    IdentityFile ~/.ssh/your-key.pem
    
# Then connect with:
ssh restaurant-cafe
```

---

### Step 5: Update Your Application Configuration (if needed)

Update any hardcoded IP references in your application:

#### Backend .env:
```env
# No changes needed usually
# But if you have IP-based CORS, update:
CORS_ORIGIN=http://54.123.45.67:3000
```

#### Security Group (verify):
```
Type        Port    Source
────────────────────────────
SSH         22      Your IP
HTTP        80      0.0.0.0/0
HTTPS       443     0.0.0.0/0
Custom TCP  3000    0.0.0.0/0  (if needed)
Custom TCP  5001    0.0.0.0/0  (if needed)
```

---

## 🧪 Testing

### Test 1: Verify Elastic IP Association
```bash
# Check instance public IP
aws ec2 describe-instances \
  --instance-ids YOUR_INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress'

# Should return your Elastic IP
```

### Test 2: SSH Connection
```bash
ssh -i your-key.pem ec2-user@YOUR_ELASTIC_IP

# If successful, you're connected!
```

### Test 3: Domain Resolution
```bash
# Check if domain points to Elastic IP
nslookup yourdomain.com

# Should return your Elastic IP address
```

### Test 4: Restart Test
```bash
# Stop instance
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Wait for stopped state
aws ec2 wait instance-stopped --instance-ids YOUR_INSTANCE_ID

# Start instance
aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID

# Wait for running state
aws ec2 wait instance-running --instance-ids YOUR_INSTANCE_ID

# Check IP - should still be the same Elastic IP!
aws ec2 describe-instances \
  --instance-ids YOUR_INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress'
```

---

## 💰 Pricing

### Important Pricing Information:

**FREE:**
- ✅ Elastic IP associated with a **running** EC2 instance: **$0.00**

**CHARGED:**
- ❌ Elastic IP **NOT associated** with any instance: **$0.005/hour** (~$3.60/month)
- ❌ Elastic IP associated with a **stopped** instance: **$0.005/hour**
- ❌ Additional Elastic IPs (more than 1 per instance): **$0.005/hour**

### Cost Optimization Tips:
1. ✅ Keep Elastic IP associated with a running instance = FREE
2. ✅ Release unused Elastic IPs immediately
3. ✅ Use only 1 Elastic IP per instance
4. ❌ Don't allocate Elastic IPs "just in case"

---

## 🔧 AWS CLI Commands

If you prefer using AWS CLI:

### Allocate Elastic IP:
```bash
aws ec2 allocate-address --domain vpc
```

Output:
```json
{
    "PublicIp": "54.123.45.67",
    "AllocationId": "eipalloc-12345678",
    "Domain": "vpc"
}
```

### Associate with Instance:
```bash
aws ec2 associate-address \
  --instance-id i-1234567890abcdef0 \
  --allocation-id eipalloc-12345678
```

### Describe Elastic IPs:
```bash
aws ec2 describe-addresses
```

### Disassociate Elastic IP:
```bash
aws ec2 disassociate-address \
  --association-id eipassoc-12345678
```

### Release Elastic IP (when no longer needed):
```bash
aws ec2 release-address \
  --allocation-id eipalloc-12345678
```

---

## 🔄 Complete Workflow

### Initial Setup:
```
1. Allocate Elastic IP
   ↓
2. Associate with EC2 instance
   ↓
3. Update DNS A records
   ↓
4. Wait for DNS propagation (5-30 min)
   ↓
5. Test with: ping yourdomain.com
   ↓
6. Update SSH config (optional)
   ↓
7. Done! ✅
```

### After Instance Restart:
```
1. Instance restarts
   ↓
2. Elastic IP automatically reattaches
   ↓
3. No action needed! ✅
```

---

## 📊 Before vs After

### Before (Dynamic IP):
```
Instance Restart #1
└─> IP: 12.34.56.78
    └─> DNS: yourdomain.com → 12.34.56.78 ✅
    
Instance Restart #2
└─> IP: 98.76.54.32 (NEW!)
    └─> DNS: yourdomain.com → 12.34.56.78 ❌ BROKEN!
    └─> Must update DNS manually 😓
```

### After (Elastic IP):
```
Instance Restart #1
└─> Elastic IP: 54.123.45.67
    └─> DNS: yourdomain.com → 54.123.45.67 ✅
    
Instance Restart #2
└─> Elastic IP: 54.123.45.67 (SAME!)
    └─> DNS: yourdomain.com → 54.123.45.67 ✅
    └─> Nothing to update! 🎉
```

---

## 🚨 Important Notes

### 1. **Only ONE Elastic IP per instance is free**
- Additional IPs are charged $0.005/hour each

### 2. **Elastic IP must be associated to avoid charges**
- If you stop the instance, you'll be charged for the EIP
- Solution: Either keep instance running or release EIP when not needed

### 3. **Elastic IP survives instance termination**
- If you terminate the instance, EIP remains allocated (and charged!)
- Always release EIPs you're not using

### 4. **There's a limit on Elastic IPs per region**
- Default: 5 Elastic IPs per region
- Can request increase via AWS Support

### 5. **DNS propagation time**
- After updating DNS, allow 5-30 minutes for global propagation
- Use `nslookup` or `dig` to check

---

## 🔒 Security Best Practices

### 1. Tag Your Elastic IP:
```
Name: restaurant-cafe-production-eip
Environment: Production
Project: Restaurant Cafe
Owner: Your Name
CostCenter: Production
```

### 2. Document Your Elastic IP:
- Keep a record of which IP is associated with which instance
- Use AWS Systems Manager Parameter Store:
```bash
aws ssm put-parameter \
  --name "/restaurant-cafe/elastic-ip" \
  --value "54.123.45.67" \
  --type "String"
```

### 3. Use Security Groups:
- Don't rely solely on IP address for security
- Always use Security Groups to control access

---

## 🆘 Troubleshooting

### Issue: Can't associate Elastic IP
**Error:** "The instance already has an associated Elastic IP"

**Solution:**
1. Disassociate the current EIP first
2. Then associate the new one

### Issue: Domain not resolving to Elastic IP
**Check DNS:**
```bash
nslookup yourdomain.com
dig yourdomain.com
```

**Wait for propagation:**
- DNS changes can take 5-30 minutes
- Check TTL value on your DNS record

### Issue: Getting charged for Elastic IP
**Reason:** EIP is not associated or instance is stopped

**Solution:**
1. Check association: EC2 → Elastic IPs → Check "Associated instance ID"
2. If not using, release the EIP immediately

### Issue: Lost connection after associating EIP
**Reason:** Your SSH session uses old IP

**Solution:**
1. Close current SSH session
2. Reconnect using the new Elastic IP

---

## 📝 Quick Reference Checklist

### Initial Setup:
- [ ] Allocate Elastic IP in AWS Console
- [ ] Note down the Elastic IP address
- [ ] Associate EIP with EC2 instance
- [ ] Verify association in EC2 console
- [ ] Update DNS A records to point to EIP
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Test SSH connection with EIP
- [ ] Test domain resolution
- [ ] Update any hardcoded IPs in config
- [ ] Document the EIP address

### After Setup:
- [ ] Test instance stop/start
- [ ] Verify IP remains the same
- [ ] Verify domain still resolves correctly
- [ ] Update team documentation
- [ ] Add EIP to monitoring/alerting

---

## 🎯 Summary

### What You Get:
✅ **Static IP** that never changes  
✅ **No DNS updates** needed after restarts  
✅ **Consistent SSH access**  
✅ **Professional production setup**  
✅ **Free** when associated with running instance  

### What to Remember:
⚠️ Release unused Elastic IPs to avoid charges  
⚠️ Only 1 free EIP per instance  
⚠️ Stopped instances with EIP are charged  
⚠️ Update DNS records once after setup  

---

## 🔗 AWS Documentation Links

- [Elastic IP Addresses](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
- [Associating an Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html#using-instance-addressing-eips-associating)
- [Elastic IP Pricing](https://aws.amazon.com/ec2/pricing/on-demand/#Elastic_IP_Addresses)

---

## ✅ Next Steps

1. **Allocate Elastic IP** in AWS Console
2. **Associate with your EC2 instance**
3. **Update DNS records** to point to the EIP
4. **Test** by stopping and starting instance
5. **Verify** IP remains static
6. **Enjoy** never having to update DNS again! 🎉

---

**Need help?** Refer to the troubleshooting section above or AWS documentation.

**Pro Tip:** Set up Route 53 (AWS DNS) for even better integration with AWS services!

---

*Last Updated: March 15, 2026*
