# DogParkPals
An app to check if your dog's friends are at their favorite park

## Description
Find local dog parks, make friends with the other dogs and their owners, and let one another know when you're going so your pups can always have playmates. Or use it to avoid dogs that don't get along. Either way, ensures you and your canine companions have the best time at the park.

As this is an MVP it is limited in scope to only included the public dog parks in Helsinki, and currently has no geolocation functionality.

## Instructions
### Dev Database (Docker Compose)
- Copy `.env.example` (repo root) to `.env` and set values (`DB_USER`, `DB_PASSWORD`, `DB_PORT`).
- Start Postgres:
  - `docker-compose up -d` (legacy) or `docker compose up -d` (v2)
- Stop Postgres:
  - `docker-compose down`
- Check status:
  - `docker-compose ps`
- View logs:
  - `docker-compose logs db`

If you see permission errors with Docker Compose on Linux:
- `sudo usermod -aG docker "$USER" && newgrp docker`

### Backend Setup
- Copy `backend/.env.example` to `backend/.env`.
- Apply migrations and seed:
	- `cd backend`
	- `npx prisma migrate dev`
	- `npx prisma db seed`

### Notes
- Do not commit `.env` or `.docker-secrets`.
- Prisma migrations in `backend/prisma/migrations` are versioned; run migrate after pulling.

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