/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f4eefe',
          100: '#e5d4fb',
          200: '#caa8f7',
          300: '#a875ee',
          400: '#9148e6',
          500: '#7c3aed', // Violet — Linear-style
          600: '#6829c7',
          700: '#54219f',
          800: '#421a7c',
          900: '#321660',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
