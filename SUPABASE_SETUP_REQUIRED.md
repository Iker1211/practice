# Configuración de Supabase - Prerequisites para PASO 5.1

## ⚠️ ERROR ACTUAL

```
❌ ERROR: VITE_SUPABASE_URL not set in .env
```

Esto significa que falta configurar tus credenciales de Supabase.

---

## 🚀 CONFIGURACIÓN RÁPIDA

### Opción 1: Script Interactivo (RECOMENDADO - 2 minutos)

```bash
npm run setup:supabase
```

El script te guiará a través de todos los pasos:
1. Te mostrará dónde obtener las credenciales
2. Te pedirá que ingrese los valores
3. Guardará automáticamente en `.env`

### Opción 2: Manual (3 minutos)

#### Paso 1: Obtener Credenciales

1. Abre: https://app.supabase.com
2. Selecciona tu proyecto
3. Panel izquierdo → **Settings** → **API**

#### Paso 2: Copiar Valores

Busca estos valores en la página de API:

**Project URL:**
- Título: "Project URL"
- Valor: `https://xyzabc.supabase.co`
- Cópialo

**Anon / Public Key:**
- Título: "Anon" o "Public"
- Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Cópialo

#### Paso 3: Actualizar `.env`

Abre `.env` en la raíz del proyecto:

```env
# Antes:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Después (with your values):
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9yV0iLCJhbGc...
```

Reemplaza con tus valores reales.

#### Paso 4: Guardar y Listo

Guarda el archivo `.env` (Ctrl+S).

---

## ✅ Verificar Configuración

Después de configurar, verifica que esté correcto:

```bash
grep VITE_SUPABASE_URL .env
grep VITE_SUPABASE_ANON_KEY .env
```

Deberías ver algo como:
```
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Próximo Paso

Una vez configurado, ejecuta:

```bash
npm run paso:5-1
```

---

## 📸 Screenshots (Dónde encontrar las credenciales)

### En Supabase Dashboard

```
Your Organization
├─ [Tu Proyecto]
│  ├─ Settings
│  │  ├─ API ← AQUÍ
│  │  │  ├─ Project URL: https://xyzabc.supabase.co
│  │  │  ├─ Anon/Public: eyJhbGci...
│  │  │  ├─ Service Role: eyJhbGci...
```

Necesitas:
- ✅ Project URL
- ✅ Anon/Public Key
- ❌ NO necesitas Service Role (eso es admin)

---

## 🔒 Seguridad

**Importante:**
- ✅ Está OK compartir la Anon/Public Key (es pública por defecto)
- ❌ NUNCA compartas la Service Role Key
- ✅ El `.env` está en `.gitignore` por defecto

---

## ❌ Si Algo Va Mal

### Error: "invalid API URL"

```
❌ VITE_SUPABASE_URL no parece válida
```

**Solución:**
- Verificar que comience con `https://`
- Verificar que termine con `.supabase.co`
- Copiar exactamente de Supabase Dashboard

### Error: "invalid JWT"

```
❌ VITE_SUPABASE_ANON_KEY no es válida
```

**Solución:**
- Usar la Anon/Public Key (NO la Service Role)
- Verificar que sea larga (100+ caracteres)
- Copiar exactamente sin espacios

### Error: "connection refused"

```
❌ No puede conectar a Supabase
```

**Solución:**
- Verificar que el proyecto existe
- Verificar que el proyecto está activo (no pausado)
- Revisar https://status.supabase.io

---

## 📞 Ayuda Rápida

```bash
# Reconfigurer Supabase con script interactivo
npm run setup:supabase

# Editar .env manualmente
code .env

# Verificar que está configurado
npm run verify-rls

# Empezar PASO 5.1
npm run paso:5-1
```

---

## ⏭️ Una Vez Configurado

```
Ejecuta: npm run paso:5-1

↓

Sigue las instrucciones del script

↓

5 minutos después: PASO 5.1 COMPLETADO ✅
```

---

**Status:** Esperando configuración de Supabase  
**Próximo:** `npm run setup:supabase` o editar `.env` manualmente
