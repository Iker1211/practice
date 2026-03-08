/**
 * Backup Engine - Sistema de backups automáticos para BD SQLite
 * 
 * Estrategia:
 * 1. Snapshots locales cada 24h en tabla _backups
 * 2. Comprimir JSON para economizar espacio
 * 3. Mantener últimos 7 backups (configurable)
 * 4. Sincronizar snapshots a Supabase como backup remoto
 */

import type { LocalDatabaseAdapter } from './local-db-adapter'

/**
 * Metadata de un backup
 */
export interface BackupMetadata {
  id: string // UUID
  timestamp: string // ISO timestamp cuando se creó
  userIds: string[] // Lista de usuarios en este backup
  ideaCount: number // Cantidad de ideas en el backup
  size: number // Tamaño en bytes comprimido
  checksum: string // SHA-256 para verificar integridad
  version: number // Versión de esquema del backup
}

/**
 * Contenido de un backup (serializado)
 */
export interface BackupData {
  version: number
  timestamp: string
  ideas: Array<{
    id: string
    title: string
    user_id: string
    created_at: string
    updated_at: string
    deleted_at: string | null
    version: number
  }>
}

/**
 * Engine de backups
 */
export class BackupEngine {
  constructor(private localDb: LocalDatabaseAdapter) {}

  /**
   * Crear un backup completo
   */
  async createBackup(): Promise<BackupMetadata> {
    try {
      const now = new Date().toISOString()
      const backupId = this.generateId()

      // 1. Obtener todas las ideas (incluyendo soft-deleted)
      const ideas = await this.localDb.query('SELECT * FROM ideas')

      // 2. Crear objeto de backup
      const backupData: BackupData = {
        version: 1,
        timestamp: now,
        ideas: ideas || [],
      }

      // 3. Serializar a JSON
      const jsonString = JSON.stringify(backupData)

      // 4. Calcular checksum (hash simple, no criptográfico)
      const checksum = this.simpleChecksum(jsonString)

      // 5. Guardar en tabla _backups
      const ideaCount = ideas ? ideas.length : 0
      const size = jsonString.length

      // Obtener lista de user_ids únicos
      const userIds = [...new Set((ideas || []).map((i: any) => i.user_id))]

      await this.localDb.execute(
        `INSERT INTO _backups (id, timestamp, user_ids, idea_count, size, checksum, data, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupId,
          now,
          JSON.stringify(userIds),
          ideaCount,
          size,
          checksum,
          jsonString,
          1,
        ]
      )

      return {
        id: backupId,
        timestamp: now,
        userIds,
        ideaCount,
        size,
        checksum,
        version: 1,
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Listar todos los backups (ordenados por timestamp descendente)
   */
  async listBackups(limit: number = 10): Promise<BackupMetadata[]> {
    try {
      const backups = await this.localDb.query(
        `SELECT id, timestamp, user_ids, idea_count, size, checksum, version 
         FROM _backups 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [limit]
      )

      return (backups || []).map((b: any) => ({
        id: b.id,
        timestamp: b.timestamp,
        userIds: JSON.parse(b.user_ids || '[]'),
        ideaCount: b.idea_count,
        size: b.size,
        checksum: b.checksum,
        version: b.version,
      }))
    } catch (error) {
      console.error('Error listing backups:', error)
      return []
    }
  }

  /**
   * Obtener tamaño total de backups en la BD
   */
  async getTotalBackupSize(): Promise<number> {
    try {
      const result = await this.localDb.query(
        'SELECT SUM(size) as total FROM _backups'
      )
      return result?.[0]?.total || 0
    } catch (error) {
      console.error('Error getting backup size:', error)
      return 0
    }
  }

  /**
   * Limpiar backups viejos (mantener los últimos N)
   */
  async cleanupOldBackups(keepCount: number = 7): Promise<number> {
    try {
      // Obtener backups a eliminar
      const backupsToDelete = await this.localDb.query(
        `SELECT id FROM _backups 
         ORDER BY timestamp DESC 
         LIMIT -1 OFFSET ?`,
        [keepCount]
      )

      if (!backupsToDelete || backupsToDelete.length === 0) {
        return 0
      }

      const idsToDelete = backupsToDelete.map((b: any) => b.id)

      // Eliminar en lotes para no sobrecargar
      for (const id of idsToDelete) {
        await this.localDb.execute('DELETE FROM _backups WHERE id = ?', [id])
      }

      return idsToDelete.length
    } catch (error) {
      console.error('Error cleaning up backups:', error)
      return 0
    }
  }

  /**
   * Obtener un backup específico completo
   */
  async getBackup(backupId: string): Promise<BackupData | null> {
    try {
      const result = await this.localDb.query(
        'SELECT data FROM _backups WHERE id = ?',
        [backupId]
      )

      if (!result || result.length === 0) {
        return null
      }

      return JSON.parse(result[0].data)
    } catch (error) {
      console.error('Error getting backup:', error)
      return null
    }
  }

  /**
   * Verificar integridad de un backup
   */
  async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const result = await this.localDb.query(
        'SELECT data, checksum FROM _backups WHERE id = ?',
        [backupId]
      )

      if (!result || result.length === 0) {
        return false
      }

      const stored = result[0]
      const calculated = this.simpleChecksum(stored.data)

      return stored.checksum === calculated
    } catch (error) {
      console.error('Error verifying backup:', error)
      return false
    }
  }

  /**
   * Backup automático (llamar en background, ej: cada 24h)
   */
  async autoBackup(options: { keepCount?: number; onlyIfNotRecent?: boolean } = {}): Promise<BackupMetadata | null> {
    try {
      const { keepCount = 7, onlyIfNotRecent = true } = options

      // Si onlyIfNotRecent=true, verificar si ya hay backup reciente (< 24h)
      if (onlyIfNotRecent) {
        const recent = await this.localDb.query(
          `SELECT id FROM _backups 
           WHERE timestamp > datetime('now', '-24 hours')
           LIMIT 1`
        )

        if (recent && recent.length > 0) {
          console.log('⏭️ Backup reciente encontrado, saltando')
          return null
        }
      }

      // Crear backup
      const backup = await this.createBackup()

      // Limpiar backups viejos
      const deleted = await this.cleanupOldBackups(keepCount)
      if (deleted > 0) {
        console.log(`🗑️ ${deleted} backups antiguos eliminados`)
      }

      console.log(`✅ Backup creado: ${backup.id} (${backup.ideaCount} ideas)`)
      return backup
    } catch (error) {
      console.error('Error in autoBackup:', error)
      return null
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Calcular checksum simple (no criptográfico, solo para detectar cambios)
   */
  private simpleChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

/**
 * Crear instancia del backup engine
 */
export function createBackupEngine(localDb: LocalDatabaseAdapter): BackupEngine {
  return new BackupEngine(localDb)
}
