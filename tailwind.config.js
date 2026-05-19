/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
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
      },
      // SF Pro on iPhone/Mac, Segoe UI on Windows, Roboto on Android
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Apple card shadow — almost imperceptible, just enough for depth
        'apple-card': '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        // Apple nav bar shadow (bottom of top bar)
        'apple-bar': '0 0.5px 0 rgba(0,0,0,0.12)',
        // Apple bottom nav shadow (top edge)
        'apple-nav': '0 -0.5px 0 rgba(0,0,0,0.10)',
      },
      borderRadius: {
        'apple': '13px',
        'apple-lg': '20px',
      },
      fontSize: {
        'large-title': ['34px', { lineHeight: '41px', fontWeight: '700', letterSpacing: '-0.4px' }],
        'title-1':     ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '-0.3px' }],
        'title-2':     ['22px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '-0.2px' }],
        'title-3':     ['20px', { lineHeight: '25px', fontWeight: '600', letterSpacing: '-0.1px' }],
        'headline':    ['17px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '-0.1px' }],
        'body':        ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'callout':     ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'subhead':     ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'footnote':    ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption-1':   ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'caption-2':   ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}
