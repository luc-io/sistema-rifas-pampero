/**
 * APLICACIÓN PRINCIPAL - Sistema de Rifas Pampero
 * Punto de entrada y funciones principales
 */

// Gestión principal de la aplicación
window.RaffleApp = {
    /**
     * Inicializar Supabase de forma segura
     */
    initSupabase: function() {
        console.log('🔍 [DEBUG] Iniciando initSupabase de forma segura...');
        
        // Verificar que AppConfig esté disponible
        if (!window.AppConfig) {
            console.error('❌ [DEBUG] AppConfig no está disponible');
            this.updateDbStatus('❌ Error de configuración', '#f8d7da');
            return false;
        }
        
        // Inicializar configuración segura
        const configInitialized = AppConfig.init();
        
        if (!configInitialized) {
            console.warn('⚠️ [DEBUG] Configuración no inicializada');
            this.updateDbStatus('🔑 Configuración requerida', '#fff3cd');
            return false;
        }
        
        // Verificar modo demo
        if (localStorage.getItem('demo_mode') === 'true') {
            console.log('🎮 [DEBUG] Modo demo activado');
            this.updateDbStatus('🎮 Modo Demo (Solo localStorage)', '#e7f3ff');
            return false;
        }
        
        // Obtener credenciales de forma segura
        const supabaseUrl = AppConfig.supabase.url;
        const supabaseKey = AppConfig.supabase.anonKey;
        
        console.log('🔍 [DEBUG] URL configurada:', !!supabaseUrl);
        console.log('🔍 [DEBUG] Key configurada:', !!supabaseKey);
        console.log('🔍 [DEBUG] SDK disponible:', typeof supabase !== 'undefined');
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('🔴 [DEBUG] Credenciales incompletas');
            this.updateDbStatus('❌ Credenciales incompletas', '#f8d7da');
            return false;
        }
        
        try {
            const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            window.supabaseClient = supabaseClient;
            console.log('🔍 [DEBUG] Cliente creado exitosamente');
            
            // Inicializar SupabaseManager
            if (window.SupabaseManager) {
                console.log('🔍 [DEBUG] SupabaseManager disponible, inicializando...');
                SupabaseManager.init(supabaseClient);
                console.log('🔍 [DEBUG] SupabaseManager.isConnected:', SupabaseManager.isConnected);
                
                if (SupabaseManager.isConnected) {
                    this.updateDbStatus('🚀 Supabase conectado de forma segura', '#d4edda');
                    console.log('✅ Supabase inicializado correctamente');
                    
                    // Test de conexión rápido
                    this.testSupabaseConnection();
                    return true;
                } else {
                    console.warn('⚠️ SupabaseManager no se conectó correctamente');
                    this.updateDbStatus('⚠️ Error de conexión', '#f8d7da');
                    return false;
                }
            } else {
                console.warn('⚠️ SupabaseManager no está disponible');
                this.updateDbStatus('⚠️ Error de configuración', '#f8d7da');
                return false;
            }
        } catch (error) {
            console.error('🔴 [DEBUG] Error creando cliente:', error);
            console.warn('Error en configuración de Supabase:', error.message);
            this.updateDbStatus('📱 Modo local (localStorage)', '#fff3cd');
            return false;
        }
    },

    /**
     * Test rápido de conexión
     */
    testSupabaseConnection: async function() {
        console.log('🔍 [DEBUG] Ejecutando test de conexión...');
        
        if (!window.supabaseClient) {
            console.error('🔴 [DEBUG] No hay cliente disponible para test');
            return;
        }
        
        try {
            const { data, error } = await window.supabaseClient
                .from('raffles')
                .select('*')
                .limit(1);
                
            if (error) {
                console.error('🔴 [DEBUG] Error en test de conexión:', error);
                
                if (error.code === 'PGRST116') {
                    console.warn('🟡 [DEBUG] Tabla "raffles" no existe - necesitas ejecutar el SQL');
                    this.updateDbStatus('⚠️ Faltan tablas en Supabase', '#fff3cd');
                } else {
                    console.error('🔴 [DEBUG] Error de configuración:', error.message);
                    this.updateDbStatus('❌ Error de configuración', '#f8d7da');
                }
            } else {
                console.log('✅ [DEBUG] Test de conexión exitoso!', data);
                this.updateDbStatus('🚀 Supabase conectado y operativo', '#d4edda');
            }
        } catch (error) {
            console.error('🔴 [DEBUG] Error de red en test:', error);
            this.updateDbStatus('📡 Error de conexión', '#f8d7da');
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
     * Archivar rifa actual antes de crear nueva
     */
    archiveCurrentRaffle: function() {
        if (!AppState.raffleConfig) return;
        
        const archiveData = {
            config: AppState.raffleConfig,
            sales: AppState.sales,
            reservations: AppState.reservations,
            archivedAt: new Date(),
            finalStats: {
                totalSales: AppState.sales.length,
                totalRevenue: AppState.sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total, 0),
                totalNumbers: AppState.sales.reduce((sum, s) => sum + s.numbers.length, 0),
                activeReservations: AppState.reservations.filter(r => r.status === 'active').length
            }
        };
        
        // Crear nombre de archivo seguro
        const safeName = AppState.raffleConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `rifa_archivada_${safeName}_${dateStr}.json`;
        
        // Descargar archivo automáticamente
        const dataStr = JSON.stringify(archiveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        Utils.showNotification(`Rifa "${AppState.raffleConfig.name}" archivada automáticamente`, 'success');
        console.log('📁 [ARCHIVE] Rifa archivada:', filename);
    },

    /**
     * Configurar la rifa inicial
     */
    setupRaffle: function() {
        const drawDate = document.getElementById('drawDate').value;
        const name = document.getElementById('raffleName').value;
        const prize = document.getElementById('prizeDescription').value;
        const totalNumbers = parseInt(document.getElementById('totalNumbers').value);
        const price = parseFloat(document.getElementById('pricePerNumber').value);
        const organization = document.getElementById('organizationName').value;
        const whatsappNumber = document.getElementById('whatsappNumber').value;
        const clubInstagram = document.getElementById('clubInstagram').value;
        const reservationTime = parseInt(document.getElementById('reservationTime').value);

        if (!drawDate || !name || !prize || !totalNumbers || !price || !whatsappNumber || !reservationTime) {
            Utils.showNotification('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        // Validar formato de WhatsApp
        if (!Utils.validateWhatsApp(whatsappNumber)) {
            Utils.showNotification('Por favor ingresa un número de WhatsApp válido', 'error');
            return;
        }
        
        // Validar fecha de sorteo
        const drawDateTime = new Date(drawDate);
        const now = new Date();
        
        if (drawDateTime <= now) {
            Utils.showNotification('La fecha del sorteo debe ser futura', 'error');
            return;
        }
        
        // 🛡️ VERIFICAR Y PROTEGER DATOS EXISTENTES
        if (AppState.raffleConfig && (AppState.sales.length > 0 || AppState.reservations.filter(r => r.status === 'active').length > 0)) {
            const salesCount = AppState.sales.length;
            const activeReservations = AppState.reservations.filter(r => r.status === 'active').length;
            const totalRevenue = AppState.sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total, 0);
            
            const confirmMessage = `⚠️ ADVERTENCIA: RIFA ACTIVA CON DATOS\n\n` +
                `📈 Rifa actual: "${AppState.raffleConfig.name}"\n` +
                `💰 Ventas registradas: ${salesCount}\n` +
                `💵 Ingresos confirmados: ${Utils.formatPrice(totalRevenue)}\n` +
                `⏰ Reservas activas: ${activeReservations}\n\n` +
                `😨 Configurar una nueva rifa ELIMINARÁ todos estos datos.\n\n` +
                `✅ RECOMENDADO:\n` +
                `1. Exportar datos actuales (pestaña Reportes)\n` +
                `2. Finalizar sorteo de rifa actual\n` +
                `3. Entonces crear nueva rifa\n\n` +
                `¿Estás seguro de continuar y eliminar los datos actuales?`;
            
            if (!confirm(confirmMessage)) {
                return; // Usuario canceló, mantener rifa actual
            }
            
            // Usuario confirmó, archivar automáticamente
            this.archiveCurrentRaffle();
        }
        
        // 🧽 LIMPIAR TODOS LOS DATOS ANTERIORES
        console.log('🧽 [SETUP] Limpiando datos anteriores...');
        AppState.sales = [];
        AppState.reservations = [];
        AppState.selectedNumbers = [];
        AppState.currentAction = 'buy';
        AppState.selectedBuyer = null;
        
        // 📁 Limpiar también en almacenamiento persistente
        if (window.SupabaseManager && SupabaseManager.isConnected) {
            // En Supabase los datos se sobrescriben automáticamente con los nuevos
            console.log('📁 [SETUP] Datos en Supabase se actualizarán con la nueva rifa');
        }
        
        // Limpiar localStorage como cache
        Storage.save('sales', []);
        Storage.save('reservations', []);
        
        console.log('✅ [SETUP] Datos anteriores limpiados completamente');

        AppState.raffleConfig = {
            drawDate: drawDateTime,
            name,
            prize,
            totalNumbers,
            price,
            organization,
            whatsappNumber,
            clubInstagram: clubInstagram || null,
            reservationTime,
            createdAt: new Date()
        };

        // Actualizar header
        document.getElementById('raffleTitle').textContent = name;
        const drawDateFormatted = Utils.formatDateTime(drawDateTime);
        document.getElementById('raffleSubtitle').textContent = `${organization} - ${price} por número - Sorteo: ${drawDateFormatted}`;

        // Guardar configuración usando SupabaseManager si está disponible
        console.log('🔍 [DEBUG] Guardando configuración...');
        console.log('🔍 [DEBUG] SupabaseManager disponible:', !!window.SupabaseManager);
        console.log('🔍 [DEBUG] SupabaseManager.isConnected:', window.SupabaseManager?.isConnected);
        
        if (window.SupabaseManager && SupabaseManager.isConnected) {
            console.log('✅ [DEBUG] Guardando en Supabase...');
            SupabaseManager.saveRaffleConfig(AppState.raffleConfig)
                .then(() => {
                    console.log('✅ Configuración guardada en Supabase');
                    Utils.showNotification('Configuración guardada en Supabase', 'success');
                })
                .catch((error) => {
                    console.error('❌ Error guardando en Supabase:', error);
                    Utils.showNotification('Error guardando en Supabase, guardado localmente', 'warning');
                    // Fallback a localStorage
                    autoSave();
                });
        } else {
            console.log('🟡 [DEBUG] Guardando en localStorage (fallback)');
            if (!window.SupabaseManager) {
                console.warn('⚠️ [DEBUG] SupabaseManager no disponible');
            } else {
                console.warn('⚠️ [DEBUG] SupabaseManager no conectado');
            }
            // Usar localStorage como fallback
            autoSave();
            Utils.showNotification('Configuración guardada localmente', 'info');
        }

        // Inicializar interfaces con datos limpios
        NumbersManager.createInterface();
        AdminManager.createInterface();
        NumbersManager.startReservationChecker();
        
        // ✅ IMPORTANTE: Actualizar display para mostrar todos los números como disponibles
        NumbersManager.updateDisplay();
        
        // Inicializar utilidades
        if (typeof UtilitiesManager !== 'undefined') {
            UtilitiesManager.init();
        }

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