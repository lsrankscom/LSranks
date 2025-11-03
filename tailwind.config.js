/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // optional: zwei Blautöne wie zuvor
        brand: {
          600: "#1e3a8a", // dunkler
          400: "#3b82f6", // heller
        },
      },
    },
  },
  plugins: [],
};
