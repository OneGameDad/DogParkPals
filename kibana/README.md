# Kibana Setup for DogParkPals Logs

This directory contains configuration and scripts for setting up Kibana to display and search DogParkPals logs.

## Quick Start

After running `docker compose up -d`, setup Kibana with:

```bash
chmod +x kibana/setup-kibana.sh
bash kibana/setup-kibana.sh
```

Then open Kibana: http://localhost:5601

## What Gets Created

### Index Pattern
- **Name:** `dogparkpals-logs-*`
- **Time Field:** `@timestamp`
- Automatically discovers all daily indices created by Logstash

### Saved Searches (8)

Pre-configured searches available in Kibana's Discover tab:

1. **All Logs** - View all application logs with latest first
2. **Errors & Warnings** - Filter for severity: error, fatal, warn
3. **Domain Events (Audit Trail)** - All event-driven domain events for compliance/audit
4. **Failed Background Jobs** - job.failed events from outboxPublisher, autoCheckoutJob, eventConsumer
5. **Backup Lifecycle Events** - Track backup.started, backup.succeeded, backup.failed
6. **User Actions (by User)** - Filter logs by user_id (update query for your user)
7. **Outbox Publishing Activity** - Outbox publisher logs and event publishing status
8. **Event Handler Performance** - Event handler execution logs

### Dashboards (5)

Pre-built visual dashboards for key insights:

1. **Event Timeline** - Real-time event volume and activity over last 24 hours
2. **Error Analysis** - Error severity breakdown, trends, and patterns over 7 days
3. **User Activity Breakdown** - Top users, event types, and activity timeline
4. **System Health & Performance** - Failed jobs, handler execution times, performance distribution
5. **Complete Audit Trail** - Full searchable record of all 34 domain event types

See [DASHBOARDS.md](./DASHBOARDS.md) for detailed guide on each dashboard.

## Setup Script

The `setup-kibana.sh` script automates:
1. Waits for Kibana to be ready (polls for 60 seconds)
2. Creates the `dogparkpals-logs-*` index pattern
3. Imports 8 pre-configured saved searches
4. Imports 5 sample dashboards with 8 visualizations

Run after Docker services are started:
```bash
bash kibana/setup-kibana.sh
```

## Manual Setup (if script fails)

### Create Index Pattern

1. Open http://localhost:5601
2. Go to **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter pattern: `dogparkpals-logs-*`
5. Select time field: `@timestamp`
6. Click **Create**

### View Logs

Go to **Discover** → select `dogparkpals-logs-*` index pattern

### Create Saved Search

1. In Discover, build your query
2. Click **Save** (top right)
3. Give it a name and description
4. Click **Save**

### Import Dashboards Manually

1. Go to **Stack Management** → **Saved Objects** → **Import**
2. Upload `kibana/dashboards.ndjson`
3. Click **Import**

## Useful Queries

Copy these into Kibana's query bar (KQL - Kibana Query Language):

```
# All errors
severity: error OR severity: fatal

# Specific event type
event_type: "event.created"

# Events by specific actor/user
actor_id: 123
user_id: 456

# Trace a specific request
trace_id: "abc123xyz"

# Show only domain events
context_type: event

# Outbox failures
log_message: "outbox" AND severity: error

# Job execution time > 100ms
duration_ms > 100
```

## Log Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| @timestamp | date | Event timestamp (UTC) |
| @severity / severity | keyword | Log level: debug, info, warn, error, fatal |
| message / log_message | text | Human-readable log message |
| service | keyword | Service name: backend |
| environment | keyword | Environment: docker, local |
| context_type | keyword | Log type: event, request, error |
| event_id | keyword | Domain event ID (UUID) |
| event_type | keyword | Domain event type (e.g., friend.request.sent) |
| actor_id | integer | User who triggered the event |
| user_id | integer | Affected user |
| dog_id | integer | Affected dog |
| park_id | integer | Affected park |
| organization_id | integer | Affected organization |
| trace_id | keyword | Request correlation ID |
| request_id | keyword | HTTP request ID |
| method | keyword | HTTP method (GET, POST, etc) |
| path | text | HTTP path |
| status_code | integer | HTTP response status |
| duration | float | Request/job duration in seconds |
| duration_ms | float | Duration in milliseconds |
| error.message | text | Error message |
| error.stack | text | Error stack trace |
| stack | text | Alternative error stack field |
| payload | object | Event-specific data |

## Monitoring with Kibana

### Real-time Activity
1. Go to **Dashboards** → **Event Timeline**
2. Watch real-time event stream
3. Compare with baseline for anomalies

### Performance Analysis
1. **Dashboards** → **System Health & Performance**
2. Review handler duration and failed jobs
3. Identify performance bottlenecks

### Error Tracking
1. **Dashboards** → **Error Analysis**
2. Filter by severity, service, or error type
3. View error trends over time

### Audit Trail
1. **Dashboards** → **Complete Audit Trail**
2. Filter by event_type, actor_id, or timestamp
3. Complete history of all system changes

## Troubleshooting

**No logs appearing?**
- Check Logstash is running: `docker compose logs logstash`
- Verify Elasticsearch has data: `curl http://localhost:9200/dogparkpals-logs-*/_count`
- Check index template: `bash elasticsearch/apply-template.sh`

**Index pattern not showing data?**
- May need to wait 30 seconds for first log to arrive
- Manually refresh index pattern: Stack Management → Index Patterns → Refresh

**Performance issues?**
- Reduce time range in Kibana
- Use more specific filters
- Archive old indices (older than 30 days)

**Dashboards not appearing after import?**
- Run setup script: `bash kibana/setup-kibana.sh`
- Refresh Kibana browser (Ctrl+R or Cmd+R)
- Check browser console for errors (F12 → Console tab)
