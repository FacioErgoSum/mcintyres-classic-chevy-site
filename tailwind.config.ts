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
        base: ['1.25rem', { lineHeight: '1.65' }], // 20px body for older eyes
        lg: ['1.4rem', { lineHeight: '1.5' }],
        xl: ['1.65rem', { lineHeight: '1.35' }],
        '2xl': ['2rem', { lineHeight: '1.2' }],
        '3xl': ['2.6rem', { lineHeight: '1.12' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
