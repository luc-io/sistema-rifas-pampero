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
    process.exit(0);
}

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

// Escribir el archivo
const outputPath = path.join(__dirname, 'js', 'env-config.js');
fs.writeFileSync(outputPath, envConfig);

console.log(`✅ [BUILD] Variables inyectadas en: ${outputPath}`);

// Verificar que el archivo index.html cargue el script
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('env-config.js')) {
    console.log('🔧 [BUILD] Agregando script de entorno a index.html...');
    
    const scriptTag = '    <script src="js/env-config.js"></script>\n';
    const configScriptPosition = indexContent.indexOf('<script src="js/config.js">');
    
    if (configScriptPosition !== -1) {
        indexContent = indexContent.substring(0, configScriptPosition) + 
                      scriptTag + 
                      indexContent.substring(configScriptPosition);
        
        fs.writeFileSync(indexPath, indexContent);
        console.log('✅ [BUILD] index.html actualizado');
    } else {
        console.warn('⚠️ [BUILD] No se pudo encontrar config.js en index.html');
    }
}

console.log('🚀 [BUILD] Configuración de entorno completada');
