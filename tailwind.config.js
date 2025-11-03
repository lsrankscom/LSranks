/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef9ff",
          100: "#d8f0ff",
          500: "#0ea5e9",   // primär hellblau
          700: "#0369a1"    // dunkelblau
        }
      }
    }
  },
  plugins: [],
};
