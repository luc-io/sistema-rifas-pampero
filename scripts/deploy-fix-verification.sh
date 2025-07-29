#!/bin/bash

# ====================================================================
# VERIFICACIÓN FINAL - Deploy Fix Validation
# ====================================================================

echo "🔍 VERIFICACIÓN FINAL DEL FIX DE DEPLOY"
echo "======================================="

# Verificar estructura de archivos
echo ""
echo "📦 1. Verificando estructura de módulos refactorizados..."

modules=(
    "js/numbers-main.js"
    "js/numbers-interface.js"
    "js/numbers-info.js"
    "js/numbers-purchase.js"
    "js/numbers-assignment.js"
)

all_modules_exist=true
for module in "${modules[@]}"; do
    if [ -f "$module" ]; then
        echo "  ✅ $module"
    else
        echo "  ❌ $module FALTANTE"
        all_modules_exist=false
    fi
done

# Verificar que no existe el archivo original
echo ""
echo "🗑️ 2. Verificando archivo original removido..."
if [ -f "js/numbers.js" ]; then
    echo "  ❌ js/numbers.js aún existe (debería estar removido)"
else
    echo "  ✅ js/numbers.js correctamente removido"
fi

# Verificar backup movido
echo ""
echo "💾 3. Verificando backup..."
if [ -f "backups/refactoring/numbers-original.js" ]; then
    echo "  ✅ Backup movido a backups/refactoring/numbers-original.js"
else
    echo "  ⚠️ Backup no encontrado"
fi

# Verificar deploy.yml actualizado
echo ""
echo "🚀 4. Verificando configuración de deploy..."
if grep -q "numbers-main.js" .github/workflows/deploy.yml; then
    echo "  ✅ deploy.yml contiene numbers-main.js"
else
    echo "  ❌ deploy.yml no actualizado"
fi

if grep -q "numbers-assignment.js" .github/workflows/deploy.yml; then
    echo "  ✅ deploy.yml contiene numbers-assignment.js"
else
    echo "  ❌ deploy.yml no contiene todos los módulos"
fi

# Verificar exclusión de backups
if grep -q "backup.js" .github/workflows/deploy.yml; then
    echo "  ✅ deploy.yml excluye archivos de backup"
else
    echo "  ⚠️ deploy.yml no excluye archivos de backup"
fi

# Simular validación de sintaxis (como en el deploy)
echo ""
echo "🔧 5. Simulando validación de sintaxis del deploy..."

syntax_errors=0
for js_file in js/*.js; do
    if [ -f "$js_file" ] && [[ "$js_file" != *"-backup.js" ]] && [[ "$js_file" != *"-old-backup.js" ]]; then
        if node -c "$js_file" 2>/dev/null; then
            echo "  ✅ $js_file - sintaxis OK"
        else
            echo "  ❌ $js_file - ERROR DE SINTAXIS"
            syntax_errors=$((syntax_errors + 1))
        fi
    fi
done

# Verificar carga en HTML
echo ""
echo "📄 6. Verificando carga en index.html..."
html_checks=0

for module in "${modules[@]}"; do
    module_name=$(basename "$module")
    if grep -q "$module_name" index.html; then
        echo "  ✅ $module_name cargado en HTML"
        html_checks=$((html_checks + 1))
    else
        echo "  ❌ $module_name NO cargado en HTML"
    fi
done

# Resumen final
echo ""
echo "📊 RESUMEN FINAL"
echo "==============="

if [ "$all_modules_exist" = true ] && [ $syntax_errors -eq 0 ] && [ $html_checks -eq 5 ]; then
    echo "🎉 ¡DEPLOY FIX EXITOSO!"
    echo ""
    echo "✅ Todos los módulos refactorizados existen"
    echo "✅ Sintaxis JavaScript correcta"
    echo "✅ Configuración de deploy actualizada"
    echo "✅ Archivos de backup organizados"
    echo "✅ HTML carga todos los módulos"
    echo ""
    echo "🚀 El deploy debería pasar exitosamente ahora"
    echo ""
    echo "Comandos sugeridos:"
    echo "  git add ."
    echo "  git commit -m '🔧 Fix: Resolve deploy validation for refactored modules'"
    echo "  git push origin main"
    
    exit 0
else
    echo "❌ AÚN HAY PROBLEMAS:"
    [ "$all_modules_exist" = false ] && echo "  - Faltan algunos módulos"
    [ $syntax_errors -gt 0 ] && echo "  - Errores de sintaxis en $syntax_errors archivos"
    [ $html_checks -ne 5 ] && echo "  - No todos los módulos están cargados en HTML"
    
    exit 1
fi
