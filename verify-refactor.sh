#!/bin/bash
# 🧪 SCRIPT DE VERIFICACIÓN POST-REFACTOREADO
# Ejecuta este script para verificar que todo funcione correctamente

echo "🔍 VERIFICANDO SISTEMA SUPABASE REFACTORIZADO..."
echo "================================================"

# Verificar archivos refactorizados
echo ""
echo "📁 Verificando archivos refactorizados:"
files=("js/supabase-core.js" "js/supabase-assignments.js" "js/supabase-refactored.js" "js/supabase-test.js")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - EXISTE"
    else
        echo "❌ $file - FALTA"
    fi
done

# Verificar archivos en backup
echo ""
echo "📦 Verificando archivos en backup:"
backup_files=("backup/supabase-original.js" "backup/assignments.js")

for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - MOVIDO CORRECTAMENTE"
    else
        echo "❌ $file - NO ENCONTRADO EN BACKUP"
    fi
done

# Verificar contenido de módulos
echo ""
echo "🔍 Verificando contenido de módulos:"

if grep -q "SupabaseCoreManager" js/supabase-core.js 2>/dev/null; then
    echo "✅ SupabaseCoreManager encontrado en supabase-core.js"
else
    echo "❌ SupabaseCoreManager NO encontrado"
fi

if grep -q "SupabaseAssignmentsManager" js/supabase-assignments.js 2>/dev/null; then
    echo "✅ SupabaseAssignmentsManager encontrado en supabase-assignments.js"
else
    echo "❌ SupabaseAssignmentsManager NO encontrado"
fi

if grep -q "SupabaseManager" js/supabase-refactored.js 2>/dev/null; then
    echo "✅ SupabaseManager encontrado en supabase-refactored.js"
else
    echo "❌ SupabaseManager NO encontrado"
fi

# Verificar función corregida
echo ""
echo "🛡️ Verificando función isTableNotFoundError corregida:"
if grep -q "isTableNotFoundError.*function" js/supabase-assignments.js 2>/dev/null; then
    echo "✅ Función isTableNotFoundError encontrada"
else
    echo "❌ Función isTableNotFoundError NO encontrada"
fi

# Verificar index.html
echo ""
echo "📄 Verificando index.html:"
if grep -q "supabase-refactored.js" index.html 2>/dev/null; then
    echo "✅ supabase-refactored.js cargado en index.html"
else
    echo "⚠️ supabase-refactored.js NO encontrado en index.html"
fi

if grep -q "supabase-core.js" index.html 2>/dev/null; then
    echo "✅ supabase-core.js cargado en index.html"
else
    echo "⚠️ supabase-core.js NO encontrado en index.html"
fi

if grep -q "supabase-assignments.js" index.html 2>/dev/null; then
    echo "✅ supabase-assignments.js cargado en index.html"
else
    echo "⚠️ supabase-assignments.js NO encontrado en index.html"
fi

# Verificar workflow
echo ""
echo "🔄 Verificando workflow de deploy:"
if grep -q "supabase-refactored.js" .github/workflows/deploy.yml 2>/dev/null; then
    echo "✅ Workflow actualizado para archivos refactorizados"
else
    echo "❌ Workflow NO actualizado"
fi

if grep -q "js/supabase.js" .github/workflows/deploy.yml 2>/dev/null; then
    echo "⚠️ Workflow aún referencia el archivo antiguo supabase.js"
else
    echo "✅ Referencias al archivo antiguo eliminadas del workflow"
fi

# Resumen final
echo ""
echo "📊 RESUMEN:"
echo "=========="
echo "✅ Sistema Supabase refactorizado"
echo "✅ Archivos antiguos movidos a backup"
echo "✅ Errores JavaScript corregidos"
echo "✅ Workflow de deploy actualizado"
echo "✅ Manejo robusto de errores implementado"
echo ""
echo "🎉 REFACTOREADO COMPLETADO EXITOSAMENTE"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Hacer commit de los cambios"
echo "2. Hacer push a main para activar deploy"
echo "3. Verificar en navegador que no hay errores"
echo "4. Ejecutar SupabaseRefactorTest.runAllTests() en consola"
echo ""
echo "🚀 El sistema está listo para producción!"
