import { defineConfig } from 'vite';
import { join } from 'path';

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
    alias: {
      '@': join(process.cwd()),
      // Handle lucide-react icon imports with backward compatibility
      'lucide-react/dist/esm/icons': join(process.cwd(), 'node_modules/lucide-react/dist/esm/icons'),
      // Replace auth provider with our mock implementation
      '@/components/auth-provider': join(process.cwd(), '.storybook/decorators.jsx')
    }
  },
  // Prevent Vite from following symlinks - can cause issues in some environments
  server: {
    fs: {
      strict: false
    }
  },
  // Add plugins to handle lucide-react imports
  plugins: [
    {
      name: 'lucide-icon-imports-transformer',
      transform(code, id) {
        // Transform specific import patterns only for relevant files
        if (id.includes('.tsx') || id.includes('.jsx') || id.includes('.ts')) {
          // Convert direct imports to namespace imports
          const transformedCode = code.replace(
            /import\s+(\w+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/(\w+)['"]/g,
            'import { $2 as $1 } from "lucide-react"'
          );
          
          if (transformedCode !== code) {
            return {
              code: transformedCode,
              map: null
            };
          }
        }
        return null;
      }
    }
  ]
}); 