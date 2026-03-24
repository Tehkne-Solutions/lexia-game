import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'spa-fallback',
            configureServer(server) {
                return () => {
                    server.middlewares.use((req, res, next) => {
                        if (!req.url.includes('.') && !req.url.startsWith('/node_modules/') && !req.url.startsWith('/@')) {
                            req.url = '/index.html'
                        }
                        next()
                    })
                }
            }
        }
    ],
    root: path.resolve(__dirname, '.'),
    publicDir: 'public',
    server: {
        host: '0.0.0.0',
        port: 3000,
        fs: {
            strict: false
        }
    },
    build: {
        outDir: 'dist'
    },
    preview: {
        port: 3000
    }
})