/**
 * SUPABASE INTEGRATION - Sistema de Rifas Pampero
 * Integración completa y funcional con Supabase
 */

window.SupabaseManager = {
    client: null,
    isConnected: false,
    
    /**
     * Inicializar Supabase con cliente existente
     */
    init: function(supabaseClient) {
        console.log('🔍 [SUPABASE] Iniciando SupabaseManager.init...');
        console.log('🔍 [SUPABASE] Cliente recibido:', !!supabaseClient);
        
        this.client = supabaseClient;
        this.isConnected = true;
        
        console.log('🔍 [SUPABASE] Cliente asignado, isConnected =', this.isConnected);
        console.log('✅ SupabaseManager inicializado');
        
        // Migrar datos locales si existen
        this.migrateLocalData();
        
        // Configurar listeners en tiempo real
        this.setupRealtimeListeners();
        
        return true;
    },

    /**
     * Migrar datos de comprador (compatibilidad hacia atrás)
     */
    migrateBuyerData: function(buyer) {
        // Si ya tiene membershipArea, no hacer nada
        if (buyer.membershipArea) {
            return buyer;
        }
        
        // Convertir estructura antigua a nueva
        if (buyer.isMember === 'si' && buyer.memberActivities) {
            const activityToArea = {
                'remo': 'remo',
                'ecologia': 'ecologia', 
                'nautica': 'nautica',
                'pesca': 'pesca',
                'multiple': 'ninguna',
                'ninguna': 'ninguna'
            };
            
            buyer.membershipArea = activityToArea[buyer.memberActivities] || 'ninguna';
        } else if (buyer.isMember === 'no') {
            buyer.membershipArea = 'no_socio';
        } else {
            buyer.membershipArea = 'no_socio';
        }
        
        return buyer;
    },

    /**
     * Guardar configuración de rifa
     */
    saveRaffleConfig: async function(config) {
        console.log('🔍 [SUPABASE] saveRaffleConfig llamado');
        console.log('🔍 [SUPABASE] isConnected =', this.isConnected);
        console.log('🔍 [SUPABASE] client existe =', !!this.client);
        
        if (!this.isConnected) {
            console.warn('⚠️ Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
            console.log('🔍 [SUPABASE] Intentando upsert en tabla raffles...');
            
            const { data, error } = await this.client
                .from('raffles')
                .upsert([{
                    id: 'current',
                    config: config,
                    updated_at: new Date().toISOString()
                }], {
                    onConflict: 'id'
                });
                
            if (error) {
                console.error('🔴 [SUPABASE] Error en upsert:', error);
                throw error;
            }
            
            console.log('✅ [SUPABASE] Configuración guardada en Supabase exitosamente');
            console.log('📊 [SUPABASE] Datos guardados:', data);
            
            // NO guardar en localStorage - Supabase es la única fuente de verdad
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error guardando configuración:', error);
            console.error('📊 [SUPABASE] Detalles del error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            
            throw error;
        }
    },

    /**
     * Guardar venta
     */
    saveSale: async function(sale) {
        if (!this.isConnected) {
            console.warn('⚠️ Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
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
            
            // Actualizar el sale con el ID de la base de datos
            if (data && data[0]) {
                sale.id = data[0].id;
                sale.created_at = data[0].created_at;
            }
            
            console.log('✅ [SUPABASE] Venta guardada en Supabase');
            
            // Actualizar estado local SOLO en memoria (no localStorage)
            AppState.sales.push(sale);
            
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error guardando venta:', error);
            throw error;
        }
    },

    /**
     * Guardar reserva
     */
    saveReservation: async function(reservation) {
        if (!this.isConnected) {
            console.warn('⚠️ Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('reservations')
                .insert([{
                    raffle_id: 'current',
                    numbers: reservation.numbers,
                    buyer: reservation.buyer,
                    total: reservation.total,
                    status: reservation.status,
                    expires_at: reservation.expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select();
                
            if (error) throw error;
            
            // Actualizar la reserva con el ID de la base de datos
            if (data && data[0]) {
                reservation.id = data[0].id;
                reservation.created_at = data[0].created_at;
            }
            
            console.log('✅ [SUPABASE] Reserva guardada en Supabase');
            
            // Actualizar estado local SOLO en memoria (no localStorage)
            AppState.reservations.push(reservation);
            
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error guardando reserva:', error);
            throw error;
        }
    },

    /**
     * Actualizar estado de reserva
     */
    updateReservationStatus: async function(reservationId, status) {
        if (!this.isConnected) return false;
        
        try {
            const { error } = await this.client
                .from('reservations')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reservationId);
                
            if (error) throw error;
            
            // Actualizar estado local
            const reservation = AppState.reservations.find(r => r.id === reservationId);
            if (reservation) {
                reservation.status = status;
                Storage.save('reservations', AppState.reservations);
            }
            
            console.log(`✅ Reserva ${reservationId} actualizada a ${status}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error actualizando reserva:', error);
            return false;
        }
    },

    /**
     * Marcar venta como pagada
     */
    markSaleAsPaid: async function(saleId) {
        if (!this.isConnected) {
            // Actualizar solo localmente
            const sale = AppState.sales.find(s => s.id === saleId);
            if (sale) {
                sale.status = 'paid';
                Storage.save('sales', AppState.sales);
            }
            return true;
        }
        
        try {
            const { error } = await this.client
                .from('sales')
                .update({ 
                    status: 'paid',
                    updated_at: new Date().toISOString()
                })
                .eq('id', saleId);
                
            if (error) throw error;
            
            // Actualizar estado local
            const sale = AppState.sales.find(s => s.id === saleId);
            if (sale) {
                sale.status = 'paid';
                Storage.save('sales', AppState.sales);
            }
            
            console.log(`✅ Venta ${saleId} marcada como pagada`);
            return true;
            
        } catch (error) {
            console.error('❌ Error actualizando venta:', error);
            return false;
        }
    },

    /**
     * Eliminar venta
     */
    deleteSale: async function(saleId) {
        if (!this.isConnected) {
            // Eliminar solo localmente
            const saleIndex = AppState.sales.findIndex(s => s.id === saleId);
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                Storage.save('sales', AppState.sales);
            }
            return true;
        }
        
        try {
            const { error } = await this.client
                .from('sales')
                .delete()
                .eq('id', saleId);
                
            if (error) throw error;
            
            // Actualizar estado local
            const saleIndex = AppState.sales.findIndex(s => s.id === saleId);
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                Storage.save('sales', AppState.sales);
            }
            
            console.log(`✅ Venta ${saleId} eliminada`);
            return true;
            
        } catch (error) {
            console.error('❌ Error eliminando venta:', error);
            return false;
        }
    },

    /**
     * Migrar datos de comprador (compatibilidad hacia atrás)
     */
    migrateBuyerData: function(buyer) {
        // Si ya tiene membershipArea, no hacer nada
        if (buyer.membershipArea) {
            return buyer;
        }
        
        // Convertir estructura antigua a nueva
        if (buyer.isMember === 'si' && buyer.memberActivities) {
            const activityToArea = {
                'remo': 'remo',
                'ecologia': 'ecologia', 
                'nautica': 'nautica',
                'pesca': 'pesca',
                'multiple': 'ninguna',
                'ninguna': 'ninguna'
            };
            
            buyer.membershipArea = activityToArea[buyer.memberActivities] || 'ninguna';
        } else if (buyer.isMember === 'no') {
            buyer.membershipArea = 'no_socio';
        } else {
            buyer.membershipArea = 'no_socio';
        }
        
        return buyer;
    },

    /**
     * Cargar todos los datos desde Supabase
     */
    loadAllData: async function() {
        if (!this.isConnected) {
            console.log('📱 Supabase no conectado, usando datos locales');
            throw new Error('Supabase no conectado');
        }
        
        try {
            console.log('☁️ [SUPABASE] Cargando todos los datos desde Supabase...');
            
            // Cargar configuración
            const { data: configData, error: configError } = await this.client
                .from('raffles')
                .select('config')
                .eq('id', 'current')
                .single();
                
            if (configError && configError.code !== 'PGRST116') {
                console.error('Error cargando configuración:', configError);
            } else if (configData) {
                AppState.raffleConfig = configData.config;
                AppState.raffleConfig.createdAt = DateUtils.parseDate(configData.config.createdAt);
                console.log('✅ [SUPABASE] Configuración cargada');
            }

            // Cargar ventas
            const { data: salesData, error: salesError } = await this.client
                .from('sales')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (salesError) {
                console.error('Error cargando ventas:', salesError);
            } else {
                AppState.sales = (salesData || []).map(sale => ({
                    id: sale.id,
                    numbers: sale.numbers,
                    buyer: this.migrateBuyerData(sale.buyer), // Migrar datos del comprador
                    paymentMethod: sale.payment_method,
                    total: sale.total,
                    status: sale.status,
                    date: DateUtils.parseDate(sale.created_at)
                }));
                console.log(`✅ [SUPABASE] ${AppState.sales.length} ventas cargadas`);
            }

            // Cargar reservas
            const { data: reservationsData, error: reservationsError } = await this.client
                .from('reservations')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (reservationsError) {
                console.error('Error cargando reservas:', reservationsError);
            } else {
                AppState.reservations = (reservationsData || []).map(reservation => ({
                    id: reservation.id,
                    numbers: reservation.numbers,
                    buyer: this.migrateBuyerData(reservation.buyer), // Migrar datos del comprador
                    total: reservation.total,
                    status: reservation.status,
                    createdAt: DateUtils.parseDate(reservation.created_at),
                    expiresAt: DateUtils.parseDate(reservation.expires_at)
                }));
                console.log(`✅ [SUPABASE] ${AppState.reservations.length} reservas cargadas`);
            }

            console.log('✅ [SUPABASE] Todos los datos cargados desde Supabase');
            
            // NO guardar en localStorage - mantener Supabase como única fuente de verdad
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error cargando datos de Supabase:', error);
            throw error;
        }
    },

    /**
     * Configurar listeners en tiempo real
     */
    setupRealtimeListeners: function() {
        if (!this.isConnected) return;
        
        // Listener para ventas
        this.client
            .channel('sales_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'sales' 
            }, (payload) => {
                console.log('🔄 Cambio en ventas:', payload);
                // Recargar datos cuando hay cambios
                this.loadAllData().then(() => {
                    if (typeof AdminManager !== 'undefined') AdminManager.updateInterface();
                    if (typeof NumbersManager !== 'undefined') NumbersManager.updateDisplay();
                });
            })
            .subscribe();

        // Listener para reservas
        this.client
            .channel('reservations_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'reservations' 
            }, (payload) => {
                console.log('🔄 Cambio en reservas:', payload);
                // Recargar datos cuando hay cambios
                this.loadAllData().then(() => {
                    if (typeof AdminManager !== 'undefined') AdminManager.updateInterface();
                    if (typeof NumbersManager !== 'undefined') NumbersManager.updateDisplay();
                });
            })
            .subscribe();

        console.log('🔄 Listeners de tiempo real configurados');
    },

    /**
     * Migrar datos locales a Supabase
     */
    migrateLocalData: async function() {
        if (!this.isConnected) return;
        
        const localConfig = Storage.load('raffleConfig');
        const localSales = Storage.load('sales', []);
        const localReservations = Storage.load('reservations', []);

        // Solo migrar si hay datos locales
        if (localConfig || localSales.length > 0 || localReservations.length > 0) {
            console.log('🔄 Verificando migración de datos locales...');
            
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
                
                // Solo migrar si no hay datos en Supabase
                if (!existingConfig && localConfig) {
                    console.log('🔄 Migrando configuración...');
                    await this.saveRaffleConfig(localConfig);
                }
                
                if ((!existingSales || existingSales.length === 0) && localSales.length > 0) {
                    console.log('🔄 Migrando ventas...');
                    for (const sale of localSales) {
                        try {
                            await this.saveSale(sale);
                        } catch (error) {
                            console.error('Error migrando venta:', error);
                        }
                    }
                }
                
                if (localReservations.length > 0) {
                    console.log('🔄 Migrando reservas...');
                    for (const reservation of localReservations) {
                        try {
                            await this.saveReservation(reservation);
                        } catch (error) {
                            console.error('Error migrando reserva:', error);
                        }
                    }
                }
                
                console.log('✅ Migración completada');
                
            } catch (error) {
                console.error('❌ Error en migración:', error);
            }
        }
    },

    /**
     * Obtener estadísticas de la base de datos
     */
    getStats: async function() {
        if (!this.isConnected) return null;
        
        try {
            const { data: salesCount } = await this.client
                .from('sales')
                .select('*', { count: 'exact', head: true })
                .eq('raffle_id', 'current');
                
            const { data: reservationsCount } = await this.client
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('raffle_id', 'current')
                .eq('status', 'active');
            
            return {
                totalSales: salesCount?.length || 0,
                activeReservations: reservationsCount?.length || 0,
                lastUpdate: new Date()
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
};

console.log('✅ Supabase.js (actualizado) cargado correctamente');