import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tarot/',
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
    port: 5174,
    fs: {
      // Allow serving files from one level up (for shared/)
      allow: ['..'],
    },
    proxy: {
      '/tarot/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tarot\/api-vps/, '')
      },
      // SSO: VITE_SSO_URL=https://sso.vunph.click (see .env)
    }
  }
})

