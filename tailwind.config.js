/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media", // aktiviert automatischen Dark-Mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef9ff",
          100: "#d8f0ff",
          400: "#38bdf8",   // helles Blau (Darkmode-Farbe)
          500: "#0ea5e9",   // Primärfarbe
          700: "#0369a1"    // dunkles Blau
        }
      }
    }
  },
  plugins: [],
};
