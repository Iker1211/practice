## Guía Rápida: Database Dual para Android

### 1. Instalación de dependencias

En `apps/mobile/package.json`:

```bash
npm install @capacitor-community/sqlite
npx cap plugin add @capacitor-community/sqlite
```

### 2. Configurar variables de entorno

En `apps/mobile/.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Inicializar base de datos en main.tsx

```typescript
import { initializeDatabase } from '@myapp/lib'
import { createSupabaseClient } from '@myapp/lib'

async function initApp() {
  const supabase = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  await initializeDatabase({
    supabase,
    mode: 'offline-first',
    autoSync: true,
  })

  // Cargar app
  ReactDOM.render(<App />, document.getElementById('root'))
}

initApp()
```

### 4. Usar en componentes

```typescript
import { useIdeas } from '@myapp/lib'

export function IdeasList() {
  const { 
    ideas, 
    loading, 
    create, 
    syncing, 
    pendingChanges 
  } = useIdeas({ autoSync: true })

  return (
    <>
      {syncing && <div>Sincronizando...</div>}
      {pendingChanges > 0 && (
        <div>{pendingChanges} cambios pendientes</div>
      )}
      
      <button onClick={() => create('Nueva idea')}>
        Crear Idea
      </button>

      {ideas.map(idea => (
        <div key={idea.id}>{idea.title}</div>
      ))}
    </>
  )
}
```

### 5. Modos de operación

```typescript
// Offline-first (recomendado para móvil)
await initializeDatabase({
  mode: 'offline-first', // Lee local, escribe local, sincroniza en background
})

// Remote-first (recomendado para web)
await initializeDatabase({
  mode: 'remote-first', // Intenta remoto primero, fallback a local
})

// Hybrid (automático)
await initializeDatabase({
  mode: 'hybrid', // Detecta conexión automáticamente
})
```

### 6. Sincronización manual

```typescript
const { syncNow } = useIdeas()

// Forzar sincronización instantánea
await syncNow()
```

### 7. Monitorear estado

```typescript
import { getDatabaseStatus } from '@myapp/lib'

const status = await getDatabaseStatus()
console.log({
  syncing: status.syncing,
  pendingChanges: status.pendingChanges,
  conflicts: status.conflicts,
  isOnline: status.isOnline,
})
```

### 8. Estrategias de resolución de conflictos

```typescript
await initializeDatabase({
  syncOptions: {
    // 'local': mantener cambios locales
    // 'remote': usar versión del servidor
    // 'manual': llamar callback para resolver
    conflictResolution: 'remote',
    
    onConflict: async (conflict) => {
      // Mostrar UI para que usuario elija
      return confirm('Usar versión del servidor?') 
        ? 'remote' 
        : 'local'
    },
  },
})
```

### Troubleshooting

**Error: "Capacitor SQLite plugin not available"**
- Verificar que `@capacitor-community/sqlite` está instalado
- Ejecutar `npx cap sync`
- Para web sin Capacitor, agregar sql-js-adapter

**Ideas no se sincronizan**
- Verificar conexión de red
- Revisar `getDatabaseStatus().pendingChanges`
- Ejecutar `syncNow()` manualmente

**Conflictos no resueltos**
- Revisar estado con `getDatabaseStatus().conflicts`
- Implementar `onConflict` callback

---

Para más detalles, ver [INFORME_DUAL_DATABASE.md](../INFORME_DUAL_DATABASE.md)
