/**
 * 🌊 Script de Inyección de Variables de Entorno
 * Para Digital Ocean App Platform
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [BUILD] Iniciando inyección de variables de entorno...');

// Verificar que las variables estén disponibles
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Variables de la rifa
const RAFFLE_NAME = process.env.RAFFLE_NAME || 'Rifa Pampero 2025';
const RAFFLE_ORGANIZATION = process.env.RAFFLE_ORGANIZATION || 'Peña Náutica Bajada España';
const RAFFLE_DRAW_DATE = process.env.RAFFLE_DRAW_DATE || '2025-08-31T21:00:00';
const RAFFLE_PRIZE = process.env.RAFFLE_PRIZE || 'Una botella Amarula y una caja de 24 bombones Ferrero Rocher';
const RAFFLE_OBJECTIVE = process.env.RAFFLE_OBJECTIVE || 'Renovar velas, pintura y maniobra del Pampero';
const RAFFLE_TOTAL_NUMBERS = parseInt(process.env.RAFFLE_TOTAL_NUMBERS) || 1000;
const RAFFLE_PRICE_PER_NUMBER = parseInt(process.env.RAFFLE_PRICE_PER_NUMBER) || 2000;
const RAFFLE_WHATSAPP_NUMBER = process.env.RAFFLE_WHATSAPP_NUMBER || '341 611-2731';
const RAFFLE_RESERVATION_TIME = parseInt(process.env.RAFFLE_RESERVATION_TIME) || 108;
const RAFFLE_CLUB_INSTAGRAM = process.env.RAFFLE_CLUB_INSTAGRAM || '@vela.pnbe';

// Variables de pago
const PAYMENT_MP_ALIAS = process.env.PAYMENT_MP_ALIAS || 'pnberosario.mp';
const PAYMENT_MP_CVU = process.env.PAYMENT_MP_CVU || '000000310003262395392';
const PAYMENT_MP_HOLDER = process.env.PAYMENT_MP_HOLDER || 'Fernando Ernesto Maumus';
const PAYMENT_MP_CUIT = process.env.PAYMENT_MP_CUIT || '20239282564';

console.log('📊 [BUILD] Variables de rifa detectadas:');
console.log(`  - Nombre: ${RAFFLE_NAME}`);
console.log(`  - Organización: ${RAFFLE_ORGANIZATION}`);
console.log(`  - Fecha sorteo: ${RAFFLE_DRAW_DATE}`);
console.log(`  - Total números: ${RAFFLE_TOTAL_NUMBERS}`);
console.log(`  - Precio por número: $${RAFFLE_PRICE_PER_NUMBER}`);
console.log(`  - WhatsApp: ${RAFFLE_WHATSAPP_NUMBER}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('⚠️ [BUILD] Variables de Supabase no encontradas, la aplicación usará configuración manual');
    
    // Crear archivo de configuración con solo las variables de rifa
    const configWithoutSupabase = `
/**
 * 🌊 Variables de Entorno - Digital Ocean App Platform
 * Generado automáticamente durante el build
 */

// Variables de Supabase no disponibles
window.SUPABASE_URL = null;
window.SUPABASE_ANON_KEY = null;

// Configuración de la rifa desde variables de entorno
window.ENV_RAFFLE_CONFIG = {
    name: "${RAFFLE_NAME}",
    organization: "${RAFFLE_ORGANIZATION}",
    drawDate: "${RAFFLE_DRAW_DATE}",
    prize: "${RAFFLE_PRIZE}",
    objective: "${RAFFLE_OBJECTIVE}",
    totalNumbers: ${RAFFLE_TOTAL_NUMBERS},
    pricePerNumber: ${RAFFLE_PRICE_PER_NUMBER},
    whatsappNumber: "${RAFFLE_WHATSAPP_NUMBER}",
    reservationTime: ${RAFFLE_RESERVATION_TIME},
    clubInstagram: "${RAFFLE_CLUB_INSTAGRAM}"
};

// Configuración de pagos desde variables de entorno
window.ENV_PAYMENT_CONFIG = {
    mpAlias: "${PAYMENT_MP_ALIAS}",
    mpCvu: "${PAYMENT_MP_CVU}",
    mpHolder: "${PAYMENT_MP_HOLDER}",
    mpCuit: "${PAYMENT_MP_CUIT}"
};

console.log('🌊 [ENV] Variables de entorno de rifa cargadas desde Digital Ocean');
console.log('🎫 [ENV] Rifa configurada:', window.ENV_RAFFLE_CONFIG.name);
console.log('📅 [ENV] Fecha del sorteo:', window.ENV_RAFFLE_CONFIG.drawDate);
console.log('💰 [ENV] Precio por número: $', window.ENV_RAFFLE_CONFIG.pricePerNumber);
console.log('📱 [ENV] WhatsApp:', window.ENV_RAFFLE_CONFIG.whatsappNumber);
`;
    
    // Asegurar que el directorio js existe
    const jsDir = path.join(__dirname, 'js');
    if (!fs.existsSync(jsDir)) {
        fs.mkdirSync(jsDir, { recursive: true });
        console.log('📁 [BUILD] Directorio js/ creado');
    }
    
    const outputPath = path.join(__dirname, 'js', 'env-config.js');
    fs.writeFileSync(outputPath, configWithoutSupabase);
    console.log('✅ [BUILD] Archivo env-config.js creado (solo con variables de rifa)');
} else {
    // Validar formato de las variables de Supabase
    if (!SUPABASE_URL.includes('supabase.co')) {
        console.error('❌ [BUILD] SUPABASE_URL inválida');
        process.exit(1);
    }

    if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
        console.error('❌ [BUILD] SUPABASE_ANON_KEY inválida (debe ser un JWT)');
        process.exit(1);
    }

    console.log('✅ [BUILD] Variables de Supabase validadas correctamente');

    // Crear archivo de configuración completo
    const fullConfig = `
/**
 * 🌊 Variables de Entorno - Digital Ocean App Platform
 * Este archivo es generado automáticamente durante el build
 */

// Variables de Supabase
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';

// Configuración de la rifa desde variables de entorno
window.ENV_RAFFLE_CONFIG = {
    name: "${RAFFLE_NAME}",
    organization: "${RAFFLE_ORGANIZATION}",
    drawDate: "${RAFFLE_DRAW_DATE}",
    prize: "${RAFFLE_PRIZE}",
    objective: "${RAFFLE_OBJECTIVE}",
    totalNumbers: ${RAFFLE_TOTAL_NUMBERS},
    pricePerNumber: ${RAFFLE_PRICE_PER_NUMBER},
    whatsappNumber: "${RAFFLE_WHATSAPP_NUMBER}",
    reservationTime: ${RAFFLE_RESERVATION_TIME},
    clubInstagram: "${RAFFLE_CLUB_INSTAGRAM}"
};

// Configuración de pagos desde variables de entorno
window.ENV_PAYMENT_CONFIG = {
    mpAlias: "${PAYMENT_MP_ALIAS}",
    mpCvu: "${PAYMENT_MP_CVU}",
    mpHolder: "${PAYMENT_MP_HOLDER}",
    mpCuit: "${PAYMENT_MP_CUIT}"
};

console.log('🌊 [ENV] Variables de entorno cargadas desde Digital Ocean');
console.log('🎫 [ENV] Rifa configurada:', window.ENV_RAFFLE_CONFIG.name);
console.log('📅 [ENV] Fecha del sorteo:', window.ENV_RAFFLE_CONFIG.drawDate);
console.log('💰 [ENV] Precio por número: $', window.ENV_RAFFLE_CONFIG.pricePerNumber);
console.log('📱 [ENV] WhatsApp:', window.ENV_RAFFLE_CONFIG.whatsappNumber);
console.log('💳 [ENV] Alias MercadoPago:', window.ENV_PAYMENT_CONFIG.mpAlias);
`;

    // Asegurar que el directorio js existe
    const jsDir = path.join(__dirname, 'js');
    if (!fs.existsSync(jsDir)) {
        fs.mkdirSync(jsDir, { recursive: true });
        console.log('📁 [BUILD] Directorio js/ creado');
    }

    // Escribir el archivo
    const outputPath = path.join(jsDir, 'env-config.js');
    fs.writeFileSync(outputPath, fullConfig);

    console.log(`✅ [BUILD] Variables inyectadas en: ${outputPath}`);
}

// 📁 Copiar todos los archivos a /workspace/public para Digital Ocean
console.log('📁 [BUILD] Copiando archivos a directorio public...');

// Crear directorio public
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Función recursiva para copiar directorios
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        files.forEach(file => {
            // Evitar copiar algunos directorios/archivos
            if (file === 'public' || file === 'node_modules' || file === '.git' || file.endsWith('.backup')) {
                return;
            }
            
            copyRecursive(
                path.join(src, file),
                path.join(dest, file)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copiar archivos principales
const filesToCopy = [
    'index.html',
    'css',
    'js'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);
    
    if (fs.existsSync(srcPath)) {
        copyRecursive(srcPath, destPath);
        console.log(`✅ [BUILD] Copiado: ${file}`);
    }
});

console.log('✅ [BUILD] Archivos copiados a /workspace/public');
console.log('🚀 [BUILD] Configuración de entorno completada');
console.log('');
console.log('📋 [BUILD] Resumen de configuración:');
console.log(`  🎫 Rifa: ${RAFFLE_NAME}`);
console.log(`  🏢 Organización: ${RAFFLE_ORGANIZATION}`);
console.log(`  📅 Sorteo: ${RAFFLE_DRAW_DATE}`);
console.log(`  🎁 Premio: ${RAFFLE_PRIZE}`);
console.log(`  🔢 Números: ${RAFFLE_TOTAL_NUMBERS}`);
console.log(`  💰 Precio: $${RAFFLE_PRICE_PER_NUMBER}`);
console.log(`  📱 WhatsApp: ${RAFFLE_WHATSAPP_NUMBER}`);
console.log(`  💳 MercadoPago: ${PAYMENT_MP_ALIAS}`);
