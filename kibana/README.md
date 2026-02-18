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

### Saved Searches

Pre-configured searches available in Kibana's Discover tab:

1. **All Logs** - View all application logs with latest first
2. **Errors & Warnings** - Filter for severity: error, fatal, warn
3. **Domain Events (Audit Trail)** - All event-driven domain events for compliance/audit
4. **Failed Background Jobs** - job.failed events from outboxPublisher, autoCheckoutJob, eventConsumer
5. **Backup Lifecycle Events** - Track backup.started, backup.succeeded, backup.failed
6. **User Actions (by User)** - Filter logs by user_id (update query for your user)
7. **Outbox Publishing Activity** - Outbox publisher logs and event publishing status
8. **Event Handler Performance** - Event handler execution logs

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
1. Go to **Discover** → **Domain Events (Audit Trail)**
2. Click the clock icon to set **Last 15 minutes**
3. Watch for new event-driven logs appearing in real-time

### Performance Analysis
1. Search: `event_handler_executions_total` in logs
2. Review handler duration histograms
3. Identify slow handlers causing issues

### Error Tracking
1. Use **Errors & Warnings** saved search
2. Drill down by severity, service, or handler
3. Group by error message to find patterns

### Audit Trail
1. Use **Domain Events** saved search
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
