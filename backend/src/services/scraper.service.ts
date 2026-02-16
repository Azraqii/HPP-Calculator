/**
 * COMMODITY PRICE SCRAPER SERVICE
 * ================================
 * 
 * Production-ready scraper with:
 * - API-first approach (fast)
 * - Puppeteer fallback (reliable)
 * - Automatic retry with exponential backoff
 * - Upsert logic to prevent duplicates
 * - Error handling and logging
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { PrismaClient, CommodityType, Province } from '@prisma/client';
import { PANEL_HARGA_CONFIG } from '../config/scraper.config';

const prisma = new PrismaClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ScrapedPrice {
  commodity: string;
  province: string;
  price: number;
  unit: string;
  date: Date;
}

interface ScraperResult {
  success: boolean;
  data: ScrapedPrice[];
  errors: string[];
  scrapedAt: Date;
  method: 'api' | 'puppeteer';
}

// ============================================
// COMMODITY MAPPING
// ============================================

const COMMODITY_MAP: Record<string, CommodityType> = {
  'beras': CommodityType.BERAS,
  'beras premium': CommodityType.BERAS,
  'beras medium': CommodityType.BERAS,
  'cabai merah': CommodityType.CABAI_MERAH,
  'cabai merah keriting': CommodityType.CABAI_MERAH,
  'cabai rawit': CommodityType.CABAI_RAWIT,
  'cabai rawit hijau': CommodityType.CABAI_RAWIT,
  'bawang merah': CommodityType.BAWANG_MERAH,
  'bawang putih': CommodityType.BAWANG_PUTIH,
  'daging ayam': CommodityType.DAGING_AYAM,
  'daging ayam ras': CommodityType.DAGING_AYAM,
  'daging sapi': CommodityType.DAGING_SAPI,
  'daging sapi murni': CommodityType.DAGING_SAPI,
  'telur ayam': CommodityType.TELUR_AYAM,
  'telur ayam ras': CommodityType.TELUR_AYAM,
  'minyak goreng': CommodityType.MINYAK_GORENG,
  'minyak goreng curah': CommodityType.MINYAK_GORENG,
  'gula pasir': CommodityType.GULA_PASIR,
  'gula pasir lokal': CommodityType.GULA_PASIR,
  'tepung terigu': CommodityType.TEPUNG_TERIGU,
  'susu': CommodityType.SUSU,
  'tomat': CommodityType.TOMAT,
  'kentang': CommodityType.KENTANG,
  'wortel': CommodityType.WORTEL,
};

const PROVINCE_MAP: Record<string, Province> = {
  'aceh': Province.ACEH,
  'sumatera utara': Province.SUMATERA_UTARA,
  'sumut': Province.SUMATERA_UTARA,
  'sumatera barat': Province.SUMATERA_BARAT,
  'sumbar': Province.SUMATERA_BARAT,
  'riau': Province.RIAU,
  'jambi': Province.JAMBI,
  'sumatera selatan': Province.SUMATERA_SELATAN,
  'sumsel': Province.SUMATERA_SELATAN,
  'bengkulu': Province.BENGKULU,
  'lampung': Province.LAMPUNG,
  'bangka belitung': Province.KEPULAUAN_BANGKA_BELITUNG,
  'kepulauan bangka belitung': Province.KEPULAUAN_BANGKA_BELITUNG,
  'kepulauan riau': Province.KEPULAUAN_RIAU,
  'kepri': Province.KEPULAUAN_RIAU,
  'dki jakarta': Province.DKI_JAKARTA,
  'jakarta': Province.DKI_JAKARTA,
  'jawa barat': Province.JAWA_BARAT,
  'jabar': Province.JAWA_BARAT,
  'jawa tengah': Province.JAWA_TENGAH,
  'jateng': Province.JAWA_TENGAH,
  'di yogyakarta': Province.DI_YOGYAKARTA,
  'yogyakarta': Province.DI_YOGYAKARTA,
  'jawa timur': Province.JAWA_TIMUR,
  'jatim': Province.JAWA_TIMUR,
  'banten': Province.BANTEN,
  'bali': Province.BALI,
  'nusa tenggara barat': Province.NUSA_TENGGARA_BARAT,
  'ntb': Province.NUSA_TENGGARA_BARAT,
  'nusa tenggara timur': Province.NUSA_TENGGARA_TIMUR,
  'ntt': Province.NUSA_TENGGARA_TIMUR,
  'kalimantan barat': Province.KALIMANTAN_BARAT,
  'kalbar': Province.KALIMANTAN_BARAT,
  'kalimantan tengah': Province.KALIMANTAN_TENGAH,
  'kalteng': Province.KALIMANTAN_TENGAH,
  'kalimantan selatan': Province.KALIMANTAN_SELATAN,
  'kalsel': Province.KALIMANTAN_SELATAN,
  'kalimantan timur': Province.KALIMANTAN_TIMUR,
  'kaltim': Province.KALIMANTAN_TIMUR,
  'kalimantan utara': Province.KALIMANTAN_UTARA,
  'kaltara': Province.KALIMANTAN_UTARA,
  'sulawesi utara': Province.SULAWESI_UTARA,
  'sulut': Province.SULAWESI_UTARA,
  'sulawesi tengah': Province.SULAWESI_TENGAH,
  'sulteng': Province.SULAWESI_TENGAH,
  'sulawesi selatan': Province.SULAWESI_SELATAN,
  'sulsel': Province.SULAWESI_SELATAN,
  'sulawesi tenggara': Province.SULAWESI_TENGGARA,
  'sultra': Province.SULAWESI_TENGGARA,
  'gorontalo': Province.GORONTALO,
  'sulawesi barat': Province.SULAWESI_BARAT,
  'sulbar': Province.SULAWESI_BARAT,
  'maluku': Province.MALUKU,
  'maluku utara': Province.MALUKU_UTARA,
  'malut': Province.MALUKU_UTARA,
  'papua barat': Province.PAPUA_BARAT,
  'papua': Province.PAPUA,
  'nasional': Province.NASIONAL,
  'rata-rata nasional': Province.NASIONAL,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

function mapCommodity(commodityName: string): CommodityType | null {
  const normalized = normalizeString(commodityName);
  return COMMODITY_MAP[normalized] || null;
}

function mapProvince(provinceName: string): Province | null {
  const normalized = normalizeString(provinceName);
  return PROVINCE_MAP[normalized] || null;
}

function parsePrice(priceString: string | number): number {
  if (typeof priceString === 'number') return Math.round(priceString);
  
  // Remove non-numeric characters except decimal point
  const cleaned = priceString.toString().replace(/[^\d.,]/g, '');
  const normalized = cleaned.replace(',', '.');
  return Math.round(parseFloat(normalized));
}

// ============================================
// SCRAPER METHOD 1: API ENDPOINT
// ============================================

async function scrapeViaAPI(): Promise<ScrapedPrice[]> {
  const results: ScrapedPrice[] = [];
  const { baseUrl, apiEndpoints, scraper } = PANEL_HARGA_CONFIG;

  try {
    console.log('🔍 Attempting to scrape via API...');
    
    // Try main endpoint first
    const response = await axios.get(`${baseUrl}${apiEndpoints.prices}`, {
      headers: {
        'User-Agent': scraper.userAgent,
        'Accept': 'application/json',
        'Referer': baseUrl,
      },
      timeout: scraper.timeout,
    });

    if (response.data && Array.isArray(response.data.data)) {
      // Parse API response
      for (const item of response.data.data) {
        const commodity = mapCommodity(item.komoditas || item.commodity || '');
        const province = mapProvince(item.provinsi || item.province || '');
        
        if (commodity && province) {
          results.push({
            commodity: item.komoditas || item.commodity,
            province: item.provinsi || item.province,
            price: parsePrice(item.harga || item.price),
            unit: item.satuan || item.unit || 'kg',
            date: new Date(item.tanggal || item.date || new Date()),
          });
        }
      }
    }

    console.log(`✅ API scraping successful: ${results.length} items`);
    return results;
    
  } catch (error) {
    console.log('⚠️  API scraping failed, will try Puppeteer fallback');
    throw error;
  }
}

// ============================================
// SCRAPER METHOD 2: PUPPETEER (Fallback)
// ============================================

async function scrapeViaPuppeteer(): Promise<ScrapedPrice[]> {
  const results: ScrapedPrice[] = [];
  let browser;

  try {
    console.log('🔍 Attempting to scrape via Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent(PANEL_HARGA_CONFIG.scraper.userAgent);
    
    // Navigate to page
    await page.goto(PANEL_HARGA_CONFIG.baseUrl, {
      waitUntil: 'networkidle2',
      timeout: PANEL_HARGA_CONFIG.scraper.timeout,
    });

    // Wait for content to load (adjust selector based on actual HTML)
    await page.waitForSelector('table, .price-table, [class*="harga"]', {
      timeout: 10000,
    });

    // Extract data from page
    const data = await page.evaluate(() => {
      const rows: any[] = [];
      
      // Example: scraping table (adjust selectors based on actual HTML)
      const tables = document.querySelectorAll('table');
      
      tables.forEach((table) => {
        const tableRows = table.querySelectorAll('tbody tr');
        
        tableRows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            rows.push({
              commodity: cells[0]?.textContent?.trim() || '',
              province: cells[1]?.textContent?.trim() || '',
              price: cells[2]?.textContent?.trim() || '',
              unit: cells[3]?.textContent?.trim() || 'kg',
            });
          }
        });
      });
      
      return rows;
    });

    // Process extracted data
    for (const item of data) {
      const commodity = mapCommodity(item.commodity);
      const province = mapProvince(item.province);
      
      if (commodity && province) {
        results.push({
          commodity: item.commodity,
          province: item.province,
          price: parsePrice(item.price),
          unit: item.unit,
          date: new Date(),
        });
      }
    }

    console.log(`✅ Puppeteer scraping successful: ${results.length} items`);
    return results;
    
  } catch (error) {
    console.error('❌ Puppeteer scraping failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ============================================
// MAIN SCRAPER FUNCTION (with retry logic)
// ============================================

async function scrapeWithRetry(
  method: () => Promise<ScrapedPrice[]>,
  maxRetries: number = 3
): Promise<ScrapedPrice[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await method();
    } catch (error) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return [];
}

// ============================================
// UPSERT TO DATABASE
// ============================================

async function upsertPricesToDatabase(prices: ScrapedPrice[]): Promise<void> {
  console.log(`💾 Upserting ${prices.length} prices to database...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const item of prices) {
    try {
      const commodity = mapCommodity(item.commodity);
      const province = mapProvince(item.province);

      if (!commodity || !province) {
        console.warn(`⚠️  Skipping invalid mapping:`, item);
        errorCount++;
        continue;
      }

      // Get today's date at midnight for consistency
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Upsert: Update if exists, Create if not
      await prisma.commodityPrice.upsert({
        where: {
          commodity_province_priceDate: {
            commodity,
            province,
            priceDate: today,
          },
        },
        update: {
          price: item.price,
          unit: item.unit,
          scrapedAt: new Date(),
          isActive: true,
        },
        create: {
          commodity,
          province,
          price: item.price,
          unit: item.unit,
          priceDate: today,
          sourceUrl: PANEL_HARGA_CONFIG.baseUrl,
          scrapedAt: new Date(),
          isActive: true,
        },
      });

      // Optional: Save to history table for trend analysis
      await prisma.priceHistory.create({
        data: {
          commodity,
          province,
          price: item.price,
          priceDate: today,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`❌ Error upserting price:`, item, error);
      errorCount++;
    }
  }

  console.log(`✅ Upsert complete: ${successCount} success, ${errorCount} errors`);
}

// ============================================
// PUBLIC API: MAIN SCRAPER FUNCTION
// ============================================

export async function scrapeCommodityPrices(): Promise<ScraperResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let data: ScrapedPrice[] = [];
  let method: 'api' | 'puppeteer' = 'api';

  try {
    console.log('🚀 Starting commodity price scraper...');

    // Try API first
    try {
      data = await scrapeWithRetry(scrapeViaAPI);
      method = 'api';
    } catch (apiError) {
      console.log('📡 API method failed, falling back to Puppeteer...');
      errors.push(`API error: ${apiError}`);
      
      // Fallback to Puppeteer
      try {
        data = await scrapeWithRetry(scrapeViaPuppeteer);
        method = 'puppeteer';
      } catch (puppeteerError) {
        errors.push(`Puppeteer error: ${puppeteerError}`);
        throw new Error('All scraping methods failed');
      }
    }

    // Upsert to database
    if (data.length > 0) {
      await upsertPricesToDatabase(data);
      
      // Log success to system log
      await prisma.systemLog.create({
        data: {
          type: 'SCRAPER_SUCCESS',
          message: `Scraped ${data.length} prices using ${method}`,
          metadata: {
            duration: Date.now() - startTime,
            method,
            itemCount: data.length,
          },
        },
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Scraping completed in ${duration}s`);

    return {
      success: true,
      data,
      errors,
      scrapedAt: new Date(),
      method,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    // Log error to system log
    await prisma.systemLog.create({
      data: {
        type: 'SCRAPER_ERROR',
        message: `Scraper failed: ${errorMessage}`,
        metadata: {
          errors,
          duration: Date.now() - startTime,
        },
      },
    });

    console.error('❌ Scraping failed:', errorMessage);

    return {
      success: false,
      data: [],
      errors,
      scrapedAt: new Date(),
      method: 'api',
    };
  }
}

// ============================================
// CALCULATE NATIONAL AVERAGE
// ============================================

export async function calculateNationalAverages(): Promise<void> {
  console.log('📊 Calculating national averages...');

  try {
    const commodities = Object.values(CommodityType);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const commodity of commodities) {
      // Get all province prices for this commodity today
      const prices = await prisma.commodityPrice.findMany({
        where: {
          commodity,
          priceDate: today,
          isActive: true,
          province: { not: Province.NASIONAL },
        },
      });

      if (prices.length === 0) continue;

      // Calculate average
      const totalPrice = prices.reduce((sum, p) => sum + p.price, 0);
      const avgPrice = Math.round(totalPrice / prices.length);

      // Upsert national average
      await prisma.commodityPrice.upsert({
        where: {
          commodity_province_priceDate: {
            commodity,
            province: Province.NASIONAL,
            priceDate: today,
          },
        },
        update: {
          price: avgPrice,
          scrapedAt: new Date(),
          isActive: true,
        },
        create: {
          commodity,
          province: Province.NASIONAL,
          price: avgPrice,
          unit: prices[0].unit,
          priceDate: today,
          sourceUrl: 'calculated',
          scrapedAt: new Date(),
          isActive: true,
        },
      });
    }

    console.log('✅ National averages calculated');
  } catch (error) {
    console.error('❌ Error calculating national averages:', error);
  }
}

// Export for use in cron jobs
export default {
  scrapeCommodityPrices,
  calculateNationalAverages,
};
