import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The preview runtime serves Vite through a proxy that does not expose
      // the dev-server HMR WebSocket. Disable the client and watcher so it
      // does not repeatedly report "WebSocket closed without opened".
      hmr: false,
      watch: null,
    },
  };
});
