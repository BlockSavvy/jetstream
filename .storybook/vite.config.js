import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // Make sure to exclude problematic mdx files
      external: [
        'stories/Configure.mdx',
        './assets/github.svg',
        './assets/discord.svg',
        './assets/youtube.svg',
        './assets/tutorials.svg',
        './assets/styling.png',
        './assets/context.png',
        './assets/assets.png',
        './assets/docs.png',
        './assets/share.png',
        './assets/figma-plugin.png',
        './assets/testing.png',
        './assets/accessibility.png',
        './assets/theming.png',
        './assets/addon-library.png',
      ],
    }
  },
  resolve: {
    // Add any custom aliases here if needed
    alias: {
      '@': '/'
    }
  },
  // Prevent Vite from following symlinks - can cause issues in some environments
  server: {
    fs: {
      strict: false
    }
  }
}); 