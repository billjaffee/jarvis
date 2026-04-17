/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        hud: ['Rajdhani', 'sans-serif'],
        body: ['Barlow Condensed', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      colors: {
        gold: '#c8830a',
        amber: '#e8991a',
        bright: '#ffb830',
        iron: '#d4561a',
      },
    },
  },
  plugins: [],
}
