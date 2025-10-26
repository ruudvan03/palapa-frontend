// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'lacasona-custom': ['Great Vibes', 'cursive'], 
      },
      colors: { // <-- Sección de colores
        'cafe-oscuro': '#795548', // <-- ¡Nuevo color café!
      }
    },
  },
  plugins: [],
}