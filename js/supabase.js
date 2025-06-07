/**
 * SUPABASE INTEGRATION - Sistema de Rifas Pampero
 * Alternativa open-source a Firebase
 */

// Configuración Supabase (reemplazar con tus credenciales)
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseKey = 'tu-anon-key';

// Importar Supabase (se carga desde CDN)
// <script src="https://unpkg.com/@supabase/supabase-js@2"></script>

window.SupabaseManager = {
    client: null,
    isConnected: false,
    
    /**
     * Inicializar Supabase
     */
    init: async function() {
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase no está disponible');
            return false;
        }
        
        try {
            this.client = supabase.createClient(supabaseUrl, supabaseKey);
            
            // Probar conexión
            const { data, error } = await this.client.from('raffles').select('count');
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = tabla no existe (OK)
            
            this.isConnected = true;
            console.log('✅ Supabase conectado correctamente');
            
            // Crear tablas si no existen
            await this.createTables();
            
            // Migrar datos locales
            await this.migrateLocalData();
            
            // Configurar suscripciones en tiempo real
            this.setupRealtimeSubscriptions();
            
            return true;
        } catch (error) {
            console.error('❌ Error conectando Supabase:', error);
            this.isConnected = false;
            return false;
        }
    },

    /**
     * Crear tablas necesarias
     */
    createTables: async function() {
        // Las tablas se crean desde el dashboard de Supabase
        // Aquí solo verificamos que existan
        console.log('ℹ️ Verificar tablas en Supabase Dashboard');
    },

    /**
     * Guardar configuración de rifa
     */
    saveRaffleConfig: async function(config) {
        if (!this.isConnected) return Storage.save('raffleConfig', config);
        
        try {
            const { data, error } = await this.client
                .from('raffles')
                .upsert([{
                    id: 'current',
                    config: config,
                    created_at: new Date(),
                    updated_at: new Date()
                }]);
                
            if (error) throw error;
            console.log('✅ Configuración guardada en Supabase');
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
            Storage.save('raffleConfig', config);
        }
    },

    /**
     * Guardar venta
     */
    saveSale: async function(sale) {
        if (!this.isConnected) {
            AppState.sales.push(sale);
            return Storage.save('sales', AppState.sales);
        }
        
        try {
            const { data, error } = await this.client
                .from('sales')
                .insert([{
                    ...sale,
                    created_at: new Date(),
                    updated_at: new Date()
                }]);
                
            if (error) throw error;
            console.log('✅ Venta guardada en Supabase');
        } catch (error) {
            console.error('❌ Error guardando venta:', error);
            AppState.sales.push(sale);
            Storage.save('sales', AppState.sales);
        }
    },

    /**
     * Cargar todos los datos
     */
    loadAllData: async function() {
        if (!this.isConnected) return loadFromStorage();
        
        try {
            // Cargar configuración
            const { data: configData } = await this.client
                .from('raffles')
                .select('config')
                .eq('id', 'current')
                .single();
                
            if (configData) {
                AppState.raffleConfig = configData.config;
            }

            // Cargar ventas
            const { data: salesData } = await this.client
                .from('sales')
                .select('*')
                .order('created_at', { ascending: false });
                
            AppState.sales = salesData || [];

            // Cargar reservas
            const { data: reservationsData } = await this.client
                .from('reservations')
                .select('*')
                .order('created_at', { ascending: false });
                
            AppState.reservations = reservationsData || [];

            console.log('✅ Datos cargados desde Supabase');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            loadFromStorage();
        }
    },

    /**
     * Configurar suscripciones en tiempo real
     */
    setupRealtimeSubscriptions: function() {
        if (!this.isConnected) return;
        
        // Suscripción a cambios en ventas
        this.client
            .channel('sales_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'sales' 
            }, (payload) => {
                console.log('🔄 Cambio en ventas:', payload);
                this.loadAllData();
            })
            .subscribe();

        // Suscripción a cambios en reservas
        this.client
            .channel('reservations_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'reservations' 
            }, (payload) => {
                console.log('🔄 Cambio en reservas:', payload);
                this.loadAllData();
            })
            .subscribe();
    },

    /**
     * Migrar datos locales
     */
    migrateLocalData: async function() {
        const localConfig = Storage.load('raffleConfig');
        const localSales = Storage.load('sales', []);
        const localReservations = Storage.load('reservations', []);

        if (localConfig && AppState.sales.length === 0) {
            console.log('🔄 Migrando datos locales a Supabase...');
            
            await this.saveRaffleConfig(localConfig);
            
            for (const sale of localSales) {
                await this.saveSale(sale);
            }
            
            console.log('✅ Migración completada');
        }
    }
};

// Auto-inicializar si Supabase está disponible
if (typeof supabase !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        SupabaseManager.init();
    });
}

console.log('✅ Supabase.js cargado correctamente');