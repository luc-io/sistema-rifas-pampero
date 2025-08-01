/**
 * SUPABASE CORE - Sistema de Rifas Pampero
 * Funcionalidades básicas de Supabase (configuración, ventas, reservas)
 */

window.SupabaseCoreManager = {
    client: null,
    isConnected: false,
    
    /**
     * Inicializar Supabase con cliente existente
     */
    init: function(supabaseClient) {
        console.log('🔍 [SUPABASE-CORE] Iniciando SupabaseCoreManager.init...');
        console.log('🔍 [SUPABASE-CORE] Cliente recibido:', !!supabaseClient);
        
        this.client = supabaseClient;
        this.isConnected = true;
        
        console.log('🔍 [SUPABASE-CORE] Cliente asignado, isConnected =', this.isConnected);
        console.log('✅ SupabaseCoreManager inicializado');
        
        return true;
    },

    /**
     * Verifica si un error indica que la tabla no existe
     */
    isTableNotFoundError: function(error) {
        if (!error) return false;
        
        // Verificar diferentes propiedades del error
        const errorMessage = error.message || error.error_description || error.description || '';
        const errorCode = error.code || '';
        const errorDetails = error.details || '';
        
        // Casos comunes de tabla no encontrada
        return (
            errorCode === '42P01' ||
            errorCode === 'PGRST116' ||
            errorMessage.includes('does not exist') ||
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorDetails.includes('does not exist') ||
            error.status === 404
        );
    },

    /**
     * Migrar datos de comprador (compatibilidad hacia atrás)
     */
    migrateBuyerData: function(buyer) {
        if (!buyer) return buyer;
        
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
        console.log('🔍 [SUPABASE-CORE] saveRaffleConfig llamado');
        console.log('🔍 [SUPABASE-CORE] isConnected =', this.isConnected);
        console.log('🔍 [SUPABASE-CORE] client existe =', !!this.client);
        
        if (!this.isConnected) {
            console.warn('⚠️ Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
            console.log('🔍 [SUPABASE-CORE] Intentando upsert en tabla raffles...');
            
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
                console.error('🔴 [SUPABASE-CORE] Error en upsert:', error);
                throw error;
            }
            
            console.log('✅ [SUPABASE-CORE] Configuración guardada en Supabase exitosamente');
            console.log('📊 [SUPABASE-CORE] Datos guardados:', data);
            
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error guardando configuración:', error);
            console.error('📊 [SUPABASE-CORE] Detalles del error:', {
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
                console.log(`✅ [SUPABASE-CORE] Venta guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
            }
            
            console.log('✅ [SUPABASE-CORE] Venta guardada en Supabase');
            AppState.sales.push(sale);
            
            // 🔄 NUEVO: Sincronización automática con Google Sheets
            if (window.syncWithGoogleSheets) {
                console.log('🔄 [SUPABASE-CORE] Iniciando auto-sync con Google Sheets...');
                window.syncWithGoogleSheets();
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error guardando venta:', error);
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
                console.log(`✅ [SUPABASE-CORE] Reserva guardada - ID original: ${originalId}, ID Supabase: ${data[0].id}`);
            }
            
            console.log('✅ [SUPABASE-CORE] Reserva guardada en Supabase');
            AppState.reservations.push(reservation);
            
            // 🔄 NUEVO: Sincronización automática con Google Sheets
            if (window.syncWithGoogleSheets) {
                console.log('🔄 [SUPABASE-CORE] Iniciando auto-sync con Google Sheets (reserva)...');
                window.syncWithGoogleSheets();
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error guardando reserva:', error);
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
            
            const reservation = AppState.reservations.find(r => r.id == reservationId);
            if (reservation) {
                reservation.status = status;
                console.log(`✅ [SUPABASE-CORE] Reserva ${reservationId} actualizada a ${status} en memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE-CORE] No se encontró reserva ${reservationId} en memoria local`);
            }
            
            console.log(`✅ [SUPABASE-CORE] Reserva ${reservationId} actualizada a ${status} en Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error actualizando reserva:', error);
            return false;
        }
    },

    /**
     * Marcar venta como pagada
     */
    markSaleAsPaid: async function(saleId) {
        console.log(`🔍 [SUPABASE-CORE] Intentando marcar venta como pagada - ID: ${saleId}`);
        
        if (!this.isConnected) {
            console.log('📱 [SUPABASE-CORE] No conectado, actualizando solo localmente');
            const sale = AppState.sales.find(s => s.id == saleId);
            if (sale) {
                sale.status = 'paid';
                console.log('✅ [SUPABASE-CORE] Venta actualizada localmente');
                return true;
            } else {
                console.error(`❌ [SUPABASE-CORE] Venta ${saleId} no encontrada localmente`);
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
            
            const sale = AppState.sales.find(s => s.id == saleId);
            if (sale) {
                sale.status = 'paid';
                console.log(`✅ [SUPABASE-CORE] Venta ${saleId} marcada como pagada en memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE-CORE] No se encontró venta ${saleId} en memoria local para actualizar`);
            }
            
            console.log(`✅ [SUPABASE-CORE] Venta ${saleId} marcada como pagada en Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error actualizando venta:', error);
            return false;
        }
    },

    /**
     * Eliminar venta
     */
    deleteSale: async function(saleId) {
        console.log(`🔍 [SUPABASE-CORE] Intentando eliminar venta - ID: ${saleId}`);
        
        if (!this.isConnected) {
            console.log('📱 [SUPABASE-CORE] No conectado, eliminando solo localmente');
            const saleIndex = AppState.sales.findIndex(s => s.id == saleId);
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                console.log('✅ [SUPABASE-CORE] Venta eliminada localmente');
                return true;
            } else {
                console.error(`❌ [SUPABASE-CORE] Venta ${saleId} no encontrada localmente`);
                return false;
            }
        }
        
        try {
            const { error } = await this.client
                .from('sales')
                .delete()
                .eq('id', saleId);
                
            if (error) throw error;
            
            const saleIndex = AppState.sales.findIndex(s => s.id == saleId);
            if (saleIndex !== -1) {
                AppState.sales.splice(saleIndex, 1);
                console.log(`✅ [SUPABASE-CORE] Venta ${saleId} eliminada de memoria local`);
            } else {
                console.warn(`⚠️ [SUPABASE-CORE] No se encontró venta ${saleId} en memoria local para eliminar`);
            }
            
            console.log(`✅ [SUPABASE-CORE] Venta ${saleId} eliminada de Supabase`);
            return true;
            
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error eliminando venta:', error);
            return false;
        }
    },

    /**
     * Cargar configuración desde Supabase
     */
    loadConfig: async function() {
        try {
            const { data: configData, error: configError } = await this.client
                .from('raffles')
                .select('config')
                .eq('id', 'current')
                .single();
                
            if (configError && configError.code !== 'PGRST116') {
                console.error('Error cargando configuración:', configError);
                return null;
            } else if (configData) {
                const config = configData.config;
                config.id = 'current';
                config.createdAt = DateUtils.parseDate(config.createdAt);
                console.log('✅ [SUPABASE-CORE] Configuración cargada con ID:', config.id);
                return config;
            }
            return null;
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error cargando configuración:', error);
            return null;
        }
    },

    /**
     * Cargar ventas desde Supabase
     */
    loadSales: async function() {
        try {
            const { data: salesData, error: salesError } = await this.client
                .from('sales')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (salesError) {
                console.error('Error cargando ventas:', salesError);
                return [];
            } else {
                const sales = (salesData || []).map(sale => ({
                    id: sale.id,
                    numbers: sale.numbers,
                    buyer: this.migrateBuyerData(sale.buyer),
                    paymentMethod: sale.payment_method,
                    total: sale.total,
                    status: sale.status,
                    date: DateUtils.parseDate(sale.created_at)
                }));
                console.log(`✅ [SUPABASE-CORE] ${sales.length} ventas cargadas`);
                return sales;
            }
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error cargando ventas:', error);
            return [];
        }
    },

    /**
     * Cargar reservas desde Supabase
     */
    loadReservations: async function() {
        try {
            const { data: reservationsData, error: reservationsError } = await this.client
                .from('reservations')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (reservationsError) {
                console.error('Error cargando reservas:', reservationsError);
                return [];
            } else {
                const reservations = (reservationsData || []).map(reservation => ({
                    id: reservation.id,
                    numbers: reservation.numbers,
                    buyer: this.migrateBuyerData(reservation.buyer),
                    total: reservation.total,
                    status: reservation.status,
                    createdAt: DateUtils.parseDate(reservation.created_at),
                    expiresAt: DateUtils.parseDate(reservation.expires_at)
                }));
                console.log(`✅ [SUPABASE-CORE] ${reservations.length} reservas cargadas`);
                return reservations;
            }
        } catch (error) {
            console.error('❌ [SUPABASE-CORE] Error cargando reservas:', error);
            return [];
        }
    }
};

console.log('✅ SupabaseCoreManager cargado correctamente');
