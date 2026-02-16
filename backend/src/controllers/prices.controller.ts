/**
 * COMMODITY PRICES CONTROLLER
 * ===========================
 * 
 * Handles commodity price endpoints with tier-based access control
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/premium.middleware';
import { PrismaClient, Province, CommodityType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET NATIONAL AVERAGE PRICES (FREE)
// ============================================

export async function getNationalPrices(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    // Get today's prices
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prices = await prisma.commodityPrice.findMany({
      where: {
        province: Province.NASIONAL,
        priceDate: today,
        isActive: true,
      },
      orderBy: {
        commodity: 'asc',
      },
    });

    res.json({
      success: true,
      tier: 'free',
      message: 'Rata-rata harga nasional. Upgrade ke Premium untuk harga per provinsi!',
      data: prices.map(p => ({
        commodity: p.commodity,
        price: p.price,
        unit: p.unit,
        date: p.priceDate,
        updatedAt: p.scrapedAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching national prices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET PROVINCE PRICES (PREMIUM ONLY)
// ============================================

export async function getProvincePrices(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { province } = req.query;

    if (!province) {
      res.status(400).json({
        success: false,
        error: 'Province parameter is required',
        example: '/api/prices/live?province=JAWA_BARAT',
      });
      return;
    }

    // Validate province enum
    const provinceEnum = province as Province;
    if (!Object.values(Province).includes(provinceEnum)) {
      res.status(400).json({
        success: false,
        error: 'Invalid province',
        availableProvinces: Object.values(Province),
      });
      return;
    }

    // Get today's prices for the province
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prices = await prisma.commodityPrice.findMany({
      where: {
        province: provinceEnum,
        priceDate: today,
        isActive: true,
      },
      orderBy: {
        commodity: 'asc',
      },
    });

    res.json({
      success: true,
      tier: 'premium',
      province: provinceEnum,
      data: prices.map(p => ({
        commodity: p.commodity,
        price: p.price,
        unit: p.unit,
        date: p.priceDate,
        updatedAt: p.scrapedAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching province prices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET PRICE HISTORY (PREMIUM ONLY)
// ============================================

export async function getPriceHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { commodity, province, days = 30 } = req.query;

    if (!commodity) {
      res.status(400).json({
        success: false,
        error: 'Commodity parameter is required',
      });
      return;
    }

    const commodityEnum = commodity as CommodityType;
    if (!Object.values(CommodityType).includes(commodityEnum)) {
      res.status(400).json({
        success: false,
        error: 'Invalid commodity',
        availableCommodities: Object.values(CommodityType),
      });
      return;
    }

    const provinceEnum = (province as Province) || Province.NASIONAL;
    const daysInt = parseInt(days as string, 10);

    // Get price history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const history = await prisma.priceHistory.findMany({
      where: {
        commodity: commodityEnum,
        province: provinceEnum,
        priceDate: {
          gte: startDate,
        },
      },
      orderBy: {
        priceDate: 'asc',
      },
    });

    // Calculate statistics
    const prices = history.map(h => h.price);
    const avgPrice = prices.length > 0
      ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
      : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    res.json({
      success: true,
      tier: 'premium',
      commodity: commodityEnum,
      province: provinceEnum,
      period: `${daysInt} days`,
      statistics: {
        average: avgPrice,
        min: minPrice,
        max: maxPrice,
        volatility: maxPrice - minPrice,
      },
      data: history.map(h => ({
        date: h.priceDate,
        price: h.price,
      })),
    });

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET ALL PROVINCES (INFO)
// ============================================

export async function getProvincesList(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    res.json({
      success: true,
      provinces: Object.values(Province).filter(p => p !== Province.NASIONAL),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// ============================================
// GET ALL COMMODITIES (INFO)
// ============================================

export async function getCommoditiesList(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    res.json({
      success: true,
      commodities: Object.values(CommodityType),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default {
  getNationalPrices,
  getProvincePrices,
  getPriceHistory,
  getProvincesList,
  getCommoditiesList,
};
