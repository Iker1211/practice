# PASO 7: Production Monitoring & Alerting

**Purpose:** Monitor production system stability and data integrity
**Audience:** DevOps, SRE, Backend Team, Product Team
**Status:** Ready to Deploy

---

## Monitoring Overview

After production deployment, continuous monitoring ensures:
- Zero data loss
- User experience stability
- Security integrity
- Performance optimization

**Monitoring Layers:**
1. Application metrics
2. Database health
3. Security monitoring
4. Sync queue health
5. User experience tracking

---

## 1. Application Metrics

### Key Metrics to Track

```typescript
// File: monitoring/app-metrics.ts

interface AppMetrics {
  // Request metrics
  requestsPerSecond: number
  errorRatePercent: number
  p95LatencyMs: number
  p99LatencyMs: number
  
  // Auth metrics
  loginSuccessRate: number
  tokenRefreshErrors: number
  sessionTimeoutEvicts: number
  
  // Sync metrics
  syncSuccessRate: number
  syncErrorRate: number
  averageSyncTimeMs: number
  queuedOperations: number
}
```

### Metrics Collection

```typescript
// Collect metrics every minute
import { createClient } from '@supabase/supabase-js'

const metricsCollector = setInterval(async () => {
  const metrics = {
    timestamp: new Date(),
    
    // Request latencies (from application logs)
    requestCount: await getRequestCount(),
    errorCount: await getErrorCount(),
    averageLatency: await getAverageLatency(),
    p95Latency: await getP95Latency(),
    
    // Auth metrics
    loginAttempts: await getLoginAttempts(),
    loginFailures: await getLoginFailures(),
    
    // Sync metrics
    queueSize: await db.query(
      'SELECT COUNT(*) FROM _sync_queue WHERE synced_at IS NULL'
    ),
    syncErrors: await db.query(
      'SELECT COUNT(*) FROM _sync_queue WHERE error_message IS NOT NULL'
    )
  }
  
  // Store metrics
  await storeMetrics(metrics)
  
  // Send to monitoring service
  await sendToMonitoring(metrics)
}, 60000) // Every minute
```

### Alerts: Application

```yaml
# alerts.yml

# Alert 1: High Error Rate
- alert_name: "HighErrorRate"
  condition: "error_rate_percent > 0.1"
  severity: "critical"
  action: "immediate_escalation"
  message: "Error rate {{ error_rate }}% exceeds 0.1% threshold"

# Alert 2: High Latency
- alert_name: "HighLatency"
  condition: "p95_latency_ms > 100"
  severity: "warning"
  action: "investigate"
  message: "P95 latency {{ latency }}ms exceeds 100ms"

# Alert 3: Sync Queue Backup
- alert_name: "SyncQueueBacklog"
  condition: "queued_operations > 1000"
  severity: "warning"
  action: "investigate"
  message: "Sync queue has {{ count }} pending operations"

# Alert 4: Login Failures
- alert_name: "LoginFailureSpike"
  condition: "login_failure_rate > 5"
  severity: "warning"
  action: "investigate"
  message: "Login failure spike: {{ rate }}% (last 5 min)"
```

---

## 2. Database Health Monitoring

### Database Queries

```sql
-- Run these queries every 5 minutes

-- Query 1: Connection health
SELECT 
  datname,
  count(*) as connections,
  max(extract(EPOCH FROM (now() - backend_start))) as oldest_connection_sec
FROM pg_stat_activity
WHERE datname = 'production'
GROUP BY datname;

-- ✅ Alert if: connections > 200 or oldest > 3600 (1 hour)


-- Query 2: Query performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- ✅ Alert if: Any query mean_time > 1000ms


-- Query 3: Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indices
ORDER BY pg_relation_size(indexrelid) DESC;

-- ✅ Alert if: Any performance index has idx_scan = 0


-- Query 4: Table bloat
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup,
  n_dead_tup,
  ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0))::int as dead_ratio
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ✅ Alert if: dead_ratio > 20% (indicates need for VACUUM)


-- Query 5: Slow queries log
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging >100ms
ORDER BY mean_time DESC
LIMIT 20;

-- ✅ Alert if: Any system query slow
```

### Monitoring Script

```bash
#!/bin/bash
# File: monitoring/database-health.sh

HEALTH_CHECK_INTERVAL=300  # 5 minutes

while true; do
  echo "=== Database Health Check - $(date) ==="
  
  # 1. Connection count
  CONN_COUNT=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='production'")
  echo "Connections: $CONN_COUNT"
  if [[ $CONN_COUNT -gt 200 ]]; then
    echo "⚠️  WARNING: High connection count"
    send_alert "HighConnectionCount" "CRITICAL" "$CONN_COUNT"
  fi
  
  # 2. Unused indices
  UNUSED=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_user_indexes WHERE idx_scan=0")
  if [[ $UNUSED -gt 0 ]]; then
    echo "⚠️  WARNING: $UNUSED unused indices found"
  fi
  
  # 3. Query performance
  SLOW_QUERIES=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_statements WHERE mean_time > 100")
  echo "Slow queries (>100ms): $SLOW_QUERIES"
  
  # 4. Table bloat
  BLOATED=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE n_dead_tup > (n_live_tup * 0.2)")
  if [[ $BLOATED -gt 0 ]]; then
    echo "⚠️  WARNING: $BLOATED tables over 20% bloat"
    send_alert "TableBloat" "WARNING" "$BLOATED"
  fi
  
  # 5. Disk space
  DISK_PCT=$(psql -t -c "SELECT pg_database_size('production') / 1024 / 1024 / 1024")
  echo "Database size: ${DISK_PCT}GB"
  
  sleep $HEALTH_CHECK_INTERVAL
done
```

### Alerts: Database

```yaml
# Database alerts

- alert_name: "HighConnectionCount"
  condition: "connections > 200"
  severity: "warning"
  action: "investigate_connections"

- alert_name: "HighQueryLatency"
  condition: "slow_queries > 5"
  severity: "warning"
  action: "profile_queries"

- alert_name: "TableBloat"
  condition: "bloated_tables > 0"
  severity: "info"
  action: "schedule_maintenance"

- alert_name: "DiskUsage"
  condition: "disk_usage_percent > 80"
  severity: "critical"
  action: "immediate_escalation"
```

---

## 3. Security Monitoring

### RLS Violation Detection

```sql
-- Run every 10 minutes

-- Detect RLS bypass attempts
SELECT * FROM audit_log
WHERE operation IN (
  'RLS_VIOLATION',
  'UNAUTHORIZED_ACCESS',
  'POLICY_BYPASS'
)
AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- ✅ Alert if: Any violations found (should be 0)

-- Detect cross-user data leaks
SELECT 
  user_id,
  COUNT(*) as access_attempts,
  COUNT(DISTINCT table_name) as tables_accessed
FROM audit_log
WHERE operation = 'SELECT'
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email LIKE '%@trusted.com'
  )
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;

-- ✅ Alert if: Any unusual access patterns
```

### Security Alerts

```typescript
// File: monitoring/security-alerts.ts

interface SecurityEvent {
  eventType: 'rls_violation' | 'auth_failure' | 'unusual_access'
  severity: 'critical' | 'high' | 'medium'
  userId: string
  details: string
  timestamp: Date
}

const monitorSecurity = async () => {
  // Check RLS violations
  const violations = await db.query(`
    SELECT * FROM audit_log 
    WHERE operation = 'RLS_VIOLATION'
    AND created_at > NOW() - INTERVAL '10 minutes'
  `)
  
  if (violations.length > 0) {
    for (const violation of violations) {
      await alertCritical({
        eventType: 'rls_violation',
        severity: 'critical',
        userId: violation.user_id,
        details: `RLS violation: ${violation.details}`
      })
    }
  }
}

// Run security checks every 10 minutes
setInterval(monitorSecurity, 600000)
```

### Alerts: Security

```yaml
- alert_name: "RLSViolation"
  condition: "rls_violations > 0"
  severity: "critical"
  action: "immediate_escalation_ceo"
  message: "⚠️  SECURITY: RLS violation detected!"

- alert_name: "UnauthorizedAccess"
  condition: "unauthorized_attempts > 10"
  severity: "critical"
  action: "immediate_escalation"

- alert_name: "AuthFailureSpike"
  condition: "auth_failures_5min > 20"
  severity: "high"
  action: "investigate"

- alert_name: "SuspiciousActivity"
  condition: "anomalous_access_pattern"
  severity: "high"
  action: "investigate"
```

---

## 4. Sync Queue Monitoring

### Queue Health

```sql
-- Every 5 minutes

-- Check queue size
SELECT 
  COUNT(*) as total_pending,
  COUNT(CASE WHEN error_message IS NULL THEN 1 END) as ready_to_sync,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed,
  MAX(created_at) as oldest_pending
FROM _sync_queue
WHERE synced_at IS NULL;

-- ✅ Expected:
-- - total_pending < 100 (processed quickly)
-- - ready_to_sync > failed * 10 (few errors)
-- - oldest_pending < 5 minutes


-- Check for stuck operations
SELECT 
  user_id,
  table_name,
  COUNT(*) as pending_count,
  MAX(created_at) as oldest_since
FROM _sync_queue
WHERE synced_at IS NULL
  AND created_at < NOW() - INTERVAL '10 minutes'
GROUP BY user_id, table_name
ORDER BY oldest_since DESC;

-- ✅ Alert if: Any operations pending > 30 min


-- Check error patterns
SELECT 
  table_name,
  error_message,
  COUNT(*) as error_count
FROM _sync_queue
WHERE error_message IS NOT NULL
  AND synced_at IS NULL
  AND updated_at > NOW() - INTERVAL '1 hour'
GROUP BY table_name, error_message
ORDER BY error_count DESC;

-- ✅ Alert if: Same error repeated > 10 times
```

### Sync Monitoring Script

```typescript
// File: monitoring/sync-queue-monitor.ts

interface SyncQueueMetrics {
  totalPending: number
  readyToSync: number
  failedOperations: number
  oldestPendingAge: number
  averageSyncTime: number
  successRate: number
}

const monitorSyncQueue = async () => {
  const metrics = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN error_message IS NULL THEN 1 END) as success,
      COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed,
      AVG(EXTRACT(EPOCH FROM (synced_at - created_at))) as avg_sync_time
    FROM _sync_queue
    WHERE synced_at IS NOT NULL
      AND created_at > NOW() - INTERVAL '1 hour'
  `)
  
  if (metrics[0]) {
    const m = metrics[0]
    const successRate = (m.success / m.total) * 100
    
    console.log(`Sync Queue Health:`)
    console.log(`  Total: ${m.total}`)
    console.log(`  Success: ${m.success}`)
    console.log(`  Failed: ${m.failed}`)
    console.log(`  Success Rate: ${successRate}%`)
    console.log(`  Avg Time: ${m.avg_sync_time}ms`)
    
    // Alert if success rate low
    if (successRate < 95) {
      await sendAlert(
        'SyncSuccessRateLow',
        'WARNING',
        `Success rate ${successRate}% below 95%`
      )
    }
  }
}

setInterval(monitorSyncQueue, 300000) // Every 5 minutes
```

### Alerts: Sync Queue

```yaml
- alert_name: "SyncQueueBacklog"
  condition: "pending_operations > 500"
  severity: "warning"
  action: "investigate_sync_engine"

- alert_name: "StuckSyncOperations"
  condition: "oldest_pending_age > 30_minutes"
  severity: "high"
  action: "manual_intervention"

- alert_name: "HighSyncErrorRate"
  condition: "error_rate > 5"
  severity: "warning"
  action: "investigate_errors"

- alert_name: "SyncSuccessRateLow"
  condition: "success_rate < 95"
  severity: "high"
  action: "escalate"
```

---

## 5. User Experience Monitoring

### Performance Monitoring

```typescript
// File: monitoring/ux-monitoring.ts

interface UserMetrics {
  appStartTime: number  // milliseconds
  firstDataFetch: number
  syncLatency: number
  offlineCapability: boolean
}

// Collect UX metrics from client
const collectUXMetrics = async () => {
  const metrics = {
    // App startup (target: < 2 seconds)
    appStartTime: performance.now() - navigationStart,
    
    // First data load (target: < 1 second)
    firstDataFetch: /* measure time to first ideas load */,
    
    // Sync latency (target: < 100ms)
    syncLatency: /* measure sync time */,
    
    // Offline mode works?
    offlineCapability: await testOfflineMode()
  }
  
  return metrics
}

// Send metrics to monitoring
const reportUXMetrics = async () => {
  const metrics = await collectUXMetrics()
  
  await fetch('/api/metrics/ux', {
    method: 'POST',
    body: JSON.stringify(metrics)
  })
}

// Report every 5 minutes during user session
setInterval(reportUXMetrics, 300000)
```

### User Error Tracking

```typescript
// Monitor for user-facing errors
window.addEventListener('error', async (event) => {
  await fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date(),
      url: window.location.href,
      userId: getCurrentUserId()
    })
  })
})

// Unhandled promise rejections
window.addEventListener('unhandledrejection', async (event) => {
  await fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Unhandled rejection',
      error: event.reason,
      timestamp: new Date(),
      userId: getCurrentUserId()
    })
  })
})
```

### Alerts: UX

```yaml
- alert_name: "AppStartTooSlow"
  condition: "app_start_time > 2000"
  severity: "info"
  message: "App startup {{ time }}ms (target <2s)"

- alert_name: "SyncTooSlow"
  condition: "sync_latency > 100"
  severity: "info"
  message: "Sync latency {{ time }}ms (target <100ms)"

- alert_name: "HighErrorCount"
  condition: "errors_per_minute > 10"
  severity: "warning"
  action: "investigate"

- alert_name: "OfflineModeFails"
  condition: "offline_mode_test_fails"
  severity: "high"
  action: "immediate_investigation"
```

---

## Monitoring Dashboard

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Production Monitoring",
    "panels": [
      {
        "title": "Error Rate (%)",
        "targets": [
          {
            "expr": "rate(application_errors_total[5m]) * 100"
          }
        ],
        "thresholds": [
          { "value": 0.1, "color": "red", "label": "CRITICAL" },
          { "value": 0.05, "color": "yellow", "label": "WARNING" }
        ]
      },
      {
        "title": "Latency P95 (ms)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, request_latency_ms)"
          }
        ],
        "thresholds": [
          { "value": 100, "color": "red" },
          { "value": 80, "color": "yellow" }
        ]
      },
      {
        "title": "RLS Violations",
        "targets": [
          {
            "expr": "increase(rls_violations_total[1h])"
          }
        ],
        "thresholds": [
          { "value": 1, "color": "red", "label": "Any violation is critical" }
        ]
      },
      {
        "title": "Sync Queue Size",
        "targets": [
          {
            "expr": "sync_queue_pending"
          }
        ],
        "thresholds": [
          { "value": 1000, "color": "red" },
          { "value": 100, "color": "yellow" }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ],
        "thresholds": [
          { "value": 200, "color": "red" },
          { "value": 150, "color": "yellow" }
        ]
      }
    ]
  }
}
```

---

## Alert Routing

### Escalation Policy

```yaml
Severity Routing:

CRITICAL (immediate)
  → SMS to on-call engineer
  → Slack #incidents (pinged)
  → PagerDuty trigger
  → CEO email

HIGH (within 30 min)
  → Slack #critical
  → Email to Backend Lead
  → Engineering standup when next

MEDIUM (within 2 hours)
  → Slack #alerts
  → Team review during standup

LOW (informational)
  → Slack #monitoring
  → Weekly metrics report
```

### Alert Examples

```
1. RLS Violation (CRITICAL)
   Time: 2024-01-15 14:32:00 UTC
   Title: RLS Violation Detected
   Severity: CRITICAL
   User ID: user-abc-123
   Event: Attempted to SELECT ideas owned by user-xyz-789
   Action: IMMEDIATE INVESTIGATION REQUIRED
   Escalation: CEO/CTO notified

2. High Latency (WARNING)
   Time: 2024-01-15 14:30:00 UTC
   Title: P95 Latency High
   Severity: WARNING
   Threshold: > 100ms
   Current: 145ms
   Action: Investigate slow queries
   
3. Sync Queue Backlog (WARNING)
   Time: 2024-01-15 14:25:00 UTC
   Title: Sync Queue Pending
   Severity: WARNING
   Pending: 250 operations
   Oldest: 5 minutes
   Action: Monitor, investigate if grows
```

---

## 24-Hour Monitoring Schedule

```
Hour 1-4 (Continuous):
- Every 1 min: Application metrics
- Every 5 min: Database health
- Every 10 min: Security checks
- Manual checks: Every 15 min (on-call watching)

Hour 5-24 (Reduced frequency):
- Every 5 min: Critical metrics
- Every 30 min: Full health check
- Every 60 min: Manual review
- Escalate if: Any threshold exceeded
```

---

## Success Criteria: End-to-End

### 24-Hour Stability

```
✅ SUCCESS if:
[ ] Error rate < 0.1% (ideally < 0.05%)
[ ] P95 latency < 100ms (ideally < 80ms)
[ ] Zero RLS violations
[ ] Sync success rate > 99%
[ ] Support tickets < 10
[ ] No data loss incidents
[ ] All users happy
```

### 7-Day Stability

```
✅ SUCCESS if:
[ ] All 24-hour criteria maintained
[ ] Performance consistent
[ ] No trending issues
[ ] No emergency rollbacks needed
```

### 30-Day Stability

```
✅ SUCCESS if:
[ ] All 7-day criteria maintained
[ ] System optimization opportunities identified
[ ] Team confident in operations
[ ] Deployment marked: COMPLETE & STABLE ✅
```

---

## Monitoring Handoff

**From:** DevOps Team (deployment)
**To:** Operations/SRE Team (ongoing)
**Date:** (Post-deployment date)

```
[ ] Monitoring dashboards configured
[ ] Alerts routed to ops team
[ ] Runbooks documented
[ ] Escalation procedures clear
[ ] Team trained on procedures
[ ] On-call rotation started
[ ] Documentation updated
```

---

**Production Monitoring Setup Complete**
**PASO 7 Ready for Phases 4-5 Execution**
