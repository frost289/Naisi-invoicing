/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f8f5ef',
        charcoal: '#1f2933',
        amber: '#d78a1d',
        amberSoft: '#f3d8a8',
      },
      boxShadow: {
        card: '0 12px 30px rgba(31, 41, 51, 0.08)',
      },
    },
  },
  plugins: [],
}
