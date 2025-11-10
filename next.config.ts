import type { NextConfig } from 'next'

// Bundle analyzer (enabled with ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Image optimization with modern formats
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@tanstack/react-query',
    ],
  },

  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Enable compression
  compress: true,

  // Modularize imports for tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {},

  // Webpack optimization for code splitting (fallback for webpack mode)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // React vendor chunk
            react: {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            // PDF libraries (lazy loaded but create separate chunk when loaded)
            pdf: {
              name: 'pdf-vendor',
              test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Heavy libraries (lazy loaded)
            heavy: {
              name: 'heavy-vendor',
              test: /[\\/]node_modules[\\/](xlsx|browser-image-compression)[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // UI libraries
            ui: {
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/](lucide-react|@tanstack)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Supabase
            supabase: {
              name: 'supabase-vendor',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // Other node_modules
            commons: {
              name: 'commons',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    return config
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
