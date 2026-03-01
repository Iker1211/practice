#!/bin/bash

# Script para limpiar secretos del historial usando BFG (RECOMENDADO)
# Ejecutar con: bash scripts/cleanup-history-bfg.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}⚠️  ADVERTENCIA CRÍTICA${NC}"
echo "Este script reescribirá TODO el historial de Git."
echo "Asegúrate que:"
echo "  1. Todos los cambios estén comiteados"
echo "  2. Hayas hecho backup del repo"
echo "  3. Comuniques esto al equipo antes de hacer push\n"

read -p "¿Entiendes los riesgos? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 1
fi

# Verificar que BFG esté disponible
if ! command -v bfg &> /dev/null; then
    echo -e "${RED}❌ BFG no está instalado${NC}"
    echo -e "Descarga desde: https://rtyley.github.io/bfg-repo-cleaner/"
    echo -e "O instala: brew install bfg (macOS) o apt install bfg (Linux)\n"
    exit 1
fi

echo -e "\n${BLUE}🔐 Iniciando limpieza del historial con BFG...${NC}\n"

# Crear archivo de patrones a remover
PATTERNS_FILE=".bfg-patterns.txt"
cat > "$PATTERNS_FILE" << 'EOF'
# Supabase keys pattern
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
fzknrhnmrzeyvojzaiwf.supabase.co
EOF

echo -e "${YELLOW}1️⃣  Removiendo secretos del historial...${NC}"
bfg --replace-text "$PATTERNS_FILE" --no-blob-protection

echo -e "\n${YELLOW}2️⃣  Limpiando referencias reflog...${NC}"
git reflog expire --expire=now --all

echo -e "\n${YELLOW}3️⃣  Ejecutando garbage collection...${NC}"
git gc --aggressive --prune=now

echo -e "\n${GREEN}✓ Historial limpio${NC}"

# Limpiar archivos temporales
rm -f "$PATTERNS_FILE"

echo -e "\n${RED}PRÓXIMO PASO:${NC}"
echo -e "Ejecuta: ${BLUE}git push origin --force-with-lease --all${NC}"
echo -e "ADVERTENCIA: Esto sobrescribirá el historial remoto\n"

echo -e "${GREEN}✓ Limpieza completada${NC}"
