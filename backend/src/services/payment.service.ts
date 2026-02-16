/**
 * MIDTRANS PAYMENT SERVICE
 * ========================
 * 
 * Service untuk integrasi dengan Midtrans Snap API
 * Handles pembuatan transaksi, payment token generation, dan webhook callback
 * 
 * Docs: https://docs.midtrans.com/docs/snap-integration-guide
 */

import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient, SubscriptionStatus, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// MIDTRANS CONFIGURATION
// ============================================

const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  isProduction: process.env.MIDTRANS_ENV === 'production',
  snapUrl: process.env.MIDTRANS_ENV === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
};

// Base64 encode server key for authorization
const AUTH_STRING = Buffer.from(MIDTRANS_CONFIG.serverKey + ':').toString('base64');

// ============================================
// PRICING CONFIGURATION
// ============================================

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Premium Monthly',
    price: 49000,
    duration: 30, // days
    features: [
      'Live province-specific prices',
      'Historical price trends',
      'Unlimited ingredients',
      'Export reports (PDF/Excel)',
      'Multi-location support',
      'Priority support',
    ],
  },
  QUARTERLY: {
    name: 'Premium Quarterly',
    price: 129000, // Save 12%
    duration: 90,
    features: [
      'All Monthly features',
      'Save 12%',
      'Extended analytics',
    ],
  },
  YEARLY: {
    name: 'Premium Yearly',
    price: 490000, // Save 17%
    duration: 365,
    features: [
      'All Monthly features',
      'Save 17%',
      'Dedicated account manager',
    ],
  },
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface CreateTransactionParams {
  userId: string;
  plan: keyof typeof SUBSCRIPTION_PLANS;
  userEmail: string;
  userName: string;
}

interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
}

// ============================================
// CREATE SUBSCRIPTION TRANSACTION
// ============================================

export async function createSubscriptionTransaction(
  params: CreateTransactionParams
): Promise<{
  success: boolean;
  transaction?: any;
  snapToken?: string;
  redirectUrl?: string;
  error?: string;
}> {
  try {
    const { userId, plan, userEmail, userName } = params;

    // Validate plan
    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    if (!selectedPlan) {
      return {
        success: false,
        error: 'Invalid subscription plan',
      };
    }

    // Generate unique order ID
    const timestamp = Date.now();
    const orderId = `SUB-${userId.slice(0, 8)}-${timestamp}`;

    // Create transaction in database first
    const transaction = await prisma.transaction.create({
      data: {
        orderId,
        userId,
        amount: selectedPlan.price,
        subscriptionPeriod: selectedPlan.duration,
        status: TransactionStatus.PENDING,
        paymentMethod: 'MIDTRANS',
      },
    });

    // Prepare Midtrans Snap request payload
    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: selectedPlan.price,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: userName,
        email: userEmail,
      },
      item_details: [
        {
          id: `PLAN_${plan}`,
          price: selectedPlan.price,
          quantity: 1,
          name: selectedPlan.name,
          category: 'Subscription',
        },
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
        error: `${process.env.FRONTEND_URL}/payment/error?order_id=${orderId}`,
        pending: `${process.env.FRONTEND_URL}/payment/pending?order_id=${orderId}`,
      },
      expiry: {
        unit: 'hours',
        duration: 24, // Payment link expires in 24 hours
      },
    };

    // Call Midtrans Snap API
    const response = await axios.post<MidtransSnapResponse>(
      MIDTRANS_CONFIG.snapUrl,
      snapPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${AUTH_STRING}`,
        },
      }
    );

    // Update transaction with Snap token
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        snapToken: response.data.token,
        snapRedirectUrl: response.data.redirect_url,
      },
    });

    console.log(`✅ Transaction created: ${orderId}`);

    return {
      success: true,
      transaction: {
        id: transaction.id,
        orderId,
        amount: selectedPlan.price,
        plan: selectedPlan.name,
      },
      snapToken: response.data.token,
      redirectUrl: response.data.redirect_url,
    };

  } catch (error) {
    console.error('❌ Error creating Midtrans transaction:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    };
  }
}

// ============================================
// VERIFY MIDTRANS SIGNATURE
// ============================================

function verifySignature(notification: MidtransNotification): boolean {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  
  // Create hash
  const hash = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_CONFIG.serverKey}`)
    .digest('hex');

  return hash === signature_key;
}

// ============================================
// HANDLE MIDTRANS WEBHOOK NOTIFICATION
// ============================================

export async function handlePaymentNotification(
  notification: MidtransNotification
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('📬 Received payment notification:', notification.order_id);

    // Verify signature
    if (!verifySignature(notification)) {
      console.error('❌ Invalid signature');
      return {
        success: false,
        message: 'Invalid signature',
      };
    }

    const { order_id, transaction_status, fraud_status, payment_type } = notification;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { orderId: order_id },
      include: { user: true },
    });

    if (!transaction) {
      console.error('❌ Transaction not found:', order_id);
      return {
        success: false,
        message: 'Transaction not found',
      };
    }

    // Process based on transaction status
    let newStatus: TransactionStatus = TransactionStatus.PENDING;
    let shouldActivateSubscription = false;

    switch (transaction_status) {
      case 'capture':
        if (fraud_status === 'accept') {
          newStatus = TransactionStatus.SUCCESS;
          shouldActivateSubscription = true;
        }
        break;

      case 'settlement':
        newStatus = TransactionStatus.SUCCESS;
        shouldActivateSubscription = true;
        break;

      case 'pending':
        newStatus = TransactionStatus.PENDING;
        break;

      case 'deny':
      case 'cancel':
        newStatus = TransactionStatus.CANCELLED;
        break;

      case 'expire':
        newStatus = TransactionStatus.EXPIRED;
        break;

      default:
        console.warn('⚠️  Unknown transaction status:', transaction_status);
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        transactionTime: new Date(notification.transaction_time),
        settlementTime: notification.settlement_time
          ? new Date(notification.settlement_time)
          : null,
        fraudStatus: fraud_status,
        paymentType: payment_type,
        metadata: notification as any,
      },
    });

    // Activate subscription if payment successful
    if (shouldActivateSubscription) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + transaction.subscriptionPeriod);

      // Create subscription
      const subscription = await prisma.userSubscription.create({
        data: {
          userId: transaction.userId,
          status: SubscriptionStatus.PREMIUM,
          startDate,
          endDate,
          transactionId: transaction.id,
        },
      });

      // Update user status
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { status: SubscriptionStatus.PREMIUM },
      });

      // Log subscription activation
      await prisma.systemLog.create({
        data: {
          type: 'SUBSCRIPTION_CREATED',
          message: `Subscription activated for user ${transaction.userId}`,
          metadata: {
            userId: transaction.userId,
            subscriptionId: subscription.id,
            orderId: order_id,
          },
        },
      });

      // Log payment success
      await prisma.systemLog.create({
        data: {
          type: 'PAYMENT_SUCCESS',
          message: `Payment successful for order ${order_id}`,
          metadata: {
            orderId: order_id,
            amount: transaction.amount,
            userId: transaction.userId,
          },
        },
      });

      console.log(`✅ Subscription activated for user ${transaction.userId}`);
    }

    // Log failed payment
    if (newStatus === TransactionStatus.FAILED || newStatus === TransactionStatus.CANCELLED) {
      await prisma.systemLog.create({
        data: {
          type: 'PAYMENT_FAILED',
          message: `Payment failed for order ${order_id}`,
          metadata: {
            orderId: order_id,
            status: transaction_status,
            userId: transaction.userId,
          },
        },
      });
    }

    return {
      success: true,
      message: 'Notification processed successfully',
    };

  } catch (error) {
    console.error('❌ Error processing payment notification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Internal error',
    };
  }
}

// ============================================
// GET TRANSACTION STATUS
// ============================================

export async function getTransactionStatus(orderId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        subscription: true,
      },
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    return {
      success: true,
      transaction: {
        orderId: transaction.orderId,
        amount: transaction.amount,
        status: transaction.status,
        paymentType: transaction.paymentType,
        createdAt: transaction.createdAt,
        subscription: transaction.subscription,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal error',
    };
  }
}

export default {
  createSubscriptionTransaction,
  handlePaymentNotification,
  getTransactionStatus,
  SUBSCRIPTION_PLANS,
};
