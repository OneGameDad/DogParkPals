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
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Kibana: http://localhost:5601
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

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
- `docker compose up -d` (starts backend, frontend, db-init, rabbitmq, prometheus, grafana, rabbitmq-exporter)
- `docker compose logs -f backend`
- `docker compose logs -f rabbitmq`

### Health checks
- Backend: `http://localhost:3000/health`
- Status: `http://localhost:3000/status`
- Frontend: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672` (default `guest`/`guest`)

### Monitoring (Prometheus + Grafana)
DogParkPals includes Prometheus metrics and Grafana dashboards for observability.

**Access:**
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (username: `admin`, password: `admin`)
- Backend Metrics: `http://localhost:3000/metrics`
- RabbitMQ Exporter: `http://localhost:9419/metrics`

**Available Metrics:**
- Node.js runtime (memory, event loop lag, GC)
- Event handler executions (success/failure counts, duration by event type)
- Background job executions (outboxPublisher, autoCheckoutJob, eventConsumer)
- Outbox event publishing (success/failure by event type)
- Auto park checkout operations
- RabbitMQ queue metrics (queue depth, message rates, connections)

**Dashboards:**
- "DogParkPals - System Overview" is auto-provisioned on Grafana startup
- View 10 panels covering system health, operations, performance, and event bus monitoring
- Auto-refreshes every 10 seconds, shows last hour by default

**Querying Prometheus:**
- Example: `dogparkpals_event_handler_executions_total{status="success"}`
- Example: `rate(dogparkpals_outbox_events_published_total[5m])`
- Example: `histogram_quantile(0.95, rate(dogparkpals_job_duration_seconds_bucket[5m]))`

### Centralized Logging (ELK Stack)
DogParkPals includes an ELK stack (Elasticsearch, Logstash, Kibana) for centralized log aggregation, search, and audit trail capabilities.

**Access:**
- Kibana: `http://localhost:5601`
- Elasticsearch: `http://localhost:9200` (HTTP API)
- Logstash: Receives logs on TCP/UDP port 5000 (not user-facing)

**Setup:**
After starting Docker services, initialize Kibana with dashboards and saved searches:
```bash
bash kibana/setup-kibana.sh
```

This creates:
- Elasticsearch ILM (Index Lifecycle Management) policy for automatic log retention
- Index pattern `dogparkpals-logs-*` (queries all log indices automatically)
- 8 pre-configured saved searches (all logs, errors, events, failed jobs, etc.)
- 5 sample dashboards (event timeline, error analysis, user activity, system health, audit trail)

**Log Retention (Automatic):**
- Hot Phase (0-1 day): Active indexing, rollover at 50GB or 1 day
- Warm Phase (1-7 days): Read-only access
- Delete Phase (30+ days): Automatic deletion

Logs older than 30 days are automatically deleted to prevent disk space issues. Customize retention in [elasticsearch/ilm-policy.json](./elasticsearch/ilm-policy.json).

**Key Features:**

**Event-Driven Audit Trail:**
- All 34 domain event types are automatically logged to Elasticsearch
- Immutable record of every system change for compliance
- Tagged with event_id, actor_id, user_id, dog_id, park_id, organization_id
- Searchable by time, user, event type, resource ID, or outcome

**Structured JSON Logging:**
- Backend logs sent to Logstash via UDP (fire-and-forget, no blocking)
- Automatically parsed and enriched with contextual fields
- Error stack traces captured and searchable
- Handler performance metrics (duration_ms) tracked
- Request tracing with trace_id for correlation

**Available Dashboards:**
1. **Event Timeline** - Real-time volume of all domain events (24h)
2. **Error Analysis** - Error distribution by severity and trends (7d)
3. **User Activity Breakdown** - Top users and event types (7d)
4. **System Health & Performance** - Failed jobs and handler latency (24h)
5. **Complete Audit Trail** - Searchable record of all 34 event types (30d)

**Quick Searches:**

Access these pre-built saved searches in Kibana → Discover:
- **All Logs** - View complete system logs
- **Errors & Warnings** - Filter for severity: error, fatal, warn
- **Domain Events** - Pure event-driven audit trail (context_type: event)
- **Failed Background Jobs** - job.failed events from outboxPublisher, autoCheckoutJob, eventConsumer
- **Event Handler Performance** - Handler execution logs with timing metrics

**Common Queries (KQL - Kibana Query Language):**
```
# All errors in last hour
severity: error OR severity: fatal

# Events by specific user
actor_id: 123

# Failed operations affecting a dog
dog_id: 456 AND severity: error

# Trace event workflow
event_type: (friend.request.sent OR friend.request.accepted)

# Handler performance over threshold
duration_ms > 500

# All system changes in a park
park_id: 789
```

**Log Fields Reference:**

Key searchable fields automatically extracted by Logstash:
- `@timestamp` - Event timestamp (UTC, indexed for fast queries)
- `severity` - Log level: debug, info, warn, error, fatal
- `context_type` - Log category: event (domain events), request, error
- `event_id` - UUID of domain event
- `event_type` - Type of domain event (e.g., friend.request.sent)
- `actor_id` - User who triggered the event
- `user_id`, `dog_id`, `park_id`, `organization_id` - Affected resources
- `duration_ms` - Execution time in milliseconds (for handlers/jobs)
- `error.message`, `error.stack` - Exception details
- `trace_id` - Request correlation ID for tracing

Full field reference: See [kibana/README.md](./kibana/README.md)

**Monitoring Best Practices:**

Daily:
1. Open **System Health & Performance** dashboard
2. Check for `job.failed` events (indicates stuck background jobs)
3. Review handler performance (watch for > 500ms outliers)

Weekly:
1. Open **Complete Audit Trail** dashboard
2. Sample events to verify audit trail accuracy
3. Check **Error Analysis** for recurring patterns

Incident Response:
1. Use **Complete Audit Trail** → Filter by timestamp/user/resource
2. Use **Error Analysis** → Identify when errors started/stopped
3. Export relevant logs (Kibana → inspect panel → download CSV)

**Troubleshooting:**

**No logs appearing in Kibana?**
- Verify Logstash is running: `docker compose logs logstash`
- Check Elasticsearch has data: `curl http://localhost:9200/dogparkpals-logs-*/_count`
- Run setup script: `bash kibana/setup-kibana.sh`
- Ensure backend is logging (check `docker compose logs backend`)

**"No matching indices" error?**
- Wait 30 seconds for first log to arrive
- Refresh index pattern: Kibana → Stack Management → Index Patterns → dogparkpals-logs-* → Refresh fields

**Kibana is slow?**
- Use shorter time range (Last 24h instead of Last 30d)
- Add more specific filters
- Archive indices older than 30 days (advanced: see Elasticsearch docs)

**Disk space filling up?**
- Check retention policy is active: `curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm`
- Manually delete old indices: `curl -X DELETE http://localhost:9200/dogparkpals-logs-2026.01.*`
- Reduce retention period: Edit [elasticsearch/ilm-policy.json](./elasticsearch/ilm-policy.json)

**Complete Documentation:**
- Kibana setup and log retention: [kibana/README.md](./kibana/README.md)
- Dashboard details and examples: [kibana/DASHBOARDS.md](./kibana/DASHBOARDS.md)
- Logstash pipeline: [logstash/pipeline/dogparkpals.conf](./logstash/pipeline/dogparkpals.conf)
- Elasticsearch index template: [elasticsearch/index-template.json](./elasticsearch/index-template.json)
- Elasticsearch ILM policy: [elasticsearch/ilm-policy.json](./elasticsearch/ilm-policy.json)

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
- Prometheus (Metrics & Monitoring)
- Grafana (Dashboards & Visualization)
- Elasticsearch (Centralized Logging)
- Logstash (Log Processing & Enrichment)
- Kibana (Log Search & Dashboard)

Reasoning: All commonly used tech, requested or required in many job advertisements. They also are well documented and supported. ELK stack provides immutable event-driven audit trail, centralized logging, and compliance-ready dashboards.

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
- Metrics
- Dashboards & Visualizations

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
| Monitoring System w/ Prometheus + Grafana         | 2      |
| Centralized Logging & Audit Trail w/ ELK Stack   | 2      |
| Total:                                            | 24     |

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
- Setup Prometheus + Grafana