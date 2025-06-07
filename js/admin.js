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

            <h3>Reservas Activas</h3>
            <div class="sales-list" id="reservationsList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay reservas activas</p>
            </div>

            <h3>Búsqueda de Ventas</h3>
            <input type="text" class="search-box" id="searchBox" placeholder="Buscar por nombre, teléfono o número..." onkeyup="AdminManager.filterSales()">

            <h3>Lista de Ventas</h3>
            <div class="sales-list" id="salesList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay ventas registradas aún</p>
            </div>

            <button class="btn" onclick="AdminManager.exportData()">📊 Exportar Datos</button>
        `;

        this.updateInterface();
    },

    /**
     * Actualizar interfaz de administración
     */
    updateInterface: function() {
        if (!AppState.raffleConfig) return;

        const soldCount = AppState.sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = AppState.sales.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const reservedCount = AppState.reservations.filter(r => r.status === 'active').reduce((sum, r) => sum + r.numbers.length, 0);
        const availableCount = AppState.raffleConfig.totalNumbers - soldCount - reservedCount;
        const buyersCount = AppState.sales.length;
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
        if (buyersElement) buyersElement.textContent = buyersCount;
        if (reservationsElement) reservationsElement.textContent = activeReservationsCount;

        this.updateSalesList();
        this.updateReservationsList();
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
            
            return `
            <div class="sale-item" style="border-left: 4px solid ${isExpiringSoon ? '#dc3545' : '#ffc107'};">
                <div class="sale-header">
                    <strong>${reservation.buyer.name} ${reservation.buyer.lastName}</strong>
                    <span class="payment-status pending">⏰ Reservado</span>
                </div>
                <div>📞 ${reservation.buyer.phone}</div>
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number">${num}</span>`).join('')}
                </div>
                <div style="margin: 8px 0; font-weight: 600; color: ${isExpiringSoon ? '#dc3545' : '#856404'};">
                    ⏰ Vence en: ${timeLeft.hours}h ${timeLeft.minutes}m
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span>💰 Total: ${Utils.formatPrice(reservation.total)}</span>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-small" onclick="AdminManager.confirmReservation(${reservation.id}, 'efectivo')">✅ Confirmar Efectivo</button>
                    <button class="btn btn-small" onclick="AdminManager.confirmReservation(${reservation.id}, 'transferencia')">🏦 Confirmar Transferencia</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.cancelReservation(${reservation.id})">❌ Cancelar</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Confirmar reserva
     */
    confirmReservation: function(reservationId, paymentMethod) {
        const reservation = AppState.reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        if (Utils.isReservationExpired(reservation)) {
            Utils.showNotification('Esta reserva ya está vencida', 'error');
            NumbersManager.checkExpiredReservations();
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

        AppState.sales.push(sale);

        // Marcar reserva como confirmada
        reservation.status = 'confirmed';

        // Cambiar números de reservado a vendido
        reservation.numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('reserved');
                button.classList.add('sold');
            }
        });

        this.updateInterface();
        autoSave();
        
        // Generar mensaje de confirmación
        const numbersFormatted = reservation.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateWhatsAppMessage(sale, numbersFormatted);
        const whatsappUrl = `https://wa.me/${reservation.buyer.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
        
        if (confirm('¿Enviar confirmación por WhatsApp al cliente?')) {
            window.open(whatsappUrl, '_blank');
        }
        
        Utils.showNotification('Reserva confirmada exitosamente', 'success');
    },

    /**
     * Cancelar reserva
     */
    cancelReservation: function(reservationId) {
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
        
        const reservation = AppState.reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        // Marcar como cancelada
        reservation.status = 'cancelled';

        // Liberar números
        reservation.numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('reserved');
                button.classList.add('available');
            }
        });

        this.updateInterface();
        autoSave();
        Utils.showNotification('Reserva cancelada', 'success');
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

        container.innerHTML = AppState.sales.map(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n));
            
            return `
            <div class="sale-item">
                <div class="sale-header">
                    <strong>${sale.buyer.name} ${sale.buyer.lastName}</strong>
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
                        `<button class="btn btn-small" onclick="AdminManager.markAsPaid(${sale.id})">✅ Marcar Pagado</button>` : ''
                    }
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.deleteSale(${sale.id})">🗑️ Eliminar</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.sendWhatsAppConfirmation(${sale.id})">📱 Reenviar WhatsApp</button>
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
    markAsPaid: function(saleId) {
        const sale = AppState.sales.find(s => s.id === saleId);
        if (sale) {
            sale.status = 'paid';
            this.updateInterface();
            autoSave();
            Utils.showNotification('Pago marcado como confirmado', 'success');
        }
    },

    /**
     * Eliminar venta
     */
    deleteSale: function(saleId) {
        if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
        
        const saleIndex = AppState.sales.findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            const sale = AppState.sales[saleIndex];
            
            // Liberar números
            sale.numbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('sold');
                    button.classList.add('available');
                }
            });
            
            AppState.sales.splice(saleIndex, 1);
            this.updateInterface();
            autoSave();
            Utils.showNotification('Venta eliminada correctamente', 'success');
        }
    },

    /**
     * Reenviar confirmación por WhatsApp
     */
    sendWhatsAppConfirmation: function(saleId) {
        const sale = AppState.sales.find(s => s.id === saleId);
        if (!sale) return;
        
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateWhatsAppMessage(sale, numbersFormatted);
        
        const whatsappUrl = `https://wa.me/${sale.buyer.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
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