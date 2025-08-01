/**
 * 🌐 Singleton de Supabase
 * Evita múltiples instancias del cliente
 */

(function() {
    'use strict';
    
    let supabaseInstance = null;
    let isInitialized = false;
    
    window.SupabaseSingleton = {
        /**
         * Obtener o crear instancia única de Supabase
         */
        getInstance: function() {
            return supabaseInstance;
        },
        
        /**
         * Inicializar Supabase una sola vez
         */
        initialize: function(url, key) {
            if (isInitialized && supabaseInstance) {
                console.log('🔄 [SUPABASE-SINGLETON] Instancia ya existe, reutilizando...');
                return supabaseInstance;
            }
            
            if (!url || !key) {
                console.error('❌ [SUPABASE-SINGLETON] URL o clave faltantes');
                return null;
            }
            
            if (typeof supabase === 'undefined') {
                console.error('❌ [SUPABASE-SINGLETON] SDK de Supabase no disponible');
                return null;
            }
            
            try {
                console.log('🆕 [SUPABASE-SINGLETON] Creando nueva instancia...');
                supabaseInstance = supabase.createClient(url, key);
                isInitialized = true;
                console.log('✅ [SUPABASE-SINGLETON] Instancia creada exitosamente');
                return supabaseInstance;
            } catch (error) {
                console.error('❌ [SUPABASE-SINGLETON] Error creando instancia:', error);
                return null;
            }
        },
        
        /**
         * Verificar si está inicializado
         */
        isInitialized: function() {
            return isInitialized;
        },
        
        /**
         * Resetear instancia (solo para debug)
         */
        reset: function() {
            console.warn('🔄 [SUPABASE-SINGLETON] Reseteando instancia...');
            supabaseInstance = null;
            isInitialized = false;
        }
    };
    
    console.log('🔧 [SUPABASE-SINGLETON] Singleton configurado');
})();
