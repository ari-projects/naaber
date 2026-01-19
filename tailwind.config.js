/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/contexts/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/services/**/*.{js,jsx,ts,tsx}",
    "./src/utils/**/*.{js,jsx,ts,tsx}",
    "./src/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    // Override the default font family
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    extend: {
      // Colors from Figma Design Tokens
      colors: {
        // Brand Colors
        'brand': {
          'primary': '#EEEDE7',
          'primary-hover': '#E5E3DC',
          'secondary': '#293D29',
          'secondary-hover': '#3D5C3D',
        },
        // Gray Scale
        'gray': {
          '0': '#FFFFFF',
          '025': '#F8F8F7',
          '05': '#F3F3F2',
          '075': '#EBEBEA',
          '1': '#E2E1DF',
          '2': '#D7D7D5',
          '3': '#C1C0BE',
          '4': '#A09F9C',
          '5': '#878683',
          '6': '#72726E',
          '7': '#65635D',
          '8': '#56554D',
          '9': '#4D4B42',
          '925': '#3F3C31',
          '950': '#353227',
          '975': '#252218',
          '10': '#0D0C07',
        },
        // UI Colors
        'ui': {
          'error': '#B50B0B',
          'error-hover': '#D40B0B',
          'warning': '#F99908',
          'warning-hover': '#E08700',
          'success': '#67B204',
          'success-hover': '#518C03',
        },
        // Legacy colors (keeping for backward compatibility)
        'fresh': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'produce': '#22c55e',
        'dairy': '#f9fafb',
        'meat': '#ef4444',
        'pantry': '#854d0e',
        'frozen': '#60a5fa',
        'spices': '#ea580c',
      },
      // Border Radius from Figma Design Tokens
      borderRadius: {
        'outer': '12px',
        'inner': '6px',
      },
      // Spacing from Figma Design Tokens
      spacing: {
        'small-s': '2px',
        'small-m': '4px',
        'small-l': '8px',
        'medium-s': '12px',
        'medium-m': '16px',
        'medium-l': '20px',
        'large-s': '24px',
        'large-m': '28px',
        'large-l': '32px',
        'large-xl': '44px',
        'large-xxl': '64px',
        'large-xxxl': '80px',
        'large-xxxxl': '128px',
        'mobile-padding': '24px',
      },
      // Border Width from Figma Design Tokens
      borderWidth: {
        'base': '0.5px',
      },
      fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700,
        black: 900,
      },
    },
  },
  plugins: [],
}