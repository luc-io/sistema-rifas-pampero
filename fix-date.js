/**
 * SCRIPT PARA FORZAR ACTUALIZACIÓN DE FECHA DE SORTEO
 * Ejecutar este script en la consola del navegador para forzar la actualización
 */

function fixDrawDate() {
    console.log('🔧 Ejecutando corrección de fecha...');
    
    // 1. Limpiar localStorage
    localStorage.removeItem('raffleConfig');
    localStorage.removeItem('sales');
    localStorage.removeItem('reservations');
    console.log('✅ Cache local limpiado');
    
    // 2. Actualizar configuración en memoria
    if (window.AppState && window.AppState.raffleConfig) {
        window.AppState.raffleConfig.drawDate = new Date('2025-08-30T21:00:00');
        console.log('✅ Fecha actualizada en memoria:', window.AppState.raffleConfig.drawDate);
    }
    
    // 3. Forzar actualización de variables de entorno
    if (window.ENV_RAFFLE_CONFIG) {
        window.ENV_RAFFLE_CONFIG.drawDate = "2025-08-30T21:00:00";
        console.log('✅ Variables de entorno actualizadas');
    }
    
    // 4. Actualizar configuración global
    if (window.AppConfig && window.AppConfig.raffle) {
        window.AppConfig.raffle.drawDate = '2025-08-30T21:00:00';
        console.log('✅ AppConfig actualizado');
    }
    
    // 5. Guardar cambios
    if (window.autoSave) {
        window.autoSave();
        console.log('✅ Cambios guardados');
    }
    
    // 6. Actualizar interfaz
    if (window.AdminManager && window.AdminManager.updateInterface) {
        window.AdminManager.updateInterface();
        console.log('✅ Interfaz actualizada');
    }
    
    // 7. Mostrar confirmación
    if (window.Utils && window.Utils.showNotification) {
        window.Utils.showNotification('✅ Fecha del sorteo actualizada al 30 de agosto', 'success');
    }
    
    console.log('🎉 Corrección completada. La fecha ahora debería ser 30 de agosto 21:00');
    
    // 8. Verificar la fecha actual
    if (window.AppState && window.AppState.raffleConfig && window.AppState.raffleConfig.drawDate) {
        console.log('📅 Fecha actual en el sistema:', window.AppState.raffleConfig.drawDate);
    }
}

// Ejecutar la corrección automáticamente
fixDrawDate();

// Hacer disponible globalmente para uso manual
window.fixDrawDate = fixDrawDate;

console.log('📋 Script de corrección de fecha cargado. Ejecuta fixDrawDate() si necesitas corregir manualmente.');