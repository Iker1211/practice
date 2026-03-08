# RLS Policies Setup - Guía Completa

## Qué son las RLS Policies?

**RLS (Row-Level Security)** es un mecanismo de PostgreSQL que:
- ✅ Controla a nivel de **base de datos** (no se puede bypass desde la app)
- ✅ Filtra automáticamente filas según el `user_id` del JWT token
- ✅ Impide que un usuario vea/modifique datos de otro usuario
- ✅ Funciona para SELECT, INSERT, UPDATE, DELETE

**Sin RLS:** Un usuario malicioso podría hacer query a ideas de otro usuario.
**Con RLS:** PostgreSQL automáticamente filtra: `WHERE user_id = auth.uid()`.

---

## 📋 Paso 1: Preparar el Archivo SQL

Ya existe en el repositorio:
```
supabase/rls-policies.sql
```

**Contenido:**
- Habilitar RLS en tabla `ideas`
- 5 políticas (SELECT, INSERT, UPDATE, DELETE, DELETE)
- Tabla `audit_log` con sus propias políticas
- Índices de optimización

---

## 🚀 Paso 2: Aplicar Políticas en Supabase Dashboard

### 2.1 Abrir Supabase SQL Editor

1. Ir a: [https://app.supabase.com](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Panel izquierdo → **SQL Editor**

### 2.2 Copiar y Pegar el SQL

1. En `SQL Editor` → Click en **New Query**
2. Copiar TODO el contenido de `supabase/rls-policies.sql`
3. Pegar en el editor
4. Click en **Run** (Ctrl+Enter)

### 2.3 Verificar Que No Hay Errores

La salida debe mostrar:
```
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY ideas_select_policy ON ideas...

SUCCESS
TOTAL ROWS: 0
```

Si hay rojo (error), copiar el error y googlear.

---

## 🔍 Paso 3: Verificar que Funcionan

### 3.1 En Supabase Dashboard → Table Editor

1. Ir a: **Database** → **Tables** → **ideas**
2. Arriba a la derecha, click en **Three Dots** (⋮) → **Row-Level Security**
3. Deberías ver:
   ```
   ✅ ideas_select_policy (SELECT)
   ✅ ideas_insert_policy (INSERT)
   ✅ ideas_update_policy (UPDATE)
   ✅ ideas_delete_policy (DELETE)
   ```

### 3.2 Verificar Índices

1. **Database** → **Tables** → **ideas**
2. Tab: **Indexes**
3. Deberías ver:
   ```
   idx_ideas_user_id_created_at
   idx_ideas_user_id_updated_at
   idx_ideas_user_id_deleted_at
   ```

---

## ✅ Paso 4: Testear con SQL (Simulado)

### 4.1 Crear Usuarios de Prueba (Opcional)

En Supabase:
1. **Authentication** → **Users** → **Add User**
2. Crear 2 usuarios:
   - usuario1@test.com / password123
   - usuario2@test.com / password456

### 4.2 Query SQL para Verificar RLS

En **SQL Editor**, copia esto:

```sql
-- Ver el JWT token del usuario actual
SELECT auth.uid();

-- Intentar ver todas las ideas (solo verá la suya)
SELECT id, title, user_id FROM ideas;

-- Intentar ver ideas de otro usuario (fallará silenciosamente - 0 rows)
SELECT id, title, user_id FROM ideas 
WHERE user_id != auth.uid();
```

**Resultado esperado:**
- Primera query: Muestra un UUID (tu user_id)
- Segunda query: Solo tus ideas
- Tercera query: **0 filas** (RLS las filtra)

---

## 🔗 Paso 5: Integración con Sync Engine

### 5.1 Verificar que Sync Respeta RLS

En `packages/lib/src/sync/sync-engine.ts`:

```typescript
// ANTES (posible data leakage):
const changes = await supabase
  .from('ideas')
  .select('*')
  .eq('deleted', false);

// DESPUÉS (RLS lo filtra automáticamente):
const changes = await supabase
  .from('ideas')
  .select('*')
  .eq('deleted', false);
  // ↑ No necesita .eq('user_id', userId)
  // porque RLS ya lo filtra en PostgreSQL
```

### 5.2 Verificar que INSERT Valida user_id

```typescript
// DEBE fallar (user_id no coincide):
await supabase
  .from('ideas')
  .insert({
    id: 'uuid...',
    title: 'Mi idea',
    user_id: 'otro-usuario-uuid', // ❌ RLS lo rechaza
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

// ✅ Funciona (user_id es el del usuario actual):
import { getAuth } from '@/auth/db-isolation';
const { userId } = getAuth();

await supabase
  .from('ideas')
  .insert({
    id: 'uuid...',
    title: 'Mi idea',
    user_id: userId, // ✅ Coincide con auth.uid()
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
```

### 5.3 Testear Multi-usuario

1. Abrir 2 browsers incógnito
2. En Browser 1:
   - Loguear como usuario1@test.com
   - Crear idea: "Mi idea en browser 1"
3. En Browser 2:
   - Loguear como usuario2@test.com
   - Ver ideas (NO debe ver "Mi idea en browser 1")
   - Intentar editar la idea del usuario 1 (debe fallar)

---

## 🛡️ Seguridad: Qué está Protegido

### ✅ PROTEGIDO por RLS

| Operación | Estado |
|-----------|--------|
| Usuario A ve ideas de Usuario B | ❌ No puede (RLS filtra SELECT) |
| Usuario A modifica idea de Usuario B | ❌ No puede (RLS rechaza UPDATE) |
| Usuario A borra idea de Usuario B | ❌ No puede (RLS rechaza DELETE) |
| Usuario A crea idea como Usuario B | ❌ No puede (RLS rechaza INSERT con user_id ≠ auth.uid()) |
| Sincronización descarga datos ajenos | ❌ No (RLS filtra automáticamente) |

### ⚠️ NO ESTÁ PROTEGIDO (otros mecanismos)

| Riesgo | Solución |
|--------|----------|
| Cliente malicioso modifica JWT | ✅ JWT firmado por Supabase (no manipulable) |
| Cliente envía request sin JWT | ✅ Retorna 401 Unauthorized |
| Acceso a tabla sin AUTH | ✅ Usar anon_key con RLS (no full admin) |
| API key comprometida | ✅ Usar Supabase anon_key (permisos limitados) |

---

## 📊 Performance: Índices para 10k+ Usuarios

Las políticas RLS generan queries como:
```sql
SELECT * FROM ideas WHERE user_id = 'abc-123' ORDER BY created_at DESC;
```

**Solución:** Índices creados por el SQL (`rls-policies.sql`):

```sql
CREATE INDEX idx_ideas_user_id_created_at ON ideas(user_id, created_at DESC);
CREATE INDEX idx_ideas_user_id_updated_at ON ideas(user_id, updated_at DESC);
```

Estos índices permiten:
- ✅ Query rápida incluso con 10k usuarios × 1k ideas cada uno
- ✅ Ordenamiento eficiente por fecha
- ✅ Sincronización sin lag

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"

**Causa:** Intentaste INSERT/UPDATE con `user_id` que no coincide con `auth.uid()`

**Solución:**
```typescript
// ❌ INCORRECTO
insert({ ..., user_id: 'otro-id' });

// ✅ CORRECTO
const { userId } = getUserContext();
insert({ ..., user_id: userId });
```

### Error: "permission denied for relation ideas"

**Causa:** RLS está habilitado pero NO hay políticas definidas

**Solución:** Ejecutar de nuevo `supabase/rls-policies.sql`

### Query retorna 0 filas cuando debería devolver datos

**Causa:** Las políticas no están activas o `user_id` no coincide

**Solución:**
1. Verificar en Supabase Dashboard → Table → Row-Level Security
2. Confirmar que el user_id en la BD coincida con `auth.uid()`

---

## 📚 RLS Policy Reference

### Estructura General

```sql
CREATE POLICY policy_name ON table_name
  FOR operation  -- SELECT, INSERT, UPDATE, DELETE
  USING (expression) -- Para SELECT, UPDATE, DELETE
  WITH CHECK (expression); -- Para INSERT, UPDATE
```

### Contexto Disponible

- `auth.uid()` → UUID del usuario actual (desde JWT)
- `auth.email()` → Email del usuario
- `auth.jwt()` → Token JWT completo (si necesitas otros claims)

### Combinaciones de Políticas

**Solo lectura (SELECT):**
```sql
CREATE POLICY read_own ON table_name
  FOR SELECT
  USING (user_id = auth.uid());
```

**Lectura + Escritura de propios datos:**
```sql
CREATE POLICY read_own ON table_name FOR SELECT USING (user_id = auth.uid());
CREATE POLICY write_own ON table_name FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY update_own ON table_name FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());
```

---

## ✨ Conclusión

Después de aplicar estas políticas:

✅ **Seguridad BD**: RLS previene data leakage a nivel PostgreSQL
✅ **Multi-usuario**: Cada usuario solo ve su propio contenido automáticamente
✅ **Performance**: Índices optimizan queries con 10k+ usuarios
✅ **Sync seguro**: El sync-engine hereda la protección RLS

**Próximo paso:** PASO 5.1 - Verificar RLS con tests automatizados
