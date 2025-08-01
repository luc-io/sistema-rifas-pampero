/**
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
    organization: "Peña Náutica Bajada España", 
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
