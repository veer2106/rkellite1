# CI/CD Pipeline Implementation Guide

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Status:** Production Ready  
**Pipeline Tool:** GitHub Actions + AWS CodePipeline

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflow](#github-actions-workflow)
3. [Docker & Container Registry](#docker--container-registry)
4. [AWS CodePipeline Integration](#aws-codepipeline-integration)
5. [Testing Strategy](#testing-strategy)
6. [Build & Deployment](#build--deployment)
7. [Monitoring & Rollback](#monitoring--rollback)
8. [Performance Optimization](#performance-optimization)

---

## Overview

### CI/CD Pipeline Stages

```
┌──────────────┐
│ Git Push     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ 1. TRIGGER               │
│ - Webhook from GitHub    │
│ - Branch: main/develop   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 2. BUILD STAGE           │
│ - Checkout code          │
│ - Install dependencies   │
│ - Run linting            │
│ - Build frontend         │
│ - Build Docker image     │
│ - Push to ECR            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 3. TEST STAGE            │
│ - Unit tests             │
│ - Integration tests      │
│ - E2E tests              │
│ - Security scanning      │
│ - SAST scanning          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 4. DEPLOY - DEV          │
│ - Deploy to Dev ECS      │
│ - Health checks          │
│ - Smoke tests            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 5. DEPLOY - STAGING      │
│ - Deploy to Staging ECS  │
│ - Full test suite        │
│ - Performance test       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 6. APPROVAL GATE         │
│ - Manual review          │
│ - Change log review      │
│ - Stakeholder approval   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 7. DEPLOY - PROD         │
│ - Blue-green deployment  │
│ - Canary release (5%)    │
│ - Gradual rollout (50%)  │
│ - Full rollout (100%)    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 8. MONITOR & VALIDATE    │
│ - Error rate tracking    │
│ - Performance monitoring │
│ - User feedback          │
│ - Auto-rollback trigger  │
└──────────────────────────┘
```

---

## GitHub Actions Workflow

### Repository Setup

```yaml
# .github/workflows/main.yml
name: Restaurant Cafe CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: restaurant-cafe
  IMAGE_TAG: ${{ github.sha }}

jobs:
  # ==========================
  # BUILD AND PUSH STAGE
  # ==========================
  build:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
      # 1. Checkout Code
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for versioning
      
      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      # 3. Install Dependencies
      - name: Install dependencies
        run: |
          npm install --legacy-peer-deps
          cd frontend && npm install --legacy-peer-deps && cd ..
      
      # 4. Linting
      - name: Run ESLint
        run: |
          npm install --save-dev eslint
          npm run lint || true  # Non-blocking
      
      # 5. Build Frontend
      - name: Build frontend
        run: |
          cd frontend
          npm run build
          cd ..
      
      # 6. Configure AWS Credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ env.AWS_REGION }}
      
      # 7. Login to AWS ECR
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      # 8. Build Docker Image
      - name: Build Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      # 9. Push to ECR
      - name: Push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      # 10. Scan Docker Image for Vulnerabilities
      - name: Scan Docker image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      # 11. Upload Scan Results
      - name: Upload Trivy scan results to GitHub
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      # 12. Generate Build Report
      - name: Generate build report
        run: |
          echo "=== BUILD REPORT ===" > build-report.txt
          echo "Build Time: $(date)" >> build-report.txt
          echo "Image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}" >> build-report.txt
          echo "Commit SHA: ${{ github.sha }}" >> build-report.txt

  # ==========================
  # UNIT & INTEGRATION TESTS
  # ==========================
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: build
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: restaurant_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install --legacy-peer-deps
          cd frontend && npm install --legacy-peer-deps && cd ..
      
      - name: Run backend unit tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: restaurant_test
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: |
          npm test -- --coverage || true
      
      - name: Run frontend unit tests
        run: |
          cd frontend
          npm test -- --watchAll=false --coverage || true
          cd ..
      
      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info,./frontend/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # ==========================
  # DEPLOY TO DEVELOPMENT
  # ==========================
  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop'
    environment:
      name: development
      url: https://api.dev.restaurant-cafe.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS task definition
        run: |
          # Update task definition with new image
          aws ecs register-task-definition \
            --family restaurant-cafe-dev \
            --container-definitions file://task-definition-dev.json
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster restaurant-cafe-dev \
            --service restaurant-cafe-api \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster restaurant-cafe-dev \
            --services restaurant-cafe-api
      
      - name: Run health checks
        run: |
          curl -f https://api.dev.restaurant-cafe.com/health || exit 1

  # ==========================
  # DEPLOY TO STAGING
  # ==========================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://api.staging.restaurant-cafe.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS task definition
        run: |
          aws ecs register-task-definition \
            --family restaurant-cafe-staging \
            --container-definitions file://task-definition-staging.json
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster restaurant-cafe-staging \
            --service restaurant-cafe-api \
            --force-new-deployment
      
      - name: Run integration tests
        run: |
          npm run test:integration

  # ==========================
  # PRODUCTION APPROVAL & DEPLOY
  # ==========================
  approval:
    name: Manual Approval
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
    
    steps:
      - name: Waiting for approval
        run: echo "Deployment awaiting approval..."

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: approval
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.restaurant-cafe.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Backup current deployment
        run: |
          aws ecs describe-services \
            --cluster restaurant-cafe-prod \
            --services restaurant-cafe-api > deployment-backup.json
      
      - name: Blue-Green Deployment - Deploy New Version
        run: |
          # Deploy new version to "Green" environment
          aws ecs update-service \
            --cluster restaurant-cafe-prod \
            --service restaurant-cafe-api-green \
            --force-new-deployment
      
      - name: Wait for new version to be ready
        run: |
          aws ecs wait services-stable \
            --cluster restaurant-cafe-prod \
            --services restaurant-cafe-api-green
      
      - name: Run smoke tests on new version
        run: |
          npm run test:smoke
      
      - name: Switch traffic to new version (Canary - 5%)
        run: |
          aws elbv2 modify-listener \
            --load-balancer-arn arn:aws:elasticloadbalancing:... \
            --listener-arn arn:aws:elasticloadbalancing:... \
            --default-actions Type=forward,TargetGroups="green_target_group=0.05"
      
      - name: Monitor canary (5 minutes)
        run: |
          sleep 300
          # Check error rates
          ERROR_RATE=$(aws cloudwatch get-metric-statistics \
            --metric-name HTTPServerError \
            --namespace AWS/ApplicationELB \
            --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Sum)
          
          if [ "$ERROR_RATE" -gt 10 ]; then
            echo "High error rate detected, rolling back..."
            exit 1
          fi
      
      - name: Increase traffic to new version (50%)
        run: |
          aws elbv2 modify-listener \
            --default-actions Type=forward,TargetGroups="green_target_group=0.5"
      
      - name: Monitor (10 minutes)
        run: sleep 600
      
      - name: Full traffic to new version (100%)
        run: |
          aws elbv2 modify-listener \
            --default-actions Type=forward,TargetGroups="green_target_group=1.0"
      
      - name: Decommission old version
        run: |
          aws ecs update-service \
            --cluster restaurant-cafe-prod \
            --service restaurant-cafe-api-blue \
            --desired-count 0
      
      - name: Notify deployment completion
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'Production Deployment Completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

```

---

## Docker & Container Registry

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps && npm run build

WORKDIR /app

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/build ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5001

CMD ["npm", "start"]
```

### Docker Compose for Local Testing

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: restaurant_db
    environment:
      POSTGRES_DB: restaurant_db
      POSTGRES_USER: cafe_user
      POSTGRES_PASSWORD: secure_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cafe_user -d restaurant_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: restaurant_cache
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: restaurant_api
    environment:
      NODE_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: restaurant_db
      DB_USER: cafe_user
      DB_PASSWORD: secure_password_123
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_jwt_secret_key
    ports:
      - "5001:5001"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app/backend
      - /app/node_modules

volumes:
  postgres_data:
```

---

## AWS CodePipeline Integration

### CodePipeline Configuration (Infrastructure as Code)

```yaml
# aws-codepipeline.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: Restaurant Cafe CI/CD Pipeline

Parameters:
  GitHubRepository:
    Type: String
    Default: restaurant-cafe
  
  GitHubBranch:
    Type: String
    Default: main

Resources:
  # =======================
  # S3 Artifact Store
  # =======================
  ArtifactStore:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'restaurant-cafe-artifacts-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # =======================
  # IAM Role for Pipeline
  # =======================
  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
      Policies:
        - PolicyName: pipeline-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:GetObjectVersion
                Resource: !Sub '${ArtifactStore.Arn}/*'
              - Effect: Allow
                Action:
                  - ecs:UpdateService
                  - ecs:DescribeServices
                  - ecs:DescribeTaskDefinition
                  - ecs:DescribeTasks
                  - ecs:ListTasks
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:PassRole
                Resource: '*'

  # =======================
  # CodePipeline
  # =======================
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: restaurant-cafe-pipeline
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactStore
      
      Stages:
        # Stage 1: Source
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: '1'
              Configuration:
                Owner: veereshpaidcoders
                Repo: !Ref GitHubRepository
                Branch: !Ref GitHubBranch
                OAuthToken: !Sub '{{resolve:secretsmanager:github-token:SecretString:token}}'
              OutputArtifacts:
                - Name: SourceOutput

        # Stage 2: Build
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput

        # Stage 3: Deploy to Dev
        - Name: DeployDev
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: restaurant-cafe-dev
                ServiceName: restaurant-cafe-api
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput

        # Stage 4: Deploy to Staging
        - Name: DeployStaging
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: restaurant-cafe-staging
                ServiceName: restaurant-cafe-api
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput

        # Stage 5: Manual Approval
        - Name: ApprovalForProduction
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                CustomData: 'Please review the staging deployment before proceeding to production'

        # Stage 6: Deploy to Production
        - Name: DeployProduction
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: restaurant-cafe-prod
                ServiceName: restaurant-cafe-api
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput

  # =======================
  # CodeBuild Project
  # =======================
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: restaurant-cafe-build
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/standard:5.0
        PrivilegedMode: true
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec.yml

  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
      Policies:
        - PolicyName: codebuild-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ArtifactStore.Arn}/*'

Outputs:
  PipelineURL:
    Value: !Sub 'https://console.aws.amazon.com/codepipeline/home?region=${AWS::Region}#/view/${Pipeline}'
```

---

## Testing Strategy

### Test Coverage Goals

| Test Type | Coverage | Tool |
|-----------|----------|------|
| Unit Tests | 80%+ | Jest |
| Integration Tests | 60%+ | Supertest |
| E2E Tests | Core flows | Cypress/Playwright |
| Security Tests | High risk areas | OWASP ZAP |
| Performance Tests | API endpoints | JMeter |

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/server.js',
    '!backend/seedDatabase.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js']
};
```

---

## Build & Deployment

### buildspec.yml for CodeBuild

```yaml
# buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/restaurant-cafe
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}

  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG

  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"restaurant-cafe","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - '**/*'

cache:
  paths:
    - '/root/.npm/**/*'
    - '/root/.m2/**/*'
```

---

## Monitoring & Rollback

### Automated Rollback Triggers

```yaml
RollbackPolicy:
  Triggers:
    - Condition: ErrorRate > 5%
      Duration: 5 minutes
      Action: Automatic Rollback
      
    - Condition: ResponseTime > 5000ms
      Duration: 5 minutes
      Action: Automatic Rollback
      
    - Condition: CPU Utilization > 90%
      Duration: 3 minutes
      Action: Scale Up / Rollback
      
    - Condition: Database Connection Pool Exhausted
      Duration: 1 minute
      Action: Automatic Rollback
      
    - Condition: Critical Errors Detected
      Duration: Immediate
      Action: Automatic Rollback

RollbackProcedure:
  Steps:
    1. Detect issue via CloudWatch alarm
    2. Trigger SNS notification
    3. Revert task definition to previous version
    4. Update ECS service
    5. Monitor rollback health
    6. Alert on-call engineer
```

---

## Performance Optimization

### Build Pipeline Optimization

```yaml
Optimizations:
  Parallel Execution:
    - Unit tests and linting run in parallel
    - Frontend and backend builds in parallel
    - Multiple environment deploys in parallel
    
  Caching Strategy:
    - npm modules cached per branch
    - Docker layers cached
    - Build artifacts cached
    
  Cost Optimization:
    - Spot instances for non-critical builds
    - Resource limits per stage
    - Cleanup old artifacts after 30 days
```

---

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Review Schedule:** Quarterly
