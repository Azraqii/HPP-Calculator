/**
 * MANUAL SCRAPER TEST SCRIPT
 * ===========================
 * 
 * Run this script to manually test the scraper without starting the full server
 * 
 * Usage:
 *   ts-node src/scripts/manual-scrape.ts
 *   or
 *   npm run scrape
 */

import scraperService from '../services/scraper.service';

async function runManualScrape() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   MANUAL SCRAPER TEST                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Run scraper
    console.log('📡 Step 1: Running commodity price scraper...\n');
    const result = await scraperService.scrapeCommodityPrices();

    if (result.success) {
      console.log('\n✅ SCRAPING SUCCESSFUL!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`Method used: ${result.method.toUpperCase()}`);
      console.log(`Items scraped: ${result.data.length}`);
      console.log(`Timestamp: ${result.scrapedAt.toISOString()}`);

      if (result.errors.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.errors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err}`);
        });
      }

      // Show sample data
      if (result.data.length > 0) {
        console.log('\n📊 Sample Data (first 5 items):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        result.data.slice(0, 5).forEach((item, i) => {
          console.log(`\n${i + 1}. ${item.commodity}`);
          console.log(`   Province: ${item.province}`);
          console.log(`   Price: Rp ${item.price.toLocaleString('id-ID')} per ${item.unit}`);
          console.log(`   Date: ${item.date.toLocaleDateString('id-ID')}`);
        });
      }

      // Step 2: Calculate national averages
      console.log('\n\n📊 Step 2: Calculating national averages...\n');
      await scraperService.calculateNationalAverages();
      console.log('✅ National averages calculated\n');

      // Step 3: Show summary
      console.log('╔════════════════════════════════════════╗');
      console.log('║   SCRAPING COMPLETE                    ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`\n✨ Successfully scraped and saved ${result.data.length} commodity prices`);
      console.log('🎯 Data is now available via API endpoints\n');

    } else {
      console.log('\n❌ SCRAPING FAILED!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Errors:');
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('\n💡 Troubleshooting tips:');
      console.log('  1. Check your internet connection');
      console.log('  2. Verify Panel Harga website is accessible');
      console.log('  3. Check if API endpoints have changed');
      console.log('  4. Review src/config/scraper.config.ts\n');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error(error);
    console.log('\n💡 This usually means:');
    console.log('  - Database connection failed');
    console.log('  - Missing environment variables');
    console.log('  - Invalid Prisma schema');
    console.log('\nCheck your .env file and run: npm run prisma:generate\n');
    process.exit(1);
  }
}

// Run the script
runManualScrape()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
