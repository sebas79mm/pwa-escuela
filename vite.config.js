
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),

    // CONFIGURACIÓN PWA
    VitePWA({
      registerType: 'autoUpdate',

      // MANIFEST DE LA APLICACIÓN
      manifest: {
        name: 'Pwa Proyecto Escuela',
        short_name: 'PPE',
        description: 'Aplicación Web Progresiva hecha en la UTP',

        start_url: '/',
        scope: '/',

        display: 'standalone',

        background_color: '#ffffff',
        theme_color: '#2e77b3',

        icons: [
          {
            src: '/images/icons/CR7.jpg',
            sizes: '128x128',
            type: 'image/jpg',
          },
          {
            src: '/images/icons/Siu.jpg',
            sizes: '512x512',
            type: 'image/jpg',
          },
        ],
      },

      // CONFIGURACIÓN DE CACHE STORAGE
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}'
        ],

        cleanupOutdatedCaches: true,

        navigateFallback: 'index.html',
      },
    }),

    // VUE DEVTOOLS
    vueDevTools(),
  ],

  // ALIAS
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
