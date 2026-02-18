/**
 * DATA CONTROLLER
 * ===============
 * 
 * Handles user-specific data (ingredients, recipes, menu items)
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// INGREDIENTS
// ============================================

export const getIngredients = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const ingredients = await prisma.userIngredient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Convert to frontend format
    const formattedIngredients = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      price: ing.price,
      unit: ing.unit,
    }));
    
    res.json({
      success: true,
      data: formattedIngredients,
    });
  } catch (error: any) {
    console.error('Get ingredients error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingredients',
    });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, price, unit } = req.body;
    
    if (!name || price === undefined || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, unit',
      });
    }
    
    const ingredient = await prisma.userIngredient.create({
      data: {
        userId,
        name,
        price: parseInt(price),
        unit,
      },
    });
    
    res.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.price,
        unit: ingredient.unit,
      },
    });
  } catch (error: any) {
    console.error('Create ingredient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ingredient',
    });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    // Verify ownership
    const ingredient = await prisma.userIngredient.findFirst({
      where: { id, userId },
    });
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingredient not found',
      });
    }
    
    await prisma.userIngredient.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Ingredient deleted',
    });
  } catch (error: any) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ingredient',
    });
  }
};

// ============================================
// RECIPES
// ============================================

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const recipes = await prisma.userRecipe.findMany({
      where: { userId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Convert to frontend format
    const formattedRecipes = recipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients.map(ri => ({
        ingredientId: ri.ingredient.id,
        quantity: ri.quantity,
      })),
    }));
    
    res.json({
      success: true,
      data: formattedRecipes,
    });
  } catch (error: any) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipes',
    });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, ingredients } = req.body;
    
    if (!name || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, ingredients (array)',
      });
    }
    
    // Create recipe with ingredients in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.userRecipe.create({
        data: {
          userId,
          name,
        },
      });
      
      // Create recipe ingredients
      if (ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing: any) => ({
            recipeId: newRecipe.id,
            ingredientId: ing.ingredientId,
            quantity: parseFloat(ing.quantity),
          })),
        });
      }
      
      return tx.userRecipe.findUnique({
        where: { id: newRecipe.id },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
    
    res.json({
      success: true,
      data: {
        id: recipe!.id,
        name: recipe!.name,
        ingredients: recipe!.ingredients.map(ri => ({
          ingredientId: ri.ingredient.id,
          quantity: ri.quantity,
        })),
      },
    });
  } catch (error: any) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create recipe',
    });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    // Verify ownership
    const recipe = await prisma.userRecipe.findFirst({
      where: { id, userId },
    });
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found',
      });
    }
    
    await prisma.userRecipe.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Recipe deleted',
    });
  } catch (error: any) {
    console.error('Delete recipe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recipe',
    });
  }
};

// ============================================
// MENU ITEMS
// ============================================

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const menuItems = await prisma.userMenuItem.findMany({
      where: { userId },
      include: {
        recipe: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Convert to frontend format
    const formattedMenuItems = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      recipeId: item.recipeId,
      sellingPrice: item.sellingPrice,
    }));
    
    res.json({
      success: true,
      data: formattedMenuItems,
    });
  } catch (error: any) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items',
    });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, recipeId, sellingPrice } = req.body;
    
    if (!name || !recipeId || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, recipeId, sellingPrice',
      });
    }
    
    // Verify recipe ownership
    const recipe = await prisma.userRecipe.findFirst({
      where: { id: recipeId, userId },
    });
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found',
      });
    }
    
    const menuItem = await prisma.userMenuItem.create({
      data: {
        userId,
        name,
        recipeId,
        sellingPrice: parseInt(sellingPrice),
      },
    });
    
    res.json({
      success: true,
      data: {
        id: menuItem.id,
        name: menuItem.name,
        recipeId: menuItem.recipeId,
        sellingPrice: menuItem.sellingPrice,
      },
    });
  } catch (error: any) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item',
    });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    // Verify ownership
    const menuItem = await prisma.userMenuItem.findFirst({
      where: { id, userId },
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }
    
    await prisma.userMenuItem.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Menu item deleted',
    });
  } catch (error: any) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item',
    });
  }
};

export default {
  getIngredients,
  createIngredient,
  deleteIngredient,
  getRecipes,
  createRecipe,
  deleteRecipe,
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
};
