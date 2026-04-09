import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exploris.app',
  appName: 'Exploris',
  webDir: 'dist',
  ...(process.env.LIVE_RELOAD && {
    server: {
      url: process.env.LIVE_RELOAD,
      cleartext: true,
    },
  }),
};

export default config;
