import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // two pages: the portfolio (index.html) and the toggle gallery (toggles.html, at /toggles.html)
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        toggles: path.resolve(import.meta.dirname, 'toggles.html'),
      },
    },
  },
})
