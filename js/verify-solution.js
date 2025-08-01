/**
 * 🔍 Script de Verificación Post-Solución
 * Ejecutar en consola del navegador para verificar que todo funciona
 */

window.verifyMobileResetSolution = function() {
    console.log('🔍 [VERIFICACION] Verificando solución de reset móvil...');
    
    const checks = {
        '✅ Force Sync disponible': typeof forceSyncFromSupabase === 'function',
        '✅ Diagnósticos disponibles': typeof runSystemDiagnostics === 'function', 
        '✅ Auto-detección disponible': typeof autoDetectSyncNeeded === 'function',
        '✅ Singleton Supabase': typeof SupabaseSingleton === 'object',
        '✅ Init Manager v2': typeof InitManager === 'object',
        '✅ Supabase conectado': window.SupabaseManager?.isConnected || false,
        '✅ Variables configuradas': !!window.ENV_RAFFLE_CONFIG,
        '✅ Estado aplicación': !!window.AppState
    };
    
    console.log('📊 [VERIFICACION] Resultados:');
    let passedChecks = 0;
    const totalChecks = Object.keys(checks).length;
    
    Object.entries(checks).forEach(([check, result]) => {
        if (result) {
            console.log(`  ${check}: OK`);
            passedChecks++;
        } else {
            console.log(`  ❌ ${check}: FALLA`);
        }
    });
    
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    console.log(`📈 [VERIFICACION] Estado: ${percentage}% (${passedChecks}/${totalChecks})`);
    
    if (percentage >= 90) {
        console.log('🎉 [VERIFICACION] ¡Solución aplicada correctamente!');
        
        // Verificar sincronización automáticamente
        if (typeof autoDetectSyncNeeded === 'function') {
            console.log('🔄 [VERIFICACION] Ejecutando auto-detección de sincronización...');
            autoDetectSyncNeeded();
        }
        
        return true;
    } else {
        console.log('⚠️ [VERIFICACION] Algunos componentes faltan');
        console.log('📋 [ACCION] Revisar que todos los scripts estén cargados');
        return false;
    }
};

// Ejecutar verificación automática después de 5 segundos
setTimeout(() => {
    if (typeof verifyMobileResetSolution === 'function') {
        verifyMobileResetSolution();
    }
}, 5000);

console.log('🔍 [VERIFICACION] Script cargado - Ejecutar verifyMobileResetSolution()');
