/**
 * INTERFAZ DE NÚMEROS - Sistema de Rifas Pampero
 * Maneja la interfaz, grid de números y selección
 * MEJORADO: Información de números reservados y mejor interactividad
 */

window.NumbersInterface = {
    /**
     * Crear interfaz de números
     */
    createInterface: function() {
        if (!AppState.raffleConfig) return;

        const container = document.getElementById('numbersContent');
        container.innerHTML = `
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #d4edda;"></div>
                    Disponible
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #4CAF50;"></div>
                    Seleccionado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #fff3cd;"></div>
                    Reservado 💰💳
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ffc107;"></div>
                    Asignado 📋
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #007bff;"></div>
                    Confirmado ✅
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f8d7da;"></div>
                    Vendido ❌
                </div>
            </div>

            <div id="selectionSummary" style="display: none;" class="selection-summary">
                <h3>Tu selección</h3>
                <div id="selectedNumbersList" class="selected-numbers"></div>
                <div class="total-price" id="totalPrice"></div>
                <button class="btn btn-purchase" onclick="NumbersManager.openPurchaseModal('buy')" style="width: calc(33% - 3px);">💰 Comprar</button>
                <button class="btn btn-reserve" onclick="NumbersManager.openPurchaseModal('reserve')" style="width: calc(33% - 3px);">⏰ Reservar</button>
                <button class="btn btn-assign" onclick="NumbersManager.openAssignmentModal()" style="width: calc(33% - 3px);">🎯 Asignar</button>
                <button class="btn btn-secondary" onclick="NumbersManager.clearSelection()">Limpiar Selección</button>
            </div>

            <div class="numbers-grid" id="numbersGrid"></div>
        `;

        // Generar grid de números (del 0 al N-1)
        const grid = document.getElementById('numbersGrid');
        for (let i = 0; i < AppState.raffleConfig.totalNumbers; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn available';
            button.textContent = Utils.formatNumber(i);
            button.onclick = () => this.handleNumberClick(i);
            button.id = `number-${i}`;
            
            // Agregar tooltip para números ocupados
            button.title = 'Hacer click para más información';
            
            grid.appendChild(button);
        }

        NumbersManager.updateDisplay();
    },

    /**
     * Manejar clic en número (mostrar info o seleccionar)
     */
    handleNumberClick: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Si el número está vendido o confirmado, mostrar información
        if (button.classList.contains('sold') || button.classList.contains('confirmed')) {
            NumbersManager.showNumberInfo(number);
        } 
        // Si está reservado, mostrar información de la reserva
        else if (button.classList.contains('reserved')) {
            this.showReservationInfo(number);
        }
        // Si está asignado, permitir editar titular o mostrar info
        else if (button.classList.contains('assigned')) {
            const assignment = AppState.assignments?.find(a => a.numbers.includes(number));
            if (assignment) {
                const now = new Date();
                const rendicionDate = new Date(assignment.payment_deadline);
                
                if (now < rendicionDate) {
                    // Aún se puede editar el titular
                    NumbersManager.showEditOwnerModal(number);
                } else {
                    // Ya pasó la fecha de rendición, solo mostrar info
                    NumbersManager.showNumberInfo(number);
                }
            } else {
                NumbersManager.showNumberInfo(number);
            }
        } else {
            // Si está disponible, proceder con selección normal
            this.toggleNumber(number);
        }
    },

    /**
     * Mostrar información de reserva
     */
    showReservationInfo: function(number) {
        const reservation = AppState.reservations.find(r => 
            r.numbers.includes(number) && r.status === 'active'
        );

        if (!reservation) {
            Utils.showNotification('Información de reserva no encontrada', 'error');
            return;
        }

        const timeLeft = Utils.getTimeLeft(reservation.expiresAt);
        const isExpired = Utils.isReservationExpired(reservation);
        const isExpiringSoon = timeLeft.hours < 2;

        const modalHtml = `
            <div id="reservationInfoModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⏰ Información de Reserva - ${Utils.formatNumber(number)}</h3>
                        <span class="modal-close" onclick="NumbersInterface.closeReservationInfoModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="reservation-info-section">
                            <div class="info-subsection">
                                <h5>👤 Cliente</h5>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Nombre</label>
                                        <span>${reservation.buyer.name} ${reservation.buyer.lastName}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Teléfono</label>
                                        <span>${reservation.buyer.phone}</span>
                                    </div>
                                    ${reservation.buyer.email ? `
                                    <div class="info-item">
                                        <label>Email</label>
                                        <span>${reservation.buyer.email}</span>
                                    </div>
                                    ` : ''}
                                    ${reservation.buyer.membershipArea ? `
                                    <div class="info-item">
                                        <label>Relación con el club</label>
                                        <span>${AppConstants.MEMBERSHIP_LABELS[reservation.buyer.membershipArea] || reservation.buyer.membershipArea}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="info-subsection">
                                <h5>🎯 Detalles de la Reserva</h5>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Números reservados</label>
                                        <span>${reservation.numbers.map(n => Utils.formatNumber(n)).join(', ')}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Total</label>
                                        <span style="font-weight: bold; color: #4CAF50;">${Utils.formatPrice(reservation.total)}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Fecha de reserva</label>
                                        <span>${Utils.formatDateTime(reservation.createdAt)}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Estado</label>
                                        <span class="status-badge ${isExpired ? 'status-expired' : isExpiringSoon ? 'status-warning' : 'status-active'}">
                                            ${isExpired ? '⚠️ Vencida' : isExpiringSoon ? '🔥 Por vencer' : '✅ Activa'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="info-subsection">
                                <h5>⏰ Tiempo de Reserva</h5>
                                <div style="background: ${isExpired ? '#f8d7da' : isExpiringSoon ? '#fff3cd' : '#d1ecf1'}; 
                                           padding: 15px; border-radius: 8px; border-left: 4px solid ${isExpired ? '#dc3545' : isExpiringSoon ? '#ffc107' : '#17a2b8'};">
                                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px; color: ${isExpired ? '#721c24' : isExpiringSoon ? '#856404' : '#0c5460'};">
                                        ${isExpired ? '⚠️ RESERVA VENCIDA' : 
                                          isExpiringSoon ? '🔥 VENCE PRONTO' : 
                                          `⏰ ${timeLeft.hours}h ${timeLeft.minutes}m restantes`}
                                    </div>
                                    <div style="font-size: 14px; color: #666;">
                                        ${isExpired ? 
                                          `Venció el ${Utils.formatDateTime(reservation.expiresAt)}` :
                                          `Vence el ${Utils.formatDateTime(reservation.expiresAt)}`
                                        }
                                    </div>
                                </div>
                            </div>

                            ${!isExpired && AdminManager ? `
                            <div class="info-subsection">
                                <h5>⚡ Acciones Rápidas</h5>
                                <div style="display: grid; gap: 10px;">
                                    <button class="btn btn-purchase" onclick="AdminReservations.confirmReservation('${reservation.id}', 'efectivo'); NumbersInterface.closeReservationInfoModal();">
                                        💰 Confirmar Pago en Efectivo
                                    </button>
                                    <button class="btn btn-info" onclick="AdminReservations.confirmReservation('${reservation.id}', 'transferencia'); NumbersInterface.closeReservationInfoModal();">
                                        💳 Confirmar Pago por Transferencia
                                    </button>
                                    <button class="btn btn-warning" onclick="AdminReservations.extendReservation('${reservation.id}'); NumbersInterface.closeReservationInfoModal();">
                                        ⏰ Extender Tiempo de Reserva
                                    </button>
                                </div>
                            </div>
                            ` : ''}

                            <div class="info-subsection">
                                <h5>📱 Contacto</h5>
                                <div style="text-align: center;">
                                    <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(reservation.buyer.phone)}?text=${encodeURIComponent(`Hola ${reservation.buyer.name}! Te contactamos sobre tu reserva de los números ${reservation.numbers.map(n => Utils.formatNumber(n)).join(', ')} en la Rifa Náutica por ${Utils.formatPrice(reservation.total)}.`)}" 
                                       class="whatsapp-btn" target="_blank">
                                       📱 Contactar a ${reservation.buyer.name}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Cerrar modal de información de reserva
     */
    closeReservationInfoModal: function() {
        const modal = document.getElementById('reservationInfoModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Alternar selección de número
     */
    toggleNumber: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Verificar si el número ya está vendido
        if (button.classList.contains('sold')) {
            Utils.showNotification('Este número ya está vendido', 'warning');
            return;
        }
        
        // Verificar si está asignado o confirmado
        if (button.classList.contains('assigned')) {
            Utils.showNotification('Este número está asignado a un vendedor', 'warning');
            return;
        }
        
        if (button.classList.contains('confirmed')) {
            Utils.showNotification('Este número está confirmado para el sorteo', 'warning');
            return;
        }
        
        // Verificar reservas temporales (sistema antiguo)
        if (button.classList.contains('reserved')) {
            const reservation = AppState.reservations.find(r => 
                r.numbers.includes(number) && r.status === 'active'
            );
            if (reservation && !Utils.isReservationExpired(reservation)) {
                Utils.showNotification('Este número está reservado temporalmente. Haz click para ver detalles.', 'warning');
                return;
            }
        }

        if (AppState.selectedNumbers.includes(number)) {
            // Deseleccionar
            AppState.selectedNumbers = AppState.selectedNumbers.filter(n => n !== number);
            button.classList.remove('selected');
            button.classList.add('available');
        } else {
            // Seleccionar
            AppState.selectedNumbers.push(number);
            button.classList.remove('available', 'reserved');
            button.classList.add('selected');
        }

        AppState.selectedNumbers.sort((a, b) => a - b);
        this.updateSelectionSummary();
    },

    /**
     * Actualizar resumen de selección
     */
    updateSelectionSummary: function() {
        const summary = document.getElementById('selectionSummary');
        const numbersList = document.getElementById('selectedNumbersList');
        const totalPrice = document.getElementById('totalPrice');

        if (AppState.selectedNumbers.length === 0) {
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'block';
        
        numbersList.innerHTML = AppState.selectedNumbers.map(num => 
            `<span class="selected-number">${Utils.formatNumber(num)}</span>`
        ).join('');

        const total = AppState.selectedNumbers.length * AppState.raffleConfig.price;
        totalPrice.textContent = `Total: ${Utils.formatPrice(total)}`;
    },

    /**
     * Limpiar selección
     */
    clearSelection: function() {
        AppState.selectedNumbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('selected');
                button.classList.add('available');
            }
        });
        AppState.selectedNumbers = [];
        this.updateSelectionSummary();
    }
};

console.log('✅ numbers-interface.js mejorado cargado correctamente');