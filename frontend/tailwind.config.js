/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          500: '#3b6cff',
          600: '#2a55e6',
          700: '#1f43b8',
        },
      },
    },
  },
  plugins: [],
};
