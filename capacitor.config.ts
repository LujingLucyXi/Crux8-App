import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.crux8.ios',
  appName: 'Crux8',
  webDir: 'dist',
  // Let the webview extend under the status bar / home indicator —
  // the app's own safe-area CSS (env()) handles the insets.
  ios: {
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
