# 🌐 DNS Update Guide - Point Domain to EC2 (13.233.0.43)

## 📋 Overview

**Goal:** Point `cafe-delicacy-restaurant.com` to your EC2 server at `13.233.0.43`

**Current Issue:** Domain is pointing to `65.2.124.30` (wrong IP)

**Solution:** Update DNS A record to point to `13.233.0.43`

---

## 🔍 Step 1: Identify Where to Update DNS

First, you need to know **where your DNS is managed**. This depends on which nameservers your domain is using.

### Check Your Nameservers:

```bash
# Run this command to see your current nameservers
dig +short NS cafe-delicacy-restaurant.com
```

**Possible results:**

| Nameserver Pattern | DNS Managed By | Go To |
|-------------------|----------------|-------|
| `ns01.domaincontrol.com`<br>`ns02.domaincontrol.com` | **GoDaddy** | [GoDaddy Instructions](#option-1-godaddy-dns) |
| `ns-*.awsdns-*.com`<br>`ns-*.awsdns-*.net` | **AWS Route 53** | [AWS Route 53 Instructions](#option-2-aws-route-53) |
| `*.ns.cloudflare.com` | **Cloudflare** | [Cloudflare Instructions](#option-3-cloudflare) |
| Other custom nameservers | **Custom Provider** | Contact your nameserver provider |

---

## 🎯 Option 1: GoDaddy DNS (Default Nameservers)

### If Using GoDaddy Nameservers:

**Step 1: Log in to GoDaddy**
- Go to: https://www.godaddy.com/
- Click "Sign In"
- Enter your credentials

**Step 2: Navigate to DNS Management**
1. Click on your profile icon → **"My Products"**
2. Find **"Domains"** section
3. Click **"DNS"** next to `cafe-delicacy-restaurant.com`
   - Or click the domain name → **"Manage DNS"**

**Step 3: Update/Add A Record**

Look for the DNS records table. You need to add or update the A record:

**If A record exists (pointing to wrong IP):**
1. Find the record with:
   - Type: `A`
   - Name: `@` (or blank)
   - Points to: `65.2.124.30` or some other IP
2. Click the **pencil icon** (Edit)
3. Change **"Points to"** value to: `13.233.0.43`
4. Leave TTL as default (600 or 1 hour)
5. Click **"Save"**

**If NO A record exists:**
1. Click **"Add"** button
2. Fill in:
   - **Type:** `A`
   - **Name:** `@` (for root domain)
   - **Value/Points to:** `13.233.0.43`
   - **TTL:** `600` (10 minutes) or `3600` (1 hour)
3. Click **"Save"**

**Step 4: Add WWW Record (Optional but recommended)**
1. Click **"Add"** again
2. Fill in:
   - **Type:** `A`
   - **Name:** `www`
   - **Value:** `13.233.0.43`
   - **TTL:** `600`
3. Click **"Save"**

**Step 5: Wait for Propagation**
- DNS changes take **5-60 minutes** to propagate worldwide
- You can test after 10-15 minutes

---

## 🎯 Option 2: AWS Route 53

### If Using AWS Route 53 Nameservers:

**Step 1: Log in to AWS Console**
- Go to: https://console.aws.amazon.com/route53/

**Step 2: Navigate to Hosted Zones**
1. Click **"Hosted zones"** in left sidebar
2. Click on your hosted zone: `cafe-delicacy-restaurant.com`

**Step 3: Update/Create A Record**

**If A record exists:**
1. Find the record with:
   - Name: `cafe-delicacy-restaurant.com` (or blank)
   - Type: `A`
2. Select the record (checkbox)
3. Click **"Edit record"**
4. Under **"Value"**, replace current IP with: `13.233.0.43`
5. Click **"Save changes"**

**If NO A record exists:**
1. Click **"Create record"**
2. Fill in:
   - **Record name:** (leave blank for root domain)
   - **Record type:** `A - Routes traffic to an IPv4 address`
   - **Value:** `13.233.0.43`
   - **TTL:** `300` (5 minutes)
   - **Routing policy:** Simple routing
3. Click **"Create records"**

**Step 4: Add WWW Record**
1. Click **"Create record"** again
2. Fill in:
   - **Record name:** `www`
   - **Record type:** `A`
   - **Value:** `13.233.0.43`
   - **TTL:** `300`
3. Click **"Create records"**

**Alternative - Using Alias (if EC2 has Elastic IP in same AWS account):**
1. Create record
2. Enable **"Alias"** toggle
3. Select **"Alias to EC2 instance"**
4. Select your region: `ap-south-1`
5. Select your EC2 instance or Elastic IP
6. Click **"Create records"**

---

## 🎯 Option 3: Cloudflare

### If Using Cloudflare Nameservers:

**Step 1: Log in to Cloudflare**
- Go to: https://dash.cloudflare.com/

**Step 2: Select Your Domain**
1. Click on `cafe-delicacy-restaurant.com`

**Step 3: Go to DNS Settings**
1. Click **"DNS"** in the top menu
2. You'll see the DNS records page

**Step 4: Update/Add A Record**

**If A record exists:**
1. Find the record with:
   - Type: `A`
   - Name: `@` or `cafe-delicacy-restaurant.com`
2. Click **"Edit"**
3. Change **"IPv4 address"** to: `13.233.0.43`
4. **Proxy status:** 
   - **Off (DNS only)** - Recommended for now (gray cloud)
   - On (Proxied) - Cloudflare proxy (orange cloud) - Can enable later
5. Click **"Save"**

**If NO A record exists:**
1. Click **"Add record"**
2. Fill in:
   - **Type:** `A`
   - **Name:** `@`
   - **IPv4 address:** `13.233.0.43`
   - **Proxy status:** Off (DNS only) - gray cloud
   - **TTL:** Auto
3. Click **"Save"**

**Step 5: Add WWW Record**
1. Click **"Add record"**
2. Fill in:
   - **Type:** `A`
   - **Name:** `www`
   - **IPv4 address:** `13.233.0.43`
   - **Proxy status:** Off (DNS only)
   - **TTL:** Auto
3. Click **"Save"**

---

## 🎯 Option 4: Custom Nameservers (Other Providers)

If your nameservers are from another provider:

1. **Identify the provider** from the nameserver names
2. **Log in to that provider's control panel**
3. **Find DNS management** or **Zone file editor**
4. **Add/Update A record:**
   - Name: `@` or root domain
   - Type: `A`
   - Value: `13.233.0.43`
   - TTL: 300-3600
5. **Add www record** similarly

---

## ✅ Step 2: Verify DNS Changes

### Immediately After Updating (Check on DNS server):

```bash
# Check nameservers
dig +short NS cafe-delicacy-restaurant.com

# Check A record (may still show old IP initially)
dig +short cafe-delicacy-restaurant.com

# Check with specific nameserver
dig @8.8.8.8 cafe-delicacy-restaurant.com
```

### After 10-15 Minutes (Should be propagated):

```bash
# Check if DNS is updated
dig +short cafe-delicacy-restaurant.com

# Expected output: 13.233.0.43

# Test all nameservers
dig cafe-delicacy-restaurant.com

# Check from multiple DNS servers
dig @8.8.8.8 +short cafe-delicacy-restaurant.com  # Google DNS
dig @1.1.1.1 +short cafe-delicacy-restaurant.com  # Cloudflare DNS
```

### Test in Browser:

After DNS propagates (5-60 minutes):

1. **Clear browser cache** (Important!)
   - Chrome/Edge: Press `Ctrl+Shift+Delete` → Clear cache
   - Or use Incognito/Private mode

2. **Visit your site:**
   ```
   http://cafe-delicacy-restaurant.com
   http://www.cafe-delicacy-restaurant.com
   http://13.233.0.43
   ```

3. **You should see:** RK Ellite login page

---

## 🧪 Quick Verification Script

Run this after making DNS changes:

```bash
echo "🔍 DNS Verification Check"
echo "========================="
echo ""

echo "Current nameservers:"
dig +short NS cafe-delicacy-restaurant.com
echo ""

echo "Current A record:"
CURRENT_IP=$(dig +short cafe-delicacy-restaurant.com | head -1)
echo "$CURRENT_IP"
echo ""

echo "Expected IP: 13.233.0.43"
echo ""

if [ "$CURRENT_IP" = "13.233.0.43" ]; then
  echo "✅ SUCCESS! DNS is pointing to correct IP!"
  echo ""
  echo "Testing HTTP access..."
  curl -I http://cafe-delicacy-restaurant.com 2>&1 | head -5
else
  echo "⏳ DNS not updated yet. Current IP: $CURRENT_IP"
  echo "   Wait 5-15 more minutes and try again."
  echo "   DNS changes can take up to 60 minutes to fully propagate."
fi
```

---

## ⏱️ DNS Propagation Timeline

| Time | Status |
|------|--------|
| **0 min** | DNS updated in provider's system |
| **1-5 min** | Provider's nameservers updated |
| **5-15 min** | Most DNS resolvers see new IP |
| **15-60 min** | All DNS resolvers worldwide updated |
| **Up to 24-48 hrs** | Old TTL expires completely (rare) |

**Tip:** Use low TTL (300-600 seconds) for faster updates!

---

## 🚨 Common Issues & Solutions

### Issue 1: "Still seeing old IP after 1 hour"

**Solutions:**
- Clear browser cache and DNS cache
- Flush local DNS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` (macOS)
- Try different browser or incognito mode
- Check from different network (mobile data)

### Issue 2: "Changes not saving in DNS panel"

**Solutions:**
- Make sure you clicked "Save" button
- Check if you have permission to edit DNS
- Try different browser
- Contact domain registrar support

### Issue 3: "Don't see DNS management option"

**Cause:** Using custom nameservers, DNS not managed by registrar

**Solution:** 
- Check which nameservers you're using: `dig +short NS cafe-delicacy-restaurant.com`
- Update DNS where those nameservers are hosted
- OR switch back to registrar's default nameservers

### Issue 4: "Site still not accessible after DNS update"

**Don't forget:** You STILL need to update AWS Security Group!

Both must be fixed:
1. ✅ DNS pointing to 13.233.0.43
2. ✅ AWS Security Group allows port 80

See `SITE_NOT_REACHABLE_FIX.md` for Security Group instructions.

---

## 📝 DNS Record Summary

After you're done, your DNS should look like this:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 13.233.0.43 | 600 |
| A | www | 13.233.0.43 | 600 |
| (Optional) CNAME | www | cafe-delicacy-restaurant.com | 600 |

**Note:** Use either A record for www OR CNAME for www, not both.

---

## 🎯 Quick Summary - What You Need to Do

1. **Find your nameservers:** `dig +short NS cafe-delicacy-restaurant.com`

2. **Log in to DNS provider:**
   - GoDaddy: https://godaddy.com → My Products → DNS
   - AWS Route 53: https://console.aws.amazon.com/route53/
   - Cloudflare: https://dash.cloudflare.com/

3. **Update A record:**
   - Type: A
   - Name: @ (root)
   - Value: **13.233.0.43**

4. **Wait 10-60 minutes** for propagation

5. **Test:** `dig +short cafe-delicacy-restaurant.com`

6. **Access:** http://cafe-delicacy-restaurant.com

---

## 📞 Next Steps After DNS is Fixed

1. ✅ **Verify DNS:** Domain resolves to 13.233.0.43
2. ✅ **Update AWS Security Group:** Allow port 80 (see other guide)
3. ✅ **Test site:** http://cafe-delicacy-restaurant.com
4. 🔒 **Optional:** Install SSL certificate (./setup-ssl.sh)

---

**Need help?** Check which step you're stuck on and follow the specific provider instructions above.

**Last Updated:** March 16, 2026  
**Status:** Guide for DNS update to point to EC2 IP 13.233.0.43
