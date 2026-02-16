# Kalkulator HPP - Smart Business Tool

A modern, real-time HPP (Harga Pokok Penjualan / Cost of Goods Sold) calculator built with React, TypeScript, and Tailwind CSS.

## Features

- 📦 **Ingredients Management**: Add and track raw material costs
- 👨‍🍳 **Recipe Builder**: Create recipes with multiple ingredients
- 🍽️ **Menu Management**: Define menu items with selling prices
- 📊 **Live Market Prices**: Real-time market price API integration with simulation fallback
- 💰 **Profit Margin Analysis**: Real-time margin calculations
- ⚠️ **Margin Alerts**: Visual warnings for low-margin items
- 💾 **Local Storage**: Data persists across sessions
- 🌐 **API Ready**: Connect to real market price APIs (see [API_SETUP.md](API_SETUP.md))

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **LocalStorage** - Data persistence

## Project Structure

```
src/
├── components/        # React components
│   ├── IngredientsCard.tsx
│   ├── RecipesCard.tsx
│   └── MenuCard.tsx
├── utils/            # Utility functions
│   ├── db.ts         # LocalStorage operations
│   └── calculations.ts
├── types.ts          # TypeScript types
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## License

MIT
