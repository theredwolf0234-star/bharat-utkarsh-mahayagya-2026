import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.maharishi.bharatutkarsh2026',
  appName: 'भारत उत्कर्ष महायज्ञ 2026',
  webDir: 'dist',
  server: {
    url: 'https://bharat-utkarsh-mahayagya-2026.onrender.com',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
