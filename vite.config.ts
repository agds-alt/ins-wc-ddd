// vite.config.ts - FIXED: Proper env handling
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) {
            return 'router-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase') || id.includes('gotrue')) {
            return 'supabase-vendor';
          }
          
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // UI Libraries
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
          if (id.includes('sonner') || id.includes('react-hot-toast')) {
            return 'toast-vendor';
          }
          if (id.includes('framer-motion')) {
            return 'animation-vendor';
          }
          
          // Date & Time
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // QR Code
          if (id.includes('html5-qrcode') || id.includes('qrcode')) {
            return 'qr-vendor';
          }
          
          // Admin pages
          if (id.includes('pages/admin')) {
            return 'admin';
          }
          
          // Reports & Analytics
          if (id.includes('pages/ReportsPage') || id.includes('pages/AnalyticsPage')) {
            return 'reports';
          }
          
          // Inspection form
          if (id.includes('pages/InspectionPage') || id.includes('ComprehensiveInspectionForm')) {
            return 'inspection';
          }
          
          // Other vendors
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // FIXED: Use mode parameter
        drop_debugger: true,
      },
    },
    
    sourcemap: false,
  },

  server: {
    port: 5174,
    host: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
}));