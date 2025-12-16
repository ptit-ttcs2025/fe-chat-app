import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/',
    define: {
        global: 'window',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'src': path.resolve(__dirname, './src'),
            '@/core': path.resolve(__dirname, './src/core'),
            '@/feature-module': path.resolve(__dirname, './src/feature-module'),
            '@/assets': path.resolve(__dirname, './src/assets'),
            '@/apis': path.resolve(__dirname, './src/apis'),
            '@/store': path.resolve(__dirname, './src/store'),
            '@/slices': path.resolve(__dirname, './src/slices'),
            '@/lib': path.resolve(__dirname, './src/lib'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/environment': path.resolve(__dirname, './src/environment.ts'),
        }
    },
    server: {
        hmr: {
            overlay: true
        },
        proxy: { // ✅ Thêm proxy cho API
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
