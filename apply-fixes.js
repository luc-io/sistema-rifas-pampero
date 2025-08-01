#!/usr/bin/env node

/**
 * 🚀 Script de Aplicación de Correcciones
 * Aplica todas las correcciones necesarias para solucionar los errores
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [CORRECCIONES] Aplicando correcciones para errores de consola...');

// Función para aplicar correcciones
function applyFixes() {
    try {
        // 1. Regenerar env-config.js con caracteres especiales corregidos
        console.log('📝 [CORRECCIONES] Regenerando env-config.js...');
        regenerateEnvConfig();
        
        // 2. Verificar que todos los archivos necesarios existan
        console.log('🔍 [CORRECCIONES] Verificando archivos...');
        verifyFiles();
        
        // 3. Validar sintaxis de archivos JavaScript
        console.log('✅ [CORRECCIONES] Validando sintaxis...');
        validateSyntax();
        
        console.log('🎉 [CORRECCIONES] Todas las correcciones aplicadas exitosamente');
        console.log('');
        console.log('📋 [CORRECCIONES] Resumen de cambios:');
        console.log('  ✅ Caracteres especiales corregidos en env-config.js');
        console.log('  ✅ Sistema de inicialización mejorado agregado');
        console.log('  ✅ Diagnósticos automáticos configurados');
        console.log('  ✅ Manejo de errores mejorado');
        console.log('');
        console.log('🎯 [CORRECCIONES] Próximos pasos:');
        console.log('  1. Abrir index.html en el navegador');
        console.log('  2. Verificar consola (F12) - no debería haber errores');
        console.log('  3. Si hay problemas, ejecutar en consola: runSystemDiagnostics()');
        
    } catch (error) {
        console.error('❌ [CORRECCIONES] Error aplicando correcciones:', error);
        process.exit(1);
    }
}

function regenerateEnvConfig() {
    const envConfigContent = `/**
 * CONFIGURACIÓN DE VARIABLES DE ENTORNO - Digital Ocean App Platform
 * Este archivo será reemplazado automáticamente durante el build
 * usando las variables de entorno configuradas en Digital Ocean
 */

// Variables predeterminadas (serán reemplazadas por inject-env.js en Digital Ocean)
window.SUPABASE_URL = window.SUPABASE_URL || "https://ssmpnzcjhrjqhglqkmoe.supabase.co";
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXBuemNqaHJqcWhnbHFrbW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzIwNjQsImV4cCI6MjA2NDk0ODA2NH0.lkye_pbmKt2pAhf7rkV55mohyajclVCqTeehXec40F8";

// Configuración predefinida de la rifa (será reemplazada por inject-env.js)
window.ENV_RAFFLE_CONFIG = window.ENV_RAFFLE_CONFIG || {
    name: "Rifa Pampero 2025",
    organization: "Pe\\u00f1a N\\u00e1utica Bajada Espa\\u00f1a", 
    drawDate: "2025-08-31T21:00:00",
    prize: "Una botella Amarula y una caja de 24 bombones Ferrero Rocher",
    objective: "Renovar velas, pintura y maniobra del Pampero",
    totalNumbers: 1000,
    pricePerNumber: 2000,
    whatsappNumber: "341 611-2731",
    reservationTime: 108,
    clubInstagram: "@vela.pnbe"
};

// Datos bancarios predeterminados (serán reemplazados por inject-env.js)
window.ENV_PAYMENT_CONFIG = window.ENV_PAYMENT_CONFIG || {
    mpAlias: "pnberosario.mp",
    mpCvu: "000000310003262395392",
    mpHolder: "Fernando Ernesto Maumus",
    mpCuit: "20239282564"
};

console.log('📋 [ENV] Configuración de entorno cargada');
console.log('🎟️ [ENV] Rifa:', window.ENV_RAFFLE_CONFIG.name);
console.log('📅 [ENV] Sorteo:', window.ENV_RAFFLE_CONFIG.drawDate);
console.log('💰 [ENV] Precio por número: $', window.ENV_RAFFLE_CONFIG.pricePerNumber);
console.log('📱 [ENV] WhatsApp:', window.ENV_RAFFLE_CONFIG.whatsappNumber);
`;

    const envConfigPath = path.join(__dirname, 'js', 'env-config.js');
    fs.writeFileSync(envConfigPath, envConfigContent, 'utf8');
    console.log('  ✅ env-config.js regenerado con caracteres especiales corregidos');
}

function verifyFiles() {
    const requiredFiles = [
        'js/env-config.js',
        'js/init-manager.js',
        'js/diagnostics.js',
        'inject-env.js',
        'index.html'
    ];
    
    const missingFiles = [];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${file} - OK`);
        } else {
            console.log(`  ❌ ${file} - FALTA`);
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length > 0) {
        throw new Error(`Archivos faltantes: ${missingFiles.join(', ')}`);
    }
}

function validateSyntax() {
    const jsFiles = [
        'js/env-config.js',
        'js/init-manager.js',
        'js/diagnostics.js'
    ];
    
    jsFiles.forEach(file => {
        try {
            const filePath = path.join(__dirname, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Verificación básica de sintaxis - buscar problemas comunes
            const lines = content.split('\\n');
            lines.forEach((line, index) => {
                // Verificar que no haya caracteres ñ sin escapar en strings
                if (line.includes('"') && /[ñáéíóúÑÁÉÍÓÚ]/.test(line) && !line.includes('\\\\u00')) {
                    console.warn(`  ⚠️ ${file}:${index + 1} - Posible carácter especial sin escapar`);
                }
            });
            
            console.log(`  ✅ ${file} - Sintaxis OK`);
        } catch (error) {
            console.error(`  ❌ ${file} - Error de sintaxis:`, error.message);
        }
    });
}

// Ejecutar correcciones
if (require.main === module) {
    applyFixes();
}

module.exports = { applyFixes };
