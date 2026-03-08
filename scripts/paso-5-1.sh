#!/bin/bash

# ============================================================================
# PASO 5.1: Verificar RLS Policies - Script Ejecutable
# ============================================================================
# 
# Este script guía a través de la verificación de RLS policies en Supabase
# 
# Pasos:
# 1. Copiar SQL a Supabase Editor
# 2. Ejecutar tests
# 3. Verificar resultados

set -e

echo "🔍 PASO 5.1: Verificar RLS Policies"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
# Load .env file
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
# Check environment
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: VITE_SUPABASE_URL not set in .env${NC}"
  echo ""
  echo "Solución: Configurar credenciales de Supabase"
  echo ""
  echo "Opción 1 - Script Interactivo (RECOMENDADO):"
  echo "  npm run setup:supabase"
  echo ""
  echo "Opción 2 - Manual:"
  echo "  1. Abre .env en este directorio"
  echo "  2. Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY"
  echo "  3. Obtén estas valores en: https://app.supabase.com → Settings → API"
  echo ""
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ ERROR: VITE_SUPABASE_ANON_KEY not set in .env${NC}"
  echo ""
  echo "Solución: Configurar credenciales de Supabase"
  echo ""
  echo "Opción 1 - Script Interactivo (RECOMENDADO):"
  echo "  npm run setup:supabase"
  echo ""
  echo "Opción 2 - Manual:"
  echo "  1. Abre .env en este directorio"
  echo "  2. Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY"
  echo "  3. Obtén estas valores en: https://app.supabase.com → Settings → API"
  echo ""
  exit 1
fi

echo -e "${BLUE}ℹ️  Supabase URL: $VITE_SUPABASE_URL${NC}"
echo ""

# Step 1: Instructions
echo -e "${YELLOW}PASO 1: Aplicar SQL en Supabase Dashboard${NC}"
echo "=========================================="
echo ""
echo "1. Abrir: https://app.supabase.com"
echo "2. Seleccionar tu proyecto"
echo "3. Panel izquierdo → SQL Editor"
echo "4. Click: New Query"
echo "5. Abrir archivo: supabase/rls-policies.sql"
echo "6. Copy-paste TODO el contenido"
echo "7. CTRL+ENTER para ejecutar"
echo ""
echo -e "${YELLOW}⚠️  PAUSA: Presiona ENTER después de ejecutar el SQL en Supabase${NC}"
read -p ""

# Step 2: Verify RLS
echo ""
echo -e "${BLUE}ℹ️  Ejecutando verificación de RLS...${NC}"
echo ""

if command -v tsx &> /dev/null; then
  tsx scripts/verify-rls.ts
else
  npx tsx scripts/verify-rls.ts
fi

verify_exit=$?

if [ $verify_exit -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ RLS está ACTIVO${NC}"
  echo ""
  
  # Step 3: Run tests
  echo -e "${YELLOW}PASO 2: Ejecutar Tests de RLS${NC}"
  echo "=============================="
  echo ""
  
  if command -v tsx &> /dev/null; then
    tsx scripts/test-rls.ts
  else
    npx tsx scripts/test-rls.ts
  fi
  
  test_exit=$?
  
  if [ $test_exit -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ PASO 5.1 COMPLETADO EXITOSAMENTE${NC}"
    echo ""
    echo "🎯 Próximo paso: PASO 5.2 - Integrar RLS con Sync Engine"
    echo "   npm run paso:5.2"
    echo ""
    exit 0
  else
    echo ""
    echo -e "${RED}❌ Algunos tests fallaron${NC}"
    echo ""
    echo "Acciones:"
    echo "1. Revisar errores arriba"
    echo "2. Verificar que SQL fue ejecutado correctamente"
    echo "3. Ir a Supabase Dashboard → SQL Editor para ver errores"
    echo "4. Re-ejecutar este script"
    exit 1
  fi
else
  echo ""
  echo -e "${RED}❌ RLS no está activo correctamente${NC}"
  echo ""
  echo "Acciones:"
  echo "1. Verificar que ejecutaste el SQL en Supabase"
  echo "2. Ir a Supabase Dashboard → SQL Editor"
  echo "3. Run: supabase/rls-policies.sql"
  echo "4. Re-ejecutar este script"
  exit 1
fi
