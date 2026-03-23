import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        // Separar vendors en chunks para mejor caching y carga paralela
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    // Desactivar sourcemaps en producción
    sourcemap: false,
  }
})
