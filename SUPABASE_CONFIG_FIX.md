# ⚠️ PASO 5.1: Configuración de Supabase Requerida

## 🔴 Error Actual

```
❌ ERROR: VITE_SUPABASE_URL not set in .env
```

## ✅ Solución Rápida (2 minutos)

### Opción 1: Script Interactivo (RECOMENDADO)

```bash
npm run setup:supabase
```

Este script:
1. ✅ Te guía a obtener credenciales de Supabase
2. ✅ Te pide que las ingreses
3. ✅ Guarda automáticamente en `.env`
4. ✅ Verifica que esté correcto

**Luego, continúa con PASO 5.1:**
```bash
npm run paso:5-1
```

---

### Opción 2: Editar `.env` Manualmente

#### Paso 1: Obtener credenciales

1. Abre: https://app.supabase.com
2. Haz login
3. Selecciona tu proyecto
4. Panel izquierdo → **Settings** → **API**
5. Busca:
   - **Project URL** (ejemplo: `https://xyzabc.supabase.co`)
   - **Anon/Public Key** (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### Paso 2: Editar `.env`

Abre el archivo `.env` en la raíz del proyecto y reemplaza:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

#### Paso 3: Guardar

Guarda el archivo (Ctrl+S).

---

## 🎯 Próximos Pasos

### Después de configurar Supabase:

```bash
# 1. Verificar configuración (opcional)
npm run verify-rls

# 2. Ejecutar PASO 5.1 (principal)
npm run paso:5-1

# Esto tardará ~5 minutos y te guiará automáticamente
```

---

## 📝 Detalles Técnicos

### ¿Qué es VITE_SUPABASE_URL?
- La URL de tu proyecto Supabase
- Formato: `https://[project-ref].supabase.co`
- Donde obtenerla: Supabase Dashboard → Settings → API → "Project URL"

### ¿Qué es VITE_SUPABASE_ANON_KEY?
- Tu clave pública de Supabase
- Es seguro compartirla (es pública por defecto)
- Donde obtenerla: Supabase Dashboard → Settings → API → "Anon" o "Public"

### ¿Por qué está en `.env`?
- Porque las credenciales NO deben estar en el código
- `.env` está en `.gitignore` (no se sube a git)
- Cada desarrollador tiene su propia `.env`

---

## ✨ Confirmación

Una vez configurado, verifica:

```bash
grep "VITE_SUPABASE_URL" .env
grep "VITE_SUPABASE_ANON_KEY" .env
```

Deberías ver:
```
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🚀 COMANDO FINAL

Una vez tengas .env configurado:

```bash
npm run paso:5-1
```

---

**Status:** Esperando configuración de Supabase  
**Tiempo estimado:** 2-3 minutos de configuración + 5 minutos de PASO 5.1 = 8 minutos total
