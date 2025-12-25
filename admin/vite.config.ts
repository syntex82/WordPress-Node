import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
      '/messages': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
      '/groups': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // TipTap editor (heavy)
            if (id.includes('@tiptap') || id.includes('prosemirror') || id.includes('lowlight')) {
              return 'vendor-editor';
            }
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Socket.io
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }
            // Other large vendors
            if (id.includes('date-fns') || id.includes('zustand')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
});

