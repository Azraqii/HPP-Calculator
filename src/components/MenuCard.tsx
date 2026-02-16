import React, { useState } from 'react';
import { MenuItem, Recipe, Ingredient } from '../types';
import {
  calculateHPP,
  calculateMargin,
  formatCurrency,
  getMarginStatus,
  getAverageMargin,
} from '../utils/calculations';

interface MenuCardProps {
  menuItems: MenuItem[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  onAddMenuItem: (menuItem: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (id: number) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  menuItems,
  recipes,
  ingredients,
  onAddMenuItem,
  onDeleteMenuItem,
}) => {
  const [name, setName] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const handleSubmit = () => {
    if (!name || !recipeId || !sellingPrice) return;

    onAddMenuItem({
      name,
      recipeId: parseInt(recipeId),
      sellingPrice: parseFloat(sellingPrice),
    });

    setName('');
    setRecipeId('');
    setSellingPrice('');
  };

  const averageMargin = getAverageMargin(menuItems, recipes, ingredients);
  const marginStatus = getMarginStatus(averageMargin);

  const getMarginClass = () => {
    switch (marginStatus.status) {
      case 'safe':
        return 'bg-success/15 border-success text-success';
      case 'warning':
        return 'bg-warning/15 border-warning text-warning';
      case 'danger':
        return 'bg-danger/15 border-danger text-danger animate-shake';
      default:
        return '';
    }
  };

  const totalRevenue = menuItems.reduce((sum, item) => sum + item.sellingPrice, 0);
  const totalCost = menuItems.reduce((sum, item) => {
    const recipe = recipes.find((r) => r.id === item.recipeId);
    return sum + calculateHPP(recipe, ingredients);
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="bg-dark-surface rounded-2xl p-8 shadow-md-dark border border-dark-border animate-fade-in-up [animation-delay:0.2s] hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
        <h2 className="font-syne text-2xl font-bold text-dark-text">Menu & Dashboard</h2>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Nama Menu</label>
        <input
          type="text"
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
          placeholder="cth: Brownies Special"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Resep</label>
        <select
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
        >
          <option value="">Pilih Resep</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Harga Jual</label>
        <input
          type="number"
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
          placeholder="50000"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
        />
      </div>

      <button
        className="w-full px-6 py-3.5 bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg shadow-accent/30 active:translate-y-0"
        onClick={handleSubmit}
      >
        Tambah Menu
      </button>

      {menuItems.length > 0 && (
        <>
          <div
            className={`mt-8 p-8 rounded-xl text-center relative overflow-hidden border-2 transition-all duration-500 ${getMarginClass()}`}
          >
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_20px)]"></div>
            <div className="relative">
              <div className="font-syne text-5xl font-extrabold mb-2">
                {averageMargin.toFixed(1)}%
              </div>
              <div className="text-lg font-semibold uppercase tracking-widest">
                {marginStatus.icon} {marginStatus.label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-dark-bg p-5 rounded-lg border border-dark-border text-center transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="font-syne text-2xl sm:text-3xl font-bold text-dark-text mb-1">
                {menuItems.length}
              </div>
              <div className="text-sm text-dark-text-muted">Total Menu</div>
            </div>

            <div className="bg-dark-bg p-5 rounded-lg border border-dark-border text-center transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="font-syne text-2xl sm:text-3xl font-bold text-dark-text mb-1">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-sm text-dark-text-muted">Total Harga Jual</div>
            </div>

            <div className="bg-dark-bg p-5 rounded-lg border border-dark-border text-center transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="font-syne text-2xl sm:text-3xl font-bold text-dark-text mb-1">
                {formatCurrency(totalCost)}
              </div>
              <div className="text-sm text-dark-text-muted">Total HPP</div>
            </div>

            <div className="bg-dark-bg p-5 rounded-lg border border-dark-border text-center transition-transform duration-300 hover:translate-y-[-2px] col-span-2 md:col-span-3">
              <div className="font-syne text-2xl sm:text-3xl font-bold text-success mb-1">
                {formatCurrency(totalProfit)}
              </div>
              <div className="text-sm text-dark-text-muted">Total Profit Potensial</div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 mt-6">
        {menuItems.length === 0 ? (
          <div className="text-center py-12 text-dark-text-muted">
            <div className="text-5xl mb-4 opacity-50">🍽️</div>
            <p>Belum ada menu. Tambahkan menu pertama Anda!</p>
          </div>
        ) : (
          menuItems.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId);
            const hpp = calculateHPP(recipe, ingredients);
            const margin = calculateMargin(item, recipes, ingredients);
            const status = getMarginStatus(margin);

            return (
              <div
                key={item.id}
                className="bg-dark-bg p-4 rounded-lg border border-dark-border transition-all duration-300 hover:border-accent"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-dark-text mb-1">{item.name}</h4>
                    <p className="text-sm text-dark-text-muted">{recipe?.name}</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-danger/10 text-danger border border-danger rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-danger/20"
                    onClick={() => onDeleteMenuItem(item.id)}
                  >
                    Hapus
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-dark-text-muted">HPP:</span>
                    <span className="ml-2 text-dark-text font-semibold">
                      {formatCurrency(hpp)}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-text-muted">Harga Jual:</span>
                    <span className="ml-2 text-dark-text font-semibold">
                      {formatCurrency(item.sellingPrice)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-dark-text-muted">Margin:</span>
                    <span
                      className={`ml-2 font-syne font-bold text-lg ${
                        status.status === 'safe'
                          ? 'text-success'
                          : status.status === 'warning'
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {margin.toFixed(1)}% {status.icon}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
