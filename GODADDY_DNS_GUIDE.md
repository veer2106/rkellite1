# 🎯 GoDaddy DNS Update - Quick Visual Guide

## Step-by-Step Instructions to Point cafe-delicacy-restaurant.com to 13.233.0.43

---

### ✅ STEP 1: Log in to GoDaddy

1. Go to: **https://www.godaddy.com/**
2. Click **"Sign In"** (top right)
3. Enter your GoDaddy username/password

---

### ✅ STEP 2: Check Your Nameservers First

**IMPORTANT:** You need to know if you're using GoDaddy's nameservers or custom ones.

1. In GoDaddy dashboard, click **"My Products"**
2. Find **"Domains"** section
3. Click on **cafe-delicacy-restaurant.com**
4. Scroll down to **"Additional Settings"**
5. Click **"Manage Nameservers"** or look for **"Nameservers"** section

**You'll see one of two options:**

#### Option A: Default Nameservers ✅
```
Nameserver Type: Default
ns01.domaincontrol.com
ns02.domaincontrol.com
```
→ **Good! Follow SCENARIO 1 below** ⬇️

#### Option B: Custom Nameservers ⚠️
```
Nameserver Type: Custom
ns-xxx.awsdns-xx.com
(or other custom nameservers)
```
→ **You have a choice! See SCENARIO 2 below** ⬇️

---

## 📋 SCENARIO 1: Using GoDaddy Default Nameservers

### This is the EASIEST path - just update DNS in GoDaddy!

**STEP 3: Go to DNS Management**

1. Go back to **"My Products"** → **"Domains"**
2. Next to `cafe-delicacy-restaurant.com`, click **"DNS"** button
   - Or click the domain → **"Manage DNS"**

**STEP 4: Find or Add A Record**

Look at the DNS Records table. Find the **A record** section.

### If you see an A record with @ (root domain):

```
Type | Name | Value          | TTL
-----|------|----------------|-----
A    | @    | 65.2.124.30   | 600    ← This is WRONG IP
```

**Action:**
1. Click the **pencil icon** (✏️) on that row
2. Change **"Points to"** or **"Value"** to: `13.233.0.43`
3. Leave TTL as `600` or `1 Hour`
4. Click **"Save"**

### If you DON'T see an A record for @:

**Action:**
1. Click **"Add"** or **"Add New Record"** button
2. Select **Type:** `A`
3. **Name/Host:** `@` (this means root domain)
4. **Value/Points to:** `13.233.0.43`
5. **TTL:** `600` (10 minutes) or `1 Hour`
6. Click **"Save"**

**STEP 5: Add WWW Record (Recommended)**

1. Click **"Add"** again
2. **Type:** `A`
3. **Name:** `www`
4. **Value:** `13.233.0.43`
5. **TTL:** `600`
6. Click **"Save"**

**STEP 6: Done! Wait for Propagation**

✅ Your DNS is updated!  
⏳ Wait **10-60 minutes** for changes to propagate worldwide

**STEP 7: Verify (after 10-15 minutes)**

```bash
# Run this command
dig +short cafe-delicacy-restaurant.com

# Should return: 13.233.0.43
```

---

## 📋 SCENARIO 2: Using Custom Nameservers

### You have TWO options here:

---

### **Option 2A: Switch Back to GoDaddy Nameservers** (RECOMMENDED - EASIER)

If you don't specifically need custom nameservers, this is easier:

**STEP 3: Change to Default Nameservers**

1. From domain overview, scroll to **"Additional Settings"**
2. Click **"Change"** next to Nameservers
3. Select **"Use default nameservers"** or **"Use GoDaddy nameservers"**
4. Click **"Save"**

**STEP 4: Wait 5-10 Minutes**

The nameserver change needs to propagate.

**STEP 5: Now Follow SCENARIO 1**

After nameservers are changed to GoDaddy's default:
- Go to DNS Management (DNS button)
- Add A record as described in Scenario 1

---

### **Option 2B: Keep Custom Nameservers** (Update DNS elsewhere)

If you NEED to keep custom nameservers (e.g., for AWS Route 53, Cloudflare):

**STEP 3: Identify Where Your Nameservers Are**

```bash
# Run this to see your nameservers
dig +short NS cafe-delicacy-restaurant.com
```

**Common patterns:**

| Nameserver Pattern | Provider | Where to Update DNS |
|-------------------|----------|---------------------|
| `ns-*.awsdns-*.com` | **AWS Route 53** | AWS Console → Route 53 |
| `*.ns.cloudflare.com` | **Cloudflare** | Cloudflare Dashboard |
| `ns*.digitalocean.com` | **DigitalOcean** | DigitalOcean DNS |
| Other | Custom provider | Contact provider |

**STEP 4: Update DNS on That Provider**

**For AWS Route 53:**
1. Log in: https://console.aws.amazon.com/route53/
2. Click "Hosted zones"
3. Click on your domain
4. Edit or create A record:
   - Name: (blank for root)
   - Type: A
   - Value: `13.233.0.43`

**For Cloudflare:**
1. Log in: https://dash.cloudflare.com/
2. Select your domain
3. Click "DNS"
4. Edit or add A record:
   - Type: A
   - Name: @
   - IPv4: `13.233.0.43`
   - Proxy: OFF (gray cloud)

**See the detailed guide:** `HOW_TO_UPDATE_DNS.md`

---

## 🧪 Test Your DNS Update

### After 10-15 minutes, run these tests:

```bash
# Test 1: Check DNS resolution
dig +short cafe-delicacy-restaurant.com

# Expected: 13.233.0.43

# Test 2: Check from Google DNS
dig @8.8.8.8 +short cafe-delicacy-restaurant.com

# Test 3: Try accessing in browser
# http://cafe-delicacy-restaurant.com
```

### Browser Test:

1. **Open Incognito/Private window** (to avoid cache)
2. Go to: `http://cafe-delicacy-restaurant.com`
3. **Should see:** RK Ellite login page

**If not working:**
- Wait longer (up to 60 minutes for full propagation)
- Clear browser cache
- Check AWS Security Group (port 80 must be open)

---

## 📊 Final DNS Configuration

After setup, your GoDaddy DNS records should look like:

```
Type  | Name | Value          | TTL
------|------|----------------|-----
A     | @    | 13.233.0.43   | 600
A     | www  | 13.233.0.43   | 600
```

---

## ⚠️ Important Reminders

### ✅ Don't Forget These:

1. **DNS Update** ← You're doing this now
   - Point to 13.233.0.43

2. **AWS Security Group** ← MUST ALSO BE DONE!
   - Allow HTTP (port 80) from 0.0.0.0/0
   - See: `SITE_NOT_REACHABLE_FIX.md`

3. **Wait for Propagation** ← Be patient
   - DNS: 10-60 minutes
   - Security Group: 30 seconds

4. **Test Both Ways**
   - By IP: http://13.233.0.43
   - By domain: http://cafe-delicacy-restaurant.com

---

## 🆘 Troubleshooting

### Problem: "I don't see DNS button in GoDaddy"

**Solution:** You're using custom nameservers. Choose Option 2A or 2B above.

---

### Problem: "Changes aren't saving"

**Solutions:**
- Make sure you clicked "Save"
- Refresh the page and check again
- Try different browser
- Log out and log back in

---

### Problem: "DNS updated but site still not accessible"

**Cause:** AWS Security Group is blocking traffic

**Solution:** 
1. Log in to AWS Console
2. Go to EC2 → Security Groups
3. Find your instance's security group
4. Add inbound rule: HTTP (port 80) from 0.0.0.0/0

See `SITE_NOT_REACHABLE_FIX.md` for detailed instructions.

---

### Problem: "DNS shows correct IP but browser shows old site"

**Solutions:**
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private mode
- Flush DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  
  # Windows
  ipconfig /flushdns
  
  # Linux
  sudo systemd-resolve --flush-caches
  ```

---

## 🎯 Quick Decision Tree

```
Are you using custom nameservers?
│
├─ NO (Using GoDaddy default) 
│  └─> Follow SCENARIO 1
│     └─> Update DNS in GoDaddy
│        └─> Add A record: @ → 13.233.0.43
│
└─ YES (Using custom nameservers)
   ├─> Do you NEED them?
   │   │
   │   ├─ NO → Follow Option 2A
   │   │  └─> Switch to GoDaddy nameservers
   │   │     └─> Then follow SCENARIO 1
   │   │
   │   └─ YES → Follow Option 2B
   │      └─> Update DNS on your nameserver provider
   │         (AWS Route 53, Cloudflare, etc.)
```

---

## ✅ Summary

**What to do:**
1. Check if using GoDaddy or custom nameservers
2. Update A record to point to `13.233.0.43`
3. Wait 10-60 minutes
4. Test: `dig +short cafe-delicacy-restaurant.com`
5. Also update AWS Security Group (separate issue)

**Target DNS:**
- cafe-delicacy-restaurant.com → 13.233.0.43
- www.cafe-delicacy-restaurant.com → 13.233.0.43

---

**Last Updated:** March 16, 2026  
**For:** cafe-delicacy-restaurant.com → EC2 (13.233.0.43)
