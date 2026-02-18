# ELK Stack Operator Quick Reference

## Quick Commands

### Setup
```bash
# Initial setup (applies template + ILM + Kibana)
bash kibana/setup-kibana.sh

# Apply ILM policy only
bash elasticsearch/apply-template.sh

# Apply standalone
bash elasticsearch/apply-ilm.sh
```

### Check Status
```bash
# View ILM policy
curl http://localhost:9200/_ilm/policy/dogparkpals-logs-ilm

# Check index phases
curl http://localhost:9200/dogparkpals-logs-*/_ilm/explain?pretty

# List all indices with sizes
curl 'http://localhost:9200/_cat/indices?v&h=index,store.size,creation.date'

# Monitor disk usage
curl 'http://localhost:9200/_cat/nodes?v&h=name,disk.used,disk.total,disk.avail'
```

### Logs & Queries
```bash
# Count all logs
curl 'http://localhost:9200/dogparkpals-logs-*/_count'

# Find logs with errors
curl -X POST 'http://localhost:9200/dogparkpals-logs-*/_search' -d '{"query": {"term": {"severity": "error"}}}'

# Get last 10 logs
curl 'http://localhost:9200/dogparkpals-logs-*/_search?size=10&sort=@timestamp:desc'

# Export logs to JSON
curl 'http://localhost:9200/dogparkpals-logs-2026.02.18/_search?size=10000' > backup.json
```

### Maintenance
```bash
# Delete old indices (permanent!)
curl -X DELETE 'http://localhost:9200/dogparkpals-logs-2026.01.*'

# Force rollover now (don't wait for 1 day)
curl -X POST 'http://localhost:9200/dogparkpals-logs-write/_rollover'

# Close index (prevent new writes)
curl -X POST 'http://localhost:9200/dogparkpals-logs-2026.02.15/_close'

# Open index (allow writes again)
curl -X POST 'http://localhost:9200/dogparkpals-logs-2026.02.15/_open'
```

### Customization
```bash
# Edit retention (default: 30 days)
nano elasticsearch/ilm-policy.json
# Change: "min_age": "30d" to desired value
bash elasticsearch/apply-template.sh

# Edit rollover threshold (default: 50GB or 1 day)
nano elasticsearch/ilm-policy.json
# Change: "max_primary_shard_size": "50gb" to desired value
bash elasticsearch/apply-template.sh
```

## Monitoring Thresholds

| Metric | Alert | Critical |
|--------|-------|----------|
| Disk Usage | > 80% | > 95% |
| Indexing Latency | > 5s | > 30s |
| Query Performance | > 2s | > 5s |
| Index Count | > 50 | > 100 |
| Shard Count | > 200 | > 500 |

## Retention Presets

### Development (Fast Cleanup)
```json
"delete": { "min_age": "7d" }
```

### Production (Standard)
```json
"delete": { "min_age": "30d" }
```

### Compliance (Extended)
```json
"delete": { "min_age": "90d" }
```

### Healthcare (HIPAA)
```json
"delete": { "min_age": "2555d" }  // 7 years
```

## Disk Space Math

**Formula:** `(avg_daily_volume) × (retention_days) = total_disk_needed`

**Examples:**
- 200MB/day × 30 days = 6GB
- 500MB/day × 90 days = 45GB
- 2GB/day × 365 days = 730GB

**Kibana estimate:** Keep 10x available disk space for safety.

## Emergency Procedures

### Disk Full
```bash
# 1. Check current size
curl 'http://localhost:9200/_cat/nodes?v' | grep disk

# 2. List oldest indices
curl 'http://localhost:9200/_cat/indices?v&s=creation.date&h=index' | head

# 3. Delete oldest
curl -X DELETE 'http://localhost:9200/dogparkpals-logs-2025.12.*'

# 4. Re-check
curl 'http://localhost:9200/_cat/nodes?v' | grep disk
```

### Elasticsearch Unresponsive
```bash
# 1. Check cluster health
curl 'http://localhost:9200/_cluster/health'

# 2. Check if ILM is stuck
curl 'http://localhost:9200/dogparkpals-logs-*/_ilm/explain?pretty'

# 3. Check logs
docker compose logs elasticsearch

# 4. Restart if needed
docker compose restart elasticsearch
```

### Can't Find Logs
```bash
# 1. Check indices exist
curl 'http://localhost:9200/_cat/indices' | grep dogparkpals

# 2. Check index pattern in Kibana
# Stack Management → Index Patterns → dogparkpals-logs-*

# 3. Re-create if missing
bash kibana/setup-kibana.sh

# 4. Check Logstash is running
docker compose logs logstash
```

## Files Location

```
elasticsearch/
├── ilm-policy.json          # ILM policy definition (edit for customization)
├── index-template.json      # Index template (field mappings)
├── apply-template.sh        # Apply template + ILM
├── apply-ilm.sh            # Apply ILM standalone
└── ILM_GUIDE.md            # Full documentation

kibana/
├── setup-kibana.sh         # Full setup (template + ILM + Kibana)
├── README.md               # Kibana usage
└── DASHBOARDS.md           # Dashboard guide
```

## Helpful URLs

- **Elasticsearch:** http://localhost:9200
- **Kibana:** http://localhost:5601
- **Cluster Health:** http://localhost:9200/_cluster/health
- **Node Stats:** http://localhost:9200/_nodes/stats
- **ILM Status:** http://localhost:9200/_ilm/status

## Documentation

- **Full ILM Guide:** [elasticsearch/ILM_GUIDE.md](./ILM_GUIDE.md)
- **Kibana Log Retention:** [../kibana/README.md](../kibana/README.md#log-retention--archiving)
- **Main README:** [../README.md](../README.md#centralized-logging-elk-stack)
- **Elasticsearch Docs:** https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html
