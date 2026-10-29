/** Tailwind config for MATi-MoTE. Rebuild the inlined CSS with: ./build.sh */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'] },
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        ink: 'var(--accent-ink)',
        base: '#0d0e14',
        card: '#12131a',
        key: '#191a22',
        line: 'rgba(255,255,255,0.08)',
        muted: '#8b8d98',
      },
    },
  },
};
