/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'muni-blue': '#0F4C81',
        'muni-yellow': '#FFC107',
      }
    },
  },
  plugins: [],
}