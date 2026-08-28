/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end premium pharmacy themed colors
        primary: {
          50: '#f0fbf7',
          100: '#dcf6ec',
          200: '#b9edd9',
          300: '#85deb9',
          400: '#4cc596',
          500: '#27a878',
          600: '#1b875f',
          700: '#176c4e',
          800: '#155640',
          900: '#134736',
          950: '#0a281f',
        },
      }
    },
  },
  plugins: [],
}
