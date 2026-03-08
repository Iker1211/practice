/**
 * Generador de schema automático - Fuente única de verdad
 * Convierte tipos TypeScript en SQL sin duplicación
 */

import type { Database } from './types'

export interface SchemaColumn {
  name: string
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN'
  notNull?: boolean
  primaryKey?: boolean
  default?: string
  check?: string
}

export interface SchemaTable {
  name: string
  columns: SchemaColumn[]
  indexes: Array<{ name: string; columns: string[] }>
  foreignKeys?: Array<{ column: string; references: string; table: string }>
}

/**
 * Definición completa del schema correspondiente a los tipos Supabase
 * Esta es la FUENTE ÚNICA DE VERDAD para todas las plataformas
 */
export const SCHEMA_DEFINITION: Record<string, SchemaTable> = {
  ideas: {
    name: 'ideas',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'title', type: 'TEXT', notNull: true },
      { name: 'user_id', type: 'TEXT', notNull: true, default: "'local-anonymous'" },
      { name: 'created_at', type: 'TEXT', notNull: true },
      { name: 'updated_at', type: 'TEXT', notNull: true },
      { name: 'deleted_at', type: 'TEXT' },
      { name: 'version', type: 'INTEGER', notNull: true, default: '1' },
      // Columnas de sincronización (ocultas de la capa de aplicación)
      { name: '_sync_status', type: 'TEXT', default: "'synced'" },
      { name: '_remote_version', type: 'INTEGER', default: '0' },
      { name: '_last_synced_at', type: 'TEXT' },
    ],
    indexes: [
      { name: 'idx_ideas_user_id', columns: ['user_id'] },
      { name: 'idx_ideas_deleted_at', columns: ['deleted_at'] },
      { name: 'idx_ideas_created_at', columns: ['created_at'] },
      { name: 'idx_ideas_updated_at', columns: ['updated_at'] },
      { name: 'idx_ideas_sync_status', columns: ['_sync_status'] },
      { name: 'idx_ideas_user_id_deleted', columns: ['user_id', 'deleted_at'] },
    ],
  },
}

/**
 * Generar SQL CREATE TABLE desde la definición
 */
export function generateCreateTableSQL(tableName: string): string {
  const table = SCHEMA_DEFINITION[tableName]
  if (!table) {
    throw new Error(`Table ${tableName} not found in schema definition`)
  }

  const columnDefs = table.columns
    .map((col) => {
      let def = `${col.name} ${col.type}`
      if (col.primaryKey) def += ' PRIMARY KEY'
      if (col.notNull) def += ' NOT NULL'
      if (col.default) def += ` DEFAULT ${col.default}`
      if (col.check) def += ` CHECK(${col.check})`
      return def
    })
    .join(',\n  ')

  return `CREATE TABLE IF NOT EXISTS ${tableName} (
  ${columnDefs}
);`
}

/**
 * Generar SQL CREATE INDEX desde la definición
 */
export function generateCreateIndexesSQL(tableName: string): string[] {
  const table = SCHEMA_DEFINITION[tableName]
  if (!table) {
    return []
  }

  return table.indexes.map((idx) => {
    const columns = idx.columns.join(', ')
    return `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${tableName}(${columns});`
  })
}

/**
 * Generar SQL completo para todas las tablas
 */
export function generateFullSchemaSQL(): string {
  const allSQL: string[] = []

  for (const tableName of Object.keys(SCHEMA_DEFINITION)) {
    allSQL.push(generateCreateTableSQL(tableName))
    allSQL.push(...generateCreateIndexesSQL(tableName))
  }

  return allSQL.join('\n')
}

/**
 * Obtener la lista todos los nombres de tablas del usuario (excluye tablas de sincronización)
 */
export function getUserTables(): string[] {
  return Object.keys(SCHEMA_DEFINITION).filter((name) => !name.startsWith('_'))
}

/**
 * Obtener definición de tabla específica
 */
export function getTableDefinition(tableName: string): SchemaTable | null {
  return SCHEMA_DEFINITION[tableName] ?? null
}

/**
 * Exportar el schema en formato TypeScript para generar archivos
 */
export function exportSchemaAsTypeScript(): string {
  return `// Auto-generado - NO EDITAR MANUALMENTE
// Este archivo es generado desde packages/lib/src/db/schema-generator.ts

export const SCHEMA_DEFINITION = ${JSON.stringify(SCHEMA_DEFINITION, null, 2)}
`
}
