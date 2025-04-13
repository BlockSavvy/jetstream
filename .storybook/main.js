const path = require('path');

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
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
    // Most important part: set up path aliases to match Next.js
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../'),  // Map to project root
    };

    // Handle global variables like process.env
    config.define = {
      ...config.define,
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        NEXT_PUBLIC_SUPABASE_URL: JSON.stringify('https://example.supabase.co'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify('mock-key'),
      },
      // Make React available globally
      'React': 'React',
    };

    // Make Vite understand Next.js's "use client" directive
    config.plugins.push({
      name: 'use-client-directive-plugin',
      transform(code, id) {
        if (id.includes('.tsx') || id.includes('.jsx')) {
          return code.replace(/['"]use client['"]\s*;?/, '');
        }
      },
    });

    return config;
  },
};

export default config; 