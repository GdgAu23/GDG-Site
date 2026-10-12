// Shared Tailwind CDN config. Load right after cdn.tailwindcss.com on every public page.
document.documentElement.classList.add('js');
tailwind.config = {
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'google-blue': '#1A73E8',
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
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
};
