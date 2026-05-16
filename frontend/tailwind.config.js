/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1B4D3E",
          gold: "#C9A227",
          cream: "#F6F3EA",
          brown: "#5C4033",
        },
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(27, 77, 62, 0.12)",
      },
    },
  },
  plugins: [],
};
