import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.gdyup.xyz',
  appName: 'GDY·UP',
  webDir: 'out',
  // 🚀 DEVELOPMENT MODE: Use local server with working APIs
  server: {
    url: 'http://localhost:3000/gdyup',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    handleApplicationNotifications: false,
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#000000',
    overrideUserAgent: 'GDY-UP iOS App',
    appendUserAgent: 'GDY-UP iOS',
    scheme: 'http' // Changed from https to http for local development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
      launchAutoHide: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
      overlaysWebView: false
    },
    Keyboard: {
      resize: "native",
      style: "dark",
      resizeOnFullScreen: true
    },
    Haptics: {
      // Enable haptic feedback
    },
    Share: {
      // Enable native sharing
    }
  }
};

export default config;