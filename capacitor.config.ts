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
    scrollEnabled: true,
    backgroundColor: '#000000'
  },
  plugins: {
    // Minimal plugin configuration to avoid build issues
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    }
  }
};

export default config;