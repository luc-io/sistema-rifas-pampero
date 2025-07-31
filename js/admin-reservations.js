/**
 * GESTIÓN DE RESERVAS - Sistema de Rifas Pampero
 * Módulo especializado en operaciones sobre reservas
 */

window.AdminReservations = {
    /**
     * Actualizar lista de reservas
     */
    updateReservationsList: function() {
        const container = document.getElementById('reservationsList');
        if (!container) return;

        const activeReservations = AppState.reservations.filter(r => r.status === 'active');
        
        if (activeReservations.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay reservas activas</p>';
            return;
        }

        container.innerHTML = activeReservations.map(reservation => {
            const numbersFormatted = reservation.numbers.map(n => Utils.formatNumber(n));
            const timeLeft = Utils.getTimeLeft(reservation.expiresAt);
            const isExpiringSoon = timeLeft.hours < 2;
            
            // Verificar si números ya están vendidos
            const validation = AdminValidation.validateNumbersNotSold(reservation.numbers);
            const hasConflict = !validation.isValid;
            
            return `
            <div class="sale-item" style="border-left: 4px solid ${hasConflict ? '#dc3545' : isExpiringSoon ? '#dc3545' : '#ffc107'};">
                <div class="sale-header">
                    <strong>${reservation.buyer.name} ${reservation.buyer.lastName}</strong>
                    <span class="payment-status ${hasConflict ? 'error' : 'pending'}">
                        ${hasConflict ? '🚫 Conflicto' : '⏰ Reservado'}
                    </span>
                </div>
                ${hasConflict ? `<div style="color: #dc3545; font-weight: bold; margin: 5px 0;">⚠️ Números ya vendidos: ${validation.duplicates.map(n => Utils.formatNumber(n)).join(', ')}</div>` : ''}
                <div>📞 ${reservation.buyer.phone}</div>
                ${reservation.buyer.email ? `<div>📧 ${reservation.buyer.email}</div>` : ''}
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number ${validation.duplicates.includes(parseInt(num.replace(/\D/g, ''))) ? 'conflict' : ''}">${num}</span>`).join('')}
                </div>
                <div style="margin: 8px 0; font-weight: 600; color: ${isExpiringSoon ? '#dc3545' : '#856404'};">
                    ⏰ Vence en: ${timeLeft.hours}h ${timeLeft.minutes}m
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span>💰 Total: ${Utils.formatPrice(reservation.total)}</span>
                    <span>📊 ${reservation.numbers.length} números</span>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-small" onclick="AdminReservations.confirmReservation('${reservation.id}', 'efectivo')" 
                            ${hasConflict ? 'disabled style="opacity: 0.5;" title="Números ya vendidos"' : ''}>
                        💰 Confirmar Efectivo
                    </button>
                    <button class="btn btn-small" onclick="AdminReservations.confirmReservation('${reservation.id}', 'transferencia')" 
                            ${hasConflict ? 'disabled style="opacity: 0.5;" title="Números ya vendidos"' : ''}>
                        💳 Confirmar Transferencia
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="AdminReservations.extendReservation('${reservation.id}')">⏰ Extender</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminReservations.cancelReservation('${reservation.id}')">❌ Cancelar</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Confirmar reserva convirtiéndola en venta
     */
    confirmReservation: async function(reservationId, paymentMethod) {
        console.log(`🔍 [RESERVATIONS] Confirmando reserva ${reservationId} con método: ${paymentMethod}`);
        
        const reservation = AppState.reservations.find(r => r.id == reservationId && r.status === 'active');
        if (!reservation) {
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }
        
        // Verificar que no esté vencida
        if (Utils.isReservationExpired(reservation)) {
            Utils.showNotification('Esta reserva ya está vencida', 'error');
            NumbersManager.checkExpiredReservations();
            return;
        }

        // Verificar que los números aún estén disponibles
        const validation = AdminValidation.validateNumbersNotSold(reservation.numbers);
        if (!validation.isValid) {
            Utils.showNotification(`No se puede confirmar: números ya vendidos (${validation.duplicates.map(n => Utils.formatNumber(n)).join(', ')})`, 'error');
            return;
        }
        
        if (!confirm(`¿Confirmar reserva de ${reservation.buyer.name} ${reservation.buyer.lastName} por ${Utils.formatPrice(reservation.total)}?`)) {
            return;
        }
        
        const status = paymentMethod === 'transferencia' ? 'pending' : 'paid';
        
        // Crear venta desde reserva
        const sale = {
            id: Utils.generateId(),
            numbers: [...reservation.numbers],
            buyer: reservation.buyer,
            paymentMethod,
            total: reservation.total,
            status,
            date: new Date(),
            originalReservationId: reservation.id
        };
        
        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.saveSale(sale);
                await window.SupabaseManager.updateReservationStatus(reservationId, 'confirmed');
                console.log('✅ [RESERVATIONS] Reserva confirmada en Supabase');
                
                // ✅ CORREGIDO: Agregar venta al estado local SOLO si no está ya
                const existingSale = AppState.sales.find(s => s.id === sale.id);
                if (!existingSale) {
                    AppState.sales.push(sale);
                    console.log('✅ [RESERVATIONS] Venta agregada al estado local');
                }
            } else {
                AppState.sales.push(sale);
                reservation.status = 'confirmed';
                await autoSave();
                console.log('📱 [RESERVATIONS] Reserva confirmada en localStorage');
            }
            
            // Actualizar UI inmediatamente
            reservation.status = 'confirmed';
            
            // Marcar números como vendidos en UI
            this.updateNumbersInUI(reservation.numbers, 'sold');
            
            // ✅ CORREGIDO: Forzar actualización completa de la interfaz
            await autoSave();
            AdminManager.updateInterface();
            if (NumbersManager.updateDisplay) NumbersManager.updateDisplay();
            if (ReportsManager.updateReports) ReportsManager.updateReports();
            
            // Mostrar modal de confirmación
            this.showConfirmationModal(sale);
            
            Utils.showNotification(`Reserva confirmada como ${paymentMethod}`, 'success');
            
        } catch (error) {
            console.error('❌ [RESERVATIONS] Error confirmando reserva:', error);
            Utils.showNotification('Error confirmando la reserva', 'error');
        }
    },

    /**
     * Cancelar reserva
     */
    cancelReservation: async function(reservationId) {
        console.log(`🔍 [RESERVATIONS] Cancelando reserva ${reservationId}`);
        
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
        
        const reservation = AppState.reservations.find(r => r.id == reservationId);
        if (!reservation) {
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }

        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.updateReservationStatus(reservationId, 'cancelled');
                if (success) {
                    reservation.status = 'cancelled';
                    console.log('✅ [RESERVATIONS] Reserva cancelada en Supabase');
                } else {
                    Utils.showNotification('Error cancelando la reserva en Supabase', 'error');
                    return;
                }
            } else {
                reservation.status = 'cancelled';
                await autoSave();
                console.log('📱 [RESERVATIONS] Reserva cancelada en localStorage');
            }
        } catch (error) {
            console.error('❌ [RESERVATIONS] Error cancelando reserva:', error);
            Utils.showNotification('Error cancelando la reserva', 'error');
            return;
        }

        // Liberar números en UI
        this.updateNumbersInUI(reservation.numbers, 'available');

        AdminManager.updateInterface();
        Utils.showNotification('Reserva cancelada', 'success');
    },

    /**
     * Extender tiempo de reserva
     */
    extendReservation: async function(reservationId) {
        const reservation = AppState.reservations.find(r => r.id == reservationId && r.status === 'active');
        if (!reservation) {
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }

        const hours = prompt('¿Cuántas horas adicionales? (1-24)', '2');
        if (!hours || isNaN(hours) || hours < 1 || hours > 24) {
            Utils.showNotification('Ingresa un número válido de horas (1-24)', 'error');
            return;
        }

        const additionalTime = parseInt(hours) * 60 * 60 * 1000; // Convertir a milisegundos
        const newExpirationTime = new Date(reservation.expiresAt.getTime() + additionalTime);

        try {
            // Actualizar en la base de datos
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                // Nota: Esta función necesitaría implementarse en SupabaseManager
                // await window.SupabaseManager.updateReservationExpiration(reservationId, newExpirationTime);
                console.log('⚠️ [RESERVATIONS] Extensión de reserva en Supabase no implementada aún');
            }

            // Actualizar localmente
            reservation.expiresAt = newExpirationTime;
            await autoSave();

            AdminManager.updateInterface();
            Utils.showNotification(`Reserva extendida ${hours} horas adicionales`, 'success');

        } catch (error) {
            console.error('❌ [RESERVATIONS] Error extendiendo reserva:', error);
            Utils.showNotification('Error extendiendo la reserva', 'error');
        }
    },

    /**
     * Actualizar estado de números en la UI
     */
    updateNumbersInUI: function(numbers, newStatus) {
        numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                // Remover clases de estado previas
                button.classList.remove('available', 'reserved', 'sold');
                // Agregar nueva clase
                button.classList.add(newStatus);
            }
        });
    },

    /**
     * Mostrar modal de confirmación de reserva
     */
    showConfirmationModal: function(sale) {
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
        
        const confirmationHtml = `
            <div class="confirmation-modal" id="reservationConfirmedModal">
                <div class="confirmation-content">
                    <div class="success-icon">✅</div>
                    <h3>Reserva Confirmada</h3>
                    <p><strong>Cliente:</strong> ${sale.buyer.name} ${sale.buyer.lastName}</p>
                    <p><strong>Números:</strong> ${numbersFormatted}</p>
                    <p><strong>Total:</strong> ${Utils.formatPrice(sale.total)}</p>
                    <p><strong>Pago:</strong> ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}</p>
                    
                    ${sale.status === 'pending' ? 
                        '<p style="color: #856404;"><strong>⏳ Pago pendiente por transferencia</strong></p>' : 
                        '<p style="color: #4CAF50;"><strong>✅ Pago confirmado</strong></p>'
                    }
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Notificar al cliente:</strong></p>
                        <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                           class="whatsapp-btn" target="_blank">
                           📱 Enviar confirmación a ${sale.buyer.name}
                        </a>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="AdminReservations.closeConfirmationModal()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
    },

    /**
     * Cerrar modal de confirmación
     */
    closeConfirmationModal: function() {
        const modal = document.getElementById('reservationConfirmedModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Obtener estadísticas de reservas
     */
    getReservationsStats: function() {
        const now = new Date();
        
        const active = AppState.reservations.filter(r => r.status === 'active');
        const expired = AppState.reservations.filter(r => r.status === 'expired');
        const confirmed = AppState.reservations.filter(r => r.status === 'confirmed');
        const cancelled = AppState.reservations.filter(r => r.status === 'cancelled');
        
        const expiringSoon = active.filter(r => {
            const timeLeft = r.expiresAt.getTime() - now.getTime();
            return timeLeft > 0 && timeLeft < 2 * 60 * 60 * 1000; // Menos de 2 horas
        });

        return {
            total: AppState.reservations.length,
            active: active.length,
            expired: expired.length,
            confirmed: confirmed.length,
            cancelled: cancelled.length,
            expiringSoon: expiringSoon.length,
            totalValue: active.reduce((sum, r) => sum + r.total, 0)
        };
    },

    /**
     * Limpiar reservas vencidas
     */
    cleanExpiredReservations: async function() {
        const now = new Date();
        let cleanedCount = 0;

        const expiredReservations = AppState.reservations.filter(r => 
            r.status === 'active' && r.expiresAt <= now
        );

        for (const reservation of expiredReservations) {
            try {
                if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                    await window.SupabaseManager.updateReservationStatus(reservation.id, 'expired');
                }
                
                reservation.status = 'expired';
                
                // Liberar números en UI
                this.updateNumbersInUI(reservation.numbers, 'available');
                
                cleanedCount++;
            } catch (error) {
                console.error('❌ [RESERVATIONS] Error limpiando reserva vencida:', error);
            }
        }

        if (cleanedCount > 0) {
            await autoSave();
            AdminManager.updateInterface();
            Utils.showNotification(`Se limpiaron ${cleanedCount} reservas vencidas`, 'info');
        }

        return cleanedCount;
    },

    /**
     * Exportar datos de reservas
     */
    exportReservationsData: function() {
        if (AppState.reservations.length === 0) {
            Utils.showNotification('No hay reservas para exportar', 'warning');
            return;
        }

        let csvContent = "Nombre,Apellido,Teléfono,Email,Números,Total,Estado,Creada,Vence\n";
        
        AppState.reservations.forEach(reservation => {
            const numbersFormatted = reservation.numbers.map(n => Utils.formatNumber(n)).join(';');
            
            const row = [
                `"${reservation.buyer.name}"`,
                `"${reservation.buyer.lastName}"`,
                `"${reservation.buyer.phone}"`,
                `"${reservation.buyer.email || ''}"`,
                `"${numbersFormatted}"`,
                `"${reservation.total}"`,
                `"${reservation.status}"`,
                `"${Utils.formatDateTime(reservation.createdAt)}"`,
                `"${Utils.formatDateTime(reservation.expiresAt)}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `reservas_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification('Datos de reservas exportados correctamente', 'success');
    }
};

console.log('✅ AdminReservations cargado correctamente');