import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [
        '@storybook/window', 
        '@storybook/global',
        'window',
        'global'
      ],
      output: {
        // Ensure proper globals for externalized dependencies
        globals: {
          '@storybook/window': 'window',
          '@storybook/global': 'global',
          'window': 'window',
          'global': 'globalThis'
        }
      }
    },
  },
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    },
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // Enable all file access
  server: {
    fs: {
      strict: false,
      allow: ['..']
    }
  }
}); 