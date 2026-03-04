import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, '.'),
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    open: true,
  },
})
