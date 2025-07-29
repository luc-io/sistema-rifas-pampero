/**
 * GESTIÓN DE VENTAS - Sistema de Rifas Pampero
 * Módulo especializado en operaciones sobre ventas
 */

window.AdminSales = {
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
            
            const icons = AdminStats.getIcons();
            
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
                ${sale.buyer.instagram ? `<div>📷 ${sale.buyer.instagram}</div>` : ''}
                ${sale.buyer.membershipArea ? `<div>🏠 ${sale.buyer.membershipArea}</div>` : ''}
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
                        `<button class="btn btn-small" onclick="AdminSales.markAsPaid('${sale.id}')">✅ Marcar Pagado</button>` : ''
                    }
                    <button class="btn btn-secondary btn-small" onclick="AdminSales.deleteSale('${sale.id}')">🗑️ Eliminar</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminSales.sendWhatsAppConfirmation('${sale.id}')">📱 Reenviar WhatsApp</button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Marcar pago como confirmado
     */
    markAsPaid: async function(saleId) {
        console.log(`🔍 [SALES] Intentando marcar como pagado - Sale ID: ${saleId}`);
        
        const sale = AppState.sales.find(s => s.id == saleId);
        if (!sale) {
            console.error(`❌ [SALES] Venta ${saleId} no encontrada en memoria local`);
            Utils.showNotification('Venta no encontrada', 'error');
            return;
        }
        
        try {
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                const success = await window.SupabaseManager.markSaleAsPaid(saleId);
                if (success) {
                    sale.status = 'paid';
                    AdminManager.updateInterface();
                    Utils.showNotification('Pago marcado como confirmado', 'success');
                } else {
                    Utils.showNotification('Error actualizando el pago en Supabase', 'error');
                }
            } else {
                sale.status = 'paid';
                await autoSave();
                AdminManager.updateInterface();
                Utils.showNotification('Pago marcado como confirmado (localStorage)', 'success');
            }
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

console.log('✅ AdminSales cargado correctamente');