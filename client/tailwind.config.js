/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium dark surfaces (cool neutral).
        ink: {
          950: '#0a0b0d', // page plane
          900: '#0f1013',
          850: '#141519', // card surface
          800: '#191a1f', // elevated surface
          750: '#20222a', // hover / inset
          700: '#2a2d36',
        },
        // Deadpool-leaning brand accent (chrome only, never a chart series).
        accent: {
          DEFAULT: '#ef4444',
          soft: '#f87171',
          deep: '#c81e2b',
          glow: 'rgba(239,68,68,0.35)',
        },
        // Status (mirrors the validated data-viz status palette).
        good: '#0ca30c',
        warn: '#fab219',
        bad: '#e5484d',
        // Text ink.
        fg: {
          DEFAULT: '#f5f6f7',
          muted: '#a1a5ad',
          faint: '#6b7079',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderColor: {
        hair: 'rgba(255,255,255,0.08)',
        hair2: 'rgba(255,255,255,0.14)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(239,68,68,0.4), 0 8px 30px -10px rgba(239,68,68,0.45)',
      },
      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        'card-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
