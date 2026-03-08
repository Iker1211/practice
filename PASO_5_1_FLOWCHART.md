# PASO 5.1: Verificación RLS - Flowchart Ejecutable

## 🚀 Flujo Rápido (5 minutos)

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 5.1: Verificar RLS Policies                              │
│                                                                 │
│  Objetivo: Confirmar que las RLS policies están activas         │
│            en Supabase y funcionan correctamente                │
└─────────────────────────────────────────────────────────────────┘

                            ↓

        npm run paso:5-1

                            ↓

    ┌─────────────────────────────────┐
    │ Pausa: Ejecuta SQL en Supabase  │
    │                                 │
    │ 1. Ir a app.supabase.com        │
    │ 2. SQL Editor → New Query       │
    │ 3. Copy supabase/rls-policies.sql
    │ 4. CTRL+ENTER                   │
    │                                 │
    │ Presiona ENTER cuando listo...  │
    └─────────────────────────────────┘

                            ↓

    ┌─────────────────────────────────┐
    │ Verificación Automática         │
    │                                 │
    │ ✅ RLS está ACTIVO              │
    │ ✅ Índices detectados           │
    │ ✅ Políticas aplicadas          │
    └─────────────────────────────────┘

                            ↓

    ┌─────────────────────────────────┐
    │ Tests de Seguridad              │
    │                                 │
    │ ✅ SELECT - Solo propios datos  │
    │ ✅ INSERT - Rechaza otros user  │
    │ ✅ UPDATE - Solo propios datos  │
    │ ✅ DELETE - Solo propios datos  │
    │ ✅ Audit Log - RLS activo       │
    └─────────────────────────────────┘

                            ↓

        ✨ PASO 5.1 COMPLETADO ✨

                Próximo: PASO 5.2
```

---

## 📋 Checklist Paso-a-Paso

### ANTES DE COMENZAR
- [ ] `.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] Puedes acceder a https://app.supabase.com
- [ ] Tienes acceso a tu proyecto Supabase

### EJECUCIÓN

#### Comando Único (Recomendado)
```bash
npm run paso:5-1
```

**Esto te llevará a través de:**

1. **Pausa Interactiva**
   - Copiar `supabase/rls-policies.sql`
   - Ejecutar en Supabase SQL Editor
   - Presionar ENTER cuando listo

2. **Verificación Automática**
   - Detecta que RLS está activo
   - Verifica índices
   - Valida políticas

3. **Tests Automáticos**
   - 5 tests de seguridad
   - Verifica protección RLS
   - Reporta resultados

---

## 🎯 Resultado Esperado

```
✅ RLS Policies están FUNCIONANDO correctamente

📊 RESULTADO: 5/5 tests pasados

✨ ¡TODOS LOS TESTS PASARON! RLS está funcionando correctamente.

🎯 Próximo paso: PASO 5.2 - Integrar RLS con Sync Engine
   npm run paso:5-2
```

---

## ⚠️ Si algo falla

### Fallo: "RLS no está activo"

```
❌ RLS podría NO estar activo

Solución:
1. Ir a https://app.supabase.com
2. SQL Editor → New Query
3. Copy-paste supabase/rls-policies.sql
4. CTRL+ENTER para ejecutar
5. Re-ejecutar: npm run paso:5-1
```

### Fallo: "Tests fallaron"

```
❌ Algunos tests fallaron

Revisar:
1. ¿Ejecutaste el SQL correctamente?
2. ¿Las 5 policies aparecen en Dashboard?
3. ¿Los índices están presentes?

Acciones:
npm run verify-rls     # Verificar RLS manual
npm run test:rls       # Correr tests individuales
```

### Fallo: "Connection error"

```
❌ No hay conexión a Supabase

Revisar:
1. VITE_SUPABASE_URL en .env es correcta?
2. VITE_SUPABASE_ANON_KEY en .env es correcta?
3. ¿Puedes acceder a https://app.supabase.com?
4. ¿El proyecto de Supabase está activo?
```

---

## 🔄 Alternativas Manuales

### Si prefieres hacerlo paso-a-paso

#### Step 1: Aplicar SQL
```bash
# Copiar contenido de:
supabase/rls-policies.sql

# Abrir:
https://app.supabase.com → SQL Editor → New Query

# Pegar y CTRL+ENTER
```

#### Step 2: Verificar Dashboard
```
Supabase → Database → Tables → ideas → Row-Level Security
Deberías ver 5 policies: SELECT, INSERT, UPDATE, DELETE
```

#### Step 3: Verificar Índices
```
Supabase → Database → Tables → ideas → Indexes
Deberías ver:
  - idx_ideas_user_id
  - idx_ideas_user_id_created_at
  - idx_ideas_user_id_updated_at
```

#### Step 4: Testear Multi-usuario
```
Browser 1 (Incógnito):
  - Loguear usuario1@test.com
  - Crear idea
  
Browser 2 (Incógnito):
  - Loguear usuario2@test.com
  - Ver ideas
  - ❌ NO debe ver ideas de usuario1

Si usuario2 NO VE → ✅ RLS FUNCIONA
```

#### Step 5: Correr Tests
```bash
npm run test:rls
```

---

## 📚 Documentos Relacionados

- `PASO_5_1_INSTRUCTIONS.md` - Instrucciones detalladas
- `PASO_5_1_QUICK_REFERENCE.md` - Referencia rápida
- `supabase/RLS_SETUP_GUIDE.md` - Guía completa de RLS
- `supabase/rls-policies.sql` - SQL a ejecutar
- `supabase/rls-policies.test.ts` - Tests automatizados

---

## ✅ Completado Exitosamente Cuando:

- [x] SQL ejecutado en Supabase sin errores
- [x] 5 policies visibles en Dashboard
- [x] Índices visibles en Dashboard
- [x] `npm run test:rls` retorna 5/5 tests OK
- [x] Multi-usuario test confirma aislamiento
- [x] No hay mensajes de error

**THEN:** PASO 5.1 COMPLETADO ✅ → Continuar a PASO 5.2

---

## 📞 Debugging Avanzado

### Verificación Individual

```bash
# Solo verificar RLS
npm run verify-rls

# Solo tests
npm run test:rls

# Solo multi-usuario (manual)
npm run paso:5-1-multiuser
```

### Ver Logs de SQL

```
Supabase → SQL Editor → query results
Buscar errores o mensajes específicos
```

### Verificar Policies en código

```bash
# Listar policies creadas
curl -s https://[SUPABASE_URL]/rest/v1/pg_policies \
  -H "apikey: [ANON_KEY]"
```

---

## 🎓 Concepto

**RLS (Row-Level Security)** filtra automáticamente:

```sql
-- Cuando ejecutas:
SELECT * FROM ideas;

-- PostgreSQL automáticamente convierte a:
SELECT * FROM ideas WHERE user_id = auth.uid();

-- El usuario SOLO ve sus propias ideas
-- Está garantizado a nivel de BD (no puede ser bypassed)
```

**Por eso:**
- Usuario A NO ve ideas de Usuario B (RLS filtra SELECT)
- Usuario A NO puede UPDATE ideas de Usuario B (RLS rechaza UPDATE)
- Usuario A NO puede DELETE ideas de Usuario B (RLS rechaza DELETE)

---

## ⏭️ Después de PASO 5.1

Si todo ✅:

```bash
npm run paso:5-2   # Próximo paso (será creado)
```

PASO 5.2 incluye:
- Integración con sync-engine
- Validación de user_id en PUSH
- Tests multi-dispositivo
