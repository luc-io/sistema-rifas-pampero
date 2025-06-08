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
            button.onclick = () => this.toggleNumber(i);
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
     * Alternar selección de número
     */
    toggleNumber: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Verificar si el número ya está vendido o reservado por otro
        if (button.classList.contains('sold')) {
            return;
        }
        
        if (button.classList.contains('reserved')) {
            // Verificar si la reserva está expirada
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
        
        let message = `⏰ *NÚMEROS RESERVADOS*\n\n`;
        message += `🎟️ *${AppState.raffleConfig.name}*\n`;
        message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n\n`;
        message += `👤 *Reservado por:* ${reservation.buyer.name} ${reservation.buyer.lastName}\n`;
        message += `📱 *Teléfono:* ${reservation.buyer.phone}\n`;
        message += `🔢 *Números reservados:* ${numbersFormatted}\n`;
        message += `💰 *Total a pagar:* ${Utils.formatPrice(reservation.total)}\n`;
        
        if (reservation.buyer.instagram && reservation.buyer.instagram !== '') {
            message += `📷 *Instagram:* ${reservation.buyer.instagram}\n`;
        }
        
        message += `⏰ *Vence:* ${Utils.formatDateTime(expirationDate)}\n\n`;
        
        // ✅ NUEVO MENSAJE CLARO PARA EL CLIENTE
        message += `📞 *Para confirmar tu compra, comunícate al ${AppState.raffleConfig.whatsappNumber}*\n\n`;
        message += `💡 *El administrador confirmará tu reserva como:*\n`;
        message += `• 💵 Pago en efectivo\n`;
        message += `• 🏦 Pago por transferencia\n\n`;
        message += `⚠️ *Importante:* Si no confirmas antes del vencimiento, los números quedarán disponibles nuevamente.\n\n`;
        
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
        
        let message = `${statusText}\n\n`;
        message += `🎟️ *${AppState.raffleConfig.name}*\n`;
        message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n\n`;
        message += `👤 *Comprador:* ${sale.buyer.name} ${sale.buyer.lastName}\n`;
        message += `📱 *Teléfono:* ${sale.buyer.phone}\n`;
        message += `🔢 *Números:* ${numbersFormatted}\n`;
        message += `💰 *Total:* ${Utils.formatPrice(sale.total)}\n`;
        message += `💳 *Pago:* ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}\n`;
        
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
                        <p><strong>Enviar reserva al cliente:</strong></p>
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

        // Marcar números vendidos
        AppState.sales.forEach(sale => {
            sale.numbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('available', 'reserved');
                    button.classList.add('sold');
                }
            });
        });

        // Marcar números reservados
        AppState.reservations.filter(r => r.status === 'active').forEach(reservation => {
            if (!Utils.isReservationExpired(reservation)) {
                reservation.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button && !button.classList.contains('sold')) {
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