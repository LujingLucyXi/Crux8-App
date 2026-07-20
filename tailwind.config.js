/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0F2D3A',
          700: '#1F4451',
          600: '#3A5661',
          500: '#4B6472',
          300: '#8FA0AA',
          100: '#D9E1E6',
        },
        teal: {
          600: '#2C7A7B',
          500: '#3D9394',
          100: '#C7E4E4',
        },
        gold: {
          500: '#F4B942',
          100: '#FBEBC5',
        },
        coral: {
          500: '#FF6B6B',
          100: '#FFD9D9',
        },
        sky: {
          200: '#C7D9EB',
        },
        paper: {
          50: '#F2F4F7',
          100: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 240ms ease-out',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
