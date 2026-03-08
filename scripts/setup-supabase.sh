#!/bin/bash

# ============================================================================
# Setup Supabase - Configurar al inicio
# ============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "         Configurar Supabase - Prerequisito para PASO 5.1"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  No .env file found. Creating template...${NC}"
  echo ""
  cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Development
VITE_ENV=development
EOF
  echo "✅ Template creado en: .env"
  echo ""
fi

echo -e "${BLUE}📖 Instrucciones${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Abre tu navegador: https://app.supabase.com"
echo "2. Haz login"
echo "3. Selecciona tu PROYECTO"
echo ""
echo -e "${YELLOW}Ubicación en Supabase Dashboard:${NC}"
echo "   Panel izquierdo → Settings → API"
echo ""
echo -e "${YELLOW}Qué buscar en la página de API:${NC}"
echo ""
echo "   📌 Project URL"
echo "      Valor: https://xyzabc.supabase.co"
echo ""
echo "   📌 Anon/Public"
echo "      Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   ✅ Usa ANON/PUBLIC key (es pública)"
echo "   ❌ NO uses SERVICE ROLE key (es privada)"
echo ""

echo -e "${BLUE}Opción A: Script Interactivo${NC}"
echo "─────────────────────────────────────────"
echo ""
read -p "¿Quieres usar el script interactivo? (y/n) [y]: " use_interactive
use_interactive=${use_interactive:-y}

if [[ "$use_interactive" == "y" || "$use_interactive" == "Y" ]]; then
  echo ""
  echo "Ejecutando script interactivo..."
  echo ""
  npx tsx scripts/setup-supabase.ts
  exit $?
else
  echo ""
  echo -e "${BLUE}Opción B: Editar Manualmente${NC}"
  echo "─────────────────────────────────────────"
  echo ""
  echo "Abriendo .env en editor..."
  echo ""
  if command -v code &> /dev/null; then
    code .env
  elif command -v nano &> /dev/null; then
    nano .env
  elif command -v vi &> /dev/null; then
    vi .env
  else
    echo "No se encontró editor. Por favor abre .env manualmente."
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Próximo paso:"
echo "   npm run paso:5-1"
echo ""
