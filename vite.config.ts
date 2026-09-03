import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Job Helper',
        short_name: 'Job Helper',
        description: 'Asistente de busqueda de empleo con generacion de CV y carta adaptados con IA',
        theme_color: '#1A1D24',
        background_color: '#1A1D24',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
            workbox: {
        // Precachea automaticamente todos los assets del build (JS, CSS,
        // HTML). El soporte offline de llamadas a la API queda fuera de
        // alcance por ahora - la app requiere conexion para su funcion
        // principal (login, generar documentos con Gemini).
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5173 },
});