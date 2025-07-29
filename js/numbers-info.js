/**
 * INFORMACIÓN DE NÚMEROS - Sistema de Rifas Pampero
 * Maneja la visualización de información de números y modales informativos
 */

window.NumbersInfo = {
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
                                <small>El responsable puede cambiar el titular haciendo tap sobre el número</small>
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
            actions += `
                <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(info.buyer.phone)}" 
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
            actions += `
                <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(info.seller.phone)}" 
                   class="btn btn-success" target="_blank" style="background: #25d366;">
                   📱 Contactar Vendedor
                </a>
            `;
            
            if (info.owner && info.owner.phone) {
                actions += `
                    <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(info.owner.phone)}" 
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
    }
};

console.log('✅ numbers-info.js cargado correctamente');
