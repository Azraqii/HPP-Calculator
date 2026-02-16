/**
 * CRON JOBS SCHEDULER
 * ===================
 * 
 * Automated scheduled tasks for Stackra HPP Calculator
 * 
 * Install: npm install node-cron
 */

import cron from 'node-cron';
import scraperService from './services/scraper.service';

// ============================================
// JOB 1: Daily Price Scraper
// ============================================

/**
 * Runs every day at 06:00 AM WIB (UTC+7)
 * Scrapes commodity prices from Panel Harga
 */
export function startDailyPriceScraper() {
  // Cron format: second minute hour day month weekday
  // '0 6 * * *' = Every day at 06:00
  
  const job = cron.schedule('0 6 * * *', async () => {
    console.log('🕒 [CRON] Starting daily price scraper at', new Date().toISOString());
    
    try {
      // Scrape prices
      const result = await scraperService.scrapeCommodityPrices();
      
      if (result.success) {
        console.log(`✅ [CRON] Scraped ${result.data.length} prices using ${result.method}`);
        
        // Calculate national averages
        await scraperService.calculateNationalAverages();
        console.log('✅ [CRON] National averages calculated');
      } else {
        console.error('❌ [CRON] Scraper failed:', result.errors);
      }
    } catch (error) {
      console.error('❌ [CRON] Fatal error in price scraper:', error);
    }
  }, {
    timezone: 'Asia/Jakarta', // WIB timezone
  });

  job.start();
  console.log('✅ Daily price scraper scheduled (06:00 WIB)');
  
  return job;
}

// ============================================
// JOB 2: Hourly Subscription Expiry Check
// ============================================

/**
 * Runs every hour to check and update expired subscriptions
 */
export function startSubscriptionExpiryCheck() {
  const job = cron.schedule('0 * * * *', async () => {
    console.log('🕒 [CRON] Checking expired subscriptions at', new Date().toISOString());
    
    try {
      const { PrismaClient, SubscriptionStatus } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Find expired active subscriptions
      const expiredSubs = await prisma.userSubscription.findMany({
        where: {
          status: SubscriptionStatus.PREMIUM,
          endDate: {
            lt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (expiredSubs.length === 0) {
        console.log('✅ [CRON] No expired subscriptions found');
        return;
      }

      // Update each expired subscription
      for (const sub of expiredSubs) {
        await prisma.userSubscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        // Check if user has any other active subscriptions
        const otherActiveSubs = await prisma.userSubscription.findMany({
          where: {
            userId: sub.userId,
            status: SubscriptionStatus.PREMIUM,
            endDate: {
              gte: new Date(),
            },
          },
        });

        // Update user to FREE if no active subs
        if (otherActiveSubs.length === 0) {
          await prisma.user.update({
            where: { id: sub.userId },
            data: { status: SubscriptionStatus.FREE },
          });

          // Log expiry
          await prisma.systemLog.create({
            data: {
              type: 'SUBSCRIPTION_EXPIRED',
              message: `Subscription expired for user ${sub.user.email}`,
              metadata: { userId: sub.userId, subscriptionId: sub.id },
            },
          });

          console.log(`📪 [CRON] User ${sub.user.email} subscription expired`);
        }
      }

      console.log(`✅ [CRON] Processed ${expiredSubs.length} expired subscriptions`);

    } catch (error) {
      console.error('❌ [CRON] Error checking subscriptions:', error);
    }
  }, {
    timezone: 'Asia/Jakarta',
  });

  job.start();
  console.log('✅ Subscription expiry check scheduled (hourly)');
  
  return job;
}

// ============================================
// JOB 3: Weekly Database Cleanup (Optional)
// ============================================

/**
 * Runs every Sunday at 02:00 AM
 * Cleans up old logs and deactivates old prices
 */
export function startWeeklyCleanup() {
  const job = cron.schedule('0 2 * * 0', async () => {
    console.log('🕒 [CRON] Starting weekly cleanup at', new Date().toISOString());
    
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Delete logs older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedLogs = await prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(`🗑️  [CRON] Deleted ${deletedLogs.count} old logs`);

      // Deactivate price records older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deactivatedPrices = await prisma.commodityPrice.updateMany({
        where: {
          priceDate: {
            lt: thirtyDaysAgo,
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      console.log(`🗂️  [CRON] Deactivated ${deactivatedPrices.count} old prices`);
      console.log('✅ [CRON] Weekly cleanup completed');

    } catch (error) {
      console.error('❌ [CRON] Error in weekly cleanup:', error);
    }
  }, {
    timezone: 'Asia/Jakarta',
  });

  job.start();
  console.log('✅ Weekly cleanup scheduled (Sunday 02:00 WIB)');
  
  return job;
}

// ============================================
// START ALL JOBS
// ============================================

export function startAllCronJobs() {
  console.log('🚀 Starting all cron jobs...\n');
  
  const jobs = {
    scraper: startDailyPriceScraper(),
    expiry: startSubscriptionExpiryCheck(),
    cleanup: startWeeklyCleanup(),
  };

  console.log('\n✅ All cron jobs started successfully\n');
  
  return jobs;
}

export default {
  startAllCronJobs,
  startDailyPriceScraper,
  startSubscriptionExpiryCheck,
  startWeeklyCleanup,
};
