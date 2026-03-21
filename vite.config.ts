import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    server: {
        host: true,
        port: 3000,
        open: true,
        fs: {
            strict: false
        }
    },
    build: {
        outDir: 'dist'
    },
    preview: {
        port: 3000
    },
    appType: 'spa'
})