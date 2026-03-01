#!/bin/bash

# Pre-commit hook para prevenir committing de archivos sensibles
# Ubicación: .git/hooks/pre-commit

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

BLOCKED=0

# 1. Verificar .env files no deberían ser comiteados (excepto .env.example)
echo -e "${YELLOW}🔍 Verificando archivos sensibles...${NC}"

# Array de patrones prohibidos
declare -a FORBIDDEN_PATTERNS=(
    ".env.local"
    ".env.development.local"
    ".env.test.local"
    ".env.production.local"
    "Cargo.lock"
    "bfg-*.jar"
    "*.pem"
    "*.key"
    "*.jks"
    "*.keystore"
)

# Verificar archivos en staging
STAGED_FILES=$(git diff --name-only --cached)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    for file in $STAGED_FILES; do
        if [[ $file == *"$pattern"* ]]; then
            echo -e "${RED}❌ Bloqueado: $file${NC}"
            echo -e "   ⚠️  Este archivo ha sido identificado como sensible"
            BLOCKED=1
        fi
    done
done

# 2. Verificar contenido sensible (JWT tokens)
echo ""
for file in $STAGED_FILES; do
    if [[ $file == ".env"* ]] || [[ $file == *".local" ]]; then
        # Verificar si contiene claves JWT o URLs de Supabase
        if git show ":$file" 2>/dev/null | grep -qE "(eyJ|supabase\.co|SUPABASE_|\.pem|-----BEGIN)"; then
            echo -e "${RED}❌ Archivo contiene secretos: $file${NC}"
            echo -e "   ⚠️  Contiene claves o credenciales"
            BLOCKED=1
        fi
    fi
done

if [ $BLOCKED -eq 1 ]; then
    echo ""
    echo -e "${RED}🚫 COMMIT BLOQUEADO${NC}"
    echo ""
    echo -e "Para proceder:"
    echo -e "  1. ${GREEN}git reset HEAD <archivo>${NC} para remover del staging"
    echo -e "  2. Verificar .gitignore está actualizado"
    echo -e "  3. Confirmar que el archivo no contiene secretos"
    echo -e "  4. Hacer commit nuevamente\n"
    echo -e "Para ignorar este check: ${YELLOW}git commit --no-verify${NC}"
    echo -e "                         (NO recomendado para archivos sensibles)\n"
    exit 1
fi

echo -e "${GREEN}✓ Verificación de seguridad completada${NC}"
exit 0
