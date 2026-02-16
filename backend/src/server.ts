/**
 * MAIN SERVER
 * ===========
 * 
 * Stackra HPP Calculator Backend
 * Production-ready Express server with Prisma ORM
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { startAllCronJobs } from './cron';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('combined'));

// ============================================
// ROUTES
// ============================================

app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Stackra HPP Calculator API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      subscription: {
        plans: 'GET /api/subscription/plans',
        create: 'POST /api/subscription/create',
        info: 'GET /api/subscription/info',
      },
      prices: {
        national: 'GET /api/prices/national',
        live: 'GET /api/prices/live?province=JAWA_BARAT (Premium)',
        history: 'GET /api/prices/history?commodity=BERAS&days=30 (Premium)',
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Test database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start cron jobs
    if (process.env.ENABLE_CRON !== 'false') {
      startAllCronJobs();
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n🚀 Stackra HPP Calculator API');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('\n✅ Server ready to accept requests\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
