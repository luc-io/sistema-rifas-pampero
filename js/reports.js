/**
 * REPORTES Y ESTADÍSTICAS - Sistema de Rifas Pampero
 * Generación de reportes simplificados y optimizados
 */

window.ReportsManager = {
    /**
     * Actualizar todos los reportes
     */
    updateReports: function() {
        if (!AppState.raffleConfig) {
            document.getElementById('reportsContent').innerHTML = `
                <div class="setup-needed">
                    <h3>📈 Reportes y Estadísticas</h3>
                    <p>Configura tu rifa para ver los reportes</p>
                </div>
            `;
            return;
        }

        const container = document.getElementById('reportsContent');
        container.innerHTML = `
            <div id="generalReport"></div>
            <div id="membershipReport"></div>
        `;

        this.generateGeneralReport();
        this.generateMembershipReport();
    },

    /**
     * Reporte general con gráfico de progreso
     */
    generateGeneralReport: function() {
        const sales = AppState.sales;
        const totalSales = sales.length;
        const totalNumbers = sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);
        const percentageSold = AppState.raffleConfig ? (totalNumbers / AppState.raffleConfig.totalNumbers * 100) : 0;
        const totalPotentialRevenue = AppState.raffleConfig ? AppState.raffleConfig.totalNumbers * AppState.raffleConfig.price : 0;
        const remainingNumbers = AppState.raffleConfig ? AppState.raffleConfig.totalNumbers - totalNumbers : 0;

        const container = document.getElementById('generalReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">📊 Reporte General</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportGeneralReport()">📥 Exportar CSV</button>
                </div>
                
                <div class="report-summary">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="number">${totalSales}</div>
                            <div class="label">Ventas Realizadas</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${totalNumbers}</div>
                            <div class="label">Números Vendidos</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${remainingNumbers}</div>
                            <div class="label">Números Disponibles</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(totalRevenue)}</div>
                            <div class="label">Ingresos Confirmados</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(pendingRevenue)}</div>
                            <div class="label">Ingresos Pendientes</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${percentageSold.toFixed(1)}%</div>
                            <div class="label">Porcentaje Vendido</div>
                        </div>
                    </div>
                    
                    <!-- Gráfico de progreso -->
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
                                <div style="
                                    position: absolute; 
                                    top: 50%; 
                                    left: 50%; 
                                    transform: translate(-50%, -50%); 
                                    font-weight: bold; 
                                    font-size: 16px;
                                    color: ${percentageSold > 50 ? 'white' : '#333'};
                                    text-shadow: ${percentageSold > 50 ? '1px 1px 2px rgba(0,0,0,0.3)' : '1px 1px 2px rgba(255,255,255,0.8)'};
                                ">
                                    ${percentageSold.toFixed(1)}% (${totalNumbers}/${AppState.raffleConfig.totalNumbers})
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
                                    Quedan ${remainingNumbers} números disponibles
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes progress-stripes {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 0; }
                }
            </style>
        `;
    },

    /**
     * Reporte de membresía del club (actualizado con nuevo campo)
     */
    generateMembershipReport: function() {
        const sales = AppState.sales;
        
        const membershipData = {
            'no_socio': 0,
            'nautica': 0,
            'remo': 0,
            'ecologia': 0,
            'pesca': 0,
            'ninguna': 0,
            '': 0
        };

        // Contar por área de membresía
        sales.forEach(sale => {
            const membershipArea = sale.buyer.membershipArea || '';
            if (membershipData.hasOwnProperty(membershipArea)) {
                membershipData[membershipArea]++;
            }
        });

        const totalResponses = sales.length;
        const totalMembers = totalResponses - membershipData['no_socio'] - membershipData[''];
        const totalNonMembers = membershipData['no_socio'];

        // Calcular datos para el gráfico circular
        const chartData = Object.entries(membershipData)
            .filter(([key, count]) => count > 0)
            .map(([key, count]) => ({
                label: AppConstants.MEMBERSHIP_LABELS[key] || 'No especificado',
                value: count,
                percentage: totalResponses > 0 ? (count / totalResponses * 100) : 0,
                color: this.getMembershipColor(key)
            }));

        const container = document.getElementById('membershipReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">🏠 Relación con el Club</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportMembershipReport()">📥 Exportar CSV</button>
                </div>
                
                <div class="report-summary">
                    <!-- Estadísticas resumidas -->
                    <div class="membership-overview" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
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
                                            width: ${item.percentage}%; 
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
                            ${Object.entries(membershipData)
                                .filter(([key, count]) => count > 0)
                                .sort((a, b) => b[1] - a[1])
                                .map(([membership, count]) => {
                                    const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
                                    const label = AppConstants.MEMBERSHIP_LABELS[membership] || 'No especificado';
                                    return `
                                        <tr>
                                            <td>
                                                <span style="display: inline-block; width: 12px; height: 12px; background: ${this.getMembershipColor(membership)}; border-radius: 2px; margin-right: 8px;"></span>
                                                ${label}
                                            </td>
                                            <td><strong>${count}</strong></td>
                                            <td>${percentage}%</td>
                                        </tr>
                                    `;
                                }).join('')}
                        </tbody>
                    </table>
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
            '': '#757575'              // Gris
        };
        return colors[membershipType] || '#757575';
    },

    /**
     * Exportar reporte general
     */
    exportGeneralReport: function() {
        const sales = AppState.sales;
        const totalSales = sales.length;
        const totalNumbers = sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);
        const percentageSold = AppState.raffleConfig ? (totalNumbers / AppState.raffleConfig.totalNumbers * 100) : 0;
        const remainingNumbers = AppState.raffleConfig ? AppState.raffleConfig.totalNumbers - totalNumbers : 0;

        let csvContent = "Métrica,Valor\n";
        csvContent += `"Total de ventas","${totalSales}"\n`;
        csvContent += `"Números vendidos","${totalNumbers}"\n`;
        csvContent += `"Números disponibles","${remainingNumbers}"\n`;
        csvContent += `"Ingresos confirmados","${totalRevenue}"\n`;
        csvContent += `"Ingresos pendientes","${pendingRevenue}"\n`;
        csvContent += `"Ingresos totales","${totalRevenue + pendingRevenue}"\n`;
        csvContent += `"Porcentaje vendido","${percentageSold.toFixed(1)}%"\n`;

        const filename = `reporte_general_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        Utils.showNotification('Reporte general exportado correctamente', 'success');
    },

    /**
     * Exportar reporte de membresía
     */
    exportMembershipReport: function() {
        const sales = AppState.sales;
        
        let csvContent = "Relación con el Club,Cantidad,Porcentaje\n";
        
        const membershipData = {
            'no_socio': 0,
            'nautica': 0,
            'remo': 0,
            'ecologia': 0,
            'pesca': 0,
            'ninguna': 0,
            '': 0
        };

        sales.forEach(sale => {
            const membershipArea = sale.buyer.membershipArea || '';
            if (membershipData.hasOwnProperty(membershipArea)) {
                membershipData[membershipArea]++;
            }
        });

        const totalResponses = sales.length;

        Object.entries(membershipData)
            .filter(([key, count]) => count > 0)
            .forEach(([membership, count]) => {
                const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
                const label = AppConstants.MEMBERSHIP_LABELS[membership] || 'No especificado';
                csvContent += `"${label}","${count}","${percentage}%"\n`;
            });

        const filename = `reporte_membresia_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        Utils.showNotification('Reporte de membresía exportado correctamente', 'success');
    }
};

console.log('✅ Reports.js optimizado cargado correctamente');
