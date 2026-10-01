/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        rentora: {
          dark: "#1e293b",
          lighter: "#f1f5f9",
          accent: "#3b82f6",
          muted: "#64748b",
        }
      }
    }
  },
  plugins: [],
}