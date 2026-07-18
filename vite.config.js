import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-vps/, '')
      },
      '/kinhdich/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kinhdich\/api-vps/, '')
      },
      // SSO proxy — forwards /sso/* to vInfiSSO server in local dev
      '/sso': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

