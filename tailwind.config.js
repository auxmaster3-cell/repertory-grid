module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e8e1ff',
          200: '#d1c3ff',
          300: '#b9a4ff',
          400: '#a286ff',
          500: '#8b6efc',
          600: '#7c5cfc',
          700: '#6a48e7',
          800: '#5835d0',
          900: '#4020a0',
        },
        secondary: {
          50: '#fdf8f6',
          100: '#fef0eb',
          200: '#ffe0d5',
          300: '#ffc8b5',
          400: '#ffa888',
          500: '#ff8a65',
          600: '#f56b3f',
          700: '#e04d1f',
          800: '#c23a10',
          900: '#8f2809',
        },
        calm: '#F8F6FA',
        surface: '#FFFFFF',
        ink: '#2E2C34',
        muted: '#6F6B7A',
        success: '#4ECBA5',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(46, 44, 52, 0.04)',
        'card-hover': '0 8px 32px rgba(46, 44, 52, 0.08)',
        'soft': '0 2px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
