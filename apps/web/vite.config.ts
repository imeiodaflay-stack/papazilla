import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Os pacotes `@papazilla/*` são workspaces (symlink em node_modules); o Vite os
 * resolve pelo `exports`/`main` de cada package.json. `optimizeDeps.exclude` evita
 * o pre-bundle deles para manter o HMR entre app e pacotes.
 */
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  optimizeDeps: {
    exclude: [
      '@papazilla/nutrition-engine',
      '@papazilla/domain',
      '@papazilla/design-system',
      '@papazilla/validation',
    ],
  },
});
