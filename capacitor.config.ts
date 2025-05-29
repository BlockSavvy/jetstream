import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.gdyup.app',
  appName: 'App',
  webDir: 'dist',
  server: {
    url: 'https://gdyup.xyz',
    cleartext: false,
    allowNavigation: [
      'gdyup.xyz',
      '*.gdyup.xyz',
      'api.gdyup.xyz',
      '*.vercel.app'
    ]
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    handleApplicationNotifications: true,
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#000000'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      spinnerColor: "#DAFF0D",
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    }
  }
};

export default config;