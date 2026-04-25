import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const catalogRemoteUrl = env.VITE_CATALOG_REMOTE_URL || 'http://localhost:5174/assets/remoteEntry.js';
  const profileRemoteUrl = env.VITE_PROFILE_REMOTE_URL || 'http://localhost:5175/assets/remoteEntry.js';

  return {
    plugins: [
      react(),
      federation({
        name: 'host',
        remotes: {
          catalog: catalogRemoteUrl,
          profile: profileRemoteUrl,
        },
        shared: ['react', 'react-dom', 'react-router-dom'],
      }),
    ],
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
    },
  };
});
