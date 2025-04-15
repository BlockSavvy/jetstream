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
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  outputDir: '../public',
  core: {
    disableTelemetry: true
  },
  viteFinal: (config) => {
    // Simple path alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../')
    };
    
    return config;
  }
};

export default config; 