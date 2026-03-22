# System Architecture & Infrastructure Documentation

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Status:** Enterprise Grade  
**Audience:** Architects, Senior Engineers, DevOps

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Architecture](#application-architecture)
3. [Infrastructure Components](#infrastructure-components)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [High Availability & DR](#high-availability--dr)
7. [Performance Optimization](#performance-optimization)
8. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet Users                        │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
      ┌────▼─────┐              ┌──────▼───────┐
      │   CDN    │              │   Route 53   │
      │CloudFront│              │  (DNS, LB)   │
      └────┬─────┘              └──────┬───────┘
           │                           │
           │      ┌────────────────────┘
           │      │
      ┌────▼──────▼─────────────────┐
      │   AWS Application Load      │
      │   Balancer (443, 80)        │
      └────┬──────────────────────┬─┘
           │                      │
    ┌──────▼──────────┐   ┌──────▼──────────┐
    │  ECS Cluster    │   │   CloudFront    │
    │  (API Backend)  │   │ (Static Assets) │
    │  - Task 1       │   │                 │
    │  - Task 2       │   │  ┌────────────┐ │
    │  - Task 3       │   │  │ S3 Bucket  │ │
    │  - Task N       │   │  │(React SPA) │ │
    └──────┬──────────┘   └────────────────┘
           │
      ┌────┴────────────────────────┐
      │                             │
      │                        ┌────▼──────────┐
      │                        │  AWS Secrets  │
      │                        │   Manager     │
      │                        └───────────────┘
      │
  ┌───▼────────────────────────┐
  │    Data Layer              │
  ├────────────────────────────┤
  │ ┌──────────────────────┐   │
  │ │   RDS PostgreSQL     │   │
  │ │   - Primary          │   │
  │ │   - Multi-AZ         │   │
  │ │   - Automated Backup │   │
  │ └──────────────────────┘   │
  │                            │
  │ ┌──────────────────────┐   │
  │ │   ElastiCache Redis  │   │
  │ │   - Session Cache    │   │
  │ │   - Rate Limiting    │   │
  │ │   - Queue            │   │
  │ └──────────────────────┘   │
  │                            │
  │ ┌──────────────────────┐   │
  │ │   S3 Buckets         │   │
  │ │   - Logs             │   │
  │ │   - Backups          │   │
  │ │   - User Uploads     │   │
  │ └──────────────────────┘   │
  └────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Monitoring & Observability Layer                  │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │  CloudWatch  │ │  Prometheus  │ │   X-Ray      │        │
│ │  (Metrics)   │ │  (Metrics)   │ │ (Tracing)    │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │    Grafana   │ │  CloudWatch  │ │    Sentry    │        │
│ │  (Dashboard) │ │   (Logs)     │ │  (Errors)    │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Architecture

### Microservices Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    API Gateway (Kong/Nginx)                │
│         - Authentication (JWT)                             │
│         - Rate Limiting                                    │
│         - Request Validation                               │
│         - Request/Response Transformation                  │
└────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────────┐  ┌────▼────────┐  ┌────▼────────┐
    │   Auth     │  │   Order     │  │  Inventory  │
    │  Service   │  │  Service    │  │  Service    │
    │            │  │             │  │             │
    │ - Login    │  │ - Create    │  │ - Track     │
    │ - Register │  │ - Update    │  │ - Update    │
    │ - Logout   │  │ - Track     │  │ - Report    │
    │ - Refresh  │  │ - Report    │  │             │
    └────┬───────┘  └────┬────────┘  └────┬────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Message Queue   │
                │  (RabbitMQ/Redis) │
                │                   │
                │ - Order Events    │
                │ - Inventory Sync  │
                │ - Notifications   │
                └────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────────┐  ┌────▼────────┐  ┌───▼────────┐
    │  Mailer    │  │   Analytics │  │ Notification
    │  Service   │  │  Service    │  │  Service
    └────────────┘  └─────────────┘  └────────────┘
```

### Component Dependencies

```
Frontend (React SPA)
    ├─ Component Layer
    │   ├─ Login Component
    │   ├─ Dashboard Component
    │   ├─ Orders Component
    │   ├─ Inventory Component
    │   └─ Admin Component
    │
    ├─ State Management (Redux)
    │   ├─ Auth Reducer
    │   ├─ Order Reducer
    │   ├─ Inventory Reducer
    │   └─ UI Reducer
    │
    ├─ Services Layer
    │   ├─ API Client (Axios)
    │   │   └─ Token Interceptors
    │   ├─ Authentication Service
    │   ├─ Order Service
    │   └─ Inventory Service
    │
    └─ Utilities
        ├─ Helpers
        ├─ Constants
        └─ Formatters

Backend (Node.js/Express)
    ├─ Controllers
    │   ├─ Auth Controller
    │   ├─ Order Controller
    │   ├─ Inventory Controller
    │   ├─ Menu Controller
    │   ├─ Customer Controller
    │   ├─ Staff Controller
    │   ├─ Reservation Controller
    │   └─ Report Controller
    │
    ├─ Models (Sequelize ORM)
    │   ├─ User Model
    │   ├─ Order Model
    │   ├─ MenuItem Model
    │   ├─ InventoryItem Model
    │   ├─ Customer Model
    │   ├─ Reservation Model
    │   └─ Table Model
    │
    ├─ Middleware
    │   ├─ Authentication
    │   ├─ Authorization
    │   ├─ Error Handling
    │   ├─ Logging
    │   └─ Validation
    │
    ├─ Routes
    │   ├─ Auth Routes
    │   ├─ Order Routes
    │   ├─ Inventory Routes
    │   ├─ Menu Routes
    │   └─ Admin Routes
    │
    ├─ Services (Business Logic)
    │   ├─ Authentication Service
    │   ├─ Order Service
    │   ├─ Inventory Service
    │   ├─ Payment Service
    │   ├─ Email Service
    │   └─ Notification Service
    │
    ├─ Database
    │   └─ PostgreSQL (Sequelize ORM)
    │
    └─ Cache
        └─ Redis (Sessions, Rate Limit)
```

---

## Infrastructure Components

### AWS Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ECS Fargate** | Container orchestration | 3 tasks, t3.large, 2 vCPU, 4GB RAM |
| **RDS PostgreSQL** | Primary database | Multi-AZ, 100GB, db.t3.medium, automated backups |
| **ElastiCache Redis** | Caching & sessions | cache.t3.medium, 3 nodes (Multi-AZ) |
| **ALB** | Load balancing | Port 80/443, health checks every 30s |
| **CloudFront** | CDN | Edge locations worldwide, cache 24 hours |
| **S3** | Static assets & backups | Versioning, encryption, lifecycle policies |
| **Route 53** | DNS & traffic routing | Health checks, failover routing |
| **Secrets Manager** | Secret management | Automatic rotation, encryption |
| **CloudWatch** | Monitoring & logs | Custom metrics, alarms, dashboards |
| **X-Ray** | Distributed tracing | Service map, latency tracking |

### Network Architecture

```
┌─────────────────────────────────────────────────┐
│         AWS Region: us-east-1                   │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ VPC: 10.0.0.0/16                       │  │
│  │                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  Public      │  │  Public      │   │  │
│  │  │  Subnet AZ1  │  │  Subnet AZ2  │   │  │
│  │  │ 10.0.1.0/24  │  │ 10.0.2.0/24  │   │  │
│  │  │              │  │              │   │  │
│  │  │ - ALB        │  │ - NAT        │   │  │
│  │  │ - Bastion    │  │ - Gateway    │   │  │
│  │  └──────────────┘  └──────────────┘   │  │
│  │          ▲                    ▲         │  │
│  │          │ (IGW)              │        │  │
│  │  ┌───────┴──────────────────┐ │       │  │
│  │  │   Internet Gateway       │ │       │  │
│  │  └──────────────────────────┘ │       │  │
│  │                               │        │  │
│  │  ┌──────────────┐  ┌──────────┘────┐ │  │
│  │  │  Private     │  │  Private      │ │  │
│  │  │  Subnet AZ1  │  │  Subnet AZ2   │ │  │
│  │  │ 10.0.3.0/24  │  │ 10.0.4.0/24   │ │  │
│  │  │              │  │               │ │  │
│  │  │ - ECS Tasks  │  │ - ECS Tasks   │ │  │
│  │  │ - RDS        │  │ - RDS (Read)  │ │  │
│  │  │ - ElastiCache│  │ - ElastiCache │ │  │
│  │  └──────────────┘  └───────────────┘ │  │
│  │                                       │  │
│  │  ┌──────────────────────────────────┐ │  │
│  │  │  Database Subnet Group          │ │  │
│  │  │  - Multi-AZ RDS Standby        │ │  │
│  │  └──────────────────────────────────┘ │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Security Groups:
  ALB SG: Allow 80, 443 from anywhere
  ECS SG: Allow 5001 from ALB SG
  RDS SG: Allow 5432 from ECS SG
  ElastiCache SG: Allow 6379 from ECS SG
```

---

## Data Flow

### User Authentication Flow

```
1. User Login Request
   ├─ POST /api/auth/login
   ├─ { email, password }
   └─ ALB → ECS Task

2. Backend Processing
   ├─ Validate input
   ├─ Hash password check
   ├─ Generate JWT token
   ├─ Store session in Redis
   └─ Return token + user info

3. Frontend Storage
   ├─ localStorage.setItem('token', jwt)
   ├─ Redux store.dispatch(LOGIN_SUCCESS)
   └─ Redirect to dashboard

4. Protected Requests
   ├─ Include token in Authorization header
   ├─ Middleware validates JWT
   ├─ Redis check for active session
   └─ Allow request to proceed
```

### Order Processing Flow

```
1. Create Order
   ├─ POST /api/orders
   ├─ Validate items in stock
   ├─ Create Order record (DB)
   ├─ Emit "order:created" event
   └─ Return order ID

2. Message Queue
   ├─ Message: "order:created"
   ├─ Subscribers:
   │   ├─ Inventory Service (Decrement stock)
   │   ├─ Notification Service (Send SMS/Email)
   │   └─ Analytics Service (Log event)
   └─ Acknowledge processing

3. Payment Processing
   ├─ POST /api/orders/{id}/payment
   ├─ Call Stripe API
   ├─ Update Order status
   ├─ Emit "payment:completed"
   └─ Kitchen notification

4. Inventory Update
   ├─ Consume "order:created" event
   ├─ Decrement stock quantities
   ├─ Log inventory transaction
   ├─ Check low stock threshold
   └─ Alert if needed

5. Cache Invalidation
   ├─ Invalidate order cache
   ├─ Invalidate inventory cache
   ├─ Update real-time dashboard
   └─ WebSocket notifications
```

---

## Security Architecture

### Defense Layers

```
Layer 1: Edge Protection
├─ CloudFront WAF
├─ DDoS Protection (AWS Shield)
└─ Rate limiting

Layer 2: Network Level
├─ VPC Security Groups
├─ NACLs (Network ACLs)
├─ VPN/Bastion Host
└─ Private subnets for sensitive resources

Layer 3: Application Level
├─ JWT Authentication
├─ Role-Based Access Control (RBAC)
├─ Input Validation
├─ SQL Injection Prevention (ORM)
├─ CORS Policy
└─ CSRF Tokens

Layer 4: Data Level
├─ Encryption at Rest (KMS)
├─ Encryption in Transit (TLS 1.2+)
├─ Database encryption
├─ S3 bucket encryption
└─ Secrets encryption

Layer 5: Monitoring
├─ CloudWatch logs
├─ CloudTrail audit logs
├─ GuardDuty threat detection
├─ Security Hub
└─ Intrusion detection
```

### Secrets Management

```
AWS Secrets Manager
├─ Database credentials
├─ JWT secret keys
├─ API keys
│   ├─ Stripe
│   ├─ SendGrid
│   └─ Third-party services
├─ OAuth credentials
└─ SSL certificates

Rotation Policy:
├─ Database passwords: 90 days
├─ API keys: 60 days
├─ JWT secrets: On compromise
└─ SSL certs: Auto-renewal 30 days before expiry
```

---

## High Availability & DR

### Availability Strategy

```
RTO (Recovery Time Objective): 15 minutes
RPO (Recovery Point Objective): 5 minutes

Failover Mechanism:
├─ Multi-AZ RDS (Automatic failover 1-2 min)
├─ ECS Auto-healing (Replace failed tasks)
├─ ElastiCache Multi-node (Automatic failover)
├─ ALB health checks (Remove failed targets)
└─ Route 53 health-based routing

Backup Strategy:
├─ Database: Automated daily, point-in-time recovery
├─ S3: Versioning enabled, cross-region replication
├─ Configuration: Infrastructure as Code (Terraform)
└─ Application: Blue-green deployment capability
```

### Disaster Recovery Plan

```
Scenario 1: Single AZ Failure
└─ Response: Failover to standby RDS, redeploy ECS in other AZ

Scenario 2: Region Failure
├─ Restore from cross-region backup
├─ Redeploy infrastructure to backup region
├─ Update DNS to point to backup region
└─ RTO: 30 minutes, RPO: 6 hours

Scenario 3: Data Corruption
├─ Use RDS point-in-time recovery
├─ Restore to a point before corruption
└─ RTO: 15 minutes, RPO: 5 minutes

Scenario 4: Complete Infrastructure Failure
├─ Restore Terraform state from S3
├─ Rebuild infrastructure automatically
├─ Restore database from backup
├─ Restore application state
└─ RTO: 1 hour, RPO: 1 hour
```

---

## Performance Optimization

### Frontend Optimization

```
Frontend Build Size Target: < 2 MB (gzipped)
├─ Code Splitting
│   ├─ Lazy load routes
│   ├─ Lazy load components
│   └─ Dynamic imports
├─ Tree Shaking
│   └─ Remove unused code
├─ Image Optimization
│   ├─ Compress images
│   ├─ WebP format
│   └─ Responsive images
└─ Caching Strategy
    ├─ CloudFront cache
    ├─ Browser cache
    └─ Service worker cache

Lighthouse Score Target: 90+
├─ Performance: 90+
├─ Accessibility: 90+
├─ Best Practices: 90+
└─ SEO: 95+
```

### Backend Optimization

```
API Response Time Target: < 200ms (p95)
├─ Database Query Optimization
│   ├─ Indexes on frequently queried fields
│   ├─ Connection pooling
│   └─ Query caching
├─ Redis Caching
│   ├─ Cache hot data
│   ├─ TTL-based expiry
│   └─ Cache invalidation
├─ Horizontal Scaling
│   ├─ Load balancing
│   ├─ Auto-scaling
│   └─ Connection pooling
└─ Code Optimization
    ├─ Async/await
    ├─ Batch operations
    └─ Efficient algorithms
```

---

## Cost Optimization

### Infrastructure Cost Estimate

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **ECS Fargate** | $150-200 | 3 tasks, t3.large |
| **RDS PostgreSQL** | $100-150 | Multi-AZ, 100GB |
| **ElastiCache** | $50-80 | cache.t3.medium |
| **ALB** | $25-35 | 1 ALB, data processing |
| **NAT Gateway** | $35 | Data transfer |
| **CloudFront** | $30-50 | CDN data transfer |
| **S3** | $20-30 | Storage + requests |
| **CloudWatch** | $15-25 | Logs + metrics |
| **Route 53** | $5-10 | Hosted zones + queries |
| **Secrets Manager** | $10 | Secret storage |
| **Data Transfer** | $50-100 | EC2 to Internet |
| **Total Estimate** | **$500-750/month** | For production |

### Cost Optimization Strategies

```
1. Reserved Instances
   ├─ Commit to 1-year term
   ├─ Save 30-40% on EC2 costs
   └─ Pre-purchase for predictable workloads

2. Spot Instances
   ├─ Use for non-critical workloads
   ├─ Save 70-80% on EC2 costs
   └─ Good for batch jobs, testing

3. Right-Sizing
   ├─ Monitor actual usage
   ├─ Downsize over-provisioned resources
   └─ Use appropriate instance types

4. Auto-Scaling
   ├─ Scale based on demand
   ├─ Reduce costs during low-traffic periods
   └─ Maintain performance during peaks

5. Storage Optimization
   ├─ Use S3 intelligent tiering
   ├─ Archive old logs
   ├─ Compress data
   └─ Delete unnecessary data
```

---

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Review Schedule:** Quarterly
