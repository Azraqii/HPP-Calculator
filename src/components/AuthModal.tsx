import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        if (!name) {
          setError('Nama harus diisi');
          setIsLoading(false);
          return;
        }
        await register({ email, password, name });
      }
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="font-syne text-2xl font-bold text-dark-text">
            {mode === 'login' ? 'Login' : 'Daftar Akun'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-2 bg-dark-bg/50 m-4 rounded-lg">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md font-syne font-semibold transition-all duration-300 ${
              mode === 'login'
                ? 'bg-accent text-dark-bg'
                : 'text-dark-text-muted hover:text-dark-text'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md font-syne font-semibold transition-all duration-300 ${
              mode === 'register'
                ? 'bg-accent text-dark-bg'
                : 'text-dark-text-muted hover:text-dark-text'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block mb-2 text-sm font-medium text-dark-text">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium text-dark-text">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-dark-text">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {mode === 'register' && (
              <p className="mt-1 text-xs text-dark-text-muted">
                Minimal 6 karakter
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger rounded-lg">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-syne font-semibold uppercase tracking-wider transition-all duration-300 ${
              isLoading
                ? 'bg-dark-border text-dark-text-muted cursor-not-allowed'
                : 'bg-gradient-to-br from-accent to-[#00b8d4] text-dark-bg hover:translate-y-[-2px] hover:shadow-lg shadow-accent/30'
            }`}
          >
            {isLoading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>

          <p className="text-center text-sm text-dark-text-muted">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-accent hover:underline font-semibold"
            >
              {mode === 'login' ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
