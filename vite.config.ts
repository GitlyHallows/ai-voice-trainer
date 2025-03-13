import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { plugin as markdown } from 'vite-plugin-markdown';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    markdown({ mode: ['html', 'raw'] })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: true,
    watch: {
      usePolling: true
    }
  },
  // Ensure env variables are loaded
  envDir: '.',
  // Define which env variables should be available in the app
  envPrefix: 'VITE_'
});
