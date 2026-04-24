/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#121417',
        surface: '#1A1D21',
        surfaceLight: '#24282E',
        primary: '#85B523', // Greenish accent from the image
        primaryDark: '#2C3E50',
        textLight: '#E2E8F0',
        textMuted: '#94A3B8',
        borderDark: '#2F333A',
      }
    },
  },
  plugins: [],
}
