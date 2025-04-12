const config = {
  stories: [
    '../stories/Introduction.mdx',
    '../stories/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/features/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/jetshare/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  staticDirs: ['../public'],
  features: {
    // Skip the problematic features
    storyStoreV7: true,
    buildStoriesJson: true,
    // Disable Webpack 5 telemetry
    warnOnLegacyHierarchySeparator: false
  },
  // Skip the default Configure.mdx that's causing asset errors
  docs: {
    autodocs: true,
    defaultName: 'Documentation'
  },
  // This option helps prevent missing file errors
  core: {
    disableTelemetry: true,
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: '.storybook/vite.config.js'
      }
    }
  }
};

export default config; 