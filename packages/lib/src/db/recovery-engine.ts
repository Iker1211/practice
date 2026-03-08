/**
 * Recovery Engine - Restaurar datos desde backups
 * 
 * Estrategia:
 * 1. Validar integridad del backup
 * 2. Crear backup del estado actual ANTES de restaurar
 * 3. Restaurar datos
 * 4. Registrar en audit log
 * 5. Sincronizar cambios a Supabase
 */

import type { LocalDatabaseAdapter } from './local-db-adapter'
import type { BackupEngine, BackupData } from './backup-engine'
import type { AuditLogEngine } from './audit-log'

/**
 * Resultado de una recuperación
 */
export interface RecoveryResult {
  success: boolean
  backupId: string
  recoveryId: string
  timestamp: string
  ideasRestored: number
  errors?: string[]
}

/**
 * Engine de recuperación
 */
export class RecoveryEngine {
  constructor(
    private localDb: LocalDatabaseAdapter,
    private backupEngine: BackupEngine,
    private auditEngine: AuditLogEngine
  ) {}

  /**
   * Restaurar desde un backup específico
   * 
   * ⚠️ CUIDADO: Esta operación es irreversible sin backup previo
   */
  async restoreFromBackup(
    backupId: string,
    userId: string,
    options: { createPreRestoreBackup?: boolean; mergeIfConflict?: boolean } = {}
  ): Promise<RecoveryResult> {
    const { createPreRestoreBackup = true, mergeIfConflict = false } = options
    const recoveryId = this.generateId()
    const now = new Date().toISOString()

    try {
      // 1. Obtener backup
      const backupData = await this.backupEngine.getBackup(backupId)
      if (!backupData) {
        throw new Error(`Backup ${backupId} not found`)
      }

      // 2. Verificar integridad
      const isValid = await this.backupEngine.verifyBackupIntegrity(backupId)
      if (!isValid) {
        throw new Error(`Backup ${backupId} failed integrity check`)
      }

      // 3. Crear backup del estado actual
      if (createPreRestoreBackup) {
        const preRestoreBackup = await this.backupEngine.createBackup()
        console.log(`📸 Pre-restore backup created: ${preRestoreBackup.id}`)
      }

      // 4. Restaurar ideas
      let restoredCount = 0

      for (const idea of backupData.ideas) {
        // Verificar si idea ya existe
        const existing = await this.localDb.query(
          'SELECT id FROM ideas WHERE id = ?',
          [idea.id]
        )

        if (existing && existing.length > 0) {
          // Idea ya existe
          if (mergeIfConflict) {
            // Actualizar con datos del backup
            await this.localDb.execute(
              `UPDATE ideas 
               SET title = ?, user_id = ?, created_at = ?, updated_at = ?, deleted_at = ?, version = ?
               WHERE id = ?`,
              [
                idea.title,
                idea.user_id,
                idea.created_at,
                idea.updated_at,
                idea.deleted_at,
                idea.version,
                idea.id,
              ]
            )
          }
          // Si no merge, simplemente skipear
        } else {
          // Insertar nueva idea
          await this.localDb.execute(
            `INSERT INTO ideas (id, title, user_id, created_at, updated_at, deleted_at, version)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              idea.id,
              idea.title,
              idea.user_id,
              idea.created_at,
              idea.updated_at,
              idea.deleted_at,
              idea.version,
            ]
          )
          restoredCount++
        }
      }

      // 5. Registrar en audit log
      await this.auditEngine.recordChange(
        userId,
        '_recovery',
        'RESTORE',
        recoveryId,
        undefined,
        {
          recoveryId,
          backupId,
          ideasRestored: restoredCount,
          timestamp: now,
        }
      )

      return {
        success: true,
        backupId,
        recoveryId,
        timestamp: now,
        ideasRestored: restoredCount,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Error restoring from backup:', error)

      return {
        success: false,
        backupId,
        recoveryId,
        timestamp: now,
        ideasRestored: 0,
        errors: [errorMsg],
      }
    }
  }

  /**
   * Restaurar tabla completa a un punto en el tiempo
   */
  async restoreToPointInTime(
    timestamp: string,
    userId: string
  ): Promise<RecoveryResult> {
    try {
      // Obtener auditoría hasta ese punto
      const startOfTime = '1970-01-01T00:00:00Z'
      const history = await this.auditEngine.getHistoryInRange(startOfTime, timestamp)

      if (history.length === 0) {
        return {
          success: false,
          backupId: 'point-in-time',
          recoveryId: this.generateId(),
          timestamp: new Date().toISOString(),
          ideasRestored: 0,
          errors: ['No history found before this timestamp'],
        }
      }

      // Reconstruir estado de tabla ideas en ese punto en el tiempo
      const ideas: Record<string, any> = {}

      for (const entry of history) {
        if (entry.tableName !== 'ideas') continue

        if (entry.operation === 'INSERT' && entry.newData) {
          ideas[entry.recordId] = entry.newData
        } else if (entry.operation === 'UPDATE' && entry.newData) {
          if (ideas[entry.recordId]) {
            ideas[entry.recordId] = { ...ideas[entry.recordId], ...entry.newData }
          }
        } else if (entry.operation === 'DELETE') {
          delete ideas[entry.recordId]
        }
      }

      // Pre-backup
      const preBackup = await this.backupEngine.createBackup()

      // Limpiar tabla ideas
      await this.localDb.execute('DELETE FROM ideas WHERE 1=1')

      // Restaurar snapshot reconstruido
      let restoredCount = 0
      for (const ideaData of Object.values(ideas)) {
        const idea = ideaData as any
        await this.localDb.execute(
          `INSERT INTO ideas (id, title, user_id, created_at, updated_at, deleted_at, version)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            idea.id,
            idea.title,
            idea.user_id,
            idea.created_at,
            idea.updated_at,
            idea.deleted_at || null,
            idea.version,
          ]
        )
        restoredCount++
      }

      return {
        success: true,
        backupId: 'point-in-time',
        recoveryId: this.generateId(),
        timestamp: new Date().toISOString(),
        ideasRestored: restoredCount,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        backupId: 'point-in-time',
        recoveryId: this.generateId(),
        timestamp: new Date().toISOString(),
        ideasRestored: 0,
        errors: [errorMsg],
      }
    }
  }

  /**
   * Restaurar un registro específico (idea) desde auditoría
   */
  async restoreRecord(
    tableName: string,
    recordId: string,
    toHistoryIndex: number,
    userId: string
  ): Promise<RecoveryResult> {
    try {
      // Obtener historial del registro
      const history = await this.auditEngine.getRecordHistory(tableName, recordId)

      if (history.length === 0) {
        return {
          success: false,
          backupId: `record-${recordId}`,
          recoveryId: this.generateId(),
          timestamp: new Date().toISOString(),
          ideasRestored: 0,
          errors: ['No history found for this record'],
        }
      }

      // Verificar índice válido
      if (toHistoryIndex < 0 || toHistoryIndex >= history.length) {
        return {
          success: false,
          backupId: `record-${recordId}`,
          recoveryId: this.generateId(),
          timestamp: new Date().toISOString(),
          ideasRestored: 0,
          errors: ['Invalid history index'],
        }
      }

      const targetState = history[toHistoryIndex]

      if (!targetState.newData) {
        // Fue eliminado
        await this.localDb.execute(`DELETE FROM ${tableName} WHERE id = ?`, [
          recordId,
        ])
      } else {
        // Restaurar estado
        const data = targetState.newData
        await this.localDb.execute(
          `UPDATE ${tableName} SET title = ?, user_id = ?, deleted_at = ? 
           WHERE id = ?`,
          [data.title, data.user_id, data.deleted_at || null, recordId]
        )
      }

      // Registrar en audit
      await this.auditEngine.recordChange(
        userId,
        '_recovery',
        'RESTORE',
        `${tableName}-${recordId}`,
        undefined,
        { recordRestored: true, toHistoryIndex }
      )

      return {
        success: true,
        backupId: `record-${recordId}`,
        recoveryId: this.generateId(),
        timestamp: new Date().toISOString(),
        ideasRestored: 1,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        backupId: `record-${recordId}`,
        recoveryId: this.generateId(),
        timestamp: new Date().toISOString(),
        ideasRestored: 0,
        errors: [errorMsg],
      }
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Crear instancia del recovery engine
 */
export function createRecoveryEngine(
  localDb: LocalDatabaseAdapter,
  backupEngine: BackupEngine,
  auditEngine: AuditLogEngine
): RecoveryEngine {
  return new RecoveryEngine(localDb, backupEngine, auditEngine)
}
