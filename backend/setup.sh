#!/bin/bash

# Setup script untuk Backend Stackra HPP Calculator
# Jalankan dari folder backend: bash setup.sh

echo "🚀 Setting up Stackra HPP Calculator Backend..."
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install
npm install cookie-parser
npm install --save-dev @types/cookie-parser

echo ""
echo "✅ Dependencies installed!"
echo ""

# 2. Setup .env
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file and update:"
    echo "   - DATABASE_URL"
    echo "   - JWT_ACCESS_SECRET (use: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "   - JWT_REFRESH_SECRET (use: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "   - MIDTRANS_SERVER_KEY"
    echo "   - MIDTRANS_CLIENT_KEY"
    echo ""
else
    echo "✅ .env already exists"
    echo ""
fi

# 3. Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client generated!"
echo ""

# 4. Push database schema
echo "📊 Pushing database schema..."
echo "⚠️  Make sure PostgreSQL is running and DATABASE_URL in .env is correct!"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db push
    echo ""
    echo "✅ Database schema pushed!"
else
    echo "⏭️  Skipping database push. Run manually: npx prisma db push"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Make sure PostgreSQL is running"
echo "3. Run: npm run dev"
echo ""
echo "Test endpoints:"
echo "  - Health: curl http://localhost:3000/api/health"
echo "  - Register: curl -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"123456\",\"name\":\"Test\"}'"
echo ""
