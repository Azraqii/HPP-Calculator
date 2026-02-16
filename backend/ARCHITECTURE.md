# Stackra HPP Calculator - Backend Architecture

## 🏗️ System Overview

Production-ready SaaS backend untuk UMKM F&B dengan premium monetization model.

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Payment**: Midtrans Snap
- **Scraper**: Axios + Cheerio/Puppeteer fallback
- **Scheduler**: node-cron
- **Auth**: JWT (recommended: add implementation)

### Architecture Pattern
```
┌─────────────────────────────────────────────────┐
│           CLIENT (React Frontend)                │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           API GATEWAY (Express)                  │
│   ┌──────────────────────────────────────┐      │
│   │  Middlewares: Auth, Premium Check    │      │
│   └──────────────────────────────────────┘      │
└───────┬──────────────────┬──────────────────────┘
        │                  │
┌───────▼─────────┐  ┌────▼──────────────────────┐
│  FREE Endpoints │  │  PREMIUM Endpoints        │
│  - National avg │  │  - Province prices        │
│  - Manual input │  │  - Live updates           │
└─────────────────┘  └───────────────────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │   Scraper Service      │
                    │   (Cron: Daily 06:00)  │
                    └────────────────────────┘

┌────────────────────────────────────────────────┐
│         PostgreSQL Database                     │
│  - Users (Free/Premium)                        │
│  - CommodityPrices (Province-specific)         │
│  - Subscriptions (Active/Expired)              │
│  - Transactions (Payment history)              │
└────────────────────────────────────────────────┘
```

## 📊 Monetization Model

### Free Tier
- ✅ Manual price input
- ✅ National average prices only
- ✅ Basic HPP calculator
- ✅ Up to 10 ingredients

### Premium Tier (Rp 49,000/month)
- ✅ All Free features
- ✅ **Live province-specific prices**
- ✅ Historical price trends
- ✅ Unlimited ingredients
- ✅ Export reports (PDF/Excel)
- ✅ Multi-location support
- ✅ Priority support

## 🔄 Data Flow

### 1. Scraper Pipeline
```
Panel Harga Website → Scraper Service → Upsert DB → Cache → API Response
```

### 2. Premium Access Flow
```
User Request → JWT Verify → Check Subscription → 
  ├─ Premium: Return Province Data
  └─ Free: Return National Average Only
```

### 3. Payment Flow
```
User Click Subscribe → Create Transaction → Midtrans Snap Token → 
Payment Page → Webhook Callback → Update Subscription → Grant Access
```

## 🔐 Security Considerations

- [ ] Rate limiting per user tier
- [ ] API key rotation for scraper
- [ ] Encrypted payment data
- [ ] CORS configuration
- [ ] Environment variables for secrets
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS protection

## 📈 Scalability Notes

- Scraper runs independent from API server
- Cache layer (Redis recommended for production)
- Database indexing on frequently queried fields
- Horizontal scaling ready (stateless design)
