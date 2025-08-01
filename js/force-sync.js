/**
 * 🔄 Sistema de Sincronización Forzada con Supabase
 * Detecta resets y fuerza sincronización desde la base de datos
 */

(function() {
    'use strict';
    
    console.log('🔄 [SYNC] Sistema de sincronización forzada cargado');
    
    /**
     * Forzar sincronización completa desde Supabase
     */
    window.forceSyncFromSupabase = async function() {
        console.log('🔄 [SYNC] Iniciando sincronización forzada desde Supabase...');
        
        if (!window.SupabaseManager || !window.SupabaseManager.isConnected) {
            console.error('❌ [SYNC] Supabase no está conectado');
            alert('Error: Supabase no está conectado');
            return false;
        }
        
        try {
            // 1. Limpiar localStorage completamente
            console.log('🧹 [SYNC] Limpiando localStorage...');
            const keysToClean = [
                'raffleConfig',
                'raffleData', 
                'sales',
                'reservations',
                'assignments',
                'assignmentHolders',
                'numberOwners',
                'lastSyncTimestamp'
            ];
            
            keysToClean.forEach(key => {
                localStorage.removeItem(key);
                console.log(`  ✅ ${key} eliminado`);
            });
            
            // 2. Limpiar estado de la aplicación
            console.log('🔄 [SYNC] Limpiando estado de aplicación...');
            if (window.AppState) {
                window.AppState.raffleConfig = null;
                window.AppState.sales = [];
                window.AppState.reservations = [];
                window.AppState.assignments = [];
                window.AppState.assignmentHolders = [];
                window.AppState.numberOwners = [];
                window.AppState.selectedNumbers = [];
                window.AppState.currentAction = 'buy';
                window.AppState.selectedBuyer = null;
            }
            
            // 3. Forzar carga desde Supabase
            console.log('☁️ [SYNC] Cargando datos frescos desde Supabase...');
            await window.SupabaseManager.loadAllData();
            
            // 4. Verificar si Supabase está vacío (después de reset)
            const isEmpty = await checkIfSupabaseIsEmpty();
            
            if (isEmpty) {
                console.log('🆕 [SYNC] Supabase está vacío, inicializando rifa predefinida...');
                await initializePredefinedRaffleAfterReset();
            }
            
            // 5. Actualizar todas las interfaces
            console.log('🎨 [SYNC] Actualizando interfaces...');
            updateAllInterfaces();
            
            // 6. Marcar timestamp de sincronización
            localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
            
            console.log('✅ [SYNC] Sincronización forzada completada');
            
            // 7. Mostrar notificación al usuario
            if (window.Utils && window.Utils.showNotification) {
                window.Utils.showNotification('Datos sincronizados desde Supabase', 'success');
            }
            
            alert('✅ Sincronización completada!\n\nLos datos se han actualizado desde Supabase.');
            
            return true;
            
        } catch (error) {
            console.error('❌ [SYNC] Error durante sincronización forzada:', error);
            alert(`Error durante la sincronización: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Verificar si Supabase está vacío (después de reset)
     */
    async function checkIfSupabaseIsEmpty() {
        try {
            // Verificar tabla de configuración
            const { data: configData, error: configError } = await window.supabaseClient
                .from('raffles')
                .select('*')
                .limit(1);
            
            // Verificar tabla de ventas
            const { data: salesData, error: salesError } = await window.supabaseClient
                .from('sales')
                .select('*')
                .limit(1);
            
            if (configError || salesError) {
                console.log('⚠️ [SYNC] Error verificando vacío:', configError || salesError);
                return false; // Asumir que no está vacío si hay error
            }
            
            const isEmpty = (!configData || configData.length === 0) && 
                           (!salesData || salesData.length === 0);
            
            console.log('🔍 [SYNC] Supabase vacío:', isEmpty);
            return isEmpty;
            
        } catch (error) {
            console.error('❌ [SYNC] Error verificando si Supabase está vacío:', error);
            return false;
        }
    }
    
    /**
     * Inicializar rifa predefinida después de reset
     */
    async function initializePredefinedRaffleAfterReset() {
        try {
            if (window.AppConfig && window.ENV_RAFFLE_CONFIG) {
                console.log('🎫 [SYNC] Inicializando rifa predefinida...');
                
                // Crear configuración desde variables de entorno
                const predefinedConfig = {
                    id: 'current',
                    name: window.ENV_RAFFLE_CONFIG.name,
                    organization: window.ENV_RAFFLE_CONFIG.organization,
                    drawDate: new Date(window.ENV_RAFFLE_CONFIG.drawDate),
                    prize: window.ENV_RAFFLE_CONFIG.prize,
                    totalNumbers: window.ENV_RAFFLE_CONFIG.totalNumbers,
                    pricePerNumber: window.ENV_RAFFLE_CONFIG.pricePerNumber,
                    whatsappNumber: window.ENV_RAFFLE_CONFIG.whatsappNumber,
                    reservationTime: window.ENV_RAFFLE_CONFIG.reservationTime,
                    clubInstagram: window.ENV_RAFFLE_CONFIG.clubInstagram,
                    createdAt: new Date(),
                    isPredefined: true
                };
                
                // Asignar al estado
                window.AppState.raffleConfig = predefinedConfig;
                
                // Guardar en Supabase
                await window.SupabaseManager.saveRaffleConfig(predefinedConfig);
                
                // Actualizar header
                const title = document.getElementById('raffleTitle');
                const subtitle = document.getElementById('raffleSubtitle');
                
                if (title) title.textContent = predefinedConfig.name;
                if (subtitle) {
                    const drawDateFormatted = predefinedConfig.drawDate.toLocaleDateString();
                    subtitle.textContent = `${predefinedConfig.organization} - $${predefinedConfig.pricePerNumber} por número - Sorteo: ${drawDateFormatted}`;
                }
                
                console.log('✅ [SYNC] Rifa predefinida inicializada después del reset');
            }
        } catch (error) {
            console.error('❌ [SYNC] Error inicializando rifa predefinida:', error);
        }
    }
    
    /**
     * Actualizar todas las interfaces después de sincronización
     */
    function updateAllInterfaces() {
        try {
            // Actualizar números
            if (window.NumbersManager) {
                window.NumbersManager.updateDisplay();
                console.log('✅ [SYNC] Interfaz de números actualizada');
            }
            
            // Actualizar admin
            if (window.AdminManager) {
                window.AdminManager.updateInterface();
                console.log('✅ [SYNC] Interfaz de admin actualizada');
            }
            
            // Actualizar reportes
            if (window.ReportsManager) {
                window.ReportsManager.updateReports();
                console.log('✅ [SYNC] Reportes actualizados');
            }
            
            // Actualizar asignaciones
            if (window.AssignmentsManager) {
                window.AssignmentsManager.updateAssignmentsList();
                console.log('✅ [SYNC] Asignaciones actualizadas');
            }
            
        } catch (error) {
            console.error('❌ [SYNC] Error actualizando interfaces:', error);
        }
    }
    
    /**
     * Detectar automáticamente si necesita sincronización
     */
    window.autoDetectSyncNeeded = async function() {
        console.log('🔍 [SYNC] Detectando si se necesita sincronización...');
        
        if (!window.SupabaseManager || !window.SupabaseManager.isConnected) {
            console.log('⚠️ [SYNC] Supabase no disponible para auto-detección');
            return false;
        }
        
        try {
            // Verificar timestamp de última sincronización
            const lastSync = localStorage.getItem('lastSyncTimestamp');
            const now = new Date();
            
            if (!lastSync) {
                console.log('🔄 [SYNC] Primera vez, forzando sincronización...');
                return await forceSyncFromSupabase();
            }
            
            const lastSyncDate = new Date(lastSync);
            const timeDiff = now - lastSyncDate;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Si pasaron más de 2 horas, verificar cambios
            if (hoursDiff > 2) {
                console.log('🔄 [SYNC] Han pasado más de 2 horas, verificando cambios...');
                
                // Verificar si hay discrepancias entre local y Supabase
                const needsSync = await checkDataDiscrepancies();
                
                if (needsSync) {
                    console.log('🔄 [SYNC] Discrepancias detectadas, sincronizando...');
                    return await forceSyncFromSupabase();
                }
            }
            
            console.log('✅ [SYNC] No se necesita sincronización');
            return true;
            
        } catch (error) {
            console.error('❌ [SYNC] Error en auto-detección:', error);
            return false;
        }
    };
    
    /**
     * Verificar discrepancias entre datos locales y Supabase
     */
    async function checkDataDiscrepancies() {
        try {
            // Verificar ventas
            const { data: supabaseSales } = await window.supabaseClient
                .from('sales')
                .select('*');
            
            const localSales = window.AppState.sales || [];
            
            const supabaseCount = supabaseSales ? supabaseSales.length : 0;
            const localCount = localSales.length;
            
            console.log(`🔍 [SYNC] Ventas - Supabase: ${supabaseCount}, Local: ${localCount}`);
            
            // Si hay diferencia significativa, necesita sync
            if (Math.abs(supabaseCount - localCount) > 0) {
                console.log('⚠️ [SYNC] Discrepancia en ventas detectada');
                return true;
            }
            
            // Verificar configuración
            const { data: supabaseConfig } = await window.supabaseClient
                .from('raffles')
                .select('*')
                .eq('id', 'current')
                .single();
            
            const localConfig = window.AppState.raffleConfig;
            
            if (!supabaseConfig && localConfig) {
                console.log('⚠️ [SYNC] Config existe local pero no en Supabase');
                return true;
            }
            
            if (supabaseConfig && !localConfig) {
                console.log('⚠️ [SYNC] Config existe en Supabase pero no local');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ [SYNC] Error verificando discrepancias:', error);
            return true; // En caso de error, forzar sync
        }
    }
    
    /**
     * Ejecutar auto-detección al cargar la página
     */
    document.addEventListener('DOMContentLoaded', function() {
        // Esperar a que Supabase se inicialice
        setTimeout(() => {
            autoDetectSyncNeeded().catch(error => {
                console.error('❌ [SYNC] Error en auto-detección inicial:', error);
            });
        }, 3000);
    });
    
    /**
     * Crear botón de sincronización manual en la interfaz
     */
    function createSyncButton() {
        // Buscar dónde agregar el botón
        const dbStatus = document.getElementById('dbStatus');
        if (dbStatus && !document.getElementById('syncButton')) {
            const syncButton = document.createElement('button');
            syncButton.id = 'syncButton';
            syncButton.innerHTML = '🔄 Sincronizar';
            syncButton.style.cssText = `
                margin-left: 10px;
                padding: 5px 10px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            syncButton.onclick = function() {
                syncButton.disabled = true;
                syncButton.innerHTML = '🔄 Sincronizando...';
                
                forceSyncFromSupabase().finally(() => {
                    syncButton.disabled = false;
                    syncButton.innerHTML = '🔄 Sincronizar';
                });
            };
            
            dbStatus.appendChild(syncButton);
            console.log('✅ [SYNC] Botón de sincronización agregado');
        }
    }
    
    // Crear botón cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSyncButton);
    } else {
        setTimeout(createSyncButton, 1000);
    }
    
    console.log('🏁 [SYNC] Sistema de sincronización forzada configurado');
    console.log('📋 [SYNC] Comandos disponibles:');
    console.log('  forceSyncFromSupabase() - Sincronización forzada manual');
    console.log('  autoDetectSyncNeeded() - Auto-detección de sincronización');
})();
