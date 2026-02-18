/**
 * PREMIUM ACCESS MIDDLEWARE
 * =========================
 * 
 * Middleware untuk mengecek status subscription user dan membatasi akses
 * ke fitur premium. Digunakan di routes yang membutuhkan premium access.
 * 
 * Usage:
 *   router.get('/api/prices/live', authMiddleware, checkPremium, controller);
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// ============================================
// MIDDLEWARE: Check Premium Status
// ============================================

/**
 * Middleware to verify if user has active premium subscription
 * 
 * @returns 403 if user is not premium
 * @returns next() if user has premium access
 */
export async function checkPremium(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if user is authenticated (should be handled by authMiddleware first)
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please login to access this resource',
      });
      return;
    }

    const userId = req.user.userId;

    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.PREMIUM,
            endDate: {
              gte: new Date(), // subscription not expired
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

    // Check if has active premium subscription
    const hasActivePremium = 
      user.subscriptions.length > 0 || 
      user.status === SubscriptionStatus.PREMIUM;

    if (!hasActivePremium) {
      res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: 'Fitur ini hanya tersedia untuk pengguna Premium. Upgrade sekarang untuk akses penuh!',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: '/api/subscription/create',
        features: {
          free: ['Manual price input', 'National average prices only', 'Basic calculator'],
          premium: [
            'Live province-specific prices',
            'Historical price trends',
            'Unlimited ingredients',
            'Export reports',
            'Multi-location support',
          ],
        },
      });
      return;
    }

    // User has premium access - proceed
    next();
    
  } catch (error) {
    console.error('Error in checkPremium middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// MIDDLEWARE: Check Subscription Expiry
// ============================================

/**
 * Check if subscription is expired and update status
 * Run this periodically or on each request
 */
export async function checkSubscriptionExpiry(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;

    // Find expired subscriptions
    const expiredSubscriptions = await prisma.userSubscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.PREMIUM,
        endDate: {
          lt: new Date(),
        },
      },
    });

    // Update expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await prisma.userSubscription.updateMany({
        where: {
          id: {
            in: expiredSubscriptions.map(sub => sub.id),
          },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // Update user status to FREE if no active subscriptions
      const activeSubscriptions = await prisma.userSubscription.findMany({
        where: {
          userId,
          status: SubscriptionStatus.PREMIUM,
          endDate: {
            gte: new Date(),
          },
        },
      });

      if (activeSubscriptions.length === 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { status: SubscriptionStatus.FREE },
        });

        // Log expiry
        await prisma.systemLog.create({
          data: {
            type: 'SUBSCRIPTION_EXPIRED',
            message: `Subscription expired for user ${userId}`,
            metadata: { userId },
          },
        });
      }
    }

    next();
    
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    next(); // Don't block request on error
  }
}

// ============================================
// HELPER: Get User Subscription Status
// ============================================

export async function getUserSubscriptionStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      return null;
    }

    const activeSubscription = user.subscriptions[0] || null;

    return {
      isPremium: user.status === SubscriptionStatus.PREMIUM && activeSubscription !== null,
      status: user.status,
      subscription: activeSubscription,
      daysRemaining: activeSubscription
        ? Math.ceil((activeSubscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

// ============================================
// MIDDLEWARE: Admin Only
// ============================================

export function checkAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
}

export default {
  checkPremium,
  checkSubscriptionExpiry,
  getUserSubscriptionStatus,
  checkAdmin,
};
