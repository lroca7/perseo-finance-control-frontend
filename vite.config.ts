import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Perseo Finance',
        short_name: 'Perseo',
        description: 'Control de finanzas personales — tarjetas de crédito',
        theme_color: '#0E2A28',
        background_color: '#0E2A28',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // Evita problemas de CORS en desarrollo: el frontend llama a /api/*
      // y Vite lo reenvía al backend Kotlin en localhost:8080.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
