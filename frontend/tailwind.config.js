/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12233B',
        slate: {
          950: '#0B1626',
        },
        pulse: {
          50: '#EAF7F5',
          100: '#CFEFEA',
          400: '#3EA893',
          500: '#1E8A73',
          600: '#146B5A',
        },
        vital: {
          400: '#E8724C',
          500: '#D85A34',
        },
        paper: '#F6F4EF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
