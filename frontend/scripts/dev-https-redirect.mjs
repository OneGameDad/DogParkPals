import http from 'node:http'
import { spawn } from 'node:child_process'

const httpPort = Number(process.env.HTTP_PORT || 5173)
const httpsPort = Number(process.env.HTTPS_PORT || 5174)

function getRedirectHost(hostHeader) {
  if (!hostHeader) return 'localhost'
  return hostHeader.replace(/:\d+$/, '')
}

const redirectServer = http.createServer((req, res) => {
  const host = getRedirectHost(req.headers.host)
  const location = `https://${host}:${httpsPort}${req.url || '/'}`

  res.statusCode = 308
  res.setHeader('Location', location)
  res.end(`Redirecting to ${location}`)
})

redirectServer.listen(httpPort, 'localhost', () => {
  console.log(`[redirect] http://localhost:${httpPort} -> https://localhost:${httpsPort}`)
})

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const viteProcess = spawn(npmBin, ['run', 'dev:https-only'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HTTPS_PORT: String(httpsPort),
  },
})

function shutdown(signal) {
  redirectServer.close(() => {
    process.stdout.write('[redirect] server closed\n')
  })

  if (!viteProcess.killed) {
    viteProcess.kill(signal)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

viteProcess.on('exit', (code) => {
  redirectServer.close(() => {
    process.exit(code ?? 0)
  })
})
