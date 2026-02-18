import { Ingredient, Recipe, MenuItem } from '../types';
import { apiGet, apiPost, apiDelete } from './api';

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
  
  // First try direct match with commodity name (case-insensitive, handle underscores)
  const directMatch = commodityData.find((item: any) => 
    item.commodity.toLowerCase().replace(/_/g, ' ') === lowerIngredient
  );
  if (directMatch) return directMatch.price;
  
  // Then try keyword matching
  for (const [commodity, keywords] of Object.entries(COMMODITY_TO_INGREDIENT)) {
    const match = commodityData.find((item: any) => item.commodity === commodity);
    if (match && keywords.some(keyword => lowerIngredient.includes(keyword))) {
      return match.price;
    }
  }
  
  return null;
};

export const DB = {
  // ============================================
  // INGREDIENTS
  // ============================================
  async getIngredients(): Promise<Ingredient[]> {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/data/ingredients');
      return response.data.map((ing: any) => ({
        id: ing.id,
        name: ing.name,
        price: ing.price,
        unit: ing.unit,
      }));
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      return [];
    }
  },

  async saveIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient | null> {
    try {
      const response = await apiPost<{ success: boolean; data: any }>('/data/ingredients', ingredient);
      return {
        id: response.data.id,
        name: response.data.name,
        price: response.data.price,
        unit: response.data.unit,
      };
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      return null;
    }
  },

  async deleteIngredient(id: string): Promise<boolean> {
    try {
      await apiDelete(`/data/ingredients/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      return false;
    }
  },

  // ============================================
  // RECIPES
  // ============================================
  async getRecipes(): Promise<Recipe[]> {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/data/recipes');
      return response.data.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
      }));
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      return [];
    }
  },

  async saveRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe | null> {
    try {
      const response = await apiPost<{ success: boolean; data: any }>('/data/recipes', recipe);
      return {
        id: response.data.id,
        name: response.data.name,
        ingredients: response.data.ingredients,
      };
    } catch (error) {
      console.error('Failed to save recipe:', error);
      return null;
    }
  },

  async deleteRecipe(id: string): Promise<boolean> {
    try {
      await apiDelete(`/data/recipes/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      return false;
    }
  },

  // ============================================
  // MENU ITEMS
  // ============================================
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/data/menu-items');
      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        recipeId: item.recipeId,
        sellingPrice: item.sellingPrice,
      }));
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      return [];
    }
  },

  async saveMenuItem(menuItem: Omit<MenuItem, 'id'>): Promise<MenuItem | null> {
    try {
      const response = await apiPost<{ success: boolean; data: any }>('/data/menu-items', menuItem);
      return {
        id: response.data.id,
        name: response.data.name,
        recipeId: response.data.recipeId,
        sellingPrice: response.data.sellingPrice,
      };
    } catch (error) {
      console.error('Failed to save menu item:', error);
      return null;
    }
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    try {
      await apiDelete(`/data/menu-items/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      return false;
    }
  },

  // ============================================
  // MARKET PRICES
  // ============================================
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
