import React, { useState } from 'react';
import { Ingredient } from '../types';
import { formatCurrency } from '../utils/calculations';

interface IngredientsCardProps {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onDeleteIngredient: (id: number) => void;
  marketPrices: Record<string, number>;
}

export const IngredientsCard: React.FC<IngredientsCardProps> = ({
  ingredients,
  onAddIngredient,
  onDeleteIngredient,
  marketPrices,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'kg' | 'liter' | 'pcs'>('kg');

  const handleSubmit = () => {
    if (!name || !price) return;

    onAddIngredient({
      name,
      price: parseFloat(price),
      unit,
    });

    setName('');
    setPrice('');
    setUnit('kg');
  };

  return (
    <div className="bg-dark-surface rounded-2xl p-8 shadow-md-dark border border-dark-border animate-fade-in-up hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
        <h2 className="font-syne text-2xl font-bold text-dark-text">Bahan Baku</h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-success/15 text-success animate-pulse-slow">
          ● LIVE
        </span>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Nama Bahan</label>
        <input
          type="text"
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
          placeholder="cth: Tepung Terigu"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-dark-text">Harga Beli</label>
          <input
            type="number"
            className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-dark-text-muted"
            placeholder="15000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-dark-text">Satuan</label>
          <select
            className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'kg' | 'liter' | 'pcs')}
          >
            <option value="kg">Kg</option>
            <option value="liter">Liter</option>
            <option value="pcs">Pcs</option>
          </select>
        </div>
      </div>

      <button
        className="w-full px-6 py-3.5 bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg shadow-accent/30 active:translate-y-0"
        onClick={handleSubmit}
      >
        Tambah Bahan
      </button>

      <div className="flex flex-col gap-3 mt-4">
        {ingredients.length === 0 ? (
          <div className="text-center py-12 text-dark-text-muted">
            <div className="text-5xl mb-4 opacity-50">📦</div>
            <p>Belum ada bahan baku. Tambahkan bahan pertama Anda!</p>
          </div>
        ) : (
          ingredients.map((ing) => (
            <div
              key={ing.id}
              className="bg-dark-bg p-4 rounded-lg border border-dark-border flex justify-between items-center transition-all duration-300 hover:border-accent hover:translate-x-1"
            >
              <div>
                <h4 className="text-base mb-1 text-dark-text">{ing.name}</h4>
                <p className="text-sm text-dark-text-muted">
                  {formatCurrency(ing.price)} / {ing.unit}
                </p>
                {marketPrices[ing.name] && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-xs text-accent mt-2">
                    <span>📊</span>
                    <span>Market: {formatCurrency(marketPrices[ing.name])}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-syne font-bold text-lg text-accent">
                  {formatCurrency(ing.price)}
                </span>
                <button
                  className="px-4 py-2 bg-danger/10 text-danger border border-danger rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-danger/20"
                  onClick={() => onDeleteIngredient(ing.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
