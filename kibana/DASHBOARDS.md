# Kibana Dashboards for DogParkPals

Five comprehensive dashboards are pre-built to visualize your system's event-driven logging and monitoring data.

## 🎯 Dashboard Overview

### 1. Event Timeline
**Purpose:** Real-time visualization of all domain events across the system

**Time Range:** Last 24 hours (auto-refresh every 10 seconds)

**Panels:**
- **Events Over Time** - Stacked timeline showing event count by hour
  - Drill down on spikes to identify busy periods
  - Useful for understanding peak activity times

**Use Cases:**
- Monitor system event volume throughout the day
- Identify unexpected spikes in activity
- Verify event processing is working
- Track usage patterns by time of day

**Query Behind It:**
```
context_type: event
```

---

### 2. Error Analysis
**Purpose:** Understand error patterns and severity distribution

**Time Range:** Last 7 days (auto-refresh every 30 seconds)

**Panels:**
- **Errors by Severity** - Pie chart showing error/warn/fatal breakdown
- **Error Trends** - Area chart of errors over time by severity level
- **Error Timeline** - Time series of all errors with severity color coding

**Use Cases:**
- Identify error trends and patterns
- Prioritize issues by severity (fatal > error > warn)
- Detect error spikes indicating outages
- Track error resolution progress
- Compliance: Audit failure patterns
- Performance: Identify slow/problematic operations

**Quick Actions:**
- Click on a severity level in the pie chart to filter
- Hover over the timeline to see specific timestamps
- Click a time period to zoom in

**Query Behind It:**
```
severity: (error OR fatal OR warn)
```

---

### 3. User Activity Breakdown
**Purpose:** Analyze user behavior and event participation

**Time Range:** Last 7 days (auto-refresh every 30 seconds)

**Panels:**
- **Events by User** - Bar chart of top 15 most active users
- **Top Event Types** - Donut chart showing most common domain events
- **User Activity Timeline** - Line chart of user activity over time by 6-hour buckets

**Use Cases:**
- Identify power users and engagement patterns
- Track specific user's actions for support/debugging
- Understand which features are being used most
- Monitor for unusual user activity (security)
- Capacity planning: Who are your active users
- Debug issues for specific users

**Drill Down:**
- Click a user in the bar chart to filter all panels
- Click an event type in the donut to see which users trigger it
- Zoom timeline to specific days/times

**Query Behind It:**
```
context_type: event AND actor_id: *
```

---

### 4. System Health & Performance
**Purpose:** Monitor background jobs, handler performance, and system reliability

**Time Range:** Last 24 hours (auto-refresh every 10 seconds)

**Panels:**
- **Failed Background Jobs** - Count of failed jobs by job type
  - Tracks failures in: outboxPublisher, autoCheckoutJob, eventConsumer
- **Event Handler Performance (Avg)** - Average handler execution time in ms
- **Handler Performance Distribution** - Histogram of execution times
  - Shows if handlers have consistent performance or high variance

**Use Cases:**
- Monitor background job success/failure rates
- Identify slow event handlers
- Alert on handler performance degradation
- Capacity planning: Is handler performance keeping up?
- Compliance: Audit job execution history
- Debug: Identify handlers with outlier performance

**Key Metrics:**
- Red zone: Average handler time > 500ms (may indicate performance issue)
- Yellow zone: Average handler time 100-500ms (acceptable for async operations)
- Green zone: Average handler time < 100ms (excellent)

**Query Behind It:**
```
# Failed jobs:
event_type: job.failed

# Handler performance:
log_message: handler AND context_type: event AND duration_ms: *
```

---

### 5. Complete Audit Trail
**Purpose:** Immutable record of all system events for compliance and investigation

**Time Range:** Last 30 days (auto-refresh every 60 seconds)

**Display:**
- Full-featured Discover table showing all domain events
- Columns: timestamp, event_type, actor_id, user_id, dog_id, park_id, payload, severity
- Sortable, searchable, exportable

**Use Cases:**
- Compliance: Audit trail of all system changes
- Investigate: "What happened in the system at time X?"
- Security: Track all user actions
- Support: "Show me all actions for this user/dog/park"
- Debugging: Trace complete sequence of events
- Legal: Immutable record for disputes/issues

**Search Examples:**
```
# All actions by specific user
user_id: 42

# All events affecting a specific dog
dog_id: 123

# All failures in a specific park
park_id: 5 AND severity: error

# Friend request workflow (trace complete flow)
event_type: (friend.request.sent OR friend.request.accepted OR friend.request.rejected)

# Timeline of organization events
organization_id: 10 AND event_type: organization*

# Export to CSV
Click → Export → CSV (in Kibana UI)
```

**Export for Compliance:**
1. Search for events you need
2. Set time range appropriately
3. Click "Inspect" → "Share" → "Generate CSV link"
4. Download for audit records

---

## 🚀 Using the Dashboards

### Accessing Dashboards

1. Open Kibana: https://localhost:5601
2. Click **Menu** (☰) → **Dashboards**
3. Search: "dogparkpals"
4. Click dashboard name

### Dashboard Controls

**Time Range Selector** (Top Right):
- Default: Last 24h or Last 7d (per dashboard)
- Click to customize: Last hour, Last 4 hours, Last 7 days, etc.
- **Tip:** Use Last 24h for real-time monitoring; Last 7d for trends

**Refresh Rate** (Top Right):
- Default: 10-60 second auto-refresh (varies per dashboard)
- Click to adjust: Off, 5s, 10s, 30s, 1m, etc.
- **Tip:** Fast refresh for monitoring; slow refresh for trend analysis

**Search Bar** (Top):
- Add filters: `severity: error` or `user_id: 42`
- Save common filters for reuse

**Drill Down:**
- Click any chart element (bar, pie slice, line point) to filter
- Multiple filters combine with AND
- Remove filters by clicking the "X" next to each in the filter bar

### Exporting Data

**From any panel:**
1. Click the three dots (...) on the panel
2. **Inspect** → View underlying data
3. **Download** → CSV or raw JSON

**From entire dashboard (Kibana UI):**
1. Share icon (top right) → Generate report
2. Export as PDF or PNG

---

## 📊 Customizing Dashboards

### Add a Custom Panel

1. While viewing a dashboard, click **Edit** (top right)
2. Click **Add panel** → Select existing visualization, or
3. Create new visualization from Discover search
4. Arrange panels by dragging

### Create a New Dashboard

1. Go to **Dashboards** → **Create dashboard**
2. Click **Add panel** → Create visualization or select existing
3. Build your dashboard layout
4. Click **Save** and give it a name

### Example Custom Dashboard: "Outbox Publisher Health"

```
1. Panel: Failed outbox jobs (count by event)
2. Panel: Outbox publishing latency (duration over time)
3. Panel: Events waiting in outbox (search for unprocessed)
4. Panel: Batch size trends (events per publish cycle)
```

---

## 🔍 Troubleshooting

**Dashboard shows no data?**
- Check time range includes log data
- Verify events are flowing: Use Event Timeline dashboard and zoom to Last 1 hour
- Check logs exist in Elasticsearch: `ES_USER="$(grep '^ELASTICSEARCH_USERNAME=' docker-secrets | cut -d= -f2-)"; ES_PASS="$(grep '^ELASTICSEARCH_PASSWORD=' docker-secrets | cut -d= -f2-)"; curl -k -u "$ES_USER:$ES_PASS" https://localhost:9200/dogparkpals-logs-*/_count`

**Visualizations are slow?**
- Reduce time range
- Add more specific filters
- Close unused dashboard tabs (Kibana limitation)

**Handler performance shows 0ms?**
- Ensure `duration_ms` field is in logs
- Check Logstash pipeline is running: `docker compose logs logstash`
- Verify logger is sending duration field

**Can't find a dashboard?**
- Make sure setup script ran: `bash kibana/setup-kibana.sh`
- Refresh Kibana page (Cmd+R or Ctrl+R)
- Clear browser cache

---

## 📈 Monitoring Best Practices

### Daily Checks
1. Open **System Health & Performance** → Note any job failures
2. Open **Error Analysis** → Check for new error patterns
3. Open **Event Timeline** → Verify event volume is normal

### Weekly Reviews
1. **User Activity** → Track engagement trends
2. **Audit Trail** → Sample random events for audit compliance
3. **Error Trends** → Identify recurring issues for engineering

### Incident Response
1. Open **Complete Audit Trail** and search event/user/timestamp
2. Use **Error Analysis** to see when errors started/stopped
3. Use **System Health** to check if background jobs were affected
4. Export relevant events for investigation

---

## 🔗 Related Documentation

- [Kibana README](./README.md) - Setup and field reference
- [ELK Setup](../README.md#elk-stack) - System architecture
- [Event-Driven Logging](../LOGGING.md) - How events are captured
- [Logstash Config](../logstash/pipeline/dogparkpals.conf) - Data flow pipeline
