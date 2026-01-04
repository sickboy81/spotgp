import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para produção (VDS com recursos limitados - 4GB RAM, 2 cores)
    minify: 'esbuild', // Esbuild é mais rápido e usa menos memória que terser
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor cache e performance
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Otimizar para recursos limitados
    target: 'esnext',
    sourcemap: false, // Desabilitar sourcemaps em produção para economizar espaço
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://base.spotgp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: ['spotgp.com', 'localhost'],
  },
})
