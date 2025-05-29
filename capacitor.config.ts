import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xyz.gdyup.app',
  appName: 'GDY·UP',
  webDir: 'out',
  server: {
    url: 'https://gdyup.xyz/gdyup',
    cleartext: false,
    allowNavigation: [
      'gdyup.xyz',
      'api.gdyup.xyz', 
      'btc.gdyup.xyz',
      '*.gdyup.xyz'
    ]
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#000000',
    handleApplicationNotifications: true,
    limitsNavigationsToAppBoundDomains: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: "#DAFF0D",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    },
    Keyboard: {
      resize: "ionic",
      style: "dark",
      resizeOnFullScreen: true
    },
    Haptics: {},
    Share: {}
  }
};

export default config;