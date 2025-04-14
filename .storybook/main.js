const path = require('path');

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../stories/Introduction.mdx',
    '../stories/jetstream/**/*.mdx',
    '../stories/jetstream/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/jetshare/**/*.mdx',
    '../stories/jetshare/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/ui/**/*.mdx',
    '../stories/ui/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  staticDirs: ['../public'],
  features: {
    storyStoreV7: true
  },
  docs: {
    autodocs: true,
    defaultName: 'Documentation'
  },
  core: {
    disableTelemetry: true
  },
  async viteFinal(config) {
    // Set up path aliases to match Next.js
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../'),
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    };

    // Handle global variables like process.env
    config.define = {
      ...config.define,
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        NEXT_PUBLIC_SUPABASE_URL: JSON.stringify('https://example.supabase.co'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify('mock-key'),
      },
      // Don't make global = window to avoid conflicts with addon declarations
      // global: 'window',
    };

    // Fix for addon import errors
    config.build = config.build || {};
    config.build.rollupOptions = config.build.rollupOptions || {};
    config.build.rollupOptions.external = [
      '@storybook/window',
      '@storybook/global',
      ...(Array.isArray(config.build.rollupOptions.external) 
          ? config.build.rollupOptions.external 
          : [])
    ];

    // Add React import to all files
    config.plugins = config.plugins || [];
    config.plugins.push({
      name: 'add-react-import',
      transform(code, id) {
        if (id.includes('.tsx') || id.includes('.jsx') || id.includes('.ts')) {
          // Replace 'use client' directive
          let modifiedCode = code.replace(/['"]use client['"]\s*;?/, '');
          
          // Add React import if not present
          if (!modifiedCode.includes('import React') && !modifiedCode.includes('import * as React')) {
            modifiedCode = `import React from 'react';\n${modifiedCode}`;
          }
          
          return modifiedCode;
        }
      },
    });

    // Ensure server can access all files
    config.server = {
      ...config.server,
      fs: {
        strict: false,
        allow: ['..']
      }
    };

    return config;
  },
};

export default config; 