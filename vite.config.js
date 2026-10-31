
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Vercel serves the app at the domain root; an explicit base can still be
  // supplied when building for a subpath such as a development proxy.
  base: process.env.VITE_BASE_PATH || '/',

  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: true,

    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,

    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1400,
  },
});
