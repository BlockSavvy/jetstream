import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.gdyup.xyz',
  appName: 'GDY·UP',
  webDir: 'out',
  server: {
    url: 'https://gdyup.xyz/gdyup',
    cleartext: false
  }
};

export default config;