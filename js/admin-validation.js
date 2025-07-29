/**
 * VALIDACIONES ADMINISTRATIVAS - Sistema de Rifas Pampero
 * Módulo especializado en validaciones de integridad y coherencia de datos
 */

window.AdminValidation = {
    /**
     * Validar que los números no estén ya vendidos
     */
    validateNumbersNotSold: function(numbers) {
        const soldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const duplicates = numbers.filter(num => soldNumbers.includes(num));
        
        return {
            isValid: duplicates.length === 0,
            duplicates: duplicates
        };
    },

    /**
     * Validar integridad completa de datos
     */
    validateDataIntegrity: function(showNotification = false) {
        const allSoldNumbers = [];
        const duplicateNumbers = [];
        
        // Recopilar todos los números vendidos
        AppState.sales.forEach(sale => {
            sale.numbers.forEach(number => {
                if (allSoldNumbers.includes(number)) {
                    if (!duplicateNumbers.includes(number)) {
                        duplicateNumbers.push(number);
                    }
                } else {
                    allSoldNumbers.push(number);
                }
            });
        });
        
        if (duplicateNumbers.length > 0) {
            console.warn('⚠️ [VALIDATION] Números duplicados detectados:', duplicateNumbers.map(n => Utils.formatNumber(n)));
            
            if (showNotification) {
                Utils.showNotification(
                    `⚠️ ${duplicateNumbers.length} números duplicados detectados. Usa "Corregir Duplicados" para solucionarlo.`, 
                    'warning'
                );
            }
            
            return {
                isValid: false,
                duplicates: duplicateNumbers,
                totalDuplicates: duplicateNumbers.length
            };
        }
        
        if (showNotification) {
            Utils.showNotification('✅ Integridad de datos verificada - Sin duplicados', 'success');
        }
        
        return { 
            isValid: true, 
            duplicates: [],
            totalDuplicates: 0
        };
    },

    /**
     * Prevenir números duplicados antes de operaciones
     */
    preventDuplicates: function(newNumbers) {
        const allSoldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const conflicts = newNumbers.filter(num => allSoldNumbers.includes(num));
        
        if (conflicts.length > 0) {
            Utils.showNotification(
                `❌ Números ya vendidos: ${conflicts.map(n => Utils.formatNumber(n)).join(', ')}`, 
                'error'
            );
            return false;
        }
        return true;
    },

    /**
     * Validar venta individual
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

        // Verificar datos básicos del comprador
        if (!sale.buyer || !sale.buyer.name || !sale.buyer.lastName || !sale.buyer.phone) {
            return { isValid: false, message: 'Datos del comprador incompletos' };
        }

        // Verificar que el total coincida
        const expectedTotal = sale.numbers.length * AppState.raffleConfig.price;
        if (Math.abs(sale.total - expectedTotal) > 0.01) {
            return { 
                isValid: false, 
                message: `Total incorrecto: esperado ${Utils.formatPrice(expectedTotal)}, actual ${Utils.formatPrice(sale.total)}` 
            };
        }

        return { isValid: true, message: 'Venta válida' };
    },

    /**
     * Validar reserva individual
     */
    validateReservation: function(reservationId) {
        const reservation = AppState.reservations.find(r => r.id == reservationId);
        if (!reservation) {
            return { isValid: false, message: 'Reserva no encontrada' };
        }

        // Verificar si está vencida
        if (Utils.isReservationExpired && Utils.isReservationExpired(reservation)) {
            return { isValid: false, message: 'Reserva vencida' };
        }

        // Verificar números
        const numberValidation = this.validateNumbersNotSold(reservation.numbers);
        if (!numberValidation.isValid) {
            return { 
                isValid: false, 
                message: `Números ya vendidos: ${numberValidation.duplicates.map(n => Utils.formatNumber(n)).join(', ')}` 
            };
        }

        return { isValid: true, message: 'Reserva válida' };
    },

    /**
     * Validar configuración de rifa
     */
    validateRaffleConfig: function() {
        if (!AppState.raffleConfig) {
            return { isValid: false, message: 'No hay configuración de rifa' };
        }

        const config = AppState.raffleConfig;
        const errors = [];

        if (!config.name || config.name.trim().length === 0) {
            errors.push('Nombre de rifa requerido');
        }

        if (!config.totalNumbers || config.totalNumbers < 100 || config.totalNumbers > 10000) {
            errors.push('Cantidad de números debe estar entre 100 y 10,000');
        }

        if (!config.price || config.price <= 0) {
            errors.push('Precio por número debe ser mayor a 0');
        }

        if (!config.drawDate || config.drawDate <= new Date()) {
            errors.push('Fecha de sorteo debe ser futura');
        }

        if (!config.organization || config.organization.trim().length === 0) {
            errors.push('Organización requerida');
        }

        if (!config.whatsappNumber || config.whatsappNumber.trim().length === 0) {
            errors.push('Número de WhatsApp requerido');
        }

        return {
            isValid: errors.length === 0,
            message: errors.length > 0 ? errors.join('; ') : 'Configuración válida',
            errors: errors
        };
    },

    /**
     * Ejecutar todas las validaciones del sistema
     */
    runSystemValidations: function() {
        const results = {
            dataIntegrity: this.validateDataIntegrity(),
            raffleConfig: this.validateRaffleConfig(),
            sales: [],
            reservations: [],
            summary: {
                totalErrors: 0,
                totalWarnings: 0,
                isSystemHealthy: true
            }
        };

        // Validar todas las ventas
        AppState.sales.forEach(sale => {
            const validation = this.validateSale(sale.id);
            if (!validation.isValid) {
                results.sales.push({
                    saleId: sale.id,
                    buyerName: `${sale.buyer.name} ${sale.buyer.lastName}`,
                    error: validation.message
                });
            }
        });

        // Validar todas las reservas activas
        AppState.reservations.filter(r => r.status === 'active').forEach(reservation => {
            const validation = this.validateReservation(reservation.id);
            if (!validation.isValid) {
                results.reservations.push({
                    reservationId: reservation.id,
                    buyerName: `${reservation.buyer.name} ${reservation.buyer.lastName}`,
                    error: validation.message
                });
            }
        });

        // Calcular resumen
        results.summary.totalErrors = results.sales.length + results.reservations.length;
        if (!results.dataIntegrity.isValid) results.summary.totalErrors++;
        if (!results.raffleConfig.isValid) results.summary.totalErrors++;

        results.summary.totalWarnings = results.dataIntegrity.duplicates.length;
        results.summary.isSystemHealthy = results.summary.totalErrors === 0;

        return results;
    },

    /**
     * Corregir duplicados automáticamente
     */
    fixDuplicates: function() {
        const integrity = this.validateDataIntegrity();
        
        if (!integrity.isValid) {
            console.log('🔧 [VALIDATION] Iniciando corrección automática de duplicados...');
            
            const duplicates = integrity.duplicates;
            const salesWithDuplicates = [];
            
            // Encontrar ventas que contienen números duplicados
            AppState.sales.forEach((sale, index) => {
                const duplicateNumbers = sale.numbers.filter(num => duplicates.includes(num));
                if (duplicateNumbers.length > 0) {
                    salesWithDuplicates.push({
                        saleIndex: index,
                        sale: sale,
                        duplicateNumbers: duplicateNumbers
                    });
                }
            });
            
            return salesWithDuplicates;
        } else {
            return [];
        }
    },

    /**
     * Remover duplicados de una venta específica
     */
    removeDuplicatesFromSale: function(saleIndex) {
        const sale = AppState.sales[saleIndex];
        if (!sale) return false;

        const integrity = this.validateDataIntegrity();
        const duplicates = integrity.duplicates;
        
        // Remover números duplicados
        const originalNumbers = [...sale.numbers];
        sale.numbers = sale.numbers.filter(num => !duplicates.includes(num));
        
        // Recalcular total
        sale.total = sale.numbers.length * AppState.raffleConfig.price;
        
        console.log(`🔧 [VALIDATION] Duplicados removidos de venta ${sale.id}:`, {
            original: originalNumbers,
            cleaned: sale.numbers,
            removed: originalNumbers.filter(n => !sale.numbers.includes(n))
        });
        
        return true;
    },

    /**
     * Verificar consistencia entre diferentes fuentes de datos
     */
    checkDataConsistency: function() {
        const inconsistencies = [];

        // Verificar que los números vendidos coincidan con los marcados en UI
        const soldInData = AppState.sales.flatMap(sale => sale.numbers);
        const soldInUI = [];
        
        // Recopilar números marcados como vendidos en UI
        for (let i = 0; i < AppState.raffleConfig.totalNumbers; i++) {
            const button = document.getElementById(`number-${i}`);
            if (button && button.classList.contains('sold')) {
                soldInUI.push(i);
            }
        }

        // Encontrar discrepancias
        const missingInUI = soldInData.filter(num => !soldInUI.includes(num));
        const extraInUI = soldInUI.filter(num => !soldInData.includes(num));

        if (missingInUI.length > 0) {
            inconsistencies.push({
                type: 'missing_in_ui',
                message: `Números vendidos en datos pero no marcados en UI: ${missingInUI.map(n => Utils.formatNumber(n)).join(', ')}`
            });
        }

        if (extraInUI.length > 0) {
            inconsistencies.push({
                type: 'extra_in_ui',
                message: `Números marcados en UI pero no en datos: ${extraInUI.map(n => Utils.formatNumber(n)).join(', ')}`
            });
        }

        return {
            isConsistent: inconsistencies.length === 0,
            inconsistencies: inconsistencies
        };
    }
};

console.log('✅ AdminValidation cargado correctamente');