import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Basic configuration that will be enhanced by Storybook's viteFinal
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    }
  },
  // Enable all file access
  server: {
    fs: {
      strict: false,
      allow: ['..']
    }
  }
}); 