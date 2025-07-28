/**
 * GESTIÓN DE NÚMEROS - Sistema de Rifas Pampero
 * Maneja la selección, compra y reserva de números
 */

window.NumbersManager = {
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
                    Reservado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ffc107;"></div>
                    Asignado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #007bff;"></div>
                    Confirmado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f8d7da;"></div>
                    Vendido
                </div>
            </div>

            <div id="selectionSummary" style="display: none;" class="selection-summary">
                <h3>Tu selección</h3>
                <div id="selectedNumbersList" class="selected-numbers"></div>
                <div class="total-price" id="totalPrice"></div>
                <button class="btn" onclick="NumbersManager.openPurchaseModal('buy')" style="width: calc(50% - 5px);">💰 Comprar Ahora</button>
                <button class="btn btn-secondary" onclick="NumbersManager.openPurchaseModal('reserve')" style="width: calc(50% - 5px); background: #ffc107; color: #000;">⏰ Reservar</button>
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
            grid.appendChild(button);
        }

        this.updateDisplay();
    },

    /**
     * Generar mensaje de WhatsApp simplificado (más confiable)
     */
    generateSimpleWhatsAppMessage: function(sale, numbersFormatted) {
        const statusText = sale.status === 'pending' ? 
            'COMPRA REGISTRADA - PAGO PENDIENTE' : 
            'COMPRA CONFIRMADA';
        
        let message = `*${statusText}*\n\n`;
        message += `*${AppState.raffleConfig.name}*\n`;
        message += `*Premio:* ${AppState.raffleConfig.prize}\n\n`;
        message += `*Comprador:* ${sale.buyer.name} ${sale.buyer.lastName}\n`;
        message += `*Telefono:* ${sale.buyer.phone}\n`;
        message += `*Numeros:* ${numbersFormatted}\n`;
        message += `*Total:* ${Utils.formatPrice(sale.total)}\n`;
        message += `*Pago:* ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}\n`;
        
        if (sale.buyer.membershipArea && sale.buyer.membershipArea !== '') {
            message += `*Relacion con el club:* ${AppConstants.MEMBERSHIP_LABELS[sale.buyer.membershipArea]}\n`;
        }
        
        message += `*Fecha:* ${Utils.formatDateTime(sale.date)}\n\n`;
        
        if (sale.status === 'pending') {
            message += `*Datos para transferir:*\n`;
            message += `Alias: PAMPERO.RIFA\n`;
            message += `CBU: 0000003100010000000001\n`;
            message += `Titular: ${AppState.raffleConfig.organization}\n\n`;
            message += `Envia el comprobante al ${AppState.raffleConfig.whatsappNumber}\n\n`;
        }
        
        if (AppState.raffleConfig.clubInstagram) {
            message += `Siguenos en Instagram: ${AppState.raffleConfig.clubInstagram}\n\n`;
        }
        
        message += `Gracias por participar!`;
        
        return message;
    },

    /**
     * Manejar clic en número (mostrar info o seleccionar)
     */
    handleNumberClick: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Si el número está vendido, asignado o confirmado, mostrar información
        if (button.classList.contains('sold') || 
            button.classList.contains('assigned') || 
            button.classList.contains('confirmed')) {
            this.showNumberInfo(number);
        } else {
            // Si está disponible o reservado, proceder con selección normal
            this.toggleNumber(number);
        }
    },

    /**
     * Mostrar información del titular de un número
     */
    showNumberInfo: function(number) {
        const numberInfo = this.getNumberInfo(number);
        
        if (!numberInfo) {
            Utils.showNotification('No se encontró información para este número', 'warning');
            return;
        }
        
        this.displayNumberInfoModal(number, numberInfo);
    },

    /**
     * Obtener información completa de un número
     */
    getNumberInfo: function(number) {
        // Buscar en ventas
        const sale = AppState.sales.find(s => s.numbers.includes(number));
        if (sale) {
            return {
                type: 'sale',
                status: sale.status,
                buyer: sale.buyer,
                paymentMethod: sale.paymentMethod,
                total: sale.total,
                date: sale.date,
                numbersCount: sale.numbers.length,
                allNumbers: sale.numbers,
                sale: sale // Agregar referencia completa para tener acceso al ID
            };
        }
        
        // Buscar en asignaciones
        const assignment = AppState.assignments?.find(a => a.numbers.includes(number));
        if (assignment) {
            // Buscar titular específico para este número
            const owner = AppState.numberOwners?.find(o => 
                o.assignment_id == assignment.id && o.number_value === number
            );
            
            return {
                type: 'assignment',
                status: assignment.status,
                seller: {
                    name: assignment.seller_name,
                    lastname: assignment.seller_lastname,
                    phone: assignment.seller_phone
                },
                owner: owner || null,
                assignment: assignment,
                numbersCount: assignment.numbers.length,
                allNumbers: assignment.numbers
            };
        }
        
        return null;
    },

    /**
     * Mostrar modal con información del número
     */
    displayNumberInfoModal: function(number, info) {
        const modalHtml = `
            <div id="numberInfoModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📋 Información del Número ${Utils.formatNumber(number)}</h3>
                        <span class="close-btn" onclick="NumbersManager.closeNumberInfoModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${this.generateNumberInfoContent(number, info)}
                    </div>
                    <div class="modal-footer">
                        ${this.generateNumberInfoActions(number, info)}
                        <button class="btn btn-secondary" onclick="NumbersManager.closeNumberInfoModal()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('numberInfoModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Generar contenido del modal de información
     */
    generateNumberInfoContent: function(number, info) {
        if (info.type === 'sale') {
            const statusBadge = info.status === 'paid' ? 
                '<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">✅ PAGADO</span>' :
                '<span style="background: #ffc107; color: #000; padding: 3px 8px; border-radius: 12px; font-size: 12px;">⏳ PENDIENTE</span>';
            
            return `
                <div class="number-info-section">
                    <h4>💰 Venta Directa ${statusBadge}</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>👤 Comprador:</label>
                            <span><strong>${info.buyer.name} ${info.buyer.lastName}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>📞 Teléfono:</label>
                            <span>${info.buyer.phone}</span>
                        </div>
                        ${info.buyer.email ? `
                            <div class="info-item">
                                <label>📧 Email:</label>
                                <span>${info.buyer.email}</span>
                            </div>
                        ` : ''}
                        ${info.buyer.instagram ? `
                            <div class="info-item">
                                <label>📷 Instagram:</label>
                                <span>${info.buyer.instagram}</span>
                            </div>
                        ` : ''}
                        <div class="info-item">
                            <label>🏠 Relación con el club:</label>
                            <span>${AppConstants.MEMBERSHIP_LABELS[info.buyer.membershipArea] || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <label>💳 Método de pago:</label>
                            <span>${AppConstants.PAYMENT_METHODS[info.paymentMethod]}</span>
                        </div>
                        <div class="info-item">
                            <label>💰 Total pagado:</label>
                            <span><strong>${Utils.formatPrice(info.total)}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>📅 Fecha de compra:</label>
                            <span>${Utils.formatDateTime(info.date)}</span>
                        </div>
                        ${info.numbersCount > 1 ? `
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <label>🔢 Todos sus números (${info.numbersCount}):</label>
                                <span>${info.allNumbers.map(n => Utils.formatNumber(n)).join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (info.type === 'assignment') {
            const statusBadge = info.status === 'confirmed' ? 
                '<span style="background: #007bff; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">✅ CONFIRMADO</span>' :
                info.status === 'paid' ?
                '<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">💰 PAGADO</span>' :
                '<span style="background: #ffc107; color: #000; padding: 3px 8px; border-radius: 12px; font-size: 12px;">📋 ASIGNADO</span>';
            
            const owner = info.owner;
            
            return `
                <div class="number-info-section">
                    <h4>📋 Número Asignado ${statusBadge}</h4>
                    
                    <div class="info-subsection">
                        <h5>👨‍💼 Vendedor Responsable:</h5>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>👤 Nombre:</label>
                                <span><strong>${info.seller.name} ${info.seller.lastname}</strong></span>
                            </div>
                            <div class="info-item">
                                <label>📞 Teléfono:</label>
                                <span>${info.seller.phone}</span>
                            </div>
                            <div class="info-item">
                                <label>💰 Total asignado:</label>
                                <span><strong>${Utils.formatPrice(info.assignment.total_amount)}</strong></span>
                            </div>
                            ${info.assignment.payment_deadline ? `
                                <div class="info-item">
                                    <label>⏰ Vence:</label>
                                    <span>${Utils.formatDateTime(info.assignment.payment_deadline)}</span>
                                </div>
                            ` : ''}
                            ${info.numbersCount > 1 ? `
                                <div class="info-item" style="grid-column: 1 / -1;">
                                    <label>🔢 Todos los números asignados (${info.numbersCount}):</label>
                                    <span>${info.allNumbers.map(n => Utils.formatNumber(n)).join(', ')}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="info-subsection">
                        <h5>🎫 Titular del Número:</h5>
                        ${owner && (owner.name || owner.phone) ? `
                            <div class="info-grid">
                                ${owner.name ? `
                                    <div class="info-item">
                                        <label>👤 Nombre:</label>
                                        <span><strong>${owner.name} ${owner.lastname || ''}</strong></span>
                                    </div>
                                ` : ''}
                                ${owner.phone ? `
                                    <div class="info-item">
                                        <label>📞 Teléfono:</label>
                                        <span>${owner.phone}</span>
                                    </div>
                                ` : ''}
                                ${owner.email ? `
                                    <div class="info-item">
                                        <label>📧 Email:</label>
                                        <span>${owner.email}</span>
                                    </div>
                                ` : ''}
                                ${owner.instagram ? `
                                    <div class="info-item">
                                        <label>📷 Instagram:</label>
                                        <span>${owner.instagram}</span>
                                    </div>
                                ` : ''}
                                ${owner.membership_area ? `
                                    <div class="info-item">
                                        <label>🏠 Relación con el club:</label>
                                        <span>${AppConstants.MEMBERSHIP_LABELS[owner.membership_area] || owner.membership_area}</span>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; color: #6c757d;">
                                📝 <strong>Titular no definido aún</strong><br>
                                <small>El vendedor puede editar esta información desde la pestaña Asignaciones</small>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }
        
        return '<p>No se pudo cargar la información</p>';
    },

    /**
     * Generar acciones del modal de información
     */
    generateNumberInfoActions: function(number, info) {
        let actions = '';
        
        if (info.type === 'sale') {
            // Acciones para ventas
            const cleanPhone = info.buyer.phone.replace(/\D/g, '');
            actions += `
                <a href="https://wa.me/${this.formatPhoneForWhatsApp(info.buyer.phone)}" 
                   class="btn btn-success" target="_blank" style="background: #25d366;">
                   📱 Contactar ${info.buyer.name}
                </a>
            `;
            
            if (info.status === 'pending') {
            actions += `
            <button class="btn btn-primary" onclick="NumbersManager.markSaleAsPaid('${info.sale.id}')">
            ✅ Marcar como Pagado
            </button>
            `;
            }
        } else if (info.type === 'assignment') {
            // Acciones para asignaciones
            const cleanPhone = info.seller.phone.replace(/\D/g, '');
            actions += `
                <a href="https://wa.me/${this.formatPhoneForWhatsApp(info.seller.phone)}" 
                   class="btn btn-success" target="_blank" style="background: #25d366;">
                   📱 Contactar Vendedor
                </a>
            `;
            
            if (info.owner && info.owner.phone) {
                actions += `
                    <a href="https://wa.me/${this.formatPhoneForWhatsApp(info.owner.phone)}" 
                       class="btn btn-info" target="_blank">
                       📱 Contactar Titular
                    </a>
                `;
            }
        }
        
        return actions;
    },

    /**
     * Cerrar modal de información del número
     */
    closeNumberInfoModal: function() {
        const modal = document.getElementById('numberInfoModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Marcar venta como pagada desde el modal
     */
    markSaleAsPaid: async function(saleId) {
        if (!saleId) {
            Utils.showNotification('Error: ID de venta no encontrado', 'error');
            return;
        }
        
        try {
            // Actualizar en Supabase
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.markSaleAsPaid(saleId);
            } else {
                // Fallback local
                const sale = AppState.sales.find(s => s.id == saleId);
                if (sale) {
                    sale.status = 'paid';
                    await autoSave();
                }
            }
            
            Utils.showNotification('Venta marcada como pagada', 'success');
            this.closeNumberInfoModal();
            
            // Actualizar interfaces
            if (AdminManager.updateInterface) AdminManager.updateInterface();
            
        } catch (error) {
            console.error('Error marcando venta como pagada:', error);
            Utils.showNotification('Error actualizando el estado de la venta', 'error');
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
                Utils.showNotification('Este número está reservado temporalmente', 'warning');
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
    },

    /**
     * Abrir modal de compra
     */
    openPurchaseModal: function(action = 'buy') {
        if (AppState.selectedNumbers.length === 0) {
            Utils.showNotification('Selecciona al menos un número', 'warning');
            return;
        }

        AppState.currentAction = action;
        const modal = document.getElementById('purchaseModal');
        const modalNumbers = document.getElementById('modalSelectedNumbers');
        const modalPrice = document.getElementById('modalTotalPrice');
        const modalTitle = modal.querySelector('h3');
        const paymentButtons = modal.querySelector('.payment-buttons');
        const transferInfo = document.getElementById('transferInfo');

        modalNumbers.innerHTML = AppState.selectedNumbers.map(num => 
            `<span class="selected-number">${Utils.formatNumber(num)}</span>`
        ).join('');

        const total = AppState.selectedNumbers.length * AppState.raffleConfig.price;
        modalPrice.textContent = `Total: ${Utils.formatPrice(total)}`;

        // Remover botón de reserva anterior si existe
        const existingReserveButton = document.getElementById('reserveButton');
        if (existingReserveButton) {
            existingReserveButton.remove();
        }

        if (action === 'reserve') {
            modalTitle.textContent = `⏰ Reservar Números (${AppState.raffleConfig.reservationTime}h)`;
            
            // ✅ CORREGIDO: Solo mostrar botón de reserva, NO pedir método de pago
            if (paymentButtons) paymentButtons.style.display = 'none';
            if (transferInfo) transferInfo.style.display = 'none';
            
            // Agregar botón de reserva directo
            const reserveButton = document.createElement('button');
            reserveButton.id = 'reserveButton';
            reserveButton.className = 'btn';
            reserveButton.textContent = '⏰ Confirmar Reserva (Sin Pago)';
            reserveButton.style.width = '100%';
            reserveButton.style.background = '#ffc107';
            reserveButton.style.color = '#000';
            reserveButton.style.marginTop = '15px';
            reserveButton.onclick = () => this.completePurchase(); // Sin método de pago
            
            // Insertar antes del formulario
            const membershipArea = document.getElementById('membershipArea').closest('.form-group');
            membershipArea.insertAdjacentElement('afterend', reserveButton);
            
        } else {
            modalTitle.textContent = '💰 Completar Compra';
            
            // Mostrar botones de pago para compras directas
            if (paymentButtons) paymentButtons.style.display = 'flex';
            if (transferInfo) transferInfo.style.display = 'none';
        }

        modal.style.display = 'block';
    },

    /**
     * Cerrar modal de compra
     */
    closePurchaseModal: function() {
        document.getElementById('purchaseModal').style.display = 'none';
        
        // Limpiar formulario
        const fields = ['buyerName', 'buyerLastName', 'buyerPhone', 'buyerEmail', 'buyerInstagram', 'membershipArea'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = '';
        });
        
        // Ocultar información de transferencia
        document.getElementById('transferInfo').style.display = 'none';
        
        // Remover botón de reserva si existe
        const reserveButton = document.getElementById('reserveButton');
        if (reserveButton) {
            reserveButton.remove();
        }
        
        // Limpiar sugerencias y consolidación
        document.getElementById('buyerSuggestions').style.display = 'none';
        const consolidation = document.querySelector('.buyer-consolidation');
        if (consolidation) {
            consolidation.remove();
        }

    },



    /**
     * Buscar compradores existentes
     */
    searchExistingBuyers: function() {
        const searchTerm = document.getElementById('buyerName').value.toLowerCase().trim();
        const suggestionsDiv = document.getElementById('buyerSuggestions');
        
        if (searchTerm.length < 2) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }

        // Buscar en ventas existentes
        const buyerMap = new Map();

        // Consolidar compradores por nombre completo
        [...AppState.sales, ...AppState.reservations].forEach(transaction => {
            const fullName = `${transaction.buyer.name} ${transaction.buyer.lastName}`.toLowerCase();
            const key = fullName;
            
            if (fullName.includes(searchTerm)) {
                if (!buyerMap.has(key)) {
                    buyerMap.set(key, {
                        buyer: transaction.buyer,
                        transactions: [],
                        totalNumbers: 0,
                        totalSpent: 0
                    });
                }
                
                const buyerData = buyerMap.get(key);
                buyerData.transactions.push(transaction);
                buyerData.totalNumbers += transaction.numbers.length;
                buyerData.totalSpent += transaction.total;
            }
        });

        const suggestions = Array.from(buyerMap.values()).slice(0, 5);
        
        if (suggestions.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        // Mostrar sugerencias
        suggestionsDiv.innerHTML = suggestions.map(suggestion => `
            <div class="buyer-suggestion" onclick="NumbersManager.selectExistingBuyer('${suggestion.buyer.name}', '${suggestion.buyer.lastName}')">
                <div class="buyer-name">${suggestion.buyer.name} ${suggestion.buyer.lastName}</div>
                <div class="buyer-details">
                    ${suggestion.buyer.phone} • ${suggestion.totalNumbers} números • ${Utils.formatPrice(suggestion.totalSpent)}
                </div>
            </div>
        `).join('');
        
        suggestionsDiv.style.display = 'block';
    },

    /**
     * Migrar estructura de datos de compradores (compatibilidad hacia atrás)
     */
    migrateBuyerData: function(buyer) {
        // Si ya tiene membershipArea, no hacer nada
        if (buyer.membershipArea) {
            return buyer;
        }
        
        // Convertir estructura antigua a nueva
        if (buyer.isMember === 'si' && buyer.memberActivities) {
            // Mapear actividades antiguas a nuevas áreas
            const activityToArea = {
                'remo': 'remo',
                'ecologia': 'ecologia', 
                'nautica': 'nautica',
                'pesca': 'pesca',
                'multiple': 'ninguna', // Múltiples actividades -> Sin área específica
                'ninguna': 'ninguna'
            };
            
            buyer.membershipArea = activityToArea[buyer.memberActivities] || 'ninguna';
        } else if (buyer.isMember === 'no') {
            buyer.membershipArea = 'no_socio';
        } else {
            buyer.membershipArea = 'no_socio'; // Por defecto
        }
        
        // Mantener campos antiguos para compatibilidad pero usar el nuevo
        return buyer;
    },
    /**
     * Seleccionar comprador existente
     */
    selectExistingBuyer: function(name, lastName) {
        // Buscar los datos más recientes del comprador
        const buyerTransactions = [...AppState.sales, ...AppState.reservations].filter(t => 
            t.buyer.name.toLowerCase() === name.toLowerCase() && 
            t.buyer.lastName.toLowerCase() === lastName.toLowerCase()
        ).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        if (buyerTransactions.length > 0) {
            const latestBuyer = this.migrateBuyerData(buyerTransactions[0].buyer);
            AppState.selectedBuyer = latestBuyer;
            
            // Llenar formulario con datos existentes
            document.getElementById('buyerName').value = latestBuyer.name;
            document.getElementById('buyerLastName').value = latestBuyer.lastName;
            document.getElementById('buyerPhone').value = latestBuyer.phone;
            document.getElementById('buyerEmail').value = latestBuyer.email || '';
            document.getElementById('buyerInstagram').value = latestBuyer.instagram || '';
            document.getElementById('membershipArea').value = latestBuyer.membershipArea || '';
            
            // Mostrar consolidación de compras
            this.showBuyerConsolidation(buyerTransactions);
        }
        
        this.clearSuggestions();
    },

    /**
     * Limpiar sugerencias
     */
    clearSuggestions: function() {
        setTimeout(() => {
            document.getElementById('buyerSuggestions').style.display = 'none';
        }, 200);
    },

    /**
     * Mostrar consolidación de compras del comprador
     */
    showBuyerConsolidation: function(transactions) {
        const totalNumbers = transactions.reduce((sum, t) => sum + t.numbers.length, 0);
        const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);
        const allNumbers = transactions.flatMap(t => t.numbers).sort((a, b) => a - b);
        
        // Remover consolidación anterior si existe
        const existingConsolidation = document.querySelector('.buyer-consolidation');
        if (existingConsolidation) {
            existingConsolidation.remove();
        }
        
        const consolidationHtml = `
            <div class="buyer-consolidation">
                <h4>📋 Historial de Compras</h4>
                <div class="buyer-stats">
                    <span><strong>${transactions.length}</strong> compras</span>
                    <span><strong>${totalNumbers}</strong> números</span>
                    <span><strong>${Utils.formatPrice(totalSpent)}</strong> total</span>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    Números anteriores: ${allNumbers.map(n => Utils.formatNumber(n)).join(', ')}
                </div>
            </div>
        `;
        
        // Insertar después del campo de email
        const emailGroup = document.getElementById('buyerEmail').closest('.form-group');
        emailGroup.insertAdjacentHTML('afterend', consolidationHtml);
    },

    /**
     * Completar compra o reserva
     */
    completePurchase: async function(paymentMethod = null) {
        const buyerData = {
            name: Utils.sanitizeInput(document.getElementById('buyerName').value),
            lastName: Utils.sanitizeInput(document.getElementById('buyerLastName').value),
            phone: Utils.sanitizeInput(document.getElementById('buyerPhone').value),
            email: Utils.sanitizeInput(document.getElementById('buyerEmail').value),
            instagram: Utils.sanitizeInput(document.getElementById('buyerInstagram').value),
            membershipArea: document.getElementById('membershipArea').value
        };

        const errors = Utils.validateBuyerData(buyerData);
        if (errors.length > 0) {
            Utils.showNotification(errors[0], 'error');
            return;
        }

        // Si se especificó método de pago, proceder con la compra
        if (paymentMethod) {
            // Mostrar info de transferencia si es necesario
            if (paymentMethod === 'transferencia') {
                document.getElementById('transferInfo').style.display = 'block';
                // Dar tiempo para que el usuario vea la información
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            await this.createSale(buyerData, paymentMethod);
        } else {
            // Si no hay método de pago, es una reserva
            await this.createReservation(buyerData);
        }
    },

    /**
     * Crear reserva
     */
    createReservation: async function(buyerData) {
        const expirationDate = DateUtils.createExpirationDate(AppState.raffleConfig.reservationTime);

        const reservation = {
            id: Utils.generateId(),
            numbers: [...AppState.selectedNumbers],
            buyer: buyerData,
            total: AppState.selectedNumbers.length * AppState.raffleConfig.price,
            status: 'active',
            createdAt: new Date(),
            expiresAt: expirationDate
        };

        try {
            // Guardar SOLO en Supabase
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.saveReservation(reservation);
                console.log('✅ [RESERVA] Guardada exitosamente en Supabase');
                // ✅ CORREGIDO: NO agregar acá - supabase.js ya lo hace
                // AppState.reservations.push(reservation); // ❌ Evitar duplicación
            } else {
                // Si no hay Supabase, guardar en localStorage como único fallback
                AppState.reservations.push(reservation);
                await autoSave();
                console.log('📱 [RESERVA] Guardada en localStorage (modo fallback)');
            }
        } catch (error) {
            console.error('❌ [RESERVA] Error guardando:', error);
            Utils.showNotification('Error guardando la reserva. Inténtalo de nuevo.', 'error');
            return;
        }

        // Marcar números como reservados
        AppState.selectedNumbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('selected');
                button.classList.add('reserved');
            }
        });

        const numbersFormatted = AppState.selectedNumbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = this.generateReservationMessage(reservation, numbersFormatted);
        
        AppState.selectedNumbers = [];
        this.updateSelectionSummary();
        if (AdminManager.updateInterface) AdminManager.updateInterface();
        
        // Mostrar confirmación ANTES de cerrar el modal
        this.showReservationConfirmation(reservation, whatsappMessage);
        
        // Cerrar modal después de un delay para que se vea la confirmación
        setTimeout(() => {
            this.closePurchaseModal();
        }, 500);
    },

    /**
     * Crear venta
     */
    createSale: async function(buyerData, paymentMethod) {
        const status = paymentMethod === 'transferencia' ? 'pending' : 'paid';

        const sale = {
            id: Utils.generateId(),
            numbers: [...AppState.selectedNumbers],
            buyer: buyerData,
            paymentMethod,
            total: AppState.selectedNumbers.length * AppState.raffleConfig.price,
            status,
            date: new Date()
        };

        try {
            // Guardar SOLO en Supabase
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                await window.SupabaseManager.saveSale(sale);
                console.log('✅ [VENTA] Guardada exitosamente en Supabase');
                // ✅ CORREGIDO: NO agregar acá - supabase.js ya lo hace
                // AppState.sales.push(sale); // ❌ Evitar duplicación
            } else {
                // Si no hay Supabase, guardar en localStorage como único fallback
                AppState.sales.push(sale);
                await autoSave();
                console.log('📱 [VENTA] Guardada en localStorage (modo fallback)');
            }
        } catch (error) {
            console.error('❌ [VENTA] Error guardando:', error);
            Utils.showNotification('Error guardando la venta. Inténtalo de nuevo.', 'error');
            return;
        }

        // Marcar números como vendidos
        AppState.selectedNumbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('selected');
                button.classList.add('sold');
            }
        });

        const numbersFormatted = AppState.selectedNumbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = this.generateSimpleWhatsAppMessage(sale, numbersFormatted);
        
        AppState.selectedNumbers = [];
        this.updateSelectionSummary();
        this.updateDisplay();
        if (AdminManager.updateInterface) AdminManager.updateInterface();
        
        // Mostrar confirmación ANTES de cerrar el modal
        this.showPurchaseConfirmation(sale, whatsappMessage);
        
        // Cerrar modal después de un delay para que se vea la confirmación
        setTimeout(() => {
            this.closePurchaseModal();
        }, 500);
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
     * Generar mensaje de reserva mejorado
     */
    generateReservationMessage: function(reservation, numbersFormatted) {
        const expirationDate = reservation.expiresAt;
        
        let message = `🎉 ¡Hola ${reservation.buyer.name}! Confirmación de reserva\n\n`;
        message += `⏰ *RESERVA CONFIRMADA*\n\n`;
        message += `🎟️ *${AppState.raffleConfig.name}*\n`;
        message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n`;
        if (AppState.raffleConfig.drawDate) {
            message += `🏗️ *Sorteo:* ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n`;
        }
        message += `\n🔢 *Tus números reservados:* ${numbersFormatted}\n`;
        message += `💰 *Total a pagar:* ${Utils.formatPrice(reservation.total)}\n`;
        
        if (reservation.buyer.instagram && reservation.buyer.instagram !== '') {
            message += `📷 *Instagram:* ${reservation.buyer.instagram}\n`;
        }
        
        message += `⏰ *Vence:* ${Utils.formatDateTime(expirationDate)}\n\n`;
        
        // ✅ MENSAJE CLARO: Cliente debe contactar al administrador
        message += `📞 *PARA CONFIRMAR TU COMPRA:*\n`;
        message += `Envíanos un mensaje a este mismo número: *${AppState.raffleConfig.whatsappNumber}*\n\n`;
        message += `💵 *Opciones de pago:*\n`;
        message += `• Efectivo (coordinamos encuentro)\n`;
        message += `• Transferencia bancaria\n\n`;
        message += `⚠️ *IMPORTANTE:* Tienes hasta *${Utils.formatDateTime(expirationDate)}* para confirmar\n`;
        message += `Si no confirmas, los números quedan disponibles nuevamente.\n\n`;
        
        // Agregar Instagram del club si está configurado
        if (AppState.raffleConfig.clubInstagram) {
            message += `📱 *Síguenos en Instagram:* ${AppState.raffleConfig.clubInstagram}\n\n`;
        }
        
        message += `¡Gracias por tu reserva! 🍀⛵`;
        
        return message;
    },

    /**
     * Generar mensaje de WhatsApp
     */
    generateWhatsAppMessage: function(sale, numbersFormatted) {
        const statusText = sale.status === 'pending' ? 
            '*COMPRA REGISTRADA - PAGO PENDIENTE*' : 
            '*COMPRA CONFIRMADA*';
        
        let message = `🎉 ¡Hola ${sale.buyer.name}!\n\n`;
        message += `${statusText}\n\n`;
        message += `🎟️ *${AppState.raffleConfig.name}*\n`;
        message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n`;
        if (AppState.raffleConfig.drawDate) {
            message += `🏗️ *Sorteo:* ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n`;
        }
        message += `\n🔢 *Tus números:* ${numbersFormatted}\n`;
        message += `💰 *Total:* ${Utils.formatPrice(sale.total)}\n`;
        message += `💳 *Método de pago:* ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}\n`;
        
        if (sale.buyer.instagram && sale.buyer.instagram !== '') {
            message += `📷 *Instagram:* ${sale.buyer.instagram}\n`;
        }
        
        if (sale.buyer.membershipArea && sale.buyer.membershipArea !== '') {
            message += `🏠 *Relación con el club:* ${AppConstants.MEMBERSHIP_LABELS[sale.buyer.membershipArea]}\n`;
        }
        
        message += `📅 *Fecha:* ${Utils.formatDateTime(sale.date)}\n\n`;
        
        if (sale.status === 'pending') {
            message += `🏦 *Datos para transferir:*\n`;
            message += `• Alias: PAMPERO.RIFA\n`;
            message += `• CBU: 0000003100010000000001\n`;
            message += `• Titular: ${AppState.raffleConfig.organization}\n\n`;
            message += `📲 *Envía el comprobante de transferencia al ${AppState.raffleConfig.whatsappNumber} para confirmar tu compra.*\n\n`;
        }
        
        // Agregar Instagram del club si está configurado
        if (AppState.raffleConfig.clubInstagram) {
            message += `📱 *Síguenos en Instagram para novedades sobre navegación:* ${AppState.raffleConfig.clubInstagram}\n\n`;
        }
        
        message += `¡Gracias por participar!`;
        
        return message;
    },

    /**
     * Mostrar confirmación de reserva
     */
    showReservationConfirmation: function(reservation, whatsappMessage) {
        const numbersFormatted = reservation.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const expirationDate = reservation.expiresAt;
        
        const confirmationHtml = `
            <div class="confirmation-modal" id="confirmationModal">
                <div class="confirmation-content">
                    <div class="success-icon">⏰</div>
                    <h3>Números Reservados</h3>
                    <p><strong>Números:</strong> ${numbersFormatted}</p>
                    <p><strong>Total:</strong> ${Utils.formatPrice(reservation.total)}</p>
                    <p style="color: #856404;"><strong>⏰ Vence: ${Utils.formatDateTime(expirationDate)}</strong></p>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Enviar notificación al cliente:</strong></p>
                        <a href="https://wa.me/${this.formatPhoneForWhatsApp(reservation.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                           class="whatsapp-btn" target="_blank">
                           📱 Notificar a ${reservation.buyer.name}
                        </a>
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
                        <strong>📋 Próximos pasos:</strong><br>
                        1. El cliente se comunicará para confirmar<br>
                        2. Tú decides si cobra en efectivo o transferencia<br>
                        3. Confirmas la reserva desde el panel de admin
                    </div>
                    
                    <button class="btn btn-secondary" onclick="NumbersManager.closeConfirmationModal()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
    },

    /**
     * Mostrar confirmación de compra
     */
    showPurchaseConfirmation: function(sale, whatsappMessage) {
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        
        const confirmationHtml = `
            <div class="confirmation-modal" id="confirmationModal">
                <div class="confirmation-content">
                    <div class="success-icon">✅</div>
                    <h3>${sale.status === 'pending' ? 'Compra Registrada' : 'Compra Confirmada'}</h3>
                    <p><strong>Números:</strong> ${numbersFormatted}</p>
                    <p><strong>Total:</strong> ${Utils.formatPrice(sale.total)}</p>
                    
                    ${sale.status === 'pending' ? 
                        '<p style="color: #856404;"><strong>⏳ Pago pendiente por transferencia</strong></p>' : 
                        '<p style="color: #4CAF50;"><strong>✅ Pago confirmado</strong></p>'
                    }
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Enviar confirmación al cliente:</strong></p>
                        <a href="https://wa.me/${this.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                           class="whatsapp-btn" target="_blank">
                           📱 Confirmar a ${sale.buyer.name}
                        </a>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="NumbersManager.closeConfirmationModal()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
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
    }
};

console.log('✅ Numbers.js cargado correctamente');