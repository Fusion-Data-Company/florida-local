  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import { VitePWA } from 'vite-plugin-pwa';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV === 'development';

  export default defineConfig({
    root: './client',
    plugins: [
      react(),
      // PWA Support - DISABLED IN DEVELOPMENT
      VitePWA({
        disable: isDev,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Florida Local Elite',
          short_name: 'FL Elite',
          description: 'Florida\'s premier business networking platform',
          theme_color: '#0ea5e9',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
          // Increase file size limit to 10MB for large assets
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          // Exclude florida-local images from precaching (use runtime caching instead)
          globIgnores: ['**/florida-local/**'],
          // CRITICAL: Exclude API routes from NavigationRoute fallback
          // This ensures /api/* and /auth/* requests reach the server instead of serving index.html
          navigateFallbackDenylist: [
            /^\/api\//,      // Exclude all /api/* routes (authentication, data)
            /^\/auth\//,     // Exclude all /auth/* routes
            /^\/metrics/,    // Exclude metrics endpoint
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 300 // 5 minutes
                }
              }
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                }
              }
            },
            {
              // Runtime caching for florida-local images
              urlPattern: /\/florida-local\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'florida-local-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 24 * 60 * 60 // 60 days
                }
              }
            }
          ]
        }
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@assets': path.resolve(__dirname, './client/src/assets'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    build: {
      target: 'es2020',
      cssTarget: 'chrome80',
      minify: 'terser',
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        },
      },
      rollupOptions: {
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-hook-form'],
            'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar'],
            'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'zod'],
            'query-vendor': ['@tanstack/react-query'],
            'animation-vendor': ['framer-motion'],
            // Feature chunks
            'auth': ['./client/src/hooks/useAuth.ts'],
            'business': ['./client/src/pages/business-profile.tsx', './client/src/pages/create-business.tsx'],
            'marketplace': ['./client/src/pages/marketplace.tsx', './client/src/components/product-card.tsx'],
            'checkout': ['./client/src/pages/checkout.tsx', './client/src/pages/cart.tsx'],
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
      },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query'],
      exclude: ['@vite/client', '@vite/env'],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    server: {
      host: '0.0.0.0', // CRITICAL: Allow external connections from Replit
      port: 5000,
      strictPort: true,
      hmr: {
        overlay: false,
      },
    },
    // @ts-ignore - test config is for vitest
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./client/src/__tests__/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage/client',
        exclude: [
          'node_modules/',
          'client/src/__tests__/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          'dist/',
        ],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  });
