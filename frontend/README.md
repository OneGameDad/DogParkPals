# Frontend Development

This frontend is a React + TypeScript app built with Vite.

## Local Development

From the `frontend/` directory:

```bash
npm install
npm run dev
```

`npm run dev` starts two local services:
- HTTP redirect server on `http://localhost:5173`
- Vite HTTPS dev server on `https://localhost:5174`

Behavior:
- Opening `http://localhost:5173` returns `308 Permanent Redirect` to `https://localhost:5174`
- The app itself is served from `https://localhost:5174`

## Scripts

- `npm run dev`: Start HTTP->HTTPS redirect + HTTPS Vite dev server
- `npm run dev:https-only`: Start only the HTTPS Vite dev server
- `npm run build`: Build production assets
- `npm run test`: Run Vitest tests
- `npm run lint`: Run ESLint

## Certificates

The HTTPS dev server reads certificates from:
- `../certs/server.crt`
- `../certs/server.key`

If these files are missing, generate or restore local certificates before running development.

## Optional Port Overrides

You can override ports with environment variables:

```bash
HTTP_PORT=5173 HTTPS_PORT=5174 npm run dev
```

`HTTP_PORT` controls the redirect listener, and `HTTPS_PORT` controls the Vite HTTPS server.
