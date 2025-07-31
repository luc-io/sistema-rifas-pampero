/**
 * REPORTES Y ESTADÍSTICAS - Sistema de Rifas Pampero (CORREGIDO)
 * Generación de reportes simplificados y optimizados
 * CORREGIDO: Incluir asignaciones pagadas como ventas finales
 */

window.ReportsManager = {
    /**
     * Actualizar todos los reportes - DATOS SIEMPRE FRESCOS
     */
    updateReports: function() {
        console.log('📊 [REPORTS] Actualizando reportes con datos frescos');
        
        if (!AppState.raffleConfig) {
            document.getElementById('reportsContent').innerHTML = `
                <div class="setup-needed">
                    <h3>📈 Reportes y Estadísticas</h3>
                    <p>Configura tu rifa para ver los reportes</p>
                </div>
            `;
            return;
        }

        // Forzar re-cálculo con datos actuales
        const currentTime = new Date().toLocaleString('es-AR');
        console.log(`📊 [REPORTS] Generando reportes a las ${currentTime} con ${AppState.sales.length} ventas`);

        const container = document.getElementById('reportsContent');
        container.innerHTML = `
            <div style="background: #e8f5e8; padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 12px; color: #2d5016;">
                📊 Reportes actualizados: ${currentTime} | Datos en tiempo real
            </div>
            <div id="generalReport"></div>
            <div id="membershipReport"></div>
        `;

        this.generateGeneralReport();
        this.generateMembershipReport();
    },

    /**
     * Reporte general con gráfico de progreso - CORREGIDO
     */
    generateGeneralReport: function() {
        // USAR DATOS ACTUALES directamente del AppState
        const sales = AppState.sales || [];
        const assignments = AppState.assignments || [];
        
        console.log(`📊 [REPORTS] Generando reporte con ${sales.length} ventas y ${assignments.length} asignaciones`);
        
        // ✅ CORREGIDO: Incluir asignaciones pagadas como ventas confirmadas
        const confirmedSales = sales.filter(s => s.status === 'paid');
        const pendingSales = sales.filter(s => s.status === 'pending');
        
        // Obtener asignaciones pagadas (ya son ventas confirmadas)
        const paidAssignments = assignments.filter(a => a.status === 'paid');
        const paidAssignmentSales = paidAssignments.map(a => ({
            id: a.id,
            numbers: a.numbers,
            total: a.total_amount,
            paymentMethod: a.payment_method || 'efectivo',
            status: 'paid',
            buyer: { membershipArea: 'vendedor' }
        }));
        
        // Combinar ventas regulares + asignaciones pagadas
        const allConfirmedSales = [...confirmedSales, ...paidAssignmentSales];
        const allSales = [...sales, ...paidAssignmentSales];
        
        const totalSales = allSales.length;
        const totalNumbers = allSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        const confirmedNumbers = allConfirmedSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        const pendingNumbers = pendingSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        
        // Números en asignaciones pendientes (no vendidos aún)
        const activeAssignments = assignments.filter(a => a.status === 'assigned' || a.status === 'pending');
        const assignedNumbers = activeAssignments.reduce((sum, assignment) => 
            sum + (assignment.numbers ? assignment.numbers.length : 0), 0
        );
        
        const totalRevenue = allConfirmedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const pendingRevenue = pendingSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        // ✅ CORREGIDO: Calcular totales por método de pago incluyendo asignaciones
        const efectivoConfirmado = allConfirmedSales
            .filter(s => s.paymentMethod === 'efectivo')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        const transferenciaConfirmada = allConfirmedSales
            .filter(s => s.paymentMethod === 'transferencia')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        const transferenciaPendiente = pendingSales
            .filter(s => s.paymentMethod === 'transferencia')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        // Calcular disponibilidad real usando configuración actual
        const currentConfig = AppState.raffleConfig;
        const occupiedNumbers = totalNumbers + assignedNumbers; // Vendidos + asignados
        const percentageSold = currentConfig ? (totalNumbers / currentConfig.totalNumbers * 100) : 0;
        const percentageOccupied = currentConfig ? (occupiedNumbers / currentConfig.totalNumbers * 100) : 0;
        const totalPotentialRevenue = currentConfig ? currentConfig.totalNumbers * currentConfig.price : 0;
        const reallyAvailableNumbers = currentConfig ? currentConfig.totalNumbers - occupiedNumbers : 0;

        // Estadísticas de reservas actuales
        const activeReservations = AppState.reservations ? 
            AppState.reservations.filter(r => r.status === 'active' && !Utils.isReservationExpired(r)) : [];
        const reservedNumbers = activeReservations.reduce((sum, res) => 
            sum + (res.numbers ? res.numbers.length : 0), 0
        );

        console.log(`📊 [REPORTS] Estadísticas calculadas:`, {
            totalSales,
            totalNumbers,
            confirmedNumbers,
            pendingNumbers,
            assignedNumbers,
            reservedNumbers,
            reallyAvailableNumbers,
            percentageSold: percentageSold.toFixed(1),
            efectivoConfirmado,
            transferenciaConfirmada,
            transferenciaPendiente
        });

        const container = document.getElementById('generalReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">📊 Reporte General - ${currentConfig.name}</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportGeneralReport()">📥 Exportar CSV</button>
                </div>
                
                <div class="report-summary">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="number">${totalSales}</div>
                            <div class="label">Ventas Realizadas</div>
                            <div class="sublabel">(Incluye asignaciones)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${confirmedNumbers}</div>
                            <div class="label">Números Vendidos</div>
                            <div class="sublabel">(Confirmados)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${pendingNumbers}</div>
                            <div class="label">Números Pendientes</div>
                            <div class="sublabel">(Por confirmar)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${assignedNumbers}</div>
                            <div class="label">Números Asignados</div>
                            <div class="sublabel">(A vendedores)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${reservedNumbers}</div>
                            <div class="label">Números Reservados</div>
                            <div class="sublabel">(Temporalmente)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${reallyAvailableNumbers}</div>
                            <div class="label">Realmente Disponibles</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(totalRevenue)}</div>
                            <div class="label">Ingresos Confirmados</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(pendingRevenue)}</div>
                            <div class="label">Ingresos Pendientes</div>
                        </div>
                        <div class="summary-stat" style="background: #e8f5e8; border: 2px solid #4CAF50;">
                            <div class="number">${Utils.formatPrice(efectivoConfirmado)}</div>
                            <div class="label">💰 Cobrado Efectivo</div>
                            <div class="sublabel">(Confirmado)</div>
                        </div>
                        <div class="summary-stat" style="background: #e1f5fe; border: 2px solid #2196F3;">
                            <div class="number">${Utils.formatPrice(transferenciaConfirmada)}</div>
                            <div class="label">💳 Cobrado Transferencia</div>
                            <div class="sublabel">(Confirmado)</div>
                        </div>
                        <div class="summary-stat" style="background: #fff3e0; border: 2px solid #ff9800;">
                            <div class="number">${Utils.formatPrice(transferenciaPendiente)}</div>
                            <div class="label">⏳ Transferencia Pendiente</div>
                            <div class="sublabel">(Por confirmar)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${percentageSold.toFixed(1)}%</div>
                            <div class="label">Porcentaje Vendido</div>
                        </div>
                    </div>
                    
                    <!-- ✅ NUEVO: Resumen de Cobros -->
                    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                        <h4 style="color: #155724; margin-bottom: 15px;">💰 Resumen de Cobros Confirmados</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #c3e6cb;">
                                <div style="font-size: 18px; font-weight: bold; color: #155724;">💰 ${Utils.formatPrice(efectivoConfirmado)}</div>
                                <div style="color: #155724; font-size: 14px;">Efectivo Cobrado</div>
                                <div style="color: #6c757d; font-size: 12px;">Dinero en caja</div>
                            </div>
                            <div style="background: #cce7ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #97d4ff;">
                                <div style="font-size: 18px; font-weight: bold; color: #004085;">💳 ${Utils.formatPrice(transferenciaConfirmada)}</div>
                                <div style="color: #004085; font-size: 14px;">Transferencias Confirmadas</div>
                                <div style="color: #6c757d; font-size: 12px;">Dinero en cuenta</div>
                            </div>
                            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ffeaa7;">
                                <div style="font-size: 18px; font-weight: bold; color: #856404;">⏳ ${Utils.formatPrice(transferenciaPendiente)}</div>
                                <div style="color: #856404; font-size: 14px;">Transferencias Pendientes</div>
                                <div style="color: #6c757d; font-size: 12px;">Por confirmar</div>
                            </div>
                            <div style="background: #e2e3e5; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #d1d3d4;">
                                <div style="font-size: 18px; font-weight: bold; color: #383d41;">📊 ${Utils.formatPrice(totalRevenue)}</div>
                                <div style="color: #383d41; font-size: 14px;">Total Cobrado</div>
                                <div style="color: #6c757d; font-size: 12px;">Efectivo + Transferencias</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Gráfico de progreso mejorado -->
                    <div class="progress-section" style="margin-top: 30px;">
                        <h4>🎯 Progreso de la Rifa</h4>
                        <div class="progress-container" style="margin: 15px 0;">
                            <div class="progress-bar" style="
                                background: #e0e0e0; 
                                border-radius: 15px; 
                                height: 40px; 
                                position: relative; 
                                overflow: hidden;
                                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                            ">
                                <!-- Barra de vendidos confirmados -->
                                <div class="progress-fill" style="
                                    background: linear-gradient(90deg, #4CAF50 0%, #45a049 50%, #66BB6A 100%); 
                                    height: 100%; 
                                    width: ${Math.min(percentageSold, 100)}%; 
                                    transition: width 0.5s ease;
                                    position: relative;
                                ">
                                    <div style="
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        bottom: 0;
                                        background: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.2) 75%);
                                        background-size: 20px 20px;
                                        animation: progress-stripes 1s linear infinite;
                                    "></div>
                                </div>
                                
                                <!-- Texto central -->
                                <div style="
                                    position: absolute; 
                                    top: 50%; 
                                    left: 50%; 
                                    transform: translate(-50%, -50%); 
                                    font-weight: bold; 
                                    font-size: 14px;
                                    color: ${percentageSold > 50 ? 'white' : '#333'};
                                    text-shadow: ${percentageSold > 50 ? '1px 1px 2px rgba(0,0,0,0.3)' : '1px 1px 2px rgba(255,255,255,0.8)'};
                                    text-align: center;
                                ">
                                    ${percentageSold.toFixed(1)}% vendido
                                    <br><small style="font-size: 11px;">
                                        ${confirmedNumbers + pendingNumbers}/${currentConfig.totalNumbers} números
                                        ${assignedNumbers > 0 ? ` | ${assignedNumbers} asignados` : ''}
                                        ${reservedNumbers > 0 ? ` | ${reservedNumbers} reservados` : ''}
                                    </small>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #666;">
                                <span><strong>Meta:</strong> ${Utils.formatPrice(totalPotentialRevenue)}</span>
                                <span><strong>Recaudado:</strong> ${Utils.formatPrice(totalRevenue + pendingRevenue)}</span>
                            </div>
                            
                            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4CAF50;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span><strong>Faltante para meta:</strong></span>
                                    <span style="font-size: 18px; font-weight: bold; color: #4CAF50;">
                                        ${Utils.formatPrice(totalPotentialRevenue - (totalRevenue + pendingRevenue))}
                                    </span>
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                    ${reallyAvailableNumbers} números realmente disponibles
                                    ${assignedNumbers > 0 ? `<br>${assignedNumbers} números asignados a vendedores` : ''}
                                    ${reservedNumbers > 0 ? `<br>${reservedNumbers} números en reserva temporal` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resumen de estado actual -->
                    <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                        <h5 style="color: #2d5016; margin-bottom: 10px;">📈 Estado Actual de la Rifa</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 13px;">
                            <div>✅ <strong>Vendidos confirmados:</strong> ${confirmedNumbers} números</div>
                            <div>⏳ <strong>Pendientes de pago:</strong> ${pendingNumbers} números</div>
                            <div>📋 <strong>Asignados a vendedores:</strong> ${assignedNumbers} números</div>
                            <div>⏰ <strong>En reserva temporal:</strong> ${reservedNumbers} números</div>
                            <div>🎯 <strong>Disponibles ahora:</strong> ${reallyAvailableNumbers} números</div>
                            <div>💰 <strong>Recaudación actual:</strong> ${Utils.formatPrice(totalRevenue)}</div>
                            <div>💵 <strong>Efectivo confirmado:</strong> ${Utils.formatPrice(efectivoConfirmado)}</div>
                            <div>💳 <strong>Transferencia confirmada:</strong> ${Utils.formatPrice(transferenciaConfirmada)}</div>
                            <div>⌛ <strong>Transferencia pendiente:</strong> ${Utils.formatPrice(transferenciaPendiente)}</div>
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #666;">
                            Última actualización: ${new Date().toLocaleString('es-AR')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Reporte de membresía del club - CORREGIDO
     */
    generateMembershipReport: function() {
        // ✅ CORREGIDO: Incluir asignaciones pagadas en estadísticas de membresía
        const sales = AppState.sales || [];
        const assignments = AppState.assignments || [];
        
        // Obtener asignaciones pagadas como ventas de vendedores
        const paidAssignments = assignments.filter(a => a.status === 'paid');
        const paidAssignmentSales = paidAssignments.map(a => ({
            buyer: { membershipArea: 'vendedor' }
        }));
        
        // Combinar todas las ventas incluyendo asignaciones pagadas
        const allSales = [...sales, ...paidAssignmentSales];
        
        console.log(`📊 [REPORTS] Generando reporte de membresía con ${sales.length} ventas + ${paidAssignments.length} asignaciones pagadas`);
        
        const membershipData = {
            'no_socio': 0,
            'nautica': 0,
            'remo': 0,
            'ecologia': 0,
            'pesca': 0,
            'ninguna': 0,
            'vendedor': 0, // Incluye asignaciones confirmadas
            '': 0
        };

        // Contar por área de membresía usando todos los datos
        allSales.forEach(sale => {
            const membershipArea = (sale.buyer && sale.buyer.membershipArea) ? sale.buyer.membershipArea : '';
            if (membershipData.hasOwnProperty(membershipArea)) {
                membershipData[membershipArea]++;
            } else {
                membershipData['']++; // No especificado
            }
        });

        const totalResponses = allSales.length;
        const totalMembers = totalResponses - membershipData['no_socio'] - membershipData[''] - membershipData['vendedor'];
        const totalNonMembers = membershipData['no_socio'];
        const totalVendors = membershipData['vendedor'];

        // Calcular datos para el gráfico circular
        const chartData = Object.entries(membershipData)
            .filter(([key, count]) => count > 0)
            .map(([key, count]) => ({
                label: AppConstants.MEMBERSHIP_LABELS[key] || 'No especificado',
                value: count,
                percentage: totalResponses > 0 ? (count / totalResponses * 100) : 0,
                color: this.getMembershipColor(key)
            }))
            .sort((a, b) => b.value - a.value); // Ordenar por cantidad

        console.log(`📊 [REPORTS] Distribución de membresía:`, chartData);

        const container = document.getElementById('membershipReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">🏠 Relación con el Club</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportMembershipReport()">📥 Exportar CSV</button>
                </div>
                
                <div class="report-summary">
                    <!-- Estadísticas resumidas -->
                    <div class="membership-overview" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${totalMembers}</div>
                            <div style="color: #666;">Socios del Club</div>
                            <div style="font-size: 12px; color: #888;">${totalResponses > 0 ? ((totalMembers / totalResponses) * 100).toFixed(1) : 0}% del total</div>
                        </div>
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${totalNonMembers}</div>
                            <div style="color: #666;">No Socios</div>
                            <div style="font-size: 12px; color: #888;">${totalResponses > 0 ? ((totalNonMembers / totalResponses) * 100).toFixed(1) : 0}% del total</div>
                        </div>
                        ${totalVendors > 0 ? `
                        <div style="background: #e1f5fe; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #0277bd;">${totalVendors}</div>
                            <div style="color: #666;">Vendedores</div>
                            <div style="font-size: 12px; color: #888;">${totalResponses > 0 ? ((totalVendors / totalResponses) * 100).toFixed(1) : 0}% del total</div>
                        </div>
                        ` : ''}
                        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #9c27b0;">${totalResponses}</div>
                            <div style="color: #666;">Total Compradores</div>
                            <div style="font-size: 12px; color: #888;">100% de las ventas</div>
                        </div>
                    </div>

                    <!-- Gráfico de barras horizontal -->
                    <div class="membership-chart" style="margin-bottom: 25px;">
                        <h4>📊 Distribución por Área</h4>
                        <div class="chart-container" style="margin: 15px 0;">
                            ${chartData.map(item => `
                                <div class="chart-bar" style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <span style="font-weight: 500; font-size: 14px;">${item.label}</span>
                                        <span style="font-size: 12px; color: #666;">${item.value} (${item.percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div style="background: #e0e0e0; border-radius: 4px; height: 20px; position: relative; overflow: hidden;">
                                        <div style="
                                            background: ${item.color}; 
                                            height: 100%; 
                                            width: ${Math.max(item.percentage, 2)}%; 
                                            transition: width 0.5s ease;
                                            border-radius: 4px;
                                        "></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Tabla detallada -->
                    <h4>📋 Detalle por Categoría</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Relación con el Club</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chartData.map(item => `
                                <tr>
                                    <td>
                                        <span style="display: inline-block; width: 12px; height: 12px; background: ${item.color}; border-radius: 2px; margin-right: 8px;"></span>
                                        ${item.label}
                                    </td>
                                    <td><strong>${item.value}</strong></td>
                                    <td>${item.percentage.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; font-size: 12px; color: #666; text-align: center;">
                        Datos basados en ${totalResponses} ventas registradas (incluyendo asignaciones pagadas) | Actualizado: ${new Date().toLocaleString('es-AR')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Obtener color para cada tipo de membresía
     */
    getMembershipColor: function(membershipType) {
        const colors = {
            'no_socio': '#ff9800',     // Naranja
            'nautica': '#2196F3',      // Azul
            'remo': '#4CAF50',         // Verde
            'ecologia': '#8BC34A',     // Verde claro
            'pesca': '#00BCD4',        // Cian
            'ninguna': '#9C27B0',      // Púrpura
            'vendedor': '#0277bd',     // Azul oscuro
            '': '#757575'              // Gris
        };
        return colors[membershipType] || '#757575';
    },

    /**
     * Exportar reporte general - CORREGIDO
     */
    exportGeneralReport: function() {
        const sales = AppState.sales || [];
        const assignments = AppState.assignments || [];
        
        const confirmedSales = sales.filter(s => s.status === 'paid');
        const pendingSales = sales.filter(s => s.status === 'pending');
        
        // ✅ CORREGIDO: Incluir asignaciones pagadas en estadísticas de exportación
        const paidAssignments = assignments.filter(a => a.status === 'paid');
        const paidAssignmentSales = paidAssignments.map(a => ({
            numbers: a.numbers,
            total: a.total_amount,
            paymentMethod: a.payment_method || 'efectivo',
            status: 'paid'
        }));
        
        const allConfirmedSales = [...confirmedSales, ...paidAssignmentSales];
        const allSales = [...sales, ...paidAssignmentSales];
        
        const totalSales = allSales.length;
        const totalNumbers = allSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        const confirmedNumbers = allConfirmedSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        const pendingNumbers = pendingSales.reduce((sum, sale) => sum + (sale.numbers ? sale.numbers.length : 0), 0);
        const assignedNumbers = assignments
            .filter(a => a.status === 'assigned' || a.status === 'pending')
            .reduce((sum, assignment) => sum + (assignment.numbers ? assignment.numbers.length : 0), 0);
        
        const totalRevenue = allConfirmedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const pendingRevenue = pendingSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        // ✅ CORREGIDO: Calcular totales por método de pago incluyendo asignaciones
        const efectivoConfirmado = allConfirmedSales
            .filter(s => s.paymentMethod === 'efectivo')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        const transferenciaConfirmada = allConfirmedSales
            .filter(s => s.paymentMethod === 'transferencia')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        const transferenciaPendiente = pendingSales
            .filter(s => s.paymentMethod === 'transferencia')
            .reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        const occupiedNumbers = totalNumbers + assignedNumbers;
        const percentageSold = AppState.raffleConfig ? (totalNumbers / AppState.raffleConfig.totalNumbers * 100) : 0;
        const reallyAvailableNumbers = AppState.raffleConfig ? AppState.raffleConfig.totalNumbers - occupiedNumbers : 0;

        let csvContent = "Métrica,Valor,Fecha_Generacion\n";
        csvContent += `"Total de ventas (incluye asignaciones)","${totalSales}","${new Date().toISOString()}"\n`;
        csvContent += `"Números vendidos confirmados","${confirmedNumbers}","${new Date().toISOString()}"\n`;
        csvContent += `"Números vendidos pendientes","${pendingNumbers}","${new Date().toISOString()}"\n`;
        csvContent += `"Total números vendidos","${totalNumbers}","${new Date().toISOString()}"\n`;
        csvContent += `"Números asignados a vendedores","${assignedNumbers}","${new Date().toISOString()}"\n`;
        csvContent += `"Números realmente disponibles","${reallyAvailableNumbers}","${new Date().toISOString()}"\n`;
        csvContent += `"Ingresos confirmados (incluye asignaciones)","${totalRevenue}","${new Date().toISOString()}"\n`;
        csvContent += `"Ingresos pendientes","${pendingRevenue}","${new Date().toISOString()}"\n`;
        csvContent += `"Ingresos totales","${totalRevenue + pendingRevenue}","${new Date().toISOString()}"\n`;
        csvContent += `"Cobrado en efectivo","${efectivoConfirmado}","${new Date().toISOString()}"\n`;
        csvContent += `"Cobrado por transferencia","${transferenciaConfirmada}","${new Date().toISOString()}"\n`;
        csvContent += `"Transferencias pendientes","${transferenciaPendiente}","${new Date().toISOString()}"\n`;
        csvContent += `"Porcentaje vendido","${percentageSold.toFixed(1)}%","${new Date().toISOString()}"\n`;

        const filename = `reporte_general_corregido_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        Utils.showNotification('Reporte general exportado correctamente', 'success');
    },

    /**
     * Exportar reporte de membresía - CORREGIDO
     */
    exportMembershipReport: function() {
        const sales = AppState.sales || [];
        const assignments = AppState.assignments || [];
        
        // ✅ CORREGIDO: Incluir asignaciones pagadas
        const paidAssignments = assignments.filter(a => a.status === 'paid');
        const paidAssignmentSales = paidAssignments.map(a => ({
            buyer: { membershipArea: 'vendedor' }
        }));
        
        const allSales = [...sales, ...paidAssignmentSales];
        
        let csvContent = "Relación con el Club,Cantidad,Porcentaje,Fecha_Generacion\n";
        
        const membershipData = {
            'no_socio': 0,
            'nautica': 0,
            'remo': 0,
            'ecologia': 0,
            'pesca': 0,
            'ninguna': 0,
            'vendedor': 0,
            '': 0
        };

        allSales.forEach(sale => {
            const membershipArea = (sale.buyer && sale.buyer.membershipArea) ? sale.buyer.membershipArea : '';
            if (membershipData.hasOwnProperty(membershipArea)) {
                membershipData[membershipArea]++;
            } else {
                membershipData['']++;
            }
        });

        const totalResponses = allSales.length;
        const currentDate = new Date().toISOString();

        Object.entries(membershipData)
            .filter(([key, count]) => count > 0)
            .forEach(([membership, count]) => {
                const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
                const label = AppConstants.MEMBERSHIP_LABELS[membership] || 'No especificado';
                csvContent += `"${label}","${count}","${percentage}%","${currentDate}"\n`;
            });

        const filename = `reporte_membresia_corregido_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        Utils.showNotification('Reporte de membresía exportado correctamente', 'success');
    }
};

console.log('✅ Reports.js CORREGIDO cargado correctamente - Incluye asignaciones pagadas como ventas finales');
