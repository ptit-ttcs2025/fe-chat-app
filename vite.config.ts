import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy'

// ✅ ES Module compatible __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets',
                    dest: '.'
                }
            ]
        })
    ],
    base: '/',
    publicDir: 'public',
    define: {
        global: 'window',
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        copyPublicDir: true,
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            }
        }
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
        proxy: {
            // ✅ Proxy cho API requests (tự động forward đến production backend)
            '/api': {
                target: 'https://ttcs-chat-app-z86ml.ondigitalocean.app',
                changeOrigin: true,
                secure: true,
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        // ✅ Log proxy requests for debugging
                        console.log(`🔄 [Vite Proxy] ${req.method} ${req.url} → ${proxyReq.path}`);
                    });
                    proxy.on('error', (err, req, res) => {
                        console.error('❌ [Vite Proxy] Error:', err.message);
                    });
                },
            },
        }
    }
})
