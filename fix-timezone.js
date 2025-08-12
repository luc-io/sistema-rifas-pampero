/**
 * CORRECCIÓN DE ZONA HORARIA PARA ARGENTINA
 * Script para manejar correctamente las fechas en zona horaria argentina
 */

function fixTimezoneForArgentina() {
    console.log('🕐 [TIMEZONE] Corrigiendo zona horaria para Argentina...');
    
    // Función para convertir hora local argentina a UTC
    function argentineTimeToUTC(dateString) {
        // Crear fecha interpretándola como hora argentina (UTC-3)
        const localDate = new Date(dateString);
        
        // Argentina está UTC-3, así que agregamos 3 horas para convertir a UTC
        const utcDate = new Date(localDate.getTime() + (3 * 60 * 60 * 1000));
        
        return utcDate.toISOString();
    }
    
    // Función para convertir UTC a hora argentina
    function utcToArgentineTime(utcString) {
        const utcDate = new Date(utcString);
        
        // Restar 3 horas para obtener hora argentina
        const argDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
        
        return argDate;
    }
    
    // Corregir la configuración actual si existe
    if (window.AppState && window.AppState.raffleConfig && window.AppState.raffleConfig.drawDate) {
        const currentDrawDate = window.AppState.raffleConfig.drawDate;
        console.log('🕐 [TIMEZONE] Fecha actual:', currentDrawDate);
        
        // Si la fecha es un string, convertirla
        if (typeof currentDrawDate === 'string') {
            window.AppState.raffleConfig.drawDate = new Date(currentDrawDate);
        }
        
        // Verificar si la hora mostrada es correcta
        const displayDate = window.AppState.raffleConfig.drawDate;
        const argTime = utcToArgentineTime(displayDate.toISOString());
        
        console.log('🕐 [TIMEZONE] Hora en Argentina:', argTime.toLocaleString('es-AR'));
        console.log('🕐 [TIMEZONE] ¿Es 21:00?', argTime.getHours() === 21 ? '✅ Correcto' : '❌ Incorrecto');
        
        // Si no es 21:00, corregir
        if (argTime.getHours() !== 21) {
            console.log('🔧 [TIMEZONE] Corrigiendo hora...');
            
            // Crear fecha correcta: 30 de agosto 2025, 21:00 Argentina
            const correctArgTime = new Date('2025-08-30T21:00:00');
            const correctUtcTime = argentineTimeToUTC('2025-08-30T21:00:00');
            
            console.log('🕐 [TIMEZONE] Hora correcta en Argentina:', correctArgTime.toLocaleString('es-AR'));
            console.log('🕐 [TIMEZONE] Hora correcta en UTC:', correctUtcTime);
            
            // Actualizar configuración
            window.AppState.raffleConfig.drawDate = new Date(correctUtcTime);
            
            // Guardar cambios
            if (window.autoSave) {
                window.autoSave();
            }
            
            console.log('✅ [TIMEZONE] Hora corregida exitosamente');
        }
    }
    
    // Función para mostrar siempre en hora argentina
    window.formatDateTimeArgentina = function(date) {
        if (!date) return 'No definida';
        
        const argDate = utcToArgentineTime(date.toISOString ? date.toISOString() : date);
        
        return argDate.toLocaleDateString('es-AR') + ' ' + 
               argDate.toLocaleTimeString('es-AR', { 
                   hour: '2-digit', 
                   minute: '2-digit',
                   hour12: false 
               });
    };
    
    // Sobrescribir Utils.formatDateTime si existe
    if (window.Utils && window.Utils.formatDateTime) {
        const originalFormatDateTime = window.Utils.formatDateTime;
        
        window.Utils.formatDateTime = function(date) {
            return window.formatDateTimeArgentina(date);
        };
        
        console.log('✅ [TIMEZONE] Utils.formatDateTime sobrescrito para mostrar hora argentina');
    }
    
    // Actualizar interfaz si existe
    if (window.AdminManager && window.AdminManager.updateInterface) {
        window.AdminManager.updateInterface();
    }
    
    console.log('🎉 [TIMEZONE] Corrección de zona horaria completada');
    
    // Mostrar información útil
    const info = {
        currentTime: new Date().toLocaleString('es-AR'),
        targetDrawTime: '30/08/2025 21:00',
        utcEquivalent: '31/08/2025 00:00 UTC',
        status: 'Zona horaria corregida para Argentina (UTC-3)'
    };
    
    console.table(info);
    
    return info;
}

// Hacer funciones disponibles globalmente
window.fixTimezoneForArgentina = fixTimezoneForArgentina;
window.formatDateTimeArgentina = function(date) {
    if (!date) return 'No definida';
    
    // Interpretar como UTC y convertir a Argentina
    const utcDate = new Date(date);
    const argDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
    
    return argDate.toLocaleDateString('es-AR') + ' ' + 
           argDate.toLocaleTimeString('es-AR', { 
               hour: '2-digit', 
               minute: '2-digit',
               hour12: false 
           });
};

// Ejecutar automáticamente
setTimeout(fixTimezoneForArgentina, 3000);

console.log('🕐 [TIMEZONE] Script de corrección de zona horaria cargado');
