# 🌐 DNS Issue - Custom Nameservers in GoDaddy

## 🔴 THE REAL PROBLEM

You mentioned you **added custom nameservers in GoDaddy**. This is why the site cannot be reached!

### What Happened:

1. **Before:** Domain used GoDaddy's default nameservers
   - DNS records managed in GoDaddy's DNS settings
   - A records, CNAME records all configured in GoDaddy

2. **After (Current State):** You added custom nameservers
   - GoDaddy is NO LONGER managing DNS
   - DNS management moved to the custom nameserver provider
   - Any A records in GoDaddy are **IGNORED**
   - The custom nameservers are pointing to **65.2.124.30** (wrong IP)

---

## 🎯 TWO SOLUTIONS (Pick One)

### ✅ **Solution 1: Update DNS on Custom Nameservers** (Recommended if you need those nameservers)

You need to add the A record on **WHEREVER YOUR CUSTOM NAMESERVERS ARE HOSTED**, not in GoDaddy.

**Steps:**

1. **Identify your nameserver provider:**
   ```bash
   # Run this to see which nameservers you're using
   dig +short NS cafe-delicacy-restaurant.com
   ```

2. **Common nameserver providers:**
   - **AWS Route 53:** ns-xxx.awsdns-xx.com
   - **Cloudflare:** *.ns.cloudflare.com
   - **DigitalOcean:** ns1.digitalocean.com
   - **Custom server:** Your own nameserver

3. **Log in to that nameserver's control panel**

4. **Add/Update A Record:**
   - Type: `A`
   - Name: `@` (root domain)
   - Value: `13.233.0.43`
   - TTL: `300` (5 minutes)

5. **Also add www subdomain:**
   - Type: `A`
   - Name: `www`
   - Value: `13.233.0.43`
   - TTL: `300`

---

### ✅ **Solution 2: Remove Custom Nameservers (Use GoDaddy DNS)** (Easiest)

If you don't actually need custom nameservers, switch back to GoDaddy's nameservers:

**Steps:**

1. **Log in to GoDaddy**

2. **Go to Domain Settings** for cafe-delicacy-restaurant.com

3. **Find "Nameservers" section**

4. **Change to "Default Nameservers"** or **"Use GoDaddy nameservers"**
   - GoDaddy's default nameservers usually look like:
     - `ns01.domaincontrol.com`
     - `ns02.domaincontrol.com`

5. **After switching back, go to DNS Management**

6. **Add/Update A Record:**
   - Type: `A`
   - Name: `@`
   - Value: `13.233.0.43`
   - TTL: `600`

7. **Add www record:**
   - Type: `A`
   - Name: `www`
   - Value: `13.233.0.43`
   - TTL: `600`

8. **Wait 5-60 minutes** for DNS propagation

---

## 🔍 How to Check Which Nameservers You're Using

### Method 1: Command Line
```bash
dig +short NS cafe-delicacy-restaurant.com
```

**Example outputs:**

**If using GoDaddy:**
```
ns01.domaincontrol.com.
ns02.domaincontrol.com.
```

**If using AWS Route 53:**
```
ns-123.awsdns-12.com.
ns-456.awsdns-45.net.
ns-789.awsdns-78.org.
ns-012.awsdns-01.co.uk.
```

**If using Cloudflare:**
```
bob.ns.cloudflare.com.
sara.ns.cloudflare.com.
```

### Method 2: GoDaddy Dashboard
1. Log in to GoDaddy
2. Go to "My Products" → "Domains"
3. Click on cafe-delicacy-restaurant.com
4. Scroll to "Additional Settings" → "Nameservers"
5. You'll see either:
   - **"Default"** (GoDaddy managing DNS)
   - **"Custom"** (External nameservers managing DNS)

---

## 📋 Current vs Expected Configuration

| Aspect | Current | Expected |
|--------|---------|----------|
| Domain | cafe-delicacy-restaurant.com | ✅ Same |
| IP Address | **65.2.124.30** ❌ | **13.233.0.43** |
| Nameservers | Custom (unknown provider) | GoDaddy or update custom NS |
| EC2 Status | ✅ Running perfectly | ✅ Same |
| Application | ✅ Working on EC2 | ✅ Same |

---

## ⚡ Quick Decision Guide

### Use Solution 1 (Update custom nameservers) if:
- ✅ You're using AWS Route 53 for DNS
- ✅ You're using Cloudflare for CDN/security
- ✅ You need advanced DNS features
- ✅ Another service requires those nameservers

### Use Solution 2 (Switch back to GoDaddy) if:
- ✅ You don't know why you added custom nameservers
- ✅ You want the simplest solution
- ✅ You only need basic DNS (A records, CNAME)
- ✅ You're not using any special DNS services

---

## 🧪 After Fixing DNS - Test It

```bash
# Wait 5-60 minutes after making DNS changes, then test:

# Check if DNS is updated
dig +short cafe-delicacy-restaurant.com
# Should return: 13.233.0.43

# Test in browser
http://cafe-delicacy-restaurant.com

# Test with curl
curl -I http://cafe-delicacy-restaurant.com
```

---

## ⚠️ IMPORTANT: AWS Security Group Still Needed!

**Don't forget:** Even after DNS is fixed, you STILL need to update the AWS Security Group to allow port 80!

Both issues must be fixed:
1. ✅ AWS Security Group: Allow port 80 (see `SITE_NOT_REACHABLE_FIX.md`)
2. ✅ DNS: Point to correct IP 13.233.0.43

---

## 📞 What to Do Right Now

### Step 1: Check your nameservers
```bash
dig +short NS cafe-delicacy-restaurant.com
```

### Step 2A: If they're NOT GoDaddy nameservers
→ Find where those nameservers are managed (AWS, Cloudflare, etc.)  
→ Log in to that service  
→ Add A record pointing to 13.233.0.43

### Step 2B: If you want to use GoDaddy DNS (easier)
→ Log in to GoDaddy  
→ Change nameservers to "Default"  
→ Add A record in GoDaddy DNS pointing to 13.233.0.43

### Step 3: Update AWS Security Group
→ Follow instructions in `SITE_NOT_REACHABLE_FIX.md`  
→ Add HTTP (port 80) inbound rule

### Step 4: Wait & Test
→ Wait 5-60 minutes for DNS propagation  
→ Test: http://13.233.0.43 (should work immediately after Security Group update)  
→ Test: http://cafe-delicacy-restaurant.com (should work after DNS propagates)

---

## 🎯 Summary

**Root Cause:** Custom nameservers are pointing to wrong IP (65.2.124.30 instead of 13.233.0.43)

**Fix:** Update DNS A record where your nameservers are managed (either custom NS provider or switch back to GoDaddy)

**Timeline:**
- AWS Security Group update: Works in 30 seconds
- DNS changes: Takes 5-60 minutes to propagate

---

**Last Updated:** March 16, 2026  
**Status:** Application working, DNS + Security Group updates needed
