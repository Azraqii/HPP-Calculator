export interface Ingredient {
  id: number;
  name: string;
  price: number;
  unit: 'kg' | 'liter' | 'pcs';
}

export interface RecipeIngredient {
  ingredientId: number;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface MenuItem {
  id: number;
  name: string;
  recipeId: number;
  sellingPrice: number;
}

export type MarginStatus = 'safe' | 'warning' | 'danger';
