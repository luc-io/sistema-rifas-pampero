/**
 * 📱 Script para Actualizar Instagram del Club
 * Fuerza la actualización del Instagram desde variables de entorno
 */

(function() {
    'use strict';
    
    /**
     * Forzar actualización del Instagram del club
     */
    window.updateClubInstagram = function() {
        console.log('📱 [INSTAGRAM] Actualizando Instagram del club...');
        
        try {
            // 1. Verificar la configuración actual
            const currentConfig = window.ENV_RAFFLE_CONFIG;
            if (currentConfig) {
                console.log('📱 [INSTAGRAM] Instagram actual:', currentConfig.clubInstagram);
            }
            
            // 2. Si hay nueva configuración disponible (desde variables de entorno)
            if (window.ENV_RAFFLE_CONFIG && window.ENV_RAFFLE_CONFIG.clubInstagram) {
                const newInstagram = window.ENV_RAFFLE_CONFIG.clubInstagram;
                console.log('📱 [INSTAGRAM] Nuevo Instagram desde env:', newInstagram);
                
                // 3. Actualizar en el estado de la aplicación
                if (window.AppState && window.AppState.raffleConfig) {
                    window.AppState.raffleConfig.clubInstagram = newInstagram;
                    console.log('✅ [INSTAGRAM] Estado de aplicación actualizado');
                }
                
                // 4. Actualizar en localStorage
                const raffleConfig = JSON.parse(localStorage.getItem('raffleConfig') || '{}');
                if (raffleConfig) {
                    raffleConfig.clubInstagram = newInstagram;
                    localStorage.setItem('raffleConfig', JSON.stringify(raffleConfig));
                    console.log('✅ [INSTAGRAM] localStorage actualizado');
                }
                
                // 5. Si hay Supabase, actualizar también allí
                if (window.SupabaseManager && window.SupabaseManager.isConnected && window.AppState.raffleConfig) {
                    window.SupabaseManager.saveRaffleConfig(window.AppState.raffleConfig)
                        .then(() => {
                            console.log('✅ [INSTAGRAM] Supabase actualizado');
                        })
                        .catch(error => {
                            console.error('❌ [INSTAGRAM] Error actualizando Supabase:', error);
                        });
                }
                
                // 6. Actualizar interfaz si existe el campo
                const instagramField = document.getElementById('clubInstagram');
                if (instagramField) {
                    instagramField.value = newInstagram;
                    console.log('✅ [INSTAGRAM] Campo de interfaz actualizado');
                }
                
                // 7. Mostrar confirmación
                if (window.Utils && window.Utils.showNotification) {
                    window.Utils.showNotification(`Instagram actualizado a ${newInstagram}`, 'success');
                }
                
                alert(`✅ Instagram actualizado exitosamente!\n\nAntes: @vela.pnbe\nAhora: ${newInstagram}`);
                
                console.log('🎉 [INSTAGRAM] Actualización completada');
                return true;
                
            } else {
                console.log('⚠️ [INSTAGRAM] No se encontró nueva configuración de Instagram');
                alert('⚠️ No se encontró la nueva configuración de Instagram.\n\nVerifica que la variable RAFFLE_CLUB_INSTAGRAM esté configurada en Digital Ocean.');
                return false;
            }
            
        } catch (error) {
            console.error('❌ [INSTAGRAM] Error actualizando Instagram:', error);
            alert(`Error actualizando Instagram: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Verificar configuración actual de Instagram
     */
    window.checkInstagramConfig = function() {
        console.log('🔍 [INSTAGRAM] Verificando configuración de Instagram...');
        
        const sources = {
            'ENV_RAFFLE_CONFIG': window.ENV_RAFFLE_CONFIG?.clubInstagram,
            'AppState.raffleConfig': window.AppState?.raffleConfig?.clubInstagram,
            'localStorage': JSON.parse(localStorage.getItem('raffleConfig') || '{}').clubInstagram,
            'Campo interfaz': document.getElementById('clubInstagram')?.value
        };
        
        console.log('📊 [INSTAGRAM] Estado actual:');
        Object.entries(sources).forEach(([source, value]) => {
            console.log(`  ${source}: ${value || 'No configurado'}`);
        });
        
        // Mostrar en alerta también
        let summary = '📊 Estado actual del Instagram:\\n\\n';
        Object.entries(sources).forEach(([source, value]) => {
            summary += `${source}: ${value || 'No configurado'}\\n`;
        });
        
        alert(summary);
        
        return sources;
    };
    
    /**
     * Auto-ejecutar verificación al cargar
     */
    setTimeout(() => {
        if (window.ENV_RAFFLE_CONFIG) {
            console.log('📱 [INSTAGRAM] Verificación automática de Instagram...');
            const instagramConfig = window.ENV_RAFFLE_CONFIG.clubInstagram;
            
            if (instagramConfig && instagramConfig === '@pampero.pnbe') {
                console.log('✅ [INSTAGRAM] Instagram ya está actualizado a @pampero.pnbe');
            } else if (instagramConfig && instagramConfig === '@vela.pnbe') {
                console.log('⚠️ [INSTAGRAM] Instagram aún muestra valor anterior @vela.pnbe');
                console.log('🔄 [INSTAGRAM] EJECUTAR: updateClubInstagram() para actualizar');
            }
        }
    }, 2000);
    
    console.log('📱 [INSTAGRAM] Herramientas de Instagram cargadas');
    console.log('📋 [INSTAGRAM] Comandos disponibles:');
    console.log('  updateClubInstagram() - Actualizar Instagram');
    console.log('  checkInstagramConfig() - Verificar estado actual');
})();
