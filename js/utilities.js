/**
 * UTILIDADES DEL SISTEMA - Sistema de Rifas Pampero
 * Herramientas útiles para gestión con Supabase y diagnóstico del sistema
 * ACTUALIZADO: Funciones completas para la nueva pestaña de utilidades
 */

window.UtilitiesManager = {
    /**
     * Inicializar utilidades
     */
    init: function() {
        // Verificar conexión al inicializar
        setTimeout(() => {
            this.testConnection();
            this.updateQuickStats();
            this.updateGoogleSheetsStatus();
            this.updateSystemSummary();
        }, 1000);
        
        // Actualizar estadísticas cada 30 segundos para mantener datos frescos
        setInterval(() => {
            this.updateQuickStats();
            this.updateSystemSummary();
        }, 30000);
    },

    /**
     * Validar integridad de datos (delegado a AdminValidation)
     */
    validateDataIntegrity: function() {
        if (window.AdminValidation) {
            AdminValidation.validateDataIntegrity(true);
        } else {
            Utils.showNotification('⚠️ Módulo de validación no disponible', 'warning');
        }
    },

    /**
     * Test de conexión con Supabase
     */
    testSupabaseConnection: async function() {
        Utils.showNotification('🔍 Probando conexión con Supabase...', 'info');
        
        if (!window.SupabaseManager || !SupabaseManager.isConnected) {
            Utils.showNotification('❌ Supabase no está conectado', 'error');
            return;
        }

        try {
            // Test función de assignments
            if (window.SupabaseAssignmentsManager && SupabaseAssignmentsManager.testConnection) {
                const result = await SupabaseAssignmentsManager.testConnection();
                if (result) {
                    Utils.showNotification('✅ Conexión con Supabase exitosa', 'success');
                } else {
                    Utils.showNotification('⚠️ Problemas de conexión detectados', 'warning');
                }
            } else {
                Utils.showNotification('⚠️ Función de test no disponible', 'warning');
            }
        } catch (error) {
            console.error('❌ [UTILITIES] Error en test de conexión:', error);
            Utils.showNotification(`❌ Error en test: ${error.message}`, 'error');
        }
    },

    /**
     * Mostrar información del sistema
     */
    showSystemInfo: function() {
        if (window.AdminManager && AdminManager.showSystemInfo) {
            AdminManager.showSystemInfo();
        } else {
            Utils.showNotification('⚠️ Función de información del sistema no disponible', 'warning');
        }
    },

    /**
     * Corregir duplicados
     */
    fixDuplicates: function() {
        if (window.AdminManager && AdminManager.fixDuplicates) {
            AdminManager.fixDuplicates();
        } else {
            Utils.showNotification('⚠️ Función de corrección de duplicados no disponible', 'warning');
        }
    },

    /**
     * Limpiar reservas vencidas
     */
    cleanExpiredReservations: function() {
        if (window.AdminReservations && AdminReservations.cleanExpiredReservations) {
            AdminReservations.cleanExpiredReservations();
        } else {
            Utils.showNotification('⚠️ Función de limpieza de reservas no disponible', 'warning');
        }
    },

    /**
     * Verificar consistencia de datos
     */
    checkDataConsistency: function() {
        if (window.AdminValidation && AdminValidation.checkDataConsistency) {
            const consistency = AdminValidation.checkDataConsistency();
            
            if (consistency.isConsistent) {
                Utils.showNotification('✅ Datos consistentes entre memoria y UI', 'success');
            } else {
                console.warn('⚠️ [UTILITIES] Inconsistencias detectadas:', consistency.inconsistencies);
                Utils.showNotification(
                    `⚠️ Se detectaron ${consistency.inconsistencies.length} inconsistencias. Revisa la consola para detalles.`, 
                    'warning'
                );
            }
        } else {
            Utils.showNotification('⚠️ Función de verificación de consistencia no disponible', 'warning');
        }
    },

    /**
     * Exportar todas las ventas en formato CSV detallado
     */
    exportAllSales: function() {
        if (AppState.sales.length === 0) {
            Utils.showNotification('No hay ventas para exportar', 'warning');
            return;
        }

        // Crear CSV más detallado para ventas
        let csvContent = "ID,Fecha,Nombre,Apellido,Teléfono,Email,Instagram,Relación Club,Números,Cantidad,Total,Método de Pago,Estado\n";
        
        AppState.sales.forEach(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(';');
            const membershipLabel = AppConstants.MEMBERSHIP_LABELS[sale.buyer.membershipArea] || 'No especificado';
            
            const row = [
                sale.id,
                Utils.formatDateTime(sale.date),
                `"${sale.buyer.name}"`,
                `"${sale.buyer.lastName}"`,
                `"${sale.buyer.phone}"`,
                `"${sale.buyer.email || ''}"`,
                `"${sale.buyer.instagram || ''}"`,
                `"${membershipLabel}"`,
                `"${numbersFormatted}"`,
                sale.numbers.length,
                sale.total,
                `"${AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod}"`,
                `"${sale.status}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `ventas_completas_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification(`Exportadas ${AppState.sales.length} ventas correctamente`, 'success');
    },

    /**
     * Exportar base de compradores consolidada
     */
    exportBuyersDatabase: function() {
        if (AppState.sales.length === 0) {
            Utils.showNotification('No hay compradores para exportar', 'warning');
            return;
        }

        // Consolidar compradores únicos
        const buyersMap = new Map();
        AppState.sales.forEach(sale => {
            const key = `${sale.buyer.name.toLowerCase()}_${sale.buyer.lastName.toLowerCase()}_${sale.buyer.phone}`;
            if (!buyersMap.has(key)) {
                buyersMap.set(key, {
                    buyer: sale.buyer,
                    totalPurchases: 0,
                    totalNumbers: 0,
                    totalSpent: 0,
                    firstPurchase: sale.date,
                    lastPurchase: sale.date,
                    allNumbers: []
                });
            }
            const buyerData = buyersMap.get(key);
            buyerData.totalPurchases++;
            buyerData.totalNumbers += sale.numbers.length;
            buyerData.totalSpent += sale.total;
            buyerData.allNumbers.push(...sale.numbers);
            
            // Actualizar fechas
            if (sale.date < buyerData.firstPurchase) buyerData.firstPurchase = sale.date;
            if (sale.date > buyerData.lastPurchase) buyerData.lastPurchase = sale.date;
        });

        const buyersData = Array.from(buyersMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent);

        let csvContent = "Nombre,Apellido,Teléfono,Email,Instagram,Relación Club,Total Compras,Total Números,Total Gastado,Primera Compra,Última Compra,Números Comprados\n";
        
        buyersData.forEach(buyerData => {
            const buyer = buyerData.buyer;
            const membershipLabel = AppConstants.MEMBERSHIP_LABELS[buyer.membershipArea] || 'No especificado';
            const numbersFormatted = buyerData.allNumbers.sort((a, b) => a - b).map(n => Utils.formatNumber(n)).join(';');
            
            const row = [
                `"${buyer.name}"`,
                `"${buyer.lastName}"`,
                `"${buyer.phone}"`,
                `"${buyer.email || ''}"`,
                `"${buyer.instagram || ''}"`,
                `"${membershipLabel}"`,
                buyerData.totalPurchases,
                buyerData.totalNumbers,
                buyerData.totalSpent,
                `"${Utils.formatDateTime(buyerData.firstPurchase)}"`,
                `"${Utils.formatDateTime(buyerData.lastPurchase)}"`,
                `"${numbersFormatted}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `base_compradores_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification(`Exportados ${buyersData.length} compradores únicos`, 'success');
    },

    /**
     * Verificar conexión con Supabase
     */
    testConnection: async function() {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        const details = document.getElementById('connectionDetails');

        if (!indicator || !text || !details) {
            console.warn('⚠️ [UTILITIES] Elementos de UI no encontrados para test de conexión');
            return;
        }

        // Estado verificando
        indicator.style.background = '#ffc107';
        text.textContent = 'Verificando conexión...';
        details.textContent = 'Probando conexión con Supabase...';

        try {
            if (!window.supabaseClient) {
                throw new Error('Cliente de Supabase no inicializado');
            }

            // Test básico de conexión
            const { data, error } = await window.supabaseClient
                .from('raffles')
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116') {
                    // Tabla no existe
                    indicator.style.background = '#ff9800';
                    text.textContent = 'Conexión OK - Configuración incompleta';
                    details.textContent = 'Conectado pero faltan tablas. Ejecuta el SQL de configuración.';
                } else {
                    throw error;
                }
            } else {
                // Conexión exitosa
                indicator.style.background = '#4CAF50';
                text.textContent = 'Conexión exitosa';
                details.textContent = `Conectado correctamente. ${data.length > 0 ? 'Datos encontrados.' : 'Sin datos aún.'}`;
                
                Utils.showNotification('Conexión con Supabase verificada correctamente', 'success');
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            indicator.style.background = '#f44336';
            text.textContent = 'Error de conexión';
            details.textContent = `Error: ${error.message}`;
            
            Utils.showNotification('Error verificando conexión con Supabase', 'error');
        }
    },

    /**
     * Actualizar estadísticas rápidas
     */
    updateQuickStats: function() {
        const container = document.getElementById('quickStats');

        if (!container) {
            console.warn('⚠️ [UTILITIES] Contenedor quickStats no encontrado');
            return;
        }

        if (!AppState.raffleConfig) {
            container.innerHTML = '<div style="font-size: 14px; color: #666;">Configura tu rifa para ver estadísticas</div>';
            return;
        }

        const sales = AppState.sales;
        const totalSales = sales.length;
        const totalNumbers = sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);
        const percentageSold = (totalNumbers / AppState.raffleConfig.totalNumbers * 100);
        const remainingNumbers = AppState.raffleConfig.totalNumbers - totalNumbers;

        // Estadísticas de membresía
        const membershipStats = {};
        sales.forEach(sale => {
            const area = sale.buyer.membershipArea || 'no_especificado';
            membershipStats[area] = (membershipStats[area] || 0) + 1;
        });

        const topMembership = Object.entries(membershipStats)
            .sort((a, b) => b[1] - a[1])[0];

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #4CAF50;">${totalSales}</div>
                    <div style="font-size: 12px; color: #666;">Ventas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #2196F3;">${totalNumbers}</div>
                    <div style="font-size: 12px; color: #666;">Números vendidos</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #ff9800;">${remainingNumbers}</div>
                    <div style="font-size: 12px; color: #666;">Disponibles</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: #9C27B0;">${percentageSold.toFixed(1)}%</div>
                    <div style="font-size: 12px; color: #666;">Completado</div>
                </div>
            </div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">💰 Confirmado:</span>
                    <strong>${Utils.formatPrice(totalRevenue)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">⏳ Pendiente:</span>
                    <strong>${Utils.formatPrice(pendingRevenue)}</strong>
                </div>
                ${topMembership ? `
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 14px;">👥 Mayoría:</span>
                    <strong style="font-size: 12px;">${AppConstants.MEMBERSHIP_LABELS[topMembership[0]] || topMembership[0]} (${topMembership[1]})</strong>
                </div>
                ` : ''}
            </div>
        `;

        Utils.showNotification('Estadísticas actualizadas', 'success');
    },

    /**
     * Actualizar resumen del sistema
     */
    updateSystemSummary: function() {
        const container = document.getElementById('systemSummary');
        if (!container) return;

        if (!AppState.raffleConfig) {
            container.innerHTML = 'Sistema listo para configurar una nueva rifa';
            return;
        }

        const sales = AppState.sales || [];
        const reservations = AppState.reservations || [];
        const assignments = AppState.assignments || [];
        
        const totalSales = sales.length;
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total, 0);
        const activeReservations = reservations.filter(r => r.status === 'active').length;
        const activeAssignments = assignments.filter(a => a.status !== 'cancelled').length;
        
        const supabaseStatus = window.SupabaseManager?.isConnected ? '✅ Conectado' : '❌ Desconectado';

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 11px;">
                <div><strong>📊 Ventas:</strong> ${totalSales}</div>
                <div><strong>💰 Ingresos:</strong> ${Utils.formatPrice(totalRevenue)}</div>
                <div><strong>⏰ Reservas:</strong> ${activeReservations}</div>
                <div><strong>📋 Asignaciones:</strong> ${activeAssignments}</div>
                <div><strong>☁️ Supabase:</strong> ${supabaseStatus}</div>
                <div><strong>📱 Rifa:</strong> ${AppState.raffleConfig.name}</div>
            </div>
        `;
    },
    
    /**
     * Actualizar estado de Google Sheets
     */
    updateGoogleSheetsStatus: function() {
        if (typeof GoogleSheetsManager === 'undefined') {
            return;
        }
        
        const indicator = document.getElementById('sheetsConnectionIndicator');
        const text = document.getElementById('sheetsConnectionText');
        const details = document.getElementById('sheetsConnectionDetails');
        const createBtn = document.getElementById('createSheetsBtn');
        const syncBtn = document.getElementById('syncSheetsBtn');
        
        if (!indicator || !text || !details) return;
        
        const status = GoogleSheetsManager.getStatus();
        
        if (!status.configured) {
            indicator.style.background = '#ccc';
            text.textContent = 'No configurado';
            details.textContent = 'Configura las credenciales de Google Sheets';
            if (createBtn) createBtn.disabled = true;
            if (syncBtn) syncBtn.disabled = true;
        } else if (!status.signedIn) {
            indicator.style.background = '#ffc107';
            text.textContent = 'Configurado - Iniciar sesión';
            details.textContent = 'Credenciales configuradas, inicia sesión para usar';
            if (createBtn) createBtn.disabled = false;
            if (syncBtn) syncBtn.disabled = true;
        } else if (status.signedIn && !status.hasSpreadsheet) {
            indicator.style.background = '#17a2b8';
            text.textContent = 'Conectado - Sin hoja';
            details.textContent = 'Conectado a Google, crea una hoja para sincronizar';
            if (createBtn) createBtn.disabled = false;
            if (syncBtn) syncBtn.disabled = true;
        } else {
            indicator.style.background = '#28a745';
            text.textContent = 'Completamente configurado';
            details.textContent = 'Listo para sincronizar datos con Google Sheets';
            if (createBtn) createBtn.disabled = false;
            if (syncBtn) syncBtn.disabled = false;
        }
    }
};

console.log('✅ Utilities.js actualizado cargado correctamente');