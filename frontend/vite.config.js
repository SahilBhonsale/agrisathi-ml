import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    open: true,
    headers: {
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  preview: {
    headers: {
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
})
