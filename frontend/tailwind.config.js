/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF8F5',
          100: '#F7EBE1',
          200: '#EED5C0',
          300: '#DFB595',
          400: '#CE9067',
          500: '#BC7242', // Caramel Warm
          600: '#A35630', // Warm Roast
          700: '#834026',
          800: '#65301F',
          900: '#4B2317', // Deep Espresso
          950: '#2E130C', // Dark Roast
        },
      },
    },
  },
  plugins: [],
};

