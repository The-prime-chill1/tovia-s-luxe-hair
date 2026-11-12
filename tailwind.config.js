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
          pink: "#E8175D",
          hotPink: "#FF1493",
          magenta: "#C2185B",
          darkPink: "#880E4F",
          lightPink: "#FCE4EC",
          gold: "#D4AF37",
          darkGold: "#AA8C2C",
          dark: "#0F0C10",
          cardDark: "#1A151F",
          borderDark: "#2D2235",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
