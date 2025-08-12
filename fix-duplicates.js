/**
 * CORRECCIÓN DE DUPLICADOS EN RESERVAS Y VENTAS
 * Script para arreglar el problema de duplicación en Supabase
 */

function fixSupabaseDuplicates() {
    console.log('🔧 [FIX-DUPLICATES] Iniciando corrección de duplicados...');
    
    // =========================================
    // CORRECCIÓN 1: Arreglar saveSale en SupabaseCoreManager
    // =========================================
    if (window.SupabaseCoreManager) {
        const originalSaveSale = window.SupabaseCoreManager.saveSale;
        
        window.SupabaseCoreManager.saveSale = async function(sale) {
            if (!this.isConnected) {
                console.warn('⚠️ Supabase no conectado, rechazando guardado');
                throw new Error('Supabase no conectado');
            }
            
            try {
                const originalId = sale.id;
                
                const { data, error } = await this.client
                    .from('sales')
                    .insert([{
                        raffle_id: 'current',
                        numbers: sale.numbers,
                        buyer: sale.buyer,
                        payment_method: sale.paymentMethod,
                        total: sale.total,
                        status: sale.status,
                        created_at: new Date().toISOString()
                    }])
                    .select();
                    
                if (error) throw error;
                
                if (data && data[0]) {
                    sale.supabaseId = data[0].id;
                    sale.id = data[0].id;
                    sale.created_at = data[0].created_at;
                    console.log(`✅ [FIX-DUPLICATES] Venta guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
                }
                
                console.log('✅ [FIX-DUPLICATES] Venta guardada en Supabase');
                
                // 🔧 CORREGIDO: NO agregar al AppState aquí - se carga desde Supabase
                // AppState.sales.push(sale); // ❌ ELIMINADO para evitar duplicados
                
                // 🔄 NUEVO: Sincronización automática con Google Sheets
                if (window.syncWithGoogleSheets) {
                    console.log('🔄 [FIX-DUPLICATES] Iniciando auto-sync con Google Sheets...');
                    window.syncWithGoogleSheets();
                }
                
                return data;
                
            } catch (error) {
                console.error('❌ [FIX-DUPLICATES] Error guardando venta:', error);
                throw error;
            }
        };
        
        console.log('✅ [FIX-DUPLICATES] saveSale corregido');
    }
    
    // =========================================
    // CORRECCIÓN 2: Arreglar saveReservation en SupabaseCoreManager
    // =========================================
    if (window.SupabaseCoreManager) {
        const originalSaveReservation = window.SupabaseCoreManager.saveReservation;
        
        window.SupabaseCoreManager.saveReservation = async function(reservation) {
            if (!this.isConnected) {
                console.warn('⚠️ Supabase no conectado, rechazando guardado');
                throw new Error('Supabase no conectado');
            }
            
            try {
                const originalId = reservation.id;
                
                const { data, error } = await this.client
                    .from('reservations')
                    .insert([{
                        raffle_id: 'current',
                        numbers: reservation.numbers,
                        buyer: reservation.buyer,
                        total: reservation.total,
                        status: reservation.status,
                        expires_at: reservation.expiresAt instanceof Date ? 
                            reservation.expiresAt.toISOString() : 
                            new Date(reservation.expiresAt).toISOString(),
                        created_at: new Date().toISOString()
                    }])
                    .select();
                    
                if (error) throw error;
                
                if (data && data[0]) {
                    reservation.supabaseId = data[0].id;
                    reservation.id = data[0].id;
                    reservation.created_at = data[0].created_at;
                    console.log(`✅ [FIX-DUPLICATES] Reserva guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
                }
                
                console.log('✅ [FIX-DUPLICATES] Reserva guardada en Supabase');
                
                // 🔧 CORREGIDO: NO agregar al AppState aquí - se carga desde Supabase
                // AppState.reservations.push(reservation); // ❌ ELIMINADO para evitar duplicados
                
                // 🔄 NUEVO: Sincronización automática con Google Sheets
                if (window.syncWithGoogleSheets) {
                    console.log('🔄 [FIX-DUPLICATES] Iniciando auto-sync con Google Sheets (reserva)...');
                    window.syncWithGoogleSheets();
                }
                
                return data;
                
            } catch (error) {
                console.error('❌ [FIX-DUPLICATES] Error guardando reserva:', error);
                throw error;
            }
        };
        
        console.log('✅ [FIX-DUPLICATES] saveReservation corregido');
    }
    
    // =========================================
    // CORRECCIÓN 3: Reemplazar listeners en tiempo real por recarga inteligente
    // =========================================
    if (window.SupabaseManager && window.SupabaseManager.setupRealtimeListeners) {
        window.SupabaseManager.setupRealtimeListeners = function() {
            if (!this.isConnected) return;
            
            console.log('🔧 [FIX-DUPLICATES] Configurando listeners optimizados...');
            
            // Función de recarga inteligente que evita duplicados
            const smartReload = async () => {
                console.log('🔄 [FIX-DUPLICATES] Recarga inteligente iniciada...');
                
                try {
                    // Solo recargar lo necesario sin duplicar en memoria
                    const config = await SupabaseCoreManager.loadConfig();
                    if (config && !AppState.raffleConfig) {
                        AppState.raffleConfig = config;
                    }

                    const sales = await SupabaseCoreManager.loadSales();
                    AppState.sales = sales; // Reemplazar completamente para evitar duplicados

                    const reservations = await SupabaseCoreManager.loadReservations();
                    AppState.reservations = reservations; // Reemplazar completamente para evitar duplicados

                    console.log('✅ [FIX-DUPLICATES] Datos recargados sin duplicados');
                    
                    // Actualizar interfaz
                    if (typeof AdminManager !== 'undefined') AdminManager.updateInterface();
                    if (typeof NumbersManager !== 'undefined') NumbersManager.updateDisplay();
                    
                } catch (error) {
                    console.error('❌ [FIX-DUPLICATES] Error en recarga inteligente:', error);
                }
            };
            
            // Listener optimizado para ventas (con debounce)
            let salesTimeout;
            this.client
                .channel('sales_changes_optimized')
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'sales' 
                }, (payload) => {
                    console.log('🔄 [FIX-DUPLICATES] Cambio en ventas detectado:', payload);
                    
                    // Debounce para evitar recargas excesivas
                    clearTimeout(salesTimeout);
                    salesTimeout = setTimeout(smartReload, 1000);
                })
                .subscribe();

            // Listener optimizado para reservas (con debounce)
            let reservationsTimeout;
            this.client
                .channel('reservations_changes_optimized')
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'reservations' 
                }, (payload) => {
                    console.log('🔄 [FIX-DUPLICATES] Cambio en reservas detectado:', payload);
                    
                    // Debounce para evitar recargas excesivas
                    clearTimeout(reservationsTimeout);
                    reservationsTimeout = setTimeout(smartReload, 1000);
                })
                .subscribe();

            console.log('✅ [FIX-DUPLICATES] Listeners optimizados configurados');
        };
        
        console.log('✅ [FIX-DUPLICATES] setupRealtimeListeners corregido');
    }
    
    // =========================================
    // CORRECCIÓN 4: Mejorar migración de datos para evitar duplicados
    // =========================================
    if (window.SupabaseManager && window.SupabaseManager.migrateLocalData) {
        window.SupabaseManager.migrateLocalData = async function() {
            if (!this.isConnected) return;
            
            const localConfig = Storage.load('raffleConfig');
            const localSales = Storage.load('sales', []);
            const localReservations = Storage.load('reservations', []);

            // Solo migrar si hay datos locales
            if (localConfig || localSales.length > 0 || localReservations.length > 0) {
                console.log('🔄 [FIX-DUPLICATES] Verificando migración inteligente de datos locales...');
                
                try {
                    // Verificar si ya hay datos en Supabase
                    const { data: existingConfig } = await this.client
                        .from('raffles')
                        .select('id')
                        .eq('id', 'current')
                        .single();
                    
                    const { data: existingSales } = await this.client
                        .from('sales')
                        .select('id')
                        .eq('raffle_id', 'current')
                        .limit(1);
                    
                    const { data: existingReservations } = await this.client
                        .from('reservations')
                        .select('id')
                        .eq('raffle_id', 'current')
                        .limit(1);
                    
                    // Solo migrar si NO hay datos en Supabase
                    if (!existingConfig && localConfig) {
                        console.log('🔄 [FIX-DUPLICATES] Migrando configuración...');
                        await this.saveRaffleConfig(localConfig);
                    }
                    
                    if ((!existingSales || existingSales.length === 0) && localSales.length > 0) {
                        console.log('🔄 [FIX-DUPLICATES] Migrando ventas sin duplicar...');
                        for (const sale of localSales) {
                            try {
                                await this.saveSale(sale);
                            } catch (error) {
                                console.error('Error migrando venta:', error);
                            }
                        }
                    }
                    
                    if ((!existingReservations || existingReservations.length === 0) && localReservations.length > 0) {
                        console.log('🔄 [FIX-DUPLICATES] Migrando reservas sin duplicar...');
                        for (const reservation of localReservations) {
                            try {
                                await this.saveReservation(reservation);
                            } catch (error) {
                                console.error('Error migrando reserva:', error);
                            }
                        }
                    }
                    
                    console.log('✅ [FIX-DUPLICATES] Migración inteligente completada');
                    
                } catch (error) {
                    console.error('❌ [FIX-DUPLICATES] Error en migración:', error);
                }
            }
        };
        
        console.log('✅ [FIX-DUPLICATES] migrateLocalData corregido');
    }
    
    // =========================================
    // CORRECCIÓN 5: Función para limpiar duplicados existentes
    // =========================================
    window.cleanExistingDuplicates = function() {
        console.log('🧹 [FIX-DUPLICATES] Limpiando duplicados existentes en memoria...');
        
        // Limpiar duplicados en ventas
        const uniqueSales = [];
        const salesSeen = new Set();
        
        AppState.sales.forEach(sale => {
            const key = `${sale.buyer.name}-${sale.buyer.phone}-${sale.numbers.join(',')}-${sale.total}`;
            if (!salesSeen.has(key)) {
                salesSeen.add(key);
                uniqueSales.push(sale);
            }
        });
        
        console.log(`🧹 [FIX-DUPLICATES] Ventas: ${AppState.sales.length} → ${uniqueSales.length}`);
        AppState.sales = uniqueSales;
        
        // Limpiar duplicados en reservas
        const uniqueReservations = [];
        const reservationsSeen = new Set();
        
        AppState.reservations.forEach(reservation => {
            const key = `${reservation.buyer.name}-${reservation.buyer.phone}-${reservation.numbers.join(',')}-${reservation.total}`;
            if (!reservationsSeen.has(key)) {
                reservationsSeen.add(key);
                uniqueReservations.push(reservation);
            }
        });
        
        console.log(`🧹 [FIX-DUPLICATES] Reservas: ${AppState.reservations.length} → ${uniqueReservations.length}`);
        AppState.reservations = uniqueReservations;
        
        console.log('✅ [FIX-DUPLICATES] Duplicados en memoria limpiados');
        
        // Actualizar interfaz
        if (typeof AdminManager !== 'undefined') AdminManager.updateInterface();
        if (typeof NumbersManager !== 'undefined') NumbersManager.updateDisplay();
    };
    
    console.log('🎉 [FIX-DUPLICATES] Todas las correcciones aplicadas exitosamente');
    
    // Limpiar duplicados existentes inmediatamente
    window.cleanExistingDuplicates();
    
    // Mostrar notificación de éxito
    if (window.Utils && window.Utils.showNotification) {
        window.Utils.showNotification('✅ Problema de duplicados corregido', 'success', 5000);
    }
    
    return {
        success: true,
        correctionsApplied: 5,
        message: 'Problema de duplicación corregido completamente'
    };
}

// Ejecutar la corrección automáticamente cuando se carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fixSupabaseDuplicates, 2000);
    });
} else {
    setTimeout(fixSupabaseDuplicates, 2000);
}

// Hacer disponible globalmente para uso manual
window.fixSupabaseDuplicates = fixSupabaseDuplicates;

console.log('📋 [FIX-DUPLICATES] Script de corrección de duplicados cargado');
