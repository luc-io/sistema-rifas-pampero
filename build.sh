#!/bin/bash
# build.sh - Script de construcción para Digital Ocean App Platform
# Genera env-config.js dinámicamente desde variables de entorno

echo "🚀 Generando env-config.js desde variables de entorno..."

# Crear directorio js si no existe
mkdir -p js

# Generar env-config.js con variables de entorno reales
cat > js/env-config.js << EOF
/**
 * CONFIGURACIÓN DE VARIABLES DE ENTORNO - Digital Ocean App Platform
 * Generado automáticamente en el despliegue desde variables de entorno
 * Fecha de generación: $(date)
 */

// Variables de Supabase
window.SUPABASE_URL = "${SUPABASE_URL}";
window.SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}";

// Configuración predefinida de la rifa
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

// Configuración de pagos
window.ENV_PAYMENT_CONFIG = {
    mpAlias: "${PAYMENT_MP_ALIAS:-pnberosario.mp}",
    mpCvu: "${PAYMENT_MP_CVU:-000000310003262395392}",
    mpHolder: "${PAYMENT_MP_HOLDER:-Fernando Ernesto Maumus}",
    mpCuit: "${PAYMENT_MP_CUIT:-20239282564}"
};

console.log('✅ Variables de entorno cargadas desde Digital Ocean');
console.log('🎟️ Rifa configurada:', window.ENV_RAFFLE_CONFIG.name);
console.log('📅 Sorteo:', window.ENV_RAFFLE_CONFIG.drawDate);
console.log('💰 Precio por número: \$', window.ENV_RAFFLE_CONFIG.pricePerNumber);
EOF

echo "✅ env-config.js generado correctamente"

# Hacer que index.html use las variables de entorno para el CSP
echo "🔄 Actualizando CSP con URL de Supabase dinámica..."

# Reemplazar la URL hardcodeada en el CSP
if [ ! -z "$SUPABASE_URL" ]; then
    sed -i "s|https://ssmpnzcjhrjqhglqkmoe.supabase.co|${SUPABASE_URL}|g" index.html
    echo "✅ CSP actualizado con: $SUPABASE_URL"
fi

echo "🎉 Build completado exitosamente"