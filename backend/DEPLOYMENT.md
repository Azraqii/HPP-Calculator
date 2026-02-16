# 🚀 Deployment Guide - Stackra HPP Calculator Backend

Complete guide untuk deployment ke production.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] PostgreSQL database provisioned
- [ ] Midtrans production keys obtained
- [ ] Frontend URL configured
- [ ] All environment variables set

### 2. Code Preparation
- [ ] All tests passing
- [ ] Environment variables moved to .env
- [ ] Scraper endpoints verified (manual inspection)
- [ ] Build successful: `npm run build`

### 3. Security Review
- [ ] JWT secret is strong (32+ characters)
- [ ] Midtrans keys are production keys
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting enabled (recommended)

## 🎯 Deployment Options

### Option 1: Railway (Recommended)

#### Step 1: Setup Database
```bash
# Railway automatically provisions PostgreSQL
# Copy DATABASE_URL from Railway dashboard
```

#### Step 2: Deploy API
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set NODE_ENV=production
railway variables set MIDTRANS_ENV=production
railway variables set MIDTRANS_SERVER_KEY=Mid-server-YOUR_KEY
railway variables set MIDTRANS_CLIENT_KEY=Mid-client-YOUR_KEY
railway variables set FRONTEND_URL=https://yourdomain.com
railway variables set JWT_SECRET=your-super-secret-key

# Deploy
railway up
```

#### Step 3: Run Migrations
```bash
railway run npm run prisma:migrate
railway run npm run prisma:generate
```

### Option 2: Render

#### Step 1: Create New Web Service
1. Go to https://render.com → New → Web Service
2. Connect GitHub repository
3. Configure:
   - **Name**: stackra-hpp-api
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build && npm run prisma:generate`
   - **Start Command**: `npm start`

#### Step 2: Add PostgreSQL Database
1. New → PostgreSQL
2. Copy Internal Database URL
3. Add to Web Service environment variables

#### Step 3: Environment Variables
Add in Render dashboard:
```
NODE_ENV=production
DATABASE_URL=[from PostgreSQL]
MIDTRANS_ENV=production
MIDTRANS_SERVER_KEY=Mid-server-YOUR_KEY
MIDTRANS_CLIENT_KEY=Mid-client-YOUR_KEY
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your-super-secret-key
```

### Option 3: DigitalOcean App Platform

```bash
# 1. Install doctl CLI
brew install doctl  # macOS
# or download from: https://docs.digitalocean.com/reference/doctl/

# 2. Authenticate
doctl auth init

# 3. Create app
doctl apps create --spec .do/app.yaml

# 4. Deploy
git push origin main
```

Create `.do/app.yaml`:
```yaml
name: stackra-hpp-api
region: sgp
services:
- name: api
  github:
    repo: your-username/your-repo
    branch: main
  build_command: npm install && npm run build && npm run prisma:generate
  run_command: npm start
  environment_slug: node-js
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: MIDTRANS_ENV
    value: production
  - key: MIDTRANS_SERVER_KEY
    value: YOUR_KEY
    type: SECRET
databases:
- name: db
  engine: PG
  version: "14"
```

## 🔧 Post-Deployment Configuration

### 1. Setup Midtrans Webhook

1. Login to https://dashboard.midtrans.com/
2. Go to: Settings → Configuration
3. Set **Payment Notification URL**:
   ```
   https://your-api-domain.com/api/payment/webhook
   ```
4. Set **Finish/Error/Pending Redirect URLs**:
   ```
   Finish:  https://your-frontend.com/payment/success
   Error:   https://your-frontend.com/payment/error
   Pending: https://your-frontend.com/payment/pending
   ```

### 2. Test Webhook

```bash
# Use webhook.site for testing
# 1. Go to https://webhook.site/
# 2. Copy your unique URL
# 3. Temporarily set as webhook URL in Midtrans
# 4. Make test payment
# 5. Verify webhook is received
# 6. Update to production URL
```

### 3. Verify Cron Jobs

```bash
# Check if cron is running
curl https://your-api.com/api/health

# Check system logs
curl https://your-api.com/api/admin/logs
```

### 4. Test Endpoints

```bash
# Health check
curl https://your-api.com/api/health

# Get plans
curl https://your-api.com/api/subscription/plans

# National prices
curl https://your-api.com/api/prices/national
```

## 🔄 Database Migrations

### Running Migrations in Production

```bash
# Railway
railway run npm run prisma:migrate deploy

# Render (connect via SSH)
# Go to Shell tab in Render dashboard
npm run prisma:migrate deploy

# DigitalOcean
doctl apps logs your-app-id
# Then run migration from dashboard console
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Scheduled backups (recommended)
# Use Railway/Render/DO automatic backups
```

## 🐛 Debugging Production Issues

### View Logs

```bash
# Railway
railway logs

# Render
# View logs in dashboard

# DigitalOcean
doctl apps logs your-app-id --follow
```

### Common Issues

#### 1. Scraper Not Working
```bash
# Check if Panel Harga API changed
# Update src/config/scraper.config.ts
# Redeploy
```

#### 2. Database Connection Failed
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:port/database?sslmode=require

# Test connection
psql $DATABASE_URL
```

#### 3. Midtrans Webhook Not Received
```bash
# Check Midtrans dashboard notifications
# Verify webhook URL is publicly accessible
# Check firewall/security groups
```

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/node

# Add to server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Uptime Monitoring

Free services:
- UptimeRobot: https://uptimerobot.com/
- Better Stack: https://betterstack.com/
- Pingdom: https://www.pingdom.com/

Monitor:
- `GET https://your-api.com/api/health` (every 5 minutes)

### 3. Performance Monitoring

```bash
# Add New Relic (optional)
npm install newrelic
# Follow: https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
```

## 🔐 Security Hardening

### 1. Rate Limiting

```bash
npm install express-rate-limit

# Add to server.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 2. API Key Rotation

```bash
# Schedule quarterly rotation:
# 1. Generate new keys in Midtrans dashboard
# 2. Update environment variables
# 3. Monitor for failed transactions
# 4. Remove old keys after 7 days
```

### 3. Database Security

```bash
# Enable SSL
DATABASE_URL="postgresql://...?sslmode=require"

# Restrict connections to app IPs only
# Configure in database provider dashboard
```

## 📈 Scaling Strategy

### Horizontal Scaling

```bash
# Railway
railway scale --replicas 3

# Render
# Upgrade to paid plan for auto-scaling

# DigitalOcean
# Edit app spec:
instance_count: 3
```

### Cron Job Separation

For high-traffic apps, run cron jobs separately:

```bash
# Create separate worker dyno
# Set ENABLE_CRON=false on main API
# Deploy worker with ENABLE_CRON=true
```

### Database Optimization

```sql
-- Add indexes for frequent queries
CREATE INDEX idx_commodity_province_date 
ON "CommodityPrice" ("commodity", "province", "priceDate");

CREATE INDEX idx_user_status 
ON "User" ("status");

CREATE INDEX idx_subscription_enddate 
ON "UserSubscription" ("endDate") 
WHERE status = 'PREMIUM';
```

## 💰 Cost Estimation

### Hobby/Starter Tier (Rp 0 - 200k/month)
- Railway Free Tier ($5 credit)
- Supabase Free (500MB)
- 1-10 users

### Growth Tier (Rp 200k - 1M/month)
- Railway Pro ($20/month)
- Supabase Pro ($25/month)
- 100-1000 users

### Scale Tier (Rp 1M+/month)
- DigitalOcean App Platform ($50-200/month)
- Managed PostgreSQL ($15-100/month)
- 1000+ users

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Railway
      run: |
        npm i -g @railway/cli
        railway login --browserless
        railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## ✅ Go-Live Checklist

- [ ] All environment variables set
- [ ] Database migrated
- [ ] Midtrans webhook configured
- [ ] SSL certificate active
- [ ] Domain pointed to API
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Backups scheduled
- [ ] Load testing completed
- [ ] Documentation updated

## 🆘 Emergency Rollback

```bash
# Railway
railway rollback

# Render
# Go to dashboard → Events → Rollback

# DigitalOcean
doctl apps list-deployments your-app-id
doctl apps create-deployment your-app-id --deployment-id PREVIOUS_ID
```

---

**Questions? Issues? Check logs first!** 🔍
