/**
 * CONFIGURACIÓN DE VALIDACIONES - Sistema de Rifas Pampero
 * Validaciones adicionales para asignaciones
 */

// Extender AppConstants si no existe
if (typeof AppConstants === 'undefined') {
    window.AppConstants = {};
}

// Agregar configuraciones para asignaciones
AppConstants.ASSIGNMENT_STATUS = {
    'assigned': 'Asignado',
    'paid': 'Pagado',
    'expired': 'Vencido',
    'cancelled': 'Cancelado'
};

AppConstants.ASSIGNMENT_METHODS = {
    'manual': 'Manual',
    'consecutive': 'Consecutivo Automático'
};

// Validaciones para asignaciones
window.AssignmentValidation = {
    /**
     * Validar que los campos requeridos estén completos
     */
    validateRequiredFields: function(sellerName, sellerLastName, sellerPhone, paymentDeadline) {
        const errors = [];
        
        if (!sellerName || sellerName.trim().length < 2) {
            errors.push('El nombre del vendedor debe tener al menos 2 caracteres');
        }
        
        if (!sellerLastName || sellerLastName.trim().length < 2) {
            errors.push('El apellido del vendedor debe tener al menos 2 caracteres');
        }
        
        if (!sellerPhone || sellerPhone.trim().length < 8) {
            errors.push('El teléfono debe tener al menos 8 dígitos');
        }
        
        if (!paymentDeadline) {
            errors.push('La fecha límite de pago es obligatoria');
        } else {
            const deadline = new Date(paymentDeadline);
            const now = new Date();
            if (deadline <= now) {
                errors.push('La fecha límite debe ser futura');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Validar formato de teléfono
     */
    validatePhone: function(phone) {
        // Remover espacios y caracteres especiales
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Verificar que solo contenga números y/o +
        if (!/^[\+]?[\d]+$/.test(cleanPhone)) {
            return false;
        }
        
        // Verificar longitud mínima y máxima
        return cleanPhone.length >= 8 && cleanPhone.length <= 15;
    },
    
    /**
     * Formatear teléfono para mostrar
     */
    formatPhone: function(phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Si empieza con +54 (Argentina)
        if (cleanPhone.startsWith('+549')) {
            return `${cleanPhone.substring(0, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 10)}-${cleanPhone.substring(10)}`;
        } else if (cleanPhone.startsWith('+54')) {
            return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)} ${cleanPhone.substring(5)}`;
        }
        
        return phone; // Devolver original si no se puede formatear
    }
};

console.log('✅ Assignment validation configurado correctamente');
