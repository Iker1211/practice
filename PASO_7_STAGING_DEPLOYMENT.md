# PASO 7: Phase 2 - Staging Deployment

**Phase:** Phase 2 of PASO 7
**Duration:** 2-3 hours
**Objective:** Deploy and validate system in staging environment
**Status:** Ready to Execute

---

## Phase 2 Overview

After Phase 1 security audit passes, proceed with staging deployment:

1. **Create Staging Project** - Separate Supabase environment
2. **Deploy Schema** - Tables, columns, constraints
3. **Deploy Indices** - All 26 performance indices
4. **Deploy RLS Policies** - Security layer
5. **Load Testing** - Validate performance at 10k+ users
6. **Validation Checklist** - Verify all systems work

---

## Step 1: Create Staging Supabase Project

### Create New Project

```bash
# In Supabase Dashboard:
# 1. Click "New Project"
# 2. Organization: [your org]
# 3. Name: "staging-[app-name]"
# 4. Database Password: [strong password 20+ chars]
# 5. Region: Same as production (e.g., us-east-1)
# 6. Pricing: Pro (to match production)
# 7. Click "Create new project"
#
# Wait: ~10 minutes for project creation
```

### Verify Project Ready

```bash
# Get staging project credentials
STAGING_URL="https://[staging-project].supabase.co"
STAGING_ANON_KEY="[staging-anon-key]"
STAGING_SERVICE_KEY="[staging-service-key]"

# Test connectivity
curl -X POST "$STAGING_URL/auth/v1/signup" \
  -H "apikey: $STAGING_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@staging.com","password":"test123456"}'

# ✅ Should return user object or error (not connection error)
```

### Create .env.staging

```bash
# File: .env.staging
VITE_SUPABASE_URL=https://[staging-project].supabase.co
VITE_SUPABASE_ANON_KEY=[staging-anon-key]
VITE_SUPABASE_SERVICE_KEY=[staging-service-key]
SYNC_DEBUG=true
```

---

## Step 2: Deploy Database Schema

### Create Tables

```sql
-- Connection: Use SQL Editor in Supabase Dashboard

-- Table 1: ideas
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT ideas_user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Table 2: blocks
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT blocks_user_id_fk FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table 3: associations
CREATE TABLE IF NOT EXISTS associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  target_idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT associations_user_id_fk FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table 4: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: _sync_queue (system table)
CREATE TABLE IF NOT EXISTS _sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- ✅ Verify: All 5 tables created
SELECT tablename FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY tablename;
-- Should show: ideas, blocks, associations, audit_log, _sync_queue
```

### Enable RLS

```sql
-- Enable Row-Level Security on all 4 tables
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Note: _sync_queue is NOT RLS-protected (system table)

-- ✅ Verify
SELECT tablename, current_setting('rls_enabled') as rls_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND tablename IN ('ideas', 'blocks', 'associations', 'audit_log');
```

### Create RLS Policies

```sql
-- ✅ Copy and run all RLS policies from:
-- File: supabase/rls-policies.sql
-- (Should already have this from PASO 5)
```

### Staging Deployment Checklist: Schema

```
[ ] ideas table created
[ ] blocks table created
[ ] associations table created
[ ] audit_log table created
[ ] _sync_queue table created
[ ] All columns correct
[ ] Default values correct
[ ] Foreign keys correct
[ ] CHECK constraints working
[ ] RLS enabled on all 4 tables
[ ] RLS policies created (25+ total)
[ ] Initial data: 0 rows (staging clean)
```

---

## Step 3: Deploy Performance Indices

### Create Indices

```sql
-- ✅ Copy and run all 26 indices from:
-- File: supabase/performance-indices.sql
-- (Should already have this from PASO 6)

-- Quick verification:
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ideas', 'blocks', 'associations', 'audit_log', '_sync_queue')
ORDER BY indexname;

-- ✅ Should show 26 indices
```

### Verify Index Health

```sql
-- Check index size
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ✅ Total should be ~50-100MB for empty database

-- Check index usage (will be 0 for new database)
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Staging Deployment Checklist: Indices

```
[ ] 26 indices created without errors
[ ] No duplicate indices
[ ] Index sizes reasonable (<100MB)
[ ] No missing indices
[ ] Verify: ideas_user_id_idx exists
[ ] Verify: ideas_updated_at_idx exists
[ ] Verify: ideas_user_id_updated_at_idx exists
[ ] Verify: _sync_queue_pending_idx exists
[ ] All composite indices present
```

---

## Step 4: Load Testing

### Test Setup

```typescript
// File: scripts/load-test-staging.ts
import { createClient } from '@supabase/supabase-js'
import Database from 'better-sqlite3'

const stagingClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
)

const localDb = new Database('test-staging.db')

// ✅ Test 1: Single User Load Test
async function testSingleUserLoad() {
  console.log('\n=== Test 1: Single User Load (1000 ideas) ===')
  
  // Create test user
  const { data: user, error: signupError } = await stagingClient.auth.admin.createUser({
    email: `load-test-1@staging.com`,
    password: 'test123456!',
    email_confirm: true
  })
  
  if (signupError) throw signupError
  
  const userId = user.id
  console.log(`Created user: ${userId}`)
  
  // Start timer
  const startTime = Date.now()
  
  // Create 1000 ideas
  for (let i = 0; i < 1000; i++) {
    const { error } = await stagingClient.from('ideas').insert({
      id: `idea-${i}`,
      user_id: userId,
      title: `Test Idea ${i}`,
      content: `Idea content ${i}`.repeat(100)
    })
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`ERROR at idea ${i}:`, error)
      break
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Created ${i + 1} ideas...`)
    }
  }
  
  const elapsed = Date.now() - startTime
  console.log(`✅ Created 1000 ideas in ${elapsed}ms (${Math.round(1000/(elapsed/1000))} ideas/sec)`)
  
  // Query performance test
  const queryStart = Date.now()
  const { data: allIdeas } = await stagingClient
    .from('ideas')
    .select('*')
    .eq('user_id', userId)
    .limit(100)
  
  const queryElapsed = Date.now() - queryStart
  console.log(`✅ Query 1000 ideas (limit 100): ${queryElapsed}ms`)
  
  // ✅ Expected: < 100ms
  if (queryElapsed > 100) {
    console.warn(`⚠️  WARNING: Query slow (${queryElapsed}ms, expected <100ms)`)
  }
}

// ✅ Test 2: Multi-User Load Test
async function testMultiUserLoad() {
  console.log('\n=== Test 2: Multi-User Load (100 users, 100 ideas each) ===')
  
  const startTime = Date.now()
  
  // Create 100 users with 100 ideas each
  for (let u = 0; u < 100; u++) {
    const { data: user } = await stagingClient.auth.admin.createUser({
      email: `load-test-${u}@staging.com`,
      password: 'test123456!',
      email_confirm: true
    })
    
    const userId = user!.id
    
    // Create 100 ideas for this user
    for (let i = 0; i < 100; i++) {
      await stagingClient.from('ideas').insert({
        user_id: userId,
        title: `User ${u} Idea ${i}`,
        content: `Content ${i}`.repeat(50)
      })
    }
    
    if ((u + 1) % 10 === 0) {
      console.log(`  Created ${u + 1} users...`)
    }
  }
  
  const elapsed = Date.now() - startTime
  console.log(`✅ Created 100 users with 100 ideas: ${(elapsed/1000).toFixed(2)}sec`)
  
  // Query total
  const { data: count } = await stagingClient
    .from('ideas')
    .select('*', { count: 'exact' })
  
  console.log(`✅ Total ideas: ${count}`)
  
  // ✅ Expected: ~10,000 ideas
}

// ✅ Test 3: High Volume Sync Test
async function testHighVolumeSync() {
  console.log('\n=== Test 3: High Volume Sync Simulation ===')
  
  const userId = '[test-user-id]'
  const startTime = Date.now()
  
  // Simulate 1000 sync operations
  for (let i = 0; i < 1000; i++) {
    await stagingClient.from('_sync_queue').insert({
      user_id: userId,
      table_name: 'ideas',
      operation: 'INSERT',
      record_id: `idea-sync-${i}`,
      data: { title: `Sync Idea ${i}` }
    })
  }
  
  const elapsed = Date.now() - startTime
  console.log(`✅ Queued 1000 sync operations: ${elapsed}ms (${Math.round(1000/(elapsed/1000))} ops/sec)`)
  
  // ✅ Expected: > 500 ops/sec
}

// Run all tests
async function runAllTests() {
  try {
    await testSingleUserLoad()
    await testMultiUserLoad()
    await testHighVolumeSync()
    
    console.log('\n✅ All load tests passed!')
  } catch (error) {
    console.error('❌ Load test failed:', error)
    process.exit(1)
  }
}

runAllTests()
```

### Execute Load Tests

```bash
# Run load tests
npx ts-node scripts/load-test-staging.ts

# Expected output:
# === Test 1: Single User Load (1000 ideas) ===
# Created user: ...
# Created 100 ideas...
# Created 200 ideas...
# ...
# Created 1000 ideas in 4523ms (221 ideas/sec)
# Query 1000 ideas (limit 100): 45ms
# ✅ Query time acceptable
#
# === Test 2: Multi-User Load (100 users, 100 ideas each) ===
# Created 10 users...
# Created 20 users...
# ...
# Created 100 users with 100 ideas: 65.23sec
# Total ideas: 10000
#
# === Test 3: High Volume Sync Test ===
# Queued 1000 sync operations: 3421ms (292 ops/sec)
#
# ✅ All load tests passed!
```

### Performance Benchmarks

| Test | Metric | Expected | Result | Status |
|------|--------|----------|--------|--------|
| Single User | Insert 1000 ideas | <10sec | ___ | ⏳ |
| Single User | Query latency | <100ms | ___ | ⏳ |
| Multi-User | Create 100 users | <2min | ___ | ⏳ |
| Multi-User | Total ideas | 10,000 | ___ | ⏳ |
| Sync Queue | Queue ops/sec | >500 | ___ | ⏳ |
| RLS Queries | Filter latency | <50ms | ___ | ⏳ |

### Staging Deployment Checklist: Load Testing

```
[ ] Test 1: Single user (1000 ideas) passed
[ ] Test 1: Insert performance acceptable (<10sec)
[ ] Test 1: Query latency acceptable (<100ms)
[ ] Test 2: Multi-user (100 users) passed
[ ] Test 2: Data isolated by user
[ ] Test 3: Sync queue operational
[ ] Test 3: Queue performance (>500 ops/sec)
[ ] RLS policies working (no data leaks)
[ ] All indices being used (index scans > 0)
[ ] Memory usage stable
[ ] No connection leaks
[ ] No database locks
```

---

## Step 5: Validation Checklist

### Functional Verification

```typescript
// Test: All CRUD operations work
const userId = 'test-user-id'

// CREATE
const { data: newIdea } = await stagingClient
  .from('ideas')
  .insert({ user_id: userId, title: 'Test', content: 'Test' })
  .select()

// READ
const { data: allIdeas } = await stagingClient
  .from('ideas')
  .select('*')
  .eq('user_id', userId)

// UPDATE
const { data: updated } = await stagingClient
  .from('ideas')
  .update({ title: 'Updated' })
  .eq('id', newIdea[0].id)
  .select()

// DELETE (soft delete)
const { data: deleted } = await stagingClient
  .from('ideas')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', newIdea[0].id)
  .select()

// ✅ All operations should succeed
```

### Staging Deployment Checklist: Validation

```
[ ] Schema complete and correct
[ ] All 26 indices deployed
[ ] RLS policies enforced
[ ] Single-user load test passed
[ ] Multi-user load test passed
[ ] Data isolation verified
[ ] CRUD operations functional
[ ] Sync queue operational
[ ] Performance benchmarks met
[ ] Error handling working
[ ] Database backups configured
[ ] Monitoring enabled
[ ] No critical errors in logs
```

---

## Staging Deployment Summary

✅ **Phase 2 Complete** when:
- All infrastructure deployed
- Load tests passed
- Performance benchmarks met
- Data isolation verified
- All systems operational

❌ **Issues Found**:
- [ ] Issue 1: ___________
- [ ] Issue 2: ___________

**Next Phase:** Phase 3 - Pre-Production Checks

---

## Staging Deployment Sign-Off

**Deployed By:** ___________________
**Date:** ___________________
**Status:** ✅ READY / ❌ ISSUES

**Baseline Performance:**
- Insert rate: ___________
- Query latency: ___________
- Sync ops/sec: ___________
- Peak memory: ___________

**Issues Resolution:**
- Issue 1: ___________
- Resolution: ___________
- Completion: ___________
