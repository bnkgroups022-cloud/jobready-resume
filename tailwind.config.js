/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef4ff', 100: '#dbe6fe', 500: '#3b6cf6', 600: '#2553e0', 700: '#1d42b5', 900: '#172554' },
      },
    },
  },
  plugins: [],
};
