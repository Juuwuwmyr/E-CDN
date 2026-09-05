/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cdn-blue':       '#002280',
        'cdn-blue-dark':  '#001560',
        'cdn-blue-light': '#2952CC',
        'cdn-red':        '#C8102E',
        'cdn-red-dark':   '#a00c24',
        'cdn-gold':       '#FFD700',
        'cdn-gold-dark':  '#C8960C',
        'cdn-gold-light': '#FFF8DC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
