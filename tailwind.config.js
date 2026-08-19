/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep indigo-black neutral scale (was teal-navy). Energetic base.
        ink: {
          900: '#1B1533',
          700: '#2E2550',
          600: '#4A3F6B',
          500: '#6B6088',
          300: '#A79FC0',
          100: '#E7E1F5',
        },
        // Brand violet — the new primary.
        brand: {
          600: '#7C3AED',
          500: '#8B5CF6',
          400: '#A78BFA',
          100: '#EDE4FF',
        },
        // Hot pink — gradient partner + secondary energy.
        pink: {
          500: '#EC4899',
          400: '#F472B6',
          100: '#FCE0EE',
        },
        // Acid lime — the "punch" CTA / reward accent.
        lime: {
          500: '#A3E635',
          400: '#C6F135',
          100: '#ECFCCB',
        },
        // Vivid cyan-teal — presence / "here now" accent (kept name `teal`).
        teal: {
          600: '#0EA5A5',
          500: '#14BDBD',
          100: '#C7F5F2',
        },
        gold: {
          500: '#F4B942',
          100: '#FBEBC5',
        },
        coral: {
          500: '#FF5A5F',
          100: '#FFE0E0',
        },
        sky: {
          200: '#DBE7FF',
        },
        paper: {
          50: '#F5F3FF', // violet-tinted app canvas
          100: '#FFFFFF',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
      },
      boxShadow: {
        brand: '0 10px 26px -8px rgba(124,58,237,0.5)',
        punch: '0 5px 0 0 #7fa815',
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
      },
      animation: {
        'slide-up': 'slide-up 240ms ease-out',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
