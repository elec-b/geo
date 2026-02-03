import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separar vendors en chunks para mejor caching y carga paralela
        manualChunks: {
          'three': ['three'],
          'globe': ['react-globe.gl', 'globe.gl'],
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    // Desactivar sourcemaps en producción
    sourcemap: false,
  }
})
