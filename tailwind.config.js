/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f9ef',
          100: '#c7f1d6',
          200: '#90e3ad',
          300: '#5fd589',
          400: '#3acb6f',
          500: '#30D158', // Apple system green
          600: '#28b04a',
          700: '#1e8a3a',
          800: '#176a2d',
          900: '#114f22',
        },
        // Apple system semantic colors used for macros
        sky:    { DEFAULT: '#0A84FF' },
        amber:  { DEFAULT: '#FF9F0A' },
        ruby:   { DEFAULT: '#FF453A' },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tight2: '-0.02em',
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        elevation: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        elevation2: '0 4px 14px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'lift-in': 'liftIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        liftIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
