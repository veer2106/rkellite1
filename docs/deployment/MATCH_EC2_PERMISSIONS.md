# Match a new EC2 instance to an existing one (same “permissions”)

Use this when **13.233.0.43** works and **13.232.134.214** (new Elastic IP) should behave the same for **network access** and similar **AWS permissions**.

## 1. Security groups (most important: SSH, HTTP, HTTPS)

**Console (recommended)**

1. Open **EC2 → Instances**.
2. Select the **working** instance (public IP **13.233.0.43**).
3. Open the **Security** tab → note **Security groups** (e.g. `sg-abc123`).
4. Select the **new** instance (**13.232.134.214**).
5. **Actions → Security → Change security groups**.
6. **Attach the same security group(s)** as the working instance (add them, remove the restrictive default if needed).
7. **Save**.

Result: same **inbound** rules (e.g. 22, 80, 443, 5001) as the old box.

**CLI (optional)** — replace IDs with yours:

```bash
OLD_INSTANCE_ID=i-xxxxxxxx   # instance that has 13.233.0.43
NEW_INSTANCE_ID=i-yyyyyyyy   # instance that has 13.232.134.214

# Security groups on the working instance
aws ec2 describe-instances --instance-ids "$OLD_INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].SecurityGroups[*].GroupId' --output text

# Attach those same SGs to the new instance (example: one SG)
aws ec2 modify-instance-attribute --instance-id "$NEW_INSTANCE_ID" \
  --groups sg-abc123 sg-def456
```

## 2. IAM instance profile (S3, Secrets Manager, etc.)

If the old instance has an **IAM role** attached:

1. **EC2 → Instances → working instance → Security tab → IAM role**.
2. **New instance → Actions → Security → Modify IAM role** → choose the **same role**.

## 3. Subnet / public IP

The new instance must be in a **public subnet** with a route to an **Internet Gateway** if you use a **public Elastic IP** like **13.232.134.214**. Match **subnet / “Auto-assign public IP”** behavior to the working instance if you need the same reachability.

## 4. SSH key (`cafe.pem`)

- The **key pair** is chosen **at instance launch**; you cannot “copy” a key from the old server to AWS’s key-pair setting.
- Use **`cafe.pem`** only if the **new** instance was launched with the **cafe** key pair (or you’ve installed that public key on the instance yourself).
- Deploy from your machine:

```bash
export EC2_IP=13.232.134.214
export SSH_KEY=./cafe.pem
bash deploy-new-instance.sh
```

## 5. Quick checklist

| Item | Match old instance? |
|------|---------------------|
| Same **security group(s)** | Yes, for same ports |
| Same **IAM role** (if used) | Optional but recommended |
| **Elastic IP** associated | Yes, to the new instance’s primary ENI |
| **User** for SSH | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) |

## 6. If SSH still fails

- **Permission denied (publickey)** → wrong `.pem` for that instance’s key pair, or wrong user (`ubuntu` vs `ec2-user`).
- **Timeout** → security group / NACL / instance stopped / wrong IP.

After security groups match, test:

```bash
chmod 400 cafe.pem
ssh -i cafe.pem ec2-user@13.232.134.214
# or: ssh -i cafe.pem ubuntu@13.232.134.214
```
