/**
 * VERIFICADOR DE MENSAJES DE WHATSAPP
 * Script para verificar que los mensajes usen la fecha correcta
 */

function verifyWhatsAppMessages() {
    console.log('🔍 Verificando mensajes de WhatsApp...');
    
    // Verificar configuración actual
    let currentDrawDate = null;
    
    if (window.AppState && window.AppState.raffleConfig && window.AppState.raffleConfig.drawDate) {
        currentDrawDate = window.AppState.raffleConfig.drawDate;
        console.log('📅 Fecha en AppState:', currentDrawDate);
    }
    
    if (window.ENV_RAFFLE_CONFIG && window.ENV_RAFFLE_CONFIG.drawDate) {
        console.log('📅 Fecha en ENV_RAFFLE_CONFIG:', window.ENV_RAFFLE_CONFIG.drawDate);
    }
    
    if (window.AppConfig && window.AppConfig.raffle && window.AppConfig.raffle.drawDate) {
        console.log('📅 Fecha en AppConfig:', window.AppConfig.raffle.drawDate);
    }
    
    // Crear una venta de prueba para verificar el mensaje
    if (window.NumbersPurchase && window.NumbersPurchase.generateSimpleWhatsAppMessage) {
        const testSale = {
            buyer: {
                name: 'Test',
                lastName: 'Usuario',
                phone: '341-1234567'
            },
            numbers: [1, 2, 3],
            total: 6000,
            paymentMethod: 'transferencia',
            status: 'pending',
            date: new Date()
        };
        
        const testMessage = window.NumbersPurchase.generateSimpleWhatsAppMessage(testSale, '001, 002, 003');
        console.log('📱 Mensaje de WhatsApp generado:');
        console.log(testMessage);
        
        // Verificar si contiene la fecha correcta
        if (testMessage.includes('30 de agosto') || testMessage.includes('30/08') || testMessage.includes('2025-08-30')) {
            console.log('✅ El mensaje contiene la fecha CORRECTA (30 de agosto)');
        } else if (testMessage.includes('31 de agosto') || testMessage.includes('31/08') || testMessage.includes('2025-08-31')) {
            console.log('❌ El mensaje contiene la fecha INCORRECTA (31 de agosto)');
            console.log('🔧 Ejecutando corrección...');
            if (window.fixDrawDate) {
                window.fixDrawDate();
            }
        } else {
            console.log('⚠️ No se encontró referencia a fecha específica en el mensaje');
        }
    }
    
    // Verificar función de formateo de fecha
    if (window.Utils && window.Utils.formatDateTime && currentDrawDate) {
        const formattedDate = window.Utils.formatDateTime(currentDrawDate);
        console.log('📅 Fecha formateada:', formattedDate);
    }
    
    return {
        currentDrawDate,
        testCompleted: true
    };
}

// Ejecutar verificación después de que todo esté cargado
setTimeout(() => {
    verifyWhatsAppMessages();
}, 2000);

// Hacer disponible globalmente
window.verifyWhatsAppMessages = verifyWhatsAppMessages;

console.log('📋 Verificador de mensajes de WhatsApp cargado.');