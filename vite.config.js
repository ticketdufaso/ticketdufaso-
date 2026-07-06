import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        devTarget: 'es2020'
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'robots.txt', 'icons/*.png'],
        manifest: {
          name: 'FASO TICKET',
          short_name: 'FASO TICKET',
          description: 'Billetterie sécurisée pour événements au Burkina Faso',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60
                }
              }
            }
          ]
        }
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
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: [
            'console.log',
            'console.info',
            'console.debug',
            'console.trace',
            'console.warn',
            'console.error',
            'console.assert',
            'console.group',
            'console.groupEnd',
            'console.groupCollapsed',
            'console.time',
            'console.timeEnd',
            'console.timeLog',
            'console.count',
            'console.countReset',
            'console.table',
            'console.dir',
            'console.dirxml',
            'console.clear',
            'console.profile',
            'console.profileEnd'
          ],
          passes: 3,
          unsafe: true,
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
          hoist_funs: true,
          hoist_vars: true,
          join_vars: true
        },
        mangle: {
          toplevel: true,
          keep_classnames: false,
          keep_fnames: false,
          properties: {
            regex: /^_/
          }
        },
        // ✅ CORRECTION : format au lieu de comments
        format: {
          comments: false,
          beautify: false,
          ecma: 2020,
          webkit: true
        },
        module: true,
        safari10: true,
        warnings: false
      },
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'react-hot-toast', 'framer-motion'],
            canvas: ['html2canvas', 'jspdf']
          }
        }
      },
      target: 'es2020',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500
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
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
    }
  }
})