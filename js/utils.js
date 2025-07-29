/**
 * UTILIDADES COMPARTIDAS - Sistema de Rifas Pampero
 * Funciones y constantes utilizadas en múltiples módulos
 */

// Estado global de la aplicación
window.AppState = {
    raffleConfig: null,
    selectedNumbers: [],
    sales: [],
    reservations: [],
    assignments: [], // Nueva propiedad para asignaciones
    numberOwners: [], // Nueva propiedad para titulares de números
    currentAction: 'buy', // 'buy' o 'reserve'
    selectedBuyer: null
};

// Constantes de la aplicación
window.AppConstants = {
    MEMBERSHIP_LABELS: {
        'no_socio': 'No es socio',
        'nautica': 'Socio - Náutica',
        'remo': 'Socio - Remo',
        'ecologia': 'Socio - Ecología',
        'pesca': 'Socio - Pesca',
        'ninguna': 'Socio - Sin área específica',
        '': 'No especificado'
    },

    PAYMENT_METHODS: {
        'efectivo': 'Efectivo',
        'transferencia': 'Transferencia Bancaria'
    }
};

// Utilidades de validación
window.Utils = {
    /**
     * Valida formato de número de WhatsApp
     */
    validateWhatsApp: function(number) {
        return /^\+?[\d\s\-\(\)]+$/.test(number);
    },

    /**
     * Formatea un número con ceros a la izquierda
     */
    formatNumber: function(number, digits = 3) {
        return number.toString().padStart(digits, '0');
    },

    /**
     * Calcula tiempo restante hasta una fecha
     */
    getTimeLeft: function(expiresAt) {
        if (!expiresAt) {
            return { hours: 0, minutes: 0 };
        }
        
        const now = new Date();
        // Convertir a Date si es string
        const targetDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
        
        // Verificar si la fecha es válida
        if (isNaN(targetDate.getTime())) {
            console.warn('⚠️ [UTILS] Fecha inválida proporcionada a getTimeLeft:', expiresAt);
            return { hours: 0, minutes: 0 };
        }
        
        const diff = targetDate.getTime() - now.getTime();
        
        if (diff <= 0) {
            return { hours: 0, minutes: 0 };
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return { hours, minutes };
    },

    /**
     * Verifica si una reserva está expirada
     */
    isReservationExpired: function(reservation) {
        return Date.now() > reservation.expiresAt.getTime();
    },

    /**
     * Descarga un archivo CSV
     */
    downloadCSV: function(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Muestra una notificación temporal
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Colores según el tipo
        const colors = {
            'success': '#4CAF50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196F3'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después del tiempo especificado
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    /**
     * Genera un ID único
     */
    generateId: function() {
        return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Genera un ID numérico único
     */
    generateNumericId: function() {
        return Date.now() + Math.floor(Math.random() * 1000);
    },

    /**
     * Formatea un precio como moneda
     */
    formatPrice: function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Formatea fecha y hora
     */
    formatDateTime: function(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    },

    /**
     * Valida datos requeridos de un comprador
     */
    validateBuyerData: function(buyerData) {
        const errors = [];
        
        if (!buyerData.name || buyerData.name.trim() === '') {
            errors.push('El nombre es obligatorio');
        }
        
        if (!buyerData.lastName || buyerData.lastName.trim() === '') {
            errors.push('El apellido es obligatorio');
        }
        
        if (!buyerData.phone || buyerData.phone.trim() === '') {
            errors.push('El teléfono es obligatorio');
        }
        
        return errors;
    },

    /**
     * Sanitiza datos de entrada
     */
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }
};

// Gestión de almacenamiento local
window.Storage = {
    /**
     * Guarda datos en localStorage con manejo de errores
     */
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error guardando ${key}:`, error);
            Utils.showNotification('Error al guardar datos', 'error');
            return false;
        }
    },

    /**
     * Carga datos del localStorage con manejo de errores
     */
    load: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error cargando ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Elimina un elemento del localStorage
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error eliminando ${key}:`, error);
            return false;
        }
    },

    /**
     * Limpia todo el localStorage relacionado con la app
     */
    clear: function() {
        const keys = ['raffleConfig', 'sales', 'reservations', 'lastBackup'];
        keys.forEach(key => this.remove(key));
    },

    /**
     * Verifica si localStorage está disponible
     */
    isAvailable: function() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// Utilidades de fechas
window.DateUtils = {
    /**
     * Crea una fecha de expiración basada en horas
     */
    createExpirationDate: function(hours) {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date;
    },

    /**
     * Convierte string a objeto Date de manera segura
     */
    parseDate: function(dateString) {
        try {
            return new Date(dateString);
        } catch (error) {
            console.error('Error parsing date:', error);
            return new Date();
        }
    },

    /**
     * Formatea fecha para input de tipo date
     */
    formatForInput: function(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }
};

// Función global para mostrar pestañas
window.showTab = function(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Mostrar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Actualizar contenido según la pestaña
    if (tabName === 'reports' && AppState.raffleConfig) {
        ReportsManager.updateReports();
    }
};

// Auto-guardado SOLO en Supabase (localStorage solo como cache)
window.autoSave = async function() {
    if (!AppState.raffleConfig) return;
    
    console.log('💾 [AUTOSAVE] Iniciando guardado...');
    
    // Verificar conexión a Supabase
    if (window.SupabaseManager && window.SupabaseManager.isConnected) {
        console.log('☁️ [AUTOSAVE] Guardando en Supabase (fuente principal)...');
        
        try {
            // Guardar configuración
            await SupabaseManager.saveRaffleConfig(AppState.raffleConfig);
            console.log('✅ [AUTOSAVE] Configuración guardada en Supabase');
            
            // Cache local (solo backup temporal)
            Storage.save('raffleConfig', AppState.raffleConfig);
            Storage.save('sales', AppState.sales);
            Storage.save('reservations', AppState.reservations);
            
            console.log('💾 [AUTOSAVE] Cache local actualizado');
            
        } catch (error) {
            console.error('❌ [AUTOSAVE] Error guardando en Supabase:', error);
            
            // Solo si falla Supabase, guardar localmente
            Storage.save('raffleConfig', AppState.raffleConfig);
            Storage.save('sales', AppState.sales);
            Storage.save('reservations', AppState.reservations);
            
            Utils.showNotification('Error guardando en Supabase, guardado localmente', 'warning');
        }
    } else {
        console.log('📱 [AUTOSAVE] Supabase no disponible, guardando localmente');
        
        // Fallback solo si no hay Supabase
        Storage.save('raffleConfig', AppState.raffleConfig);
        Storage.save('sales', AppState.sales);
        Storage.save('reservations', AppState.reservations);
        
        console.log('💾 [AUTOSAVE] Guardado en localStorage');
    }
};

// Función para cargar datos SOLO desde Supabase (localStorage solo como fallback)
window.loadFromStorage = async function() {
    console.log('📥 [LOAD] Iniciando carga de datos...');
    
    // Prioridad 1: Cargar desde Supabase
    if (window.SupabaseManager && window.SupabaseManager.isConnected) {
        console.log('☁️ [LOAD] Cargando desde Supabase (fuente principal)...');
        
        try {
            await window.SupabaseManager.loadAllData();
            console.log('✅ [LOAD] Datos cargados desde Supabase');
            
            // Actualizar cache local con datos de Supabase
            if (AppState.raffleConfig) {
                Storage.save('raffleConfig', AppState.raffleConfig);
                Storage.save('sales', AppState.sales);
                Storage.save('reservations', AppState.reservations);
                console.log('💾 [LOAD] Cache local sincronizado con Supabase');
            }
            
        } catch (error) {
            console.error('❌ [LOAD] Error cargando desde Supabase:', error);
            loadFromLocalStorage();
        }
    } else {
        console.log('📱 [LOAD] Supabase no disponible, cargando desde localStorage');
        loadFromLocalStorage();
    }
    
    // Actualizar interfaz después de cargar
    updateInterfaceAfterLoad();
};

// Función para cargar desde localStorage (solo como fallback)
function loadFromLocalStorage() {
    console.log('📱 [LOAD] Cargando desde localStorage...');
    
    const savedConfig = Storage.load('raffleConfig');
    const savedSales = Storage.load('sales', []);
    const savedReservations = Storage.load('reservations', []);

    if (savedConfig) {
        AppState.raffleConfig = savedConfig;
        AppState.raffleConfig.createdAt = DateUtils.parseDate(savedConfig.createdAt);
        // Asegurar que drawDate sea un objeto Date si existe
        if (savedConfig.drawDate) {
            AppState.raffleConfig.drawDate = DateUtils.parseDate(savedConfig.drawDate);
        }
        console.log('📊 [LOAD] Configuración cargada desde localStorage');
    }

    if (savedSales.length > 0) {
        AppState.sales = savedSales.map(sale => ({
            ...sale,
            buyer: SupabaseManager.migrateBuyerData ? SupabaseManager.migrateBuyerData(sale.buyer) : sale.buyer, // Migrar datos si es posible
            date: DateUtils.parseDate(sale.date)
        }));
        console.log(`📊 [LOAD] ${savedSales.length} ventas cargadas desde localStorage`);
    }

    if (savedReservations.length > 0) {
        AppState.reservations = savedReservations.map(reservation => ({
            ...reservation,
            buyer: SupabaseManager.migrateBuyerData ? SupabaseManager.migrateBuyerData(reservation.buyer) : reservation.buyer, // Migrar datos si es posible
            createdAt: DateUtils.parseDate(reservation.createdAt),
            expiresAt: DateUtils.parseDate(reservation.expiresAt)
        }));
        console.log(`📊 [LOAD] ${savedReservations.length} reservas cargadas desde localStorage`);
    }
}

// Función para actualizar interfaz después de cargar datos
function updateInterfaceAfterLoad() {
    if (AppState.raffleConfig) {
        // Actualizar UI
        document.getElementById('raffleTitle').textContent = AppState.raffleConfig.name;
        const drawDateFormatted = AppState.raffleConfig.drawDate ? Utils.formatDateTime(AppState.raffleConfig.drawDate) : 'No definida';
        document.getElementById('raffleSubtitle').textContent = `${AppState.raffleConfig.organization} - ${AppState.raffleConfig.price} por número - Sorteo: ${drawDateFormatted}`;
        
        // Llenar formulario de configuración
        const fields = {
            'drawDate': 'drawDate',
            'raffleName': 'name',
            'prizeDescription': 'prize',
            'totalNumbers': 'totalNumbers',
            'pricePerNumber': 'price',
            'organizationName': 'organization',
            'whatsappNumber': 'whatsappNumber',
            'clubInstagram': 'clubInstagram',
            'reservationTime': 'reservationTime'
        };

        Object.entries(fields).forEach(([fieldId, configKey]) => {
            const element = document.getElementById(fieldId);
            if (element && AppState.raffleConfig[configKey] !== undefined && AppState.raffleConfig[configKey] !== null) {
                if (fieldId === 'drawDate' && AppState.raffleConfig[configKey]) {
                    // Formatear fecha para input datetime-local
                    const date = new Date(AppState.raffleConfig[configKey]);
                    const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
                    element.value = isoString.slice(0, 16); // YYYY-MM-DDTHH:MM
                } else {
                    element.value = AppState.raffleConfig[configKey];
                }
            }
        });
        
        // Inicializar interfaces
        if (typeof NumbersManager !== 'undefined') {
            NumbersManager.createInterface();
            NumbersManager.updateDisplay();
            NumbersManager.startReservationChecker();
        }
        
        if (typeof AdminManager !== 'undefined') {
            AdminManager.createInterface();
            AdminManager.updateInterface();
        }
        
        // Inicializar utilidades
        if (typeof UtilitiesManager !== 'undefined') {
            UtilitiesManager.init();
        }
        
        console.log('🎨 [LOAD] Interfaz actualizada');
    } else {
        console.log('ℹ️ [LOAD] No hay configuración, esperando setup inicial');
    }
}

// Verificar disponibilidad de localStorage al cargar
if (!Storage.isAvailable()) {
    Utils.showNotification('Tu navegador no soporta almacenamiento local. Los datos no se guardarán.', 'warning', 5000);
}

console.log('✅ Utils.js cargado correctamente');
