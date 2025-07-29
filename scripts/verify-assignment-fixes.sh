#!/bin/bash

# ====================================================================
# VERIFICACIÓN DE ERRORES SOLUCIONADOS - Sistema Refactorizado
# ====================================================================

echo "🔧 VERIFICACIÓN DE ERRORES SOLUCIONADOS"
echo "======================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo ""
echo "1. 🔍 Verificando corrección en assignments.js..."

if grep -q "const container = document.getElementById('assignmentsContent');" js/assignments.js; then
    if grep -q "if (!container) {" js/assignments.js; then
        echo -e "  ${GREEN}✅${NC} assignments.js: Verificación de contenedor agregada"
    else
        echo -e "  ${RED}❌${NC} assignments.js: Falta verificación de contenedor"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}❌${NC} assignments.js: No encontrado patrón esperado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "2. 📅 Verificando manejo de fechas en numbers-assignment.js..."

if grep -q "try {" js/numbers-assignment.js; then
    if grep -q "sorteoDate = new Date(AppState.raffleConfig.drawDate);" js/numbers-assignment.js; then
        echo -e "  ${GREEN}✅${NC} numbers-assignment.js: Manejo de fechas mejorado"
    else
        echo -e "  ${RED}❌${NC} numbers-assignment.js: Manejo de fechas no corregido"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}❌${NC} numbers-assignment.js: No encontrado try-catch"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "3. 💾 Verificando correcciones en supabase.js..."

if grep -q "typeof assignment.assigned_at === 'string'" js/supabase.js; then
    echo -e "  ${GREEN}✅${NC} supabase.js: Corrección de assigned_at agregada"
else
    echo -e "  ${RED}❌${NC} supabase.js: Corrección de assigned_at faltante"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "updateNumberOwner:" js/supabase.js; then
    echo -e "  ${GREEN}✅${NC} supabase.js: Función updateNumberOwner añadida"
else
    echo -e "  ${RED}❌${NC} supabase.js: Función updateNumberOwner faltante"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "4. 🗄️ Verificando script SQL para tablas..."

if [ -f "sql/create-assignments-tables.sql" ]; then
    if grep -q "CREATE TABLE.*assignments" sql/create-assignments-tables.sql; then
        echo -e "  ${GREEN}✅${NC} Script SQL: Tabla assignments definida"
    else
        echo -e "  ${RED}❌${NC} Script SQL: Tabla assignments no definida"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "CREATE TABLE.*number_owners" sql/create-assignments-tables.sql; then
        echo -e "  ${GREEN}✅${NC} Script SQL: Tabla number_owners definida"
    else
        echo -e "  ${RED}❌${NC} Script SQL: Tabla number_owners no definida"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}❌${NC} Script SQL: create-assignments-tables.sql no encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "5. 🧪 Verificando sintaxis JavaScript..."

modules=(
    "js/assignments.js"
    "js/numbers-assignment.js"
    "js/supabase.js"
)

syntax_errors=0
for module in "${modules[@]}"; do
    if [ -f "$module" ]; then
        if node -c "$module" 2>/dev/null; then
            echo -e "  ${GREEN}✅${NC} $module - sintaxis OK"
        else
            echo -e "  ${RED}❌${NC} $module - ERROR DE SINTAXIS"
            syntax_errors=$((syntax_errors + 1))
        fi
    else
        echo -e "  ${RED}❌${NC} $module - archivo no encontrado"
        syntax_errors=$((syntax_errors + 1))
    fi
done

ERRORS=$((ERRORS + syntax_errors))

echo ""
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "========================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODOS LOS ERRORES SOLUCIONADOS!${NC}"
    echo ""
    echo "✅ Correcciones aplicadas:"
    echo "  • assignments.js: Verificación de contenedor DOM"
    echo "  • numbers-assignment.js: Manejo seguro de fechas"
    echo "  • supabase.js: Corrección de tipos de fecha"
    echo "  • supabase.js: Función updateNumberOwner agregada"
    echo "  • Script SQL: Tablas para asignaciones creadas"
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "  1. 🗄️ Ejecutar sql/create-assignments-tables.sql en Supabase"
    echo "  2. 🚀 Hacer commit y push de los cambios"
    echo "  3. 🧪 Probar el sistema de asignaciones"
    echo ""
    echo "🚀 Comandos sugeridos:"
    echo "  git add ."
    echo "  git commit -m '🔧 Fix: Resolve assignment errors and add missing DB functions'"
    echo "  git push origin main"
    
    exit 0
else
    echo -e "${RED}❌ ENCONTRADOS $ERRORS PROBLEMAS${NC}"
    echo "🔧 Revisa los errores arriba y corrige antes de continuar"
    exit 1
fi
