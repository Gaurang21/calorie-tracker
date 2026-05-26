/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf5',
          100: '#d6f7e6',
          200: '#aeefce',
          300: '#7ce0b1',
          400: '#48cb90',
          500: '#22b074',
          600: '#168d5d',
          700: '#13704c',
          800: '#13593e',
          900: '#114934',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
