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
    // Handle process.env
    config.define = {
      ...(config.define || {}),
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        NEXT_PUBLIC_SUPABASE_URL: JSON.stringify('https://example.supabase.co'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify('mock-key')
      },
    };

    // Make React available to component files
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      'react',
      'react-dom',
    ];
    
    return config;
  },
};

export default config; 