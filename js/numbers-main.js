/**
 * GESTOR PRINCIPAL DE NÚMEROS - Sistema de Rifas Pampero
 * Coordinador principal y funciones comunes
 */

window.NumbersManager = {
    /**
     * Inicializar el gestor de números
     */
    init: function() {
        if (!AppState.raffleConfig) return;
        
        // Crear interfaz principal
        NumbersInterface.createInterface();
        
        // Iniciar verificador de reservas expiradas
        this.startReservationChecker();
        
        console.log('✅ NumbersManager inicializado');
    },

    /**
     * Formatear número de teléfono para WhatsApp (Argentina)
     */
    formatPhoneForWhatsApp: function(phone) {
        // Limpiar el número
        let cleanPhone = phone.replace(/[^\d]/g, '');
        
        // Si empieza con 0341 (Rosario), convertir a formato internacional
        if (cleanPhone.startsWith('0341')) {
            cleanPhone = '54341' + cleanPhone.substring(4);
        }
        // Si empieza con 341, agregar código de país
        else if (cleanPhone.startsWith('341')) {
            cleanPhone = '54' + cleanPhone;
        }
        // Si empieza con 054, remover el 0 inicial
        else if (cleanPhone.startsWith('054')) {
            cleanPhone = cleanPhone.substring(1);
        }
        // Si no tiene código de país, asumir Argentina
        else if (!cleanPhone.startsWith('54')) {
            cleanPhone = '54' + cleanPhone;
        }
        
        return cleanPhone;
    },

    /**
     * Actualizar display de números
     */
    updateDisplay: function() {
        if (!AppState.raffleConfig) return;

        // Primero limpiar todos los estados
        for (let i = 0; i < AppState.raffleConfig.totalNumbers; i++) {
            const button = document.getElementById(`number-${i}`);
            if (button) {
                button.classList.remove('sold', 'reserved', 'assigned', 'confirmed');
                button.classList.add('available');
            }
        }

        // Marcar números vendidos (prioridad más alta)
        AppState.sales.forEach(sale => {
            sale.numbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('available', 'reserved', 'assigned', 'confirmed');
                    button.classList.add('sold');
                }
            });
        });

        // Marcar números asignados
        if (AppState.assignments) {
            AppState.assignments.forEach(assignment => {
                assignment.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button && !button.classList.contains('sold')) {
                        button.classList.remove('available', 'reserved');
                        
                        if (assignment.status === 'confirmed') {
                            button.classList.add('confirmed');
                        } else {
                            button.classList.add('assigned');
                        }
                    }
                });
            });
        }

        // Marcar números reservados (sistema antiguo, menor prioridad)
        AppState.reservations.filter(r => r.status === 'active').forEach(reservation => {
            if (!Utils.isReservationExpired(reservation)) {
                reservation.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button && !button.classList.contains('sold') && !button.classList.contains('assigned') && !button.classList.contains('confirmed')) {
                        button.classList.remove('available');
                        button.classList.add('reserved');
                    }
                });
            }
        });
    },

    /**
     * Iniciar verificador de reservas expiradas
     */
    startReservationChecker: function() {
        setInterval(() => {
            this.checkExpiredReservations();
        }, 30000); // Verificar cada 30 segundos
    },

    /**
     * Verificar y limpiar reservas expiradas
     */
    checkExpiredReservations: async function() {
        const now = Date.now();
        let hasExpiredReservations = false;
        const expiredReservations = [];
        
        AppState.reservations.forEach(reservation => {
            if (reservation.status === 'active' && Utils.isReservationExpired(reservation)) {
                expiredReservations.push(reservation);
                hasExpiredReservations = true;
                
                // Liberar números en la UI
                reservation.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button && button.classList.contains('reserved')) {
                        button.classList.remove('reserved');
                        button.classList.add('available');
                    }
                });
            }
        });
        
        if (hasExpiredReservations) {
            console.log(`🗑️ [EXPIRED] Limpiando ${expiredReservations.length} reservas expiradas`);
            
            try {
                // Actualizar en Supabase si está conectado
                if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                    for (const reservation of expiredReservations) {
                        await window.SupabaseManager.updateReservationStatus(reservation.id, 'expired');
                        reservation.status = 'expired'; // Actualizar en memoria también
                    }
                    console.log('✅ [EXPIRED] Reservas expiradas actualizadas en Supabase');
                } else {
                    // Fallback a localStorage
                    expiredReservations.forEach(reservation => {
                        reservation.status = 'expired';
                    });
                    await autoSave();
                    console.log('📱 [EXPIRED] Reservas expiradas actualizadas en localStorage');
                }
            } catch (error) {
                console.error('❌ [EXPIRED] Error actualizando reservas expiradas:', error);
                // Marcar como expiradas solo en memoria si falla la actualización
                expiredReservations.forEach(reservation => {
                    reservation.status = 'expired';
                });
            }
            
            // Actualizar interfaz
            if (AdminManager.updateInterface) {
                AdminManager.updateInterface();
            }
        }
    },

    /**
     * Cerrar modal de confirmación
     */
    closeConfirmationModal: function() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.remove();
        }
    },

    // Delegaciones a módulos específicos
    createInterface: function() { NumbersInterface.createInterface(); },
    handleNumberClick: function(number) { NumbersInterface.handleNumberClick(number); },
    toggleNumber: function(number) { NumbersInterface.toggleNumber(number); },
    clearSelection: function() { NumbersInterface.clearSelection(); },
    updateSelectionSummary: function() { NumbersInterface.updateSelectionSummary(); },
    
    showNumberInfo: function(number) { NumbersInfo.showNumberInfo(number); },
    closeNumberInfoModal: function() { NumbersInfo.closeNumberInfoModal(); },
    markSaleAsPaid: function(saleId) { NumbersInfo.markSaleAsPaid(saleId); },
    
    openPurchaseModal: function(action) { NumbersPurchase.openPurchaseModal(action); },
    closePurchaseModal: function() { NumbersPurchase.closePurchaseModal(); },
    completePurchase: function(paymentMethod) { NumbersPurchase.completePurchase(paymentMethod); },
    searchExistingBuyers: function() { NumbersPurchase.searchExistingBuyers(); },
    selectExistingBuyer: function(name, lastName) { NumbersPurchase.selectExistingBuyer(name, lastName); },
    clearSuggestions: function() { NumbersPurchase.clearSuggestions(); },
    
    // ✅ CORRECCIÓN: Agregar delegaciones faltantes para WhatsApp
    generateSimpleWhatsAppMessage: function(sale, numbersFormatted) { 
        return NumbersPurchase.generateSimpleWhatsAppMessage(sale, numbersFormatted); 
    },
    showPurchaseConfirmation: function(sale, whatsappMessage) { 
        NumbersPurchase.showPurchaseConfirmation(sale, whatsappMessage); 
    },
    
    openAssignmentModal: function() { NumbersAssignment.openAssignmentModal(); },
    closeAssignmentModal: function() { NumbersAssignment.closeAssignmentModal(); },
    completeAssignment: function() { NumbersAssignment.completeAssignment(); },
    showEditOwnerModal: function(number) { NumbersAssignment.showEditOwnerModal(number); },
    closeEditOwnerModal: function() { NumbersAssignment.closeEditOwnerModal(); },
    saveOwnerChanges: function(number) { NumbersAssignment.saveOwnerChanges(number); },
    closeNotificationConfirmModal: function() { NumbersAssignment.closeNotificationConfirmModal(); }
};

console.log('✅ numbers-main.js cargado correctamente');
