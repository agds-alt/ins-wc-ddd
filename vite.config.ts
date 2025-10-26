import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
    })
  ].filter(Boolean),
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // ❌ MATIIN SOURCEMAP BUAT PRODUCTION
    minify: 'terser', // ✅ PAKAI TERSER YANG LEBIH AGGRESIVE
    target: 'es2015', // ✅ TARGET BROWSER LEBIH RENDAH
    
    // ✅ ROLLUP OPTIONS AGGRESIF
    rollupOptions: {
      output: {
        // ✅ CHUNK SPLITING YANG LEBIH AGGRESIF
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React & Core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            // Icons (Lucide biasanya gede)
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // Date library
            if (id.includes('date-fns')) {
              return 'vendor-date'
            }
            // Forms
            if (id.includes('react-hook-form')) {
              return 'vendor-forms'
            }
            // Charts (jika ada)
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'vendor-charts'
            }
            // Lainnya
            return 'vendor-other'
          }
        },
        // ✅ OPTIMASI NAMING
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      onwarn(warning, warn) {
        if (warning.code?.startsWith('TS') || warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    },
    // ✅ KURANGI WARNING LIMIT
    chunkSizeWarningLimit: 500,
  },
  
  // ✅ ESBUILD AGGRESIF
  esbuild: {
    drop: ['console', 'debugger'],
    minify: true,
    target: 'es2015'
  },
  
  // ✅ TERSE R OPTIMIZATION (TAMBAHIN INI)
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'],
      passes: 2 // LEBIH BANYAK PASS UNTUK MINIFICATION
    },
    mangle: {
      toplevel: true
    }
  },
  
  // ✅ OPTIMIZE DEPS
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'react-router-dom'
    ],
    exclude: ['lucide-react'] // ❌ EXCLUDE YANG GEDE
  }
})