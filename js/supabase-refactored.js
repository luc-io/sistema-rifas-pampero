/**
 * SUPABASE MANAGER REFACTORIZADO - Sistema de Rifas Pampero
 * Coordinador principal que usa los módulos especializados
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
        
        // Inicializar módulos especializados
        SupabaseCoreManager.init(supabaseClient);
        SupabaseAssignmentsManager.init(supabaseClient, this.isConnected);
        
        console.log('🔍 [SUPABASE] Cliente asignado, isConnected =', this.isConnected);
        console.log('✅ SupabaseManager inicializado');
        
        // Migrar datos locales si existen
        this.migrateLocalData();
        
        // Configurar listeners en tiempo real
        this.setupRealtimeListeners();
        
        return true;
    },

    // ==========================================
    // DELEGACIÓN A MÓDULOS ESPECIALIZADOS
    // ==========================================

    // Funciones de configuración y ventas (delegadas al Core Manager)
    saveRaffleConfig: function(config) {
        return SupabaseCoreManager.saveRaffleConfig(config);
    },

    saveSale: function(sale) {
        return SupabaseCoreManager.saveSale(sale);
    },

    saveReservation: function(reservation) {
        return SupabaseCoreManager.saveReservation(reservation);
    },

    updateReservationStatus: function(reservationId, status) {
        return SupabaseCoreManager.updateReservationStatus(reservationId, status);
    },

    markSaleAsPaid: function(saleId) {
        return SupabaseCoreManager.markSaleAsPaid(saleId);
    },

    deleteSale: function(saleId) {
        return SupabaseCoreManager.deleteSale(saleId);
    },

    // Función de migración de datos (delegada al Core Manager)
    migrateBuyerData: function(buyer) {
        return SupabaseCoreManager.migrateBuyerData(buyer);
    },

    // Funciones de asignaciones (delegadas al Assignments Manager)
    saveAssignment: function(assignment) {
        return SupabaseAssignmentsManager.saveAssignment(assignment);
    },

    saveNumberOwner: function(owner) {
        return SupabaseAssignmentsManager.saveNumberOwner(owner);
    },

    getAssignments: function() {
        return SupabaseAssignmentsManager.getAssignments();
    },

    getNumberOwners: function() {
        return SupabaseAssignmentsManager.getNumberOwners();
    },

    updateAssignment: function(assignmentId, updateData) {
        return SupabaseAssignmentsManager.updateAssignment(assignmentId, updateData);
    },

    updateNumberOwner: function(ownerId, updateData) {
        return SupabaseAssignmentsManager.updateNumberOwner(ownerId, updateData);
    },

    // ==========================================
    // FUNCIONES CENTRALES
    // ==========================================

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
            
            // Cargar datos básicos usando el Core Manager
            const config = await SupabaseCoreManager.loadConfig();
            if (config) {
                AppState.raffleConfig = config;
            }

            const sales = await SupabaseCoreManager.loadSales();
            AppState.sales = sales;

            const reservations = await SupabaseCoreManager.loadReservations();
            AppState.reservations = reservations;

            // Cargar asignaciones usando el Assignments Manager
            try {
                AppState.assignments = await SupabaseAssignmentsManager.getAssignments();
            } catch (error) {
                console.warn('⚠️ [SUPABASE] Error cargando asignaciones (tabla puede no existir):', error.message || 'Error desconocido');
                AppState.assignments = [];
            }

            // Cargar titulares de números usando el Assignments Manager
            try {
                AppState.numberOwners = await SupabaseAssignmentsManager.getNumberOwners();
            } catch (error) {
                console.warn('⚠️ [SUPABASE] Error cargando titulares (tabla puede no existir):', error.message || 'Error desconocido');
                AppState.numberOwners = [];
            }

            console.log('✅ [SUPABASE] Todos los datos cargados desde Supabase');
            
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

console.log('✅ SupabaseManager (refactorizado) cargado correctamente');
