# DogParkPals
An app to check if your dog's friends are at their favorite park

## Description
Find local dog parks, make friends with the other dogs and their owners, and let one another know when you're going so your pups can always have playmates. Or use it to avoid dogs that don't get along. Either way, ensures you and your canine companions have the best time at the park.

As this is an MVP it is limited in scope to only included the public dog parks in Helsinki, and currently has no geolocation functionality.

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker & Docker Compose
- OpenSSL (for certificate generation)
- Node.js (for JWT secret generation, optional - auto-generated if not provided)

### Simple Deployment (One Command)

The easiest way to deploy DogParkPals is using the stack control script:

```bash
# Deploy everything with automatic configuration
./scripts/stack.sh --fresh
```

This single command will:
- ✓ Copy `docker-secrets-example` to `docker-secrets` if it doesn't exist
- ✓ Auto-generate secure `JWT_SECRET` and `ELASTIC_PASSWORD` if needed
- ✓ Fix Elasticsearch authentication configuration automatically
- ✓ Generate SSL certificates with proper Subject Alternative Names
- ✓ Build all Docker images
- ✓ Start all services (backend, frontend, observability stack)
- ✓ Seed the database with test data
- ✓ Initialize Kibana and Elasticsearch

**What you get:**
- Frontend: https://localhost:5173
- Backend API: https://localhost:3000
- Kibana: https://localhost:5601
- Grafana: https://localhost:3001
- Prometheus: https://localhost:9090

*Note: You'll see browser warnings for self-signed certificates (safe to ignore locally)*

### Manual Setup (Advanced)

If you prefer to configure everything manually:

1. **Copy environment configuration**
   ```bash
   cp docker-secrets-example docker-secrets
   ```

2. **Edit docker-secrets** (Optional - auto-generation handles most settings)
   ```bash
   nano docker-secrets
   ```
   
   Optional manual configuration:
   - `JWT_SECRET`: Auto-generated if empty (or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `ELASTIC_PASSWORD`: Auto-generated if empty/placeholder
   - `GOOGLE_CLIENT_ID`: (Optional) For Google OAuth
   - `GOOGLE_CLIENT_SECRET`: (Optional) For Google OAuth

3. **Deploy using stack script**
   ```bash
   ./scripts/stack.sh --fresh
   ```

### Common Operations

```bash
# Deploy full stack with all observability
./scripts/stack.sh --fresh

# Deploy core app only (fast, low-resource - no monitoring/logging)
./scripts/stack.sh --core-only

# Stop observability services only (keeps backend/frontend running)
./scripts/stack.sh --obs-down

# Full cleanup (remove all containers, volumes, and images)
./scripts/stack.sh --clean

# Check service status
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Important Notes

**Elasticsearch Authentication:**
- The stack script automatically configures secure Elasticsearch credentials
- Uses `elastic` superuser for backend/deployment-init.sh access
- Removes problematic `ELASTICSEARCH_SERVICEACCOUNTTOKEN` if present
- Auto-generates strong passwords if placeholders are detected

**Kibana Startup:**
- First startup can take 2-5 minutes
- Status `health: starting` is normal during initialization
- If Kibana times out, core services continue - setup can be run manually later
- Access at https://localhost:5601 once healthy

**Deployment Reliability:**
- ✅ Automatic volume cleanup prevents stale Elasticsearch state
- ✅ Container health checks verify services before proceeding
- ✅ Kibana initialization is non-fatal (warns but continues)
- ✅ Faster timeouts with better error detection
- ✅ Progress shown every 10 seconds (less noise)
- ✅ Core-only mode available for quick testing without observability

**Service Account Token Issues (Resolved):**
- Previous versions used `ELASTICSEARCH_SERVICEACCOUNTTOKEN`
- This caused Kibana startup failures in Elasticsearch 8.x
- Current version uses simpler `elastic` user authentication
- No manual token generation needed
       - `CAFILE=/etc/rabbitmq-exporter/ca.pem`
       - `SKIPVERIFY=false`
       - volume mount: `./certs/rabbitmq.crt:/etc/rabbitmq-exporter/ca.pem:ro`

11. **Expect transient `rabbitmq-exporter` 504 after fresh cert regeneration**
      - After `./scripts/stack.sh --fresh`, certificates are regenerated.
      - If `rabbitmq` and `rabbitmq-exporter` are not restarted in sync, exporter health can show
         `Error checking url: Unexpected http code 504` and briefly become `unhealthy`.
      - Recovery:
         ```bash
         docker compose restart rabbitmq rabbitmq-exporter
         ```
      - This is usually transient and resolves once both services are on the same cert/runtime state.

5. **Access the application**
   - Frontend: https://localhost:5173
   - Backend API: https://localhost:3000
   - Prometheus: https://localhost:9090
   - Grafana: https://localhost:3001 (admin/admin)
   - Kibana: https://localhost:5601
   - RabbitMQ Management: https://localhost:15671 (guest/guest)
   - Elasticsearch: https://localhost:9200 (use `ELASTICSEARCH_USERNAME`/`ELASTICSEARCH_PASSWORD` from `docker-secrets`)
   
   **Note:** You'll see a certificate warning in your browser when accessing HTTPS URLs with the self-signed certificate. This is expected for local development and can be safely bypassed.

### RabbitMQ (Event Queue & Management UI)

**Management UI:**
- HTTPS URL: https://localhost:15671
- Default credentials: `guest` / `guest`

**Queue Transport Security:**

The project supports both plaintext and encrypted RabbitMQ connections:

| Protocol | Port | Default | Use Case |
|----------|------|---------|----------|
| `amqp://` | 5672 | ❌ No | Local debugging only |
| `amqps://` | 5671 | ✅ Yes | Default and recommended (encrypted queue traffic) |

**Default:** AMQPS (`amqps://rabbitmq:5671`) is enabled by default.

**🔒 Enabling AMQPS (Recommended for Production):**

To enable encrypted queue transport, update `docker-secrets`:

```bash
RABBITMQ_URL=amqps://rabbitmq:5671
RABBITMQ_CA_PATH=/app/certs/rabbitmq.crt
RABBIT_SKIP_VERIFY=false
```

**Prerequisites:**
- SSL certificates must be generated first (see setup step 1 above)
- Backend will fail to start if `RABBITMQ_CA_PATH` doesn't exist when using `amqps://`

**Event Queue Behavior:**
- Failed event messages retry up to `EVENT_QUEUE_MAX_RETRIES` (default: 5)
- After max retries, messages move to Dead Letter Queue: `EVENT_QUEUE_DLQ_NAME`


### Docker Commands

**Primary Stack Control (Recommended):**

```bash
# Full deployment with auto-configuration
./scripts/stack.sh --fresh      # Complete setup + seeding + observability init

# Stop observability services only (keeps app running)
./scripts/stack.sh --obs-down   # Stop Elasticsearch, Kibana, Grafana, Prometheus, Logstash

# Full cleanup
./scripts/stack.sh --clean      # Stop all + remove volumes/images (fresh slate)

# Deployment verification
bash scripts/verify-deploy.sh   # Run pitfall checks (auth, healthchecks, etc.)
```

**Manual Docker Compose Commands:**

```bash
# Start all services (after stack.sh has configured everything)
docker compose --env-file docker-secrets up -d

# Start minimal services only (core app without observability)
docker compose --env-file docker-secrets up -d backend frontend rabbitmq db-init

# Stop observability services
docker compose stop elasticsearch logstash kibana prometheus grafana rabbitmq-exporter

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Stop all services
docker compose down

# Restart a specific service
docker compose restart backend
```

**Service Profiles:**

- **Minimal Stack** (core app only): backend, frontend, rabbitmq, db-init
  - ✓ Fully functional app with events/messaging
  - ✓ Lower resource usage (~1-2GB RAM)
  - ✓ Fast startup (~30-60 seconds)
  - ✓ Ideal for development and testing

- **Full Stack** (with observability): All minimal + elasticsearch, logstash, kibana, prometheus, grafana, rabbitmq-exporter
  - ✓ Centralized logging and search (ELK stack)
  - ✓ Metrics and monitoring dashboards
  - ✓ Higher resource usage (~4-6GB RAM)
  - ✓ Longer startup (~2-5 minutes for Kibana)
  - Startup time: 3-5 minutes (Kibana alone takes 2-5 min first run)

```bash
# Seed database
chmod +x scripts/docker-seed.sh
./scripts/docker-seed.sh

# Minimal evaluation setup (core app only + seed database)
docker compose --env-file docker-secrets up -d backend frontend rabbitmq db-init && bash scripts/docker-seed.sh

# Full evaluation setup (all services + seed + ELK/Prometheus setup + test logs)
chmod +x scripts/deployment-init.sh
docker compose --env-file docker-secrets up -d && bash scripts/deployment-init.sh
# ⏱️ Note: Kibana can take 2-5 minutes to fully initialize on first run; the script will wait

# Reset everything (WARNING: deletes all data)
chmod +x scripts/docker-reset.sh
./scripts/docker-reset.sh

# Generate test logs (verify Elasticsearch is working)
bash elasticsearch/generate-test-logs.sh

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
- `docker compose --env-file docker-secrets up -d` (starts backend, frontend, db-init, rabbitmq, prometheus, grafana, rabbitmq-exporter)
- `docker compose logs -f backend`
- `docker compose logs -f rabbitmq`

### Health checks
- Backend: `https://localhost:3000/health`
- Status: `https://localhost:3000/status`
- Frontend: `https://localhost:5173`
- RabbitMQ UI: `https://localhost:15671` (default `guest`/`guest`)

### Monitoring (Prometheus + Grafana)
DogParkPals includes Prometheus metrics and Grafana dashboards for observability.

**Access:**
- Prometheus: `https://localhost:9090`
- Grafana: `https://localhost:3001` (username: `admin`, password: `admin`)
- Backend Metrics: `https://localhost:3000/metrics`
- RabbitMQ Exporter: `http://rabbitmq-exporter:9419/metrics` (internal Docker network)
- Elasticsearch: `https://localhost:9200` (credentials from `docker-secrets`)
- Kibana: `https://localhost:5601`

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
- Kibana: `https://localhost:5601`
- Elasticsearch: `https://localhost:9200` (HTTPS API, basic auth)
- Logstash: Receives logs on TCP/UDP port 5000 (not user-facing)

**Verifying Logs (Fresh Deployments):**

In a fresh deployment, logs are generated automatically but may be minimal initially. To verify Elasticsearch is working:

1. **Wait for automatic logs** (1-2 minutes after startup):
   - Server startup: `"Server listening"` log
   - Auto-checkout job: Runs every 15 minutes
   - Event consumer & outbox publisher startup logs

2. **Generate test logs immediately** (recommended for evaluations):
   ```bash
   bash elasticsearch/generate-test-logs.sh
   ```
   This hits health/status endpoints 20 times to populate Elasticsearch with verifiable logs.

3. **Verify logs exist in Elasticsearch**:
   ```bash
   ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"
   ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"
   # Check total log count
   curl -k -u "$ES_USER:$ES_PASS" \
       'https://localhost:9200/dogparkpals-logs-*/_count'
   
   # View 5 most recent logs
   curl -s -k -u "$ES_USER:$ES_PASS" \
       'https://localhost:9200/dogparkpals-logs-*/_search?size=5&sort=@timestamp:desc' | jq '.hits.hits[]._source | {timestamp: .["@timestamp"], severity, log_message}'
   ```

4. **Open Kibana** to browse logs visually at `https://localhost:5601`

**Note:** Logs take 5-10 seconds to flow from backend → Logstash → Elasticsearch → Kibana indexing.

**Setup:**
After starting Docker services, initialize Kibana with dashboards and saved searches:
```bash
bash kibana/setup-kibana.sh
```

**For 42 evaluation-ready setup** (starts all services + seeds DB + configures Kibana + generates test logs):
```bash
docker compose --env-file docker-secrets up -d && bash scripts/deployment-init.sh
```

This will:
1. Start all services (backend, frontend, Elasticsearch, Logstash, Kibana, Prometheus, Grafana, RabbitMQ)
2. Wait for services to be healthy
3. Seed the database with sample data
4. Configure Kibana dashboards and index patterns
5. Generate test logs for verification

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
- Check Elasticsearch has data: `ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"; ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"; curl -k -u "$ES_USER:$ES_PASS" https://localhost:9200/dogparkpals-logs-*/_count`
- Generate test logs: `bash elasticsearch/generate-test-logs.sh`
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
- Check retention policy is active: `ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"; ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"; curl -k -u "$ES_USER:$ES_PASS" https://localhost:9200/_ilm/policy/dogparkpals-logs-ilm`
- Manually delete old indices: `ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"; ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"; curl -k -u "$ES_USER:$ES_PASS" -X DELETE https://localhost:9200/dogparkpals-logs-2026.01.*`
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
- Verify ELK stack (logs are flowing to Elasticsearch):
   - `bash elasticsearch/generate-test-logs.sh`
   - `ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"; ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"; curl -k -u "$ES_USER:$ES_PASS" 'https://localhost:9200/dogparkpals-logs-*/_count'`

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
  - Server listens on `https://localhost:3000`
   - Health check: `GET /health` or `GET /status`
 
### Frontend Setup (Local Development)
- Install dependencies:
   ```bash
   npm install
   ```
-  (Optional) Create `.env` file if you need custom API URL:
   ```bash
   echo 'VITE_API_URL=https://localhost:3000' > .env
   ```
   Note: Defaults to `https://localhost:3000` if not specified
- Start the frontend dev server:
   ```bash
   npm run dev
   ```
   - Frontend runs on `https://localhost:5173`
   - Open in browser: `https://localhost:5173`

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

**Messages** - Direct messaging between users with delivery status and real-time WebSocket support
- Status: SENT, DELIVERED, READ, ARCHIVED, DELETED
- Real-time message delivery via WebSocket (Socket.io)
- Typing indicators and read receipts
- Indexed for efficient queries
- See [WEBSOCKET_MESSAGING.md](./WEBSOCKET_MESSAGING.md) for details

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

**Notifications** - User alerts for various activities with real-time WebSocket delivery
- Types: FRIENDSHIP_REQUEST, FRIENDSHIP_ACCEPTED, MESSAGE_RECEIVED, EVENT_INVITATION, EVENT_REMINDER, ACHIEVEMENT_EARNED, LEVEL_UP, COMMENT_REPLY, PARK_REVIEW, ORGANIZATION_INVITE
- Real-time push notifications via WebSocket (Socket.io)
- See [WEBSOCKET_NOTIFICATIONS.md](./WEBSOCKET_NOTIFICATIONS.md) for details

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
| Centralized Logging & Audit Trail w/ ELK Stack    | 2      |
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
- Setup ELK