export const schemaSQL = `
PRAGMA foreign_keys = ON;

-- ========================================
-- IDEAS
-- ========================================

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,                         -- UUID generado en cliente
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_deleted_at
ON ideas(deleted_at);

CREATE INDEX IF NOT EXISTS idx_ideas_created_at
ON ideas(created_at);


-- ========================================
-- BLOCKS
-- ========================================

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,                         -- UUID generado en cliente
  idea_id TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT DEFAULT NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_idea_id
ON blocks(idea_id);

CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at
ON blocks(deleted_at);

CREATE INDEX IF NOT EXISTS idx_blocks_position
ON blocks(idea_id, position);


-- ========================================
-- ASSOCIATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS associations (
  id TEXT PRIMARY KEY,                         -- UUID propio
  idea_id_1 TEXT NOT NULL,
  idea_id_2 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL,
  FOREIGN KEY (idea_id_1) REFERENCES ideas(id),
  FOREIGN KEY (idea_id_2) REFERENCES ideas(id),
  CHECK (idea_id_1 != idea_id_2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_association
ON associations (idea_id_1, idea_id_2);

CREATE INDEX IF NOT EXISTS idx_associations_deleted_at
ON associations(deleted_at);
`;
