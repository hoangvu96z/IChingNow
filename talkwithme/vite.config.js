import { createSsoProxy } from '../shared/vite/ssoProxy.mjs';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/talk/',
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared/src'),
      'react': path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    strictPort: true,
    port: 5176,
    host: 'localhost',
    fs: {
      allow: ['..'],
    },
    proxy: {
      ...createSsoProxy(loadEnv(mode, import.meta.dirname, 'VITE_')),
    }
  }
}))
