import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { apiPost } from '../utils/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'MONTHLY',
    name: 'Bulanan',
    price: 49000,
    duration: 30,
    label: 'Bulanan',
  },
  {
    id: 'QUARTERLY',
    name: '3 Bulan',
    price: 129000,
    duration: 90,
    label: '3 Bulan',
    savings: 'Hemat 12%',
  },
  {
    id: 'YEARLY',
    name: 'Tahunan',
    price: 490000,
    duration: 365,
    label: 'Tahunan',
    savings: 'Hemat 17%',
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async (planId: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiPost<{ snapToken: string; redirectUrl: string }>(
        '/subscription/create',
        { plan: planId }
      );

      // Open Midtrans Snap
      if ((window as any).snap) {
        (window as any).snap.pay(response.snapToken, {
          onSuccess: function (result: any) {
            console.log('Payment success:', result);
            onClose();
            // Refresh user data to update premium status
            window.location.reload();
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result);
            onClose();
          },
          onError: function (result: any) {
            console.error('Payment error:', result);
            setError('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: function () {
            console.log('Payment popup closed');
            setIsLoading(false);
          },
        });
      } else {
        setError('Midtrans Snap tidak tersedia. Silakan refresh halaman.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat transaksi');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div>
            <h2 className="font-syne text-2xl font-bold text-dark-text mb-1">
              Upgrade ke Premium
            </h2>
            <p className="text-dark-text-muted">
              Dapatkan akses unlimited dan fitur eksklusif
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:translate-y-[-4px] ${
                  plan.id === 'QUARTERLY'
                    ? 'border-accent bg-accent/5 shadow-lg'
                    : 'border-dark-border bg-dark-bg hover:border-accent/50'
                }`}
              >
                {plan.id === 'QUARTERLY' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 bg-accent text-dark-bg text-xs font-bold uppercase rounded-full">
                      Paling Populer
                    </span>
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute -top-2 -right-2">
                    <span className="px-2 py-1 bg-success text-white text-xs font-bold rounded-full">
                      {plan.savings}
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="font-syne text-xl font-bold text-dark-text mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-1">
                    <span className="font-syne text-3xl font-bold text-accent">
                      {formatCurrency(plan.price)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-text-muted">
                    untuk {plan.duration} hari
                  </p>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 ${
                    plan.id === 'QUARTERLY'
                      ? 'bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg hover:shadow-lg shadow-accent/30'
                      : 'bg-dark-surface-hover text-dark-text border border-dark-border hover:border-accent'
                  } ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:translate-y-[-2px]'
                  }`}
                >
                  {isLoading ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="bg-dark-bg rounded-xl p-6 border border-dark-border">
            <h4 className="font-syne text-lg font-bold text-dark-text mb-4">
              ✨ Fitur Premium
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Unlimited bahan baku',
                'Harga live per provinsi',
                'Histori harga 30 hari',
                'Export PDF & Excel',
                'Analisis margin detail',
                'Priority support',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-dark-text">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger rounded-lg">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <p className="text-center text-xs text-dark-text-muted mt-6">
            Pembayaran aman melalui Midtrans. Auto-renewal dapat dinonaktifkan kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
};
