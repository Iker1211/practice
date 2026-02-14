// Script de seed para testing
// Los UUIDs se generan con crypto.randomUUID()

export function generateSeedSQL(): string {
  const id1 = crypto.randomUUID()
  const id2 = crypto.randomUUID()
  const id3 = crypto.randomUUID()
  const now = new Date().toISOString()

  return `
INSERT OR IGNORE INTO ideas (id, title, created_at, updated_at, version)
VALUES 
  ('${id1}', 'Primera idea de prueba', '${now}', '${now}', 1),
  ('${id2}', 'Segunda idea de prueba', '${now}', '${now}', 1),
  ('${id3}', 'Tercera idea de prueba', '${now}', '${now}', 1);
`
}

// Seed estático para casos donde no hay crypto disponible
export const staticSeedSQL = `
INSERT OR IGNORE INTO ideas (id, title, created_at, updated_at, version)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Idea seed estática 1', datetime('now'), datetime('now'), 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Idea seed estática 2', datetime('now'), datetime('now'), 1);
`
