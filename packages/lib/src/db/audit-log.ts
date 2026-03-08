/**
 * Audit Log - Registro de todos los cambios en la BD
 * 
 * Propósito:
 * 1. Rastrear qué cambió, cuándo, por quién
 * 2. Facilitar debugging y compliance
 * 3. Detectar cambios no autorizados
 * 4. Base para recovery granular
 */

import type { LocalDatabaseAdapter } from './local-db-adapter'

/**
 * Operación en audit log
 */
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE'

/**
 * Entrada de audit
 */
export interface AuditLogEntry {
  id: string
  timestamp: string // ISO
  userId: string
  tableName: string
  operation: AuditOperation
  recordId: string
  oldData?: Record<string, any> // null para INSERT
  newData?: Record<string, any> // null para DELETE
  changesSummary?: string
}

/**
 * Motor de auditoría
 */
export class AuditLogEngine {
  constructor(private localDb: LocalDatabaseAdapter) {}

  /**
   * Registrar un cambio en el audit log
   */
  async recordChange(
    userId: string,
    tableName: string,
    operation: AuditOperation,
    recordId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    try {
      const id = this.generateId()
      const now = new Date().toISOString()

      // Generar resumen de cambios
      const summary = this.generateChangeSummary(operation, oldData, newData)

      await this.localDb.execute(
        `INSERT INTO _audit_log 
         (id, timestamp, user_id, table_name, operation, record_id, old_data, new_data, changes_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          now,
          userId,
          tableName,
          operation,
          recordId,
          oldData ? JSON.stringify(oldData) : null,
          newData ? JSON.stringify(newData) : null,
          summary,
        ]
      )
    } catch (error) {
      console.error('Error recording audit log:', error)
      // No throwear para no romper la operación principal
    }
  }

  /**
   * Obtener auditoría de un registro específico
   */
  async getRecordHistory(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    try {
      const results = await this.localDb.query(
        `SELECT id, timestamp, user_id, table_name, operation, record_id, old_data, new_data, changes_summary
         FROM _audit_log
         WHERE table_name = ? AND record_id = ?
         ORDER BY timestamp ASC`,
        [tableName, recordId]
      )

      return (results || []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        tableName: r.table_name,
        operation: r.operation,
        recordId: r.record_id,
        oldData: r.old_data ? JSON.parse(r.old_data) : undefined,
        newData: r.new_data ? JSON.parse(r.new_data) : undefined,
        changesSummary: r.changes_summary,
      }))
    } catch (error) {
      console.error('Error getting record history:', error)
      return []
    }
  }

  /**
   * Obtener auditoría de un usuario
   */
  async getUserHistory(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const results = await this.localDb.query(
        `SELECT id, timestamp, user_id, table_name, operation, record_id, old_data, new_data, changes_summary
         FROM _audit_log
         WHERE user_id = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        [userId, limit]
      )

      return (results || []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        tableName: r.table_name,
        operation: r.operation,
        recordId: r.record_id,
        oldData: r.old_data ? JSON.parse(r.old_data) : undefined,
        newData: r.new_data ? JSON.parse(r.new_data) : undefined,
        changesSummary: r.changes_summary,
      }))
    } catch (error) {
      console.error('Error getting user history:', error)
      return []
    }
  }

  /**
   * Obtener auditoría en rango de tiempo
   */
  async getHistoryInRange(
    startTime: string,
    endTime: string,
    tableName?: string
  ): Promise<AuditLogEntry[]> {
    try {
      let query =
        `SELECT id, timestamp, user_id, table_name, operation, record_id, old_data, new_data, changes_summary
         FROM _audit_log
         WHERE timestamp BETWEEN ? AND ?`

      const params: any[] = [startTime, endTime]

      if (tableName) {
        query += ` AND table_name = ?`
        params.push(tableName)
      }

      query += ` ORDER BY timestamp DESC`

      const results = await this.localDb.query(query, params)

      return (results || []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        userId: r.user_id,
        tableName: r.table_name,
        operation: r.operation,
        recordId: r.record_id,
        oldData: r.old_data ? JSON.parse(r.old_data) : undefined,
        newData: r.new_data ? JSON.parse(r.new_data) : undefined,
        changesSummary: r.changes_summary,
      }))
    } catch (error) {
      console.error('Error getting history in range:', error)
      return []
    }
  }

  /**
   * Limpiar auditoría antigua (más de N días)
   */
  async cleanupOldAudit(daysToKeep: number = 90): Promise<number> {
    try {
      const result = await this.localDb.execute(
        `DELETE FROM _audit_log 
         WHERE timestamp < datetime('now', '-' || ? || ' days')`,
        [daysToKeep]
      )

      return result?.length || 0
    } catch (error) {
      console.error('Error cleaning audit log:', error)
      return 0
    }
  }

  /**
   * Contar cambios por usuario en periodo
   */
  async getChangesCountByUser(startTime: string, endTime: string): Promise<Record<string, number>> {
    try {
      const results = await this.localDb.query(
        `SELECT user_id, COUNT(*) as count
         FROM _audit_log
         WHERE timestamp BETWEEN ? AND ?
         GROUP BY user_id`,
        [startTime, endTime]
      )

      const counts: Record<string, number> = {}
      for (const row of results || []) {
        counts[row.user_id] = row.count
      }
      return counts
    } catch (error) {
      console.error('Error getting changes count:', error)
      return {}
    }
  }

  /**
   * Generar resumen de cambios (ej: "Título: 'Old' → 'New'")
   */
  private generateChangeSummary(
    operation: AuditOperation,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): string {
    if (operation === 'INSERT') {
      return `Created new record`
    }

    if (operation === 'DELETE') {
      return `Record deleted`
    }

    if (operation === 'RESTORE') {
      return `Record restored from backup`
    }

    // UPDATE
    if (oldData && newData) {
      const changes: string[] = []

      for (const key of Object.keys(newData)) {
        if (oldData[key] !== newData[key]) {
          const oldVal = this.formatValue(oldData[key])
          const newVal = this.formatValue(newData[key])
          changes.push(`${key}: '${oldVal}' → '${newVal}'`)
        }
      }

      return changes.length > 0 ? changes.join('; ') : 'No changes detected'
    }

    return 'Unknown change'
  }

  /**
   * Formatear valor para display
   */
  private formatValue(val: any): string {
    if (val === null || val === undefined) return 'null'
    if (typeof val === 'string') return val.substring(0, 50)
    if (typeof val === 'boolean') return val ? 'true' : 'false'
    return String(val).substring(0, 50)
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Crear instancia del audit log engine
 */
export function createAuditLogEngine(localDb: LocalDatabaseAdapter): AuditLogEngine {
  return new AuditLogEngine(localDb)
}
