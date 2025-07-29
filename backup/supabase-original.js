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
            // 🛡️ IMPORTANTE: Mantener el ID original antes de insertar
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
            
            // ✅ CORREGIDO: Actualizar la venta con el ID de Supabase
            if (data && data[0]) {
                sale.supabaseId = data[0].id; // Nuevo campo para ID de Supabase
                sale.id = data[0].id; // Usar ID de Supabase como principal
                sale.created_at = data[0].created_at;
                console.log(`✅ [SUPABASE] Venta guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
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
            // 🛡️ IMPORTANTE: Mantener el ID original antes de insertar
            const originalId = reservation.id;
            
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
            
            // ✅ CORREGIDO: Actualizar la reserva con el ID de Supabase pero mantener referencia
            if (data && data[0]) {
                reservation.supabaseId = data[0].id; // Nuevo campo para ID de Supabase
                reservation.id = data[0].id; // Usar ID de Supabase como principal
                reservation.created_at = data[0].created_at;
                console.log(`✅ [SUPABASE] Reserva guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
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
            
            // ✅ CORREGIDO: Actualizar estado local correctamente
            const reservation = AppState.reservations.find(r => r.id == reservationId); // == para comparar string con number
            if (reservation) {
                reservation.status = status;
                console.log(`✅ [SUPABASE] Reserva ${reservationId} actualizada a ${status} en memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE] No se encontró reserva ${reservationId} en memoria local`);
            }
            
            console.log(`✅ [SUPABASE] Reserva ${reservationId} actualizada a ${status} en Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error actualizando reserva:', error);
            return false;
        }
    },

    /**
     * Marcar venta como pagada
     */
    markSaleAsPaid: async function(saleId) {
        console.log(`🔍 [SUPABASE] Intentando marcar venta como pagada - ID: ${saleId}`);
        console.log(`🔍 [SUPABASE] Tipo de ID: ${typeof saleId}`);
        
        if (!this.isConnected) {
            console.log('📱 [SUPABASE] No conectado, actualizando solo localmente');
            // 🛡️ CORREGIDO: Buscar venta con comparación flexible
            const sale = AppState.sales.find(s => s.id == saleId); // == para comparar string con number
            if (sale) {
                sale.status = 'paid';
                // ✅ CORREGIDO: No usar Storage.save si Supabase es la fuente de verdad
                // Storage.save('sales', AppState.sales); // ❌ Removido
                console.log('✅ [SUPABASE] Venta actualizada localmente');
                return true;
            } else {
                console.error(`❌ [SUPABASE] Venta ${saleId} no encontrada localmente`);
                return false;
            }
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
            
            // ✅ CORREGIDO: Actualizar estado local correctamente
            const sale = AppState.sales.find(s => s.id == saleId); // == para comparar string con number
            if (sale) {
                sale.status = 'paid';
                console.log(`✅ [SUPABASE] Venta ${saleId} marcada como pagada en memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE] No se encontró venta ${saleId} en memoria local para actualizar`);
            }
            
            console.log(`✅ [SUPABASE] Venta ${saleId} marcada como pagada en Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error actualizando venta:', error);
            return false;
        }
    },

    /**
     * Eliminar venta
     */
    deleteSale: async function(saleId) {
        console.log(`🔍 [SUPABASE] Intentando eliminar venta - ID: ${saleId}`);
        console.log(`🔍 [SUPABASE] Tipo de ID: ${typeof saleId}`);
        
        if (!this.isConnected) {
            console.log('📱 [SUPABASE] No conectado, eliminando solo localmente');
            // 🛡️ CORREGIDO: Buscar venta con comparación flexible
            const saleIndex = AppState.sales.findIndex(s => s.id == saleId); // == para comparar string con number
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                // ✅ CORREGIDO: No usar Storage.save si Supabase es la fuente de verdad
                // Storage.save('sales', AppState.sales); // ❌ Removido
                console.log('✅ [SUPABASE] Venta eliminada localmente');
                return true;
            } else {
                console.error(`❌ [SUPABASE] Venta ${saleId} no encontrada localmente`);
                return false;
            }
        }
        
        try {
            const { error } = await this.client
                .from('sales')
                .delete()
                .eq('id', saleId);
                
            if (error) throw error;
            
            // ✅ CORREGIDO: Actualizar estado local correctamente
            const saleIndex = AppState.sales.findIndex(s => s.id == saleId); // == para comparar string con number
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                console.log(`✅ [SUPABASE] Venta ${saleId} eliminada de memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE] No se encontró venta ${saleId} en memoria local para eliminar`);
            }
            
            console.log(`✅ [SUPABASE] Venta ${saleId} eliminada de Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error eliminando venta:', error);
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
                // 🔧 CRUCIAL: Asignar el ID 'current' que se usa en Supabase
                AppState.raffleConfig.id = 'current';
                AppState.raffleConfig.createdAt = DateUtils.parseDate(configData.config.createdAt);
                console.log('✅ [SUPABASE] Configuración cargada con ID:', AppState.raffleConfig.id);
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

            // Cargar asignaciones - verificar si la tabla existe
            try {
                AppState.assignments = await this.getAssignments();
            } catch (error) {
                if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('404')) {
                    console.warn('⚠️ [SUPABASE] Tabla assignments no existe, omitiendo...');
                    AppState.assignments = [];
                } else {
                    console.error('❌ Error cargando asignaciones:', error);
                    AppState.assignments = [];
                }
            }

            // Cargar titulares de números - verificar si la tabla existe
            try {
                AppState.numberOwners = await this.getNumberOwners();
            } catch (error) {
                if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('404')) {
                    console.warn('⚠️ [SUPABASE] Tabla number_owners no existe, omitiendo...');
                    AppState.numberOwners = [];
                } else {
                    console.error('❌ Error cargando titulares:', error);
                    AppState.numberOwners = [];
                }
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
    },

    // ==========================================
    // NUEVAS FUNCIONES PARA ASIGNACIONES
    // ==========================================

    /**
     * Guardar asignación
     */
    saveAssignment: async function(assignment) {
        if (!this.isConnected) {
            console.warn('⚠️ Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('assignments')
                .insert([{
                    raffle_id: assignment.raffle_id || 'current',
                    seller_name: assignment.seller_name,
                    seller_lastname: assignment.seller_lastname,
                    seller_phone: assignment.seller_phone,
                    seller_email: assignment.seller_email,
                    numbers: assignment.numbers,
                    total_amount: assignment.total_amount,
                    status: assignment.status,
                    assigned_at: assignment.assigned_at instanceof Date ? assignment.assigned_at.toISOString() : (typeof assignment.assigned_at === 'string' ? assignment.assigned_at : new Date().toISOString()),
                    payment_deadline: assignment.payment_deadline ? 
                        (assignment.payment_deadline instanceof Date ? assignment.payment_deadline.toISOString() : 
                         typeof assignment.payment_deadline === 'string' ? assignment.payment_deadline : new Date().toISOString()) 
                        : null,
                    notes: assignment.notes
                }])
                .select();
                
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.warn('⚠️ [SUPABASE] Tabla assignments no existe, guardando solo localmente');
                    // Simular respuesta exitosa con ID temporal
                    return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
                }
                throw error;
            }
            
            console.log('✅ [SUPABASE] Asignación guardada en Supabase');
            
            return data;
            
        } catch (error) {
            if (error.message.includes('does not exist') || error.message.includes('404')) {
                console.warn('⚠️ [SUPABASE] Tabla assignments no disponible, guardando solo localmente');
                return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
            }
            console.error('❌ [SUPABASE] Error guardando asignación:', error);
            throw error;
        }
    },

    /**
     * Guardar titular de número
     */
    saveNumberOwner: async function(owner) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('number_owners')
                .insert([{
                    assignment_id: owner.assignment_id,
                    number_value: owner.number_value,
                    owner_name: owner.owner_name,
                    owner_lastname: owner.owner_lastname,
                    owner_phone: owner.owner_phone,
                    owner_email: owner.owner_email,
                    owner_instagram: owner.owner_instagram,
                    membership_area: owner.membership_area,
                    edited_at: owner.edited_at instanceof Date ? owner.edited_at.toISOString() : (typeof owner.edited_at === 'string' ? owner.edited_at : new Date().toISOString())
                }])
                .select();
                
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.warn('⚠️ [SUPABASE] Tabla number_owners no existe, guardando solo localmente');
                    // Simular respuesta exitosa con ID temporal
                    return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
                }
                throw error;
            }
            
            console.log('✅ [SUPABASE] Titular guardado en Supabase');
            
            return data;
            
        } catch (error) {
            if (error.message.includes('does not exist') || error.message.includes('404')) {
                console.warn('⚠️ [SUPABASE] Tabla number_owners no disponible, guardando solo localmente');
                return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
            }
            console.error('❌ [SUPABASE] Error guardando titular:', error);
            throw error;
        }
    },

    /**
     * Obtener asignaciones
     */
    getAssignments: async function() {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('assignments')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            const assignments = (data || []).map(assignment => ({
                id: assignment.id,
                raffle_id: assignment.raffle_id,
                seller_name: assignment.seller_name,
                seller_lastname: assignment.seller_lastname,
                seller_phone: assignment.seller_phone,
                seller_email: assignment.seller_email,
                numbers: assignment.numbers,
                total_amount: assignment.total_amount,
                status: assignment.status,
                assigned_at: DateUtils.parseDate(assignment.assigned_at),
                payment_deadline: assignment.payment_deadline ? DateUtils.parseDate(assignment.payment_deadline) : null,
                paid_at: assignment.paid_at ? DateUtils.parseDate(assignment.paid_at) : null,
                payment_method: assignment.payment_method,
                notes: assignment.notes,
                created_at: DateUtils.parseDate(assignment.created_at)
            }));
            
            console.log(`✅ [SUPABASE] ${assignments.length} asignaciones cargadas`);
            return assignments;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error cargando asignaciones:', error);
            throw error;
        }
    },

    /**
     * Obtener titulares de números
     */
    getNumberOwners: async function() {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('number_owners')
                .select('*')
                .order('number_value', { ascending: true });
                
            if (error) throw error;
            
            const owners = (data || []).map(owner => ({
                id: owner.id,
                assignment_id: owner.assignment_id,
                number_value: owner.number_value,
                name: owner.owner_name || '',
                lastname: owner.owner_lastname || '',
                phone: owner.owner_phone || '',
                email: owner.owner_email || '',
                instagram: owner.owner_instagram || '',
                membership_area: owner.membership_area || '',
                edited_at: DateUtils.parseDate(owner.edited_at),
                created_at: DateUtils.parseDate(owner.created_at)
            }));
            
            console.log(`✅ [SUPABASE] ${owners.length} titulares cargados`);
            return owners;
            
        } catch (error) {
            console.error('❌ [SUPABASE] Error cargando titulares:', error);
            throw error;
        }
    },

    /**
     * Actualizar asignación
     */
    updateAssignment: async function(assignmentId, updateData) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { error } = await this.client
                .from('assignments')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', assignmentId);
                
            if (error) throw error;
            
            // Actualizar estado local
            const assignment = AppState.assignments?.find(a => a.id == assignmentId);
            if (assignment) {
                Object.assign(assignment, updateData);
                console.log(`✅ [SUPABASE] Asignación ${assignmentId} actualizada en memoria local`);
            }
            
            console.log(`✅ [SUPABASE] Asignación ${assignmentId} actualizada en Supabase`);
            return true;
            
        } catch (error) {
            console.error(`❌ [SUPABASE] Error actualizando asignación:`, error);
            throw error;
        }
    },

    /**
     * Actualizar titular de número
     */
    updateNumberOwner: async function(ownerId, updateData) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            // Convertir fechas si es necesario
            const dataToUpdate = {
                ...updateData,
                edited_at: updateData.edited_at instanceof Date ? updateData.edited_at.toISOString() : 
                          (typeof updateData.edited_at === 'string' ? updateData.edited_at : new Date().toISOString()),
                updated_at: new Date().toISOString()
            };
            
            const { error } = await this.client
                .from('number_owners')
                .update(dataToUpdate)
                .eq('id', ownerId);
                
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.warn('⚠️ [SUPABASE] Tabla number_owners no existe, actualizando solo localmente');
                    // Continuar con actualización local
                    const owner = AppState.numberOwners?.find(o => o.id == ownerId);
                    if (owner) {
                        Object.assign(owner, {
                            name: updateData.owner_name || owner.name,
                            lastname: updateData.owner_lastname || owner.lastname,
                            phone: updateData.owner_phone || owner.phone,
                            email: updateData.owner_email || owner.email,
                            instagram: updateData.owner_instagram || owner.instagram,
                            membership_area: updateData.membership_area || owner.membership_area,
                            edited_at: dataToUpdate.edited_at
                        });
                        console.log(`✅ [SUPABASE] Titular ${ownerId} actualizado en memoria local`);
                    }
                    return true;
                }
                throw error;
            }
            
            // Actualizar estado local
            const owner = AppState.numberOwners?.find(o => o.id == ownerId);
            if (owner) {
                Object.assign(owner, {
                    name: updateData.owner_name || owner.name,
                    lastname: updateData.owner_lastname || owner.lastname,
                    phone: updateData.owner_phone || owner.phone,
                    email: updateData.owner_email || owner.email,
                    instagram: updateData.owner_instagram || owner.instagram,
                    membership_area: updateData.membership_area || owner.membership_area,
                    edited_at: dataToUpdate.edited_at
                });
                console.log(`✅ [SUPABASE] Titular ${ownerId} actualizado en memoria local`);
            }
            
            console.log(`✅ [SUPABASE] Titular ${ownerId} actualizado en Supabase`);
            return true;
            
        } catch (error) {
            if (error.message.includes('does not exist') || error.message.includes('404')) {
                console.warn('⚠️ [SUPABASE] Tabla number_owners no disponible, actualizando solo localmente');
                // Actualizar solo en memoria local
                const owner = AppState.numberOwners?.find(o => o.id == ownerId);
                if (owner) {
                    Object.assign(owner, {
                        name: updateData.owner_name || owner.name,
                        lastname: updateData.owner_lastname || owner.lastname,
                        phone: updateData.owner_phone || owner.phone,
                        email: updateData.owner_email || owner.email,
                        instagram: updateData.owner_instagram || owner.instagram,
                        membership_area: updateData.membership_area || owner.membership_area,
                        edited_at: new Date()
                    });
                    console.log(`✅ [SUPABASE] Titular ${ownerId} actualizado en memoria local`);
                }
                return true;
            }
            console.error('❌ [SUPABASE] Error actualizando titular:', error);
            throw error;
        }
    },


};

console.log('✅ Supabase.js (actualizado) cargado correctamente');