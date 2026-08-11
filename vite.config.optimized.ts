// Optimized vite.config.ts with performance enhancements
// Add this to your existing vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig({
  // ... existing config ...
  
  build: {
    // Output optimization
    target: 'ES2020',
    minify: 'terser',
    
    // Chunk size optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tooltip'],
          'lucide': ['lucide-react'],
          'query': ['@tanstack/react-query'],
          
          // Route-based chunks
          'route-services': ['./src/pages/Services.tsx'],
          'route-doctors': ['./src/pages/Doctors.tsx'],
          'route-labs': ['./src/pages/Labs.tsx'],
        },
      },
    },
    
    // Asset optimization
    assetsInlineLimit: 8192, // Inline assets smaller than 8KB
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
      output: {
        comments: false,
      },
    },

    // Source maps for debugging (optional, adds file size)
    sourcemap: false,
    
    // CSS optimization
    cssMinify: true,
    cssCodeSplit: true,
    
    // Watch mode
    watch: null, // Disable watch mode in production builds
  },

  plugins: [
    react({
      babel: {
        plugins: [
          // Optimize React
          '@babel/plugin-transform-react-inline-elements',
        ],
      },
    }),
    tailwindcss(),
    
    // Compression plugins
    compression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10KB
      algorithm: 'brotli',
      ext: '.br',
    }),
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],

  // Performance hints
  esbuild: {
    legalComments: 'none', // Remove legal comments to reduce file size
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: [
      '@radix-ui', // Large Radix UI (only import what you need)
    ],
  },
});

// Performance: Expected improvements
// - Code splitting: 20-30KB savings
// - Terser minification: 10-15KB savings
// - Brotli compression: 35-40% reduction
// - Tree shaking: 50-100KB potential
