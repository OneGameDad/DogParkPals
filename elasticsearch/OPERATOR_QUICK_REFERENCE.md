# ELK Stack Operator Quick Reference

## Connection Notes

The current local Docker stack exposes Elasticsearch via plain HTTP without authentication.

```bash
# Use this form for Elasticsearch API calls in the current branch:
curl http://localhost:9200/_cluster/health
```

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
curl -X POST 'http://localhost:9200/dogparkpals-logs-*/_search' -H 'Content-Type: application/json' -d '{"query": {"term": {"severity": "error"}}}'

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

## Production Security Hardening

### Current State
The observability stack currently runs **without authentication or encryption**:
- ❌ Elasticsearch: No authentication, plain HTTP
- ❌ Kibana: No authentication
- ❌ Logstash: Plain HTTP to Elasticsearch
- ❌ Prometheus/Grafana: No authentication

### Security Checklist for Production

#### 1. Elasticsearch Security
```bash
# Enable X-Pack security in docker-compose.yml:
# environment:
#   - xpack.security.enabled=true
#   - ELASTIC_PASSWORD=<strong-password>

# Configure TLS for HTTP and node-to-node transport
# environment:
#   - xpack.security.http.ssl.enabled=true
#   - xpack.security.transport.ssl.enabled=true
#   - xpack.security.http.ssl.keystore.path=certs/elasticsearch.p12
#   - xpack.security.transport.ssl.keystore.path=certs/elasticsearch.p12
```

#### 2. Kibana Authentication
```bash
# Enable authentication in docker-compose.yml:
# environment:
#   - ELASTICSEARCH_USERNAME=kibana_system
#   - ELASTICSEARCH_PASSWORD=<strong-password>
#   - ELASTICSEARCH_SSL_CERTIFICATEAUTHORITIES=/usr/share/kibana/config/certs/ca.crt
```

#### 3. Logstash Credentials
```bash
# Use Elasticsearch API keys in logstash.conf:
# output {
#   elasticsearch {
#     api_key => "<api-key-id>:<api-key-secret>"
#     ssl => true
#     ssl_certificate_verification => true
#   }
# }
```

#### 4. Network Security
```bash
# Firewall Rules (example with ufw):
ufw allow 22/tcp          # SSH only
ufw allow 3000/tcp        # Backend API
ufw allow 3001/tcp        # Grafana
ufw allow 5173/tcp        # Frontend
ufw deny 9200/tcp         # Block Elasticsearch (internal only)
ufw deny 9300/tcp         # Block ES transport
ufw deny 5602/tcp         # Block Kibana (use reverse proxy)
ufw deny 9090/tcp         # Block Prometheus (use reverse proxy)
```

#### 5. Reverse Proxies
```bash
# Setup nginx reverse proxies for:
# - Kibana on :5602    → with authentication
# - Prometheus on :9090 → with basic auth
# - Elasticsearch :9200 → private/internal only
```

#### 6. Database Backups
```bash
# Regular snapshots with Elasticsearch:
# 1. Configure snapshot repository
# 2. Set up automated snapshot schedule
# 3. Test restore procedure monthly
# 4. Store backups off-server (S3, NAS, etc.)
```

#### 7. Monitoring & Alerting
```bash
# Enable alerts for:
# - Disk usage > 80%
# - Indexing failures
# - Authentication failures (watch logs)
# - Unassigned shards
# - High GC pauses
```

#### 8. Access Control
```bash
# Implement:
# - Role-based access control (RBAC) in Kibana
# - Separate read-only users for auditors
# - Admin-only users for modifications
# - All logins logged in Elasticsearch audit trail
```

#### 9. Audit Logging
```bash
# Enable in docker-compose.yml:
# environment:
#   - xpack.security.audit.enabled=true
#   - xpack.security.audit.logfile.enabled=true
```

#### 10. TLS Certificate Management
```bash
# Use proper certificates (not self-signed) from:
# - Let's Encrypt (free, automated renewal)
# - Commercial CA
# - Internal PKI infrastructure

# Monitor certificate expiration
```

### Estimated Implementation Time
- Basic (items 1-3): 2-4 hours
- Intermediate (items 4-6): 4-8 hours  
- Production-grade (items 7-10): 8-16 hours

### Risk Assessment

**Without Security:**
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Unauthorized log access | High | Critical | Enable authentication + TLS |
| Data breach | High | Critical | Network isolation + encryption |
| Log tampering | Medium | High | Audit logging + backups |
| DoS/resource exhaustion | Medium | High | Rate limiting + monitoring |
| Credential exposure | Low | Critical | Secrets management + rotation |

**With Production Security (all items complete):**
- ISO 27001 ready
- GDPR compliant (encryption + audit trail)
- SOC 2 Type II capable
- HIPAA ready (with extended retention)

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
- **Kibana:** http://localhost:5602
- **Cluster Health:** http://localhost:9200/_cluster/health
- **Node Stats:** http://localhost:9200/_nodes/stats
- **ILM Status:** http://localhost:9200/_ilm/status

## Documentation

- **Full ILM Guide:** [elasticsearch/ILM_GUIDE.md](./ILM_GUIDE.md)
- **Kibana Log Retention:** [../kibana/README.md](../kibana/README.md#log-retention--archiving)
- **Main README:** [../README.md](../README.md#centralized-logging-elk-stack)
- **Elasticsearch Docs:** https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html
