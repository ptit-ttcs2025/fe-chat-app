import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/react/template/', // 👈 This ensures correct asset loading path
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      moment: 'moment/moment.js',
      '@': path.resolve(__dirname, './src')
    },
  },
})
