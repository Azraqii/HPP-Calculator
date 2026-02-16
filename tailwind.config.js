/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0e17',
        'dark-surface': '#151922',
        'dark-surface-hover': '#1d222e',
        'dark-border': '#2a3040',
        'dark-text': '#e8eaed',
        'dark-text-muted': '#9aa0b0',
        'accent': '#00d9ff',
        'success': '#00ff94',
        'warning': '#ffd000',
        'danger': '#ff3366',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sm-dark': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'md-dark': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'lg-dark': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out backwards',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeInDown: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}
