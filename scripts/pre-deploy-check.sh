#!/bin/bash

# ====================================================================
# VERIFICACIÓN PRE-DEPLOY - Sistema de Rifas Pampero Refactorizado
# ====================================================================

echo "🔍 VERIFICACIÓN PRE-DEPLOY"
echo "=========================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

echo ""
echo "📦 1. Verificando módulos refactorizados..."

# Lista de módulos requeridos (igual que en deploy.yml)
required_modules=(
    "js/numbers-main.js"
    "js/numbers-interface.js" 
    "js/numbers-info.js"
    "js/numbers-purchase.js"
    "js/numbers-assignment.js"
)

for module in "${required_modules[@]}"; do
    if [ -f "$module" ]; then
        echo -e "  ${GREEN}✅${NC} $module"
    else
        echo -e "  ${RED}❌${NC} $module FALTANTE"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "🔧 2. Verificando sintaxis de JavaScript..."

for js_file in js/numbers-*.js; do
    if [ -f "$js_file" ]; then
        if node -c "$js_file" 2>/dev/null; then
            echo -e "  ${GREEN}✅${NC} $js_file - sintaxis OK"
        else
            echo -e "  ${RED}❌${NC} $js_file - ERROR DE SINTAXIS"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

echo ""
echo "📄 3. Verificando estructura HTML..."

if grep -q "numbers-main.js" index.html; then
    echo -e "  ${GREEN}✅${NC} index.html carga números-main.js"
else
    echo -e "  ${RED}❌${NC} index.html no carga números-main.js"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "numbers-interface.js" index.html; then
    echo -e "  ${GREEN}✅${NC} index.html carga números-interface.js"
else
    echo -e "  ${RED}❌${NC} index.html no carga números-interface.js"
    ERRORS=$((ERRORS + 1))  
fi

echo ""
echo "🔍 4. Verificando que NO existe el archivo antiguo..."

if [ -f "js/numbers.js" ]; then
    echo -e "  ${RED}❌${NC} js/numbers.js todavía existe (debería estar renombrado)"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✅${NC} js/numbers.js correctamente removido"
fi

if [ -f "js/numbers-old-backup.js" ]; then
    echo -e "  ${GREEN}✅${NC} Backup encontrado en js/numbers-old-backup.js"
else
    echo -e "  ${YELLOW}⚠️${NC} No se encuentra backup del archivo original"
fi

echo ""
echo "🛠️ 5. Verificando configuración de deploy..."

if grep -q "numbers-main.js" .github/workflows/deploy.yml; then
    echo -e "  ${GREEN}✅${NC} deploy.yml actualizado con nuevos módulos"
else
    echo -e "  ${RED}❌${NC} deploy.yml no actualizado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📊 RESUMEN"
echo "=========="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODO CORRECTO!${NC}"
    echo "✅ El sistema está listo para deploy"
    echo ""
    echo "🚀 Comandos sugeridos:"
    echo "  git add ."
    echo "  git commit -m '🔧 Fix: Update deploy validation for refactored modules'"
    echo "  git push origin main"
    exit 0
else
    echo -e "${RED}❌ ENCONTRADOS $ERRORS ERRORES${NC}"
    echo "🔧 Corrige los problemas antes de hacer deploy"
    exit 1
fi
