import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.APIKEY': JSON.stringify(Object.entries(env).find(([k]) => k.replace(/_/g, '') === 'GEMINIAPIKEY')?.[1] || ''),
        'process.env.GEMINIAPIKEY': JSON.stringify(Object.entries(env).find(([k]) => k.replace(/_/g, '') === 'GEMINIAPIKEY')?.[1] || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
