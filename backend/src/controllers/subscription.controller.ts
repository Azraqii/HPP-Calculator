/**
 * PAYMENT & SUBSCRIPTION CONTROLLER
 * ==================================
 * 
 * Express controllers untuk handle subscription dan payment endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/premium.middleware';
import PaymentService, { SUBSCRIPTION_PLANS } from '../services/payment.service';

// ============================================
// GET SUBSCRIPTION PLANS
// ============================================

export async function getSubscriptionPlans(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    res.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// CREATE SUBSCRIPTION TRANSACTION
// ============================================

export async function createSubscriptionTransaction(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    // Validate user authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const { plan } = req.body;

    // Validate plan
    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      res.status(400).json({
        success: false,
        error: 'Invalid subscription plan',
        availablePlans: Object.keys(SUBSCRIPTION_PLANS),
      });
      return;
    }

    // Create transaction
    const result = await PaymentService.createSubscriptionTransaction({
      userId: req.user.id,
      plan: plan as keyof typeof SUBSCRIPTION_PLANS,
      userEmail: req.user.email,
      userName: req.user.email.split('@')[0], // Simple name extraction
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: result.transaction,
        payment: {
          snapToken: result.snapToken,
          redirectUrl: result.redirectUrl,
        },
      },
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription transaction',
    });
  }
}

// ============================================
// MIDTRANS WEBHOOK HANDLER
// ============================================

export async function handlePaymentWebhook(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const notification = req.body;

    console.log('📬 Webhook received:', notification);

    const result = await PaymentService.handlePaymentNotification(notification);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET TRANSACTION STATUS
// ============================================

export async function getTransactionStatus(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
      return;
    }

    const result = await PaymentService.getTransactionStatus(orderId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.transaction,
    });

  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET USER SUBSCRIPTION INFO
// ============================================

export async function getUserSubscriptionInfo(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const { PrismaClient, SubscriptionStatus } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.PREMIUM,
            endDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const activeSubscription = user.subscriptions[0] || null;

    res.json({
      success: true,
      data: {
        status: user.status,
        isPremium: user.status === SubscriptionStatus.PREMIUM && activeSubscription !== null,
        subscription: activeSubscription
          ? {
              id: activeSubscription.id,
              startDate: activeSubscription.startDate,
              endDate: activeSubscription.endDate,
              daysRemaining: Math.ceil(
                (activeSubscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
              autoRenew: activeSubscription.autoRenew,
            }
          : null,
      },
    });

  } catch (error) {
    console.error('Error getting subscription info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default {
  getSubscriptionPlans,
  createSubscriptionTransaction,
  handlePaymentWebhook,
  getTransactionStatus,
  getUserSubscriptionInfo,
};
