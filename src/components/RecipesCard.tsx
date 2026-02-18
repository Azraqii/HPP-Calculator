import React, { useState } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../types';
import { calculateHPP, formatCurrency } from '../utils/calculations';

interface RecipesCardProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onDeleteRecipe: (id: number | string) => void;
}

export const RecipesCard: React.FC<RecipesCardProps> = ({
  recipes,
  ingredients,
  onAddRecipe,
  onDeleteRecipe,
}) => {
  const [name, setName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleAddIngredient = () => {
    if (!selectedIngredientId || !quantity) return;

    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredientId: selectedIngredientId,
        quantity: parseFloat(quantity),
      },
    ]);

    setSelectedIngredientId('');
    setQuantity('');
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name || recipeIngredients.length === 0) return;

    onAddRecipe({
      name,
      ingredients: recipeIngredients,
    });

    setName('');
    setRecipeIngredients([]);
  };

  return (
    <div className="bg-dark-surface rounded-2xl p-8 shadow-md-dark border border-dark-border animate-fade-in-up [animation-delay:0.1s] hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
        <h2 className="font-syne text-2xl font-bold text-dark-text">Resep</h2>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Nama Resep</label>
        <input
          type="text"
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
          placeholder="cth: Kue Brownies"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Komposisi</label>
        {recipeIngredients.map((item, index) => {
          const ingredient = ingredients.find((i) => String(i.id) === String(item.ingredientId));
          return (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-dark-bg rounded mb-2 text-sm"
            >
              <span className="text-dark-text">
                {ingredient?.name} - {item.quantity} {ingredient?.unit}
              </span>
              <button
                className="text-danger hover:text-danger/80 font-semibold"
                onClick={() => handleRemoveIngredient(index)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {ingredients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-dark-text">Bahan</label>
            <select
              className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
            >
              <option value="">Pilih Bahan</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-dark-text">Jumlah</label>
            <input
              type="number"
              className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
              placeholder="0.5"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <button
          className="flex-1 px-6 py-3.5 bg-dark-surface-hover text-dark-text border border-dark-border rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-dark-border"
          onClick={handleAddIngredient}
        >
          + Bahan
        </button>
        <button
          className="flex-1 px-6 py-3.5 bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg shadow-accent/30 active:translate-y-0"
          onClick={handleSubmit}
        >
          Simpan Resep
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {recipes.length === 0 ? (
          <div className="text-center py-12 text-dark-text-muted">
            <div className="text-5xl mb-4 opacity-50">👨‍🍳</div>
            <p>Belum ada resep. Buat resep pertama Anda!</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-dark-bg p-3 sm:p-4 rounded-lg border border-dark-border transition-all duration-300 hover:border-accent"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-2">
                <h4 className="text-sm sm:text-base font-semibold text-dark-text">{recipe.name}</h4>
                <button
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-danger/10 text-danger border border-danger rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 hover:bg-danger/20 w-full sm:w-auto"
                  onClick={() => onDeleteRecipe(recipe.id)}
                >
                  Hapus
                </button>
              </div>
              <div className="pt-2 border-t border-dark-border">
                {recipe.ingredients.map((item, idx) => {
                  const ingredient = ingredients.find((i) => String(i.id) === String(item.ingredientId));
                  return (
                    <div key={idx} className="flex justify-between items-center py-1 text-xs sm:text-sm">
                      <span className="text-dark-text-muted truncate mr-2">
                        {ingredient?.name} - {item.quantity} {ingredient?.unit}
                      </span>
                      <span className="text-dark-text whitespace-nowrap">
                        {formatCurrency((ingredient?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-dark-border font-semibold">
                  <span className="text-dark-text text-xs sm:text-sm">Total HPP:</span>
                  <span className="font-syne text-base sm:text-lg text-accent">
                    {formatCurrency(calculateHPP(recipe, ingredients))}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
