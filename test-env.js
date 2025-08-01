#!/usr/bin/env node

/**
 * 🧪 Script de Prueba - Variables de Entorno
 * Simula el proceso de build de Digital Ocean con las variables reales
 */

console.log('🧪 [TEST] Simulando build de Digital Ocean con variables de entorno...\n');

// Simular variables de entorno de Digital Ocean
process.env.SUPABASE_URL = 'https://ssmpnzcjhrjqhglqkmoe.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXBuemNqaHJqcWhnbHFrbW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzIwNjQsImV4cCI6MjA2NDk0ODA2NH0.lkye_pbmKt2pAhf7rkV55mohyajclVCqTeehXec40F8';

process.env.RAFFLE_NAME = 'Rifa Pampero 2025';
process.env.RAFFLE_ORGANIZATION = 'Peña Náutica Bajada España';
process.env.RAFFLE_DRAW_DATE = '2025-08-31T21:00:00';
process.env.RAFFLE_PRIZE = 'Una botella Amarula y una caja de 24 bombones Ferrero Rocher';
process.env.RAFFLE_OBJECTIVE = 'Renovar velas, pintura y maniobra del Pampero';
process.env.RAFFLE_TOTAL_NUMBERS = '1000';
process.env.RAFFLE_PRICE_PER_NUMBER = '2000';
process.env.RAFFLE_WHATSAPP_NUMBER = '341 611-2731';
process.env.RAFFLE_RESERVATION_TIME = '108';
process.env.RAFFLE_CLUB_INSTAGRAM = '@vela.pnbe';

process.env.PAYMENT_MP_ALIAS = 'pnberosario.mp';
process.env.PAYMENT_MP_CVU = '000000310003262395392';
process.env.PAYMENT_MP_HOLDER = 'Fernando Ernesto Maumus';
process.env.PAYMENT_MP_CUIT = '20239282564';

console.log('✅ [TEST] Variables de entorno configuradas');
console.log('🏃 [TEST] Ejecutando inject-env.js...\n');

// Ejecutar el script principal
require('./inject-env.js');

console.log('\n🎉 [TEST] ¡Prueba completada exitosamente!');
console.log('📄 [TEST] Revisa el archivo js/env-config.js generado');
