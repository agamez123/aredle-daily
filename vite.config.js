import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite's default host, `localhost`, resolves to ::1 first here, so the dev
    // server would bind IPv6 loopback only and a browser that reaches for
    // 127.0.0.1 gets connection refused. Bind IPv4 loopback explicitly.
    host: '127.0.0.1',
  },
})
