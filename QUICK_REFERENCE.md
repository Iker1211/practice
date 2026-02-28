---
tags:
  - Guía
  - Referencia Rápida
---

# Guía de Referencia Rápida: Arquitectura Dual de Base de Datos

Última actualización: 26 de febrero de 2026

---

## 📁 Archivos Creados

### Core Database Layer

| Archivo | Propósito | Responsabilidad |
| --- | --- | --- |
| `packages/lib/src/db/index.ts` | ✨ **NUEVO** - Exportador central | Reexporta toda la API de BD |
| `packages/lib/src/db/schema-generator.ts` | ✨ **NUEVO** - Generador de schema | Genera SQL desde definiciones TypeScript |
| `packages/lib/src/db/migrations.ts` | ✨ **NUEVO** - Sistema de migraciones | Versionado incremental de schema |
| `packages/lib/src/db/local-db-adapter.ts` | ✨ **NUEVO** - Interfaz genérica | Define contrato para adaptadores SQLite |
| `packages/lib/src/db/capacitor-sqlite-adapter.ts` | ✨ **NUEVO** - Impl Android/iOS | Implementación para Capacitor |
| `packages/lib/src/db/sync-engine.ts` | ✨ **NUEVO** - Motor de sync | Sincronización bidireccional + conflictos |
| `packages/lib/src/db/dual-database-manager.ts` | ✨ **NUEVO** - Orquestador | Coordina local + remote |
| `packages/lib/src/db/idea-repository.ts` | ✨ **NUEVO** - Repo mejorado | Abstracción unificada |
| `packages/lib/src/db/use-ideas.ts` | ✨ **NUEVO** - Hook mejorado | React hook unificado |
| `packages/lib/src/db/initialize-database.ts` | ✨ **NUEVO** - Inicializador | Setup único y centralizado |

### Documentación

| Archivo | Propósito | Scope |
| --- | --- | --- |
| `INFORME_DUAL_DATABASE.md` | 📊 Informe técnico completo | 15 secciones, 1000+ líneas |
| `COMPARATIVA_ANTES_DESPUES.md` | 📈 Comparación v1 vs v2 | 10 aspectos principales |
| `ANDROID_QUICKSTART.md` | 🚀 Guía rápida Android | Setup en 5 minutos |

### Ejemplos

| Archivo | Propósito | Platform |
| --- | --- | --- |
| `apps/mobile/src/db-setup.example.ts` | ✨ **NUEVO** - Ejemplo de inicialización | Android |
| `apps/mobile/src/AppWithDatabase.example.tsx` | ✨ **NUEVO** - App completa funcional | Android |
| `apps/mobile/tsconfig.database.json` | ✨ **NUEVO** - Configuración TypeScript | Android |

### Configuraciones

| Archivo | Cambio | Impacto |
| --- | --- | --- |
| `packages/lib/src/index.ts` | ✏️ **ACTUALIZADO** - Agrega re-exportes | Acceso simplificado a BD |
| `packages/lib/package.json` | ✏️ **ACTUALIZADO** - Nuevas rutas de export | Importaciones más específicas |

---

## 🎯 Cómo Empezar

### 1. Para Android (Recomendado)

```bash
# 1. Instalar dependencias
cd apps/mobile
npm install @capacitor-community/sqlite

# 2. Copiar ejemplo
cp src/db-setup.example.ts src/db-setup.ts
cp src/AppWithDatabase.example.tsx src/App.tsx

# 3. Configurar env
echo "VITE_SUPABASE_URL=..." > .env.local

# 4. Iniciar
npm run dev
```

### 2. Para Web (Next.js)

```typescript
// Ya funciona con Supabase remoto
// useIdeas() usa Server Actions automáticamente
```

### 3. Para Desktop (Tauri)

```typescript
// En el futuro: TauriSQLiteAdapter
// Por ahora: SQLite local con sql.js
```

---

## 📚 API Principal

### Inicialización

```typescript
import { initializeDatabase } from '@myapp/lib'

await initializeDatabase({
  supabase,
  mode: 'offline-first' | 'remote-first' | 'hybrid',
  autoSync: true,
  syncInterval: 5000,
  // ... más opciones
})
```

### En Componentes

```typescript
import { useIdeas } from '@myapp/lib'

const {
  ideas,
  loading,
  create,
  update,
  remove,
  syncing,
  pendingChanges,
  error,
} = useIdeas({
  mode: 'offline-first',
  autoSync: true,
  onSyncStatus: (status) => {}
})
```

### Manual (Si necesitas control total)

```typescript
import { getDatabaseManager } from '@myapp/lib'

const manager = getDatabaseManager()
await manager.write('ideas', { id, title })
const ideas = await manager.read('ideas')
await manager.delete('ideas', id)
const status = await manager.getStatus()
```

---

## 🔧 Configuración por Plataforma

### Android (Capacitor)

```typescript
{
  supabase: createSupabaseClient(...),
  mode: 'offline-first',        // Leer local primero
  autoSync: true,
  syncInterval: 10000,
  syncOptions: {
    conflictResolution: 'remote',
  }
}
```

### Web (Next.js)

```typescript
// Usa Server Actions automáticamente
// O configura remote-first
{
  mode: 'remote-first',          // Leer remoto primero
  autoSync: false,               // Sync en background
}
```

### Hybrid (Detecta red automáticamente)

```typescript
{
  mode: 'hybrid',                // Auto-detecta
  autoSync: true,
}
```

---

## 🔄 Flujos Principales

### Crear una idea (offline-first)

```
User click Create
  ↓
useIdeas().create('title')
  ↓
IdeaRepository.create()
  ↓
DualDatabaseManager.write()
  ↓
CapacitorSQLiteAdapter.execute() ← INMEDIATO
  ↓
SyncEngine.recordChange() ← BACKGROUND
  ↓
Cuando hay conexión: pushChanges() → Supabase
  ↓
✅ Idea visible al instante + sincronizada
```

### Resolver conflicto

```
Conflicto detectado
  ↓
if conflictResolution === 'remote'
  → Usar versión servidor
else if conflictResolution === 'local'
  → Mantener versión local
else if conflictResolution === 'manual'
  → Llamar onConflict callback
  ↓
✅ Resuelto automáticamente
```

---

## 📊 Estructura de Base de Datos

### Tabla: `ideas` (Usuario-visible)

```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
deleted_at TEXT (soft delete)
version INTEGER (para futuros conflictos)

-- Columnas de sync (ocultas de aplicación)
_sync_status TEXT ('synced', 'pending', 'conflicted')
_remote_version INTEGER (versión remota conocida)
_last_synced_at TEXT (timestamp último sync)
```

### Tabla: `_sync_queue` (Interna)

```sql
id TEXT PRIMARY KEY
table_name TEXT
operation TEXT ('INSERT', 'UPDATE', 'DELETE')
record_id TEXT
data TEXT (JSON)
created_at TEXT
synced_at TEXT (NULL si pendiente)
error TEXT (NULL si OK)
retry_count INTEGER
```

### Tabla: `_migrations` (Versionado)

```sql
id INTEGER PRIMARY KEY
version INTEGER (1, 2, 3, ...)
description TEXT
applied_at TEXT
```

---

## 🛡️ Seguridad

### ✅ Implementado

- Prepared statements (sin SQL injection)
- Transacciones ACID
- Soft deletes
- Versionado de schema

### ⚠️ Responsabilidad servidor

- RLS policies en Supabase
- Autenticación
- Encriptación HTTPS

### 🔮 Futuro

- Encriptación en reposo (SQLCipher)
- End-to-end encryption
- Audit logging

---

## 🐛 Troubleshooting Común

### "Database not initialized"

```typescript
// ✅ CORRECTO: Llamar initializeDatabase primero
await initializeDatabase({ supabase })

// Luego usar useIdeas()
```

### "Capacitor SQLite plugin not available"

```bash
# Instalar plugin
npm install @capacitor-community/sqlite
npx cap sync

# Para web sin plugin, agregar sql-js-adapter
```

### Ideas no se sincronizan

```typescript
// Verificar estado
const status = await getDatabaseStatus()
console.log(status.pendingChanges)

// Forzar sync
await getDatabaseManager().syncNow()

// Verificar red
console.log(navigator.onLine)
```

### Conflicto de versiones

```typescript
// Implementar onConflict callback
syncOptions: {
  onConflict: async (conflict) => {
    console.log('Local:', conflict.local)
    console.log('Remote:', conflict.remote)
    // Mostrar UI y retornar 'local' o 'remote'
  }
}
```

---

## 📚 References

- [INFORME_DUAL_DATABASE.md](../INFORME_DUAL_DATABASE.md) - Documentación completa
- [COMPARATIVA_ANTES_DESPUES.md](../COMPARATIVA_ANTES_DESPUES.md) - Comparativa v1 vs v2
- [ANDROID_QUICKSTART.md](../ANDROID_QUICKSTART.md) - Guía rápida Android

---

## 🚀 Roadmap

### ✅ Completado (v2.0)

- Database dual (local + remote)
- Sistema de migraciones
- Sincronización bidireccional
- Resolución de conflictos
- Capacitor SQLite adapter

### 🔄 En progreso

- [ ] sql-js-adapter para web
- [ ] Tests unitarios
- [ ] Exportar/importar backups

### 🔮 Futuro

- [ ] CRDT para edición colaborativa
- [ ] Encriptación end-to-end
- [ ] Tauri adapter (desktop)
- [ ] GraphQL local API

---

## 📞 Soporte

Para problemas:

1. Verificar [troubleshooting](#-troubleshooting-común)
2. Revisar logs en console
3. Usar `getDatabaseStatus()` para debug
4. Checar [INFORME_DUAL_DATABASE.md](../INFORME_DUAL_DATABASE.md) sección 12

---

*Guía de referencia actualizada 26 de febrero de 2026*
