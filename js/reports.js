/**
 * REPORTES Y ESTADÍSTICAS - Sistema de Rifas Pampero
 * Generación de reportes detallados y análisis
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
            <div class="filter-section">
                <h3>🔍 Filtros de Reporte</h3>
                <div class="filter-row">
                    <label>Fecha desde:</label>
                    <input type="date" id="dateFrom" onchange="ReportsManager.updateReports()">
                </div>
                <div class="filter-row">
                    <label>Fecha hasta:</label>
                    <input type="date" id="dateTo" onchange="ReportsManager.updateReports()">
                </div>
                <div class="filter-row">
                    <label>Estado:</label>
                    <select id="statusFilter" onchange="ReportsManager.updateReports()">
                        <option value="">Todos</option>
                        <option value="paid">Pagados</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            <div id="generalReport"></div>
            <div id="buyersReport"></div>
            <div id="numbersReport"></div>
            <div id="navigationReport"></div>
            <div id="membershipReport"></div>
        `;

        this.generateGeneralReport();
        this.generateBuyersReport();
        this.generateNumbersReport();
        this.generateNavigationReport();
        this.generateMembershipReport();
    },

    /**
     * Obtener ventas filtradas
     */
    getFilteredSales: function() {
        let filteredSales = [...AppState.sales];

        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;

        if (dateFrom) {
            const fromDate = DateUtils.getStartOfDay(new Date(dateFrom));
            filteredSales = filteredSales.filter(sale => sale.date >= fromDate);
        }

        if (dateTo) {
            const toDate = DateUtils.getEndOfDay(new Date(dateTo));
            filteredSales = filteredSales.filter(sale => sale.date <= toDate);
        }

        if (statusFilter) {
            filteredSales = filteredSales.filter(sale => sale.status === statusFilter);
        }

        return filteredSales;
    },

    /**
     * Reporte general
     */
    generateGeneralReport: function() {
        const sales = this.getFilteredSales();
        const totalSales = sales.length;
        const totalNumbers = sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);
        const averagePerSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        const percentageSold = AppState.raffleConfig ? (totalNumbers / AppState.raffleConfig.totalNumbers * 100) : 0;

        const container = document.getElementById('generalReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">📊 Reporte General</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportGeneralReport()">📥 Exportar</button>
                </div>
                
                <div class="report-summary">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="number">${totalSales}</div>
                            <div class="label">Ventas</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${totalNumbers}</div>
                            <div class="label">Números vendidos</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(totalRevenue)}</div>
                            <div class="label">Ingresos confirmados</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(pendingRevenue)}</div>
                            <div class="label">Ingresos pendientes</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${Utils.formatPrice(averagePerSale)}</div>
                            <div class="label">Promedio por venta</div>
                        </div>
                        <div class="summary-stat">
                            <div class="number">${percentageSold.toFixed(1)}%</div>
                            <div class="label">Porcentaje vendido</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Reporte de compradores
     */
    generateBuyersReport: function() {
        const sales = this.getFilteredSales();
        
        // Consolidar compradores
        const buyersMap = new Map();
        sales.forEach(sale => {
            const key = `${sale.buyer.name}_${sale.buyer.lastName}_${sale.buyer.phone}`;
            if (!buyersMap.has(key)) {
                buyersMap.set(key, {
                    buyer: sale.buyer,
                    sales: [],
                    totalNumbers: 0,
                    totalSpent: 0
                });
            }
            const buyerData = buyersMap.get(key);
            buyerData.sales.push(sale);
            buyerData.totalNumbers += sale.numbers.length;
            buyerData.totalSpent += sale.total;
        });

        const buyersData = Array.from(buyersMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent);

        const topBuyers = buyersData.slice(0, 10);

        const container = document.getElementById('buyersReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">👥 Top 10 Compradores</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportBuyersReport()">📥 Exportar</button>
                </div>
                
                <div class="report-summary">
                    <p><strong>Total de compradores únicos:</strong> ${buyersData.length}</p>
                    
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Comprador</th>
                                <th>Teléfono</th>
                                <th>Compras</th>
                                <th>Números</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topBuyers.map(buyer => `
                                <tr>
                                    <td>${buyer.buyer.name} ${buyer.buyer.lastName}</td>
                                    <td>${buyer.buyer.phone}</td>
                                    <td>${buyer.sales.length}</td>
                                    <td>${buyer.totalNumbers}</td>
                                    <td>${Utils.formatPrice(buyer.totalSpent)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Reporte de números
     */
    generateNumbersReport: function() {
        const sales = this.getFilteredSales();
        
        // Análisis de números
        const numberFrequency = new Map();
        const numbersByRange = {
            '000-099': 0,
            '100-199': 0,
            '200-299': 0,
            '300-399': 0,
            '400-499': 0,
            '500-599': 0,
            '600-699': 0,
            '700-799': 0,
            '800-899': 0,
            '900-999': 0
        };

        sales.forEach(sale => {
            sale.numbers.forEach(number => {
                // Frecuencia por número
                numberFrequency.set(number, (numberFrequency.get(number) || 0) + 1);
                
                // Números por rango
                const range = Math.floor(number / 100);
                const rangeKey = Object.keys(numbersByRange)[range];
                if (rangeKey) {
                    numbersByRange[rangeKey]++;
                }
            });
        });

        const mostSoldNumbers = Array.from(numberFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const container = document.getElementById('numbersReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">🔢 Análisis de Números</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportNumbersReport()">📥 Exportar</button>
                </div>
                
                <div class="report-summary">
                    <h4>Números más vendidos:</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Veces vendido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mostSoldNumbers.map(([number, count]) => `
                                <tr>
                                    <td>${Utils.formatNumber(number)}</td>
                                    <td>${count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <h4 style="margin-top: 20px;">Distribución por rangos:</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Rango</th>
                                <th>Números vendidos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(numbersByRange).map(([range, count]) => `
                                <tr>
                                    <td>${range}</td>
                                    <td>${count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Reporte de interés en navegación
     */
    generateNavigationReport: function() {
        const sales = this.getFilteredSales();
        
        const navigationInterest = {
            'aprender': 0,
            'recreativo': 0,
            'ambos': 0,
            'no': 0,
            '': 0
        };

        sales.forEach(sale => {
            const interest = sale.buyer.navigationInterest || '';
            if (navigationInterest.hasOwnProperty(interest)) {
                navigationInterest[interest]++;
            }
        });

        const totalResponses = sales.length;

        const container = document.getElementById('navigationReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">⛵ Interés en Navegación</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportNavigationReport()">📥 Exportar</button>
                </div>
                
                <div class="report-summary">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Interés</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(navigationInterest).map(([interest, count]) => {
                                const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
                                const label = AppConstants.INTEREST_LABELS[interest] || 'No especificado';
                                return `
                                    <tr>
                                        <td>${label}</td>
                                        <td>${count}</td>
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
     * Reporte de membresía del club
     */
    generateMembershipReport: function() {
        const sales = this.getFilteredSales();
        
        const membershipData = {
            'si': 0,
            'no': 0,
            '': 0
        };

        const activitiesData = {
            'remo': 0,
            'ecologia': 0,
            'nautica': 0,
            'pesca': 0,
            'multiple': 0,
            'ninguna': 0,
            '': 0
        };

        sales.forEach(sale => {
            const isMember = sale.buyer.isMember || '';
            if (membershipData.hasOwnProperty(isMember)) {
                membershipData[isMember]++;
            }

            if (isMember === 'si') {
                const activity = sale.buyer.memberActivities || '';
                if (activitiesData.hasOwnProperty(activity)) {
                    activitiesData[activity]++;
                }
            }
        });

        const totalResponses = sales.length;
        const totalMembers = membershipData['si'];

        const container = document.getElementById('membershipReport');
        container.innerHTML = `
            <div class="report-section">
                <div class="report-header">
                    <div class="report-title">🏠 Membresía del Club</div>
                    <button class="btn btn-small" onclick="ReportsManager.exportMembershipReport()">📥 Exportar</button>
                </div>
                
                <div class="report-summary">
                    <h4>Estado de membresía:</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Membresía</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(membershipData).map(([membership, count]) => {
                                const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
                                const label = AppConstants.MEMBER_LABELS[membership] || 'No especificado';
                                return `
                                    <tr>
                                        <td>${label}</td>
                                        <td>${count}</td>
                                        <td>${percentage}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    ${totalMembers > 0 ? `
                        <h4 style="margin-top: 20px;">Actividades de socios (${totalMembers} socios):</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Actividad</th>
                                    <th>Cantidad</th>
                                    <th>% de socios</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(activitiesData).map(([activity, count]) => {
                                    const percentage = totalMembers > 0 ? (count / totalMembers * 100).toFixed(1) : 0;
                                    const label = AppConstants.ACTIVITY_LABELS[activity] || 'No especificado';
                                    return `
                                        <tr>
                                            <td>${label}</td>
                                            <td>${count}</td>
                                            <td>${percentage}%</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Exportar reporte general
     */
    exportGeneralReport: function() {
        const sales = this.getFilteredSales();
        const totalSales = sales.length;
        const totalNumbers = sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = sales.filter(s => s.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);

        let csvContent = "Métrica,Valor\n";
        csvContent += `"Total de ventas","${totalSales}"\n`;
        csvContent += `"Números vendidos","${totalNumbers}"\n`;
        csvContent += `"Ingresos confirmados","${totalRevenue}"\n`;
        csvContent += `"Ingresos pendientes","${pendingRevenue}"\n`;
        csvContent += `"Promedio por venta","${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : 0}"\n`;
        csvContent += `"Porcentaje vendido","${AppState.raffleConfig ? (totalNumbers / AppState.raffleConfig.totalNumbers * 100).toFixed(1) : 0}%"\n`;

        const filename = `reporte_general_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
    },

    /**
     * Exportar reporte de compradores
     */
    exportBuyersReport: function() {
        const sales = this.getFilteredSales();
        
        const buyersMap = new Map();
        sales.forEach(sale => {
            const key = `${sale.buyer.name}_${sale.buyer.lastName}_${sale.buyer.phone}`;
            if (!buyersMap.has(key)) {
                buyersMap.set(key, {
                    buyer: sale.buyer,
                    sales: [],
                    totalNumbers: 0,
                    totalSpent: 0
                });
            }
            const buyerData = buyersMap.get(key);
            buyerData.sales.push(sale);
            buyerData.totalNumbers += sale.numbers.length;
            buyerData.totalSpent += sale.total;
        });

        const buyersData = Array.from(buyersMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent);

        let csvContent = "Nombre,Apellido,Teléfono,Email,Compras,Números,Total Gastado\n";
        buyersData.forEach(buyer => {
            csvContent += `"${buyer.buyer.name}","${buyer.buyer.lastName}","${buyer.buyer.phone}","${buyer.buyer.email || ''}","${buyer.sales.length}","${buyer.totalNumbers}","${buyer.totalSpent}"\n`;
        });

        const filename = `reporte_compradores_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
    },

    /**
     * Exportar reporte de números
     */
    exportNumbersReport: function() {
        // Este método se puede implementar si se necesita
        Utils.showNotification('Exportación de números próximamente', 'info');
    },

    /**
     * Exportar reporte de navegación
     */
    exportNavigationReport: function() {
        const sales = this.getFilteredSales();
        
        let csvContent = "Interés en Navegación,Cantidad,Porcentaje\n";
        
        const navigationInterest = {
            'aprender': 0,
            'recreativo': 0,
            'ambos': 0,
            'no': 0,
            '': 0
        };

        sales.forEach(sale => {
            const interest = sale.buyer.navigationInterest || '';
            if (navigationInterest.hasOwnProperty(interest)) {
                navigationInterest[interest]++;
            }
        });

        const totalResponses = sales.length;

        Object.entries(navigationInterest).forEach(([interest, count]) => {
            const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
            const label = AppConstants.INTEREST_LABELS[interest] || 'No especificado';
            csvContent += `"${label}","${count}","${percentage}%"\n`;
        });

        const filename = `reporte_navegacion_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
    },

    /**
     * Exportar reporte de membresía
     */
    exportMembershipReport: function() {
        const sales = this.getFilteredSales();
        
        let csvContent = "Categoría,Subcategoría,Cantidad,Porcentaje\n";
        
        const membershipData = {
            'si': 0,
            'no': 0,
            '': 0
        };

        const activitiesData = {
            'remo': 0,
            'ecologia': 0,
            'nautica': 0,
            'pesca': 0,
            'multiple': 0,
            'ninguna': 0,
            '': 0
        };

        sales.forEach(sale => {
            const isMember = sale.buyer.isMember || '';
            if (membershipData.hasOwnProperty(isMember)) {
                membershipData[isMember]++;
            }

            if (isMember === 'si') {
                const activity = sale.buyer.memberActivities || '';
                if (activitiesData.hasOwnProperty(activity)) {
                    activitiesData[activity]++;
                }
            }
        });

        const totalResponses = sales.length;
        const totalMembers = membershipData['si'];

        // Membresía
        Object.entries(membershipData).forEach(([membership, count]) => {
            const percentage = totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0;
            const label = AppConstants.MEMBER_LABELS[membership] || 'No especificado';
            csvContent += `"Membresía","${label}","${count}","${percentage}%"\n`;
        });

        // Actividades
        Object.entries(activitiesData).forEach(([activity, count]) => {
            const percentage = totalMembers > 0 ? (count / totalMembers * 100).toFixed(1) : 0;
            const label = AppConstants.ACTIVITY_LABELS[activity] || 'No especificado';
            csvContent += `"Actividades de socios","${label}","${count}","${percentage}%"\n`;
        });

        const filename = `reporte_membresia_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
    }
};

console.log('✅ Reports.js cargado correctamente');