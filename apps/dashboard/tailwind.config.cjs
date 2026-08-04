/** Dark-only dashboard — colors are the dataviz skill's validated dark-mode palette, used directly (no light variant needed). */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#0d0d0d',
        surface: '#1a1a19',
        'surface-hover': '#232322',
        border: 'rgba(255,255,255,0.10)',
        ink: {
          primary: '#ffffff',
          secondary: '#c3c2b7',
          muted: '#898781',
        },
        grid: '#2c2c2a',
        axis: '#383835',
        series: {
          blue: '#3987e5',
          orange: '#d95926',
          aqua: '#199e70',
          yellow: '#c98500',
          magenta: '#d55181',
          green: '#008300',
          violet: '#9085e9',
          red: '#e66767',
        },
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
        },
      },
    },
  },
  plugins: [],
};
