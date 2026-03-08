/**
 * Estrategia de aislamiento multi-usuario para BD local (SQLite)
 * 
 * DECISIÓN: Una sola BD, pero filtrada siempre por user_id
 * 
 * Razones:
 * ✅ Simpler que gestionar múltiples archivos de BD
 * ✅ Más rápido (1 índice vs múltiples archivos abiertos)
 * ✅ Migración de logout a login es instantánea
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Contexto de usuario para filtrado de BD
 * Debe estar disponible globalmente dentro de la app
 */
export interface UserDBContext {
  userId: string | null // null = offline anónimo
  email?: string
}

/**
 * Estado global de usuario para BD
 * Esto se actualiza cuando user inicia/cierra sesión
 */
let currentUserContext: UserDBContext = {
  userId: 'local-anonymous', // Offline = usuario anónimo
}

/**
 * Actualizar contexto cuando usuario inicia sesión
 */
export function setCurrentUserContext(context: UserDBContext): void {
  currentUserContext = {
    ...context,
    userId: context.userId || 'local-anonymous',
  }
}

/**
 * Obtener contexto actual
 */
export function getCurrentUserContext(): UserDBContext {
  return currentUserContext
}

/**
 * Limpiar contexto (para logout)
 */
export function clearUserContext(): void {
  currentUserContext = {
    userId: 'local-anonymous',
  }
}

/**
 * Validar si registro pertenece al usuario actual
 * Usar siempre antes de mostrar datos en UI
 */
export function validateRecordOwnership(
  recordUserId: string | null | undefined
): boolean {
  const context = getCurrentUserContext()
  
  // Si registro no tiene user_id, es de antes de auth
  if (!recordUserId) {
    return context.userId === 'local-anonymous'
  }

  // Validar que pertenece al usuario actual
  return recordUserId === context.userId
}

/**
 * Sanitizar query: agregar automáticamente filtro user_id
 * Para usar en sync-engine al hacer pull/push
 */
export function addUserIdFilter(
  query: SupabaseClient<any>,
  tableName: string
): SupabaseClient<any> {
  const context = getCurrentUserContext()
  return query.from(tableName).eq('user_id', context.userId)
}

/**
 * Preparar datos locales para inserción: agregar user_id automáticamente
 */
export function attachUserIdToRecord<T extends Record<string, any>>(
  record: T
): T & { user_id: string } {
  const context = getCurrentUserContext()
  return {
    ...record,
    user_id: context.userId,
  }
}

/**
 * Limpiar tabla local para usuario en logout
 * IMPORTANTE: Mantiene datos offline del usuario anterior por ahora
 * (O especificar en config si quieres wipe completo)
 */
export async function cleanupUserDataOnLogout(
  localDb: any,
  userId: string,
  options: { wipeAll?: boolean } = {}
): Promise<void> {
  if (options.wipeAll) {
    // ⚠️ SOLO SI LO QUIERES: limpiar todo
    // await localDb.execute('DELETE FROM ideas WHERE user_id = ?', [userId])
    // await localDb.execute('DELETE FROM _sync_queue WHERE ... user_id = ?', [userId])
  }

  // Por defecto: solo limpiar cola de sync pendiente (por seguridad)
  // No queremos que datos personales se sincronicen con otro usuario
  await localDb.execute('DELETE FROM _sync_queue WHERE user_id = ?', [userId])
}

/**
 * Validar que sync_queue solo envía datos del usuario actual
 */
export function validateSyncQueueOwnership(
  queueRecords: Array<{ user_id: string; [key: string]: any }>
): Array<{ user_id: string; [key: string]: any }> {
  const context = getCurrentUserContext()
  
  // Filtrar solo registros del usuario actual
  const filtered = queueRecords.filter(
    (record) => record.user_id === context.userId
  )

  if (filtered.length < queueRecords.length) {
    console.warn(
      `⚠️ Detected ${queueRecords.length - filtered.length} orphaned sync records from different user`
    )
  }

  return filtered
}
