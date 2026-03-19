import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const certDir = path.resolve(__dirname, '../certs')
const httpsPort = Number(process.env.HTTPS_PORT || 5174)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: httpsPort,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(certDir, 'server.key')),
      cert: fs.readFileSync(path.resolve(certDir, 'server.crt')),
    },
  },
})
