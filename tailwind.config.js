/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff4ec',
          100: '#ffe2d0',
          200: '#ffc4a3',
          300: '#ffa073',
          400: '#ff8a5e',
          500: '#FF8A65', // Warm coral/peach
          600: '#e57652',
          700: '#cc6044',
          800: '#ad4e38',
          900: '#8a3d2c',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Nunito"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
