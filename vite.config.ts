import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/charla/
export default defineConfig({
  base: '/charla/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,svg,ico}'] },
      devOptions: { enabled: false },
      manifest: {
        name: 'Charla — Spanish with Sofi',
        short_name: 'Charla',
        description: 'Speak Latin American Spanish with an AI tutor that adapts to you.',
        lang: 'en',
        start_url: '/charla/',
        scope: '/charla/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fbf7f2',
        theme_color: '#e0573f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
