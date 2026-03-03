# Análisis Exhaustivo del Sistema de Sincronización Dual

**Fecha:** 28 de Febrero, 2026  
**Autor:** Sistema de Análisis Automático  
**Estado:** 🔴 REQUIERE VALIDACIÓN INMEDIATA

---

## RESUMEN EJECUTIVO

Se ha implementado un sistema de sincronización **offline-first** entre SQLite local (mobile/desktop) y Supabase (cloud). Sin embargo, existen **discrepancias críticas** en la arquitectura que podrían comprometer la integridad de datos.

**Problemas Identificados:**
- ⚠️ **CRÍTICO**: Schema mismatch entre SQLite y Supabase
- ⚠️ **CRÍTICO**: Falta validación de integridad referencial
- ⚠️ **ALTO**: Resolución de conflictos incompleta
- ⚠️ **ALTO**: No hay mecanismo de consistencia eventual garantizada

---

## 1. ARQUITECTURA ACTUAL

### 1.1 Componentes Clave

```
┌─────────────────────────────────────────────────────────┐
│                    IdeaRepository                        │
│  (Interfaz unificada: Supabase | SQLite | Dual)         │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
    ┌────────▼────────┐         ┌────────▼────────┐
    │ DualDBManager   │         │ SyncEngine      │
    │ (Coordinator)   │         │ (Push/Pull/Merge)
    └────┬────────┬───┘         └────────────────┘
         │        │
    ┌────▼───┐  ┌─▼──────────┐
    │ SQLite │  │  Supabase  │
    │ Local  │  │  Remote    │
    └────────┘  └────────────┘
```

### 1.2 Flujo de Sincronización

```
User Action → IdeaRepository.create(title)
                    ↓
            DualDatabaseManager.write()
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    writeLocal()      recordChange() → SyncEngine
         ↓                     ↓
    SQLite             _sync_queue table
    local              (pendiente)
         ↓                     ↓
    ← ← ← ← ← ← ← ← ← ← ← ← ←
         Auto-sync every 5s
         ↓
    pushChanges() (upload to Supabase)
         ↓
    pullChanges() (download from Supabase)
         ↓
    resolveConflicts() if exists
```

---

## 2. ANÁLISIS DE SCHEMA

### 2.1 Tabla: `ideas`

#### SQLite Local (Migration #1-4)
```typescript
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,                          // UUID
  title TEXT NOT NULL,                          // Idea title
  created_at TEXT NOT NULL,                     // ISO 8601
  updated_at TEXT NOT NULL,                     // ISO 8601
  deleted_at TEXT,                              // ISO 8601 (soft delete)
  version INTEGER NOT NULL DEFAULT 1,           // Optimistic locking
  _local_changes TEXT DEFAULT '{}',             // Previous value (JSON)
  _sync_status TEXT DEFAULT 'synced',           // 'synced'|'pending'|'conflicted'
  _remote_version INTEGER DEFAULT 0,            // For conflict detection
  _last_synced_at TEXT,                         // Last successful sync
  user_id TEXT DEFAULT 'local-user'             // Row Level Security
)
```

**Índices:**
- `idx_ideas_deleted_at`
- `idx_ideas_created_at`
- `idx_ideas_updated_at`
- `idx_ideas_sync_status`
- `idx_ideas_user_id`

#### Supabase Remote (RLS Policies + manual schema)
```sql
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY,                          -- Changed to UUID type!
  title VARCHAR,                                -- ⚠️ VARCHAR instead of TEXT
  summary_text VARCHAR,                         -- Additional field?
  created_at TIMESTAMPTZ,                       -- ⚠️ TIMESTAMPTZ not TEXT
  updated_at TIMESTAMPTZ,                       -- ⚠️ TIMESTAMPTZ not TEXT
  deleted_at TEXT,                              -- Mixed type?
  version INTEGER DEFAULT 1,                    -- Match
  user_id TEXT DEFAULT 'local-user',            -- Match
  _sync_status TEXT,                            -- Not in remote schema?
  _remote_version INTEGER,                      -- Not in remote schema?
  _last_synced_at TEXT                          -- Not in remote schema?
)
```

**🔴 PROBLEMA CRÍTICO #1: Schema Mismatch**
| Campo | SQLite | Supabase | Sincronizable | 
|-------|--------|----------|---------------|
| `id` | TEXT | UUID | ❌ NO (type mismatch) |
| `title` | TEXT | VARCHAR | ✅ Compatible pero inconsistente |
| `summary_text` | - | VARCHAR | ❌ No existe en local |
| `created_at` | TEXT (ISO) | TIMESTAMPTZ | ⚠️ Conversion needed |
| `_sync_status` | TEXT | - | ❌ No existe en remote |
| `version` | INTEGER | INTEGER | ✅ OK |
| `user_id` | TEXT | TEXT | ✅ OK |

### 2.2 Tabla: `audit_log`

#### SQLite (Migration #4)
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,                      -- 'INSERT'|'UPDATE'|'DELETE'
  record_id TEXT NOT NULL,
  old_data TEXT,                                -- JSON
  new_data TEXT,                                -- JSON
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

#### Supabase (From schema explorer)
```sql
CREATE TABLE audit_log (
  id TEXT,
  user_id TEXT,
  table_name TEXT,
  operation TEXT,
  record_id TEXT,
  old_data JSONB,                               -- ⚠️ JSONB not TEXT
  new_data JSONB,                               -- ⚠️ JSONB not TEXT
  created_at TIMESTAMP                          -- ⚠️ TIMESTAMP not TEXT
)
```

**⚠️ PROBLEMA #2: Type Inconsistencies**
- `old_data`/`new_data`: TEXT vs JSONB (minor, but serialization handling unclear)
- `created_at`: TEXT vs TIMESTAMP (timestamp handling in sync)

### 2.3 Tabla: `_sync_queue`

#### SQLite (Migration #3)
```sql
CREATE TABLE _sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL,                           -- JSON
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0
)
```

**Status:** ✅ LOCAL ONLY (not synchronized to Supabase)

---

## 3. ANÁLISIS DE SINCRONIZACIÓN

### 3.1 Push Changes (Local → Remote)

**Current Implementation:**
```typescript
async pushItem(item: SyncQueueItem): Promise<void> {
  const { operation, recordId, data } = item
  const { data: { user } } = await this.remoteDb.auth.getUser()
  
  // Validate user_id (RLS check)
  if (data.user_id !== user?.id) {
    throw new Error("Security violation")
  }
  
  switch (operation) {
    case 'INSERT' | 'UPDATE':
      await this.remoteDb.from('ideas').upsert(data)
    case 'DELETE':
      await this.remoteDb.from('ideas')
        .update({ deleted_at: now })
        .eq('id', recordId)
        .eq('user_id', user?.id)
  }
}
```

**⚠️ PROBLEMAS EN PUSH:**

1. **Type Casting Implicit** (🔴 CRÍTICO)
   ```typescript
   // SQLite stores: id "abc-123" (TEXT)
   // Sends to Supabase with id type UUID
   // PostgreSQL implicit cast may fail
   upsert({ id: "abc-123", ... }) // ← id should be UUID
   ```

2. **Timestamp Format Mismatch** (🟠 ALTO)
   ```typescript
   // SQLite: "2026-02-28T10:30:45.123Z"
   // Supabase expects: ISO 8601 or TIMESTAMPTZ
   // If not converted, may silently fail
   ```

3. **Falta de validación** (⚠️ MEDIO)
   - No verifica que `data` contiene todos los campos requeridos
   - No usa transactions en SQLite
   - No hace rollback si Supabase falla

### 3.2 Pull Changes (Remote → Local)

**Current Implementation:**
```typescript
async pullChanges(): Promise<void> {
  const lastSync = await this.getLastSyncTime()
  const { data, error } = await this.remoteDb
    .from('ideas')
    .select('*')
    .is('deleted_at', null)
    .gte('updated_at', lastSync.toISOString())
  
  for (const record of data) {
    await this.mergeRemoteRecord('ideas', record)
  }
}
```

**⚠️ PROBLEMAS EN PULL:**

1. **Timestamp Comparison Bug** (🔴 CRÍTICO)
   ```typescript
   // Supabase: updated_at = TIMESTAMPTZ ("2026-02-28T10:30:45+00:00")
   // lastSync = Date (local timezone)
   // .toISOString() might not match exactly
   // RESULT: May miss updates or pull duplicates
   ```

2. **Falta de filtrado por user_id** (🔴 CRÍTICO)
   ```sql
   -- Current:
   SELECT * FROM ideas WHERE deleted_at IS NULL AND updated_at >= ?
   
   -- Should be:
   SELECT * FROM ideas 
   WHERE user_id = ? AND deleted_at IS NULL AND updated_at >= ?
   ```
   **Result:** Podría intentar descargar ideas de otros usuarios (aunque RLS lo bloquea en Supabase)

3. **No maneja errors parciales** (🟠 ALTO)
   - Si una actualización falla a mitad de la descarga, estado inconsistente

### 3.3 Merge Remote Record

**Current Implementation:**
```typescript
async mergeRemoteRecord(tableName, remoteRecord) {
  const localRecord = await this.localDb.query(
    `SELECT * FROM ${tableName} WHERE id = ?`,
    [id]
  )
  
  if (!localRecord) {
    // Insert remoto
  } else if (localRecord._sync_status === 'pending' && 
             localRecord.updated_at !== remoteRecord.updated_at) {
    // CONFLICTO
    const resolution = await this.resolveConflict(conflict)
    if (resolution === 'remote') {
      await this.updateRecord(tableName, remoteRecord)
    }
  } else if (remoteRecord.updated_at > localRecord.updated_at) {
    // Remote es más nuevo
    await this.updateRecord(tableName, remoteRecord)
  }
}
```

**⚠️ PROBLEMAS EN MERGE:**

1. **Timestamp Comparison frágil** (🔴 CRÍTICO)
   ```typescript
   // Si remoteRecord.updated_at = "2026-02-28T10:30:45.000Z"
   // Y localRecord.updated_at = "2026-02-28T10:30:45.123Z"
   // Comparación: "...000Z" > "...123Z" ← FALSE!
   // RESULT: Descarta cambios locales válidos
   ```

2. **No detecta modificación simultánea** (🟠 ALTO)
   ```typescript
   // Si ambos han modificado pero remote fue primero:
   // localRecord._sync_status = 'synced' (no pending)
   // remoteRecord.updated_at = "10:30:45"
   // localRecord.updated_at = "10:30:40"
   // → Sobrescribe cambios locales sin conflicto
   ```

3. **No maneja deletions** (🟠 ALTO)
   - Pull solo descarga `WHERE deleted_at IS NULL`
   - Si remoto se borra, nunca se propaga al local

---

## 4. MATRIZ DE VALIDACIÓN

### 4.1 Integridad de Datos

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Schema consisten | ❌ NO | Type mismatch en `id`, `created_at` |
| Timestamps sincronizados | ⚠️ PARCIAL | Comparación manual, sin TZ awareness |
| User isolation guaranteed | ✅ SÍ | RLS + user_id validation en sync |
| Conflictos detectados | ⚠️ PARCIAL | Solo si `_sync_status='pending'` |
| Transacciones ACID | ❌ NO | Operaciones individuales sin TX scope |
| Retry logic | ✅ SÍ | retry_count en _sync_queue |
| Offline capability | ✅ SÍ | Lee/escribe local, sincroniza después |

### 4.2 Escenarios de Sincronización

#### Escenario 1: Crear idea offline

```
1. User crea idea "ML Frameworks"
   → IdeaRepository.create()
   → DualDBManager.write() → SQLite
   → SyncEngine.recordChange() → _sync_queue
   
2. Código añade a _sync_queue:
   { id: "idea-1", operation: 'INSERT', data: { id, title, user_id, ... } }
   
3. Auto-sync activa en 5s:
   → pushItem("idea-1") 
   → Supabase.upsert()
   → Marca synced_at
   
❌ PROBLEMA: Si timestamp formats NO match, INSERT falla
```

#### Escenario 2: Actualizar idea online

```
1. User actualiza "ML Frameworks" → "Deep Learning Frameworks"
   → SQLite UPDATE
   → Marca _sync_status='pending'
   → pushItem() → Supabase UPDATE
   
2. Otro usuario actualiza desde web (push notification needed!)
   → No hay mecanismo de suscripción
   → Client no se entera del cambio
   → Pull solo ocurre cada 5s
   
❌ PROBLEMA: No hay real-time updates
```

#### Escenario 3: Conflicto simultáneo

```
USER A: Offline -> Edita idea "API Design" → "REST API Design"
USER B: Online -> Edita misma idea → "GraphQL API Design"

Timeline:
- 0s: USER A desconecta, edita local
- 2s: USER B actualiza en Supabase (updated_at: 10:30:45)
- 5s: USER A se conecta, auto-sync inicia
- 5s: pullChanges() descarga cambios de USER B
- 5s: mergeRemoteRecord() compara timestamps
  - local.updated_at (cuando USER A editó)
  - remote.updated_at = 10:30:45 (cuando USER B editó)
  - ¿Cuál es más nuevo?
  
❌ PROBLEMA: Sin server timestamp, no se sabe orden real
          Sin RLS en audit_log, conflictos no son detectables
```

#### Escenario 4: Delete y sync

```
1. User borra idea (soft delete)
   → UPDATE ideas SET deleted_at = now()
   → Marca como pending
   
2. pushItem() ejecuta:
   UPDATE ideas SET deleted_at = ? WHERE id = ? AND user_id = ?
   
3. pullChanges() trae:
   SELECT * FROM ideas WHERE deleted_at IS NULL
   → La idea borrada NO se descarga
   → Pero local aún la tiene (deleted_at != null)
   
❌ PROBLEMA: Nunca se sincroniza deleted_at en pull
            Status local: INCONSISTENTE
```

---

## 5. PROBLEMAS CRÍTICOS IDENTIFICADOS

### P1: Schema Type Mismatch (🔴 CRÍTICO)

**Problema:**
- SQLite: `id TEXT`, `created_at TEXT`, `_sync_status TEXT`
- Supabase: `id UUID`, `created_at TIMESTAMPTZ`

**Impacto:**
- UPSERTs pueden fallar con error de tipo
- Timestamps se pueden truncar
- Inconsistencia de datos

**Reproducible:**
```typescript
// Falla silenciosa
const data = { id: "abc-123", created_at: "2026-02-28T10:30:45.123Z" }
await supabase.from('ideas').upsert(data)
// ¿Qué sucede con la conversión?
// ¿Se logea el error?
```

---

### P2: Timestamp Comparison Logic (🔴 CRÍTICO)

**Problema:**
```typescript
// localRecord.updated_at = "2026-02-28T10:30:45.123Z" (con milisegundos)
// remoteRecord.updated_at = "2026-02-28T10:30:45.000Z" (sin milisegundos)
// Comparación: .000Z > .123Z → FALSE
// RESULTADO: Se piensa que local es más nuevo, descarta remoto
```

**Impacto:**
- Cambios remotos se pierden
- Conflictos no se detectan
- Base de datos diverge

---

### P3: No User Filtering in Pull (🔴 CRÍTICO)

**Problema:**
```typescript
// Pull no filtra por user_id
const { data } = await remoteDb.from('ideas')
  .select('*')
  .is('deleted_at', null)
  .gte('updated_at', lastSync) // ← FALTA .eq('user_id', userId)

// Si hay 1000 usuarios, descarga todas sus ideas
```

**Impacto:**
- Privacy leak (aunque RLS lo bloquea en Supabase)
- Performance degradation
- No escalable

---

### P4: Deleted Records Never Sync (🟠 ALTO)

**Problema:**
```typescript
// Pull descarga: WHERE deleted_at IS NULL
// Nunca sincroniza deletions en pull
// Local y remote divergen en soft-deleted records
```

**Impacto:**
- Records "fantasma" en cliente
- Inconsistencia visible al usuario
- No hay "source of truth"

---

### P5: No Transactional Safety (🟠 ALTO)

**Problema:**
```typescript
// Push sin transacción:
await this.localDb.execute("UPDATE ideas SET ...")
await this.localDb.execute("UPDATE _sync_queue SET ...")
await this.remoteDb.from('ideas').upsert(...)
// Si Supabase falla después del UPDATE local → inconsistencia
```

**Impacto:**
- Sync queue puede quedar inconsistente
- Status desincronizado
- Manual recovery needed

---

### P6: No Suscripciones en Tiempo Real (🟠 ALTO)

**Problema:**
- Supabase soporta Realtime Subscriptions
- SyncEngine solo hace Pull cada 5s
- Cambios de otros usuarios no se ven hasta próximo pull

**Impacto:**
- Retraso en actualizaciones (0-5s)
- No colaborativo en tiempo real
- UX degradada

---

## 6. MATRIZ DE RIESGOS

| Riesgo | Severidad | Probabilidad | Impacto | Requerimientos |
|--------|-----------|--------------|---------|----------------|
| Type casting fail | CRÍTICO | ALTO | Data loss | Schema alignment |
| Timestamp comparison | CRÍTICO | ALTO | Data loss | NTP sync |
| User filtering | CRÍTICO | ALTO | Privacy leak | Filter in pull |
| Conflict detection | ALTO | MEDIO | Lost edits | Version vectors |
| Transactional safety | ALTO | MEDIO | Inconsistency | TX wrapper |
| Real-time updates | ALTO | MEDIO | Stale data | Subscriptions |
| Delete propagation | MEDIO | BAJO | Stale cache | Delete tracking |

---

## 7. RECOMENDACIONES

### Fase 1: Crítico Immediatamente (This Week)

1. **Alinear Schema entre SQLite y Supabase**
   ```sql
   ALTER TABLE ideas 
   ADD COLUMN IF NOT EXISTS summary_text VARCHAR;
   
   -- Or create view that maps types
   CREATE VIEW ideas_unified AS
   SELECT 
     id::TEXT, 
     title, 
     created_at::TEXT, 
     ...
   FROM public.ideas;
   ```

2. **Implementar Timestamp Conversion Helper**
   ```typescript
   const normalizeTimestamp = (ts: string | Date): string => {
     return new Date(ts).toISOString().slice(0, -1) + 'Z'
   }
   ```

3. **Agregar User Filtering en Pull**
   ```typescript
   const userId = await this.getUserId()
   const { data } = await this.remoteDb
     .from('ideas')
     .select('*')
     .eq('user_id', userId)  // ← AGREGAR ESTA LÍNEA
     .is('deleted_at', null)
     .gte('updated_at', lastSync)
   ```

4. **Implementar Transacciones en Push**
   ```typescript
   await this.localDb.transaction(async (tx) => {
     await tx.execute("UPDATE ideas SET ...")
     await this.remoteDb.from('ideas').upsert(data)
     await tx.execute("UPDATE _sync_queue SET synced_at = ?")
   })
   ```

### Fase 2: Importante (This Month)

5. **Agregar Supabase Realtime Subscriptions**
6. **Implementar Vector Clocks para Conflict Detection**
7. **Mecanismo de Delete Propagation**
8. **Retry Logic con Exponential Backoff**

### Fase 3: Futuro (Next Quarter)

9. **CRDT-based Sync (Yjs, Automerge)**
10. **Offline-first CMS (PowerSync integration)**
11. **Full Audit Trail con Timestampaing Server**

---

## 8. TESTS PROPUESTOS

Ver archivo: `SYNC_ENGINE_TESTS.ts`

Tests a ejecutar:
- ✅ Sincronización básica (create → push → pull)
- ✅ Resolución de conflictos
- ✅ Timestamp validation
- ✅ User isolation
- ✅ Error handling y retry
- ✅ Offline scenario
- ✅ Multi-user scenario

---

## 9. CONCLUSIÓN

**Estado:** 🟡 **PARCIALMENTE FUNCIONAL CON RIESGOS**

El sistema de sincronización tiene la **arquitectura correcta** pero con **implementación incompleta**. Específicamente:

- ✅ Offline-first approach is sound
- ✅ Queue-based push is correct
- ✅ User isolation via RLS is good
- ❌ Schema mismatch breaks upserts
- ❌ Timestamp logic is fragile
- ❌ Pull logic has privacy issue
- ❌ No conflict detection for simultaneous edits

**Recommendation:** Implementar fixes de Fase 1 antes de usar en producción.

---

**Next Step:** Ejecutar test suite (ver SYNC_ENGINE_TESTS.ts) para validar comportamiento real.
