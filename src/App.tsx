import { useState, useEffect } from 'react';
import { Ingredient, Recipe, MenuItem } from './types';
import { DB } from './utils/db';
import { IngredientsCard } from './components/IngredientsCard';
import { RecipesCard } from './components/RecipesCard';
import { MenuCard } from './components/MenuCard';

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(DB.getIngredients());
  const [recipes, setRecipes] = useState<Recipe[]>(DB.getRecipes());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DB.getMenuItems());
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

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

  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newIngredient = {
      ...ingredient,
      id: Date.now(),
    };
    const updated = [...ingredients, newIngredient];
    setIngredients(updated);
    DB.saveIngredients(updated);
  };

  const handleDeleteIngredient = (id: number) => {
    const updated = ingredients.filter((i) => i.id !== id);
    setIngredients(updated);
    DB.saveIngredients(updated);
  };

  const handleAddRecipe = (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe = {
      ...recipe,
      id: Date.now(),
    };
    const updated = [...recipes, newRecipe];
    setRecipes(updated);
    DB.saveRecipes(updated);
  };

  const handleDeleteRecipe = (id: number) => {
    const updated = recipes.filter((r) => r.id !== id);
    setRecipes(updated);
    DB.saveRecipes(updated);
  };

  const handleAddMenuItem = (menuItem: Omit<MenuItem, 'id'>) => {
    const newMenuItem = {
      ...menuItem,
      id: Date.now(),
    };
    const updated = [...menuItems, newMenuItem];
    setMenuItems(updated);
    DB.saveMenuItems(updated);
  };

  const handleDeleteMenuItem = (id: number) => {
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    DB.saveMenuItems(updated);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,51,102,0.06)_0%,transparent_50%)]">
      <header className="text-center mb-12 animate-fade-in-down">
        <h1 className="font-syne text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-accent to-success bg-clip-text text-transparent mb-2 tracking-tight">
          Kalkulator HPP
        </h1>
        <p className="text-dark-text-muted text-lg md:text-xl font-light">
          Smart Business Tool untuk Monitoring Profit Margin Real-Time
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
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
    </div>
  );
}

export default App;
