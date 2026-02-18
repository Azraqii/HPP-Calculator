import { Ingredient, Recipe, MenuItem } from '../types';
import { apiGet } from './api';

// Market price cache to avoid excessive API calls
const marketPriceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 30000; // 30 seconds

// Commodity to ingredient name mapping
const COMMODITY_TO_INGREDIENT: Record<string, string[]> = {
  'BERAS': ['beras', 'rice'],
  'TEPUNG_TERIGU': ['tepung', 'tepung terigu', 'flour'],
  'GULA_PASIR': ['gula', 'gula pasir', 'sugar'],
  'MINYAK_GORENG': ['minyak', 'minyak goreng', 'cooking oil'],
  'TELUR_AYAM': ['telur', 'telur ayam', 'egg'],
  'DAGING_AYAM': ['ayam', 'daging ayam', 'chicken'],
  'DAGING_SAPI': ['sapi', 'daging sapi', 'beef'],
  'CABAI_MERAH': ['cabai', 'cabe', 'cabai merah', 'chili'],
  'CABAI_RAWIT': ['cabai rawit', 'cabe rawit'],
  'BAWANG_MERAH': ['bawang merah', 'shallot'],
  'BAWANG_PUTIH': ['bawang putih', 'garlic'],
  'TOMAT': ['tomat', 'tomato'],
  'SUSU': ['susu', 'milk'],
  'KENTANG': ['kentang', 'potato'],
  'WORTEL': ['wortel', 'carrot'],
};

// Helper to find matching commodity for ingredient name
const findMatchingCommodity = (ingredientName: string, commodityData: any[]): number | null => {
  const lowerIngredient = ingredientName.toLowerCase();
  
  // Try to find exact or partial match
  for (const [commodity, keywords] of Object.entries(COMMODITY_TO_INGREDIENT)) {
    const match = commodityData.find((item: any) => item.commodity === commodity);
    if (match && keywords.some(keyword => lowerIngredient.includes(keyword))) {
      return match.price;
    }
  }
  
  return null;
};

export const DB = {
  getIngredients(): Ingredient[] {
    return JSON.parse(localStorage.getItem('hpp_ingredients') || '[]');
  },

  getRecipes(): Recipe[] {
    return JSON.parse(localStorage.getItem('hpp_recipes') || '[]');
  },

  getMenuItems(): MenuItem[] {
    return JSON.parse(localStorage.getItem('hpp_menuItems') || '[]');
  },

  saveIngredients(ingredients: Ingredient[]): void {
    localStorage.setItem('hpp_ingredients', JSON.stringify(ingredients));
  },

  saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem('hpp_recipes', JSON.stringify(recipes));
  },

  saveMenuItems(menuItems: MenuItem[]): void {
    localStorage.setItem('hpp_menuItems', JSON.stringify(menuItems));
  },

  // Fetch real market price from API
  async fetchRealMarketPrice(ingredientName: string): Promise<number | null> {
    try {
      const cached = marketPriceCache[ingredientName];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
      }

      // Use new API client
      const response = await apiGet<{ success: boolean; tier: string; data: any[] }>('/prices/national');
      
      if (response.success && response.data) {
        // Use the commodity mapping helper
        const matchedPrice = findMatchingCommodity(ingredientName, response.data);
        
        if (matchedPrice) {
          marketPriceCache[ingredientName] = { price: matchedPrice, timestamp: Date.now() };
          return matchedPrice;
        }
      }
      
      return null;
    } catch (error) {
      // API call failed (not authenticated or network error)
      console.log('Failed to fetch market price:', error);
      return null;
    }
  },

  // Get market price with fallback to simulation
  getMarketPrice(ingredientName: string): number {
    // Try to get from cache first (if API was successful before)
    const cached = marketPriceCache[ingredientName];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    // Fallback: Simulate market price (independent from user input)
    let hash = 0;
    for (let i = 0; i < ingredientName.length; i++) {
      hash = ((hash << 5) - hash) + ingredientName.charCodeAt(i);
      hash = hash & hash;
    }
    
    const timeWindow = Math.floor(Date.now() / 30000);
    const seed = Math.abs(hash + timeWindow);
    const random = (seed * 9301 + 49297) % 233280 / 233280;
    
    // Create market base price (8000-25000 range)
    const marketBase = 8000 + (Math.abs(hash) % 17000);
    const fluctuation = (random - 0.5) * 0.3;
    const livePrice = Math.round(marketBase * (1 + fluctuation));
    
    return livePrice;
  },

  // Initialize market prices with API fetch (async)
  async initializeMarketPrices(ingredients: Ingredient[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    // Try to fetch real prices from API first
    await Promise.all(
      ingredients.map(async (ing) => {
        const realPrice = await this.fetchRealMarketPrice(ing.name);
        if (realPrice) {
          prices[ing.name] = realPrice;
        } else {
          // Fallback to simulation if API fails or commodity not found
          prices[ing.name] = this.getMarketPrice(ing.name);
        }
      })
    );
    
    return prices;
  },
};
