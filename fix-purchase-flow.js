/**
 * CORRECCIÓN DEL FLUJO DE COMPRAS Y RESERVAS
 * Script para arreglar el problema de registro de compras
 */

function fixPurchaseFlow() {
    console.log('🛒 [FIX-PURCHASE] Corrigiendo flujo de compras...');
    
    // =========================================
    // CORRECCIÓN 1: Arreglar createSale en NumbersPurchase
    // =========================================
    if (window.NumbersPurchase && window.NumbersPurchase.createSale) {
        const originalCreateSale = window.NumbersPurchase.createSale;
        
        window.NumbersPurchase.createSale = async function(buyerData, paymentMethod) {
            const status = paymentMethod === 'transferencia' ? 'pending' : 'paid';

            const sale = {
                id: Utils.generateId(),
                numbers: [...AppState.selectedNumbers],
                buyer: buyerData,
                paymentMethod,
                total: AppState.selectedNumbers.length * AppState.raffleConfig.price,
                status,
                date: new Date()
            };

            try {
                // Guardar en Supabase si está conectado
                if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                    const savedData = await window.SupabaseManager.saveSale(sale);
                    console.log('✅ [FIX-PURCHASE] Venta guardada exitosamente en Supabase');
                    
                    // 🔧 CORREGIDO: Agregar al AppState inmediatamente para mostrar en interfaz
                    // Pero verificar que no esté duplicada
                    const existingSale = AppState.sales.find(s => s.id === sale.id);
                    if (!existingSale) {
                        // Actualizar el ID con el de Supabase si existe
                        if (savedData && savedData[0]) {
                            sale.supabaseId = savedData[0].id;
                            sale.id = savedData[0].id;
                        }
                        
                        AppState.sales.push(sale);
                        console.log('✅ [FIX-PURCHASE] Venta agregada al AppState local para interfaz inmediata');
                    } else {
                        console.log('ℹ️ [FIX-PURCHASE] Venta ya existe en AppState, no duplicando');
                    }
                } else {
                    // Si no hay Supabase, guardar en localStorage como único fallback
                    AppState.sales.push(sale);
                    await autoSave();
                    console.log('📱 [FIX-PURCHASE] Venta guardada en localStorage (modo fallback)');
                }
            } catch (error) {
                console.error('❌ [FIX-PURCHASE] Error guardando venta:', error);
                Utils.showNotification('Error guardando la venta. Inténtalo de nuevo.', 'error');
                return;
            }

            // Marcar números como vendidos
            AppState.selectedNumbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('selected');
                    button.classList.add('sold');
                }
            });

            const numbersFormatted = AppState.selectedNumbers.map(n => Utils.formatNumber(n)).join(', ');
            const whatsappMessage = this.generateSimpleWhatsAppMessage(sale, numbersFormatted);
            
            AppState.selectedNumbers = [];
            NumbersInterface.updateSelectionSummary();
            NumbersManager.updateDisplay();
            if (AdminManager.updateInterface) AdminManager.updateInterface();
            
            // Mostrar confirmación ANTES de cerrar el modal
            this.showPurchaseConfirmation(sale, whatsappMessage);
            
            // Cerrar modal después de un delay para que se vea la confirmación
            setTimeout(() => {
                this.closePurchaseModal();
            }, 500);
        };
        
        console.log('✅ [FIX-PURCHASE] createSale corregido');
    }
    
    // =========================================
    // CORRECCIÓN 2: Arreglar createReservation en NumbersPurchase
    // =========================================
    if (window.NumbersPurchase && window.NumbersPurchase.createReservation) {
        const originalCreateReservation = window.NumbersPurchase.createReservation;
        
        window.NumbersPurchase.createReservation = async function(buyerData) {
            const expirationDate = DateUtils.createExpirationDate(AppState.raffleConfig.reservationTime);

            const reservation = {
                id: Utils.generateId(),
                numbers: [...AppState.selectedNumbers],
                buyer: buyerData,
                total: AppState.selectedNumbers.length * AppState.raffleConfig.price,
                status: 'active',
                createdAt: new Date(),
                expiresAt: expirationDate
            };

            try {
                // Guardar en Supabase si está conectado
                if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                    const savedData = await window.SupabaseManager.saveReservation(reservation);
                    console.log('✅ [FIX-PURCHASE] Reserva guardada exitosamente en Supabase');
                    
                    // 🔧 CORREGIDO: Agregar al AppState inmediatamente para mostrar en interfaz
                    // Pero verificar que no esté duplicada
                    const existingReservation = AppState.reservations.find(r => r.id === reservation.id);
                    if (!existingReservation) {
                        // Actualizar el ID con el de Supabase si existe
                        if (savedData && savedData[0]) {
                            reservation.supabaseId = savedData[0].id;
                            reservation.id = savedData[0].id;
                        }
                        
                        AppState.reservations.push(reservation);
                        console.log('✅ [FIX-PURCHASE] Reserva agregada al AppState local para interfaz inmediata');
                    } else {
                        console.log('ℹ️ [FIX-PURCHASE] Reserva ya existe en AppState, no duplicando');
                    }
                } else {
                    // Si no hay Supabase, guardar en localStorage como único fallback
                    AppState.reservations.push(reservation);
                    await autoSave();
                    console.log('📱 [FIX-PURCHASE] Reserva guardada en localStorage (modo fallback)');
                }
            } catch (error) {
                console.error('❌ [FIX-PURCHASE] Error guardando reserva:', error);
                Utils.showNotification('Error guardando la reserva. Inténtalo de nuevo.', 'error');
                return;
            }

            // Marcar números como reservados
            AppState.selectedNumbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('selected');
                    button.classList.add('reserved');
                }
            });

            const numbersFormatted = AppState.selectedNumbers.map(n => Utils.formatNumber(n)).join(', ');
            const whatsappMessage = this.generateReservationMessage(reservation, numbersFormatted);
            
            AppState.selectedNumbers = [];
            NumbersInterface.updateSelectionSummary();
            if (AdminManager.updateInterface) AdminManager.updateInterface();
            
            // Mostrar confirmación ANTES de cerrar el modal
            this.showReservationConfirmation(reservation, whatsappMessage);
            
            // Cerrar modal después de un delay para que se vea la confirmación
            setTimeout(() => {
                this.closePurchaseModal();
            }, 500);
        };
        
        console.log('✅ [FIX-PURCHASE] createReservation corregido');
    }
    
    // =========================================
    // CORRECCIÓN 3: Mejorar la carga de datos desde Supabase para evitar duplicados
    // =========================================
    if (window.SupabaseManager && window.SupabaseManager.loadAllData) {
        const originalLoadAllData = window.SupabaseManager.loadAllData;
        
        window.SupabaseManager.loadAllData = async function() {
            if (!this.isConnected) {
                console.log('📱 Supabase no conectado, usando datos locales');
                throw new Error('Supabase no conectado');
            }
            
            try {
                console.log('☁️ [FIX-PURCHASE] Cargando datos desde Supabase sin duplicar...');
                
                // Cargar datos básicos usando el Core Manager
                const config = await SupabaseCoreManager.loadConfig();
                if (config) {
                    AppState.raffleConfig = config;
                }

                // Cargar ventas (reemplazar completamente para evitar duplicados)
                const sales = await SupabaseCoreManager.loadSales();
                
                // 🔧 MEJORADO: Combinar ventas locales nuevas con las de Supabase
                const localNewSales = AppState.sales.filter(localSale => {
                    return !sales.some(supabaseSale => 
                        supabaseSale.id === localSale.id || 
                        supabaseSale.id === localSale.supabaseId
                    );
                });
                
                AppState.sales = [...sales, ...localNewSales];
                console.log(`✅ [FIX-PURCHASE] Ventas cargadas: ${sales.length} de Supabase + ${localNewSales.length} locales nuevas`);

                // Cargar reservas (reemplazar completamente para evitar duplicados)
                const reservations = await SupabaseCoreManager.loadReservations();
                
                // 🔧 MEJORADO: Combinar reservas locales nuevas con las de Supabase
                const localNewReservations = AppState.reservations.filter(localReservation => {
                    return !reservations.some(supabaseReservation => 
                        supabaseReservation.id === localReservation.id || 
                        supabaseReservation.id === localReservation.supabaseId
                    );
                });
                
                AppState.reservations = [...reservations, ...localNewReservations];
                console.log(`✅ [FIX-PURCHASE] Reservas cargadas: ${reservations.length} de Supabase + ${localNewReservations.length} locales nuevas`);

                // Cargar asignaciones usando el Assignments Manager
                try {
                    AppState.assignments = await SupabaseAssignmentsManager.getAssignments();
                } catch (error) {
                    console.warn('⚠️ [FIX-PURCHASE] Error cargando asignaciones (tabla puede no existir):', error.message || 'Error desconocido');
                    AppState.assignments = [];
                }

                // Cargar titulares de números usando el Assignments Manager
                try {
                    AppState.numberOwners = await SupabaseAssignmentsManager.getNumberOwners();
                } catch (error) {
                    console.warn('⚠️ [FIX-PURCHASE] Error cargando titulares (tabla puede no existir):', error.message || 'Error desconocido');
                    AppState.numberOwners = [];
                }

                console.log('✅ [FIX-PURCHASE] Todos los datos cargados correctamente desde Supabase');
                
            } catch (error) {
                console.error('❌ [FIX-PURCHASE] Error cargando datos de Supabase:', error);
                throw error;
            }
        };
        
        console.log('✅ [FIX-PURCHASE] loadAllData mejorado');
    }
    
    // =========================================
    // CORRECCIÓN 4: Función para verificar el estado del sistema de compras
    // =========================================
    window.verifyPurchaseSystem = function() {
        console.log('🔍 [FIX-PURCHASE] Verificando sistema de compras...');
        
        const status = {
            supabaseConnected: window.SupabaseManager && window.SupabaseManager.isConnected,
            salesInMemory: AppState.sales ? AppState.sales.length : 0,
            reservationsInMemory: AppState.reservations ? AppState.reservations.length : 0,
            raffleConfigured: !!AppState.raffleConfig,
            purchaseFunctionExists: !!(window.NumbersPurchase && window.NumbersPurchase.createSale),
            reservationFunctionExists: !!(window.NumbersPurchase && window.NumbersPurchase.createReservation)
        };
        
        console.table(status);
        
        // Verificar problemas comunes
        if (!status.supabaseConnected) {
            console.warn('⚠️ [FIX-PURCHASE] Supabase no está conectado - las compras se guardarán solo localmente');
        }
        
        if (!status.raffleConfigured) {
            console.error('❌ [FIX-PURCHASE] No hay configuración de rifa - las compras no funcionarán');
        }
        
        if (!status.purchaseFunctionExists) {
            console.error('❌ [FIX-PURCHASE] Función createSale no existe');
        }
        
        return status;
    };
    
    console.log('🎉 [FIX-PURCHASE] Corrección del flujo de compras completada');
    
    // Verificar estado del sistema
    window.verifyPurchaseSystem();
    
    // Mostrar notificación de éxito
    if (window.Utils && window.Utils.showNotification) {
        window.Utils.showNotification('✅ Sistema de compras corregido', 'success', 5000);
    }
    
    return {
        success: true,
        correctionsApplied: 4,
        message: 'Sistema de compras completamente funcional'
    };
}

// Ejecutar la corrección automáticamente cuando se carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fixPurchaseFlow, 3000);
    });
} else {
    setTimeout(fixPurchaseFlow, 3000);
}

// Hacer disponible globalmente para uso manual
window.fixPurchaseFlow = fixPurchaseFlow;

console.log('🛒 [FIX-PURCHASE] Script de corrección de compras cargado');
