/**
 * 🚀 Script de Inicialización Mejorado v2
 * Evita múltiples inicializaciones y maneja errores correctamente
 */

(function() {
    'use strict';
    
    // Banderas para evitar múltiples inicializaciones
    let isInitialized = false;
    let isInitializing = false;
    let initPromise = null;
    
    console.log('🎬 [INIT-MANAGER-V2] Script de inicialización cargado');
    
    /**
     * Función principal de inicialización (singleton)
     */
    async function initializeApp() {
        // Si ya se inicializó, no hacer nada
        if (isInitialized) {
            console.log('✅ [INIT-MANAGER-V2] Aplicación ya inicializada');
            return true;
        }
        
        // Si se está inicializando, esperar a que termine
        if (isInitializing && initPromise) {
            console.log('⏳ [INIT-MANAGER-V2] Esperando inicialización en curso...');
            return await initPromise;
        }
        
        // Marcar como iniciando
        isInitializing = true;
        
        // Crear promesa de inicialización
        initPromise = performInitialization();
        
        try {
            const result = await initPromise;
            isInitialized = true;
            isInitializing = false;
            console.log('✅ [INIT-MANAGER-V2] Aplicación inicializada correctamente');
            return result;
        } catch (error) {
            isInitializing = false;
            initPromise = null;
            console.error('❌ [INIT-MANAGER-V2] Error durante la inicialización:', error);
            showInitializationError(error);
            return false;
        }
    }
    
    /**
     * Realizar la inicialización real
     */
    async function performInitialization() {
        console.log('🚀 [INIT-MANAGER-V2] Iniciando aplicación...');
        
        // PASO 1: Verificar que las variables de entorno se hayan cargado
        console.log('🔧 [INIT-MANAGER-V2] Verificando configuración...');
        await waitForConfig();
        
        // PASO 2: Inicializar AppConfig una sola vez
        if (window.AppConfig && window.AppConfig.init && !window.AppConfig.isInitialized) {
            console.log('🔧 [INIT-MANAGER-V2] Inicializando AppConfig...');
            AppConfig.init();
            window.AppConfig.isInitialized = true;
        }
        
        // PASO 3: Inicializar Supabase con singleton
        console.log('💾 [INIT-MANAGER-V2] Inicializando Supabase...');
        await initSupabaseOnce();
        
        // PASO 4: Inicializar aplicación principal una sola vez
        if (window.RaffleApp && window.RaffleApp.init && !window.RaffleApp.isInitialized) {
            console.log('🎨 [INIT-MANAGER-V2] Inicializando interfaz...');
            await RaffleApp.init();
            window.RaffleApp.isInitialized = true;
        }
        
        // PASO 5: Cargar valores predeterminados
        loadDefaultValues();
        
        return true;
    }
    
    /**
     * Esperar a que se carguen las variables de configuración
     */
    function waitForConfig() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            function checkConfig() {
                attempts++;
                
                if (window.ENV_RAFFLE_CONFIG) {
                    console.log('✅ [INIT-MANAGER-V2] Variables de configuración cargadas');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.log('⚠️ [INIT-MANAGER-V2] Variables no encontradas, usando valores por defecto');
                    resolve();
                } else {
                    setTimeout(checkConfig, 100);
                }
            }
            
            checkConfig();
        });
    }
    
    /**
     * Inicializar Supabase una sola vez usando singleton
     */
    async function initSupabaseOnce() {
        // Verificar si ya hay un cliente Supabase
        if (window.supabaseClient || (window.SupabaseSingleton && window.SupabaseSingleton.isInitialized())) {
            console.log('✅ [INIT-MANAGER-V2] Supabase ya inicializado');
            return;
        }
        
        const maxRetries = 3;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                if (window.RaffleApp && window.RaffleApp.initSupabase) {
                    await RaffleApp.initSupabase();
                }
                console.log('✅ [INIT-MANAGER-V2] Supabase inicializado');
                return;
            } catch (error) {
                retries++;
                console.log(`⚠️ [INIT-MANAGER-V2] Intento ${retries}/${maxRetries} de Supabase falló:`, error.message);
                
                if (retries >= maxRetries) {
                    console.log('⚠️ [INIT-MANAGER-V2] Supabase no disponible, usando localStorage');
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    /**
     * Cargar valores predeterminados en el formulario
     */
    function loadDefaultValues() {
        try {
            if (window.ENV_RAFFLE_CONFIG) {
                const config = window.ENV_RAFFLE_CONFIG;
                
                const elements = {
                    raffleName: document.getElementById('raffleName'),
                    organizationName: document.getElementById('organizationName'),
                    totalNumbers: document.getElementById('totalNumbers'),
                    pricePerNumber: document.getElementById('pricePerNumber'),
                    reservationTime: document.getElementById('reservationTime'),
                    whatsappNumber: document.getElementById('whatsappNumber'),
                    clubInstagram: document.getElementById('clubInstagram'),
                    prizeDescription: document.getElementById('prizeDescription'),
                    drawDate: document.getElementById('drawDate')
                };
                
                // Rellenar formulario
                if (elements.raffleName) elements.raffleName.value = config.name || '';
                if (elements.organizationName) elements.organizationName.value = config.organization || '';
                if (elements.totalNumbers) elements.totalNumbers.value = config.totalNumbers || 1000;
                if (elements.pricePerNumber) elements.pricePerNumber.value = config.pricePerNumber || 2000;
                if (elements.reservationTime) elements.reservationTime.value = config.reservationTime || 108;
                if (elements.whatsappNumber) elements.whatsappNumber.value = config.whatsappNumber || '';
                if (elements.clubInstagram) elements.clubInstagram.value = config.clubInstagram || '';
                if (elements.prizeDescription) elements.prizeDescription.value = config.prize || '';
                
                if (elements.drawDate && config.drawDate) {
                    const date = new Date(config.drawDate);
                    const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                        .toISOString().slice(0, 16);
                    elements.drawDate.value = localDateTime;
                }
                
                console.log('✅ [INIT-MANAGER-V2] Formulario cargado con variables de entorno');
            }
            
            // Cargar información de pago
            if (window.ENV_PAYMENT_CONFIG) {
                const paymentConfig = window.ENV_PAYMENT_CONFIG;
                const elements = {
                    mpAlias: document.getElementById('mpAlias'),
                    mpCvu: document.getElementById('mpCvu'),
                    mpHolder: document.getElementById('mpHolder'),
                    mpCuit: document.getElementById('mpCuit')
                };
                
                if (elements.mpAlias) elements.mpAlias.textContent = paymentConfig.mpAlias || 'No configurado';
                if (elements.mpCvu) elements.mpCvu.textContent = paymentConfig.mpCvu || 'No configurado';
                if (elements.mpHolder) elements.mpHolder.textContent = paymentConfig.mpHolder || 'No configurado';
                if (elements.mpCuit) elements.mpCuit.textContent = paymentConfig.mpCuit || 'No configurado';
                
                console.log('✅ [INIT-MANAGER-V2] Información de pago cargada');
            }
        } catch (error) {
            console.warn('⚠️ [INIT-MANAGER-V2] Error cargando valores predeterminados:', error);
        }
    }
    
    /**
     * Mostrar error de inicialización
     */
    function showInitializationError(error) {
        const dbStatus = document.getElementById('dbStatus');
        if (dbStatus) {
            dbStatus.style.background = '#f8d7da';
            dbStatus.style.color = '#721c24';
            dbStatus.innerHTML = `⚠️ Error de inicialización: ${error.message}`;
        }
    }
    
    /**
     * Actualizar estado de conexión a base de datos
     */
    function updateConnectionStatus() {
        const dbStatus = document.getElementById('dbStatus');
        if (!dbStatus) return;
        
        setTimeout(() => {
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                dbStatus.style.background = '#d4edda';
                dbStatus.style.color = '#155724';
                dbStatus.innerHTML = '✅ Conectado a Supabase';
            } else {
                dbStatus.style.background = '#fff3cd';
                dbStatus.style.color = '#856404';
                dbStatus.innerHTML = '⚠️ Usando almacenamiento local (sin Supabase)';
            }
        }, 2000);
    }
    
    // Exponer funciones globalmente para depuración
    window.InitManager = {
        initialize: initializeApp,
        isInitialized: () => isInitialized,
        updateConnectionStatus: updateConnectionStatus,
        reset: function() {
            isInitialized = false;
            isInitializing = false;
            initPromise = null;
            console.log('🔄 [INIT-MANAGER-V2] Estado reseteado');
        }
    };
    
    // Deshabilitar inicializaciones múltiples en otros scripts
    let originalInit = null;
    if (window.RaffleApp && window.RaffleApp.init) {
        originalInit = window.RaffleApp.init;
        window.RaffleApp.init = function() {
            if (window.RaffleApp.isInitialized) {
                console.log('⚠️ [INIT-MANAGER-V2] Evitando re-inicialización de RaffleApp');
                return;
            }
            return originalInit.call(this);
        };
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeApp, 100);
        });
    } else {
        setTimeout(initializeApp, 100);
    }
    
    // Actualizar estado de conexión
    updateConnectionStatus();
    
    console.log('🏁 [INIT-MANAGER-V2] Gestor de inicialización v2 listo');
})();
