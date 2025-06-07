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
    currentAction: 'buy', // 'buy' o 'reserve'
    selectedBuyer: null
};

// Constantes de la aplicación
window.AppConstants = {
    INTEREST_LABELS: {
        'aprender': 'Aprender a navegar',
        'recreativo': 'Navegar recreativamente',
        'ambos': 'Aprender y navegar recreativamente',
        'no': 'No le interesa',
        '': 'No especificado'
    },
    
    MEMBER_LABELS: {
        'si': 'Sí',
        'no': 'No',
        '': 'No especificado'
    },
    
    ACTIVITY_LABELS: {
        'remo': 'Remo',
        'ecologia': 'Ecología',
        'nautica': 'Náutica',
        'pesca': 'Pesca',
        'multiple': 'Múltiples actividades',
        'ninguna': 'Ninguna en particular',
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
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        
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
    },

    /**
     * Formatea precio en pesos argentinos
     */
    formatPrice: function(amount) {
        return `$${amount.toFixed(2)}`;
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
     * Genera un ID único
     */
    generateId: function() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce function para optimizar búsquedas
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Maneja clics fuera de un elemento
     */
    handleClickOutside: function(element, callback) {
        const handleClick = (event) => {
            if (!element.contains(event.target)) {
                callback();
                document.removeEventListener('click', handleClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClick);
        }, 100);
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
    },

    /**
     * Obtiene el inicio del día
     */
    getStartOfDay: function(date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    },

    /**
     * Obtiene el final del día
     */
    getEndOfDay: function(date) {
        const newDate = new Date(date);
        newDate.setHours(23, 59, 59, 999);
        return newDate;
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

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('purchaseModal');
    if (event.target === modal) {
        NumbersManager.closePurchaseModal();
    }
};

// Auto-guardado cada vez que cambie algo
window.autoSave = function() {
    if (AppState.raffleConfig) {
        // Intentar guardar en base de datos si está disponible
        if (window.FirebaseManager && window.FirebaseManager.isConnected) {
            // Firebase guardará automáticamente
            console.log('💾 Guardando en Firebase...');
        } else if (window.SupabaseManager && window.SupabaseManager.isConnected) {
            // Supabase guardará automáticamente
            console.log('💾 Guardando en Supabase...');
        } else {
            // Fallback a localStorage
            Storage.save('raffleConfig', AppState.raffleConfig);
            Storage.save('sales', AppState.sales);
            Storage.save('reservations', AppState.reservations);
            console.log('💾 Guardando en localStorage...');
        }
    }
};

// Función para cargar datos del almacenamiento
window.loadFromStorage = function() {
    // Intentar cargar desde base de datos primero
    if (window.FirebaseManager && window.FirebaseManager.isConnected) {
        console.log('📥 Cargando desde Firebase...');
        return window.FirebaseManager.loadAllData();
    } else if (window.SupabaseManager && window.SupabaseManager.isConnected) {
        console.log('📥 Cargando desde Supabase...');
        return window.SupabaseManager.loadAllData();
    }
    
    // Fallback a localStorage
    console.log('📥 Cargando desde localStorage...');
    const savedConfig = Storage.load('raffleConfig');
    const savedSales = Storage.load('sales', []);
    const savedReservations = Storage.load('reservations', []);

    if (savedConfig) {
        AppState.raffleConfig = savedConfig;
        AppState.raffleConfig.createdAt = DateUtils.parseDate(savedConfig.createdAt);
        
        document.getElementById('raffleTitle').textContent = savedConfig.name;
        document.getElementById('raffleSubtitle').textContent = `${savedConfig.organization} - $${savedConfig.price} por número`;
        
        // Llenar formulario de configuración
        const fields = {
            'raffleName': 'name',
            'prizeDescription': 'prize',
            'totalNumbers': 'totalNumbers',
            'pricePerNumber': 'price',
            'organizationName': 'organization',
            'whatsappNumber': 'whatsappNumber',
            'reservationTime': 'reservationTime'
        };

        Object.entries(fields).forEach(([fieldId, configKey]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = savedConfig[configKey];
            }
        });
    }

    if (savedSales.length > 0) {
        AppState.sales = savedSales.map(sale => ({
            ...sale,
            date: DateUtils.parseDate(sale.date)
        }));
    }

    if (savedReservations.length > 0) {
        AppState.reservations = savedReservations.map(reservation => ({
            ...reservation,
            createdAt: DateUtils.parseDate(reservation.createdAt),
            expiresAt: DateUtils.parseDate(reservation.expiresAt)
        }));
    }

    if (AppState.raffleConfig && typeof NumbersManager !== 'undefined') {
        NumbersManager.createInterface();
        AdminManager.createInterface();
        AdminManager.updateInterface();
        NumbersManager.updateDisplay();
        NumbersManager.startReservationChecker();
    }
};

// Verificar disponibilidad de localStorage al cargar
if (!Storage.isAvailable()) {
    Utils.showNotification('Tu navegador no soporta almacenamiento local. Los datos no se guardarán.', 'warning', 5000);
}

console.log('✅ Utils.js cargado correctamente');