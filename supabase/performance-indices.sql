/*
 * PASO 6: Performance Indices for 10k+ Users
 * 
 * Strategic index creation for:
 * 1. RLS filtering queries (user_id lookups)
 * 2. Sync delta queries (updated_at timestamps)
 * 3. Foreign key relationships (idea_id references)
 * 4. Conflict resolution (tableName, recordId)
 * 5. Data cleanup operations
 * 
 * These indices are designed to work WITH the RLS policies
 * and the offline-first sync engine for optimal performance
 * at 10k+ concurrent users.
 */

-- ===================================================================
-- Table: ideas
-- Primary key: id
-- User isolation: user_id (RLS column)
-- Sync delta: updated_at
-- ===================================================================

-- Index 1: RLS filtering - Every query filters by user_id
CREATE INDEX IF NOT EXISTS ideas_user_id_idx 
  ON public.ideas(user_id);

-- Index 2: Sync delta queries - Pull changes since last sync
CREATE INDEX IF NOT EXISTS ideas_updated_at_idx 
  ON public.ideas(updated_at DESC);

-- Index 3: Combined index - RLS + Sync delta (optimal for most queries)
-- SELECT * FROM ideas WHERE user_id = X AND updated_at > Y
CREATE INDEX IF NOT EXISTS ideas_user_id_updated_at_idx 
  ON public.ideas(user_id, updated_at DESC);

-- Index 4: Soft delete filtering
CREATE INDEX IF NOT EXISTS ideas_deleted_at_idx 
  ON public.ideas(deleted_at DESC) 
  WHERE deleted_at IS NULL;  -- Partial index: only active records

-- ===================================================================
-- Table: blocks
-- Foreign key: idea_id (references ideas.id)
-- Primary key: id
-- Sync delta: updated_at
-- ===================================================================

-- Index 1: Foreign key optimization - blocks for a specific idea
-- When syncing a single idea's blocks
CREATE INDEX IF NOT EXISTS blocks_idea_id_idx 
  ON public.blocks(idea_id);

-- Index 2: Sync delta queries
CREATE INDEX IF NOT EXISTS blocks_updated_at_idx 
  ON public.blocks(updated_at DESC);

-- Index 3: Combined index - FK + Sync delta for common pattern
-- SELECT * FROM blocks WHERE idea_id = X AND updated_at > Y
CREATE INDEX IF NOT EXISTS blocks_idea_id_updated_at_idx 
  ON public.blocks(idea_id, updated_at DESC);

-- Index 4: Soft delete filtering
CREATE INDEX IF NOT EXISTS blocks_deleted_at_idx 
  ON public.blocks(deleted_at DESC) 
  WHERE deleted_at IS NULL;

-- Index 5: Block ordering within ideas
CREATE INDEX IF NOT EXISTS blocks_idea_id_position_idx 
  ON public.blocks(idea_id, position) 
  WHERE deleted_at IS NULL;

-- ===================================================================
-- Table: associations
-- Foreign keys: source_idea_id, target_idea_id (both reference ideas.id)
-- Primary key: id
-- Sync delta: updated_at
-- ===================================================================

-- Index 1: Query associations FROM a source idea
-- Common pattern: "What does this idea connect to?"
CREATE INDEX IF NOT EXISTS associations_source_idea_id_idx 
  ON public.associations(source_idea_id);

-- Index 2: Query associations TO a target idea (reverse lookup)
-- Common pattern: "What ideas connect to this?"
CREATE INDEX IF NOT EXISTS associations_target_idea_id_idx 
  ON public.associations(target_idea_id);

-- Index 3: Sync delta queries
CREATE INDEX IF NOT EXISTS associations_updated_at_idx 
  ON public.associations(updated_at DESC);

-- Index 4: Combined - Source + Sync delta
-- SELECT * FROM associations WHERE source_idea_id = X AND updated_at > Y
CREATE INDEX IF NOT EXISTS associations_source_updated_at_idx 
  ON public.associations(source_idea_id, updated_at DESC);

-- Index 5: Combined - Target + Sync delta
-- SELECT * FROM associations WHERE target_idea_id = X AND updated_at > Y
CREATE INDEX IF NOT EXISTS associations_target_updated_at_idx 
  ON public.associations(target_idea_id, updated_at DESC);

-- Index 6: Soft delete filtering
CREATE INDEX IF NOT EXISTS associations_deleted_at_idx 
  ON public.associations(deleted_at DESC) 
  WHERE deleted_at IS NULL;

-- ===================================================================
-- Table: audit_log
-- User isolation: user_id
-- Sync delta: created_at (immutable, no updated_at)
-- ===================================================================

-- Index 1: RLS filtering - Audit log per user
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx 
  ON public.audit_log(user_id);

-- Index 2: Sync delta queries - Pull new audit entries
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx 
  ON public.audit_log(created_at DESC);

-- Index 3: Combined - RLS + Sync delta
-- SELECT * FROM audit_log WHERE user_id = X AND created_at > Y
CREATE INDEX IF NOT EXISTS audit_log_user_id_created_at_idx 
  ON public.audit_log(user_id, created_at DESC);

-- Index 4: Find changes to a specific table
CREATE INDEX IF NOT EXISTS audit_log_table_name_idx 
  ON public.audit_log(table_name);

-- Index 5: Combined - Track specific table changes per user
-- SELECT * FROM audit_log WHERE user_id = X AND table_name = Y
CREATE INDEX IF NOT EXISTS audit_log_user_table_idx 
  ON public.audit_log(user_id, table_name, created_at DESC);

-- ===================================================================
-- Table: _sync_queue
-- Purpose: Track pending changes waiting to sync
-- Status: synced_at (NULL = pending, NOT NULL = completed)
-- ===================================================================

-- Index 1: Find all pending (not yet synced) items
-- This is THE most critical query for sync performance
-- SELECT * FROM _sync_queue WHERE synced_at IS NULL
CREATE INDEX IF NOT EXISTS _sync_queue_pending_idx 
  ON public._sync_queue(synced_at) 
  WHERE synced_at IS NULL;  -- Partial: only pending items

-- Index 2: Find by table and record ID (for conflict detection)
-- SELECT * FROM _sync_queue WHERE tableName = X AND recordId = Y
CREATE INDEX IF NOT EXISTS _sync_queue_table_record_idx 
  ON public._sync_queue(table_name, record_id);

-- Index 3: Creation order (for cleanup)
CREATE INDEX IF NOT EXISTS _sync_queue_created_at_idx 
  ON public._sync_queue(created_at DESC);

-- Index 4: Error tracking (find recently failed syncs)
-- SELECT * FROM _sync_queue WHERE error_message IS NOT NULL
CREATE INDEX IF NOT EXISTS _sync_queue_error_idx 
  ON public._sync_queue(created_at DESC) 
  WHERE error_message IS NOT NULL;

-- Index 5: Retry attempts
-- SELECT * FROM _sync_queue WHERE retryCount > 0
CREATE INDEX IF NOT EXISTS _sync_queue_retry_count_idx 
  ON public._sync_queue(retry_count DESC) 
  WHERE retry_count > 0;

-- ===================================================================
-- COMPOSITE INDICES FOR COMMON QUERY PATTERNS
-- These are the "power" indices for 10k+ concurrent users
-- ===================================================================

-- Pattern: "Sync all user data since timestamp"
-- Most common query pattern in the entire system
-- SELECT * FROM ideas WHERE user_id = ? AND updated_at > ?
CREATE INDEX IF NOT EXISTS common_pattern_user_sync_idx 
  ON public.ideas(user_id, updated_at DESC);

-- Pattern: "Find blocks for idea" (used during sync of related data)
-- SELECT * FROM blocks WHERE idea_id = ? AND updated_at > ?
CREATE INDEX IF NOT EXISTS common_pattern_blocks_sync_idx 
  ON public.blocks(idea_id, updated_at DESC);

-- ===================================================================
-- ANALYSIS & STATISTICS
-- ===================================================================

-- Analyze tables for query planner optimization
-- These should be run after creating indices and before load testing
ANALYZE public.ideas;
ANALYZE public.blocks;
ANALYZE public.associations;
ANALYZE public.audit_log;
ANALYZE public._sync_queue;

-- ===================================================================
-- NOTES FOR PERFORMANCE TUNING
-- ===================================================================

/*
 * Key Performance Considerations:
 * 
 * 1. Partial Indices (WHERE deleted_at IS NULL)
 *    - Smaller indices = faster queries
 *    - Only includes active records
 *    - Significant space savings
 * 
 * 2. Composite Indices (user_id, updated_at)
 *    - Satisfies both RLS AND sync queries
 *    - Query planner can use single index
 *    - Better than maintaining two separate indices
 * 
 * 3. Descending Order (DESC on updated_at)
 *    - Most queries want newest data first
 *    - DESC index matches query direction
 *    - Minimal performance overhead
 * 
 * 4. Foreign Key Indices
 *    - Essential for JOIN operations during sync
 *    - FK lookups for RLS validation (sync-engine.ts)
 *    - Prevent sequential scans on large tables
 * 
 * 5. Sync Queue Indices
 *    - _sync_queue.pending_idx is CRITICAL
 *    - Partial index keeps it small
 *    - Fastest way to find work to do
 * 
 * 6. 10k+ User Scaling
 *    - With these indices: constant time queries
 *    - Without: linear scan of entire table
 *    - Index maintenance cost justified by query speed
 * 
 * Benchmarking Strategy:
 * - Run benchmarks with 1k, 5k, 10k+ ideas per user
 * - Measure: sync time, RLS filtering, conflict resolution
 * - Adjust indices if needed based on actual query patterns
 * - Monitor: index size, query plan execution times
 */

-- ===================================================================
-- VERIFICATION SCRIPT
-- ===================================================================

/*
To verify indices were created, run:

SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('ideas', 'blocks', 'associations', 'audit_log', '_sync_queue')
ORDER BY tablename, indexname;

To check index size:

SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

To monitor query performance:

EXPLAIN ANALYZE
SELECT * FROM ideas 
WHERE user_id = 'user-uuid' 
  AND updated_at > now() - interval '1 hour'
  AND deleted_at IS NULL;
*/
