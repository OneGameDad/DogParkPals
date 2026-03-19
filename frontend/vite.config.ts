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
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
  }

  // Only configure HTTPS dev server for `vite serve`.
  // Docker/frontend builds run `vite build` and do not include local cert files.
  if (command === 'serve') {
    const keyPath = path.resolve(certDir, 'server.key')
    const certPath = path.resolve(certDir, 'server.crt')
    const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

    config.server = {
      host: 'localhost',
      port: httpsPort,
      strictPort: true,
      https: hasCerts
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        : undefined,
    }
  }

  return config
})
