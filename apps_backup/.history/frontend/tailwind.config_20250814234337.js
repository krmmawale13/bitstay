// apps/frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",          // main frontend code
    "../../packages/ui/**/*.{js,ts,jsx,tsx}", // if you have shared UI components
  ],
  theme: {
    extend: {
      colors: {
        primary: "#007B83",
        secondary: "#F5F5F5",
        accent: "#F9B24E",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
