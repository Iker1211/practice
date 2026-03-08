# PASO 5.1: Verificar RLS Policies - TODO List

## ✅ Que se necesita hacer

### Opción A: Automatizada (Recomendada - 5 minutos)

```bash
npm run paso:5-1
```

Este comando:
1. ✅ Te guía a través de los pasos
2. ✅ Ejecuta verificación automática
3. ✅ Corre tests de RLS
4. ✅ Reporta resultados

**Resultado esperado:**
```
✅ PASO 5.1 COMPLETADO EXITOSAMENTE
✅ RLS está ACTIVO
✅ Todos los tests pasaron

🎯 Próximo paso: PASO 5.2
```

---

### Opción B: Manual (Si prefieres control total - 15 minutos)

#### Step 1: Aplicar SQL en Supabase

1. Ir a: https://app.supabase.com
2. Seleccionar tu proyecto
3. Panel izquierdo → **SQL Editor**
4. Click: **New Query**
5. Abrir & copiar: `supabase/rls-policies.sql`
6. Pegar TODO el contenido
7. **CTRL+ENTER** para ejecutar

**Esperado:** 
```
SUCCESS - Query executed
```

#### Step 2: Verificar en Dashboard

1. **Database** → **Tables** → **ideas**
2. Arriba a la derecha → **⋮** → **Row-Level Security**

**Deberías ver:**
```
✅ ideas_select_policy (SELECT)
✅ ideas_insert_policy (INSERT)
✅ ideas_update_policy (UPDATE)
✅ ideas_delete_policy (DELETE)
```

#### Step 3: Verificar Índices

1. **Database** → **Tables** → **ideas**
2. Tab: **Indexes**

**Deberías ver:**
```
✅ idx_ideas_user_id
✅ idx_ideas_user_id_created_at
✅ idx_ideas_user_id_updated_at
```

#### Step 4: Testear Multi-usuario

**Browser 1 (Incógnito):**
```
1. Loguear con usuario1@test.com
2. Crear idea: "Mi idea Browser 1"
3. Verificar que aparece
```

**Browser 2 (Incógnito):**
```
1. Loguear con usuario2@test.com (DIFERENTE)
2. Ver ideas
3. ❌ NO debe ver "Mi idea Browser 1"
```

**Resultado:**
- Usuario 2 NO ve ideas de Usuario 1 → ✅ RLS FUNCIONA
- Usuario 2 VE ideas de Usuario 1 → ❌ RLS NO funciona

#### Step 5: Ejecutar Tests Automáticos

```bash
npm run test:rls
```

**Esperado:**
```
✅ SELECT Query: Retrieved 0-N ideas (RLS filtering applied)
✅ RLS INSERT Protection: RLS correctly rejected INSERT...
✅ RLS UPDATE Protection: RLS correctly rejected UPDATE...
✅ RLS DELETE Protection: RLS correctly rejected DELETE...
✅ Audit Log RLS: Retrieved audit logs (RLS filtering applied)

📊 Resultados: 5/5 tests pasados

✨ ¡TODOS LOS TESTS PASARON! RLS está funcionando correctamente.
```

---

## 🚀 Comandos Disponibles

```bash
# Opción automática (recomendada)
npm run paso:5-1

# Scripts individuales
npm run verify-rls        # Verifica que RLS está activo
npm run test:rls          # Ejecuta tests de RLS

# Manual test (verificar en 2 browsers)
npm run paso:5-1-multiuser
```

---

## 🐛 Troubleshooting

### Error: "VITE_SUPABASE_URL not set"

**Solución:**
```bash
# Verificar que .env tiene:
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Error: "RLS no está activo"

**Solución:**
1. Ir a https://app.supabase.com
2. SQL Editor → New Query
3. Copy-paste `supabase/rls-policies.sql`
4. CTRL+ENTER
5. Re-ejecutar `npm run paso:5-1`

### Error: "RLS INSERT Protection failed"

**Causa:** RLS está activo pero policy de INSERT no está correcta

**Solución:**
1. Database → Tables → ideas → Row-Level Security
2. Verificar que `ideas_insert_policy` existe
3. Si no existe, re-ejecutar SQL

### Error: "connection refused"

**Causa:** No hay conexión a Supabase

**Solución:**
1. Verificar URL de Supabase en .env
2. Verificar que el proyecto está activo
3. Revisar estado https://status.supabase.io

---

## ✨ Después de Completar PASO 5.1

Si TODO pasa ✅:
→ **Continuar a PASO 5.2: Integrar RLS con Sync Engine**

```bash
npm run paso:5-2  # (comando a ser creado en PASO 5.2)
```

---

## 📊 Checklist Final

- [ ] SQL de RLS ejecutado en Supabase
- [ ] 5 policies visibles en Dashboard
- [ ] Índices visibles en Dashboard
- [ ] Multi-usuario test OK (usuario no ve ideas del otro)
- [ ] `npm run test:rls` todos pasan
- [ ] Documentación PASO_5_1_COMPLETED.md actualizada

**Una vez TODO esté checked:** PASO 5.1 COMPLETADO ✅
