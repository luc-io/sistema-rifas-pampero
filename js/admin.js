/**
 * PANEL DE ADMINISTRACIÓN COORDINADOR - Sistema de Rifas Pampero
 * Módulo principal que coordina todos los submódulos administrativos
 * REFACTORIZADO: Dividido en módulos especializados para mejor mantenibilidad
 */

window.AdminManager = {
    /**
     * Crear interfaz de administración completa
     */
    createInterface: function() {
        if (!AppState.raffleConfig) return;

        const container = document.getElementById('adminContent');
        container.innerHTML = `
            ${this.createStatsSection()}
            ${this.createToolsSection()}
            ${this.createAssignmentsSection()}
            ${this.createReservationsSection()}
            ${this.createSearchSection()}
            ${this.createSalesSection()}
            ${this.createExportSection()}
        `;

        this.updateInterface();
    },

    /**
     * Crear sección de estadísticas
     */
    createStatsSection: function() {
        return `
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
        `;
    },

    /**
     * Crear sección de herramientas de diagnóstico
     */
    createToolsSection: function() {
        return `
            <div class="admin-tools" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4>🔧 Herramientas de Diagnóstico</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0;">
                    <button class="btn btn-secondary" onclick="AdminManager.validateDataIntegrity(true)">🔍 Verificar Integridad</button>
                    <button class="btn btn-secondary" onclick="AdminManager.testSupabaseConnection()">🌐 Test Supabase</button>
                    <button class="btn btn-secondary" onclick="AdminManager.showSystemInfo()">📊 Info del Sistema</button>
                    <button class="btn btn-secondary" onclick="AdminManager.fixDuplicates()">🔧 Corregir Duplicados</button>
                    <button class="btn btn-secondary" onclick="AdminManager.cleanExpiredReservations()">🧹 Limpiar Vencidas</button>
                    <button class="btn btn-secondary" onclick="AdminManager.checkDataConsistency()">🔄 Verificar Consistencia</button>
                </div>
            </div>
        `;
    },

    /**
     * Crear sección de asignaciones
     */
    createAssignmentsSection: function() {
        return `
            <h3>📋 Asignaciones Activas</h3>
            <div class="sales-list" id="assignmentsList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones activas</p>
            </div>
        `;
    },

    /**
     * Crear sección de reservas
     */
    createReservationsSection: function() {
        return `
            <h3>⏰ Reservas Activas</h3>
            <div class="sales-list" id="reservationsList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay reservas activas</p>
            </div>
        `;
    },

    /**
     * Crear sección de búsqueda
     */
    createSearchSection: function() {
        return `
            <h3>🔍 Búsqueda de Ventas</h3>
            <input type="text" class="search-box" id="searchBox" placeholder="Buscar por nombre, teléfono o número..." onkeyup="AdminSales.filterSales()">
        `;
    },

    /**
     * Crear sección de ventas
     */
    createSalesSection: function() {
        return `
            <h3>💰 Lista de Ventas</h3>
            <div class="sales-list" id="salesList">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay ventas registradas aún</p>
            </div>
        `;
    },

    /**
     * Crear sección de exportación
     */
    createExportSection: function() {
        return `
            <div class="export-section" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h4>📊 Exportación de Datos</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 15px 0;">
                    <button class="btn" onclick="AdminSales.exportSalesData()">📄 Exportar Ventas</button>
                    <button class="btn" onclick="AdminReservations.exportReservationsData()">📋 Exportar Reservas</button>
                    <button class="btn" onclick="AdminStats.exportDetailedStats()">📈 Exportar Estadísticas</button>
                    <button class="btn" onclick="AdminManager.exportAllData()">📦 Exportar Todo</button>
                </div>
            </div>
        `;
    },

    /**
     * Actualizar toda la interfaz
     */
    updateInterface: function() {
        if (!AppState.raffleConfig) return;

        // Actualizar estadísticas usando el módulo AdminStats
        AdminStats.updateStatsElements();
        
        // Actualizar listas usando los módulos especializados
        AdminSales.updateSalesList();
        AdminReservations.updateReservationsList();
        this.updateAssignmentsList();
    },

    // ==========================================
    // FUNCIONES DELEGADAS A MÓDULOS ESPECIALIZADOS
    // ==========================================

    /**
     * Validar integridad de datos (delegado a AdminValidation)
     */
    validateDataIntegrity: function(showNotification = false) {
        return AdminValidation.validateDataIntegrity(showNotification);
    },

    /**
     * Corregir duplicados (delegado a AdminValidation)
     */
    fixDuplicates: function() {
        const salesWithDuplicates = AdminValidation.fixDuplicates();
        
        if (salesWithDuplicates.length > 0) {
            this.showDuplicateFixModal(salesWithDuplicates);
        } else {
            Utils.showNotification('✅ No se detectaron números duplicados', 'success');
        }
    },

    /**
     * Verificar consistencia de datos
     */
    checkDataConsistency: function() {
        const consistency = AdminValidation.checkDataConsistency();
        
        if (consistency.isConsistent) {
            Utils.showNotification('✅ Datos consistentes entre memoria y UI', 'success');
        } else {
            console.warn('⚠️ [ADMIN] Inconsistencias detectadas:', consistency.inconsistencies);
            Utils.showNotification(
                `⚠️ Se detectaron ${consistency.inconsistencies.length} inconsistencias. Revisa la consola para detalles.`, 
                'warning'
            );
        }
    },

    /**
     * Limpiar reservas vencidas (delegado a AdminReservations)
     */
    cleanExpiredReservations: function() {
        AdminReservations.cleanExpiredReservations();
    },

    // ==========================================
    // FUNCIONES DE PRUEBA Y DIAGNÓSTICO
    // ==========================================

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
            console.error('❌ [ADMIN] Error en test de conexión:', error);
            Utils.showNotification(`❌ Error en test: ${error.message}`, 'error');
        }
    },

    /**
     * Mostrar información del sistema
     */
    showSystemInfo: function() {
        const validationResults = AdminValidation.runSystemValidations();
        const stats = AdminStats.calculateMainStats();
        const reservationStats = AdminReservations.getReservationsStats();
        
        const info = {
            raffleName: AppState.raffleConfig?.name || 'No configurada',
            totalNumbers: AppState.raffleConfig?.totalNumbers || 0,
            soldNumbers: stats?.numbers.sold || 0,
            totalSales: AppState.sales.length,
            reservations: reservationStats.total,
            assignments: AppState.assignments?.length || 0,
            numberOwners: AppState.numberOwners?.length || 0,
            supabaseConnected: window.SupabaseManager?.isConnected || false,
            lastSave: localStorage.getItem('lastSave') || 'Nunca'
        };

        const modalHtml = `
            <div id="systemInfoModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>📊 Información del Sistema</h3>
                        <span class="modal-close" onclick="AdminManager.closeSystemInfoModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="system-info">
                            <h4>🎯 Rifa Actual</h4>
                            <ul>
                                <li><strong>Nombre:</strong> ${info.raffleName}</li>
                                <li><strong>Total de números:</strong> ${info.totalNumbers}</li>
                                <li><strong>Números vendidos:</strong> ${info.soldNumbers}</li>
                                <li><strong>Disponibles:</strong> ${info.totalNumbers - info.soldNumbers}</li>
                                <li><strong>Porcentaje vendido:</strong> ${stats ? stats.numbers.soldPercentage : 0}%</li>
                            </ul>

                            <h4>📋 Datos del Sistema</h4>
                            <ul>
                                <li><strong>Ventas registradas:</strong> ${info.totalSales}</li>
                                <li><strong>Reservas totales:</strong> ${info.reservations}</li>
                                <li><strong>Reservas activas:</strong> ${reservationStats.active}</li>
                                <li><strong>Asignaciones:</strong> ${info.assignments}</li>
                                <li><strong>Titulares registrados:</strong> ${info.numberOwners}</li>
                            </ul>

                            <h4>🌐 Conexiones</h4>
                            <ul>
                                <li><strong>Supabase:</strong> ${info.supabaseConnected ? '✅ Conectado' : '❌ Desconectado'}</li>
                                <li><strong>Último guardado:</strong> ${info.lastSave}</li>
                                <li><strong>Navegador:</strong> ${navigator.userAgent.split(') ')[0]})</li>
                            </ul>

                            <h4>🔍 Validaciones del Sistema</h4>
                            <div class="validation-results">
                                <div style="margin-bottom: 10px;">
                                    <strong>Estado general:</strong> 
                                    <span style="color: ${validationResults.summary.isSystemHealthy ? '#4CAF50' : '#dc3545'};">
                                        ${validationResults.summary.isSystemHealthy ? '✅ Sistema saludable' : '❌ Problemas detectados'}
                                    </span>
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Integridad de datos:</strong> 
                                    <span style="color: ${validationResults.dataIntegrity.isValid ? '#4CAF50' : '#dc3545'};">
                                        ${validationResults.dataIntegrity.isValid ? '✅ Válida' : `❌ ${validationResults.dataIntegrity.totalDuplicates} duplicados`}
                                    </span>
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Configuración:</strong> 
                                    <span style="color: ${validationResults.raffleConfig.isValid ? '#4CAF50' : '#dc3545'};">
                                        ${validationResults.raffleConfig.isValid ? '✅ Válida' : '❌ Con errores'}
                                    </span>
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Ventas con errores:</strong> ${validationResults.sales.length}
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>Reservas con errores:</strong> ${validationResults.reservations.length}
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer" style="margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="AdminManager.closeSystemInfoModal()">Cerrar</button>
                            <button class="btn btn-primary" onclick="AdminManager.runSystemValidations()">🔄 Actualizar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Ejecutar validaciones del sistema
     */
    runSystemValidations: function() {
        const results = AdminValidation.runSystemValidations();
        
        // Actualizar la información si el modal está abierto
        const modal = document.getElementById('systemInfoModal');
        if (modal) {
            modal.remove();
            this.showSystemInfo();
        }
        
        // Mostrar resumen
        if (results.summary.isSystemHealthy) {
            Utils.showNotification('✅ Sistema validado - Sin problemas detectados', 'success');
        } else {
            Utils.showNotification(
                `⚠️ Se detectaron ${results.summary.totalErrors} errores en el sistema`, 
                'warning'
            );
        }
    },

    /**
     * Cerrar modal de información del sistema
     */
    closeSystemInfoModal: function() {
        const modal = document.getElementById('systemInfoModal');
        if (modal) {
            modal.remove();
        }
    },

    // ==========================================
    // FUNCIONES DE ASIGNACIONES (TEMPORAL)
    // ==========================================

    /**
     * Actualizar lista de asignaciones (función temporal hasta refactorizar)
     */
    updateAssignmentsList: function() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        const activeAssignments = AppState.assignments?.filter(a => a.status !== 'cancelled') || [];

        if (activeAssignments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones activas</p>';
            return;
        }

        container.innerHTML = activeAssignments.map(assignment => {
            const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n));
            const isPending = assignment.status === 'pending';
            const isPaid = assignment.status === 'paid';
            const isOverdue = assignment.payment_deadline && new Date() > new Date(assignment.payment_deadline);

            return `
            <div class="sale-item" style="border-left: 4px solid ${isPaid ? '#4CAF50' : isOverdue ? '#dc3545' : '#ffc107'};">
                <div class="sale-header">
                    <strong>${assignment.seller_name} ${assignment.seller_lastname}</strong>
                    <span class="payment-status ${isPaid ? 'paid' : isPending ? 'pending' : 'overdue'}">
                        ${isPaid ? '✅ Pagado' : isPending ? '⏳ Pendiente' : '⚠️ Vencido'}
                    </span>
                </div>
                <div>📞 ${assignment.seller_phone}</div>
                ${assignment.seller_email ? `<div>📧 ${assignment.seller_email}</div>` : ''}
                <div class="sale-numbers">
                    ${numbersFormatted.map(num => `<span class="sale-number">${num}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span>💰 Total: ${Utils.formatPrice(assignment.total_amount)}</span>
                    <span>📊 ${assignment.numbers.length} números</span>
                </div>
                ${assignment.payment_deadline ? `
                <div style="margin: 8px 0; font-size: 14px; color: ${isOverdue ? '#dc3545' : '#856404'};">
                    ⏰ Límite: ${Utils.formatDateTime(new Date(assignment.payment_deadline))}
                </div>` : ''}
                ${assignment.notes ? `<div style="margin: 8px 0; font-size: 14px; color: #6c757d;">📝 ${assignment.notes}</div>` : ''}
                <div class="admin-actions">
                    ${isPending ? `<button class="btn btn-small" onclick="AdminManager.markAssignmentAsPaid('${assignment.id}')">✅ Marcar Pagado</button>` : ''}
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.changeAssignmentHolder('${assignment.id}')">👥 Cambiar Titular</button>
                    <button class="btn btn-secondary btn-small" onclick="AdminManager.cancelAssignment('${assignment.id}')">❌ Cancelar</button>
                </div>
            </div>
        `;
        }).join('');
    },

    // ==========================================
    // FUNCIONES DE MODALES
    // ==========================================

    /**
     * Mostrar modal para corregir duplicados
     */
    showDuplicateFixModal: function(salesWithDuplicates) {
        const modalHtml = `
            <div id="duplicateFixModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>🔧 Corrección de Números Duplicados</h3>
                        <span class="modal-close" onclick="AdminManager.closeDuplicateFixModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="alert" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #856404; margin-bottom: 10px;">⚠️ Números Duplicados Detectados</h4>
                            <p style="color: #856404; margin: 0;">Se encontraron ${salesWithDuplicates.length} ventas con números duplicados.</p>
                        </div>
                        
                        <div class="duplicate-sales">
                            ${salesWithDuplicates.map((item, index) => `
                                <div class="duplicate-sale" style="border: 1px solid #dc3545; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                    <h5>Venta ${index + 1}: ${item.sale.buyer.name} ${item.sale.buyer.lastName}</h5>
                                    <p><strong>Fecha:</strong> ${Utils.formatDateTime(item.sale.date)}</p>
                                    <p><strong>Números duplicados:</strong> ${item.duplicateNumbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                                    <p><strong>Total de números:</strong> ${item.sale.numbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                                    <p><strong>Total:</strong> ${Utils.formatPrice(item.sale.total)}</p>
                                    
                                    <div style="margin-top: 10px;">
                                        <button class="btn btn-small btn-secondary" onclick="AdminManager.removeDuplicatesFromSale(${item.saleIndex})">
                                            🗑️ Eliminar números duplicados
                                        </button>
                                        <button class="btn btn-small" onclick="AdminSales.deleteSale('${item.sale.id}')">
                                            ❌ Eliminar venta completa
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="modal-footer" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn btn-secondary" onclick="AdminManager.closeDuplicateFixModal()">Cerrar</button>
                            <button class="btn btn-primary" onclick="AdminManager.fixAllDuplicates()">🔧 Corregir Todos</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si hay uno
        const existingModal = document.getElementById('duplicateFixModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Cerrar modal de corrección de duplicados
     */
    closeDuplicateFixModal: function() {
        const modal = document.getElementById('duplicateFixModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Remover duplicados de una venta específica
     */
    removeDuplicatesFromSale: function(saleIndex) {
        const success = AdminValidation.removeDuplicatesFromSale(saleIndex);
        
        if (success) {
            const sale = AppState.sales[saleIndex];
            autoSave();
            this.updateInterface();
            Utils.showNotification(`✅ Duplicados removidos de venta de ${sale.buyer.name}`, 'success');
            
            // Cerrar modal si no hay más duplicados
            const newIntegrity = AdminValidation.validateDataIntegrity();
            if (newIntegrity.isValid) {
                this.closeDuplicateFixModal();
            }
        }
    },

    /**
     * Corregir todos los duplicados automáticamente
     */
    fixAllDuplicates: function() {
        const salesWithDuplicates = AdminValidation.fixDuplicates();
        let fixed = 0;
        
        salesWithDuplicates.forEach(item => {
            const success = AdminValidation.removeDuplicatesFromSale(item.saleIndex);
            if (success) fixed++;
        });
        
        if (fixed > 0) {
            autoSave();
            this.updateInterface();
            Utils.showNotification(`✅ Se corrigieron ${fixed} ventas con duplicados`, 'success');
            this.closeDuplicateFixModal();
        }
    },

    /**
     * Exportar todos los datos del sistema
     */
    exportAllData: function() {
        const timestamp = DateUtils.formatForInput(new Date());
        const raffleName = AppState.raffleConfig.name.replace(/\s+/g, '_');
        
        // Crear archivo ZIP simulado (múltiples descargas)
        Utils.showNotification('📦 Iniciando exportación completa...', 'info');
        
        setTimeout(() => {
            AdminSales.exportSalesData();
            setTimeout(() => {
                AdminReservations.exportReservationsData();
                setTimeout(() => {
                    AdminStats.exportDetailedStats();
                    Utils.showNotification('✅ Exportación completa finalizada', 'success');
                }, 1000);
            }, 1000);
        }, 500);
    },

    // Funciones temporales para mantener compatibilidad (estas deberían ser refactorizadas)
    markAssignmentAsPaid: function(assignmentId) {
        console.log(`⚠️ [ADMIN] markAssignmentAsPaid no implementado para ID: ${assignmentId}`);
        Utils.showNotification('Función en desarrollo', 'warning');
    },

    changeAssignmentHolder: function(assignmentId) {
        console.log(`⚠️ [ADMIN] changeAssignmentHolder no implementado para ID: ${assignmentId}`);
        Utils.showNotification('Función en desarrollo', 'warning');
    },

    cancelAssignment: function(assignmentId) {
        console.log(`⚠️ [ADMIN] cancelAssignment no implementado para ID: ${assignmentId}`);
        Utils.showNotification('Función en desarrollo', 'warning');
    }
};

console.log('✅ AdminManager refactorizado cargado correctamente');