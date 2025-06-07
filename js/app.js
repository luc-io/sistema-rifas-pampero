/**
 * APLICACIÓN PRINCIPAL - Sistema de Rifas Pampero
 * Punto de entrada y funciones principales
 */

// Gestión principal de la aplicación
window.RaffleApp = {
    /**
     * Configurar la rifa inicial
     */
    setupRaffle: function() {
        const name = document.getElementById('raffleName').value;
        const prize = document.getElementById('prizeDescription').value;
        const totalNumbers = parseInt(document.getElementById('totalNumbers').value);
        const price = parseFloat(document.getElementById('pricePerNumber').value);
        const organization = document.getElementById('organizationName').value;
        const whatsappNumber = document.getElementById('whatsappNumber').value;
        const reservationTime = parseInt(document.getElementById('reservationTime').value);

        if (!name || !prize || !totalNumbers || !price || !whatsappNumber || !reservationTime) {
            Utils.showNotification('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        // Validar formato de WhatsApp
        if (!Utils.validateWhatsApp(whatsappNumber)) {
            Utils.showNotification('Por favor ingresa un número de WhatsApp válido', 'error');
            return;
        }

        AppState.raffleConfig = {
            name,
            prize,
            totalNumbers,
            price,
            organization,
            whatsappNumber,
            reservationTime,
            createdAt: new Date()
        };

        // Actualizar header
        document.getElementById('raffleTitle').textContent = name;
        document.getElementById('raffleSubtitle').textContent = `${organization} - $${price} por número`;

        // Guardar configuración
        autoSave();

        // Inicializar interfaces
        NumbersManager.createInterface();
        AdminManager.createInterface();
        NumbersManager.startReservationChecker();

        Utils.showNotification('¡Rifa configurada exitosamente!', 'success');
        showTab('numbers');
    },

    /**
     * Inicializar la aplicación al cargar
     */
    init: function() {
        loadFromStorage();
        console.log('✅ RaffleApp inicializado correctamente');
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    RaffleApp.init();
});

console.log('✅ App.js cargado correctamente');