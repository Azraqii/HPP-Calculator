export interface Ingredient {
  id: string | number; // Support both for backward compatibility
  name: string;
  price: number;
  unit: 'kg' | 'liter' | 'pcs';
}

export interface RecipeIngredient {
  ingredientId: string | number;
  quantity: number;
}

export interface Recipe {
  id: string | number;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface MenuItem {
  id: string | number;
  name: string;
  recipeId: string | number;
  sellingPrice: number;
}

export type MarginStatus = 'safe' | 'warning' | 'danger';

// Auth & Premium types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  status: 'FREE' | 'PREMIUM' | 'EXPIRED';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isPremium: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SubscriptionPlan {
  id: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  name: string;
  price: number;
  duration: number;
  label: string;
  savings?: string;
}
