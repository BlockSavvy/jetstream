import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.gdyup.xyz',
  appName: 'GDYUP',
  webDir: 'dist',
  server: {
    url: 'https://gdyup.xyz/gdyup',
    cleartext: false,
    allowNavigation: [
      'gdyup.xyz',
      '*.gdyup.xyz',
      'supabase.co',
      '*.supabase.co'
    ]
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
    webContentsDebuggingEnabled: true,
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 GDYUP/1.0',
    appendUserAgent: 'GDYUP-iOS'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: "#DAFF0D",
      splashFullScreen: true,
      splashImmersive: true,
      launchAutoHide: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    },
    Keyboard: {
      resize: "ionic",
      style: "dark",
      resizeOnFullScreen: true
    }
  }
};

export default config;