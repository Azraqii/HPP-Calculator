import React, { useState } from 'react';
import { Ingredient } from '../types';
import { formatCurrency } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

const COMMODITY_OPTIONS = [
  { value: 'Beras',         label: 'Beras',         unit: 'kg'    },
  { value: 'Tepung Terigu', label: 'Tepung Terigu', unit: 'kg'    },
  { value: 'Gula Pasir',    label: 'Gula Pasir',    unit: 'kg'    },
  { value: 'Minyak Goreng', label: 'Minyak Goreng', unit: 'liter' },
  { value: 'Telur Ayam',    label: 'Telur Ayam',    unit: 'kg'    },
  { value: 'Daging Ayam',   label: 'Daging Ayam',   unit: 'kg'    },
  { value: 'Daging Sapi',   label: 'Daging Sapi',   unit: 'kg'    },
  { value: 'Cabai Merah',   label: 'Cabai Merah',   unit: 'kg'    },
  { value: 'Cabai Rawit',   label: 'Cabai Rawit',   unit: 'kg'    },
  { value: 'Bawang Merah',  label: 'Bawang Merah',  unit: 'kg'    },
  { value: 'Bawang Putih',  label: 'Bawang Putih',  unit: 'kg'    },
  { value: 'Tomat',         label: 'Tomat',         unit: 'kg'    },
  { value: 'Susu',          label: 'Susu',          unit: 'liter' },
  { value: 'Kentang',       label: 'Kentang',       unit: 'kg'    },
  { value: 'Wortel',        label: 'Wortel',        unit: 'kg'    },
] as const;

interface IngredientsCardProps {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onDeleteIngredient: (id: number | string) => void;
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
  const { isPremium } = useAuth();

  const FREE_LIMIT = 5;
  const isLimitReached = !isPremium && ingredients.length >= FREE_LIMIT;

  const handleCommodityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = COMMODITY_OPTIONS.find(c => c.value === e.target.value);
    setName(e.target.value);
    if (selected) {
      setUnit(selected.unit as 'kg' | 'liter' | 'pcs');
    }
  };

  const handleSubmit = () => {
    if (!name || !price) return;
    if (isLimitReached) return;

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
        <div className="flex items-center gap-2">
          {isPremium && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-warning/15 text-warning">
              ⭐ Premium
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-success/15 text-success animate-pulse-slow">
            ● LIVE
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-dark-text">Nama Bahan</label>
        <select
          className="w-full px-4 py-3.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text font-inter transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          value={name}
          onChange={handleCommodityChange}
        >
          <option value="">Pilih Komoditas</option>
          {COMMODITY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
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
        className={`w-full px-6 py-3.5 rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 ${
          isLimitReached
            ? 'bg-dark-border text-dark-text-muted cursor-not-allowed'
            : 'bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg hover:translate-y-[-2px] hover:shadow-lg shadow-accent/30 active:translate-y-0'
        }`}
        onClick={handleSubmit}
        disabled={isLimitReached}
        title={isLimitReached ? `Limit FREE: ${FREE_LIMIT} bahan. Upgrade ke Premium untuk unlimited!` : ''}
      >
        {isLimitReached ? `🔒 Limit ${FREE_LIMIT} Bahan (Upgrade ke Premium)` : 'Tambah Bahan'}
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
              className="bg-dark-bg p-3 sm:p-4 rounded-lg border border-dark-border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all duration-300 hover:border-accent hover:translate-x-1"
            >
              <div className="flex-1">
                <h4 className="text-sm sm:text-base mb-1 text-dark-text">{ing.name}</h4>
                <p className="text-xs sm:text-sm text-dark-text-muted">
                  {formatCurrency(ing.price)} / {ing.unit}
                </p>
                {marketPrices[ing.name] && (
                  <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-accent/10 rounded-full text-xs text-accent mt-2">
                    <span>📊</span>
                    <span className="text-xs">Market: {formatCurrency(marketPrices[ing.name])}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center justify-between sm:justify-end">
                <span className="font-syne font-bold text-base sm:text-lg text-accent">
                  {formatCurrency(ing.price)}
                </span>
                <button
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-danger/10 text-danger border border-danger rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 hover:bg-danger/20"
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
