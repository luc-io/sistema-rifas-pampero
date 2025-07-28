/**
 * GESTIÓN DE BACKUP - Sistema de Rifas Pampero
 * Exportación, importación y validación de datos
 */

window.BackupManager = {
    /**
     * Exportar backup completo
     */
    exportFullBackup: function() {
        if (!AppState.raffleConfig) {
            Utils.showNotification('No hay datos para exportar', 'warning');
            return;
        }

        const backupData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            raffleConfig: AppState.raffleConfig,
            sales: AppState.sales,
            reservations: AppState.reservations,
            metadata: {
                totalSales: AppState.sales.length,
                totalReservations: AppState.reservations.length,
                totalRevenue: AppState.sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.total, 0)
            }
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `backup_rifa_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        // Actualizar información del último backup
        const lastBackupInfo = {
            date: new Date(),
            totalSales: AppState.sales.length,
            totalReservations: AppState.reservations.length
        };
        
        Storage.save('lastBackup', lastBackupInfo);
        this.updateLastBackupInfo();
        
        Utils.showNotification('Backup exportado correctamente', 'success');
    },

    /**
     * Activar selector de archivo para importar backup
     */
    importFullBackup: function() {
        document.getElementById('backupFileInput').click();
    },

    /**
     * Manejar importación de archivo de backup
     */
    handleBackupImport: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            Utils.showNotification('Por favor selecciona un archivo JSON válido', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                this.restoreFromBackup(backupData);
            } catch (error) {
                console.error('Error parsing backup file:', error);
                Utils.showNotification('Error al leer el archivo de backup', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Limpiar el input
        event.target.value = '';
    },

    /**
     * Restaurar datos desde backup
     */
    restoreFromBackup: function(backupData) {
        if (!backupData.raffleConfig) {
            Utils.showNotification('El archivo de backup no contiene una configuración válida', 'error');
            return;
        }

        if (!confirm('⚠️ ADVERTENCIA: Esto sobrescribirá todos los datos actuales. ¿Estás seguro?')) {
            return;
        }

        try {
            // Validar estructura básica
            if (!this.validateBackupStructure(backupData)) {
                Utils.showNotification('El archivo de backup tiene una estructura inválida', 'error');
                return;
            }

            // Restaurar configuración
            AppState.raffleConfig = {
                ...backupData.raffleConfig,
                createdAt: DateUtils.parseDate(backupData.raffleConfig.createdAt)
            };

            // Restaurar ventas
            AppState.sales = (backupData.sales || []).map(sale => ({
                ...sale,
                date: DateUtils.parseDate(sale.date)
            }));

            // Restaurar reservas
            AppState.reservations = (backupData.reservations || []).map(reservation => ({
                ...reservation,
                createdAt: DateUtils.parseDate(reservation.createdAt),
                expiresAt: DateUtils.parseDate(reservation.expiresAt)
            }));

            // Guardar en localStorage
            autoSave();

            // Actualizar interfaz
            this.updateAfterRestore();

            Utils.showNotification(`Backup restaurado correctamente. ${AppState.sales.length} ventas y ${AppState.reservations.length} reservas importadas.`, 'success');

        } catch (error) {
            console.error('Error restoring backup:', error);
            Utils.showNotification('Error al restaurar el backup', 'error');
        }
    },

    /**
     * Validar estructura del backup
     */
    validateBackupStructure: function(backupData) {
        // Validaciones básicas
        if (!backupData.raffleConfig) return false;
        if (!backupData.raffleConfig.name) return false;
        if (!backupData.raffleConfig.totalNumbers) return false;
        if (!backupData.raffleConfig.price) return false;

        // Validar arrays
        if (backupData.sales && !Array.isArray(backupData.sales)) return false;
        if (backupData.reservations && !Array.isArray(backupData.reservations)) return false;

        // Validar estructura de ventas
        if (backupData.sales) {
            for (const sale of backupData.sales) {
                if (!sale.id || !sale.numbers || !sale.buyer || !sale.total) return false;
                if (!sale.buyer.name || !sale.buyer.lastName || !sale.buyer.phone) return false;
            }
        }

        // Validar estructura de reservas
        if (backupData.reservations) {
            for (const reservation of backupData.reservations) {
                if (!reservation.id || !reservation.numbers || !reservation.buyer) return false;
                if (!reservation.buyer.name || !reservation.buyer.lastName) return false;
            }
        }

        return true;
    },

    /**
     * Actualizar interfaz después de restaurar
     */
    updateAfterRestore: function() {
        // Actualizar header
        document.getElementById('raffleTitle').textContent = AppState.raffleConfig.name;
        document.getElementById('raffleSubtitle').textContent = `${AppState.raffleConfig.organization} - ${Utils.formatPrice(AppState.raffleConfig.price)} por número`;
        
        // Llenar formulario de configuración
        const fields = {
            'raffleName': 'name',
            'prizeDescription': 'prize',
            'totalNumbers': 'totalNumbers',
            'pricePerNumber': 'price',
            'organizationName': 'organization',
            'whatsappNumber': 'whatsappNumber',
            'reservationTime': 'reservationTime'
        };

        Object.entries(fields).forEach(([fieldId, configKey]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = AppState.raffleConfig[configKey];
            }
        });

        // Recrear interfaces si existen las funciones
        if (typeof NumbersManager !== 'undefined') {
            NumbersManager.createInterface();
            NumbersManager.updateDisplay();
            NumbersManager.startReservationChecker();
        }
        
        if (typeof AdminManager !== 'undefined') {
            AdminManager.createInterface();
            AdminManager.updateInterface();
        }

        if (typeof ReportsManager !== 'undefined') {
            ReportsManager.updateReports();
        }
    },

    /**
     * Limpiar todos los datos
     */
    clearAllData: function() {
        if (!confirm('⚠️ PELIGRO: Esto eliminará TODOS los datos de manera permanente. ¿Estás absolutamente seguro?')) {
            return;
        }

        if (!confirm('Esta acción NO se puede deshacer. ¿Continuar?')) {
            return;
        }

        // Limpiar estado
        AppState.raffleConfig = null;
        AppState.selectedNumbers = [];
        AppState.sales = [];
        AppState.reservations = [];
        AppState.currentAction = 'buy';
        AppState.selectedBuyer = null;

        // Limpiar localStorage
        Storage.clear();

        // Recargar página para estado limpio
        setTimeout(() => {
            location.reload();
        }, 1000);

        Utils.showNotification('Todos los datos han sido eliminados', 'success');
    },

    /**
     * Validar integridad de datos
     */
    validateData: function() {
        const results = document.getElementById('dataValidationResult');
        let validationReport = '<h4>🔍 Resultado de Validación:</h4><ul>';
        let hasErrors = false;

        // Validar configuración
        if (!AppState.raffleConfig) {
            validationReport += '<li style="color: red;">❌ No hay configuración de rifa</li>';
            hasErrors = true;
        } else {
            validationReport += '<li style="color: green;">✅ Configuración de rifa válida</li>';
            
            // Validar campos requeridos
            const requiredFields = ['name', 'prize', 'totalNumbers', 'price', 'organization', 'whatsappNumber'];
            requiredFields.forEach(field => {
                if (!AppState.raffleConfig[field]) {
                    validationReport += `<li style="color: red;">❌ Falta campo requerido: ${field}</li>`;
                    hasErrors = true;
                }
            });
        }

        // Validar ventas
        if (AppState.sales.length === 0) {
            validationReport += '<li style="color: orange;">⚠️ No hay ventas registradas</li>';
        } else {
            validationReport += `<li style="color: green;">✅ ${AppState.sales.length} ventas encontradas</li>`;
            
            // Validar estructura de ventas
            AppState.sales.forEach((sale, index) => {
                if (!sale.id || !sale.numbers || !sale.buyer || !sale.total) {
                    validationReport += `<li style="color: red;">❌ Venta ${index + 1} tiene estructura inválida</li>`;
                    hasErrors = true;
                }
                
                if (!sale.buyer.name || !sale.buyer.lastName || !sale.buyer.phone) {
                    validationReport += `<li style="color: red;">❌ Venta ${index + 1} tiene datos de comprador incompletos</li>`;
                    hasErrors = true;
                }
            });
        }

        // Validar reservas
        const activeReservations = AppState.reservations.filter(r => r.status === 'active');
        if (activeReservations.length === 0) {
            validationReport += '<li style="color: blue;">ℹ️ No hay reservas activas</li>';
        } else {
            validationReport += `<li style="color: green;">✅ ${activeReservations.length} reservas activas</li>`;
            
            // Verificar reservas expiradas
            const expiredCount = activeReservations.filter(r => Utils.isReservationExpired(r)).length;
            if (expiredCount > 0) {
                validationReport += `<li style="color: orange;">⚠️ ${expiredCount} reservas están expiradas y deberían limpiarse</li>`;
            }
        }

        // Validar números duplicados
        const allSoldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const duplicateNumbers = allSoldNumbers.filter((number, index) => allSoldNumbers.indexOf(number) !== index);
        
        if (duplicateNumbers.length > 0) {
            validationReport += `<li style="color: red;">❌ Números vendidos duplicados: ${duplicateNumbers.join(', ')}</li>`;
            hasErrors = true;
        } else if (allSoldNumbers.length > 0) {
            validationReport += '<li style="color: green;">✅ No hay números duplicados en ventas</li>';
        }

        // Validar localStorage
        if (!Storage.isAvailable()) {
            validationReport += '<li style="color: red;">❌ LocalStorage no está disponible</li>';
            hasErrors = true;
        } else {
            validationReport += '<li style="color: green;">✅ LocalStorage disponible</li>';
        }

        validationReport += '</ul>';

        if (hasErrors) {
            validationReport += '<p style="color: red; font-weight: bold;">⚠️ Se encontraron errores que requieren atención</p>';
        } else {
            validationReport += '<p style="color: green; font-weight: bold;">✅ Todos los datos están íntegros</p>';
        }

        results.innerHTML = validationReport;
    },

    /**
     * Actualizar información del último backup
     */
    updateLastBackupInfo: function() {
        const lastBackup = Storage.load('lastBackup');
        const element = document.getElementById('lastBackupInfo');
        
        if (!element) return;

        if (lastBackup) {
            const backupDate = DateUtils.parseDate(lastBackup.date);
            element.textContent = `Último backup: ${Utils.formatDateTime(backupDate)} (${lastBackup.totalSales} ventas, ${lastBackup.totalReservations} reservas)`;
        } else {
            element.textContent = 'Último backup: Nunca';
        }
    },

    /**
     * Exportar solo configuración
     */
    exportConfigOnly: function() {
        if (!AppState.raffleConfig) {
            Utils.showNotification('No hay configuración para exportar', 'warning');
            return;
        }

        const configData = {
            version: '2.0',
            type: 'config-only',
            timestamp: new Date().toISOString(),
            raffleConfig: AppState.raffleConfig
        };

        const dataStr = JSON.stringify(configData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `config_${AppState.raffleConfig.name.replace(/\s+/g, '_')}_${DateUtils.formatForInput(new Date())}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        Utils.showNotification('Configuración exportada correctamente', 'success');
    },

    /**
     * Exportar solo ventas
     */
    exportSalesOnly: function() {
        if (AppState.sales.length === 0) {
            Utils.showNotification('No hay ventas para exportar', 'warning');
            return;
        }

        // Crear CSV más detallado para ventas
        let csvContent = "ID,Fecha,Nombre,Apellido,Teléfono,Email,Números,Cantidad,Total,Método de Pago,Estado,Interés Navegación,Es Socio,Actividades Club\n";
        
        AppState.sales.forEach(sale => {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(';');
            const row = [
                sale.id,
                Utils.formatDateTime(sale.date),
                `"${sale.buyer.name}"`,
                `"${sale.buyer.lastName}"`,
                `"${sale.buyer.phone}"`,
                `"${sale.buyer.email || ''}"`,
                `"${numbersFormatted}"`,
                sale.numbers.length,
                sale.total,
                `"${AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod}"`,
                `"${sale.status}"`,
                `"${AppConstants.INTEREST_LABELS[sale.buyer.navigationInterest] || 'No especificado'}"`,
                `"${AppConstants.MEMBER_LABELS[sale.buyer.isMember] || 'No especificado'}"`,
                `"${AppConstants.ACTIVITY_LABELS[sale.buyer.memberActivities] || 'No especificado'}"`
            ];
            
            csvContent += row.join(',') + '\n';
        });

        const filename = `ventas_detalladas_${DateUtils.formatForInput(new Date())}.csv`;
        Utils.downloadCSV(csvContent, filename);
        
        Utils.showNotification('Ventas exportadas correctamente', 'success');
    },

    /**
     * Inicializar información de backup al cargar
     */
    init: function() {
        this.updateLastBackupInfo();
    }
};

// Auto-ejecutar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        BackupManager.init();
    });
} else {
    BackupManager.init();
}

console.log('✅ Backup.js cargado correctamente');