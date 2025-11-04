// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#e9f2ff",
          primary: "#2a69ff",
          dark: "#0d2b6b"
        }
      },
      borderRadius: {
        xl: "14px"
      }
    }
  },
  plugins: []
};
