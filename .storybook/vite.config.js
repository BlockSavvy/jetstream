import { defineConfig } from 'vite';
import { join } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      // Make sure to exclude problematic mdx files and modules
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
        'sb-original/image-context',
        '@storybook/experimental-nextjs-vite',
      ],
    }
  },
  optimizeDeps: {
    exclude: ['@storybook/experimental-nextjs-vite']
  },
  resolve: {
    alias: {
      // Map path aliases to mocked components
      '@': join(process.cwd()),
      '@/components/ui/button': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/badge': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/tabs': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/card': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/popover': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/input': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/slider': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/form': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/select': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/calendar': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/command': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/avatar': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/dialog': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/sheet': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/switch': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/carousel': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/checkbox': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/radio-group': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/time-picker-demo': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/skeleton': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/ui/label': join(process.cwd(), '.storybook/mocked-components/ui/button.jsx'),
      '@/components/auth-provider': join(process.cwd(), '.storybook/decorators.jsx'),
      '@/hooks/useUserProfile': join(process.cwd(), '.storybook/decorators.jsx'),
      '@/lib/utils': join(process.cwd(), '.storybook/mocked-components/lib/utils.js'),
      '@/lib/supabase': join(process.cwd(), '.storybook/decorators.jsx'),
      '@/lib/utils/jet-images': join(process.cwd(), '.storybook/mocked-components/lib/utils.js'),
      '@/lib/utils/format': join(process.cwd(), '.storybook/mocked-components/lib/utils.js'),
      '@/app/lib/ai/databaseContext': join(process.cwd(), '.storybook/decorators.jsx'),
      
      // Handle lucide-react icon imports with backward compatibility
      'lucide-react/dist/esm/icons': join(process.cwd(), 'node_modules/lucide-react/dist/esm/icons'),
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