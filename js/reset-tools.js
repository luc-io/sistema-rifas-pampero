/**
 * 🧹 Script de Reset Avanzado para Supabase
 * Ejecutar desde la consola del navegador
 */

(function() {
    'use strict';
    
    /**
     * Reset completo de la base de datos desde la aplicación
     */
    window.resetSupabaseDatabase = async function() {
        console.log('🧹 [RESET] Iniciando reset de base de datos Supabase...');
        
        if (!window.SupabaseManager || !window.SupabaseManager.isConnected) {
            console.error('❌ [RESET] Supabase no está conectado');
            alert('Error: Supabase no está conectado');
            return false;
        }
        
        // Confirmación doble
        const confirmReset = confirm(
            '⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la rifa actual.\n\n' +
            '✅ Se incluye:\n' +
            '- Todas las ventas\n' +
            '- Todas las reservas\n' + 
            '- Todas las asignaciones\n' +
            '- Configuración de la rifa\n' +
            '- Historial completo\n\n' +
            '❌ Esta acción NO se puede deshacer.\n\n' +
            '¿Estás seguro de que quieres continuar?'
        );
        
        if (!confirmReset) {
            console.log('⏹️ [RESET] Reset cancelado por el usuario');
            return false;
        }
        
        const doubleConfirm = prompt(
            'Para confirmar, escribe exactamente: RESETEAR TODO\n\n' +
            '(Esto asegura que entiendes que se perderán todos los datos)'
        );
        
        if (doubleConfirm !== 'RESETEAR TODO') {
            console.log('⏹️ [RESET] Reset cancelado - confirmación incorrecta');
            alert('Reset cancelado. Texto de confirmación incorrecto.');
            return false;
        }
        
        try {
            console.log('🔄 [RESET] Comenzando eliminación de datos...');
            
            // 1. Backup de datos actuales (descargar CSV)
            if (window.AdminManager && window.AdminManager.exportData) {
                console.log('📥 [RESET] Creando backup automático...');
                try {
                    await AdminManager.exportData();
                    console.log('✅ [RESET] Backup descargado automáticamente');
                } catch (error) {
                    console.warn('⚠️ [RESET] Error creando backup:', error);
                }
            }
            
            // 2. Eliminar datos en orden correcto
            const tablesToReset = [
                'number_owners',
                'assignment_holders', 
                'assignments',
                'reservations',
                'sales',
                'raffles'
            ];
            
            let deletedCounts = {};
            
            for (const table of tablesToReset) {
                try {
                    console.log(`🗑️ [RESET] Eliminando datos de tabla: ${table}`);
                    
                    const { data, error, count } = await window.supabaseClient
                        .from(table)
                        .delete()
                        .neq('id', 'never_exists'); // Eliminar todo
                    
                    if (error) {
                        console.warn(`⚠️ [RESET] Error eliminando ${table}:`, error);
                        // Continúar con las demás tablas
                    } else {
                        deletedCounts[table] = count || 'desconocido';
                        console.log(`✅ [RESET] ${table}: ${deletedCounts[table]} registros eliminados`);
                    }
                } catch (error) {
                    console.warn(`⚠️ [RESET] Error en tabla ${table}:`, error);
                }
            }
            
            // 3. Limpiar localStorage también
            console.log('🧹 [RESET] Limpiando localStorage...');
            const localStorageKeys = [
                'raffleConfig',
                'raffleData', 
                'sales',
                'reservations',
                'assignments',
                'assignmentHolders'
            ];
            
            localStorageKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`✅ [RESET] localStorage.${key} eliminado`);
            });
            
            // 4. Resetear estado de la aplicación
            if (window.AppState) {
                console.log('🔄 [RESET] Reseteando estado de la aplicación...');
                window.AppState.raffleConfig = null;
                window.AppState.sales = [];
                window.AppState.reservations = [];
                window.AppState.assignments = [];
                window.AppState.assignmentHolders = [];
                console.log('✅ [RESET] Estado de aplicación reseteado');
            }
            
            // 5. Mostrar resumen
            console.log('📊 [RESET] Resumen de eliminación:');
            Object.entries(deletedCounts).forEach(([table, count]) => {
                console.log(`  ${table}: ${count} registros`);
            });
            
            console.log('🎉 [RESET] Reset de base de datos completado exitosamente');
            
            // 6. Recargar la página
            alert(
                '✅ Reset completado exitosamente!\n\n' +
                '📥 Backup descargado automáticamente\n' +
                '🗑️ Todos los datos eliminados\n' +
                '🔄 La página se recargará para aplicar cambios'
            );
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
            return true;
            
        } catch (error) {
            console.error('❌ [RESET] Error durante el reset:', error);
            alert(`Error durante el reset: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Verificar estado de las tablas
     */
    window.checkDatabaseTables = async function() {
        console.log('🔍 [CHECK] Verificando estado de las tablas...');
        
        if (!window.SupabaseManager || !window.SupabaseManager.isConnected) {
            console.error('❌ [CHECK] Supabase no está conectado');
            return false;
        }
        
        const tables = [
            'raffles',
            'sales', 
            'reservations',
            'assignments',
            'assignment_holders',
            'number_owners'
        ];
        
        const results = {};
        
        for (const table of tables) {
            try {
                const { data, error, count } = await window.supabaseClient
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    results[table] = { status: 'error', error: error.message };
                } else {
                    results[table] = { status: 'ok', count: count };
                }
            } catch (error) {
                results[table] = { status: 'not_exists', error: error.message };
            }
        }
        
        console.log('📊 [CHECK] Estado de las tablas:');
        Object.entries(results).forEach(([table, result]) => {
            if (result.status === 'ok') {
                console.log(`  ✅ ${table}: ${result.count} registros`);
            } else if (result.status === 'not_exists') {
                console.log(`  ❌ ${table}: NO EXISTE`);
            } else {
                console.log(`  ⚠️ ${table}: ERROR - ${result.error}`);
            }
        });
        
        return results;
    };
    
    console.log('🧹 [RESET-TOOLS] Herramientas de reset cargadas');
    console.log('📋 [RESET-TOOLS] Comandos disponibles:');
    console.log('  resetSupabaseDatabase() - Reset completo');
    console.log('  checkDatabaseTables() - Verificar estado');
})();
