# PASO 7: Deployment Day Quick Reference

**Use this during active deployment**
**Print or keep at hand during Phases 1-5**

---

## Phase 1: Security Audit (2-3 hours)

### Quick Checklist
```
Authentication
□ JWT keys RSA-2048+      □ Rate limiting 5/5min
□ RS256 algorithm         □ MFA available (optional)
□ Token expiry 3600s      □ No hardcoded keys

RLS Policies
□ ideas: SELECT WHERE user_id = auth.uid()
□ blocks: Filter via idea_id (user's ideas only)
□ associations: Dual FK (both ideas user's)
□ audit_log: SELECT WHERE user_id = auth.uid()
□ Cross-user isolation verified

Sync Security
□ SyncEngine requires userId        □ PULL validates ownership
□ PUSH rejects cross-user data      □ Conflict resolution validated
□ Multi-device sync works           □ Multi-user isolation works

Data Safety
□ Soft deletes working         □ Audit log capturing changes
□ Recovery time < 30 min       □ Backup verified & tested

Encryption
□ TLS 1.2+              □ Database encryption enabled
□ Certs valid           □ Keys in secrets manager
□ HSTS header present   □ No sensitive data in logs

Status: [ ] PASS / [ ] FAIL
```

**If FAIL:** Do not proceed. Fix issues and re-audit.
**If PASS:** Proceed to Phase 2.

---

## Phase 2: Staging Deployment (2-3 hours)

### Setup
```bash
1. Create staging project in Supabase
2. Get credentials:
   STAGING_URL = ___________
   STAGING_ANON_KEY = ___________
   STAGING_SERVICE_KEY = ___________
3. Create .env.staging
```

### Deploy Schema & Indices
```bash
# Run in Supabase SQL Editor:
1. Copy entire supabase/rls-policies.sql → Run
2. Copy entire supabase/performance-indices.sql → Run
3. Verify: SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'
   → Should see 26+ indices
```

### Load Tests
```bash
# Run: npx ts-node scripts/load-test-staging.ts

Expected Results:
Test 1: 1000 ideas in <10s, Query <100ms
Test 2: 10k ideas created, Multi-user isolated
Test 3: >500 sync ops/sec

Status: [ ] PASS / [ ] FAIL
```

**If FAIL:** Fix issues in staging. Do not proceed.
**If PASS:** Proceed to Phase 3.

---

## Phase 3: Pre-Production (1-2 hours)

### Backup Production
```bash
BACKUP_NAME="production-$(date +%Y%m%d-%H%M%S).backup"

pg_dump "postgresql://..." \
  --file="backups/$BACKUP_NAME" \
  --format=custom

# Verify backup
pg_restore --list "backups/$BACKUP_NAME" | head -20

echo "Backup ready: backups/$BACKUP_NAME"
```

### Code Check
```bash
git log --oneline -1                    # Current commit
grep version package.json               # Version bumped?
npm run build                           # Build OK?
npm run test:ci                         # Tests pass? (>80%)
npm run test:ci -- --coverage           # Coverage?
```

### Team Readiness
```
□ DevOps Lead ready      □ Backend Lead ready
□ Frontend Lead ready    □ Support Lead ready
□ Product Manager ready  □ CEO/CTO ready

□ Procedures understood
□ Rollback tested
□ Communication ready
```

### Go/No-Go

```
All checks GREEN?

□ Database backup verified
□ Code tested & built
□ Team ready
□ Rollback tested
□ No blockers

DECISION:
[ ] ✅ GO TO PHASE 4 (Wave 1)
[ ] ❌ HOLD & REMEDIATE
```

**Expected Wave 1 Start:** ________________
**Expected Total Time:** ~4 hours (Wave 1-3)

---

## Phase 4: Production Rollout

### Critical Metrics (Monitor Continuously)

```
PRIMARY (CHECK EVERY 5 MIN):
┌─────────────────────────────────────────┐
│ ERROR RATE:          ___% (target <0.1%)│
│ P95 LATENCY:        ___ms (target <100) │
│ RLS VIOLATIONS:        ___ (target 0)   │
│ SUPPORT TICKETS:       ___ (target <5)  │
│ SYNC SUCCESS RATE:   ___% (target >99%) │
└─────────────────────────────────────────┘

SECONDARY (CHECK EVERY 15 MIN):
• DB CPU < 70%
• Connections < 200
• Memory stable
• No error patterns
```

### Wave 1: 10% Users (1 hour)

```
START TIME: ________________

Deploy → Wait 60 seconds → Check metrics

Status Checks (record actual values):
5 min:   Error: __% / Lat: __ms / RLS: __ / Support: __
10 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
15 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
30 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
60 min:  Error: __% / Lat: __ms / RLS: __ / Support: __

DECISION: [ ] PROCEED TO WAVE 2 / [ ] ROLLBACK
```

**If metrics bad:**
- Error rate > 0.1%? ROLLBACK
- RLS violations > 0? ROLLBACK IMMEDIATELY
- Support tickets > 3? Investigate
- Latency > 150ms? Investigate

### Wave 2: 50% Users (2 hours)

```
START TIME: ________________

Deploy to 50% → Check metrics

Status Checks:
5 min:   Error: __% / Lat: __ms / RLS: __ / Support: __
15 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
30 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
60 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
120 min: Error: __% / Lat: __ms / RLS: __ / Support: __

DECISION: [ ] PROCEED TO WAVE 3 / [ ] ROLLBACK
```

### Wave 3: 100% Users (30 minutes)

```
START TIME: ________________

Deploy to 100% → Intensive monitoring

Status Checks (every 1-2 min for 10 min, then every 5):
1 min:   Error: __% / Lat: __ms / RLS: __ / Support: __
5 min:   Error: __% / Lat: __ms / RLS: __ / Support: __
10 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
20 min:  Error: __% / Lat: __ms / RLS: __ / Support: __
30 min:  Error: __% / Lat: __ms / RLS: __ / Support: __

DECISION: [ ] ✅ DEPLOYMENT COMPLETE / [ ] ROLLBACK
```

**Expected Phase 4 End Time:** ______________

---

## Phase 5: Post-Deployment (24+ hours)

### Immediate (15 minutes after Wave 3 OK)
```
□ Declare deployment complete
□ Notify all stakeholders
□ Post status update
□ Store baseline metrics
□ Archive logs
```

### 24-Hour Continuous Monitoring

```
Every hour for 24 hours:
Hour 1:  Error: __% / Lat: __ms / RLS: __ / Tickets: __
Hour 2:  Error: __% / Lat: __ms / RLS: __ / Tickets: __
Hour 4:  Error: __% / Lat: __ms / RLS: __ / Tickets: __
Hour 8:  Error: __% / Lat: __ms / RLS: __ / Tickets: __
Hour 12: Error: __% / Lat: __ms / RLS: __ / Tickets: __
Hour 24: Error: __% / Lat: __ms / RLS: __ / Tickets: __

24-HOUR STATUS: [ ] ✅ STABLE / [ ] ISSUES FOUND
```

### Success Check

```
After 24 hours, verify all criteria:

□ Error rate < 0.1%    (actual: __%)
□ Latency < 100ms      (actual: __ms)
□ Zero RLS violations  (actual: __)
□ Sync success > 99%   (actual: _%)
□ Support < 10 tickets (actual: __)
□ No data loss         (confirmed)
□ Users happy          (spot check)

IF ALL GREEN:
✅ PRODUCTION DEPLOYMENT SUCCESSFUL

IF ANY RED:
⚠️  ESCALATE & INVESTIGATE
```

---

## Critical Issues During Deployment

### Issue: Error Rate Spike

```
IMMEDIATE ACTIONS:
1. Check error logs: grep ERROR /var/log/app.log
2. Look for pattern (auth? sync? data?)
3. Hit a breaking change?
4. Database slow?

RECOVERY:
< 0.5% → Monitor, may resolve
> 0.5% → Investigate before wave 2
> 1.0% → ROLLBACK immediately
```

### Issue: RLS Violation Detected

```
⚠️  CRITICAL - This is a security breach

IMMEDIATE:
1. STOP deployment immediately
2. ROLLBACK all changes
3. Do NOT continue
4. Escalate to CEO immediately

ACTION:
- Investigate root cause
- Fix security issue
- Re-test in staging
- New deployment attempt (after fix)
```

### Issue: Latency Spike

```
CHECK:
1. Database CPU? (target <70%)
2. Connections? (target <200)
3. Slow queries? (check query logs)
4. Memory leak? (check memory trend)

IF RESOLVES IN 5 MIN:
→ Continue monitoring

IF SUSTAINED:
→ Wave 1: Investigate
→ Wave 2+: Investigate, may need rollback
```

### Issue: Sync Queue Backup

```
CHECK:
1. Pending operations count
2. Error pattern in queue
3. Are they processing or stuck?

IF PROCESSING NORMALLY:
→ Continue monitoring, will catch up

IF STUCK:
→ Investigate sync engine
→ Check for 3-layer validation failures
→ May need rollback
```

---

## Emergency Rollback

```
If deployment fails and you need to rollback:

ROLLBACK PROCEDURE:
1. Identify rollback point (Which Wave? Before Wave 1?)
2. Revert to previous version tag
3. Restart application servers
4. Verify metrics return to green
5. Investigate root cause in staging
6. Fix issue
7. Schedule new deployment attempt

EXPECTED ROLLBACK TIME: < 15 minutes
DATA LOSS: 0 (all changes reversible)
```

---

## Contacts & Escalation

```
During Deployment - Call/Message Order:

Level 1 - Technical Lead: ________________
Level 2 - Backend Lead: ________________
Level 3 - DevOps Lead: ________________
Level 4 - Project Manager: ________________
Level 5 - CEO/CTO: ________________

If RLS Violation: ESCALATE TO CEO IMMEDIATELY
If Data Loss: ESCALATE TO CEO IMMEDIATELY
If Stuck Decision: Call CEO for go/no-go
```

---

## Key Phone Numbers & Comms

```
Slack #production-deployment: [Channel]
War Room Call: [Call Link]
Emergency Email: [Emergency contact]
```

---

## Post-Deployment Tasks

```
After 24-Hour Mark:

□ Celebrate successful deployment! 🎉
□ Thank deployment team
□ Schedule retrospective (1 week)
□ Document any issues found
□ Update runbooks with learnings
□ Plan optimization opportunities
□ Inform leadership of completion

7-Day Checkpoint:
□ Metrics still green? Yes/No
□ Any issues? ____________
□ Team status? ____________

30-Day Checkpoint:
□ System stable? Yes/No
□ Ready to scale further? Yes/No
```

---

## One-Page Metric Dashboard

```
╔════════════════════════════════════════════════════════╗
║           PRODUCTION DEPLOYMENT METRICS                 ║
╠════════════════════════════════════════════════════════╣
║ TIME: ________________  PHASE: [ ]1 [ ]2 [ ]3 [ ]4 [ ]5║
╠════════════════════════════════════════════════════════╣
║ ERROR RATE:          _______%    [🟢 OK / 🟡 WARN / 🔴 BAD] ║
║ LATENCY (P95):       ______ms    [🟢 OK / 🟡 WARN / 🔴 BAD] ║
║ RLS VIOLATIONS:      ______     [🟢 OK / 🟡 WARN / 🔴 BAD] ║
║ SUPPORT TICKETS:     ______     [🟢 OK / 🟡 WARN / 🔴 BAD] ║
║ SYNC SUCCESS:        ______%    [🟢 OK / 🟡 WARN / 🔴 BAD] ║
╠════════════════════════════════════════════════════════╣
║ OVERALL STATUS:     [🟢 GREEN / 🟡 YELLOW / 🔴 RED]       ║
║ DECISION:           [CONTINUE / PAUSE / ROLLBACK]      ║
╚════════════════════════════════════════════════════════╝
```

Print this and fill it in every 5 minutes!

---

## Remember

```
✅ You've been thoroughly prepared
✅ All security layers verified
✅ Staging deployment successful  
✅ Team trained on procedures
✅ Rollback is safe

❌ Ignore metrics at your peril
❌ Don't skip monitoring
❌ Don't ignore RLS violations
❌ Don't power through without deciding

🚀 This deployment is well-planned
🚀 Process is proven
🚀 Team is ready

Let's go! 🎯
```

---

**DEPLOYMENT DAY QUICK REFERENCE READY**
**Print, laminate, keep at hand during Phases 1-5**
