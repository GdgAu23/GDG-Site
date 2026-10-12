// Tailwind v3, compiled at build time (npm run build). Scans pages, partials,
// client JS and the server-rendered views in functions/.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './templates/*.html', './partials/*.html', './js/**/*.js', './functions/**/*.js'],
  // Dark when the visitor picks it, or when their OS is dark and they haven't picked light.
  darkMode: ['variant', ['&:is([data-theme="dark"] *)', '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }']],
  theme: {
    extend: {
      colors: {
        'google-blue': '#1A73E8',
        'google-blue-dark': '#1765CC',
        'google-red': '#EA4335',
        'google-yellow': '#FBBC04',
        'google-green': '#34A853',
        brandBgPrimary: 'hsl(var(--bg-primary) / <alpha-value>)',
        brandBgSecondary: 'hsl(var(--bg-secondary) / <alpha-value>)',
        brandBgTertiary: 'hsl(var(--bg-tertiary) / <alpha-value>)',
        brandTextPrimary: 'hsl(var(--text-primary) / <alpha-value>)',
        brandTextSecondary: 'hsl(var(--text-secondary) / <alpha-value>)',
        brandBorder: 'hsl(var(--border-color) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
};
