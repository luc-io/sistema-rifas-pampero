/**
 * ESTADÍSTICAS Y MÉTRICAS - Sistema de Rifas Pampero
 * Módulo especializado en cálculos estadísticos y métricas de ventas
 */

window.AdminStats = {
    /**
     * Calcular compradores únicos
     */
    getUniqueBuyers: function() {
        const buyerMap = new Map();
        
        // Agrupar ventas por comprador único (nombre completo + teléfono como clave)
        AppState.sales.forEach(sale => {
            const buyerKey = `${sale.buyer.name.toLowerCase().trim()} ${sale.buyer.lastName.toLowerCase().trim()} ${sale.buyer.phone.replace(/[^\d]/g, '')}`;
            
            if (!buyerMap.has(buyerKey)) {
                buyerMap.set(buyerKey, {
                    buyer: sale.buyer,
                    purchases: [],
                    totalNumbers: 0,
                    totalSpent: 0,
                    firstPurchase: sale.date,
                    lastPurchase: sale.date
                });
            }
            
            const buyerData = buyerMap.get(buyerKey);
            buyerData.purchases.push(sale);
            buyerData.totalNumbers += sale.numbers.length;
            buyerData.totalSpent += sale.total;
            
            // Actualizar fechas
            if (sale.date < buyerData.firstPurchase) {
                buyerData.firstPurchase = sale.date;
            }
            if (sale.date > buyerData.lastPurchase) {
                buyerData.lastPurchase = sale.date;
            }
        });
        
        return Array.from(buyerMap.values());
    },

    /**
     * Obtener estadísticas de compradores
     */
    getBuyerStats: function() {
        const uniqueBuyers = this.getUniqueBuyers();
        
        return {
            totalUniqueBuyers: uniqueBuyers.length,
            repeatBuyers: uniqueBuyers.filter(buyer => buyer.purchases.length > 1).length,
            averageSpentPerBuyer: uniqueBuyers.length > 0 ? 
                uniqueBuyers.reduce((sum, buyer) => sum + buyer.totalSpent, 0) / uniqueBuyers.length : 0,
            topBuyer: uniqueBuyers.length > 0 ? 
                uniqueBuyers.reduce((top, buyer) => buyer.totalSpent > top.totalSpent ? buyer : top, uniqueBuyers[0]) : null
        };
    },

    /**
     * Calcular estadísticas principales
     */
    calculateMainStats: function() {
        if (!AppState.raffleConfig) return null;

        const soldCount = AppState.sales.reduce((sum, sale) => sum + sale.numbers.length, 0);
        const totalRevenue = AppState.sales.filter(sale => sale.status === 'paid').reduce((sum, sale) => sum + sale.total, 0);
        const pendingRevenue = AppState.sales.filter(sale => sale.status === 'pending').reduce((sum, sale) => sum + sale.total, 0);
        const reservedCount = AppState.reservations.filter(r => r.status === 'active').reduce((sum, r) => sum + r.numbers.length, 0);
        const availableCount = AppState.raffleConfig.totalNumbers - soldCount - reservedCount;
        
        // Estadísticas de compradores
        const buyerStats = this.getBuyerStats();
        const activeReservationsCount = AppState.reservations.filter(r => r.status === 'active').length;

        return {
            numbers: {
                sold: soldCount,
                reserved: reservedCount,
                available: availableCount,
                total: AppState.raffleConfig.totalNumbers,
                soldPercentage: (soldCount / AppState.raffleConfig.totalNumbers * 100).toFixed(1)
            },
            revenue: {
                confirmed: totalRevenue,
                pending: pendingRevenue,
                total: totalRevenue + pendingRevenue,
                projected: AppState.raffleConfig.totalNumbers * AppState.raffleConfig.price
            },
            buyers: {
                unique: buyerStats.totalUniqueBuyers,
                repeat: buyerStats.repeatBuyers,
                average: buyerStats.averageSpentPerBuyer,
                top: buyerStats.topBuyer
            },
            reservations: {
                active: activeReservationsCount,
                expired: AppState.reservations.filter(r => r.status === 'expired').length,
                confirmed: AppState.reservations.filter(r => r.status === 'confirmed').length
            }
        };
    },

    /**
     * Actualizar elementos de estadísticas en la UI
     */
    updateStatsElements: function() {
        const stats = this.calculateMainStats();
        if (!stats) return;

        // Actualizar estadísticas solo si existen los elementos
        const elements = {
            soldNumbers: document.getElementById('soldNumbers'),
            totalRevenue: document.getElementById('totalRevenue'),
            availableNumbers: document.getElementById('availableNumbers'),
            totalBuyers: document.getElementById('totalBuyers'),
            activeReservations: document.getElementById('activeReservations')
        };

        if (elements.soldNumbers) elements.soldNumbers.textContent = stats.numbers.sold;
        if (elements.totalRevenue) elements.totalRevenue.textContent = Utils.formatPrice(stats.revenue.confirmed);
        if (elements.availableNumbers) elements.availableNumbers.textContent = stats.numbers.available;
        if (elements.totalBuyers) elements.totalBuyers.textContent = stats.buyers.unique;
        if (elements.activeReservations) elements.activeReservations.textContent = stats.reservations.active;
    },

    /**
     * Obtener iconos para categorías
     */
    getIcons: function() {
        return {
            interest: {
                'aprender': '🎓',
                'recreativo': '⛵',
                'ambos': '🎓⛵',
                'no': '❌'
            },
            member: {
                'si': '🏠',
                'no': '🚫'
            },
            activity: {
                'remo': '🚣',
                'ecologia': '🌱',
                'nautica': '⛵',
                'pesca': '🎣',
                'multiple': '🎆',
                'ninguna': '➖'
            }
        };
    },

    /**
     * Obtener análisis de ventas por periodo
     */
    getSalesAnalysis: function() {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todaySales = AppState.sales.filter(sale => 
            sale.date.toDateString() === today.toDateString()
        );

        const yesterdaySales = AppState.sales.filter(sale => 
            sale.date.toDateString() === yesterday.toDateString()
        );

        const weekSales = AppState.sales.filter(sale => 
            sale.date >= weekAgo
        );

        return {
            today: {
                count: todaySales.length,
                numbers: todaySales.reduce((sum, sale) => sum + sale.numbers.length, 0),
                revenue: todaySales.reduce((sum, sale) => sum + sale.total, 0)
            },
            yesterday: {
                count: yesterdaySales.length,
                numbers: yesterdaySales.reduce((sum, sale) => sum + sale.numbers.length, 0),
                revenue: yesterdaySales.reduce((sum, sale) => sum + sale.total, 0)
            },
            week: {
                count: weekSales.length,
                numbers: weekSales.reduce((sum, sale) => sum + sale.numbers.length, 0),
                revenue: weekSales.reduce((sum, sale) => sum + sale.total, 0)
            }
        };
    },

    /**
     * Exportar estadísticas detalladas
     */
    exportDetailedStats: function() {
        const stats = this.calculateMainStats();
        const analysis = this.getSalesAnalysis();
        const uniqueBuyers = this.getUniqueBuyers();

        if (!stats) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }

        let csvContent = "ESTADÍSTICAS DETALLADAS\n\n";
        
        // Estadísticas generales
        csvContent += "NÚMEROS\n";
        csvContent += `Vendidos,${stats.numbers.sold}\n`;
        csvContent += `Reservados,${stats.numbers.reserved}\n`;
        csvContent += `Disponibles,${stats.numbers.available}\n`;
        csvContent += `Total,${stats.numbers.total}\n`;
        csvContent += `Porcentaje vendido,${stats.numbers.soldPercentage}%\n\n`;

        // Ingresos
        csvContent += "INGRESOS\n";
        csvContent += `Confirmados,${stats.revenue.confirmed}\n`;
        csvContent += `Pendientes,${stats.revenue.pending}\n`;
        csvContent += `Total actual,${stats.revenue.total}\n`;
        csvContent += `Proyectado,${stats.revenue.projected}\n\n`;

        // Compradores
        csvContent += "COMPRADORES\n";
        csvContent += `Únicos,${stats.buyers.unique}\n`;
        csvContent += `Recurrentes,${stats.buyers.repeat}\n`;
        csvContent += `Promedio gastado,${stats.buyers.average.toFixed(2)}\n\n`;

        // Análisis por periodo
        csvContent += "ANÁLISIS POR PERIODO\n";
        csvContent += `Hoy - Ventas: ${analysis.today.count}, Números: ${analysis.today.numbers}, Ingresos: ${analysis.today.revenue}\n`;
        csvContent += `Ayer - Ventas: ${analysis.yesterday.count}, Números: ${analysis.yesterday.numbers}, Ingresos: ${analysis.yesterday.revenue}\n`;
        csvContent += `Última semana - Ventas: ${analysis.week.count}, Números: ${analysis.week.numbers}, Ingresos: ${analysis.week.revenue}\n\n`;

        // Top compradores
        csvContent += "TOP COMPRADORES\n";
        csvContent += "Nombre,Apellido,Compras,Números,Total Gastado\n";
        
        uniqueBuyers
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .forEach(buyer => {
                csvContent += `"${buyer.buyer.name}","${buyer.buyer.lastName}",${buyer.purchases.length},${buyer.totalNumbers},${buyer.totalSpent}\n`;
            });

        const filename = `estadisticas_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification('Estadísticas exportadas correctamente', 'success');
    }
};

console.log('✅ AdminStats cargado correctamente');