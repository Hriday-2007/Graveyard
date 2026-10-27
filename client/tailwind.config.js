/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        graveyard: {
          dark: '#0b0d10',
          mist: '#121714',
          stone: '#15191e',
          stoneBorder: '#232931',
          gold: '#d4af37',
          goldMuted: '#998131',
          goldGlow: 'rgba(212, 175, 55, 0.15)',
        },
      },
    },
  },
  plugins: [],
};
