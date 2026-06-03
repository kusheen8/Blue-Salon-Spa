/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        gold: "#B8956A",
        "gold-dark": "#A07850",
        cream: "#FAF8F5",
        "warm-gray": "#F5F0EA",
        charcoal: "#1C1C1C",
      },
    },
  },
  plugins: [],
};
