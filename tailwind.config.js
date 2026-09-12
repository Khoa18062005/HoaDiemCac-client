/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#141416',
        surface: {
          DEFAULT: '#19191D',
          card: '#1E1E22',
          elevated: '#25252B',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.04)'
        },
        crimson: {
          DEFAULT: '#A8201A',
          glow: '#c41e3a',
          subtle: 'rgba(168, 32, 26, 0.18)',
          border: 'rgba(196, 30, 58, 0.35)'
        },
        gold: {
          DEFAULT: '#D4AF37',
          dim: '#B39129',
          subtle: 'rgba(212, 175, 55, 0.12)',
          border: 'rgba(212, 175, 55, 0.35)'
        },
        jade: {
          DEFAULT: '#2E7D32',
          bright: '#34A853',
          subtle: 'rgba(46, 125, 50, 0.15)'
        },
        amber: {
          DEFAULT: '#D97706',
          subtle: 'rgba(217, 119, 6, 0.15)'
        }
      },
      fontFamily: {
        serif: ['"Noto Serif"', 'serif'],
        display: ['"Cinzel"', '"Noto Serif"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      animation: {
        'bell-shake': 'bell-shake 0.8s ease-in-out infinite',
        'badge-shake': 'badge-shake 0.8s ease-in-out infinite',
      },
      keyframes: {
        'bell-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%, 60%': { transform: 'rotate(-14deg) scale(1.1)' },
          '40%, 80%': { transform: 'rotate(14deg) scale(1.1)' },
        },
        'badge-shake': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '20%, 60%': { transform: 'rotate(-5deg) scale(1.05)' },
          '40%, 80%': { transform: 'rotate(5deg) scale(1.05)' },
        },
      }
    },
  },
  plugins: [],
}
