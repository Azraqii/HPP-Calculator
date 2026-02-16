import { Ingredient, Recipe, MenuItem } from '../types';

// Market price cache to avoid excessive API calls
const marketPriceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 30000; // 30 seconds

// API Configuration - Anda bisa ganti dengan API Anda sendiri
const MARKET_API_CONFIG = {
  enabled: true, // Set false untuk pakai simulasi saja
  endpoint: 'YOUR_API_ENDPOINT_HERE', // Ganti dengan API endpoint Anda
  apiKey: 'YOUR_API_KEY_HERE', // Optional: API key jika diperlukan
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
    if (!MARKET_API_CONFIG.enabled) {
      return null;
    }

    try {
      // Check cache first
      const cached = marketPriceCache[ingredientName];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
      }

      // Example API call - sesuaikan dengan API Anda
      const response = await fetch(
        `${MARKET_API_CONFIG.endpoint}?ingredient=${encodeURIComponent(ingredientName)}`,
        {
          headers: MARKET_API_CONFIG.apiKey
            ? { 'Authorization': `Bearer ${MARKET_API_CONFIG.apiKey}` }
            : {},
        }
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const price = data.price || data.marketPrice || null;

      if (price) {
        // Cache the result
        marketPriceCache[ingredientName] = {
          price,
          timestamp: Date.now(),
        };
        return price;
      }

      return null;
    } catch (error) {
      console.warn('Failed to fetch real market price:', error);
      return null;
    }
  },

  // Get market price with fallback to simulation
  getMarketPrice(ingredientName: string, basePrice: number): number {
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
    
    // Try to fetch real prices from API
    if (MARKET_API_CONFIG.enabled) {
      await Promise.all(
        ingredients.map(async (ing) => {
          const realPrice = await this.fetchRealMarketPrice(ing.name);
          if (realPrice) {
            prices[ing.name] = realPrice;
          } else {
            prices[ing.name] = this.getMarketPrice(ing.name, ing.price);
          }
        })
      );
    } else {
      // Use simulation
      ingredients.forEach((ing) => {
        prices[ing.name] = this.getMarketPrice(ing.name, ing.price);
      });
    }
    
    return prices;
  },
};
