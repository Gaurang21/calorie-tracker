/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff2ec',
          100: '#ffe0d0',
          200: '#ffbe97',
          300: '#ff9c5e',
          400: '#ff7a35',
          500: '#FF5A1F', // Electric orange
          600: '#e54e1a',
          700: '#b83d14',
          800: '#902f10',
          900: '#6a220b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Oswald', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
