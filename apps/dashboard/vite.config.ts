import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DASHBOARD_API_PORT = process.env.DASHBOARD_PORT ?? '4500';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${DASHBOARD_API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
