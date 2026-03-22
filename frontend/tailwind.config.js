/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      screens: {
        'xs': '475px',      // Extra small devices (large phones)
        'sm': '640px',      // Small devices (tablets)
        'md': '768px',      // Medium devices (small laptops)
        'lg': '1024px',     // Large devices (laptops/desktops)
        'xl': '1280px',     // Extra large devices (large desktops)
        '2xl': '1536px',    // 2X Extra large devices (larger desktops)
        '3xl': '1920px',    // 3X Extra large devices (ultra-wide monitors)
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [],
}
