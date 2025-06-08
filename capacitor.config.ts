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
      'supabase.co',
      '*.supabase.co',
      'vjhrmizwqhmafkxbmfwa.supabase.co'
    ]
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#000000',
    overrideUserAgent: 'GDY-UP-iOS',
    appendUserAgent: 'GDY-UP-Mobile',
    scheme: 'capacitor'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
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
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    Haptics: {}
  }
};

export default config;