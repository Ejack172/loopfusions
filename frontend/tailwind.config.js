/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        primary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "rgba(24, 24, 27, 0.6)",
          foreground: "#fafafa",
        },
        border: "rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #8b5cf655 0deg, #3b82f655 180deg, #8b5cf655 360deg)',
      },
    },
  },
  plugins: [],
}
