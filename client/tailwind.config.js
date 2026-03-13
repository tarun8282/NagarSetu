/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF9933',
          50: '#fff3e3',
          100: '#ffe5c5',
          200: '#ffcb90',
          300: '#ffaa55',
          400: '#ff8a20',
          500: '#FF9933', // Action/Urgency
          600: '#eb7100',
          700: '#c35502',
          800: '#9b420b',
          900: '#7d370e',
        },
        'india-green': {
          DEFAULT: '#138808',
          50: '#f0fdf2',
          100: '#dafce0',
          200: '#b7f6c3',
          300: '#83eb97',
          400: '#48d664',
          500: '#20b73c',
          600: '#138808', // Success/AI 
          700: '#12700e',
          800: '#135912',
          900: '#114a12',
        },
        'navy-blue': {
          DEFAULT: '#000080',
          50: '#eef1ff',
          100: '#e0e7ff',
          200: '#cbd5fe',
          300: '#aab8fb',
          400: '#8293f7',
          500: '#5c6aec',
          600: '#4147df',
          700: '#3235c6',
          800: '#2b2da1',
          900: '#000080', // Anchor
        }
      },
      fontFamily: {
        deva: ['"Tiro Devanagari Hindi"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
