import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/talkwithme/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5176,
    host: 'localhost',
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/contact': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
      '/sso': {
        target: 'https://sso.vunph.click',
        changeOrigin: true,
        secure: true,
      },
    }
  }
})
