#!/bin/bash

# ============================================================================
# PASO 5.1: Opción para continuar automaticamente
# ============================================================================
# Este archivo permite que el usuario elija si ejecutar PASO 5.1 ahora

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "         PASO 5.1: Verificar RLS Policies"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✨ La automatización de PASO 5.1 está lista."
echo ""
echo "Opciones:"
echo "  1) Ejecutar automatización AHORA (recomendado)"
echo "  2) Leer instrucciones primero"
echo "  3) Ver flowchart visual"
echo "  4) Más tarde (salir)"
echo ""
read -p "Selecciona opción (1-4): " option

case $option in
  1)
    echo ""
    echo "🚀 Iniciando PASO 5.1..."
    echo ""
    npm run paso:5-1
    ;;
  2)
    echo ""
    echo "📖 Abriendo instrucciones..."
    echo ""
    if command -v code &> /dev/null; then
      code PASO_5_1_QUICK_START.md
    else
      cat PASO_5_1_QUICK_START.md
    fi
    ;;
  3)
    echo ""
    echo "📊 Abriendo flowchart..."
    echo ""
    if command -v code &> /dev/null; then
      code PASO_5_1_FLOWCHART.md
    else
      cat PASO_5_1_FLOWCHART.md
    fi
    ;;
  4)
    echo ""
    echo "✅ OK, continúa cuando estés listo:"
    echo "   npm run paso:5-1"
    echo ""
    ;;
  *)
    echo "❌ Opción no válida"
    exit 1
    ;;
esac
