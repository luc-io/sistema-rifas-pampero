/**
 * 🔧 Script de Diagnóstico y Limpieza
 * Para identificar y resolver problemas comunes
 */

(function() {
    'use strict';
    
    console.log('🔍 [DIAGNOSTICO] Script de diagnóstico cargado');
    
    // Ejecutar diagnósticos después de que la página se cargue
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runDiagnostics, 2000); // Esperar a que todo se inicialice
    });
    
    function runDiagnostics() {
        console.log('🔍 [DIAGNOSTICO] Iniciando diagnósticos automáticos...');
        
        try {
            checkEnvironmentVariables();
            checkSupabaseConnection();
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
    window.runSystemDiagnostics = function() {
        console.log('🔍 [DIAGNOSTICO] Ejecutando diagnósticos manuales...');
        runDiagnostics();
        
        // Mostrar resumen en una alerta
        setTimeout(() => {
            let summary = '📋 Resumen de Diagnósticos:\\n\\n';
            
            summary += `✅ Variables: ${window.ENV_RAFFLE_CONFIG ? 'OK' : 'FALTA'}\\n`;
            summary += `💾 Supabase: ${(window.SUPABASE_URL && window.SUPABASE_ANON_KEY) ? 'OK' : 'LOCAL'}\\n`;
            summary += `🎯 Inicialización: ${window.InitManager?.isInitialized() ? 'OK' : 'PENDIENTE'}\\n`;
            
            if (window.AppState?.raffleConfig) {
                summary += `🎫 Rifa: ${window.AppState.raffleConfig.name}\\n`;
            }
            
            alert(summary);
        }, 500);
    };
    
    console.log('🏁 [DIAGNOSTICO] Diagnóstico automático configurado');
})();
