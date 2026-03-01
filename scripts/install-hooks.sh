#!/bin/bash

# Script para instalar hooks de seguridad
# Ejecutar con: bash scripts/install-hooks.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Instalando Git Hooks de Seguridad${NC}\n"

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="scripts"

# 1. Crear directorio de hooks si no existe
if [ ! -d "$HOOKS_DIR" ]; then
    mkdir -p "$HOOKS_DIR"
    echo -e "${GREEN}✓ Directorio .git/hooks creado${NC}"
fi

# 2. Instalar pre-commit hook
echo -e "${YELLOW}📋 Instalando pre-commit hook...${NC}"
if [ -f "$SCRIPT_DIR/pre-commit-hook.sh" ]; then
    cp "$SCRIPT_DIR/pre-commit-hook.sh" "$HOOKS_DIR/pre-commit"
    chmod +x "$HOOKS_DIR/pre-commit"
    echo -e "${GREEN}✓ Pre-commit hook instalado${NC}"
else
    echo -e "${RED}❌ pre-commit-hook.sh no encontrado${NC}"
fi

# 3. Crear hook alternativo para prepare-commit-msg
echo -e "${YELLOW}📋 Creando prepare-commit-msg hook...${NC}"
cat > "$HOOKS_DIR/prepare-commit-msg" << 'EOF'
#!/bin/bash
# Hook para recordar convenciones de commits

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Si es copiado o amend, no hacer nada
if [ "$COMMIT_SOURCE" == "commit" ] || [ "$COMMIT_SOURCE" == "message" ]; then
    # Agregar template comentado
    {
        echo ""
        echo "# Convenciones de commit:"
        echo "# feat:     Nueva característica"
        echo "# fix:      Corrección de bug"
        echo "# docs:     Cambios en documentación"
        echo "# style:    Cambios de formato (sin cambios funcionales)"
        echo "# refactor: Refactorización de código"
        echo "# perf:     Cambios de rendimiento"
        echo "# chore:    Tareas de mantenimiento"
        echo "# security: Correcciones de seguridad"
        echo "# test:     Agregación o actualización de tests"
    } >> "$COMMIT_MSG_FILE"
fi
EOF
chmod +x "$HOOKS_DIR/prepare-commit-msg"
echo -e "${GREEN}✓ Prepare-commit-msg hook instalado${NC}"

# 4. Verificar .gitignore
echo -e "\n${YELLOW}📋 Verificando .gitignore...${NC}"
if grep -q ".env.local" .gitignore; then
    echo -e "${GREEN}✓ .env.local está en .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local no está en .gitignore${NC}"
fi

# 5. Mostrar resumen
echo -e "\n${BLUE}📊 Resumen de instalación:${NC}"
echo -e "  ${GREEN}✓${NC} Pre-commit hook instalado"
echo -e "  ${GREEN}✓${NC} Prepare-commit-msg hook instalado"

echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo -e "  1. Ejecutar limpieza: ${BLUE}bash scripts/cleanup-security.sh${NC}"
echo -e "  2. Revisar cambios: ${BLUE}git status${NC}"
echo -e "  3. Si necesario, limpiar historial: ${BLUE}bash scripts/cleanup-history-bfg.sh${NC}"

echo -e "\n${GREEN}✓ Instalación completada${NC}\n"
