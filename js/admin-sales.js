/**
 * GESTIÓN DE VENTAS - Sistema de Rifas Pampero
 * Módulo especializado en operaciones sobre ventas
 * ACTUALIZADO: Iconos para métodos de pago y estados
 */

window.AdminSales = {
    /**
     * ✅ NUEVA FUNCIÓN: Obtener icono según método de pago y estado
     */
    getPaymentIcon: function(paymentMethod, status) {
        const icons = {
            'efectivo': {
                'paid': '💰',
                'pending': '🕐'
            },
            'transferencia': {
                'paid': '💳',
                'pending': '⏳'
            }
        };
        
        return icons[paymentMethod]?.[status] || '💸';
    },

    /**
     * ✅ NUEVA FUNCIÓN: Obtener clase CSS para icono de pago
     */
    getPaymentIconClass: function(paymentMethod, status) {
        if (paymentMethod === 'efectivo') {
            return 'payment-icon efectivo';
        } else if (paymentMethod === 'transferencia') {
            return status === 'paid' ? 'payment-icon transferencia-paid' : 'payment-icon transferencia-pending';
        }
        return 'payment-icon';
    },

    /**
     * ✅ NUEVA FUNCIÓN: Obtener descripción completa del estado de pago
     */
    getPaymentStatusDescription: function(paymentMethod, status) {
        const descriptions = {
            'efectivo': {
                'paid': 'Efectivo - Cobrado',
                'pending': 'Efectivo - Pendiente'
            },
            'transferencia': {
                'paid': 'Transferencia - Confirmada',
                'pending': 'Transferencia - Pendiente'
            }
        };
        
        return descriptions[paymentMethod]?.[status] || `${paymentMethod} - ${status}`;
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
        const uniqueBuyers = AdminStats.getUniqueBuyers();
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
            
            // ✅ NUEVO: Obtener icono y descripción de pago
            const paymentIcon = this.getPaymentIcon(sale.paymentMethod, sale.status);
            const paymentIconClass = this.getPaymentIconClass(sale.paymentMethod, sale.status);
            const paymentDescription = this.getPaymentStatusDescription(sale.paymentMethod, sale.status);
            const statusIcon = sale.status === 'paid' ? '✅' : '⏳';
            
            return `
            <div class="sale-item${isRepeatBuyer ? ' repeat-buyer' : ''}">
                <div class="sale-header">
                    <strong>${sale.buyer.name} ${sale.buyer.lastName}</strong>
                    ${isRepeatBuyer ? `<span class="repeat-badge">🎆 ${purchaseCount}x compras</span>` : ''}
                    <span class="payment-status ${sale.status}">
                        <span class="status-icon ${sale.status}">${statusIcon}</span>
                        ${sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                </div>
                <div>📞 ${sale.buyer.phone}</div>
                ${sale.buyer.email ? `<div>📧 ${sale.buyer.email}</div>` : ''}
                ${sale.buyer.instagram ? `<div>📷 ${sale.buyer.instagram}</div>` : ''}
                ${sale.buyer.membershipArea ? `
                    <div>🏠 ${AppConstants.MEMBERSHIP_LABELS[sale.buyer.membershipArea] || sale.buyer.membershipArea}</div>
                ` : ''}
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number">${num}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="${paymentIconClass}" title="${paymentDescription}">${paymentIcon}</span>
                        <span style="font-size: 14px; color: #666;">${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}</span>
                    </div>
                    <strong style="color: ${sale.status === 'paid' ? '#4CAF50' : '#ff9800'};">${Utils.formatPrice(sale.total)}</strong>
                </div>
                <div style="font-size: 12px; color: #6c757d; margin: 5px 0;">
                    📅 ${Utils.formatDateTime(sale.date)}
                </div>
                <div class="admin-actions">
                    ${sale.status === 'pending' ? 
                        `<button class="btn btn-small btn-purchase" onclick="AdminSales.markAsPaid('${sale.id}')">✅ Marcar Pagado</button>` : ''
                    }
                    <button class="btn btn-secondary btn-small" onclick="AdminSales.deleteSale('${sale.id}')">🗑️ Eliminar</button>
                    <button class="btn btn-info btn-small" onclick="AdminSales.sendWhatsAppConfirmation('${sale.id}')">📱 Reenviar WhatsApp</button>
                    ${sale.status === 'pending' && sale.paymentMethod === 'transferencia' ? 
                        `<button class="btn btn-warning btn-small" onclick="AdminSales.showTransferInfo('${sale.id}')">💳 Ver Datos Transferencia</button>` : ''
                    }
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * ✅ NUEVA FUNCIÓN: Mostrar información de transferencia
     */
    showTransferInfo: function(saleId) {
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }

        const modalHtml = `
            <div id="transferInfoModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>💳 Datos para Transferencia</h3>
                        <span class="modal-close" onclick="AdminSales.closeTransferInfoModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="transfer-info-section">
                            <div class="info-subsection">
                                <h5>👤 Cliente</h5>
                                <p><strong>${sale.buyer.name} ${sale.buyer.lastName}</strong></p>
                                <p>📞 ${sale.buyer.phone}</p>
                                <p>💰 Total a cobrar: <strong style="color: #4CAF50;">${Utils.formatPrice(sale.total)}</strong></p>
                            </div>

                            <div class="info-subsection">
                                <h5>🏦 Datos de Cuenta</h5>
                                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                                    <p><strong>Mercado Pago:</strong></p>
                                    <p><strong>Alias:</strong> pnberosario.mp</p>
                                    <p><strong>CVU:</strong> 000000310003262395392</p>
                                    <p><strong>Titular:</strong> Fernando Ernesto Maumus</p>
                                    <p><strong>CUIT:</strong> 20239282564</p>
                                </div>
                            </div>

                            <div class="info-subsection">
                                <h5>📝 Instrucciones</h5>
                                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                                    <p style="margin-bottom: 10px;"><strong>Concepto de la transferencia:</strong></p>
                                    <p style="background: white; padding: 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">"Rifa Náutica"</p>
                                    <p style="margin-top: 10px; font-size: 14px;">El cliente debe enviar el comprobante por WhatsApp para confirmar el pago.</p>
                                </div>
                            </div>

                            <div class="transfer-actions" style="margin-top: 25px; display: grid; gap: 10px;">
                                <button class="btn btn-info" onclick="AdminSales.sendTransferDataToClient('${sale.id}')">
                                    📱 Enviar Datos al Cliente
                                </button>
                                <button class="btn btn-purchase" onclick="AdminSales.markAsPaid('${sale.id}'); AdminSales.closeTransferInfoModal();">
                                    ✅ Marcar como Pagado
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * ✅ NUEVA FUNCIÓN: Cerrar modal de información de transferencia
     */
    closeTransferInfoModal: function() {
        const modal = document.getElementById('transferInfoModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * ✅ NUEVA FUNCIÓN: Enviar datos de transferencia al cliente
     */
    sendTransferDataToClient: function(saleId) {
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }

        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        
        const transferMessage = `🎟️ *DATOS PARA TRANSFERENCIA - RIFA NÁUTICA*\n\n` +
            `Hola ${sale.buyer.name}! 👋\n\n` +
            `Aquí tienes los datos para realizar la transferencia de tus números: ${numbersFormatted}\n\n` +
            `💰 *Total a pagar:* ${Utils.formatPrice(sale.total)}\n\n` +
            `🏦 *DATOS DE MERCADO PAGO:*\n` +
            `• Alias: pnberosario.mp\n` +
            `• CVU: 000000310003262395392\n` +
            `• Titular: Fernando Ernesto Maumus\n` +
            `• CUIT: 20239282564\n\n` +
            `📝 *IMPORTANTE:*\n` +
            `• En el concepto/descripción poné: "Rifa Náutica"\n` +
            `• Enviá el comprobante a este WhatsApp para confirmar tu compra\n\n` +
            `¡Gracias por participar! ⛵`;

        const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(transferMessage)}`;
        window.open(whatsappUrl, '_blank');
        
        Utils.showNotification('WhatsApp abierto con datos de transferencia', 'success');
    },

    /**
     * Marcar pago como confirmado - CORREGIDO
     */
    markAsPaid: async function(saleId) {
        console.log(`🔍 [SALES] Intentando marcar como pagado - Sale ID: ${saleId}`);
        
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            console.error(`❌ [SALES] Venta ${saleId} no encontrada en memoria local`);
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        if (sale.status === 'paid') {
            Utils.showNotification('Esta venta ya está marcada como pagada', 'warning');
            return;
        }
        
        try {
            // 1. Actualizar en Supabase primero
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.markSaleAsPaid(saleId);
                if (!success) {
                    Utils.showNotification('Error actualizando el pago en Supabase', 'error');
                    return;
                }
                console.log('✅ [SALES] Venta actualizada en Supabase');
            }
            
            // 2. Actualizar estado local SIEMPRE
            sale.status = 'paid';
            sale.paid_at = new Date(); // Agregar timestamp de pago
            
            // 3. Actualizar números en UI si no están marcados como vendidos
            if (sale.numbers && sale.numbers.length > 0) {
                sale.numbers.forEach(number => {
                    const button = document.getElementById(`number-${number}`);
                    if (button && !button.classList.contains('sold')) {
                        button.classList.remove('reserved', 'available');
                        button.classList.add('sold');
                    }
                });
            }
            
            // 4. Guardar en localStorage y actualizar toda la interfaz
            await autoSave();
            AdminManager.updateInterface();
            if (NumbersManager.updateDisplay) NumbersManager.updateDisplay();
            if (ReportsManager.updateReports) ReportsManager.updateReports();
            
            Utils.showNotification('✅ Pago marcado como confirmado', 'success');
            console.log(`✅ [SALES] Venta ${saleId} marcada como pagada exitosamente`);
            
        } catch (error) {
            console.error('❌ [SALES] Error marcando pago:', error);
            Utils.showNotification('Error actualizando el pago', 'error');
        }
    },

    /**
     * Eliminar venta
     */
    deleteSale: async function(saleId) {
        console.log(`🔍 [SALES] Intentando eliminar venta ID: ${saleId}`);
        
        if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
        
        const saleIndex = AppState.sales.findIndex(s => s.id == saleId);
        if (saleIndex === -1) {
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        const sale = AppState.sales[saleIndex];
        
        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.deleteSale(saleId);
                if (success) {
                    // Liberar números en UI
                    this.freeNumbersInUI(sale.numbers);
                    
                    AppState.sales.splice(saleIndex, 1);
                    AdminManager.updateInterface();
                    Utils.showNotification('Venta eliminada correctamente', 'success');
                } else {
                    Utils.showNotification('Error eliminando la venta de Supabase', 'error');
                }
            } else {
                // Liberar números en UI
                this.freeNumbersInUI(sale.numbers);
                
                AppState.sales.splice(saleIndex, 1);
                await autoSave();
                AdminManager.updateInterface();
                Utils.showNotification('Venta eliminada correctamente (localStorage)', 'success');
            }
        } catch (error) {
            console.error('❌ [SALES] Error eliminando venta:', error);
            Utils.showNotification('Error eliminando la venta', 'error');
        }
    },

    /**
     * Liberar números en la interfaz de usuario
     */
    freeNumbersInUI: function(numbers) {
        numbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('sold');
                button.classList.add('available');
            }
        });
    },

    /**
     * Reenviar confirmación por WhatsApp
     */
    sendWhatsAppConfirmation: function(saleId) {
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
        
        const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
        
        Utils.showNotification('WhatsApp abierto para enviar confirmación', 'info');
    },

    /**
     * Filtrar ventas
     */
    filterSales: function() {
        const searchTerm = document.getElementById('searchBox')?.value.toLowerCase();
        if (!searchTerm) {
            // Si no hay término de búsqueda, mostrar todas las ventas
            const salesItems = document.querySelectorAll('#salesList .sale-item');
            salesItems.forEach(item => {
                item.style.display = 'block';
            });
            return;
        }

        const salesItems = document.querySelectorAll('#salesList .sale-item');
        let visibleCount = 0;

        salesItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            item.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });

        // Mostrar contador de resultados
        const searchBox = document.getElementById('searchBox');
        if (searchBox && visibleCount === 0) {
            Utils.showNotification(`No se encontraron ventas que coincidan con "${searchTerm}"`, 'info');
        }
    },

    /**
     * Exportar datos de ventas
     */
    exportSalesData: function() {
        if (AppState.sales.length === 0) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }

        let csvContent = "Nombre,Apellido,Teléfono,Email,Instagram,Área_Membresía,Números,Total,Método_Pago,Estado,Fecha\n";
        
        AppState.sales.forEach(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(';');
            
            const row = [
                `"${sale.buyer.name}"`,
                `"${sale.buyer.lastName}"`,
                `"${sale.buyer.phone}"`,
                `"${sale.buyer.email || ''}"`,
                `"${sale.buyer.instagram || ''}"`,
                `"${sale.buyer.membershipArea || 'No especificado'}"`,
                `"${numbersFormatted}"`,
                `"${sale.total}"`,
                `"${AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod}"`,
                `"${sale.status}"`,
                `"${Utils.formatDateTime(sale.date)}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `ventas_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification('Datos de ventas exportados correctamente', 'success');
    },

    /**
     * Obtener estadísticas rápidas de ventas
     */
    getQuickStats: function() {
        const stats = AdminStats.calculateMainStats();
        if (!stats) return null;

        const analysis = AdminStats.getSalesAnalysis();
        
        return {
            totalSales: AppState.sales.length,
            totalNumbers: stats.numbers.sold,
            totalRevenue: stats.revenue.confirmed,
            pendingRevenue: stats.revenue.pending,
            todayNumbers: analysis.today.numbers,
            uniqueBuyers: stats.buyers.unique,
            averagePerSale: AppState.sales.length > 0 ? (stats.numbers.sold / AppState.sales.length).toFixed(1) : 0
        };
    },

    /**
     * Validar venta antes de operaciones
     */
    validateSale: function(saleId) {
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            return { isValid: false, message: 'Venta no encontrada' };
        }

        // Verificar si tiene números asignados
        if (!sale.numbers || sale.numbers.length === 0) {
            return { isValid: false, message: 'Venta sin números asignados' };
        }

        // Verificar integridad de números
        const validation = AdminValidation.validateNumbersNotSold(sale.numbers);
        if (!validation.isValid && sale.status === 'paid') {
            return { 
                isValid: false, 
                message: `Venta con números duplicados: ${validation.duplicates.join(', ')}` 
            };
        }

        return { isValid: true, message: 'Venta válida' };
    }
};

console.log('✅ AdminSales actualizado cargado correctamente');