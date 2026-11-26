import type { Config } from 'tailwindcss';

// McIntyre's green, plus 1955–57 Chevrolet factory paint names.
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1D582E', light: '#DDECE1', dark: '#123B1E' }, // McIntyre's green
        ivory: '#F6F1E1', // India Ivory, used only for the two-tone band
        matador: { DEFAULT: '#A81E2A', dark: '#861620' }, // Matador Red, buy buttons only
        onyx: '#1D1F22', // Onyx Black, body text
        chrome: '#8B9399',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      fontSize: {
        base: ['1.0625rem', { lineHeight: '1.6' }], // 17px body: still roomy, fits more on a phone
        lg: ['1.1875rem', { lineHeight: '1.5' }],
        xl: ['1.375rem', { lineHeight: '1.35' }],
        '2xl': ['1.625rem', { lineHeight: '1.25' }],
        '3xl': ['2rem', { lineHeight: '1.15' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
