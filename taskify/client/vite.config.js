import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward every /api/* request to the Express server during development.
    // The React code can then use relative URLs ("/api/names") — the same
    // form that works unchanged behind nginx in Docker.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
