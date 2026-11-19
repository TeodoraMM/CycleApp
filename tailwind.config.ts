import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './data/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FFFBF7',
          50: '#FFFDFB',
          100: '#FFF6EE',
          200: '#FBEDE2',
          300: '#F4E1D2',
        },
        blush: {
          50: '#FFF4F7',
          100: '#FFE7EE',
          200: '#FFD3E0',
          300: '#FFB6CB',
          400: '#F98CA9',
          500: '#DD5B80',
          600: '#C24B71',
          700: '#A83A60',
        },
        lavender: {
          50: '#F7F4FC',
          100: '#F0EAF9',
          200: '#E3D8F4',
          300: '#CDB9EA',
          400: '#B49BDE',
          500: '#8464B6',
          600: '#7555A2',
          700: '#684E8C',
        },
        plum: {
          50: '#F8F2F7',
          100: '#F1E6EF',
          200: '#E3CEE0',
          300: '#CBADCA',
          400: '#9A719A',
          500: '#8C608E',
          600: '#7A557C',
          700: '#624563',
        },
        peach: {
          50: '#FDF7F0',
          100: '#FAEDDD',
          200: '#F5DCC1',
          300: '#EEC49A',
          400: '#E5A972',
          500: '#C77A42',
          600: '#B76536',
          700: '#90502C',
        },
        ink: {
          DEFAULT: '#3B2C3A',
          soft: '#6D5D6B',
          faint: '#8B7A89',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 40px -24px rgba(122, 85, 124, 0.45)',
        glow: '0 12px 28px -14px rgba(238, 108, 144, 0.65)',
        lift: '0 24px 50px -30px rgba(98, 69, 99, 0.55)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease both',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
