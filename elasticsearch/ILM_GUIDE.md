# Elasticsearch Index Lifecycle Management (ILM) Guide

This guide explains DogParkPals's automatic log retention and disk management using Elasticsearch Index Lifecycle Management (ILM).

## Connection Notes

The current local Docker stack runs Elasticsearch over plain HTTP without authentication.

For the default local stack, use plain HTTP examples like the following:

```bash
# Example pattern used throughout this guide:
curl http://localhost:9200/_cluster/health
```

## Quick Reference

**Default Policy: `dogparkpals-logs-ilm`**
- **Hot Phase:** 0-1 day - Active indexing, rollover at 50GB or 1 day
- **Warm Phase:** 1-7 days - Read-only, reduced priority
- **Delete Phase:** 30 days - Automatic deletion

**Result:** Elasticsearch disk automatically reclaims space; logs don't accumulate indefinitely.

---

## How ILM Works

### Phase 1: Hot (0-1 day)
**Purpose:** Active indexing for new logs

**Actions:**
- **Rollover:** Creates a new index when current index:
  - Reaches 50GB in size, OR
  - Is 1 day old
  - (whichever occurs first)

**Example Timeline:**
```
2026-02-18: dogparkpals-logs-2026.02.18 created
           → Logs flow in from Logstash
           → Reaches 45GB after 18 hours
2026-02-19: dogparkpals-logs-2026.02.19 created (rollover)
           → old index moves to warm phase
           → new index receives logs
```

**Why Rollover?**
- Prevents huge 500GB+ indices that are slow to query
- Allows deletion of old indices without affecting current logs
- Improves search performance (smaller indices = faster searches)

### Phase 2: Warm (1-7 days after creation)
**Purpose:** Archive and preserve old logs

**Actions:**
- **Read-Only:** Index is marked read-only
  - No new documents can be added
  - Existing documents can still be searched
  - Optimized for storage efficiency

**Use Cases:**
- Keep logs searchable for week-long investigations
- Comply with 7-day audit trail requirements
- Investigate historical issues without affecting current indexing

**Performance:**
- Read performance: Same as hot (fully queryable)
- Write performance: N/A (read-only)
- Disk I/O: Reduced

### Phase 3: Delete (30+ days after creation)
**Purpose:** Automatic cleanup

**Actions:**
- **Delete:** Index is permanently removed
  - Frees disk space immediately
  - Old logs no longer searchable
  - Cannot be recovered (unless backed up)

**Before Deletion:**
Consider backing up logs older than 30 days if your compliance requirements demand long-term archival.

---

## Operations

### Checking Policy Status

**View ILM policy definition:**
```bash
curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm | jq
```

**Check which phase each index is in:**
```bash
curl http://localhost:9200/dogparkpals-logs-*/_ilm/explain | jq '.indices | to_entries[] | {key, value.phase}'
```

**Pretty view of all indices and their status:**
```bash
curl -s 'http://localhost:9200/_cat/indices?format=json' | jq '.[] | select(.index | startswith("dogparkpals")) | {index, health, status, pri, rep, store_size: .["store.size"]}'
```

### Reapplying ILM Policy

**After editing `elasticsearch/ilm-policy.json`:**
```bash
bash elasticsearch/apply-template.sh
```

This reapplies both the template and ILM policy. Existing indices will follow the new policy (with some delay):
- New rollover rules apply immediately
- Timing shifts may occur (indices might move to warm phase sooner/later)
- Existing indices in warm/cold phase won't change (only new indices are affected)

### Customizing Retention

**Change retention from 30 to 90 days:**

1. Edit the policy:
```bash
nano elasticsearch/ilm-policy.json
```

2. Find the delete phase:
```json
"delete": {
  "min_age": "30d",
  "actions": {
    "delete": {}
  }
}
```

3. Change to:
```json
"delete": {
  "min_age": "90d",
  "actions": {
    "delete": {}
  }
}
```

4. Reapply:
```bash
bash elasticsearch/apply-template.sh
```

5. Verify:
```bash
curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm | jq '.policy.phases.delete'
```

### Changing Rollover Thresholds

**Increase rollover size for production (fewer, larger indices):**

Current (development):
```json
"rollover": {
  "max_primary_shard_size": "50gb",
  "max_age": "1d"
}
```

Production:
```json
"rollover": {
  "max_primary_shard_size": "100gb",  // Larger files
  "max_age": "1d"
}
```

Or switch to time-based rollover only:
```json
"rollover": {
  "max_age": "1d"  // Always rollover once per day
}
```

### Moving Indices Between Phases (Manual)

**Force an index to warm phase (stop accepting writes):**
```bash
curl -X POST "http://localhost:9200/dogparkpals-logs-2026.02.15/_close"
# Then manually set its ILM phase
```

**Delete an index immediately (don't wait for ILM):**
```bash
curl -X DELETE "http://localhost:9200/dogparkpals-logs-2026.02.01"
```

**Caution:** Manual operations bypass ILM safety checks. Use only when necessary.

---

## Disk Space Management

### Estimating Disk Usage

**Log volume examples (per day):**
- Small app: 50-200MB
- Medium app: 200MB-1GB
- Large app: 1-5GB
- Very large: 5GB+

**Total disk with 30-day retention:**
- Small: 1.5-6GB
- Medium: 6-30GB
- Large: 30-150GB

**DogParkPals typical (medium):** 5-10GB for 30 days

### Monitoring Disk Usage

**Check Elasticsearch disk usage:**
```bash
curl -s 'http://localhost:9200/_cat/nodes?v&h=name,disk.used,disk.total,disk.avail' | column -t
```

**Check by index:**
```bash
curl -s 'http://localhost:9200/_cat/indices?v&h=index,store.size' | grep dogparkpals
```

**Set Elasticsearch disk threshold warning (80%):**
```bash
curl -X PUT "http://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d '{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "80%",
    "cluster.routing.allocation.disk.watermark.high": "90%"
  }
}'
```

### Freeing Disk Space Immediately

**Delete all logs older than 60 days:**
```bash
# WARNING: This is permanent and cannot be undone
curl -X DELETE "http://localhost:9200/dogparkpals-logs-2025-12-*"
curl -X DELETE "http://localhost:9200/dogparkpals-logs-2025-11-*"
```

**Or reduce retention period:**
```bash
# Edit ilm-policy.json, change min_age to "14d" instead of "30d"
bash elasticsearch/apply-template.sh
```

---

## Advanced Topics

### Adding Cold Tier (Enterprise Feature)

For production deployments with tiered storage:

```json
"cold": {
  "min_age": "30d",
  "actions": {
    "set_priority": {
      "priority": 0
    },
    "searchable_snapshot": {
      "snapshot_repository": "cold-storage"
    }
  }
}
```

Requires:
1. Snapshot repository configured to S3/GCS
2. Cold-tier nodes available
3. Enterprise Elasticsearch license

### Adding Frozen Tier (Long-term Archive)

```json
"frozen": {
  "min_age": "90d",
  "actions": {
    "searchable_snapshot": {
      "snapshot_repository": "archive-repo"
    }
  }
}
```

Logs are compressed and stored in object storage; searchable but slow.

### Using Index Patterns for Different Retention

Different applications, different retention:

```json
// In policy for dogparkpals-audit-*:
"delete": {
  "min_age": "365d"  // Keep audit logs 1 year
}

// In policy for dogparkpals-debug-*:
"delete": {
  "min_age": "7d"    // Keep debug logs 1 week
}
```

Apply different policies to different index patterns.

### Retention vs. Compliance

**GDPR (EU):** Max 30 days personal data (default fits)
**HIPAA (US):** Min 6 years medical logs (need custom policy)
**SOC 2:** Typically 1 year audit trail (change to 365d)
**PCI-DSS:** 1 year cardholder logs (change to 365d)

Always verify your jurisdiction's requirements before deploying to production.

---

## Troubleshooting

### "Policy not being applied"

**Check if ILM is enabled:**
```bash
curl -s http://localhost:9200/_cluster/settings | jq '.persistent | select(. != {})'
```

**Enable ILM manually:**
```bash
curl -X PUT "http://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d '{
  "persistent": {
    "xpack.ilm.enabled": true
  }
}'
```

### "Index stuck in hot phase"

**Check index settings:**
```bash
curl -s 'http://localhost:9200/dogparkpals-logs-2026.02.18/_settings?pretty' | jq '.[] | .settings.index.lifecycle'
```

**Manually move to warm:**
```bash
curl -X POST "http://localhost:9200/dogparkpals-logs-2026.02.18/_ilm/move-to-step" -H 'Content-Type: application/json' -d '{
  "current_step": {
    "phase": "hot",
    "action": "rollover"
  },
  "next_step": {
    "phase": "warm",
    "action": "set_priority"
  }
}'
```

### "Disk space running out"

1. **Check usage:**
```bash
curl -s 'http://localhost:9200/_cat/nodes?v' | grep disk
```

2. **Check oldest index:**
```bash
curl -s 'http://localhost:9200/_cat/indices?v&s=creation.date&h=creation.date,index' | head -5
```

3. **Delete old indices:**
```bash
curl -X DELETE "http://localhost:9200/dogparkpals-logs-2026.01.*"
```

4. **Or reduce retention to 14 days:**
```bash
# Edit elasticsearch/ilm-policy.json
# Change delete phase min_age to "14d"
bash elasticsearch/apply-template.sh
```

### "Indices keep growing past threshold"

**Check rollover settings:**
```bash
curl -s 'http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm' | jq '.policy.phases.hot.actions.rollover'
```

**Currently set to:**
- Rollover at 50GB, OR
- After 1 day

If logs exceed 50GB/day, increase threshold:
```json
"max_primary_shard_size": "100gb"  // Increase if needed
```

---

## Deployment Checklist

- [ ] ILM policy applied: `bash elasticsearch/apply-template.sh`
- [ ] Policy verified: `curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm`
- [ ] Disk capacity calculated based on daily volume
- [ ] Retention period matches compliance requirements
- [ ] Alerting configured for disk usage > 80%
- [ ] Backup procedure documented (if needed for > 30 days)
- [ ] Runbook created for disk space incidents
- [ ] Team trained on how to query/delete logs

---

## References

- [Elasticsearch ILM Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [DogParkPals README - ELK Stack](../README.md#centralized-logging-elk-stack)
- [Kibana Log Retention](../kibana/README.md#log-retention--archiving)
