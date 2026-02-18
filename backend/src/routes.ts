/**
 * API ROUTES
 * ==========
 * 
 * Main routing configuration for Stackra HPP Calculator API
 */

import express from 'express';
import authController from './controllers/auth.controller';
import authMiddleware from './middlewares/auth.middleware';
import subscriptionController from './controllers/subscription.controller';
import pricesController from './controllers/prices.controller';
import { checkPremium, checkSubscriptionExpiry } from './middlewares/premium.middleware';

const router = express.Router();

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stackra HPP Calculator API is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// AUTH ROUTES
// ============================================

// Register new user
router.post('/auth/register', authController.register);

// Login user
router.post('/auth/login', authController.login);

// Refresh access token
router.post('/auth/refresh', authController.refreshToken);

// Logout user
router.post('/auth/logout', authController.logout);

// Get current user info (requires auth)
router.get('/auth/me', authMiddleware, authController.me);

// ============================================
// SUBSCRIPTION & PAYMENT ROUTES
// ============================================

// Get available subscription plans (public)
router.get(
  '/subscription/plans',
  subscriptionController.getSubscriptionPlans
);

// Create subscription transaction (requires auth)
router.post(
  '/subscription/create',
  authMiddleware,
  checkSubscriptionExpiry,
  subscriptionController.createSubscriptionTransaction
);

// Get user's subscription info (requires auth)
router.get(
  '/subscription/info',
  authMiddleware,
  checkSubscriptionExpiry,
  subscriptionController.getUserSubscriptionInfo
);

// Get transaction status (requires auth)
router.get(
  '/transaction/:orderId',
  authMiddleware,
  subscriptionController.getTransactionStatus
);

// Midtrans webhook (no auth required - verified by signature)
router.post(
  '/payment/webhook',
  subscriptionController.handlePaymentWebhook
);

// ============================================
// COMMODITY PRICES ROUTES
// ============================================

// Get info about available provinces (public)
router.get(
  '/prices/provinces',
  pricesController.getProvincesList
);

// Get info about available commodities (public)
router.get(
  '/prices/commodities',
  pricesController.getCommoditiesList
);

// Get national average prices (FREE tier)
router.get(
  '/prices/national',
  authMiddleware,
  pricesController.getNationalPrices
);

// Get province-specific prices (PREMIUM tier only)
router.get(
  '/prices/live',
  authMiddleware,
  checkSubscriptionExpiry,
  checkPremium,  // 🔒 Premium only
  pricesController.getProvincePrices
);

// Get price history (PREMIUM tier only)
router.get(
  '/prices/history',
  authMiddleware,
  checkSubscriptionExpiry,
  checkPremium,  // 🔒 Premium only
  pricesController.getPriceHistory
);

// ============================================
// ADMIN ROUTES (Add as needed)
// ============================================

// Trigger manual scraper run (admin only)
router.post(
  '/admin/scrape',
  // authMiddleware,
  // checkAdmin,
  async (req, res) => {
    try {
      const { scrapeCommodityPrices, calculateNationalAverages } = await import(
        './services/scraper.service'
      );
      
      const result = await scrapeCommodityPrices();
      await calculateNationalAverages();
      
      res.json({
        success: true,
        message: 'Scraper executed successfully',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Scraper execution failed',
      });
    }
  }
);

export default router;
