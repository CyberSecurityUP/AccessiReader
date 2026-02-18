/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        reader: {
          primary: "#2563eb",
          secondary: "#7c3aed",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
          dark: "#0f172a",
          "dark-lighter": "#1e293b",
          "hc-bg": "#000000",
          "hc-fg": "#ffffff",
          "hc-accent": "#ffff00"
        }
      }
    }
  },
  plugins: []
}
