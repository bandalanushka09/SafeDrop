/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // Primary teal
          800: '#115E59', // Dark teal
          900: '#134E4A',
          950: '#042F2E',
        },
        surface: {
          bg: '#F7F9FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        text: {
          primary: '#172B2A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        status: {
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

