/**
 * API ROUTES
 * ==========
 * 
 * Main routing configuration for Stackra HPP Calculator API
 */

import express from 'express';
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
  // authMiddleware,  // Add your JWT auth middleware here
  checkSubscriptionExpiry,
  subscriptionController.createSubscriptionTransaction
);

// Get user's subscription info (requires auth)
router.get(
  '/subscription/info',
  // authMiddleware,  // Add your JWT auth middleware here
  checkSubscriptionExpiry,
  subscriptionController.getUserSubscriptionInfo
);

// Get transaction status (requires auth)
router.get(
  '/transaction/:orderId',
  // authMiddleware,  // Add your JWT auth middleware here
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
  // authMiddleware,  // Add your JWT auth middleware here
  pricesController.getNationalPrices
);

// Get province-specific prices (PREMIUM tier only)
router.get(
  '/prices/live',
  // authMiddleware,  // Add your JWT auth middleware here
  checkSubscriptionExpiry,
  checkPremium,  // 🔒 Premium only
  pricesController.getProvincePrices
);

// Get price history (PREMIUM tier only)
router.get(
  '/prices/history',
  // authMiddleware,  // Add your JWT auth middleware here
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
