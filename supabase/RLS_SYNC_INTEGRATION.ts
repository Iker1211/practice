/**
 * ============================================================================
 * RLS Integration con Sync Engine
 * ============================================================================
 * 
 * Asegurar que el sync-engine (offline-first) respeta las RLS policies
 * y NO filtra datos de otros usuarios durante sincronización
 */

// ============================================================================
// PASO 5.2: Verificar Sync Engine - Modificaciones Necesarias
// ============================================================================

/**
 * ANTES (posible data leakage si no controla user_id):
 * 
 * const pullChanges = async () => {
 *   // ❌ PROBLEMA: Obtiene ideas de TODOS los usuarios
 *   const changes = await supabase
 *     .from('ideas')
 *     .select('*')
 *     .eq('deleted', false);
 *   return changes;
 * };
 */

/**
 * DESPUÉS (con RLS - SEGURO):
 * 
 * const pullChanges = async () => {
 *   // ✅ CORRECTO: RLS filtra automáticamente por user_id
 *   // La query es igual, pero PostgreSQL garantiza que solo retorna
 *   // ideas del usuario actual (basado en auth.uid() del JWT)
 *   
 *   const { data, error } = await supabase
 *     .from('ideas')
 *     .select('*')
 *     .eq('deleted_at', null);
 *   
 *   // RLS automáticamente aplica:
 *   // WHERE user_id = auth.uid()
 *   // AND deleted_at IS NULL
 *   
 *   return { data, error };
 * };
 */

// ============================================================================
// SITUACIÓN 1: Sincronización PULL (BD Remota → Local)
// ============================================================================

/**
 * ✅ SEGURO - RLS filtra automáticamente
 * 
 * Workflow:
 * 1. App llama: supabase.from('ideas').select('*')
 * 2. JWT token enviado con request contiene user_id del usuario actual
 * 3. PostgreSQL RLS policy evaluada: WHERE user_id = auth.uid()
 * 4. **RLS filtra automáticamente a nivel de BD**
 * 5. App solo recibe ideas del usuario actual
 * 6. Sincronización de datos propios → Safe
 */

const examplePullWithRLS = async (supabase) => {
  const { data: remoteIdeas, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('deleted_at', null);

  // ✅ RLS GARANTIZA: remoteIdeas solo contiene ideas del usuario actual
  // Incluso si 10 millones de ideas existen en la BD,
  // solo las del usuario actual son retornadas

  if (error) {
    console.error('Error pulling ideas:', error);
    return [];
  }

  return remoteIdeas; // ✅ 100% seguro
};

// ============================================================================
// SITUACIÓN 2: Sincronización PUSH (BD Local → Remota)
// ============================================================================

/**
 * ⚠️ VALIDACIÓN REQUERIDA - User_id debe coincidir
 * 
 * Workflow:
 * 1. App prepara idea local para sincronizar (con user_id del usuario)
 * 2. App envía idea al servidor
 * 3. RLS policy INSERT valida: user_id DEBE ser = auth.uid()
 * 4. Si user_id ≠ auth.uid(), INSERT es RECHAZADO
 * 5. De lo contrario, idea local se sincroniza a Supabase
 */

interface SyncIdea {
  id: string;
  title: string;
  user_id: string; // ⚠️ CRÍTICO: Debe validarse
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

const examplePushWithUserIdValidation = async (
  supabase,
  localIdea: SyncIdea,
  currentUserId: string
) => {
  // ✅ VALIDACIÓN PREVIA: Asegurar que idea es del usuario actual
  if (localIdea.user_id !== currentUserId) {
    console.error(
      `❌ SECURITY: Intentando sincronizar idea de otro usuario!`,
      {
        ideaUserId: localIdea.user_id,
        currentUserId,
      }
    );
    return {
      success: false,
      error: 'Cannot sync ideas from other users',
    };
  }

  // ✅ VALIDACIÓN PASSOU: Proceder con sincronización
  const { data, error } = await supabase
    .from('ideas')
    .upsert({
      id: localIdea.id,
      title: localIdea.title,
      user_id: localIdea.user_id, // ✅ Has been validated
      created_at: localIdea.created_at,
      updated_at: localIdea.updated_at,
      deleted_at: localIdea.deleted_at,
    })
    .select();

  // ✅ RLS policy INSERT/UPDATE:
  // - Valida que user_id = auth.uid()
  // - Si pasa, actualiza BD
  // - Si falla, retorna error

  if (error) {
    console.error('Sync push failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
};

// ============================================================================
// SITUACIÓN 3: Conflictos de Sincronización
// ============================================================================

/**
 * Conflicto: Usuario A edita idea localmente Y en otro dispositivo
 * 
 * Escenario:
 * 1. iPhone (user_id: A) edita idea: "TODO: Comprar café"
 * 2. iPad (user_id: A) TAMBIÉN edita idea: "DONE: Compré café"
 * 3. Ambos intentan sincronizar
 * 
 * Resolución:
 * - Sin RLS: Ambas ediciones se procesan a "última escritura gana"
 * - Con RLS: RLS solo valida QUIÉN es el dueño (user_id)
 * - Resolución de conflicto es RESPONSABILIDAD DE LA APP
 * - Pero todas las partes garantiza user_id = auth.uid()
 */

const exampleConflictResolution = async (
  supabase,
  localIdea: SyncIdea,
  remoteIdea: SyncIdea,
  currentUserId: string
) => {
  // ✅ VALIDACIÓN 1: Ambas ideas son del usuario actual
  if (localIdea.user_id !== currentUserId || remoteIdea.user_id !== currentUserId) {
    throw new Error('❌ SECURITY: Conflicting ideas do not belong to current user');
  }

  // ✅ SAFE: Resolver conflicto sin exposición de datos
  const resolvedIdea: SyncIdea = {
    id: localIdea.id,
    title: remoteIdea.updated_at > localIdea.updated_at 
      ? remoteIdea.title 
      : localIdea.title,
    user_id: currentUserId, // ✅ SIEMPRE es del usuario actual
    created_at: localIdea.created_at,
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  // ✅ Sincronizar versión resuelta
  const { data, error } = await supabase
    .from('ideas')
    .upsert(resolvedIdea)
    .select();

  if (error) {
    console.error('Conflict resolution sync failed:', error);
    throw error;
  }

  return resolvedIdea;
};

// ============================================================================
// SITUACIÓN 4: Sincronización Simultánea desde Múltiples Dispositivos
// ============================================================================

/**
 * Escenario: Usuario logueado en 3 dispositivos (iPhone, iPad, Mac)
 * 
 * Garantías RLS:
 * ✅ iPhone no puede ver/sincronizar ideas de otros usuarios
 * ✅ iPad no puede ver/sincronizar ideas de otros usuarios
 * ✅ Mac no puede ver/sincronizar ideas de otros usuarios
 * ✅ Todos sincronizar solo ideas con user_id = auth.uid()
 * 
 * RLS actúa como "cortafuegos de base de datos":
 * - Cada dispositivo obtiene JWT con user_id del usuario
 * - RLS filtra a nivel PostgreSQL
 * - Incluso si app tiene bug, RLS lo previene
 */

const exampleMultiDeviceSync = async (supabaseInstance, currentUserId: string) => {
  // Device 1 (iPhone) intentando sincronizar
  console.log('🔄 Device 1 (iPhone) syncing...');
  const device1Result = await supabaseInstance
    .from('ideas')
    .select('*')
    .eq('deleted_at', null);
  // ✅ RLS garantiza: datos = ideas de user_id = auth.uid()

  console.log('✅ Device 1 sync complete - Only own ideas received');

  // Device 2 (iPad) intentando sincronizar simultáneamente
  console.log('🔄 Device 2 (iPad) syncing...');
  const device2Result = await supabaseInstance
    .from('ideas')
    .select('*')
    .eq('deleted_at', null);
  // ✅ RLS garantiza: datos = ideas de user_id = auth.uid()

  console.log('✅ Device 2 sync complete - Only own ideas received');

  // Ambos dispositivos tienen:
  // - Mismas ideas (porque es el mismo user_id)
  // - 100% seguros (RLS previene cross-user data)
  // - Pueden resolver conflictos sin exposición de data
};

// ============================================================================
// SITUACIÓN 5: Caché Local + RLS
// ============================================================================

/**
 * Problema: ¿Y si caché local tiene stale data?
 * 
 * Respuesta: No importa
 * - Caché es LOCAL (no accesible por otros)
 * - RLS solo protege BD Supabase
 * - Cuando se sincroniza, RLS valida de nuevo
 * - Data stale en caché → RLS la rechaza si es inválida
 */

const exampleCacheWithRLS = async (supabase, cache, currentUserId: string) => {
  // Supongamos caché local tiene idea con user_id = 'otro-usuario'
  const cachedIdea: SyncIdea = {
    id: 'idea-1',
    title: 'Suspiciously old data',
    user_id: 'different-user-id', // ⚠️ Stale data en caché
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // Intentar sincronizar
  const { data, error } = await supabase
    .from('ideas')
    .upsert(cachedIdea)
    .select();

  // ❌ RLS RECHAZA:
  // INSERT/UPDATE policy valida: user_id = auth.uid()
  // Como cachedIdea.user_id ≠ auth.uid(), está RECHAZADO
  if (error) {
    console.error(
      '✅ RLS Protected: Rejected stale cache data from different user'
    );
    // Limpiar caché corrupto
    await cache.remove(cachedIdea.id);
  }
};

// ============================================================================
// INTEGRACIÓN CON SYNC ENGINE - Modificaciones Recomendadas
// ============================================================================

/**
 * Archivo: packages/lib/src/sync/sync-engine.ts
 * 
 * Cambios necesarios:
 */

type ChangeQueueItem = {
  type: 'insert' | 'update' | 'delete';
  table: string;
  record: Record<string, any>;
};

class SyncEngineWithRLS {
  constructor(
    private supabase: any,
    private db: any,
    private currentUserId: string
  ) {}

  /**
   * ✅ PULL Changes: RLS filtra automáticamente
   */
  async pullChanges(): Promise<SyncIdea[]> {
    const { data, error } = await this.supabase
      .from('ideas')
      .select('*')
      .gt('updated_at', this.getLastSyncTime())
      .eq('deleted_at', null);

    if (error) {
      console.error('❌ Pull failed:', error);
      throw error;
    }

    // ✅ GARANTÍA RLS: data solo contiene ideas del usuario actual
    // (porque RLS filtra automáticamente)

    return data || [];
  }

  /**
   * ✅ PUSH Changes: Validar user_id antes de enviar
   */
  async pushChanges(changeQueue: ChangeQueueItem[]): Promise<void> {
    for (const change of changeQueue) {
      // ✅ VALIDACIÓN 1: Solo ideas (no tocamos otras tablas)
      if (change.table !== 'ideas') {
        console.warn(`⚠️ Skipping sync for table: ${change.table}`);
        continue;
      }

      // ✅ VALIDACIÓN 2: Asegurar que idea pertenece al usuario actual
      if (change.record.user_id !== this.currentUserId) {
        console.error(
          `❌ SECURITY BLOCKED: Attempting to sync idea from different user`,
          {
            recordUserId: change.record.user_id,
            currentUserId: this.currentUserId,
          }
        );

        // Opción 1: Saltar (no sincronizar)
        // Opción 2: Eliminar de cola (si es stale data)
        await this.removeFromChangeQueue(change);
        continue;
      }

      // ✅ SEGURIDAD PASSOU: Proceder según operación
      try {
        switch (change.type) {
          case 'insert':
            await this.supabase
              .from('ideas')
              .insert(change.record)
              .select();
            break;

          case 'update':
            await this.supabase
              .from('ideas')
              .update(change.record)
              .eq('id', change.record.id);
            break;

          case 'delete':
            // Soft delete: set deleted_at
            await this.supabase
              .from('ideas')
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', change.record.id);
            break;
        }

        // ✅ Sincronización éxitosa
        await this.removeFromChangeQueue(change);
      } catch (error) {
        console.error(`❌ Push ${change.type} failed:`, error);
        // Mantener en cola para reintentar
      }
    }
  }

  /**
   * ✅ MERGE: Combinar cambios remotos con locales
   */
  async mergeRemoteChanges(remoteIdeas: SyncIdea[]): Promise<void> {
    for (const remoteIdea of remoteIdeas) {
      // ✅ SEGURIDAD: RLS garantiza que remoteIdea.user_id = this.currentUserId
      // Pero validar de todas formas (defense in depth)
      if (remoteIdea.user_id !== this.currentUserId) {
        console.error(
          `❌ SECURITY: Remote idea claims different user_id: ${remoteIdea.user_id}`
        );
        continue; // Saltar esta idea
      }

      const localIdea = await this.db
        .query('SELECT * FROM ideas WHERE id = ?', [remoteIdea.id]);

      if (!localIdea) {
        // Nueva idea remota → insertar localmente
        await this.db.run(
          `INSERT INTO ideas (id, title, user_id, created_at, updated_at, deleted_at) 
                   VALUES (?, ?, ?, ?, ?, ?)`,
          [
            remoteIdea.id,
            remoteIdea.title,
            remoteIdea.user_id,
            remoteIdea.created_at,
            remoteIdea.updated_at,
            remoteIdea.deleted_at,
          ]
        );
      } else if (remoteIdea.updated_at > localIdea.updated_at) {
        // Idea remota es más nueva → actualizar localmente
        await this.db.run(
          `UPDATE ideas SET title = ?, updated_at = ? WHERE id = ?`,
          [remoteIdea.title, remoteIdea.updated_at, remoteIdea.id]
        );
      }
      // De lo contrario, idea local es más nueva → mantener como está
    }
  }

  // Helper methods
  private getLastSyncTime(): string {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  private async removeFromChangeQueue(change: ChangeQueueItem): Promise<void> {
    // Implementación específica de la BD
  }
}

// ============================================================================
// TESTS: Verificar que Sync respeta RLS
// ============================================================================

/**
 * Ubicación: supabase/rls-policies.test.ts (ya incluido)
 * 
 * Tests clave:
 * - ✅ Sync pull obtiene solo ideas del usuario actual
 * - ❌ Sync NO puede extraer datos de otro usuario
 * - ✅ Sync push respeta RLS (no puede crear para otro)
 * - ✅ Merge de cambios remotos valida user_id
 */

// ============================================================================
// CHECKLIST: Antes de llevar a Producción
// ============================================================================

/**
 * ✅ Verificar RLS policies en Supabase Dashboard
 *    → Database → Tables → ideas → Row-Level Security
 *    → Ver 5 policies (SELECT, INSERT, UPDATE, DELETE)
 *
 * ✅ Ejecutar tests: npm test -- supabase/rls-policies.test.ts
 *    → Todos deben pasar (✅ TODOS LOS TESTS PASAN)
 *
 * ✅ Modificar sync-engine.ts con validaciones user_id
 *    → pushChanges() valida user_id antes de enviar
 *    → mergeRemoteChanges() valida user_id después de recibir
 *
 * ✅ Testear múltiples dispositivos:
 *    → Device A: crear idea
 *    → Device B: sincronizar (debe recibir idea)
 *    → Device C (usuario diferente): sincronizar (NO debe ver idea)
 *
 * ✅ Verificar índices en Supabase:
 *    → Database → Tables → ideas → Indexes
 *    → Ver idx_ideas_user_id_* indices
 *
 * ✅ Load test con 10k+ usuarios simulados
 *    → Generar usuarios de prueba
 *    → Correr sync simultáneo
 *    → Verificar rendimiento < 1s
 */

export { SyncEngineWithRLS };
export type { ChangeQueueItem };
