import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "#0A7C6E", dark: "#065E52", light: "#E6F5F3" },
        accent:    "#C9A84C",
        charcoal:  "#1A1A2E",
        slate:     "#6B7280",
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body:    ['Inter', 'sans-serif'],
        accent:  ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [react(),tailwindcss()],
})
