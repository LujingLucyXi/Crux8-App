/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm parchment text scale on near-black (black + gold theme).
        // Luminance is inverted vs the old light theme: 900 = brightest text,
        // 100 = subtle dark track/border fill.
        ink: {
          900: '#F7F3EA',
          700: '#DED8C9',
          600: '#B8B2A1',
          500: '#948F82',
          300: '#55534D',
          100: '#26262C',
        },
        // Crux Gold — the primary brand.
        brand: {
          600: '#C9A24B',
          500: '#D9B45F',
          400: '#E8C766',
          100: '#2A2210',
        },
        // Was hot pink — folded into light gold (gradient partner).
        pink: {
          500: '#E8C766',
          400: '#F0D488',
          100: '#2A2210',
        },
        // Was acid lime — folded into gold (punch CTA / rewards).
        lime: {
          500: '#C9A24B',
          400: '#E8C766',
          100: '#2A2210',
        },
        // Was cyan-teal — deep antique gold (presence / go actions).
        // Dark enough to keep white button text legible.
        teal: {
          600: '#8A6D2F',
          500: '#A5823A',
          100: '#2A2210',
        },
        gold: {
          500: '#C9A24B',
          100: '#2A2210',
        },
        coral: {
          500: '#F26D6D',
          100: '#3A1D1D',
        },
        sky: {
          200: '#26262C',
        },
        paper: {
          50: '#0B0B0D', // near-black app canvas
          100: '#16161A', // card surface
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C9A24B 0%, #E8C766 100%)',
      },
      boxShadow: {
        brand: '0 10px 26px -8px rgba(201,162,75,0.45)',
        punch: '0 5px 0 0 #8a6d2f',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.6rem',
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
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.5)' },
          '55%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 240ms ease-out',
        'fade-in': 'fade-in 180ms ease-out',
        'stamp-in': 'stamp-in 260ms cubic-bezier(0.2,0.8,0.2,1)',
      },
    },
  },
  plugins: [],
};
