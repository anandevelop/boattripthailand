import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#231416',
        muted: '#6b5e60',
        line: '#ece4e3',
        maroon: { DEFAULT: '#70000e', 50: '#f9f1f2', 100: '#f2e2e4', 600: '#5e000c', 800: '#4f000a', 900: '#3a0007' },
        sand: { DEFAULT: '#f8f4f3', 100: '#f1ebe9', 200: '#e6dcd9' },
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      maxWidth: { '7xl': '1280px' },
    },
  },
  plugins: [],
} satisfies Config;
