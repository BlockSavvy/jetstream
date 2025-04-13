import { defineConfig } from 'vite';
import { join, resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    }
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      NEXT_PUBLIC_SUPABASE_URL: JSON.stringify('https://example.supabase.co'), 
      NEXT_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify('mock-key'),
    }
  },
  plugins: [
    {
      name: 'next-use-client-directive-remover',
      transform(code, id) {
        if (id.includes('.tsx') || id.includes('.jsx') || id.includes('.ts')) {
          return code.replace(/['"]use client['"]\s*;?/, '');
        }
      },
    },
    // Transform lucide-react imports
    {
      name: 'lucide-icon-imports-transformer',
      transform(code, id) {
        if (id.includes('.tsx') || id.includes('.jsx') || id.includes('.ts')) {
          return code.replace(
            /import\s+(\w+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/(\w+)['"]/g,
            'import { $2 as $1 } from "lucide-react"'
          );
        }
        return null;
      }
    }
  ],
  server: {
    fs: {
      strict: false,
      allow: ['..']
    }
  }
}); 