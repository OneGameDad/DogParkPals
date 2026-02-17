# DogParkPals
An app to check if your dog's friends are at their favorite park

## Description
Find local dog parks, make friends with the other dogs and their owners, and let one another know when you're going so your pups can always have playmates. Or use it to avoid dogs that don't get along. Either way, ensures you and your canine companions have the best time at the park.

As this is an MVP it is limited in scope to only included the public dog parks in Helsinki, and currently has no geolocation functionality.

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker
- Docker Compose

### Setup

1. **Copy environment configuration**
   ```bash
   cp docker-secrets-example docker-secrets
   ```

2. **Edit docker-secrets with your credentials**
   ```bash
   nano docker-secrets
   ```
   
   Required:
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `GOOGLE_CLIENT_ID`: (Optional) Get from Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: (Optional) Get from Google Cloud Console

3. **Run the setup script**
   ```bash
   chmod +x scripts/docker-setup.sh
   ./scripts/docker-setup.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### RabbitMQ (Management UI)

- URL: http://localhost:15672
- Default credentials: `guest` / `guest` (unless you configure different credentials)
- To change credentials, update the RabbitMQ service settings in docker-compose.yml
- Failed event messages retry up to `EVENT_QUEUE_MAX_RETRIES`, then move to `EVENT_QUEUE_DLQ_NAME`

### Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart a service
docker compose restart backend

# Seed database
chmod +x scripts/docker-seed.sh
./scripts/docker-seed.sh

# Reset everything (WARNING: deletes all data)
chmod +x scripts/docker-reset.sh
./scripts/docker-reset.sh

# Access backend shell
docker exec -it dogparkpals-backend sh

# Run migrations
docker exec -it dogparkpals-backend npx prisma migrate deploy

# Open Prisma Studio
docker exec -it dogparkpals-backend npx prisma studio
```

## Local Ops Checklist

Quick reference for running DogParkPals locally with Docker and validating the event-driven pipeline.

### Prereqs
- Docker + Docker Compose
- `docker-secrets` created from `docker-secrets-example`

### Start stack
- `docker compose up -d`
- `docker compose logs -f backend`
- `docker compose logs -f rabbitmq`

### Health checks
- Backend: `http://localhost:3000/health`
- Status: `http://localhost:3000/status`
- Frontend: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672` (default `guest`/`guest`)

### Event bus sanity
- Ensure `EVENT_BUS_ENABLED` is not `false` in `docker-secrets`.
- Check outbox publisher logs for publish success.
- Verify DLQ size in RabbitMQ UI if retries are exhausted.

### Common checks
- Run migrations (db-init should do this):
   - `docker exec -it dogparkpals-backend npx prisma migrate deploy`
- Seed data:
   - `./scripts/docker-seed.sh`
- Reset all data:
   - `./scripts/docker-reset.sh`

### Backup event emission (docker task)
- Emit backup started:
   - `docker compose run --rm backup-events started --backupId=backup-local --target=db --storage=local`
- Emit backup succeeded:
   - `docker compose run --rm backup-events succeeded --backupId=backup-local --sizeBytes=123456 --durationMs=120000`
- Emit backup failed:
   - `docker compose run --rm backup-events failed --backupId=backup-local --error="backup failed"`

### Failure signals to watch
- Outbox publish failures logged as `job.failed` events (see backend logs).
- Event consumer start failures logged as `job.failed` events.
- Auto-checkout job failures logged as `job.failed` events.

### Shutdown
- `docker compose down`

## Local Development Setup (Without Docker)

### Backend Setup (Local SQLite)
- Ensure Node 20+ is installed: `node --version`
- Backend uses local SQLite database at `backend/dev.db` (created automatically).
- Setup:
  - `cd backend`
  - `npm install`
  - `npx prisma generate` (generates Prisma client)
  - `npx prisma migrate dev --name init` (first time only)
  - `npx prisma db seed` (optional: seeds test data; configured via package.json Prisma hook)
- Start dev server:
  - `npm run dev` (TypeScript watch mode) or `npm run build && node dist/server.js` (production)
  - Server listens on `http://localhost:3000`
   - Health check: `GET /health` or `GET /status`
 
### Frontend Setup (Local Development)
- Install dependencies:
   ```bash
   npm install
   ```
-  (Optional) Create `.env` file if you need custom API URL:
   ```bash
   echo 'VITE_API_URL=http://localhost:3000' > .env
   ```
   Note: Defaults to `http://localhost:3000` if not specified
- Start the frontend dev server:
   ```bash
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173`
   - Open in browser: `http://localhost:5173`

### Notes
- Do not commit `backend/prisma/generated/client/` (generated Prisma client; run `npx prisma generate` after pulling).
- Do not commit `backend/dev.db` (local SQLite database).
- Do not commit `docker-secrets` (Docker environment variables).
- Prisma migrations in `backend/prisma/migrations` are versioned; run `npx prisma migrate deploy` after pulling to sync.
- Environment: `DATABASE_URL=file:./dev.db` is set in `backend/.env` for local SQLite development.
- Prisma config file `prisma.config.ts` has been removed; Prisma reads `schema.prisma` and the seed hook from `package.json`.

## Resources
- Copilot: Code Reviews, tests
- Youtube: ORM and database schema basics
- Pineapple Pizza: Morale Boosting

## Team
- [Gregory Pellechi: Product Owner](https://github.com/OneGameDad)
- [Laura Guillen: Product Manager](https://github.com/solleksmori)
- [Renato de Moraes Bonilha: Tech Lead](https://github.com/moraesbo)
- [Jules Pierce: Developer & Team Mascot](https://github.com/Jules478)
- [Mark Byrne: Developer](https://github.com/Mark-Byrne-Codes)

## Project Management
- Tasks: Kanban Board on Github Projects
- Repository: Github https://github.com/OneGameDad/DogParkPals
- Diagrams, Meeting Notes, etc: Miro
- Discord: Communication
- Meetings: In-person at the Hive (averaged 1 a week), online (see Discord)
- Documentation: Markdown files, code comments

## Tech Stack
- Vite
- React
- NodeJS
- Express
- Typescript
- SQLite(Database)
- Prisma 6 (ORM)
- Jest (Backend unit tests)
- Supertest (Backend integration tests)
- RabbitMQ (Queue & Messaging)

Reasoning: All commonly used tech, requested or required in many job advertisements. They also are well documented and supported.

## Database Schema

The database is built with SQLite and managed by Prisma ORM. Below is an overview of the core models and their relationships:

### Core Models

**User** - User accounts with profile information, authentication, and relationships
- Authentication: email, password_hash, username
- Profile: first_name, last_name, profilePictureUrl, latitude, longitude
- Roles: CLIENT, DEVELOPER, ADMIN
- Relationships: dog ownerships, check-ins, organizations, friendships, enemies, messages, notifications, events, achievements, levels

**Dog** - Dog profiles with breed, size, and play style information
- Attributes: name, breed (extensive enum of 500+ breeds), gender, size (TOY, SMALL, MEDIUM, LARGE, GIANT, KAIJU), playstyle (SOCIAL, SHY, AGGRESSIVE, ENERGETIC, CALM)
- Health/Care: dateOfBirth, fixed, vaccinationRecordUrl
- Relationships: owner records, check-ins, friendships, enemies

**Park** - Dog park locations with amenities and descriptions
- Location: name, latitude, longitude
- Features: description, separateSmallDogArea, amenities (JSON), profilePictureUrl
- Relationships: events, comments, check-ins, users (favorites)

**Event** - Park events with organizers and attendees
- Details: title, description, date, startTime, endTime
- Settings: privacy (PUBLIC, PRIVATE)
- Relationships: park, organization (optional), organizer, attendees, comments

**Organization** - Groups for coordinating events and managing members
- Information: name, profilePictureUrl, websiteUrl, description
- Membership: owner, members with roles (INVITEE, MEMBER, MODERATOR, OWNER, BANNED)
- Relationships: events, members

### Social & Interaction Models

**Friendship** - Connections between users/dogs with status tracking
- Status: PENDING, ACCEPTED, REJECTED, BLOCKED
- Supports both user-to-user and dog-to-dog friendships

**Enemies** - Blocked/avoid list for users and their dogs
- Owner-managed list of users/dogs to avoid

**Messages** - Direct messaging between users with delivery status
- Status: SENT, DELIVERED, READ, ARCHIVED, DELETED
- Indexed for efficient queries

**CheckIn** - Track when users and dogs visit parks
- Records: userId, dogId (optional), parkId, checkedInAt, checkedOutAt
- Enables real-time presence tracking at parks

### Gamification Models

**Achievements** - Badges and trophies earned by users
- Types: BADGE, TROPHY, CERTIFICATE
- Linked to UserAchievement join table for tracking earned achievements

**Levels** - User progression levels with points thresholds
- Attributes: name, minPoints, maxPoints, badgeUrl
- Users earn experience points (ExpPoints) and progress through levels

**Notifications** - User alerts for various activities
- Types: FRIENDSHIP_REQUEST, FRIENDSHIP_ACCEPTED, MESSAGE_RECEIVED, EVENT_INVITATION, EVENT_REMINDER, ACHIEVEMENT_EARNED, LEVEL_UP, COMMENT_REPLY, PARK_REVIEW, ORGANIZATION_INVITE

### Supporting Models

**DogOwner** - Join table linking users to their dogs
**UserFavoritePark** - Join table for users' favorite parks
**OrganizationMember** - Join table with membership roles
**EventAttendance** - Join table tracking event attendees
**Comment** - Comments on parks and events
**UserLevel** - Join table for user progression
**UserAchievement** - Join table for earned achievements

## Features List
- User Profiles
- Dog Profiles
- Friends List
- Enemies List
- Messages
- Notifications
- Favorite Park
- Organizations
- Events
- Parks
- Checkins
- Achievements, Levels & Badges
- Advanced Search
- Localization (English, Finnish, Spanish)
- Remote Auth (Google Login)
- Multibrowser Support

## Modules
| Module                                            | Points |
| :------------------------------------------------ | :----: |
| Web Framework (Frontend: React, Backend: Express) | 2      |
| User Interaction (Profile, Chat, Friends)         | 2      |
| ORM (Prisma)                                      | 1      |
| Notifications                                     | 1      |
| File Upload System (jpg, png, pdf)                | 1      |
| Custom Design System                              | 1      |
| User Management System                            | 2      |
| Advanced Permissions System                       | 2      |
| Organizations System                              | 2      |
| Achievements, Levels & Badges (Gamification)      | 1      |
| Advanced Search                                   | 1      |
| Localization (English, Finnish, Spanish)          | 1      |
| Remote Auth (Google Login)                        | 1      |
| Multibrowser Support                              | 1      |
| Health check & status page system w/ backups, etc | 1      |
| Total:                                            | 20     |

## Individual Contributions

### Laura Guillen
- Notifications
- File Uploads
- Localization
- Messaging

### Jules Pierce
- Custom Design System
- Frontend Design

### Mark Byrne
- Frontend Functionality
- Frontend Structure
- Advanced Search Frontend

### Renato de Moraes Bonilha
- Achivements, Levels, Badges
- Authorization & Authentication
- Remote Authentication
- Users
- Docker
- Advanced Search Backend

### Gregory Pellechi
- Database Schema
- Dogs
- Parks
- Organizations
- Events
- Friends
- Enemies
- Testing Framework
- Backend Refactor (Event-Driven Architecture)
- Setup RabbitMQ