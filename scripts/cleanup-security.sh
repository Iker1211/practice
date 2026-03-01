#!/bin/bash

# Script de limpieza de seguridad y privacidad del repositorio
# Ejecutar con: bash scripts/cleanup-security.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Script de Limpieza de Seguridad${NC}\n"

# 1. Remover archivos sensibles de staging (si están staged)
echo -e "${YELLOW}📋 Paso 1: Removiendo archivos sensibles del staging area...${NC}"
git rm --cached .env.local 2>/dev/null || true
git rm --cached apps/**/.env.local 2>/dev/null || true
git rm --cached apps/desktop/.env.local 2>/dev/null || true
git rm --cached apps/mobile/.env.local 2>/dev/null || true
git rm --cached apps/web/.env.local 2>/dev/null || true
echo -e "${GREEN}✓ Archivos .env.local removidos del stage${NC}\n"

# 2. Remover archivos innecesarios
echo -e "${YELLOW}📋 Paso 2: Removiendo archivos innecesarios...${NC}"
git rm --cached Gemini_Generated_Image_d3nme6d3nme6d3nm.png 2>/dev/null || true
git rm --cached mqdlB.jpg 2>/dev/null || true
git rm --cached bfg-1.14.0.jar 2>/dev/null || true
echo -e "${GREEN}✓ Archivos innecesarios removidos${NC}\n"

# 3. Remover Cargo.lock si existe
echo -e "${YELLOW}📋 Paso 3: Removiendo Cargo.lock...${NC}"
git rm --cached apps/desktop/src-tauri/Cargo.lock 2>/dev/null || true
echo -e "${GREEN}✓ Cargo.lock removido${NC}\n"

# 4. Remover .idea si está tracked
echo -e "${YELLOW}📋 Paso 4: Removiendo directorio .idea/...${NC}"
git rm --cached -r .idea/ 2>/dev/null || true
echo -e "${GREEN}✓ Directorio .idea removido${NC}\n"

# 5. Crear gitattributes para ignorar cambios normalizados
echo -e "${YELLOW}📋 Paso 5: Creando .gitattributes...${NC}"
cat > .gitattributes << 'EOF'
# Auto normalize line endings for all text files
* text=auto

# Specific settings per file type
*.sh eol=lf
*.json eol=lf
*.js eol=lf
*.ts eol=lf
*.tsx eol=lf
*.md eol=lf

# Binaries
*.jar binary
*.png binary
*.jpg binary
*.jpeg binary
EOF
echo -e "${GREEN}✓ .gitattributes creado${NC}\n"

# 6. Mostrar estado
echo -e "${YELLOW}📋 Paso 6: Estado actual del repositorio${NC}"
echo -e "${BLUE}Cambios preparados para commit:${NC}"
git status -s || true
echo ""

# 7. Crear commit
echo -e "${YELLOW}📋 Paso 7: Creando commit de limpieza...${NC}"
CHANGED=$(git status -s | wc -l)
if [ "$CHANGED" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No hay cambios para comitear${NC}"
else
    git add .gitignore .gitattributes
    git commit -m "chore: add security cleanup configuration and scripts

- Add comprehensive .gitignore with security patterns
- Add .gitattributes for consistent line endings
- Protect .env.local files from accidental commits
- Prepare for git history cleanup

Security improvements:
- .env.local now properly ignored
- Comprehensive gitignore patterns for common secrets"
    echo -e "${GREEN}✓ Commit realizado exitosamente${NC}\n"
fi

# 8. Mostrar instrucciones para limpiar historial
echo -e "${RED}⚠️  PASO IMPORTANTE: Limpiar historial Git${NC}"
echo -e "${YELLOW}Las claves de Supabase aún están en el historial de Git.${NC}"
echo -e "${YELLOW}Ejecuta uno de estos comandos para limpiar el historial:${NC}\n"

echo -e "${BLUE}Opción 1: Usando BFG (RECOMENDADO - Más rápido):${NC}"
echo "  bash scripts/cleanup-history-bfg.sh\n"

echo -e "${BLUE}Opción 2: Usando git filter-branch (Más lento):${NC}"
echo "  bash scripts/cleanup-history-git.sh\n"

echo -e "${RED}ADVERTENCIA:${NC}"
echo "- Esto reescribirá el historial de Git"
echo "- Todas las ramas serán afectadas"
echo "- Comunica esto al equipo antes de hacer push a origin"
echo "- Requerirá git push --force-with-lease\n"

echo -e "${GREEN}✓ Limpieza completada${NC}"
