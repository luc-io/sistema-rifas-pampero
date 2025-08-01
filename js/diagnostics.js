/**
 * 🔧 Script de Diagnóstico y Limpieza v2
 * Para identificar y resolver problemas comunes, incluye detección de reset
 */

(function() {
    'use strict';
    
    console.log('🔍 [DIAGNOSTICO] Script de diagnóstico v2 cargado');
    
    // Ejecutar diagnósticos después de que la página se cargue
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runDiagnostics, 2000); // Esperar a que todo se inicialice
    });
    
    async function runDiagnostics() {
        console.log('🔍 [DIAGNOSTICO] Iniciando diagnósticos automáticos...');
        
        try {
            checkEnvironmentVariables();
            checkSupabaseConnection();
            await checkSyncStatus(); // NUEVO: Verificar estado de sincronización
            checkMultipleInitializations();
            checkBrowserCompatibility();
            cleanupExpiredData();
            updateDatabaseStatus();
            
            console.log('✅ [DIAGNOSTICO] Diagnósticos completados');
        } catch (error) {
            console.error('❌ [DIAGNOSTICO] Error durante diagnósticos:', error);
        }
    }
    
    function checkEnvironmentVariables() {
        console.log('🔍 [DIAGNOSTICO] Verificando variables de entorno...');
        
        const checks = {
            'ENV_RAFFLE_CONFIG': window.ENV_RAFFLE_CONFIG,
            'ENV_PAYMENT_CONFIG': window.ENV_PAYMENT_CONFIG,
            'SUPABASE_URL': window.SUPABASE_URL,
            'SUPABASE_ANON_KEY': window.SUPABASE_ANON_KEY
        };
        
        for (const [name, value] of Object.entries(checks)) {
            if (value) {
                console.log(`✅ [DIAGNOSTICO] ${name}: Disponible`);
            } else {
                console.log(`⚠️ [DIAGNOSTICO] ${name}: No encontrada`);
            }
        }
        
        // Verificar caracteres especiales en configuración
        if (window.ENV_RAFFLE_CONFIG) {
            const org = window.ENV_RAFFLE_CONFIG.organization;
            if (org && org.includes('\\u00f1')) {
                console.log('✅ [DIAGNOSTICO] Caracteres especiales correctamente codificados');
            }
        }
    }
    
    function checkSupabaseConnection() {
        console.log('🔍 [DIAGNOSTICO] Verificando conexión a Supabase...');
        
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            console.log('⚠️ [DIAGNOSTICO] Supabase no configurado, usando localStorage');
            return;
        }
        
        // Verificar formato de URL
        if (!window.SUPABASE_URL.includes('supabase.co')) {
            console.error('❌ [DIAGNOSTICO] URL de Supabase inválida');
        }
        
        // Verificar formato de clave
        if (!window.SUPABASE_ANON_KEY.startsWith('eyJ')) {
            console.error('❌ [DIAGNOSTICO] Clave de Supabase inválida');
        }
        
        // Intentar conectar
        if (window.SupabaseManager && window.SupabaseManager.testConnection) {
            window.SupabaseManager.testConnection()
                .then(() => console.log('✅ [DIAGNOSTICO] Conexión a Supabase exitosa'))
                .catch(error => console.log('⚠️ [DIAGNOSTICO] Error de conexión:', error.message));
        }
    }
    
    /**
     * Verificar estado de sincronización con Supabase (NUEVO)
     */
    async function checkSyncStatus() {
        console.log('🔍 [DIAGNOSTICO] Verificando estado de sincronización...');
        
        if (!window.SupabaseManager || !window.SupabaseManager.isConnected) {
            console.log('⚠️ [DIAGNOSTICO] Supabase no conectado, omitiendo verificación de sync');
            return;
        }
        
        try {
            // Verificar timestamp de última sincronización
            const lastSync = localStorage.getItem('lastSyncTimestamp');
            if (!lastSync) {
                console.log('⚠️ [DIAGNOSTICO] Sin timestamp de sincronización - primera vez');
            } else {
                const lastSyncDate = new Date(lastSync);
                const now = new Date();
                const hoursDiff = (now - lastSyncDate) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) {
                    console.log(`⚠️ [DIAGNOSTICO] Última sincronización hace ${hoursDiff.toFixed(1)} horas`);
                } else {
                    console.log(`✅ [DIAGNOSTICO] Última sincronización hace ${hoursDiff.toFixed(1)} horas`);
                }
            }
            
            // Verificar discrepancias entre local y Supabase
            const { data: supabaseSales, count } = await window.supabaseClient
                .from('sales')
                .select('*', { count: 'exact', head: true });
            
            const localSales = window.AppState?.sales || [];
            const supabaseCount = count || 0;
            const localCount = localSales.length;
            
            console.log(`📊 [DIAGNOSTICO] Conteo de ventas - Supabase: ${supabaseCount}, Local: ${localCount}`);
            
            if (supabaseCount !== localCount) {
                console.log(`⚠️ [DIAGNOSTICO] DISCREPANCIA EN VENTAS DETECTADA!`);
                console.log(`🔄 [DIAGNOSTICO] ACCIÓN REQUERIDA: Ejecutar forceSyncFromSupabase()`);
                
                // Si Supabase está vacío pero hay datos locales, es probable reset
                if (supabaseCount === 0 && localCount > 0) {
                    console.log('🚨 [DIAGNOSTICO] POSIBLE RESET DE SUPABASE DETECTADO!');
                    console.log('🚨 [DIAGNOSTICO] Supabase vacío pero existen datos locales');
                    console.log('🔄 [DIAGNOSTICO] SOLUCIÓN: forceSyncFromSupabase() limpiará datos locales');
                    
                    // Mostrar alerta al usuario
                    if (typeof alert !== 'undefined') {
                        setTimeout(() => {
                            alert(
                                '🚨 RESET DE SUPABASE DETECTADO!\n\n' +
                                '❗ La base de datos está vacía pero tienes datos locales\n' +
                                '🔄 Usa el botón "Sincronizar" para actualizar\n' +
                                '📝 O ejecuta: forceSyncFromSupabase()'
                            );
                        }, 1000);
                    }
                }
            } else {
                console.log(`✅ [DIAGNOSTICO] Datos sincronizados correctamente`);
            }
            
        } catch (error) {
            console.warn('⚠️ [DIAGNOSTICO] Error verificando sincronización:', error);
        }
    }
    
    function checkMultipleInitializations() {
        console.log('🔍 [DIAGNOSTICO] Verificando múltiples inicializaciones...');
        
        // Buscar scripts duplicados
        const scripts = document.querySelectorAll('script[src]');
        const srcCounts = {};
        
        scripts.forEach(script => {
            const src = script.src;
            if (src) {
                srcCounts[src] = (srcCounts[src] || 0) + 1;
            }
        });
        
        let duplicates = false;
        Object.entries(srcCounts).forEach(([src, count]) => {
            if (count > 1) {
                console.warn(`⚠️ [DIAGNOSTICO] Script duplicado detectado: ${src} (${count} veces)`);
                duplicates = true;
            }
        });
        
        if (!duplicates) {
            console.log('✅ [DIAGNOSTICO] No se detectaron scripts duplicados');
        }
        
        // Verificar inicializaciones múltiples
        if (window.InitManager && window.InitManager.isInitialized()) {
            console.log('✅ [DIAGNOSTICO] Aplicación inicializada correctamente');
        }
    }
    
    function checkBrowserCompatibility() {
        console.log('🔍 [DIAGNOSTICO] Verificando compatibilidad del navegador...');
        
        const features = {
            'localStorage': typeof Storage !== 'undefined',
            'fetch': typeof fetch !== 'undefined',
            'Promise': typeof Promise !== 'undefined',
            'async/await': (function() {
                try {
                    return (async function(){})().constructor === Promise;
                } catch (e) {
                    return false;
                }
            })(),
            'ES6 Classes': (function() {
                try {
                    eval('class Test {}');
                    return true;
                } catch (e) {
                    return false;
                }
            })()
        };
        
        let allSupported = true;
        Object.entries(features).forEach(([name, supported]) => {
            if (supported) {
                console.log(`✅ [DIAGNOSTICO] ${name}: Soportado`);
            } else {
                console.error(`❌ [DIAGNOSTICO] ${name}: No soportado`);
                allSupported = false;
            }
        });
        
        if (allSupported) {
            console.log('✅ [DIAGNOSTICO] Navegador totalmente compatible');
        } else {
            console.warn('⚠️ [DIAGNOSTICO] Algunas características no están soportadas');
        }
    }
    
    function cleanupExpiredData() {
        console.log('🔍 [DIAGNOSTICO] Limpiando datos expirados...');
        
        try {
            // Limpiar localStorage de datos corruptos o muy antiguos
            const keysToCheck = ['raffleData', 'raffleConfig', 'sales', 'assignments'];
            let cleaned = 0;
            
            keysToCheck.forEach(key => {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        JSON.parse(data); // Verificar que sea JSON válido
                    }
                } catch (e) {
                    console.log(`🧹 [DIAGNOSTICO] Limpiando dato corrupto: ${key}`);
                    localStorage.removeItem(key);
                    cleaned++;
                }
            });
            
            if (cleaned > 0) {
                console.log(`🧹 [DIAGNOSTICO] ${cleaned} elementos corruptos limpiados`);
            } else {
                console.log('✅ [DIAGNOSTICO] No se encontraron datos corruptos');
            }
            
        } catch (error) {
            console.warn('⚠️ [DIAGNOSTICO] Error durante limpieza:', error);
        }
    }
    
    function updateDatabaseStatus() {
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
        }, 1000);
    }
    
    // Función para ejecutar diagnósticos manualmente
    window.runSystemDiagnostics = async function() {
        console.log('🔍 [DIAGNOSTICO] Ejecutando diagnósticos manuales...');
        await runDiagnostics();
        
        // Mostrar resumen en una alerta
        setTimeout(() => {
            let summary = '📋 Resumen de Diagnósticos:\\n\\n';
            
            summary += `✅ Variables: ${window.ENV_RAFFLE_CONFIG ? 'OK' : 'FALTA'}\\n`;
            summary += `💾 Supabase: ${(window.SUPABASE_URL && window.SUPABASE_ANON_KEY) ? 'OK' : 'LOCAL'}\\n`;
            summary += `🎯 Inicialización: ${window.InitManager?.isInitialized() ? 'OK' : 'PENDIENTE'}\\n`;
            
            if (window.AppState?.raffleConfig) {
                summary += `🎫 Rifa: ${window.AppState.raffleConfig.name}\\n`;
            }
            
            // Info de sincronización
            const lastSync = localStorage.getItem('lastSyncTimestamp');
            if (lastSync) {
                const hoursDiff = (new Date() - new Date(lastSync)) / (1000 * 60 * 60);
                summary += `🔄 Última sync: ${hoursDiff.toFixed(1)}h\\n`;
            } else {
                summary += `🔄 Sincronización: NUNCA\\n`;
            }
            
            // Conteo de datos
            const localSales = window.AppState?.sales?.length || 0;
            summary += `💰 Ventas locales: ${localSales}\\n`;
            
            summary += '\\n📋 Comandos disponibles:\\n';
            summary += '• forceSyncFromSupabase()\\n';
            summary += '• autoDetectSyncNeeded()\\n';
            summary += '• resetSupabaseDatabase()\\n';
            
            alert(summary);
        }, 500);
    };
    
    console.log('🏁 [DIAGNOSTICO] Diagnóstico automático v2 configurado');
    console.log('📋 [DIAGNOSTICO] Incluye detección de reset y sincronización');
})();
