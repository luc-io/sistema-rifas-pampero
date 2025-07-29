/**
 * PANEL DE ADMINISTRACIÓN - Sistema de Rifas Pampero
 * Gestión de ventas, estadísticas y administración
 */

window.AdminManager = {
    /**
     * Crear interfaz de administración
     */
    createInterface: function() {
        if (!AppState.raffleConfig) return;

        const container = document.getElementById('adminContent');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="soldNumbers">0</div>
                    <div class="stat-label">Números vendidos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalRevenue">$0</div>
                    <div class="stat-label">Ingresos totales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="availableNumbers">${AppState.raffleConfig.totalNumbers}</div>
                    <div class="stat-label">Disponibles</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalBuyers">0</div>
                    <div class="stat-label">Compradores</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="activeReservations">0</div>
                    <div class="stat-label">Reservas activas</div>
                </div>
            </div>

            <h3>📋 Asignaciones Activas</h3>
            <div class="sales-list" id="assignmentsList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones activas</p>
            </div>

            <h3>⏰ Reservas Activas</h3>
            <div class="sales-list" id="reservationsList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay reservas activas</p>
            </div>

            <h3>🔍 Búsqueda de Ventas</h3>
            <input type="text" class="search-box" id="searchBox" placeholder="Buscar por nombre, teléfono o número..." onkeyup="AdminManager.filterSales()">

            <h3>💰 Lista de Ventas</h3>
            <div class="sales-list" id="salesList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay ventas registradas aún</p>
            </div>

            <button class="btn" onclick="AdminManager.exportData()">📊 Exportar Datos</button>
        `;

        this.updateInterface();
    },

    /**
     * Calcular compradores únicos
     */
    getUniqueBuyers: function() {
        const buyerMap = new Map();
        
        // Agrupar ventas por comprador único (nombre completo + teléfono como clave)
        AppState.sales.forEach(sale => {
            const buyerKey = `${sale.buyer.name.toLowerCase().trim()} ${sale.buyer.lastName.toLowerCase().trim()} ${sale.buyer.phone.replace(/[^\d]/g, '')}`;
            
            if (!buyerMap.has(buyerKey)) {
                buyerMap.set(buyerKey, {
                    buyer: sale.buyer,
                    purchases: [],
                    totalNumbers: 0,
                    totalSpent: 0,
                    firstPurchase: sale.date,
                    lastPurchase: sale.date
                });
            }
            
            const buyerData = buyerMap.get(buyerKey);
            buyerData.purchases.push(sale);
            buyerData.totalNumbers += sale.numbers.length;
            buyerData.totalSpent += sale.total;
            
            // Actualizar fechas
            if (sale.date < buyerData.firstPurchase) {
                buyerData.firstPurchase = sale.date;
            }
            if (sale.date > buyerData.lastPurchase) {
                buyerData.lastPurchase = sale.date;
            }
        });
        
        return Array.from(buyerMap.values());
    },

    /**
     * Obtener estadísticas de compradores
     */
    getBuyerStats: function() {
        const uniqueBuyers = this.getUniqueBuyers();
        
        return {
            totalUniqueBuyers: uniqueBuyers.length,
            repeatBuyers: uniqueBuyers.filter(buyer => buyer.purchases.length > 1).length,
            averageSpentPerBuyer: uniqueBuyers.length > 0 ? 
                uniqueBuyers.reduce((sum, buyer) => sum + buyer.totalSpent, 0) / uniqueBuyers.length : 0,
            topBuyer: uniqueBuyers.length > 0 ? 
                uniqueBuyers.reduce((top, buyer) => buyer.totalSpent > top.totalSpent ? buyer : top, uniqueBuyers[0]) : null
        };
    },
    /**
     * Actualizar interfaz de administración
     */
    updateInterface: function() {
        if (!AppState.raffleConfig) return;

        // 🛡️ VALIDACIÓN: Verificar integridad de datos
        const integrity = this.validateDataIntegrity();
        if (!integrity.isValid) {
            console.error('🚨 [ADMIN] Datos corruptos detectados - números duplicados:', integrity.duplicates);
            Utils.showNotification(`⚠️ ADVERTENCIA: Números duplicados detectados: ${integrity.duplicates.map(n => Utils.formatNumber(n)).join(', ')}`, 'warning');
        }

        const soldCount = AppState.sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = AppState.sales.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const reservedCount = AppState.reservations.filter(r => r.status === 'active').reduce((sum, r) => sum + r.numbers.length, 0);
        const availableCount = AppState.raffleConfig.totalNumbers - soldCount - reservedCount;
        
        // ✅ CORREGIDO: Usar compradores únicos en lugar de cantidad de ventas
        const buyerStats = this.getBuyerStats();
        const uniqueBuyersCount = buyerStats.totalUniqueBuyers;
        
        const activeReservationsCount = AppState.reservations.filter(r => r.status === 'active').length;

        // Actualizar estadísticas solo si existen los elementos
        const soldElement = document.getElementById('soldNumbers');
        const revenueElement = document.getElementById('totalRevenue');
        const availableElement = document.getElementById('availableNumbers');
        const buyersElement = document.getElementById('totalBuyers');
        const reservationsElement = document.getElementById('activeReservations');

        if (soldElement) soldElement.textContent = soldCount;
        if (revenueElement) revenueElement.textContent = Utils.formatPrice(totalRevenue);
        if (availableElement) availableElement.textContent = availableCount;
        if (buyersElement) buyersElement.textContent = uniqueBuyersCount; // ✅ CORREGIDO
        if (reservationsElement) reservationsElement.textContent = activeReservationsCount;

        this.updateSalesList();
        this.updateReservationsList();
        this.updateAssignmentsList();
    },

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
            
            // 🛡️ Verificar si números ya están vendidos
            const validation = this.validateNumbersNotSold(reservation.numbers);
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
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number ${validation.duplicates.includes(parseInt(num.replace(/\D/g, ''))) ? 'conflict' : ''}">${num}</span>`).join('')}
                </div>
                <div style="margin: 8px 0; font-weight: 600; color: ${isExpiringSoon ? '#dc3545' : '#856404'};">
                    ⏰ Vence en: ${timeLeft.hours}h ${timeLeft.minutes}m
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span>💰 Total: ${Utils.formatPrice(reservation.total)}</span>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-small" onclick="AdminManager.confirmReservation('${reservation.id}', 'efectivo')" 
                            ${this.validateNumbersNotSold(reservation.numbers).isValid ? '' : 'disabled title="Números ya vendidos"'}>
                        ✅ Confirmar Efectivo
                    </button>
                    <button class="btn btn-small" onclick="AdminManager.confirmReservation('${reservation.id}', 'transferencia')"
                            ${this.validateNumbersNotSold(reservation.numbers).isValid ? '' : 'disabled title="Números ya vendidos"'}>
                        🏦 Confirmar Transferencia
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.cancelReservation('${reservation.id}')">❌ Cancelar</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Actualizar lista de asignaciones
     */
    updateAssignmentsList: function() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        const activeAssignments = AppState.assignments?.filter(a => a.status === 'assigned') || [];
        
        if (activeAssignments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones activas</p>';
            return;
        }

        container.innerHTML = activeAssignments.map(assignment => {
            const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n));
            const timeLeft = Utils.getTimeLeft(assignment.payment_deadline);
            const isExpiringSoon = timeLeft.hours < 2;
            
            // 🛡️ Verificar si números ya están vendidos o reservados
            const validation = this.validateNumbersNotSold(assignment.numbers);
            const hasConflict = !validation.isValid;
            
            return `
            <div class="sale-item" style="border-left: 4px solid ${hasConflict ? '#dc3545' : isExpiringSoon ? '#dc3545' : '#17a2b8'};">
                <div class="sale-header">
                    <strong>${assignment.seller_name} ${assignment.seller_lastname}</strong>
                    <span class="payment-status ${hasConflict ? 'error' : 'pending'}">
                        ${hasConflict ? '🚫 Conflicto' : '📋 Asignado'}
                    </span>
                </div>
                ${hasConflict ? `<div style="color: #dc3545; font-weight: bold; margin: 5px 0;">⚠️ Números ya vendidos: ${validation.duplicates.map(n => Utils.formatNumber(n)).join(', ')}</div>` : ''}
                <div>📞 ${assignment.seller_phone}</div>
                ${assignment.seller_email ? `<div>📧 ${assignment.seller_email}</div>` : ''}
                ${assignment.notes ? `<div style="margin: 5px 0; font-size: 14px; color: #666;">📝 ${assignment.notes}</div>` : ''}
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number ${validation.duplicates.includes(parseInt(num.replace(/\D/g, ''))) ? 'conflict' : ''}">${num}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>💰 Total: ${Utils.formatPrice(assignment.total_amount)}</span>
                    <span>📊 ${assignment.numbers.length} números</span>
                </div>
                <div style="margin: 8px 0; font-weight: 600; color: ${isExpiringSoon ? '#dc3545' : '#856404'};">
                    ⏰ Límite: ${Utils.formatDateTime(assignment.payment_deadline)}
                    ${isExpiringSoon ? ` (${timeLeft.hours}h ${timeLeft.minutes}m)` : ''}
                </div>
                <div class="admin-actions">
                    <button class="btn btn-small" onclick="AdminManager.confirmAssignment('${assignment.id}', 'efectivo')" 
                            ${this.validateNumbersNotSold(assignment.numbers).isValid ? '' : 'disabled title="Números ya vendidos"'}>
                        ✅ Cobrar Efectivo
                    </button>
                    <button class="btn btn-small" onclick="AdminManager.confirmAssignment('${assignment.id}', 'transferencia')"
                            ${this.validateNumbersNotSold(assignment.numbers).isValid ? '' : 'disabled title="Números ya vendidos"'}>
                        🏦 Cobrar Transferencia
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.editAssignment('${assignment.id}')">✏️ Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.changeAssignmentHolder('${assignment.id}')">👥 Cambiar Titular</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.cancelAssignment('${assignment.id}')">❌ Cancelar</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Validar que números no estén ya vendidos

    /**
     * Validar que números no estén ya vendidos
     */
    validateNumbersNotSold: function(numbers) {
        const soldNumbers = AppState.sales.reduce((sold, sale) => {
            sale.numbers.forEach(num => sold.add(num));
            return sold;
        }, new Set());

        const duplicates = numbers.filter(num => soldNumbers.has(num));
        return {
            isValid: duplicates.length === 0,
            duplicates: duplicates
        };
    },

    /**
     * Confirmar reserva
     */
    confirmReservation: async function(reservationId, paymentMethod) {
        console.log(`🔍 [ADMIN] Intentando confirmar reserva ID: ${reservationId} con método: ${paymentMethod}`);
        console.log(`🔍 [ADMIN] Tipo de ID: ${typeof reservationId}`);
        
        // 🛡️ CORREGIDO: Buscar reserva con comparación flexible (string vs number)
        const reservation = AppState.reservations.find(r => r.id == reservationId); // == para comparar string con number
        if (!reservation) {
            console.error(`❌ [ADMIN] Reserva ${reservationId} no encontrada`);
            console.log(`🔍 [ADMIN] IDs disponibles:`, AppState.reservations.map(r => r.id));
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }

        if (Utils.isReservationExpired(reservation)) {
            Utils.showNotification('Esta reserva ya está vencida', 'error');
            NumbersManager.checkExpiredReservations();
            return;
        }

        // 🛡️ VALIDACIÓN: Verificar que números no estén ya vendidos
        const validation = this.validateNumbersNotSold(reservation.numbers);
        if (!validation.isValid) {
            const duplicateNumbers = validation.duplicates.map(n => Utils.formatNumber(n)).join(', ');
            Utils.showNotification(`❌ Error: Los números ${duplicateNumbers} ya están vendidos. No se puede procesar la venta.`, 'error');
            console.error('🚫 [ADMIN] Intento de venta duplicada:', validation.duplicates);
            return;
        }

        // Crear venta
        const sale = {
            id: Utils.generateId(),
            numbers: [...reservation.numbers],
            buyer: reservation.buyer,
            paymentMethod,
            total: reservation.total,
            status: paymentMethod === 'transferencia' ? 'pending' : 'paid',
            date: new Date(),
            fromReservation: true
        };

        try {
            // Guardar venta en base de datos
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.saveSale(sale);
                console.log('✅ [ADMIN] Venta de reserva guardada en Supabase');
                
                // ✅ CORREGIDO: NO agregar acá - supabase.js ya lo hace
                // AppState.sales.push(sale); // ❌ ELIMINADO - causa duplicación
                console.log('✅ [ADMIN] Venta agregada al estado local (por SupabaseManager)');
                
                // Marcar reserva como confirmada en Supabase
                await window.SupabaseManager.updateReservationStatus(reservationId, 'confirmed');
                console.log('✅ [ADMIN] Reserva marcada como confirmada en Supabase');
                
                // IMPORTANTE: Actualizar estado local inmediatamente (la reserva)
                reservation.status = 'confirmed';
                console.log('✅ [ADMIN] Estado local de reserva actualizado');
            } else {
                // Fallback a localStorage
                AppState.sales.push(sale);
                reservation.status = 'confirmed';
                await autoSave();
                console.log('📱 [ADMIN] Confirmación guardada en localStorage');
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error confirmando reserva:', error);
            Utils.showNotification('Error confirmando la reserva', 'error');
            return;
        }

        // Cambiar números de reservado a vendido
        reservation.numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('reserved');
                button.classList.add('sold');
            }
        });

        this.updateInterface();
        
        // Generar mensaje de confirmación
        const numbersFormatted = reservation.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
        const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(reservation.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}`;
        
        if (confirm('¿Enviar confirmación por WhatsApp al cliente?')) {
            window.open(whatsappUrl, '_blank');
        }
        
        Utils.showNotification('Reserva confirmada exitosamente', 'success');
    },

    /**
     * Cancelar reserva
     */
    cancelReservation: async function(reservationId) {
        console.log(`🔍 [ADMIN] Intentando cancelar reserva ID: ${reservationId}`);
        console.log(`🔍 [ADMIN] Tipo de ID: ${typeof reservationId}`);
        console.log(`🔍 [ADMIN] Reservas actuales:`, AppState.reservations.map(r => ({ id: r.id, type: typeof r.id, status: r.status })));
        
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
        
        // 🛡️ CORREGIDO: Buscar reserva con comparación flexible (string vs number)
        const reservation = AppState.reservations.find(r => r.id == reservationId); // == para comparar string con number
        if (!reservation) {
            console.error(`❌ [ADMIN] Reserva ${reservationId} no encontrada`);
            console.log(`🔍 [ADMIN] IDs disponibles:`, AppState.reservations.map(r => r.id));
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }

        console.log(`✅ [ADMIN] Reserva encontrada:`, reservation);

        try {
            // Marcar como cancelada
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.updateReservationStatus(reservationId, 'cancelled');
                if (success) {
                    console.log('✅ [ADMIN] Reserva cancelada en Supabase');
                    
                    // IMPORTANTE: Actualizar estado local inmediatamente
                    reservation.status = 'cancelled';
                    console.log('✅ [ADMIN] Estado local de reserva actualizado');
                } else {
                    console.error('❌ [ADMIN] Error cancelando en Supabase');
                    Utils.showNotification('Error cancelando la reserva en Supabase', 'error');
                    return;
                }
            } else {
                reservation.status = 'cancelled';
                await autoSave();
                console.log('📱 [ADMIN] Reserva cancelada en localStorage');
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error cancelando reserva:', error);
            Utils.showNotification('Error cancelando la reserva', 'error');
            return;
        }

        // Liberar números
        reservation.numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('reserved');
                button.classList.add('available');
                console.log(`✅ [ADMIN] Número ${number} liberado en UI`);
            }
        });

        this.updateInterface();
        Utils.showNotification('Reserva cancelada', 'success');
        console.log('✅ [ADMIN] Cancelación completada exitosamente');
    },

    /**
     * Actualizar lista de ventas
     */
    updateSalesList: function() {
        const container = document.getElementById('salesList');
        if (!container) return;
        
        if (AppState.sales.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay ventas registradas aún</p>';
            return;
        }

        // Obtener datos de compradores únicos para identificar recurrentes
        const uniqueBuyers = this.getUniqueBuyers();
        const buyerPurchaseCount = new Map();
        
        uniqueBuyers.forEach(buyerData => {
            const buyerKey = `${buyerData.buyer.name.toLowerCase().trim()} ${buyerData.buyer.lastName.toLowerCase().trim()}`;
            buyerPurchaseCount.set(buyerKey, buyerData.purchases.length);
        });

        container.innerHTML = AppState.sales.map(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n));
            
            // Verificar si es comprador recurrente
            const buyerKey = `${sale.buyer.name.toLowerCase().trim()} ${sale.buyer.lastName.toLowerCase().trim()}`;
            const purchaseCount = buyerPurchaseCount.get(buyerKey) || 1;
            const isRepeatBuyer = purchaseCount > 1;
            
            return `
            <div class="sale-item${isRepeatBuyer ? ' repeat-buyer' : ''}">
                <div class="sale-header">
                    <strong>${sale.buyer.name} ${sale.buyer.lastName}</strong>
                    ${isRepeatBuyer ? `<span class="repeat-badge">🎆 ${purchaseCount}x compras</span>` : ''}
                    <span class="payment-status ${sale.status}">
                        ${sale.status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}
                    </span>
                </div>
                <div>📞 ${sale.buyer.phone}</div>
                ${sale.buyer.email ? `<div>📧 ${sale.buyer.email}</div>` : ''}
                ${sale.buyer.navigationInterest ? `<div style="margin: 5px 0; font-size: 14px;">${this.getInterestIcon(sale.buyer.navigationInterest)} ${AppConstants.INTEREST_LABELS[sale.buyer.navigationInterest]}</div>` : ''}
                ${sale.buyer.isMember ? `<div style="margin: 5px 0; font-size: 14px;">${this.getMemberIcon(sale.buyer.isMember)} ${AppConstants.MEMBER_LABELS[sale.buyer.isMember]}</div>` : ''}
                ${sale.buyer.isMember === 'si' && sale.buyer.memberActivities ? `<div style="margin: 5px 0; font-size: 14px;">${this.getActivityIcon(sale.buyer.memberActivities)} ${AppConstants.ACTIVITY_LABELS[sale.buyer.memberActivities]}</div>` : ''}
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number">${num}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span>💳 ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}</span>
                    <strong>${Utils.formatPrice(sale.total)}</strong>
                </div>
                <div style="font-size: 12px; color: #6c757d; margin: 5px 0;">
                    ${Utils.formatDateTime(sale.date)}
                </div>
                <div class="admin-actions">
                    ${sale.status === 'pending' ? 
                        `<button class="btn btn-small" onclick="AdminManager.markAsPaid('${sale.id}')">✅ Marcar Pagado</button>` : ''
                    }
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.deleteSale('${sale.id}')">🗑️ Eliminar</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.sendWhatsAppConfirmation('${sale.id}')">📱 Reenviar WhatsApp</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Obtener icono de interés
     */
    getInterestIcon: function(interest) {
        const icons = {
            'aprender': '🎓',
            'recreativo': '⛵',
            'ambos': '🎓⛵',
            'no': '❌'
        };
        return icons[interest] || '';
    },

    /**
     * Obtener icono de membresía
     */
    getMemberIcon: function(isMember) {
        return isMember === 'si' ? '🏠' : '🚫';
    },

    /**
     * Obtener icono de actividad
     */
    getActivityIcon: function(activity) {
        const icons = {
            'remo': '🚣',
            'ecologia': '🌱',
            'nautica': '⛵',
            'pesca': '🎣',
            'multiple': '🎆',
            'ninguna': '➖'
        };
        return icons[activity] || '';
    },

    /**
     * Marcar pago como confirmado
     */
    markAsPaid: async function(saleId) {
        console.log(`🔍 [ADMIN] Intentando marcar como pagado - Sale ID: ${saleId}`);
        console.log(`🔍 [ADMIN] Tipo de ID: ${typeof saleId}`);
        console.log(`🔍 [ADMIN] Ventas actuales:`, AppState.sales.map(s => ({ id: s.id, type: typeof s.id, status: s.status })));
        
        // 🛡️ CORREGIDO: Buscar venta con comparación flexible (string vs number)
        const sale = AppState.sales.find(s => s.id == saleId); // == para comparar string con number
        if (!sale) {
            console.error(`❌ [ADMIN] Venta ${saleId} no encontrada en memoria local`);
            console.log(`🔍 [ADMIN] IDs disponibles:`, AppState.sales.map(s => s.id));
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        console.log(`✅ [ADMIN] Venta encontrada:`, sale);
        
        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.markSaleAsPaid(saleId);
                if (success) {
                    console.log('✅ [ADMIN] Pago marcado en Supabase');
                    
                    // IMPORTANTE: Actualizar estado local inmediatamente
                    sale.status = 'paid';
                    console.log('✅ [ADMIN] Estado local de venta actualizado a pagado');
                    
                    this.updateInterface();
                    Utils.showNotification('Pago marcado como confirmado', 'success');
                } else {
                    console.error('❌ [ADMIN] Error actualizando el pago en Supabase');
                    Utils.showNotification('Error actualizando el pago en Supabase', 'error');
                }
            } else {
                // Fallback a localStorage solo si no hay Supabase
                sale.status = 'paid';
                await autoSave();
                this.updateInterface();
                Utils.showNotification('Pago marcado como confirmado (localStorage)', 'success');
                console.log('📱 [ADMIN] Pago actualizado en localStorage');
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error marcando pago:', error);
            Utils.showNotification('Error actualizando el pago', 'error');
        }
    },

    /**
     * Cambiar titular de una asignación
     */
    changeAssignmentHolder: async function(assignmentId) {
        console.log(`🔍 [ADMIN] Cambiando titular para asignación ID: ${assignmentId}`);
        
        // Buscar la asignación
        const assignment = AppState.assignments?.find(a => a.id == assignmentId);
        if (!assignment) {
            Utils.showNotification('Asignación no encontrada', 'error');
            return;
        }

        // Crear modal para cambiar titular
        const modalHtml = `
            <div id="changeHolderModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>👥 Cambiar Titular de Asignación</h3>
                        <span class="modal-close" onclick="AdminManager.closeChangeHolderModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="info-section">
                            <h4>📋 Asignación actual:</h4>
                            <div class="assignment-details">
                                <p><strong>Vendedor actual:</strong> ${assignment.seller_name} ${assignment.seller_lastname}</p>
                                <p><strong>Teléfono:</strong> ${assignment.seller_phone}</p>
                                <p><strong>Números:</strong> ${assignment.numbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                                <p><strong>Total:</strong> ${Utils.formatPrice(assignment.total_amount)}</p>
                                ${assignment.notes ? `<p><strong>Notas:</strong> ${assignment.notes}</p>` : ''}
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="newHolderName">Nuevo Nombre *</label>
                            <input type="text" id="newHolderName" placeholder="Nombre del nuevo responsable" required>
                        </div>

                        <div class="form-group">
                            <label for="newHolderLastName">Nuevo Apellido *</label>
                            <input type="text" id="newHolderLastName" placeholder="Apellido del nuevo responsable" required>
                        </div>

                        <div class="form-group">
                            <label for="newHolderPhone">Nuevo Teléfono *</label>
                            <input type="tel" id="newHolderPhone" placeholder="Teléfono del nuevo responsable" required>
                        </div>

                        <div class="form-group">
                            <label for="newHolderEmail">Nuevo Email (opcional)</label>
                            <input type="email" id="newHolderEmail" placeholder="Email del nuevo responsable">
                        </div>

                        <div class="form-group">
                            <label for="changeReason">Motivo del cambio (opcional)</label>
                            <textarea id="changeReason" rows="2" placeholder="Explicación del cambio de titular..."></textarea>
                        </div>

                        <div class="modal-footer" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn btn-secondary" onclick="AdminManager.closeChangeHolderModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="AdminManager.saveChangeHolder('${assignmentId}')">💾 Guardar Cambio</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si hay uno
        const existingModal = document.getElementById('changeHolderModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Guardar cambio de titular
     */
    saveChangeHolder: async function(assignmentId) {
        const newName = document.getElementById('newHolderName').value.trim();
        const newLastName = document.getElementById('newHolderLastName').value.trim();
        const newPhone = document.getElementById('newHolderPhone').value.trim();
        const newEmail = document.getElementById('newHolderEmail').value.trim();
        const reason = document.getElementById('changeReason').value.trim();

        if (!newName || !newLastName || !newPhone) {
            Utils.showNotification('Completa los campos obligatorios', 'error');
            return;
        }

        const assignment = AppState.assignments?.find(a => a.id == assignmentId);
        if (!assignment) {
            Utils.showNotification('Asignación no encontrada', 'error');
            return;
        }

        try {
            // Crear objeto con la información anterior para auditoría
            const previousHolder = {
                name: assignment.seller_name,
                lastname: assignment.seller_lastname,
                phone: assignment.seller_phone,
                email: assignment.seller_email
            };

            // Actualizar asignación
            const updatedAssignment = {
                ...assignment,
                seller_name: newName,
                seller_lastname: newLastName,
                seller_phone: newPhone,
                seller_email: newEmail || null,
                notes: reason ? `${assignment.notes || ''}\n[Cambio de titular: ${reason}]`.trim() : assignment.notes
            };

            // Actualizar en Supabase
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.updateAssignment(assignmentId, {
                    seller_name: newName,
                    seller_lastname: newLastName,
                    seller_phone: newPhone,
                    seller_email: newEmail || null,
                    notes: updatedAssignment.notes
                });
                console.log('✅ [ADMIN] Titular actualizado en Supabase');
            } else {
                // Actualizar localmente
                const index = AppState.assignments.findIndex(a => a.id == assignmentId);
                if (index !== -1) {
                    AppState.assignments[index] = updatedAssignment;
                    await autoSave();
                    console.log('📱 [ADMIN] Titular actualizado en localStorage');
                }
            }

            // Actualizar UI
            this.updateAssignmentsList();
            this.closeChangeHolderModal();

            Utils.showNotification(`✅ Titular actualizado exitosamente`, 'success');

            // Generar mensaje para WhatsApp
            const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
            const whatsappMessage = `🔄 *CAMBIO DE TITULAR*\n\n` +
                `Asignación: ${numbersFormatted}\n` +
                `Nuevo titular: ${newName} ${newLastName}\n` +
                `Teléfono: ${newPhone}\n` +
                `Total: ${Utils.formatPrice(assignment.total_amount)}\n` +
                `${reason ? `Motivo: ${reason}` : ''}`;

            if (confirm('¿Deseas enviar notificación por WhatsApp?')) {
                const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(newPhone)}?text=${encodeURIComponent(whatsappMessage)}`;
                window.open(whatsappUrl, '_blank');
            }

        } catch (error) {
            console.error('❌ [ADMIN] Error cambiando titular:', error);
            Utils.showNotification('Error al cambiar titular', 'error');
        }
    },

    /**
     * Cerrar modal de cambio de titular
     */
    closeChangeHolderModal: function() {
        const modal = document.getElementById('changeHolderModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Validar integridad de datos antes de operaciones
     */
    validateDataIntegrity: function() {
        const allSoldNumbers = [];
        const duplicateNumbers = [];
        
        // Recopilar todos los números vendidos
        AppState.sales.forEach(sale => {
            sale.numbers.forEach(number => {
                if (allSoldNumbers.includes(number)) {
                    if (!duplicateNumbers.includes(number)) {
                        duplicateNumbers.push(number);
                    }
                } else {
                    allSoldNumbers.push(number);
                }
            });
        });
        
        if (duplicateNumbers.length > 0) {
            console.warn('⚠️ [ADMIN] Números duplicados detectados:', duplicateNumbers.map(n => Utils.formatNumber(n)));
            return {
                isValid: false,
                duplicates: duplicateNumbers
            };
        }
        
        return { isValid: true, duplicates: [] };
    },

    /**
     * Eliminar venta
     */
    deleteSale: async function(saleId) {
        console.log(`🔍 [ADMIN] Intentando eliminar venta ID: ${saleId}`);
        console.log(`🔍 [ADMIN] Tipo de ID: ${typeof saleId}`);
        console.log(`🔍 [ADMIN] Ventas actuales:`, AppState.sales.map(s => ({ id: s.id, type: typeof s.id, status: s.status })));
        
        if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
        
        // 🛡️ CORREGIDO: Buscar venta con comparación flexible (string vs number)
        const saleIndex = AppState.sales.findIndex(s => s.id == saleId); // == para comparar string con number
        if (saleIndex === -1) {
            console.error(`❌ [ADMIN] Venta ${saleId} no encontrada`);
            console.log(`🔍 [ADMIN] IDs disponibles:`, AppState.sales.map(s => s.id));
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        const sale = AppState.sales[saleIndex];
        console.log(`✅ [ADMIN] Venta encontrada para eliminar:`, sale);
        
        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.deleteSale(saleId);
                if (success) {
                    console.log('✅ [ADMIN] Venta eliminada de Supabase');
                    
                    // Liberar números
                    sale.numbers.forEach(number => {
                        const button = document.getElementById(`number-${number}`);
                        if (button) {
                            button.classList.remove('sold');
                            button.classList.add('available');
                            console.log(`✅ [ADMIN] Número ${number} liberado en UI`);
                        }
                    });
                    
                    // IMPORTANTE: Actualizar estado local inmediatamente
                    AppState.sales.splice(saleIndex, 1);
                    console.log('✅ [ADMIN] Venta eliminada del estado local');
                    
                    this.updateInterface();
                    Utils.showNotification('Venta eliminada correctamente', 'success');
                } else {
                    console.error('❌ [ADMIN] Error eliminando la venta de Supabase');
                    Utils.showNotification('Error eliminando la venta de Supabase', 'error');
                }
            } else {
                // Fallback a localStorage solo si no hay Supabase
                // Liberar números
                sale.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button) {
                        button.classList.remove('sold');
                        button.classList.add('available');
                    }
                });
                
                AppState.sales.splice(saleIndex, 1);
                await autoSave();
                this.updateInterface();
                Utils.showNotification('Venta eliminada correctamente (localStorage)', 'success');
                console.log('📱 [ADMIN] Venta eliminada en localStorage');
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error eliminando venta:', error);
            Utils.showNotification('Error eliminando la venta', 'error');
        }
    },

    /**
     * Confirmar reserva convirtiéndola en venta
     */
    confirmReservation: async function(reservationId, paymentMethod) {
        console.log(`🔍 [ADMIN] Confirmando reserva ${reservationId} con método: ${paymentMethod}`);
        
        // Buscar la reserva
        const reservation = AppState.reservations.find(r => r.id == reservationId && r.status === 'active');
        if (!reservation) {
            console.error(`❌ [ADMIN] Reserva ${reservationId} no encontrada`);
            Utils.showNotification('Reserva no encontrada', 'error');
            return;
        }
        
        // Verificar que los números aún estén disponibles
        const validation = this.validateNumbersNotSold(reservation.numbers);
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
            // Guardar venta y actualizar reserva
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                // Guardar venta
                await window.SupabaseManager.saveSale(sale);
                // Marcar reserva como confirmada
                await window.SupabaseManager.updateReservationStatus(reservationId, 'confirmed');
                
                console.log('✅ [ADMIN] Reserva confirmada en Supabase');
            } else {
                // Fallback a localStorage
                AppState.sales.push(sale);
                reservation.status = 'confirmed';
                await autoSave();
                console.log('📱 [ADMIN] Reserva confirmada en localStorage');
            }
            
            // Actualizar UI inmediatamente
            reservation.status = 'confirmed';
            
            // Marcar números como vendidos
            reservation.numbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('available', 'reserved');
                    button.classList.add('sold');
                }
            });
            
            // Actualizar interfaces
            this.updateInterface();
            if (NumbersManager.updateDisplay) NumbersManager.updateDisplay();
            
            // Generar mensaje de confirmación
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
            const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
            
            // Mostrar confirmación con WhatsApp
            this.showReservationConfirmedModal(sale, whatsappMessage);
            
            Utils.showNotification(`Reserva confirmada como ${paymentMethod}`, 'success');
            
        } catch (error) {
            console.error('❌ [ADMIN] Error confirmando reserva:', error);
            Utils.showNotification('Error confirmando la reserva', 'error');
        }
    },
    
    /**
     * Mostrar modal de confirmación de reserva
     */
    showReservationConfirmedModal: function(sale, whatsappMessage) {
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        
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
                    
                    <button class="btn btn-secondary" onclick="AdminManager.closeReservationConfirmedModal()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
    },
    
    /**
     * Cerrar modal de confirmación de reserva
     */
    closeReservationConfirmedModal: function() {
        const modal = document.getElementById('reservationConfirmedModal');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * Validar que los números no estén ya vendidos
     */
    validateNumbersNotSold: function(numbers) {
        const soldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const duplicates = numbers.filter(num => soldNumbers.includes(num));
        
        return {
            isValid: duplicates.length === 0,
            duplicates: duplicates
        };
    },

    /**
     * Reenviar confirmación por WhatsApp
     */
    sendWhatsAppConfirmation: function(saleId) {
        const sale = AppState.sales.find(s => s.id === saleId);
        if (!sale) return;
        
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
        
        // ✅ CORREGIDO: Abrir WhatsApp para enviar mensaje AL CLIENTE
        const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
    },

    /**
     * Filtrar ventas
     */
    filterSales: function() {
        const searchTerm = document.getElementById('searchBox')?.value.toLowerCase();
        if (!searchTerm) return;

        const salesItems = document.querySelectorAll('#salesList .sale-item');

        salesItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    },

    /**
     * Exportar datos
     */
    exportData: function() {
        if (AppState.sales.length === 0) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }

        let csvContent = "Nombre,Apellido,Teléfono,Email,Números,Total,Método de Pago,Estado,Interés Navegación,Es Socio,Actividades Club,Fecha\n";
        
        AppState.sales.forEach(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(';');
            
            const row = [
                `"${sale.buyer.name}"`,
                `"${sale.buyer.lastName}"`,
                `"${sale.buyer.phone}"`,
                `"${sale.buyer.email || ''}"`,
                `"${numbersFormatted}"`,
                `"${sale.total}"`,
                `"${AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod}"`,
                `"${sale.status}"`,
                `"${AppConstants.INTEREST_LABELS[sale.buyer.navigationInterest] || 'No especificado'}"`,
                `"${AppConstants.MEMBER_LABELS[sale.buyer.isMember] || 'No especificado'}"`,
                `"${AppConstants.ACTIVITY_LABELS[sale.buyer.memberActivities] || 'No especificado'}"`,
                `"${Utils.formatDateTime(sale.date)}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `rifa_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification('Datos exportados correctamente', 'success');
    }
};

console.log('✅ Admin.js cargado correctamente');