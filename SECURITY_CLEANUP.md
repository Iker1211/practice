# 🔐 Guía de Limpieza de Seguridad

Este documento proporciona instrucciones paso a paso para limpiar y asegurar tu repositorio de archivos sensibles.

## 📋 Estado Actual

Tu repositorio tiene archivos sensibles que necesitan ser removidos:

- **Credenciales Supabase expuestas:**
  - `.env.local` - Contiene SUPABASE_ANON_KEY y SUPABASE_URL reales
  - `apps/desktop/.env.local` - ID real del proyecto Supabase
  - `apps/mobile/.env.local` - Keys reales
  - `apps/web/.env.local` - Keys reales

- **Archivos innecesarios:**
  - `Gemini_Generated_Image_d3nme6d3nme6d3nm.png`
  - `mqdlB.jpg`
  - `bfg-1.14.0.jar` (ejecutable)

- **Configuración IDE:**
  - `.idea/` - JetBrains IDE configuration

---

## ⚡ Fase 1: Configuración Inicial (5 minutos)

### Paso 1: Hacer ejecutables los scripts

```bash
chmod +x scripts/cleanup-security.sh
chmod +x scripts/cleanup-history-bfg.sh
chmod +x scripts/cleanup-history-git.sh
chmod +x scripts/pre-commit-hook.sh
chmod +x scripts/install-hooks.sh
```

### Paso 2: Instalar Git Hooks

```bash
bash scripts/install-hooks.sh
```

Este comando:
- ✅ Copia el pre-commit hook para prevenir futuros commits con secretos
- ✅ Crea prepare-commit-msg hook para convenciones de commit
- ✅ Verifica que `.gitignore` está configurado correctamente

---

## 🧹 Fase 2: Limpiar Working Directory (5 minutos)

### Paso 3: Ejecutar limpieza de seguridad

```bash
bash scripts/cleanup-security.sh
```

Este script:
1. Protege `.env.local` en `.gitignore` (si no lo está)
2. Crea `.gitattributes` para consistencia de líneas
3. **Crea un commit de limpieza** con cambios de configuración

### Paso 4: Verificar cambios

```bash
git status
git log --oneline -5
```

---

## 🔬 Fase 3: Verificar Archivos .env

### Paso 5: Confirmar que archivos están protegidos

```bash
# Estos archivos deberían verse ignorados:
git status --ignored | grep ".env"

# Verificar contenido local (no es trackeado):
ls -la .env.local apps/**/.env.local
```

---

## ⏰ Fase 4: Limpiar Historial de Git (⚠️ IMPORTANTE)

**Los pasos anteriores solo limpian el Working Directory.**
**Las claves aún están en el historial de Git.**

### Paso 6: REGENERAR CLAVES EN SUPABASE

**CRÍTICO:** Antes de continuar, regenera tus claves:

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar tu proyecto
3. Settings → API → Regenerate
4. Copiar nuevas keys a `.env.local` (localmente, no comitear)

### Paso 7: Limpiar historial (Elegir UNA opción)

#### **OPCIÓN A: BFG (RECOMENDADO - Más rápido)**

```bash
bash scripts/cleanup-history-bfg.sh
```

**Ventajas:**
- ⚡ Más rápido (especialmente en repos grandes)
- 🎯 Diseñado específicamente para limpiar secretos
- 📦 Mejor compresión de repositorio

**Desventajas:**
- Requiere instalar BFG

---

#### **OPCIÓN B: Git Filter-Branch (Alternativa)**

```bash
bash scripts/cleanup-history-git.sh
```

**Ventajas:**
- 📦 Usa solo herramientas estándar de git
- ✅ No requiere instalar nada extra

**Desventajas:**
- 🐢 Mucho más lento en repos grandes
- 💾 Puede usar mucha memoria

---

### Paso 8: Push del historial limpio (⚠️ CUIDADO)

```bash
# Ver cambios antes de push:
git log --oneline -10

# Force push con protección:
git push origin --force-with-lease --all
```

**⚠️ Advertencias:**

- Esto **reescribe el historial remoto**
- Todos los colaboradores necesitarán hacer un **clone nuevo**

---

## ✅ Verificación Final

### Paso 9: Confirmar limpieza

```bash
# 1. Verificar que secretos no están en historial:
git log -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --oneline

# Resultado esperado: (ningún commit)

# 2. Verificar que archivos .env están ignorados:
git check-ignore .env.local
git check-ignore apps/desktop/.env.local

# 3. Revisar último commit:
git show --name-status | head -20
```

---

## 🚀 Aftercare

### Prevenir problemas futuros

1. **Pre-commit hook automático** (ya instalado)
   - Bloquea commits accidentales de `.env.local`
   - Configurable en `.git/hooks/pre-commit`

2. **Team Communication**
   ```
   Comunica a tu equipo:
   - Fecha de cambios
   - Qué claves fueron comprometidas
   - Cómo obtener las nuevas keys
   - Que deben hacer un clone nuevo
   ```

---

## 🆘 Troubleshooting

### Error: "Pre-commit hook failed"

```bash
# Opción 1: Remover archivo del staging
git reset HEAD .env.local

# Opción 2: Usar --no-verify (solo si sabes qué haces)
git commit --no-verify -m "mensaje"
```

### `git log` aún muestra commits eliminados

Normal después de filter-branch. Los commits se limpian con:

```bash
git gc --aggressive --prune=now
```

---

## 📚 Recursos

- [Supabase Security](https://supabase.com/docs/guides/security)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Última actualización:** 2026-02-28
**Estado:** Listo para implementar
