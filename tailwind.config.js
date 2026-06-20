/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm clay — the new accent, replacing green throughout.
        brand: {
          50:  '#fbf4f0',
          100: '#f4e2d8',
          200: '#e8c4b1',
          300: '#d89e83',
          400: '#c97c58',
          500: '#bd6040',
          600: '#b4502f',
          700: '#954026',
          800: '#763522',
          900: '#5c2b1e',
        },
        // Override the default cool gray with a warm stone so every existing
        // gray-* class shifts to the new palette without touching each file.
        gray: {
          50:  '#f7f4ef',
          100: '#efeae1',
          200: '#e1dacd',
          300: '#ccc0ad',
          400: '#a89c86',
          500: '#847864',
          600: '#635a4b',
          700: '#4a4236',
          800: '#322d25',
          900: '#1f1b15',
        },
        // Muted sage for "success / completed" — reads as done without
        // reintroducing the old brand green.
        sage: {
          50:  '#f1f4ec',
          100: '#dfe6d3',
          600: '#5f7850',
          700: '#4b6040',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31,27,21,0.04), 0 12px 32px -16px rgba(31,27,21,0.16)',
        card: '0 1px 2px rgba(31,27,21,0.05), 0 1px 3px rgba(31,27,21,0.04)',
        lift: '0 2px 4px rgba(31,27,21,0.06), 0 18px 40px -20px rgba(31,27,21,0.24)',
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      letterSpacing: {
        tightish: '-0.011em',
      },
    },
  },
  plugins: [],
}
