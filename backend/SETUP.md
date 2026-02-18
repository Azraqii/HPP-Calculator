# 🚀 SETUP BACKEND - Stackra HPP Calculator

Ikuti langkah-langkah berikut untuk setup backend:

## 1. Install Dependencies

```bash
cd backend
npm install
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

## 2. Setup Database

Pastikan PostgreSQL sudah running, lalu:

```bash
# Buat database (jika belum ada)
createdb stackra_hpp

# Atau via psql:
psql -U postgres
CREATE DATABASE stackra_hpp;
\q
```

## 3. Setup Environment Variables

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan isi nilai yang sesuai
# Minimal yang harus diubah:
# - DATABASE_URL
# - JWT_ACCESS_SECRET (gunakan string random min 32 karakter)
# - JWT_REFRESH_SECRET (gunakan string random min 32 karakter)
# - MIDTRANS_SERVER_KEY (jika sudah ada)
# - MIDTRANS_CLIENT_KEY (jika sudah ada)
```

### Generate JWT Secrets (Opsional - untuk production)
```bash
# Di terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output untuk JWT_ACCESS_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output untuk JWT_REFRESH_SECRET
```

## 4. Generate Prisma Client & Migrate Database

```bash
# Generate Prisma Client (setelah schema diubah)
npx prisma generate

# Push schema ke database
npx prisma db push

# Atau gunakan migration (recommended untuk production)
npx prisma migrate dev --name init
```

## 5. Seed Database (Opsional - untuk test data)

Buat file `prisma/seed.ts` jika mau seed data dummy.

## 6. Run Backend

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Backend akan running di `http://localhost:3000`

## 7. Test Endpoints

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get User Info (dengan token)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Get National Prices (dengan token)
```bash
curl http://localhost:3000/api/prices/national \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 8. Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Buka http://localhost:5555 untuk lihat data di database.

## Troubleshooting

### Error: Cannot find module 'cookie-parser'
```bash
npm install cookie-parser @types/cookie-parser
```

### Error: Prisma Client not generated
```bash
npx prisma generate
```

### Error: Database connection failed
- Pastikan PostgreSQL running
- Check DATABASE_URL di .env
- Test koneksi: `psql postgresql://postgres:password@localhost:5432/stackra_hpp`

### Error: JWT secret not found
- Pastikan JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET ada di .env
- Restart server setelah update .env

## Database Schema

Prisma schema sudah include:
- ✅ User (dengan password bcrypt)
- ✅ RefreshToken (untuk JWT refresh)
- ✅ UserSubscription
- ✅ Transaction
- ✅ CommodityPrice
- ✅ PriceHistory
- ✅ SystemLog

## API Endpoints

### Auth (Public)
- `POST /api/auth/register` - Daftar user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Auth (Protected)
- `GET /api/auth/me` - Get current user info

### Prices (Protected - FREE tier)
- `GET /api/prices/national` - Harga rata-rata nasional

### Prices (Protected - PREMIUM tier)
- `GET /api/prices/live?province=JAWA_BARAT` - Harga per provinsi
- `GET /api/prices/history?commodity=BERAS&days=30` - Histori harga

### Subscription (Protected)
- `GET /api/subscription/plans` - Daftar paket (public)
- `POST /api/subscription/create` - Buat transaksi
- `GET /api/subscription/info` - Status subscription user
- `GET /api/transaction/:orderId` - Status transaksi

### Webhook (No Auth)
- `POST /api/payment/webhook` - Midtrans callback
