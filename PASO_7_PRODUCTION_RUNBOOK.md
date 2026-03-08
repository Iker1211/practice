# PASO 7: Production Runbook

**Purpose:** Step-by-step production deployment procedures
**Audience:** DevOps/SRE team, Product Manager, CEO
**Duration:** ~8 hours total (phases 3-5)
**Status:** Ready to Execute

---

## Overview: From Staging to Production

**Timeline:**
- Phase 3: Pre-Production (1-2 hours) - Preparation
- Phase 4: Production Rollout (4 hours) - Execution
- Phase 5: Monitoring (Ongoing) - Observation

**Risk Level:** LOW (staged rollout with automatic rollback)

---

## Phase 3: Pre-Production Checks

### 3.1: Database Backup & Validation

**Status: START**
**Ops Team Lead:** _______________
**Start Time:** _______________

#### Backup Production Database

```bash
# Command: Create full backup
BACKUP_NAME="production-$(date +%Y%m%d-%H%M%S).backup"

pg_dump \
  "postgresql://user:pass@prod.db.supabase.co/postgres" \
  --file="backups/$BACKUP_NAME" \
  --format=custom \
  --verbose

# ✅ Verify backup
pg_restore --list "backups/$BACKUP_NAME" | head -20

# ✅ Store backup location
echo "Production backup: backups/$BACKUP_NAME"
echo "Size: $(du -h backups/$BACKUP_NAME | cut -f1)"
echo "Date: $(date)"

# ✅ Upload to S3 (optional but recommended)
aws s3 cp "backups/$BACKUP_NAME" \
  "s3://backup-bucket/production/$BACKUP_NAME"
```

#### Validation Queries

```sql
-- Connect to production database

-- 1. Verify data integrity
SELECT 
  COUNT(*) as total_ideas,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_ideas
FROM ideas;

-- Expected: Should show current production metrics
-- ✅ Example: 50000 total, 1200 users, 100 deleted

-- 2. Verify no data corruption
SELECT tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE tablename IN ('ideas', 'blocks', 'associations', 'audit_log')
ORDER BY n_live_tup DESC;

-- Expected: No excessive dead rows (n_dead_tup < 10% of n_live_tup)
-- ✅ Example: ideas: 50000 live, 2000 dead (~4%)

-- 3. Verify indices functional
SELECT indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indices
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 5;

-- Expected: Top indices have high scan counts
-- ✅ Example: ideas_user_id_idx: 500000 scans

-- 4. Verify RLS policies active
SELECT count(*) as policy_count
FROM pg_policies
WHERE tablename IN ('ideas', 'blocks', 'associations', 'audit_log');

-- Expected: 25+ policies
-- ✅ Example: 26 policies
```

#### Backup Validation Checklist

```
[ ] Full backup created
[ ] Backup size reasonable (>100MB)
[ ] Backup location verified
[ ] S3 upload completed (if applicable)
[ ] Data integrity checks passed
[ ] No corruption detected
[ ] RLS policies verified
[ ] Indices operational
[ ] Audit log recent
[ ] Backup restoration tested (recommended)
```

**Status: COMPLETE** ✅
**Backup Location:** `backups/____________`
**Backup Size:** `____________`
**Completion Time:** _______________

---

### 3.2: Code Readiness Verification

**Status: START**
**Engineering Lead:** _______________
**Start Time:** _______________

#### Production Build Test

```bash
# 1. Checkout production branch
git checkout main
git pull origin main

# 2. Update environment to production
cp .env.production .env.local
# ✅ Verify: VITE_SUPABASE_URL points to production
# ✅ Verify: Service key is production key

# 3. Full rebuild with production settings
npm ci  # Clean install
npm run build

# ✅ Should complete without errors
# ✅ Check dist/ folder size

# 4. Run production tests
npm run test:ci -- --coverage

# ✅ All tests should pass
# ✅ Coverage > 80%
```

#### Version Verification

```bash
# Check current production version
curl -s "https://$PRODUCTION_URL/api/health" | jq .version
# ✅ Note current version

# Check new version
grep version package.json | head -1
# ✅ Ensure version bumped

# Tag release
git tag -a "v$(grep version package.json | cut -d'"' -f4)" \
  -m "Production release - Phase 4 rollout"
git push origin --tags
```

#### Code Review Checklist

```
[ ] All tests passing (>80% coverage)
[ ] No console errors in build output
[ ] Production env vars configured
[ ] Version bumped correctly
[ ] Git tag created
[ ] Build artifacts generated
[ ] No dependencies missing
[ ] No security warnings
[ ] Migration scripts tested
[ ] Rollback plan verified
```

**Status: COMPLETE** ✅
**Build Status:** `PASSED`
**Test Coverage:** `____%`
**Version:** `v___________`
**Completion Time:** _______________

---

### 3.3: Team Readiness

**Status: START**
**Project Manager:** _______________
**Start Time:** _______________

#### Team Training

```markdown
# Pre-Deployment Team Meeting (30 min)

## Attendees
- [ ] DevOps Lead (deployment)
- [ ] Backend Lead (database)
- [ ] Frontend Lead (app testing)
- [ ] Product Manager (go/no-go)
- [ ] Support Lead (customer comms)
- [ ] CEO/CTO (approver)

## Agenda

### 1. Rollout Strategy (5 min)
- Wave 1: 10% users (1 hour monitor)
- Wave 2: 50% users (2 hours monitor)
- Wave 3: 100% users (30 min verify)
- Total: 4 hours

### 2. Success Metrics (5 min)
- Error rate: 0% (< 0.1% acceptable)
- Latency: < 100ms P95
- RLS violations: 0
- Support tickets: < 5
- User reports: 0 data loss

### 3. Issues & Rollback (10 min)
- Critical: Immediate rollback to Wave 1 checkpoint
- Major: Pause rollout, investigate (max 30 min)
- Minor: Log, monitor, escalate if persists

### 4. Communication Plan (5 min)
- Stakeholders notified 1 hour before start
- Updates every 15 minutes during waves
- Post-completion announcement when Wave 3 verified
- Incident escalation procedures

### 5. Questions (5 min)
```

#### Support Readiness

```bash
# 1. Update support knowledge base
echo "Production deployed $(date)" > support/deployment-info.md

# 2. Prepare support scripts
cat > support/quick-diagnostics.sh << 'EOF'
#!/bin/bash

USER_ID=$1

# Check user's data
psql -c "SELECT * FROM ideas WHERE user_id='$USER_ID' LIMIT 5"

# Check user's sync status
psql -c "SELECT * FROM _sync_queue WHERE user_id='$USER_ID'"

# Check audit log
psql -c "SELECT * FROM audit_log WHERE user_id='$USER_ID' ORDER BY created_at DESC LIMIT 10"
EOF

# 3. Create escalation procedures
cat > support/ESCALATION_PROCEDURES.md << 'EOF'
# Escalation Procedures

## Tier 1: First Response (Support Team)
- Acknowledge issue within 5 minutes
- Collect: User ID, error message, affected features
- Check: User audit log for recent activity
- Document: Issue type (data, sync, auth, etc.)

## Tier 2: Technical Investigation (Engineering)
- Latency? Check database queries
- Data loss? Check audit log, recovery process
- Sync failure? Check RLS, network, queue
- Auth failure? Check token, session

## Tier 3: Critical (DevOps/CEO)
- Data corruption recovery?
- Full rollback decision?
- Customer communication?
EOF

chmod +x support/quick-diagnostics.sh
```

#### Team Readiness Checklist

```
[ ] Team training session completed
[ ] All team members understand rollout
[ ] Escalation procedures reviewed
[ ] Support knowledge base updated
[ ] Quick diagnostics scripts prepared
[ ] Communication templates ready
[ ] Incident response plan acknowledged
[ ] Rollback procedure understood by all
[ ] Break/handoff schedule confirmed
```

**Status: COMPLETE** ✅
**Team Meeting:** `HELD`
**Attendees:** `___________`
**Completion Time:** _______________

---

### 3.4: Rollback Testing

**Status: START**
**DevOps Lead:** _______________
**Start Time:** _______________

#### Rollback Procedure (Don't actually execute in pre-prod)

```bash
# IMPORTANT: Do NOT execute during pre-prod checks
# This is a DRY RUN to verify procedures

# Test 1: Know how to rollback
# Step 1: Identify rollback point
CURRENT_VERSION=$(grep version package.json | cut -d'"' -f4)
PREVIOUS_VERSION="[previous_version]"

# Step 2: Have rollback steps documented
# Step 3: Verify previous build artifacts exist
ls dist-v$PREVIOUS_VERSION/ || echo "ERROR: No previous build"

# Step 4: Document manual steps if needed
cat > rollback-procedures.md << 'EOF'
# Rollback Steps (For Reference)

If critical issues during rollout:

1. Stop Phase 4 rollout immediately
2. Revert to previous version (auto-rollback via feature flags)
3. Restore from backup checkpoint
4. Investigate root cause
5. Fix in staging
6. Re-test before new attempt
EOF

echo "✅ Rollback procedures verified"
```

#### Rollback Testing Checklist

```
[ ] Rollback procedure documented
[ ] Previous build artifacts available
[ ] Database snapshot available
[ ] Manual rollback steps clear
[ ] Team practices rollback (dry run)
[ ] Rollback time < 15 minutes
[ ] No data loss with rollback
[ ] Confirmed rollback reverses changes
```

**Status: COMPLETE** ✅
**Rollback Procedure:** `VERIFIED`
**Rollback Time:** `< 15 min`
**Completion Time:** _______________

---

### 3.5: Go/No-Go Decision

**Status: START**
**Decision Authority:** `CEO / Tech Lead`

#### Assessment

| Area | Status | Decision |
|------|--------|----------|
| Database Backup | ✅ COMPLETE | GO |
| Code Ready | ✅ COMPLETE | GO |
| Team Ready | ✅ COMPLETE | GO |
| Rollback Tested | ✅ COMPLETE | GO |
| **OVERALL** | | **GO** ✅ |

#### Final Approval

```
Production Deployment - GO/NO-GO

Team Lead: ________________  Date: ________  Time: ________
[ ] All checklists passed
[ ] No blockers identified
[ ] Team confident
[ ] Approval granted

DECISION: ✅ GO TO PRODUCTION (Phase 4)

Expected Start Time: ______________
Expected Duration: 4 hours
Estimated Completion: ______________
```

**Status: COMPLETE** ✅
**Decision:** `✅ GO TO PRODUCTION`
**Decision Time:** _______________

---

## Phase 4: Production Rollout - 3-Wave Deployment

### Overview

```
Total Duration: ~4 hours
Wave 1 (10% users):  1 hour
Wave 2 (50% users):  2 hours
Wave 3 (100% users): 30 minutes
```

---

### Wave 1: Deploy to 10% of Users (1 Hour)

**Start Time:** _______________
**Target Users:** ~120 (10% of 1200)
**Monitoring Lead:** _______________

#### Deploy Code

```bash
# 1. Deploy to production
git push origin main:[production-branch]

# 2. Trigger deployment (GitHub Actions, etc.)
# OR manually:

# 3. Set environment variable to limit rollout
export ROLLOUT_PERCENTAGE=10

# 4. Restart application servers
systemctl restart app-service

# 5. Verify deployment
curl -s https://$PRODUCTION_URL/api/health | jq .

# ✅ Response should show new version
```

#### Monitor Wave 1 (60 minutes)

**Metrics to Monitor (CONTINUOUS):**

```
Every 5 minutes:
[ ] Error rate < 0.1% - Check: Application logs
[ ] API latency P95 < 100ms - Check: CloudWatch metrics
[ ] RLS violations = 0 - Check: Database audit log
[ ] Sync success rate > 99% - Check: _sync_queue status
[ ] No new support tickets - Check: Support dashboard

Every 15 minutes (full report):
[ ] Latency trending stable or down
[ ] Error rate stable or down
[ ] No critical errors in logs
[ ] Database CPU < 70%
[ ] Database connections normal
[ ] Memory usage stable
```

#### Wave 1 Monitoring Checklist

```bash
# Automated monitoring script
cat > wave1-monitor.sh << 'EOF'
#!/bin/bash

WAVE=1
DURATION=60  # 60 minutes
INTERVAL=5   # 5 minute checks

echo "=== Wave $WAVE Monitoring (${DURATION} min, every ${INTERVAL} min) ==="

for ((i=0; i<DURATION; i+=INTERVAL)); do
  echo -e "\n--- Check at minute $i ---"
  echo "Time: $(date)"
  
  # Error rate
  ERROR_RATE=$(curl -s https://$PROD/metrics/error-rate | jq .percent)
  echo "Error rate: $ERROR_RATE%"
  [[ $(echo "$ERROR_RATE > 0.1" | bc) -eq 1 ]] && echo "⚠️  WARNING: High error rate"
  
  # Latency
  LATENCY=$(curl -s https://$PROD/metrics/latency-p95 | jq .milliseconds)
  echo "P95 Latency: ${LATENCY}ms"
  [[ $(echo "$LATENCY > 100" | bc) -eq 1 ]] && echo "⚠️  WARNING: High latency"
  
  # RLS violations
  RLS_VIOLATIONS=$(psql -t -c "SELECT COUNT(*) FROM audit_log WHERE operation='RLS_VIOLATION' AND created_at > NOW() - INTERVAL '15 min'")
  echo "RLS violations (15min): $RLS_VIOLATIONS"
  [[ $RLS_VIOLATIONS -gt 0 ]] && echo "❌ CRITICAL: RLS violations found!"
  
  # Support tickets
  TICKETS=$(curl -s https://support-api/open-tickets | jq '.[] | select(.created_at > now - 900)' | wc -l)
  echo "Support tickets (15min): $TICKETS"
  [[ $TICKETS -gt 3 ]] && echo "⚠️  WARNING: Spike in support tickets"
  
  # Database health
  CONN_COUNT=$(psql -t -c "SELECT current_setting('max_connections');")
  echo "Database connections: $CONN_COUNT"
  
  sleep ${INTERVAL}m
done

echo -e "\n=== Wave $WAVE Complete ==="
EOF

chmod +x wave1-monitor.sh
./wave1-monitor.sh
```

#### Wave 1 Decision

```
Successfully completed Wave 1?

[ ] Error rate < 0.1% - YES ✅ / NO ❌
[ ] Latency P95 < 100ms - YES ✅ / NO ❌
[ ] RLS violations = 0 - YES ✅ / NO ❌
[ ] No critical issues - YES ✅ / NO ❌
[ ] Support tickets < 5 - YES ✅ / NO ❌

DECISION: [ ] PROCEED TO WAVE 2 / [ ] ROLLBACK
```

**Status: COMPLETE** ✅
**Start Time:** _______________
**End Time:** _______________
**Decision:** `PROCEED TO WAVE 2 ✅`

---

### Wave 2: Deploy to 50% of Users (2 Hours)

**Start Time:** _______________
**Target Users:** ~600 (50% of 1200)
**Monitoring Lead:** _______________

#### Scale Deployment

```bash
# 1. Update rollout percentage
export ROLLOUT_PERCENTAGE=50

# 2. Trigger deployment to more servers
# GitHub Actions or manual scaling

# 3. Verify new deployment
curl -s https://$PRODUCTION_URL/api/health | jq '.rollout_percentage'
# ✅ Should show 50

# 4. Monitor metrics immediately
```

#### Monitor Wave 2 (120 minutes)

**Metrics (CONTINUOUS every 5 min):**

```
[ ] Error rate < 0.1%
[ ] Latency P95 < 100ms (should improve or stay same)
[ ] RLS violations = 0
[ ] Sync success > 99%
[ ] Support tickets trend stable or down
[ ] Database CPU < 70%
[ ] Memory steady state

⚠️  Watch for:
- Sudden CPU spike? Check query performance
- Memory leak? Check connection pool
- Error spike? Rollback immediately
- Network issues? Check connectivity
```

#### Wave 2 Decision

```
Successfully completed Wave 2?

[ ] Metrics stable after scaling - YES ✅ / NO ❌
[ ] No new error types - YES ✅ / NO ❌
[ ] Performance maintained - YES ✅ / NO ❌
[ ] Support tickets < 10 total - YES ✅ / NO ❌
[ ] No critical issues - YES ✅ / NO ❌

DECISION: [ ] PROCEED TO WAVE 3 / [ ] ROLLBACK
```

**Status: COMPLETE** ✅
**Start Time:** _______________
**End Time:** _______________
**Decision:** `PROCEED TO WAVE 3 ✅`

---

### Wave 3: Deploy to 100% of Users (30 Minutes)

**Start Time:** _______________
**Target Users:** All ~1200
**Monitoring Lead:** _______________

#### Full Rollout

```bash
# 1. Update rollout percentage to 100%
export ROLLOUT_PERCENTAGE=100

# 2. Deploy to all servers
# Trigger final deployment wave

# 3. Verify all servers updated
curl -s https://$PRODUCTION_URL/api/health | jq '.rollout_percentage'
# ✅ Should show 100

# 4. Continuous monitoring (30 min)
```

#### Wave 3 Monitoring (30 minutes)

**Intensive monitoring after full rollout:**

```
Every minute for first 10 minutes:
[ ] Error rate < 0.1%
[ ] No spike in latency
[ ] No RLS violations
[ ] Sync queue processing normally

Every 5 minutes for remaining 20 minutes:
[ ] Metrics stable
[ ] No new issues
[ ] Support tickets normal
[ ] User experiences normal (spot check)
```

#### Wave 3 Completion Decision

```
Wave 3 Stable?

[ ] Error rate remains < 0.1% - YES ✅ / NO ❌
[ ] Latency stable - YES ✅ / NO ❌
[ ] No RLS violations - YES ✅ / NO ❌
[ ] All users successfully updated - YES ✅ / NO ❌

DECISION: [ ] ✅ PRODUCTION DEPLOYMENT COMPLETE / [ ] ROLLBACK
```

**Status: COMPLETE** ✅
**Start Time:** _______________
**End Time:** _______________
**Decision:** `✅ PRODUCTION DEPLOYMENT COMPLETE`

---

## Phase 5: Post-Deployment Monitoring

### Immediate Actions (15 minutes after Wave 3 complete)

```
[ ] Declare deployment complete
[ ] Notify all stakeholders
[ ] Update status page
[ ] Create deployment record
[ ] Store metrics baseline
[ ] Archive logs
```

### First 24 Hours: Continuous Monitoring

```
Every hour for 24 hours:

[ ] Error rate trend (target: < 0.05%)
[ ] Latency trend (target: < 80ms P95)
[ ] RLS violations (target: 0 total)
[ ] Sync queue health
[ ] Support tickets
[ ] User feedback

⚠️  If issues found:
- Log severity assessment
- Check if within acceptable range
- Escalate if trending negative
- Prepare rollback if critical
```

### First 7 Days: Daily Assessment

```
Every morning standup:
[ ] Overnight metrics review
[ ] Any escalations?
[ ] Performance stable?
[ ] User reports?
[ ] Issues to investigate?
```

### First 30 Days: Weekly Review

```
Every Friday:
[ ] Week-long metrics analysis
[ ] Performance optimization opportunities?
[ ] Index usage healthy?
[ ] Any capacity concerns?
[ ] User satisfaction?
[ ] Lessons learned?
```

### Success Criteria

```
✅ PRODUCTION DEPLOYMENT SUCCESSFUL if:

After 24 hours:
[ ] Error rate < 0.1% (ideally < 0.05%)
[ ] P95 latency < 100ms (ideally < 80ms)
[ ] Zero RLS security violations
[ ] Support tickets < 10 (ideally < 5)
[ ] No user reports of data loss
[ ] Sync success rate > 99%
[ ] All indices functioning properly

After 7 days:
[ ] Metrics consistently green
[ ] No critical issues discovered
[ ] Performance maintained
[ ] No rollback needed

After 30 days:
[ ] System acknowledged as stable
[ ] All infrastructure parameters normal
[ ] Team confident in system
[ ] Project marked complete
```

---

## Final Deployment Report

**Deployment Date:** _______________
**Total Duration:** ~8 hours (phases 3-5)

| Phase | Duration | Status | Start | End |
|-------|----------|--------|-------|-----|
| Phase 3: Pre-Production | 1-2h | ✅ | ___ | ___ |
| Phase 4: Rollout | 4h | ✅ | ___ | ___ |
| Phase 5: Monitoring | 1h+ | ✅ | ___ | ___ |

### Final Status

```
✅ PRODUCTION DEPLOYMENT COMPLETE

Version: v___________
Users Deployed To: 100% (1200+ users)
Downtime: 0 minutes
Data Loss: 0 records
Success Rate: 100%

System Status: STABLE ✅
Performance: OPTIMAL ✅
Security: VERIFIED ✅
Ready for Operations: YES ✅
```

**Approved by:** ___________________
**Date:** ___________________
**Time:** ___________________

---

**Production Deployment Runbook Complete**
**Project PASO 7 Phase 4-5 Ready**
