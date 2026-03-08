# PASO 7: Production Security Audit

**Phase:** Phase 1 of PASO 7
**Duration:** 2-3 hours
**Objective:** Review all security layers before production
**Status:** Ready to Execute

---

## Security Audit Overview

All 5 security layers must be verified before production:

1. **Authentication** - Supabase JWT / Session management
2. **RLS Policies** - PostgreSQL row-level security
3. **Sync Security** - userId validation in SyncEngine
4. **Data Safety** - Soft deletes, audit log, recovery
5. **Encryption** - Transport layer & at-rest encryption

---

## Layer 1: Authentication Audit

### JWT Configuration

```bash
# Check JWT settings in Supabase
curl -s "https://$JWT_AUTH_URL/.well-known/jwks.json" | jq .

# Should show:
# - Multiple key IDs
# - 2048-bit RSA keys minimum
# - Current key ID in metadata

# ✅ Audit Pass Criteria:
# - Keys are RSA-2048 or stronger
# - Keys rotated regularly
# - Algorithm is RS256
```

### Token Expiry & Refresh

```typescript
// Test token refresh flow
import { createClient } from '@supabase/supabase-js'

const client = createClient(url, key)
const { data, error } = await client.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test123',
})

const session = data.session
console.log('Access token expires in:', session?.expires_in, 'seconds')
// ✅ Should be 3600 (1 hour) or similar reasonable value

// ✅ Audit Pass Criteria:
// - Access token: 3600 seconds (1 hour)
// - Refresh token: 7200 seconds or longer
// - Tokens rotate on refresh
```

### Password Security

```bash
# Check password requirements in Supabase
# Expected:
# - Minimum 6 characters (configurable, recommend 12+)
# - No complexity requirements (NIST guidance)
# - Password reset via email
# - Rate limiting on login attempts

# ✅ Audit Pass Criteria:
# - At least 8 character minimum
# - Rate limiting configured (max 5 attempts/5 min)
# - Password reset via secure email
# - No plaintext passwords in logs
```

### Session Management

```typescript
// Test session persistence & logout
import { createClient } from '@supabase/supabase-js'

const client = createClient(url, key)

// Test 1: Session persists after refresh
await client.auth.refreshSession()
const { data: { user } } = await client.auth.getUser()
console.log(user ? 'Session active' : 'Session lost')
// ✅ Should show session active

// Test 2: Logout clears session
await client.auth.signOut()
const { data: { user: afterLogout } } = await client.auth.getUser()
console.log(afterLogout ? 'ERROR: User still logged in' : 'Logout OK')
// ✅ Should show logout OK

// ✅ Audit Pass Criteria:
// - Sessions persist across tab close/open
// - Sessions expire after inactivity (30 min recommended)
// - Logout clears all tokens
// - No residual auth data in localStorage
```

### MFA (Multi-Factor Auth)

```bash
# Check if MFA can be enabled
# Expected: Optional MFA via TOTP
# - User chooses to enable
# - Backup codes provided
# - Recovery codes stored securely

# ✅ Audit Pass Criteria:
# - MFA available for users
# - TOTP implementation standard
# - Backup codes provided
# - Recovery procedure documented
```

### Audit Checklist: Authentication

```
[ ] JWT keys RSA-2048 or stronger
[ ] Keys rotated on schedule
[ ] Algorithm is RS256
[ ] Access token expiry 3600 seconds
[ ] Refresh token expiry appropriate
[ ] Tokens rotate on refresh
[ ] Rate limiting on login (max 5/5min)
[ ] Password minimum 8 characters
[ ] Logout clears tokens
[ ] Session persists appropriately
[ ] MFA available
[ ] No auth data in logs
[ ] HTTPS enforced
```

---

## Layer 2: RLS Policies Audit

### Policy Verification

```sql
-- Check all 4 tables have RLS enabled
SELECT tablename, current_setting('rls_enabled') as rls_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND tablename IN ('ideas', 'blocks', 'associations', 'audit_log');

-- Expected output: All tables should show rls_enabled = on
```

### Ideas Table Policies

```sql
-- Check ideas table policies
SELECT * FROM pg_policies WHERE tablename = 'ideas';

-- Expected: 4 policies
-- - ideas_select_policy: SELECT WHERE user_id = auth.uid()
-- - ideas_insert_policy: INSERT WHERE user_id = auth.uid()
-- - ideas_update_policy: UPDATE WHERE user_id = auth.uid()
-- - ideas_delete_policy: DELETE WHERE user_id = auth.uid()

-- ✅ Audit: Run as User A, verify only User A's ideas visible
```

### Blocks Table Policies (FK-based)

```sql
-- Check blocks policies
SELECT * FROM pg_policies WHERE tablename = 'blocks';

-- Expected: 4 policies filtering via idea_id
-- - blocks_select_policy: blocks for user's ideas only
-- - blocks_insert_policy: can create blocks for own ideas
-- - blocks_update_policy: can update own idea's blocks
-- - blocks_delete_policy: can delete own idea's blocks

-- ✅ Audit: Try to select block from other user's idea
-- Expected: Permission denied
```

### Associations Table Policies (Dual FK)

```sql
-- Check associations policies
SELECT * FROM pg_policies WHERE tablename = 'associations';

-- Expected: 4 policies filtering via BOTH idea_ids
-- - associations_select_policy: both ideas owned by user
-- - associations_insert_policy: can create between own ideas
-- - associations_update_policy: can update own associations
-- - associations_delete_policy: can delete own associations

-- ✅ Audit: Try to create association between user's idea and other user's idea
-- Expected: Permission denied
```

### Audit Log Policies

```sql
-- Check audit_log policies
SELECT * FROM pg_policies WHERE tablename = 'audit_log';

-- Expected: 1 policy
-- - audit_log_select_policy: user can only see own audit log

-- ✅ Audit: Run as User A, verify only User A's audit entries visible
```

### Cross-User Isolation Test

```sql
-- Begin as User A
SET ROLE user_a;

-- Create test idea
INSERT INTO ideas (id, title, user_id) 
VALUES ('test-idea-1', 'User A Idea', auth.uid());

-- Try to see all ideas (should fail or be filtered)
SELECT COUNT(*) FROM ideas;  -- Should see only 1

-- Try to spoof another user
INSERT INTO ideas (id, title, user_id)
VALUES ('test-idea-2', 'Fake User B Idea', 'user-b-uuid');
-- ✅ Expected: Permission denied (RLS blocks this)

-- Try to update User B's idea (should fail)
UPDATE ideas SET title = 'Hacked' WHERE user_id = 'user-b-uuid';
-- ✅ Expected: 0 rows updated (RLS blocks this)
```

### Audit Checklist: RLS Policies

```
[ ] RLS enabled on all 4 tables
[ ] ideas: 4 policies (select/insert/update/delete)
[ ] blocks: 4 FK-based policies
[ ] associations: 4 dual-FK policies
[ ] audit_log: 1 select policy
[ ] Cross-user isolation verified
[ ] Cannot spoof user_id
[ ] Cannot update other user's data
[ ] Cannot delete other user's data
[ ] Soft deletes hidden from RLS
[ ] All users in production can read own data
[ ] No data leaks via audit log
```

---

## Layer 3: Sync Security Audit

### userId Validation

```typescript
// Test 1: SyncEngine requires userId
import { SyncEngine } from '@monorepo/lib'

try {
  new SyncEngine(localDb, remoteDb, null as any)  // Missing userId
  console.error('FAIL: Should throw error')
} catch (error) {
  if (error.message.includes('SyncEngine requires a valid userId')) {
    console.log('✅ PASS: userId validation works')
  }
}
```

### PUSH Layer Validation

```typescript
// Test 2: PUSH rejects cross-user data
const syncEngine = new SyncEngine(localDb, remoteDb, 'user-a-uuid')

try {
  // Try to sync data with wrong user_id
  await syncEngine.pushItem({
    id: 'item-1',
    tableName: 'ideas',
    operation: 'INSERT',
    recordId: 'idea-1',
    data: { id: 'idea-1', user_id: 'user-b-uuid' },  // Wrong user!
    createdAt: new Date().toISOString(),
    retryCount: 0
  })
  console.error('FAIL: Should throw security error')
} catch (error) {
  if (error.message.includes('Security validation failed')) {
    console.log('✅ PASS: PUSH validation rejects cross-user data')
  }
}
```

### PULL Layer Validation

```typescript
// Test 3: PULL detects RLS failures
// Simulate RLS failure by getting wrong user's data
// (In production, this shouldn't happen if RLS works)

const pulledData = [
  { id: 'idea-1', user_id: 'user-b-uuid' }  // Wrong user!
]

try {
  await syncEngine.validateRecordOwnershipAfterPull('ideas', pulledData[0])
  console.error('FAIL: Should throw critical error')
} catch (error) {
  if (error.message.includes('Critical RLS failure')) {
    console.log('✅ PASS: PULL validation detects RLS failure')
  }
}
```

### Multi-Device Sync Security

```typescript
// Test 4: Multi-device with same userId
const userId = 'user-a-uuid'

const syncA = new SyncEngine(localDbA, remoteDb, userId)
const syncB = new SyncEngine(localDbB, remoteDb, userId)

// Create data on device A
await localDbA.insert('ideas', { id: 'idea-1', user_id: userId })

// Sync from device A
await syncA.syncAll()

// Sync on device B (should see the idea)
await syncB.syncAll()

const ideasOnB = await localDbB.query('SELECT * FROM ideas')
if (ideasOnB.length > 0 && ideasOnB[0].user_id === userId) {
  console.log('✅ PASS: Multi-device sync works')
}
```

### Multi-User Security

```typescript
// Test 5: Multi-user (different userIds) - different data isolation
const syncA = new SyncEngine(localDbA, remoteDb, 'user-a-uuid')
const syncB = new SyncEngine(localDbB, remoteDb, 'user-b-uuid')

// Create data
await localDbA.insert('ideas', { id: 'idea-a', user_id: 'user-a-uuid' })
await localDbB.insert('ideas', { id: 'idea-b', user_id: 'user-b-uuid' })

// Sync both
await syncA.syncAll()
await syncB.syncAll()

// Verify isolation
const ideasA = await localDbA.query('SELECT * FROM ideas')
const ideasB = await localDbB.query('SELECT * FROM ideas')

if (ideasA.every(i => i.user_id === 'user-a-uuid') &&
    ideasB.every(i => i.user_id === 'user-b-uuid')) {
  console.log('✅ PASS: Multi-user isolation works')
}
```

### Conflict Resolution Security

```typescript
// Test 6: Conflict resolution validates ownership
const syncEngine = new SyncEngine(localDb, remoteDb, 'user-a-uuid')

try {
  // Try to resolve conflict on data not owned by user
  await syncEngine.resolveConflict({
    recordId: 'idea-b',
    tableName: 'ideas',
    local: { id: 'idea-b', user_id: 'user-b-uuid' },
    remote: { id: 'idea-b', user_id: 'user-b-uuid' }
  })
  console.error('FAIL: Should throw security error')
} catch (error) {
  if (error.message.includes('Security')) {
    console.log('✅ PASS: Conflict resolution validates ownership')
  }
}
```

### Audit Checklist: Sync Security

```
[ ] SyncEngine requires userId
[ ] PUSH validates user_id on ideas
[ ] PUSH validates idea_id on blocks
[ ] PUSH validates idea_ids on associations
[ ] PULL detects RLS failures
[ ] Multi-device sync works (same user)
[ ] Multi-user isolation (different users)
[ ] Conflict resolution validates ownership
[ ] Cannot sync other user's cached data
[ ] No data leaks in sync logs
[ ] 3-layer validation works end-to-end
```

---

## Layer 4: Data Safety Audit

### Soft Delete Verification

```sql
-- Check soft delete implementation
SELECT * FROM ideas WHERE deleted_at IS NOT NULL LIMIT 1;

-- Verify RLS hides deleted data
SET ROLE user_a;
SELECT COUNT(*) FROM ideas WHERE deleted_at IS NULL;
-- ✅ Should not include deleted ideas

-- Verify recovery possibility
SET ROLE postgres;
SELECT COUNT(*) FROM ideas WHERE deleted_at IS NOT NULL;
-- ✅ Deleted data still exists for recovery
```

### Audit Log Accuracy

```sql
-- Check audit log captures all changes
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;

-- Verify user_id captured
SELECT DISTINCT user_id FROM audit_log;
-- ✅ Should show multiple users

-- Verify all operation types captured
SELECT DISTINCT operation FROM audit_log;
-- ✅ Should show: INSERT, UPDATE, DELETE

-- Verify timestamps correct
SELECT MAX(created_at) FROM audit_log;
-- ✅ Should be recent
```

### Recovery Capabilities

```bash
# Test: Recover deleted idea
# 1. Get deleted idea from audit log
deleted_idea=$(psql -c "SELECT old_values FROM audit_log WHERE operation='DELETE' AND table_name='ideas' LIMIT 1")

# 2. Restore the idea (would use recovery procedure)
# 3. Verify restored idea is accessible
# ✅ Should be able to recover

# Backup & restore testing
pg_dump production_db > backup.sql
# ... simulate restore ...
# ✅ Data integrity verified
```

### Audit Checklist: Data Safety

```
[ ] Soft deletes implemented on all tables
[ ] Deleted data hidden from RLS
[ ] Deleted data recoverable
[ ] Audit log captures all changes
[ ] Audit log captures user_id
[ ] All operation types logged
[ ] Timestamps accurate
[ ] Backup procedure tested
[ ] Restore procedure tested
[ ] Recovery time < 30 minutes
[ ] Data integrity verified after restore
```

---

## Layer 5: Encryption Audit

### Transport Layer (TLS)

```bash
# Check HTTPS/TLS configuration
curl -I https://$PRODUCTION_URL

# Should show:
# - HTTP Status 200
# - Strict-Transport-Security header
# - Content-Security-Policy header
# - X-Content-Type-Options: nosniff

# ✅ Audit Pass Criteria:
# - TLS 1.2 minimum (1.3 preferred)
# - Valid certificate
# - HSTs enabled (min-age=31536000)
```

### At-Rest Encryption

```bash
# Check database encryption (Supabase default)
# Supabase encrypts data at rest by default
# - PostgreSQL pgcrypto extension available
# - Sensitive data fields can use encryption

# ✅ Audit Pass Criteria:
# - Database encryption enabled
# - Backups encrypted
# - Audit logs not exposing sensitive data in plaintext
```

### API Key Security

```bash
# Check environment variables
grep -r "SUPABASE" .env*
# ✅ Should NOT see in version control
# ✅ Should be in .gitignore
# ✅ Should be secrets in production

# Check for hardcoded keys in code
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
# ✅ Should NOT find any hardcoded keys
```

### Audit Checklist: Encryption

```
[ ] TLS 1.2+ enabled
[ ] Certificate valid and current
[ ] HSTS header present
[ ] Database encryption enabled
[ ] Backups encrypted
[ ] API keys in secrets manager
[ ] No hardcoded keys in code
[ ] Environment variables secure
[ ] Sensitive data not in logs
```

---

## Overall Security Audit Summary

| Layer | Status | Pass/Fail |
|-------|--------|-----------|
| Authentication | Reviewed | ✅ PASS |
| RLS Policies | Tested | ✅ PASS |
| Sync Security | Validated | ✅ PASS |
| Data Safety | Verified | ✅ PASS |
| Encryption | Confirmed | ✅ PASS |

### Final Decision

```
✅ GO TO PRODUCTION

All 5 security layers verified.
No critical issues found.
System ready for production deployment.
```

OR

```
❌ HOLD DEPLOYMENT

Issues found:
- [Issue 1]
- [Issue 2]

Fix required:
- [Action 1]
- [Action 2]

Expected resolution: [Date/Time]
New audit date: [Proposed date]
```

---

## Audit Sign-Off

**Auditor:** ___________________
**Date:** ___________________
**Status:** ✅ APPROVED / ❌ REJECTED

**Issues Found:** ___________________
**Remediation:** ___________________
**Next Steps:** ___________________

---

**Security Audit Complete**
**Ready for Phase 2: Staging Deployment**
