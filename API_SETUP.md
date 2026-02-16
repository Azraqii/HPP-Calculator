# Setup API Harga Pasar Real-Time

Aplikasi ini sudah siap untuk integrasi dengan API harga pasar real. Saat ini menggunakan **simulasi harga** sebagai fallback, tapi Anda bisa connect ke API real.

## 🔧 Cara Setup API

### 1. Buka file `src/utils/db.ts`

### 2. Edit konfigurasi API di bagian atas file:

```typescript
const MARKET_API_CONFIG = {
  enabled: true,  // Set true untuk aktifkan API
  endpoint: 'https://api-anda.com/market-prices',  // API endpoint Anda
  apiKey: 'YOUR_API_KEY_HERE',  // API key (jika diperlukan)
};
```

## 📡 Format Response API yang Diharapkan

API Anda harus return JSON dengan format:

```json
{
  "price": 15000,
  "ingredient": "Kopi",
  "timestamp": "2026-02-15T10:30:00Z"
}
```

Atau alternatif:

```json
{
  "marketPrice": 15000,
  "name": "Kopi"
}
```

## 🌐 Opsi API yang Bisa Digunakan

### Option 1: Custom Backend (Recommended)
Buat backend sendiri dengan Express.js/FastAPI yang scrape harga dari:
- Tokopedia
- Bukalapak  
- Shopee
- Website supplier bahan makanan

**Contoh Simple Backend (Node.js/Express):**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Mock database atau scraping results
const marketPrices = {
  'kopi': 15000,
  'gula': 12000,
  'susu': 18000,
  'tepung': 8000,
};

app.get('/market-prices', (req, res) => {
  const ingredient = req.query.ingredient?.toLowerCase();
  const price = marketPrices[ingredient] || null;
  
  res.json({
    price: price,
    ingredient: ingredient,
    timestamp: new Date().toISOString()
  });
});

app.listen(3001, () => {
  console.log('Market API running on http://localhost:3001');
});
```

Lalu set di config:
```typescript
endpoint: 'http://localhost:3001/market-prices',
```

**Atau dengan Python/FastAPI:**

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

market_prices = {
    'kopi': 15000,
    'gula': 12000,
    'susu': 18000,
    'tepung': 8000,
}

@app.get("/market-prices")
def get_market_price(ingredient: str):
    price = market_prices.get(ingredient.lower())
    return {
        "price": price,
        "ingredient": ingredient,
        "timestamp": datetime.now().isoformat()
    }

# Run: uvicorn main:app --port 3001 --reload
```

### Option 2: API Commodity (Global)
- **Commodity API**: https://commodity-api.com/
- **Alpha Vantage**: https://www.alphavantage.co/
- Cocok untuk: Kopi, Gula, Gandum, dll (komoditas global)

### Option 3: E-commerce API (Kompleks)
- Tokopedia API (butuh OAuth & merchant account)
- Shopee API (butuh partner access)

## 🧪 Testing Mode

Untuk testing, API saat ini **disabled** (pakai simulasi). Untuk enable:

1. Set `enabled: true` di `MARKET_API_CONFIG`
2. Masukkan endpoint API Anda
3. Save dan refresh aplikasi

## 💡 Tips

- **Cache**: API response di-cache 30 detik untuk efisiensi
- **Fallback**: Jika API gagal, otomatis pakai simulasi
- **CORS**: Jika ada CORS error, pakai CORS proxy atau setup backend

## 🔒 Security Note

Jangan commit API key ke git! Sebaiknya pakai environment variables:

```typescript
endpoint: import.meta.env.VITE_MARKET_API_ENDPOINT,
apiKey: import.meta.env.VITE_MARKET_API_KEY,
```

Buat file `.env`:
```
VITE_MARKET_API_ENDPOINT=https://api-anda.com/prices
VITE_MARKET_API_KEY=your_secret_key
```
