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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('⚠️ [BUILD] Variables de entorno no encontradas, la aplicación usará configuración manual');
    // Crear archivo de configuración vacío pero funcional
    const emptyConfig = `
/**
 * 🌊 Variables de Entorno - Digital Ocean App Platform
 * No hay variables de entorno configuradas
 */

// No hay variables de entorno disponibles
console.log('📱 [ENV] Variables de entorno no encontradas, usando configuración manual');

// Definir variables vacías para evitar errores
window.SUPABASE_URL = null;
window.SUPABASE_ANON_KEY = null;
`;
    
    // Asegurar que el directorio js existe
    const jsDir = path.join(__dirname, 'js');
    if (!fs.existsSync(jsDir)) {
        fs.mkdirSync(jsDir, { recursive: true });
        console.log('📱 [BUILD] Directorio js/ creado');
    }
    
    const outputPath = path.join(__dirname, 'js', 'env-config.js');
    fs.writeFileSync(outputPath, emptyConfig);
    console.log('✅ [BUILD] Archivo env-config.js creado (vacío)');
} else {
    // Validar formato de las variables
    if (!SUPABASE_URL.includes('supabase.co')) {
        console.error('❌ [BUILD] SUPABASE_URL inválida');
        process.exit(1);
    }

    if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
        console.error('❌ [BUILD] SUPABASE_ANON_KEY inválida (debe ser un JWT)');
        process.exit(1);
    }

    console.log('✅ [BUILD] Variables validadas correctamente');

    // Crear archivo de configuración de entorno
    const envConfig = `
/**
 * 🌊 Variables de Entorno - Digital Ocean App Platform
 * Este archivo es generado automáticamente durante el build
 */
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';

console.log('🌐 [ENV] Variables de entorno cargadas desde Digital Ocean');
`;

    // Asegurar que el directorio js existe
    const jsDir = path.join(__dirname, 'js');
    if (!fs.existsSync(jsDir)) {
        fs.mkdirSync(jsDir, { recursive: true });
        console.log('📱 [BUILD] Directorio js/ creado');
    }

    // Escribir el archivo
    const outputPath = path.join(jsDir, 'env-config.js');
    fs.writeFileSync(outputPath, envConfig);

    console.log(`✅ [BUILD] Variables inyectadas en: ${outputPath}`);
}

// 🗏 Copiar todos los archivos a /workspace/public para Digital Ocean
console.log('🗏 [BUILD] Copiando archivos a directorio public...');

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
