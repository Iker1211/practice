# PASO 5.1 - Verificar RLS Policies: Guía Rápida

## 🎯 Objetivo
Comprobar que las RLS policies están activas en Supabase y funcionan correctamente.

## ✅ Checklist de Verificación

### Paso 1: Aplicar SQL en Supabase (5 minutos)

1. Ir a: [https://app.supabase.com](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Panel izquierdo → **SQL Editor**
4. Click: **New Query**
5. Copiar TODO de `supabase/rls-policies.sql`
6. Pegar en editor
7. **CTRL+ENTER** para ejecutar

**Esperado:** 
```
SUCCESS - Query completed
```

**Si hay error (rojo):** Revisar mensaje de error y googlear

---

### Paso 2: Verificar Policies en Dashboard (2 minutos)

1. **Database** → **Tables** → **ideas**
2. Arriba a la derecha: Click en **⋮** (tres puntos)
3. Seleccionar: **Row-Level Security**

**Deberías ver:**
```
✅ ideas_select_policy (SELECT)
✅ ideas_insert_policy (INSERT)
✅ ideas_update_policy (UPDATE)  
✅ ideas_delete_policy (DELETE)
```

**Si NO ves las policies:** Ejecutar de nuevo `rls-policies.sql`

---

### Paso 3: Verificar Índices (1 minuto)

1. **Database** → **Tables** → **ideas**
2. Tab: **Indexes**

**Deberías ver:**
```
✅ idx_ideas_user_id
✅ idx_ideas_user_id_created_at
✅ idx_ideas_user_id_updated_at
✅ idx_ideas_user_id_deleted_at
```

---

### Paso 4: Testear SQL (3 minutos)

En **SQL Editor**, copia esto y ejecuta:

```sql
-- Ver tu user_id
SELECT auth.uid();

-- Ver tus ideas (solo debe mostrar tus ideas)
SELECT id, title, user_id FROM ideas;

-- Intentar ver ideas de otro usuario (debe retornar 0 filas)
SELECT id, title, user_id FROM ideas 
WHERE user_id::text != auth.uid()::text;
```

**Resultado esperado:**
- Query 1: Muestra tu UUID
- Query 2: Tus ideas (0 si no tienes)
- Query 3: **0 filas** (RLS las filtra)

---

### Paso 5: Testear Multi-usuario (5 minutos)

**Browser 1 (Incógnito):**
1. Loguear con usuario1@test.com
2. Ir a tu app
3. Crear idea: "Mi idea desde Browser 1"
4. Verificar que aparece

**Browser 2 (Incógnito):**
1. Loguear con usuario2@test.com (usuario DIFERENTE)
2. Ir a tu app
3. Ver ideas
4. ❌ NO debe ver "Mi idea desde Browser 1"

**Si Usuario 2 VE la idea de Usuario 1:**
→ ❌ RLS NO está funcionando
→ Revisar que SQL se ejecutó correctamente

**Si Usuario 2 NO VE:**
→ ✅ RLS está funcionando CORRECTAMENTE

---

### Paso 6: Ejecutar Tests (2 minutos)

```bash
npm test -- supabase/rls-policies.test.ts
```

**Esperado:**
```
PASS supabase/rls-policies.test.ts
✅ All 24 tests passed
```

**Si hay fallos:**
- Revisar que RLS policies fueron aplicadas
- Verificar que .env tiene credenciales correctas
- Ir a Supabase logs para ver errores BD

---

## 📊 Métricas

**Tiempo total:** ~15-20 minutos
**Dificultad:** ⭐ Fácil (copy-paste + click en dashboard)
**Riesgo:** Ninguno (read-only testing)

---

## ✨ Resultado Final

Después de estos pasos:

✅ RLS está habilitado en tabla `ideas`
✅ Cada usuario solo ve/modifica sus propias ideas
✅ A nivel PostgreSQL (no puede ser bypassed)
✅ Performance optimizado con índices
✅ Tests confirman funcionamiento

---

## ⏭️ Después de Verificar

Si TODO pasa ✅:
→ Continuar a **PASO 5.2: Integrar RLS con Sync Engine**

Si algo falla ❌:
1. Revisar errores en Supabase SQL Editor
2. Re-ejecutar `rls-policies.sql`
3. Verificar credenciales `.env`
4. Contactar Supabase support si persiste
