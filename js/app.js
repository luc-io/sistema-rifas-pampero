/**
 * APLICACIÓN PRINCIPAL - Sistema de Rifas Pampero
 * Punto de entrada y funciones principales
 */

// Gestión principal de la aplicación
window.RaffleApp = {
    /**
     * Inicializar Supabase
     */
    initSupabase: function() {
        // Configuración Supabase
        const supabaseUrl = 'https://ssmpnzcjhrjqhglqkmoe.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXBuemNqaHJqcWhnbHFrbW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MDI1NDgsImV4cCI6MjA0OTE3ODU0OH0.RXR9xLdpKznj8aowQGsj3dKkrxKKKKpRogqtjBBgZKs';
        
        try {
            const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            window.supabaseClient = supabaseClient;
            
            // Inicializar SupabaseManager
            if (window.SupabaseManager) {
                SupabaseManager.init(supabaseClient);
                this.updateDbStatus('🚀 Supabase conectado', '#d4edda');
                console.log('✅ Supabase inicializado correctamente');
            } else {
                console.warn('⚠️ SupabaseManager no está disponible');
                this.updateDbStatus('⚠️ Error de configuración', '#f8d7da');
            }
        } catch (error) {
            console.warn('Supabase no configurado:', error.message);
            this.updateDbStatus('📱 Modo local (localStorage)', '#fff3cd');
        }
    },

    /**
     * Actualizar indicador de estado de la base de datos
     */
    updateDbStatus: function(message, color) {
        const status = document.getElementById('dbStatus');
        if (status) {
            status.textContent = message;
            status.style.background = color;
        }
    },

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

        // Guardar configuración usando SupabaseManager si está disponible
        if (window.SupabaseManager && SupabaseManager.isConnected) {
            SupabaseManager.saveRaffleConfig(AppState.raffleConfig)
                .then(() => {
                    console.log('✅ Configuración guardada en Supabase');
                })
                .catch((error) => {
                    console.error('❌ Error guardando en Supabase:', error);
                    // Fallback a localStorage
                    autoSave();
                });
        } else {
            // Usar localStorage como fallback
            autoSave();
        }

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
        // Primero inicializar Supabase
        this.initSupabase();
        
        // Luego cargar datos (que ahora usará Supabase si está disponible)
        setTimeout(() => {
            loadFromStorage();
        }, 500); // Pequeño delay para permitir que Supabase se inicialice
        
        console.log('✅ RaffleApp inicializado correctamente');
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    RaffleApp.init();
});

console.log('✅ App.js cargado correctamente');