# DogParkPals
An app to check if your dog's friends are at their favorite park

## Description
Find local dog parks, make friends with the other dogs and their owners, and let one another know when you're going so your pups can always have playmates. Or use it to avoid dogs that don't get along. Either way, ensures you and your canine companions have the best time at the park.

As this is an MVP it is limited in scope to only included the public dog parks in Helsinki, and currently has no geolocation functionality.

## Instructions
### Backend Setup (Local SQLite)
- Ensure Node 20+ is installed: `node --version`
- Backend uses local SQLite database at `backend/dev.db` (created automatically).
- Setup:
  - `cd backend`
  - `npm install`
  - `npx prisma generate` (generates Prisma client)
  - `npx prisma migrate dev --name init` (first time only)
  - `npx prisma db seed` (optional: seeds test data)
- Start dev server:
  - `npm run dev` (TypeScript watch mode) or `npm run build && node dist/server.js` (production)
  - Server listens on `http://localhost:3000`
  - Health check: `GET /health`

### Notes
- Do not commit `backend/prisma/generated/client/` (generated Prisma client; run `npx prisma generate` after pulling).
- Do not commit `backend/dev.db` (local SQLite database).
- Prisma migrations in `backend/prisma/migrations` are versioned; run `npx prisma migrate deploy` after pulling to sync.
- Environment: `DATABASE_URL=file:./dev.db` is set in `backend/.env` for local SQLite development.

## Resources
More to come

## Team
- Gregory Pellechi: Product Owner
- Laura Guillen: Product Manager
- Renator de Moraes Bonilha: Tech Lead
- Jules Pierce: Developer & Team Mascot
- Mark Byrne: Developer

## Project Management
More to come

## Tech Stack
- React
- NodeJS
- Express
- Typescript
- SQLite(Database)
- Prisma 6 (ORM)

Reasoning: All commonly used tech, requested or required in many job advertisements. They also are well documented and supported.

## Databse Schema
More to come

## Features List
More to come

## Modules
More to come

## Individual Contributions
More to come