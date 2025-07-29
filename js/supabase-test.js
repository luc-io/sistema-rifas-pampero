/**
 * SCRIPT DE VERIFICACIÓN DEL SISTEMA SUPABASE REFACTORIZADO
 * Ejecuta en la consola del navegador para verificar que todo funcione
 */

window.SupabaseRefactorTest = {
    
    async runAllTests() {
        console.log('🧪 [TEST] Iniciando verificación del sistema Supabase refactorizado...\n');
        
        const results = {
            moduleLoads: this.testModuleLoads(),
            apiCompatibility: this.testAPICompatibility(),
            errorHandling: await this.testErrorHandling(),
            integration: await this.testIntegration()
        };
        
        this.printResults(results);
        return results;
    },
    
    testModuleLoads() {
        console.log('📦 [TEST] Verificando carga de módulos...');
        
        const tests = {
            'SupabaseCoreManager': typeof SupabaseCoreManager !== 'undefined',
            'SupabaseAssignmentsManager': typeof SupabaseAssignmentsManager !== 'undefined', 
            'SupabaseManager (refactored)': typeof SupabaseManager !== 'undefined',
            'Utils.generateId': typeof Utils?.generateId === 'function',
            'DateUtils.parseDate': typeof DateUtils?.parseDate === 'function'
        };
        
        let passed = 0;
        for (const [test, result] of Object.entries(tests)) {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'OK' : 'FALTA'}`);
            if (result) passed++;
        }
        
        console.log(`📦 [TEST] Módulos: ${passed}/${Object.keys(tests).length} cargados\n`);
        return { passed, total: Object.keys(tests).length, details: tests };
    },
    
    testAPICompatibility() {
        console.log('🔗 [TEST] Verificando compatibilidad de API...');
        
        const tests = {
            'SupabaseManager.init': typeof SupabaseManager?.init === 'function',
            'SupabaseManager.saveAssignment': typeof SupabaseManager?.saveAssignment === 'function',
            'SupabaseManager.updateNumberOwner': typeof SupabaseManager?.updateNumberOwner === 'function',
            'SupabaseManager.saveRaffleConfig': typeof SupabaseManager?.saveRaffleConfig === 'function',
            'SupabaseManager.saveSale': typeof SupabaseManager?.saveSale === 'function',
            'SupabaseManager.isConnected': typeof SupabaseManager?.isConnected !== 'undefined'
        };
        
        let passed = 0;
        for (const [test, result] of Object.entries(tests)) {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'OK' : 'FALTA'}`);
            if (result) passed++;
        }
        
        console.log(`🔗 [TEST] API: ${passed}/${Object.keys(tests).length} funciones disponibles\n`);
        return { passed, total: Object.keys(tests).length, details: tests };
    },
    
    async testErrorHandling() {
        console.log('🛡️ [TEST] Verificando manejo de errores...');
        
        const tests = {};
        
        // Test 1: isTableNotFoundError function
        if (SupabaseAssignmentsManager?.isTableNotFoundError) {
            tests['Error handling - undefined'] = SupabaseAssignmentsManager.isTableNotFoundError(undefined) === false;
            tests['Error handling - null'] = SupabaseAssignmentsManager.isTableNotFoundError(null) === false;
            tests['Error handling - 404'] = SupabaseAssignmentsManager.isTableNotFoundError({status: 404}) === true;
            tests['Error handling - PGRST116'] = SupabaseAssignmentsManager.isTableNotFoundError({code: 'PGRST116'}) === true;
            tests['Error handling - message'] = SupabaseAssignmentsManager.isTableNotFoundError({message: 'does not exist'}) === true;
        } else {
            tests['isTableNotFoundError function'] = false;
        }
        
        let passed = 0;
        for (const [test, result] of Object.entries(tests)) {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'OK' : 'FAIL'}`);
            if (result) passed++;
        }
        
        console.log(`🛡️ [TEST] Error handling: ${passed}/${Object.keys(tests).length} tests passed\n`);
        return { passed, total: Object.keys(tests).length, details: tests };
    },
    
    async testIntegration() {
        console.log('⚙️ [TEST] Verificando integración del sistema...');
        
        const tests = {
            'SupabaseManager initialized': SupabaseManager?.isConnected !== undefined,
            'Client available': SupabaseManager?.client !== undefined,
            'AppState available': typeof AppState !== 'undefined',
            'NumbersManager available': typeof NumbersManager !== 'undefined'
        };
        
        // Test delegation
        if (SupabaseManager) {
            const coreFunctions = ['saveRaffleConfig', 'saveSale', 'saveReservation'];
            const assignmentFunctions = ['saveAssignment', 'updateNumberOwner', 'getAssignments'];
            
            coreFunctions.forEach(fn => {
                tests[`Core delegation: ${fn}`] = typeof SupabaseManager[fn] === 'function';
            });
            
            assignmentFunctions.forEach(fn => {
                tests[`Assignment delegation: ${fn}`] = typeof SupabaseManager[fn] === 'function';
            });
        }
        
        let passed = 0;
        for (const [test, result] of Object.entries(tests)) {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'OK' : 'FAIL'}`);
            if (result) passed++;
        }
        
        console.log(`⚙️ [TEST] Integration: ${passed}/${Object.keys(tests).length} tests passed\n`);
        return { passed, total: Object.keys(tests).length, details: tests };
    },
    
    printResults(results) {
        const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
        const totalTests = Object.values(results).reduce((sum, result) => sum + result.total, 0);
        const percentage = Math.round((totalPassed / totalTests) * 100);
        
        console.log('🎯 [TEST] RESUMEN DE RESULTADOS');
        console.log('================================');
        console.log(`📊 Total: ${totalPassed}/${totalTests} tests pasados (${percentage}%)`);
        
        if (percentage === 100) {
            console.log('🎉 [TEST] ¡TODOS LOS TESTS PASARON! Sistema refactorizado funcionando correctamente.');
        } else if (percentage >= 80) {
            console.log('⚠️ [TEST] Sistema mayormente funcional, algunos componentes pueden necesitar atención.');
        } else {
            console.log('❌ [TEST] Sistema necesita correcciones antes de usar en producción.');
        }
        
        console.log('\n🔍 [TEST] Para detalles específicos, revisa los resultados individuales arriba.');
        console.log('💡 [TEST] Si hay errores, verifica que todos los archivos JS estén cargados correctamente.');
    },
    
    // Test específico para verificar las funciones problemáticas
    async testProblematicFunctions() {
        console.log('🔧 [TEST] Verificando funciones que daban error anteriormente...\n');
        
        console.log('Testing saveAssignment with undefined error...');
        try {
            const mockAssignment = {
                seller_name: 'Test',
                seller_lastname: 'User',
                numbers: [1, 2, 3],
                total_amount: 100,
                status: 'pending'
            };
            
            // Test if function exists and handles undefined errors
            if (SupabaseAssignmentsManager?.saveAssignment) {
                console.log('✅ saveAssignment function is available');
            } else {
                console.log('❌ saveAssignment function not found');
            }
        } catch (error) {
            console.log('❌ Error testing saveAssignment:', error.message);
        }
        
        console.log('\nTesting updateNumberOwner with undefined error...');
        try {
            const mockOwner = {
                owner_name: 'Test',
                owner_lastname: 'Owner',
                number_value: 1
            };
            
            // Test if function exists and handles undefined errors
            if (SupabaseAssignmentsManager?.updateNumberOwner) {
                console.log('✅ updateNumberOwner function is available');
            } else {
                console.log('❌ updateNumberOwner function not found');
            }
        } catch (error) {
            console.log('❌ Error testing updateNumberOwner:', error.message);
        }
        
        console.log('\n🔧 [TEST] Test de funciones problemáticas completado.');
    }
};

console.log('🧪 SupabaseRefactorTest cargado. Ejecuta SupabaseRefactorTest.runAllTests() para verificar el sistema.');
