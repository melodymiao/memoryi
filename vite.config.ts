import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is done in src/main.tsx via virtual:pwa-register so we can
      // reload on update and re-check when the app is reopened.
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'memoryi',
        short_name: 'memoryi',
        description: 'A shared log of places visited, things done, and a bucket list of what to do next.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fffbf5',
        theme_color: '#fffbf5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // New worker activates immediately and takes over open tabs, and old
        // precaches are purged. Explicit rather than implied by registerType.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
