import { createSsoProxy } from '../shared/vite/ssoProxy.mjs';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/tarot/',
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared/src'),
      // Ensure only one instance of React is used even for files outside project root
      'react': path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    strictPort: true,
    port: 5174,
    fs: {
      // Allow serving files from one level up (for shared/)
      allow: ['..'],
    },
    proxy: {
      ...createSsoProxy(loadEnv(mode, import.meta.dirname, 'VITE_')),
      '/tarot/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tarot\/api-vps/, '')
      },
      // SSO: VITE_SSO_URL=https://sso.vunph.click (see .env)
    }
  }
}))
