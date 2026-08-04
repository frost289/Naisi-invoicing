/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        charcoal: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: '#1f2933',
        amber: 'rgb(var(--color-accent) / <alpha-value>)',
        amberSoft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        dangerSoft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 12px 30px rgba(31, 41, 51, 0.08)',
      },
    },
  },
  plugins: [],
}
