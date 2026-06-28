import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      i18next: path.resolve(__dirname, 'src/webview/i18next.ts'),
      'react-i18next': path.resolve(__dirname, 'src/webview/react-i18next.ts'),
    },
  },
  plugins: [react(), tailwindcss()],
  root: 'src/webview',
  base: '',
  build: {
    outDir: '../../dist/webview',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['../../tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    setupFiles: '../../tests/setup.ts',
  },
});
