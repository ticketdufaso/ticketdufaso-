/**
 * Configuration Vite - FASO TICKET
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * CORRECTIONS :
 * - React inclus dans le bundle (pas d'externalisation)
 * - Minification avec esbuild (plus rapide et fiable)
 * - ManuelChunks optimisé
 * - PWA désactivé (sera réactivé plus tard)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        devTarget: 'es2020'
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@context': path.resolve(__dirname, './src/context'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles')
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // ✅ React inclus dans le bundle (pas d'externalisation)
          manualChunks: {
            // ✅ Séparer React et les grosses librairies
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'framer-motion', 'react-hot-toast'],
            canvas: ['html2canvas', 'jspdf'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod']
          }
        }
      },
      target: 'es2020',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500,
      // ✅ Désactiver le PWA pour l'instant (sera réactivé plus tard)
      // pwa: false
    },
    server: {
      port: 3000,
      strictPort: false,
      host: true,
      watch: {
        usePolling: true
      }
    },
    preview: {
      port: 8080,
      strictPort: false,
      host: true
    },
    define: {
      __DEV__: !isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'framer-motion'
      ]
    }
  }
})