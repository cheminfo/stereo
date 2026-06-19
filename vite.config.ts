import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base so the build works under any GitHub Pages project path
// (https://<org>.github.io/<repo>/) without hard-coding the repository name.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Mol* and OpenChemLib are large; raise the warning ceiling so the build
    // log stays clean. Code-splitting is handled by Vite's defaults.
    chunkSizeWarningLimit: 4000,
  },
});
