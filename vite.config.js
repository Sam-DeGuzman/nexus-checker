import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'),
      name: 'NexusWidget',
      formats: ['iife'],
      fileName: () => 'nexus-widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'nexus-widget.[ext]',
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
