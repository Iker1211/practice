# 📍 Dónde Ver tu URL de Supabase - Guía Visual

## Step 1: Abrir Supabase Dashboard

1. **Abre tu navegador**
2. **Ve a:** https://app.supabase.com
3. **Haz login** con tu cuenta

---

## Step 2: Seleccionar tu Proyecto

Cuando entres, verás una lista de proyectos.

```
┌─────────────────────────────────────────────┐
│  My Organization                            │
├─────────────────────────────────────────────┤
│                                             │
│  📦 [Tu Proyecto] ← CLICK AQUÍ             │
│     Status: Active                          │
│                                             │
│  📦 Otro Proyecto                          │
│                                             │
└─────────────────────────────────────────────┘
```

**Haz click en tu proyecto** (el que estés usando para esta app).

---

## Step 3: Ir a Settings → API

Una vez dentro del proyecto, verás el panel izquierdo.

```
┌────────────────── PANEL IZQUIERDO ─────────────────┐
│                                                     │
│  Dashboard                                         │
│  Editor                                           │
│  SQL Editor                                       │
│  Database                                         │
│  Authentication                                   │
│  Storage                                          │
│  Realtime                                         │
│  Vector                                           │
│  ⚙️ Settings ← OPEN THIS                          │
│    └─ General                                      │
│    └─ API ← CLICK HERE                            │
│    └─ Billing                                      │
│    └─ ...                                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pasos:**
1. Click en **Settings** (abajo del panel izquierdo)
2. Click en **API** (opción dentro de Settings)

---

## Step 4: Encontrar tus Credenciales

Una vez en Settings → API, verás la página de configuración API.

**AQUÍ VAS A VER:**

```
╔════════════════════════════════════════════════════════╗
║                   API Settings                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  📌 Project URL                                        ║
║     ─────────────────────────────────────────────     ║
║     https://xyzabc123.supabase.co                     ║ ← COPIAR ESTO
║     [📋 Copy button]                                   ║
║                                                        ║
║  📌 Anon public                                        ║
║     ─────────────────────────────────────────────     ║
║     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         ║ ← COPIAR ESTO
║     [📋 Copy button]                                   ║
║                                                        ║
║  📌 Service role secret                               ║
║     ─────────────────────────────────────────────     ║
║     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         ║
║     [📋 Copy button]                                   ║
║     ⚠️  KEEP THIS SECRET (no la necesitas)            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## ✅ Lo Que Necesitas

### COPIAR ESTOS 2 VALORES:

| Campo | Qué es | Dónde está |
|-------|--------|-----------|
| **Project URL** | Tu URL de Supabase | Settings → API → "Project URL" |
| **Anon public** | Tu clave pública | Settings → API → "Anon public" |

---

## 📋 Ejemplo Visual Real

Aquí está lo que VAS A VER en Supabase:

```
PROJECT URL:
https://myproject123xyz.supabase.co
                 ↑↑↑↑↑↑↑↑↑↑
            Esta parte cambia

ANON PUBLIC:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLmlvIiwiYXV0aCI6eyJ1c2VycyI6WyJwdWJsaWMiXX0sImlhdCI6MTYwNjc3MDcwMCwiZXhwIjoxNzM0NDA2NDAwfQ.3CvCyO2cE-K1Rl6bN7O9K9xL4mN5pQ2rS3tU4vW5xY
                                                                  ↑↑↑↑↑↑↑↑↑↑
                                    Esta parte es larga, cópiala completa
```

---

## 🚀 Paso-a-Paso (Resumido)

1. **Abre:** https://app.supabase.com
2. **Haz login**
3. **Selecciona tu proyecto** (click en él)
4. **Panel izquierdo:** Settings → API
5. **VAS A VER DOS VALORES:**
   - Project URL (la URL completa)
   - Anon public (la clave larga)
6. **COPIAR AMBOS** (hazclick en los botones 📋)

---

## 📝 Luego, Actualizar `.env`

Una vez que tengas los 2 valores:

1. **Abre el archivo:** `.env` (en la raíz del proyecto)
2. **Reemplaza:**

```env
VITE_SUPABASE_URL=https://tu-url-aqui.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-larga-aqui
```

3. **Guardar** (Ctrl+S)

---

## ⚠️ Importante

- ✅ **Project URL** - Siempre en formato `https://xxxxx.supabase.co`
- ✅ **Anon public** - Es larga (100+ caracteres), empieza con `eyJ`
- ❌ **Service role secret** - NO la necesitas (eso es admin)

---

## 🎯 Si Todavía No Lo Ves

Si abres Settings → API y **NO ves** Project URL:

1. Verifica que estás en **el proyecto correcto**
   - En el panel izquierdo, busca el nombre de tu proyecto arriba
   
2. Verifica que estás en **API** (no en otras opciones como General o Billing)

3. Si aún no lo ves, recarga la página (F5)

---

## 📸 Si Necesitas Ayuda Visual

Puedes abrir directamente (cambia `tu-proyecto` por tu proyecto real):

```
https://app.supabase.com/project/[tu-proyecto-ref]/settings/api
```

O simplemente:
1. app.supabase.com
2. Tu proyecto
3. Settings (abajo izquierda)
4. API (bajo Settings)

---

## ✨ Una Vez Tengas lo Valores

```bash
# Verifica que .env está correcto:
cat .env

# Deberías ver:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Luego ejecuta PASO 5.1:
npm run paso:5-1
```

---

**¿Lo encuentras? Avisame si necesitas ayuda específica.**
