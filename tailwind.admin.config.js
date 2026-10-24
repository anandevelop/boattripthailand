/** Admin UI design tokens (same as the approved admin mockup) — `npm run build:admin` → public/admin-app/tw.css */
module.exports = {
  content: ['./site/admin-shell.html', './public/admin-app/app.js', './src/app/(admin)/**/*.tsx', './src/components/admin/*.tsx'],
  theme: { extend: {
    colors: {
      ink: '#231416', muted: '#6b5e60', line: '#ece4e3',
      maroon: { DEFAULT: '#70000e', 50: '#f9f1f2', 100: '#f2e2e4', 600: '#5e000c', 800: '#4f000a', 900: '#3a0007' },
      sand: { DEFAULT: '#f8f4f3', 100: '#f1eaea', 200: '#e2d8d8' },
    },
    fontFamily: { sans: ['Jost', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'] },
  } },
};
