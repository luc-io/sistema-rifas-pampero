/**
 * VERIFICADOR DEL SISTEMA REFACTORIZADO
 * Ejecuta verificaciones automáticas para confirmar que el refactoring fue exitoso
 */

window.SystemVerifier = {
    /**
     * Ejecutar todas las verificaciones
     */
    runAllChecks: function() {
        console.log('🔍 [VERIFICACIÓN] Iniciando verificaciones del sistema refactorizado...');
        
        const results = {
            modules: this.checkModules(),
            functions: this.checkFunctions(),
            integration: this.checkIntegration(),
            ui: this.checkUI()
        };
        
        this.displayResults(results);
        return results;
    },
    
    /**
     * Verificar que todos los módulos estén cargados
     */
    checkModules: function() {
        const requiredModules = [
            'NumbersManager',
            'NumbersInterface', 
            'NumbersInfo',
            'NumbersPurchase',
            'NumbersAssignment'
        ];
        
        const results = {};
        
        requiredModules.forEach(module => {
            results[module] = {
                loaded: typeof window[module] !== 'undefined',
                type: typeof window[module]
            };
        });
        
        return results;
    },
    
    /**
     * Verificar funciones principales
     */
    checkFunctions: function() {
        const requiredFunctions = [
            'init',
            'createInterface', 
            'handleNumberClick',
            'openPurchaseModal',
            'openAssignmentModal',
            'showNumberInfo',
            'updateDisplay'
        ];
        
        const results = {};
        
        requiredFunctions.forEach(func => {
            results[func] = {
                exists: typeof NumbersManager[func] === 'function',
                delegated: NumbersManager[func] ? true : false
            };
        });
        
        return results;
    },
    
    /**
     * Verificar integración con el estado global
     */
    checkIntegration: function() {
        return {
            AppState: typeof AppState !== 'undefined',
            selectedNumbers: Array.isArray(AppState?.selectedNumbers),
            raffleConfig: typeof AppState?.raffleConfig === 'object',
            sales: Array.isArray(AppState?.sales),
            assignments: Array.isArray(AppState?.assignments),
            numberOwners: Array.isArray(AppState?.numberOwners)
        };
    },
    
    /**
     * Verificar elementos de UI
     */
    checkUI: function() {
        const requiredElements = [
            'numbersContent',
            'purchaseModal',
            'selectionSummary'
        ];
        
        const results = {};
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            results[elementId] = {
                exists: !!element,
                visible: element ? element.style.display !== 'none' : false
            };
        });
        
        return results;
    },
    
    /**
     * Mostrar resultados de las verificaciones
     */
    displayResults: function(results) {
        console.log('📊 [VERIFICACIÓN] Resultados:');
        
        // Verificar módulos
        const moduleCount = Object.keys(results.modules).length;
        const loadedModules = Object.values(results.modules).filter(m => m.loaded).length;
        console.log(`📦 Módulos: ${loadedModules}/${moduleCount} cargados`);
        
        // Verificar funciones
        const functionCount = Object.keys(results.functions).length;
        const workingFunctions = Object.values(results.functions).filter(f => f.exists).length;
        console.log(`⚙️ Funciones: ${workingFunctions}/${functionCount} disponibles`);
        
        // Verificar integración
        const integrationChecks = Object.values(results.integration).filter(Boolean).length;
        const totalIntegrationChecks = Object.keys(results.integration).length;
        console.log(`🔗 Integración: ${integrationChecks}/${totalIntegrationChecks} OK`);
        
        // Verificar UI
        const uiElements = Object.values(results.ui).filter(u => u.exists).length;
        const totalUIElements = Object.keys(results.ui).length;
        console.log(`🎨 UI: ${uiElements}/${totalUIElements} elementos encontrados`);
        
        // Resultado general
        const totalChecks = loadedModules + workingFunctions + integrationChecks + uiElements;
        const maxChecks = moduleCount + functionCount + totalIntegrationChecks + totalUIElements;
        const percentage = Math.round((totalChecks / maxChecks) * 100);
        
        if (percentage >= 90) {
            console.log(`✅ [VERIFICACIÓN] Sistema OK - ${percentage}% (${totalChecks}/${maxChecks})`);
        } else if (percentage >= 70) {
            console.log(`⚠️ [VERIFICACIÓN] Sistema con advertencias - ${percentage}% (${totalChecks}/${maxChecks})`);
        } else {
            console.log(`❌ [VERIFICACIÓN] Sistema con errores - ${percentage}% (${totalChecks}/${maxChecks})`);
        }
        
        return percentage;
    },
    
    /**
     * Test rápido de funcionalidad básica
     */
    quickTest: function() {
        console.log('🧪 [TEST] Ejecutando test rápido...');
        
        try {
            // Test 1: Inicialización
            if (typeof NumbersManager.init === 'function') {
                console.log('✅ [TEST] NumbersManager.init disponible');
            } else {
                throw new Error('NumbersManager.init no disponible');
            }
            
            // Test 2: Estado inicial
            if (typeof AppState !== 'undefined') {
                console.log('✅ [TEST] AppState disponible');
            } else {
                throw new Error('AppState no disponible');
            }
            
            // Test 3: Funciones delegadas
            const testFunctions = ['handleNumberClick', 'openPurchaseModal', 'openAssignmentModal'];
            testFunctions.forEach(func => {
                if (typeof NumbersManager[func] === 'function') {
                    console.log(`✅ [TEST] ${func} delegada correctamente`);
                } else {
                    throw new Error(`${func} no delegada correctamente`);
                }
            });
            
            console.log('🎉 [TEST] Todos los tests básicos pasaron');
            return true;
            
        } catch (error) {
            console.error('❌ [TEST] Error en test:', error.message);
            return false;
        }
    }
};

// Auto-ejecutar verificaciones cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.SystemVerifier) {
            SystemVerifier.runAllChecks();
            SystemVerifier.quickTest();
        }
    }, 2000); // Esperar 2 segundos para que todo se cargue
});

console.log('🔍 SystemVerifier cargado - Usa SystemVerifier.runAllChecks() para verificar el sistema');
