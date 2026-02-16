# 🏗️ Stackra HPP Calculator - Backend API

Production-ready SaaS backend untuk UMKM F&B dengan fitur scraping harga komoditas real-time, premium subscription, dan Midtrans payment integration.

## 🎯 Features

### Core Features
- ✅ **Real-time Price Scraping** - Automatic daily scraping from Panel Harga Badan Pangan
- ✅ **Tier-based Access Control** - Free vs Premium user management
- ✅ **Midtrans Payment Integration** - Subscription payment with Snap API
- ✅ **Database Design** - Complete Prisma schema with relations
- ✅ **Cron Jobs** - Automated tasks for scraping & subscription management
- ✅ **RESTful API** - Clean, documented endpoints

### Free Tier Features
- Manual price input
- National average commodity prices
- Basic HPP calculator
- Up to 10 ingredients

### Premium Tier Features (Rp 49,000/month)
- 🔥 Live province-specific prices
- 📊 Historical price trends
- ♾️ Unlimited ingredients
- 📄 Export reports (PDF/Excel)
- 🌍 Multi-location support
- 🎯 Priority support

## 🏛️ Architecture

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
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Clone or navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npm run prisma:migrate
npm run prisma:generate

# 5. Start development server
npm run dev
```

Server will run on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── scraper.config.ts  # Scraper configuration
│   ├── controllers/
│   │   ├── prices.controller.ts
│   │   └── subscription.controller.ts
│   ├── middlewares/
│   │   └── premium.middleware.ts  # Access control
│   ├── services/
│   │   ├── scraper.service.ts     # Web scraping logic
│   │   └── payment.service.ts     # Midtrans integration
│   ├── cron.ts                # Scheduled jobs
│   ├── routes.ts              # API routes
│   └── server.ts              # Main entry point
├── .env.example
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Public Endpoints

```bash
GET  /api/health              # Health check
GET  /api/subscription/plans  # Available subscription plans
GET  /api/prices/provinces    # List of provinces
GET  /api/prices/commodities  # List of commodities
```

### Authenticated Endpoints

```bash
# Free Tier
GET  /api/prices/national     # National average prices

# Premium Tier (requires subscription)
GET  /api/prices/live?province=JAWA_BARAT
GET  /api/prices/history?commodity=BERAS&days=30
```

### Subscription Management

```bash
POST /api/subscription/create
Body: { "plan": "MONTHLY" }

GET  /api/subscription/info
GET  /api/transaction/:orderId
```

### Webhooks

```bash
POST /api/payment/webhook     # Midtrans callback (no auth)
```

## 💳 Midtrans Integration

### Setup Steps

1. **Register at Midtrans**
   - Visit: https://dashboard.midtrans.com/register
   - Create account and verify email

2. **Get API Keys**
   - Go to: Settings → Access Keys
   - Copy Server Key and Client Key
   - Update `.env`:
     ```
     MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_KEY
     MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_KEY
     ```

3. **Configure Webhook**
   - Go to: Settings → Configuration
   - Set Payment Notification URL:
     ```
     https://your-api.com/api/payment/webhook
     ```

### Payment Flow

```
1. User clicks "Subscribe Premium"
2. Frontend calls: POST /api/subscription/create
3. Backend creates transaction & gets Snap token
4. Frontend shows Midtrans Snap popup
5. User completes payment
6. Midtrans sends webhook to backend
7. Backend verifies signature & activates subscription
```

### Test Payment (Sandbox)

Use these test credit cards:
- **Success**: `4811 1111 1111 1114` (CVV: 123, Exp: 01/25)
- **Failure**: `4911 1111 1111 1113`

## 🕒 Cron Jobs

### 1. Daily Price Scraper
```
Schedule: Every day at 06:00 AM WIB
Function: Scrapes commodity prices from Panel Harga
```

### 2. Hourly Subscription Check
```
Schedule: Every hour
Function: Check and expire old subscriptions
```

### 3. Weekly Cleanup
```
Schedule: Sunday at 02:00 AM WIB
Function: Clean old logs and deactivate old prices
```

## 🔍 Web Scraper

### How It Works

```typescript
// 1. Try API endpoint first (fast)
const result = await scrapeViaAPI();

// 2. Fallback to Puppeteer if API fails
if (!result) {
  const result = await scrapeViaPuppeteer();
}

// 3. Upsert to database
await upsertPricesToDatabase(result);
```

### Manual Inspection Required

Before running in production, manually inspect the target website:

1. Open Chrome DevTools → Network tab
2. Visit https://panelharga.badanpangan.go.id/
3. Look for XHR/Fetch requests returning JSON
4. Update `src/config/scraper.config.ts` with real endpoints

### Manual Scraper Run

```bash
# Trigger scraper manually (admin only)
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 💾 Database Schema

### Key Models

```prisma
User
├── subscriptions  (UserSubscription[])
└── transactions   (Transaction[])

UserSubscription
├── user           (User)
└── transaction    (Transaction)

Transaction
├── user           (User)
└── subscription   (UserSubscription?)

CommodityPrice
├── commodity      (BERAS, CABAI, etc)
├── province       (JAWA_BARAT, etc)
└── price          (Int)
```

### Relationships
- User → UserSubscription (1:N)
- User → Transaction (1:N)
- Transaction → UserSubscription (1:1 optional)

## 🔐 Security

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Signature verification for webhooks
- ✅ Environment variable secrets
- ✅ Prisma SQL injection prevention
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add JWT authentication

## 🧪 Testing

```bash
# Test subscription creation
curl -X POST http://localhost:3000/api/subscription/create \
  -H "Content-Type: application/json" \
  -d '{"plan": "MONTHLY"}'

# Test national prices
curl http://localhost:3000/api/prices/national

# Test premium prices (will fail without subscription)
curl http://localhost:3000/api/prices/live?province=JAWA_BARAT
```

## 📊 Monitoring

### System Logs
All critical events are logged to `SystemLog` table:
- Scraper success/failures
- Payment success/failures
- Subscription created/expired

### View Logs
```bash
# Access Prisma Studio
npm run prisma:studio

# Go to SystemLog table
http://localhost:5555
```

## 🚢 Deployment

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
MIDTRANS_ENV=production
MIDTRANS_SERVER_KEY=Mid-server-PROD_KEY
FRONTEND_URL=https://yourdomain.com
```

### Build for Production
```bash
npm run build
npm start
```

### Recommended Hosting
- **API**: Railway, Render, DigitalOcean
- **Database**: Supabase, Railway, Neon
- **Scraper**: Separate worker dyno/container

## 🐛 Troubleshooting

### Scraper Not Working
1. Check `SystemLog` table for errors
2. Manually inspect Panel Harga website (APIs might have changed)
3. Update endpoints in `scraper.config.ts`
4. Test with Postman/curl first

### Payment Webhook Not Received
1. Check Midtrans dashboard → Transaction → Notification URL
2. Make sure webhook URL is publicly accessible
3. Check signature verification
4. View logs: `SELECT * FROM "SystemLog" WHERE type = 'PAYMENT_FAILED'`

### Subscription Not Activating
1. Check Transaction status: `SELECT * FROM "Transaction" WHERE "orderId" = ?`
2. Check webhook was received: `SELECT * FROM "SystemLog" WHERE message LIKE '%webhook%'`
3. Verify Midtrans signature is correct

## 📞 Support

- Documentation: See `ARCHITECTURE.md`
- API Setup Guide: See `API_SETUP.md` (frontend)
- Midtrans Docs: https://docs.midtrans.com/

## 📝 License

MIT License - See LICENSE file

---

**Built with ❤️ for UMKM F&B Indonesia**
