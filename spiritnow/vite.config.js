import { createSsoProxy } from '../shared/vite/ssoProxy.mjs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/spiritnow/',
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared/src'),
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    strictPort: true,
    port: 5178,
    fs: { allow: [path.resolve(import.meta.dirname, '..')] },
    proxy: createSsoProxy(loadEnv(mode, import.meta.dirname, 'VITE_')),
  },
}));
