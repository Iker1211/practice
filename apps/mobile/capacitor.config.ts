import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp.mobile',
  appName: 'MyApp Mobile',
  webDir: 'dist',

  // iOS específico (opcional)
  ios: {
    contentInset: 'always',
  },
  plugins: {
    // Aquí irían plugins nativos si necesitas
  }

};

export default config;
