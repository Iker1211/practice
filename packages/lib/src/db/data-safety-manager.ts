/**
 * Data Safety Manager - Orquestador de backups, auditoría y recuperación
 * 
 * Unifica backup-engine, audit-log y recovery-engine en una interfaz simple
 */

import type { LocalDatabaseAdapter } from './local-db-adapter'
import { BackupEngine, createBackupEngine, type BackupMetadata } from './backup-engine'
import { AuditLogEngine, createAuditLogEngine, type AuditLogEntry } from './audit-log'
import { RecoveryEngine, createRecoveryEngine, type RecoveryResult } from './recovery-engine'

/**
 * Estado de la capa de seguridad de datos
 */
export interface DataSafetyStatus {
  lastBackup: BackupMetadata | null
  backupCount: number
  totalBackupSize: number
  lastBackupAge: string // "2 hours ago", "1 day ago", etc
  autoBackupEnabled: boolean
  auditLogSize: number
}

/**
 * Manager de Data Safety
 */
export class DataSafetyManager {
  private backup: BackupEngine
  private audit: AuditLogEngine
  private recovery: RecoveryEngine
  private autoBackupInterval: NodeJS.Timeout | null = null

  constructor(private localDb: LocalDatabaseAdapter) {
    this.backup = createBackupEngine(localDb)
    this.audit = createAuditLogEngine(localDb)
    this.recovery = createRecoveryEngine(localDb, this.backup, this.audit)
  }

  /**
   * Inicializar auto-backup (ejecutar en background)
   */
  startAutoBackup(intervalMs: number = 24 * 60 * 60 * 1000): void {
    if (this.autoBackupInterval) return

    console.log('🔄 Starting auto-backup scheduler')

    // Primera ejecución inmediatamente
    this.performAutoBackup().catch((err) => console.error('Auto-backup failed:', err))

    // Luego cada X ms
    this.autoBackupInterval = setInterval(
      () => {
        this.performAutoBackup().catch((err) => console.error('Auto-backup failed:', err))
      },
      intervalMs
    )
  }

  /**
   * Detener auto-backup
   */
  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval)
      this.autoBackupInterval = null
      console.log('⏹️ Auto-backup scheduler stopped')
    }
  }

  /**
   * Ejecutar backup automático internal
   */
  private async performAutoBackup(): Promise<void> {
    const result = await this.backup.autoBackup({
      keepCount: 7,
      onlyIfNotRecent: true,
    })

    if (result) {
      console.log(`✅ Auto-backup completed: ${result.ideaCount} ideas`)
    }
  }

  /**
   * Obtener estado actual de data safety
   */
  async getStatus(): Promise<DataSafetyStatus> {
    const backups = await this.backup.listBackups(1)
    const lastBackup = backups.length > 0 ? backups[0] : null
    const allBackups = await this.backup.listBackups(100)
    const totalSize = await this.backup.getTotalBackupSize()

    // Calcular edad del último backup
    let lastBackupAge = 'Never'
    if (lastBackup) {
      const now = new Date()
      const backupTime = new Date(lastBackup.timestamp)
      const diffMs = now.getTime() - backupTime.getTime()

      if (diffMs < 60 * 1000) {
        lastBackupAge = 'Just now'
      } else if (diffMs < 60 * 60 * 1000) {
        const mins = Math.floor(diffMs / (60 * 1000))
        lastBackupAge = `${mins} minute${mins > 1 ? 's' : ''} ago`
      } else if (diffMs < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diffMs / (60 * 60 * 1000))
        lastBackupAge = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else {
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
        lastBackupAge = `${days} day${days > 1 ? 's' : ''} ago`
      }
    }

    return {
      lastBackup,
      backupCount: allBackups.length,
      totalBackupSize: totalSize,
      lastBackupAge,
      autoBackupEnabled: this.autoBackupInterval !== null,
      auditLogSize: 0, // TODO: implement
    }
  }

  /**
   * Crear backup manual
   */
  async createManualBackup(userId: string): Promise<BackupMetadata> {
    const backup = await this.backup.createBackup()

    // Registrar en audit
    await this.audit.recordChange(
      userId,
      '_backup',
      'INSERT',
      backup.id,
      undefined,
      {
        backupId: backup.id,
        ideaCount: backup.ideaCount,
      }
    )

    return backup
  }

  /**
   * Listar todos los backups
   */
  async listBackups(limit: number = 10): Promise<BackupMetadata[]> {
    return this.backup.listBackups(limit)
  }

  /**
   * Restaurar desde backup (con confirmación implicada)
   */
  async restoreFromBackup(backupId: string, userId: string): Promise<RecoveryResult> {
    return this.recovery.restoreFromBackup(backupId, userId, {
      createPreRestoreBackup: true,
      mergeIfConflict: false,
    })
  }

  /**
   * Obtener historial de un registro
   */
  async getRecordHistory(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    return this.audit.getRecordHistory(tableName, recordId)
  }

  /**
   * Obtener historial de un usuario
   */
  async getUserHistory(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.audit.getUserHistory(userId, limit)
  }

  /**
   * Registrar cambio en auditoría (llamar desde DualDatabaseManager)
   */
  async recordChange(
    userId: string,
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    await this.audit.recordChange(userId, tableName, operation, recordId, oldData, newData)
  }

  /**
   * Limpiar datos antiguos (backups + auditoría)
   */
  async cleanup(options: { keepBackups?: number; auditDaysToKeep?: number } = {}): Promise<void> {
    const { keepBackups = 7, auditDaysToKeep = 90 } = options

    const deletedBackups = await this.backup.cleanupOldBackups(keepBackups)
    const deletedAudit = await this.audit.cleanupOldAudit(auditDaysToKeep)

    console.log(
      `🗑️ Cleanup: ${deletedBackups} old backups deleted, ${deletedAudit} audit entries deleted`
    )
  }
}

/**
 * Crear instancia del data safety manager
 */
export function createDataSafetyManager(localDb: LocalDatabaseAdapter): DataSafetyManager {
  return new DataSafetyManager(localDb)
}

// Re-exportar tipos para facilidad
export type { BackupMetadata, BackupData } from './backup-engine'
export type { AuditLogEntry, AuditOperation } from './audit-log'
export type { RecoveryResult } from './recovery-engine'
