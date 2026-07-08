import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    proxy: {
      '/api-vps': {
        target: 'http://43.128.116.69:20128',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-vps/, '')
      },
      '/kinhdich/api-vps': {
        target: 'http://43.128.116.69:20128',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kinhdich\/api-vps/, '')
      }
    }
  }
})
