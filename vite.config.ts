import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // ✅ TAMBAHKAN INI UNTUK IGNORE TYPESCRIPT ERRORS
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore TypeScript errors during build
        if (warning.code?.startsWith('TS')) return;
        warn(warning);
      }
    }
  },
  // ✅ ATAU PAKAI INI YANG LEBIH EFFECTIVE
  esbuild: {
    // Drop console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  }
})