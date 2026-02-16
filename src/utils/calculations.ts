import { Recipe, MenuItem, Ingredient, MarginStatus } from '../types';

export const calculateHPP = (recipe: Recipe | undefined, ingredients: Ingredient[]): number => {
  if (!recipe) return 0;

  return recipe.ingredients.reduce((total, item) => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    if (!ingredient) return total;
    return total + (ingredient.price * item.quantity);
  }, 0);
};

export const calculateMargin = (menuItem: MenuItem, recipes: Recipe[], ingredients: Ingredient[]): number => {
  const recipe = recipes.find(r => r.id === menuItem.recipeId);
  const hpp = calculateHPP(recipe, ingredients);
  if (hpp === 0) return 0;
  return ((menuItem.sellingPrice - hpp) / menuItem.sellingPrice) * 100;
};

export const getMarginStatus = (margin: number): { status: MarginStatus; label: string; icon: string } => {
  if (margin >= 40) return { status: 'safe', label: 'AMAN', icon: '✓' };
  if (margin >= 20) return { status: 'warning', label: 'HATI-HATI', icon: '⚠' };
  return { status: 'danger', label: 'BAHAYA!', icon: '✕' };
};

export const getAverageMargin = (menuItems: MenuItem[], recipes: Recipe[], ingredients: Ingredient[]): number => {
  if (menuItems.length === 0) return 0;
  const totalMargin = menuItems.reduce((sum, item) => sum + calculateMargin(item, recipes, ingredients), 0);
  return totalMargin / menuItems.length;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};
