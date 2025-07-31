/**
 * CONFIGURACIÓN DE VARIABLES DE ENTORNO
 * Este archivo se genera automáticamente en el despliegue
 * o se crea manualmente para desarrollo local
 */

// Variables de entorno inyectadas por el servidor
window.SUPABASE_URL = "https://ssmpnzcjhrjqhglqkmoe.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXBuemNqaHJqcWhnbHFrbW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzIwNjQsImV4cCI6MjA2NDk0ODA2NH0.lkye_pbmKt2pAhf7rkV55mohyajclVCqTeehXec40F8";

// Configuración predefinida de la rifa
window.ENV_RAFFLE_CONFIG = {
    name: "Rifa Pampero 2025",
    organization: "Peña Náutica Bajada España", 
    drawDate: "2025-08-31T20:00:00",
    prize: "Una botella Amarula y una caja de 24 bombones Ferrero Rocher",
    objective: "Juntar fondos para renovar velas, pintura y maniobra del Pampero",
    totalNumbers: 1000,
    pricePerNumber: 2000,
    whatsappNumber: "+54 9 341 611-2731",
    reservationTime: 24,
    clubInstagram: "@penabajadaespana"
};

console.log('✅ Variables de entorno cargadas correctamente');
