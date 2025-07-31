/**
 * CONFIGURACIÓN DE VARIABLES DE ENTORNO - Digital Ocean App Platform
 * Este archivo debe ser generado automáticamente en el despliegue
 * usando las variables de entorno configuradas en Digital Ocean
 */

// Variables de Supabase desde entorno
window.SUPABASE_URL = process.env.SUPABASE_URL || "https://ssmpnzcjhrjqhglqkmoe.supabase.co";
window.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXBuemNqaHJqcWhnbHFrbW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzIwNjQsImV4cCI6MjA2NDk0ODA2NH0.lkye_pbmKt2pAhf7rkV55mohyajclVCqTeehXec40F8";

// Configuración predefinida de la rifa desde variables de entorno
window.ENV_RAFFLE_CONFIG = {
    name: process.env.RAFFLE_NAME || "Rifa Pampero 2025",
    organization: process.env.RAFFLE_ORGANIZATION || "Peña Náutica Bajada España", 
    drawDate: process.env.RAFFLE_DRAW_DATE || "2025-08-31T21:00:00",
    prize: process.env.RAFFLE_PRIZE || "Una botella Amarula y una caja de 24 bombones Ferrero Rocher",
    objective: process.env.RAFFLE_OBJECTIVE || "Renovar velas, pintura y maniobra del Pampero",
    totalNumbers: parseInt(process.env.RAFFLE_TOTAL_NUMBERS) || 1000,
    pricePerNumber: parseInt(process.env.RAFFLE_PRICE_PER_NUMBER) || 2000,
    whatsappNumber: process.env.RAFFLE_WHATSAPP_NUMBER || "+54 9 341 611-2731",
    reservationTime: parseInt(process.env.RAFFLE_RESERVATION_TIME) || 108,
    clubInstagram: process.env.RAFFLE_CLUB_INSTAGRAM || "@vela.pnbe"
};

// Datos bancarios desde variables de entorno
window.ENV_PAYMENT_CONFIG = {
    mpAlias: process.env.PAYMENT_MP_ALIAS || "pnberosario.mp",
    mpCvu: process.env.PAYMENT_MP_CVU || "000000310003262395392",
    mpHolder: process.env.PAYMENT_MP_HOLDER || "Fernando Ernesto Maumus",
    mpCuit: process.env.PAYMENT_MP_CUIT || "20239282564"
};

console.log('✅ Variables de entorno cargadas desde Digital Ocean');
console.log('🎟️ Rifa configurada:', window.ENV_RAFFLE_CONFIG.name);
console.log('💳 Sorteo:', window.ENV_RAFFLE_CONFIG.drawDate);