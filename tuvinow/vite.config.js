import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tuvi/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      // Ensure only one instance of React is used even for files outside project root
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5175,
    host: 'localhost',
    fs: {
      // Allow serving files from one level up (for shared/)
      allow: ['..'],
    },
    proxy: {
      // Proxy SSO API calls to avoid CORS issues in dev
      // In production, VITE_SSO_URL = https://sso.vunph.click (direct)
      '/plans': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
      '/readings': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
      '/sso': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
      '/ui': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
      '/tuvi/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tuvi\/api-vps/, '')
      },
      // SSO: VITE_SSO_URL=https://sso.vunph.click (see .env)
    }
  }
})
