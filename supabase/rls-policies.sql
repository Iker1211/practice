-- ============================================================================
-- RLS Policies para Supabase - Row Level Security
-- ============================================================================
-- 
-- Propósito: Garantizar que un usuario SOLO vea/modifique sus propios datos
-- Nivel: BD (PostgreSQL) - No puede ser bypass desde app
--
-- ⚠️ IMPORTANTE:
-- 1. Las RLS policies se aplican a TODO acceso, incluso desde admin
-- 2. Supabase Client usa JWT token con user_id como claim
-- 3. auth.uid() retorna el user_id del JWT (como TEXT en este proyecto)
-- 4. Relaciones:
--    - blocks.idea_id → ideas.id (usuario accede blocks via ideas)
--    - associations.source/target_idea_id → ideas.id (usuario accede via ideas)
-- ============================================================================

-- ============================================================================
-- TABLA: ideas - RLS Policies
-- ============================================================================

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuario solo ve sus propias ideas
CREATE POLICY ideas_select_policy ON ideas
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Solo puede crear ideas para sí mismo
CREATE POLICY ideas_insert_policy ON ideas
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Solo puede modificar sus propias ideas
CREATE POLICY ideas_update_policy ON ideas
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Solo puede eliminar sus propias ideas
CREATE POLICY ideas_delete_policy ON ideas
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLA: blocks - RLS Policies
-- ============================================================================
-- blocks NO tiene user_id, pero está relacionado con ideas
-- Usuario solo accede blocks de sus propias ideas

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuario ve blocks de sus propias ideas
CREATE POLICY blocks_select_policy ON blocks
  FOR SELECT
  USING (
    idea_id IN (
      SELECT id FROM ideas WHERE user_id = auth.uid()
    )
  );

-- INSERT: Usuario puede crear blocks solo en sus ideas
CREATE POLICY blocks_insert_policy ON blocks
  FOR INSERT
  WITH CHECK (
    idea_id IN (
      SELECT id FROM ideas WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Usuario solo modifica blocks de sus ideas
CREATE POLICY blocks_update_policy ON blocks
  FOR UPDATE
  USING (
    idea_id IN (
      SELECT id FROM ideas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    idea_id IN (
      SELECT id FROM ideas WHERE user_id = auth.uid()
    )
  );

-- DELETE: Usuario solo borra blocks de sus ideas
CREATE POLICY blocks_delete_policy ON blocks
  FOR DELETE
  USING (
    idea_id IN (
      SELECT id FROM ideas WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLA: associations - RLS Policies
-- ============================================================================
-- associations NO tiene user_id, pero ambas ideas deben pertenecer al usuario
-- Usuario solo accesa associations de sus propias ideas

ALTER TABLE associations ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuario ve associations entre sus propias ideas
CREATE POLICY associations_select_policy ON associations
  FOR SELECT
  USING (
    source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
    AND
    target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
  );

-- INSERT: Usuario puede crear associations solo entre sus ideas
CREATE POLICY associations_insert_policy ON associations
  FOR INSERT
  WITH CHECK (
    source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
    AND
    target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
  );

-- UPDATE: Usuario solo modifica associations de sus ideas
CREATE POLICY associations_update_policy ON associations
  FOR UPDATE
  USING (
    source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
    AND
    target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
  )
  WITH CHECK (
    source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
    AND
    target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
  );

-- DELETE: Usuario solo borra associations de sus ideas
CREATE POLICY associations_delete_policy ON associations
  FOR DELETE
  USING (
    source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
    AND
    target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLA: audit_log - RLS Policies
-- ============================================================================
-- Registra cambios de CUALQUIER tabla
-- Usuario solo ve su propio audit log

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuario solo ve su propio audit log
CREATE POLICY audit_log_select_policy ON audit_log
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- ÍNDICES: Optimización para 10k+ usuarios
-- ============================================================================
-- Estos índices optimizan queries que filtran por user_id

CREATE INDEX IF NOT EXISTS idx_ideas_user_id_created_at 
  ON ideas(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ideas_user_id_updated_at 
  ON ideas(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ideas_user_id_deleted_at 
  ON ideas(user_id, deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blocks_idea_id 
  ON blocks(idea_id);

CREATE INDEX IF NOT EXISTS idx_associations_source_idea_id 
  ON associations(source_idea_id);

CREATE INDEX IF NOT EXISTS idx_associations_target_idea_id 
  ON associations(target_idea_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
  ON audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
  ON audit_log(created_at DESC);

-- ============================================================================
-- VERIFICACIÓN - Queries para testear RLS
-- ============================================================================
-- 
-- ✅ SELECTA ideas del usuario actual:
--   SELECT * FROM ideas WHERE user_id = auth.uid()::text;
-- 
-- ✅ SELECT blocks de ideas del usuario actual:
--   SELECT b.* FROM blocks b
--   JOIN ideas i ON b.idea_id = i.id
--   WHERE i.user_id = auth.uid()::text;
-- 
-- ✅ SELECT associations entre ideas del usuario:
--   SELECT * FROM associations
--   WHERE source_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid()::text)
--   AND target_idea_id IN (SELECT id FROM ideas WHERE user_id = auth.uid()::text);
-- 
-- ❌ DEBE fallar (intentar ver ideas de otro usuario):
--   SELECT * FROM ideas WHERE user_id = 'otro-usuario';
-- 
-- ❌ DEBE fallar (intentar acceder blocks de ideas ajenas):
--   Se bloquea automáticamente por RLS en associations/blocks
--
-- ============================================================================
