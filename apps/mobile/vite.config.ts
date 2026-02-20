import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@repo/tailwind-config": path.resolve(__dirname, "../../packages/tailwind-config"),
    },
  },
})
