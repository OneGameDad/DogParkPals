# Kibana Setup for DogParkPals Logs

This directory contains configuration and scripts for setting up Kibana to display and search DogParkPals logs.

## Quick Start

After running `docker compose --env-file docker-secrets up -d`, setup Kibana with:

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

### Elasticsearch ILM Policy

Automatic log retention and archiving policy:
- **Hot Phase (0-1 day):** Active indexing, rollover at 50GB or 1 day
- **Warm Phase (1-7 days):** Read-only, reduced priority (no new writes)
- **Delete Phase (7-30 days):** Automatic deletion after 30 days

**Benefit:** Disk space is automatically reclaimed; logs don't accumulate indefinitely

To customize retention (e.g., keep logs for 90 days instead of 30):
```bash
# Edit elasticsearch/ilm-policy.json
# Change "min_age": "30d" to desired value in delete phase
bash elasticsearch/apply-template.sh  # Reapply policy
```

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

## Log Retention & Archiving

DogParkPals uses **Elasticsearch Index Lifecycle Management (ILM)** for automatic log retention and cleanup.

### Default Policy: `dogparkpals-logs-ilm`

| Phase | Age | Action | Details |
|-------|-----|--------|---------|
| Hot | 0-1d | Rollover | Split index when it reaches 50GB or 1 day old |
| Warm | 1-7d | Read-only | Mark as read-only (no new writes accepted) |
| Delete | 7-30d | Delete | Automatically delete old indices |

**Result:** Elasticsearch disk usage stays bounded; logs older than 30 days are automatically removed.

### How It Works

1. **Rollover:** When an index reaches 50GB or 1 day old, a new index is created
   - Old: `dogparkpals-logs-2026.02.01`
   - New: `dogparkpals-logs-2026.02.02`
   - Prevents huge indices, improves query performance

2. **Warm Phase:** After 7 days, indices become read-only
   - Can still search and query
   - Cannot add new documents
   - Lower disk I/O, can be moved to cheaper storage (future enhancement)

3. **Delete Phase:** After 30 days, indices are permanently deleted
   - Frees disk space
   - Older logs must be archived separately if needed for compliance

### Customizing Retention

**To keep logs for 90 days instead of 30:**

```bash
# 1. Edit the ILM policy
nano elasticsearch/ilm-policy.json

# Change this:
#   "delete": {
#     "min_age": "30d",

# To this:
#   "delete": {
#     "min_age": "90d",

# 2. Reapply the policy
bash elasticsearch/apply-template.sh

# 3. Verify it was applied
curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm
```

### Production Configuration

**For Production Deployments:**

```json
"hot": {
  "min_age": "0d",
  "actions": {
    "rollover": {
      "max_primary_shard_size": "100gb",  // Larger indices for production
      "max_age": "1d"
    }
  }
},
"warm": {
  "min_age": "7d"     // Keep searchable for 7 days
},
"delete": {
  "min_age": "90d"    // Keep for 90 days for compliance
}
```

### Monitoring ILM Status

**Check policy status:**
```bash
curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm | jq
```

**Check index lifecycle status:**
```bash
curl http://localhost:9200/dogparkpals-logs-*/_ilm/explain | jq '.indices'
```

**View indices and their phases:**
```bash
curl http://localhost:9200/_cat/custom?v&s=index&h=index,creation.date.string,ilm.managed,ilm.status,ilm.phase
```

### Disk Space Estimation

**Daily logs (estimated):**
- Small deployment: 50-200MB per day
- Medium deployment: 200MB-1GB per day
- Large deployment: 1-5GB per day

**Total disk needed (30-day retention):**
- Small: 1.5-6GB
- Medium: 6-30GB
- Large: 30-150GB

Adjust retention period based on disk availability and compliance requirements.

### Archiving Old Logs (Advanced)

For long-term archival beyond 30 days:

1. **Before deletion date, manually export:**
```bash
curl "http://localhost:9200/dogparkpals-logs-2025.12.01/_search?size=10000" \
  > dogparkpals-logs-2025-12-01.json
```

2. **Or use Elasticsearch Snapshots (enterprise):**
```bash
# Create snapshot repository
# Schedule automated snapshots
# Restore from S3/backup storage as needed
```

3. **Or modify ILM policy to use "cold" tier:**
```json
"cold": {
  "min_age": "30d",
  "actions": {
    "searchable_snapshot": { ... }
  }
}
```

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
