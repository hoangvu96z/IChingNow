import { createSsoProxy } from '../shared/vite/ssoProxy.mjs';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: '/kinhdich/',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared/src'),
      '@iching': path.resolve(import.meta.dirname, 'src'),
      // Ensure only one instance of React is used even for files outside project root
      'react': path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime'),
      'lunar-javascript': path.resolve(import.meta.dirname, 'node_modules/lunar-javascript'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    strictPort: true,
    port: 5173,
    fs: {
      // Allow serving files from one level up (for shared/)
      allow: ['..'],
    },
    proxy: {
      ...createSsoProxy(loadEnv(mode, import.meta.dirname, 'VITE_')),
      // API requests go through the shared SSO proxy.
    }
  }
}))
