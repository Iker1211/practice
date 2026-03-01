#!/bin/bash

# Script para limpiar secretos del historial usando git filter-branch
# Ejecutar con: bash scripts/cleanup-history-git.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}⚠️  ADVERTENCIA CRÍTICA${NC}"
echo "Este script reescribirá TODO el historial de Git usando git filter-branch."
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

echo -e "\n${BLUE}🔐 Iniciando limpieza del historial...${NC}\n"

# Crear directorio de backup
BACKUP_DIR=".git-backup-$(date +%s)"
echo -e "${YELLOW}1️⃣  Creando backup en $BACKUP_DIR...${NC}"
cp -r .git "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup creado${NC}\n"

# Remover archivos que contienen secretos de TODOS los commits
echo -e "${YELLOW}2️⃣  Removiendo .env.local files...${NC}"
git filter-branch --tree-filter 'rm -f .env.local apps/*/.env.local' --prune-empty -f

echo -e "\n${YELLOW}3️⃣  Limpiando reflog...${NC}"
git reflog expire --expire=now --all
git gc --aggressive --prune=now

echo -e "\n${GREEN}✓ Historial limpio exitosamente${NC}\n"

echo -e "${RED}PRÓXIMO PASO:${NC}"
echo -e "Ejecuta: ${BLUE}git push origin --force-with-lease --all${NC}"
echo -e "ADVERTENCIA: Esto sobrescribirá el historial remoto\n"

echo -e "${YELLOW}Si algo salió mal:${NC}"
echo -e "  1. Restaurar backup: rm -rf .git && mv $BACKUP_DIR .git"
echo -e "  2. Remover backup después: rm -rf $BACKUP_DIR\n"

echo -e "${GREEN}✓ Limpieza completada${NC}"
