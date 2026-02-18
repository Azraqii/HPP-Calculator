import { useState, useEffect } from 'react';
import { Ingredient, Recipe, MenuItem } from './types';
import { DB } from './utils/db';
import { IngredientsCard } from './components/IngredientsCard';
import { RecipesCard } from './components/RecipesCard';
import { MenuCard } from './components/MenuCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';

function AppContent() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const { user, isAuthenticated, isPremium, logout, isLoading } = useAuth();

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadUserData();
    } else if (!isAuthenticated) {
      // Clear data when logged out
      setIngredients([]);
      setRecipes([]);
      setMenuItems([]);
      setMarketPrices({});
    }
  }, [isAuthenticated, isLoading]);

  const loadUserData = async () => {
    setDataLoading(true);
    try {
      const [ingredientsData, recipesData, menuItemsData] = await Promise.all([
        DB.getIngredients(),
        DB.getRecipes(),
        DB.getMenuItems(),
      ]);
      setIngredients(ingredientsData);
      setRecipes(recipesData);
      setMenuItems(menuItemsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch market prices every 30 seconds
  useEffect(() => {
    const updateMarketPrices = async () => {
      const prices = await DB.initializeMarketPrices(ingredients);
      setMarketPrices(prices);
    };

    updateMarketPrices();
    const interval = setInterval(updateMarketPrices, 30000);
    return () => clearInterval(interval);
  }, [ingredients]);

  const handleAddIngredient = async (ingredient: Omit<Ingredient, 'id'>) => {
    const newIngredient = await DB.saveIngredient(ingredient);
    if (newIngredient) {
      setIngredients([...ingredients, newIngredient]);
    }
  };

  const handleDeleteIngredient = async (id: number | string) => {
    const success = await DB.deleteIngredient(String(id));
    if (success) {
      setIngredients(ingredients.filter((i) => i.id !== id));
    }
  };

  const handleAddRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe = await DB.saveRecipe(recipe);
    if (newRecipe) {
      setRecipes([...recipes, newRecipe]);
    }
  };

  const handleDeleteRecipe = async (id: number | string) => {
    const success = await DB.deleteRecipe(String(id));
    if (success) {
      setRecipes(recipes.filter((r) => r.id !== id));
    }
  };

  const handleAddMenuItem = async (menuItem: Omit<MenuItem, 'id'>) => {
    const newMenuItem = await DB.saveMenuItem(menuItem);
    if (newMenuItem) {
      setMenuItems([...menuItems, newMenuItem]);
    }
  };

  const handleDeleteMenuItem = async (id: number | string) => {
    const success = await DB.deleteMenuItem(String(id));
    if (success) {
      setMenuItems(menuItems.filter((m) => m.id !== id));
    }
  };

  const handleLogout = async () => {
    await logout();
    // Data will be cleared by the useEffect when isAuthenticated becomes false
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-dark-text-muted">{isLoading ? 'Loading...' : 'Loading your data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,51,102,0.06)_0%,transparent_50%)]">
      {/* Auth Header */}
      <div className="max-w-[1400px] mx-auto mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-success rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="font-syne font-bold text-dark-text">Stackra HPP</h2>
              <p className="text-xs text-dark-text-muted">SaaS Calculator</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {isAuthenticated ? (
              <>
                <div className="text-left sm:text-right flex-1 sm:flex-initial">
                  <p className="text-xs sm:text-sm font-medium text-dark-text truncate max-w-[150px] sm:max-w-none">{user?.name || user?.email}</p>
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isPremium ? 'bg-warning/15 text-warning' : 'bg-dark-border text-dark-text-muted'
                    }`}>
                      {isPremium ? '⭐ Premium' : 'Free'}
                    </span>
                  </div>
                </div>
                {!isPremium && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-br from-warning to-orange-500 text-dark-bg rounded-lg font-semibold text-xs sm:text-sm hover:translate-y-[-2px] transition-all duration-300"
                  >
                    ⭐ Upgrade
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 bg-dark-bg border border-dark-border text-dark-text rounded-lg font-semibold text-xs sm:text-sm hover:border-accent transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 sm:px-4 py-2 bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg rounded-lg font-semibold text-xs sm:text-sm hover:translate-y-[-2px] transition-all duration-300 w-full sm:w-auto"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </div>

      <header className="text-center mb-8 md:mb-12 animate-fade-in-down px-2">
        <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-accent to-success bg-clip-text text-transparent mb-2 tracking-tight">
          Kalkulator HPP
        </h1>
        <p className="text-dark-text-muted text-sm sm:text-base md:text-lg lg:text-xl font-light">
          Smart Business Tool untuk Monitoring Profit Margin Real-Time
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[1400px] mx-auto">
        <IngredientsCard
          ingredients={ingredients}
          onAddIngredient={handleAddIngredient}
          onDeleteIngredient={handleDeleteIngredient}
          marketPrices={marketPrices}
        />
        <RecipesCard
          recipes={recipes}
          ingredients={ingredients}
          onAddRecipe={handleAddRecipe}
          onDeleteRecipe={handleDeleteRecipe}
        />
        <MenuCard
          menuItems={menuItems}
          recipes={recipes}
          ingredients={ingredients}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
        />
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
