import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.gdyup.app',
  appName: 'GDYUP',
  webDir: 'out',
  server: {
    url: 'https://gdyup.xyz/gdyup',
    cleartext: false
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#000000'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 4000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: "#DAFF0D",
      splashFullScreen: true,
      splashImmersive: true,
      launchAutoHide: false
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