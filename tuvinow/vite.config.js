import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tuvi/',
  server: {
    port: 5175,
    proxy: {
      '/tuvi/api-vps': {
        target: 'http://43.128.116.69',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tuvi\/api-vps/, '')
      },
      // SSO: VITE_SSO_URL=https://sso.vunph.click (see .env)
    }
  }
})
