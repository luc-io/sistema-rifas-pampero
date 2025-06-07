/**
 * FIREBASE INTEGRATION - Sistema de Rifas Pampero
 * Integración con Firebase para persistencia en la nube
 */

// Configuración Firebase (reemplazar con tus credenciales)
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "rifa-pampero.firebaseapp.com",
    projectId: "rifa-pampero",
    storageBucket: "rifa-pampero.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.FirebaseManager = {
    // Estado de conexión
    isConnected: false,
    
    /**
     * Inicializar Firebase
     */
    init: async function() {
        try {
            // Probar conexión
            await getDocs(collection(db, 'test'));
            this.isConnected = true;
            console.log('✅ Firebase conectado correctamente');
            
            // Migrar datos locales si existen
            await this.migrateLocalData();
            
            // Configurar listeners en tiempo real
            this.setupRealtimeListeners();
            
            return true;
        } catch (error) {
            console.error('❌ Error conectando Firebase:', error);
            this.isConnected = false;
            return false;
        }
    },

    /**
     * Guardar configuración de rifa
     */
    saveRaffleConfig: async function(config) {
        if (!this.isConnected) return Storage.save('raffleConfig', config);
        
        try {
            await addDoc(collection(db, 'raffles'), {
                ...config,
                type: 'config',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Configuración guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
            // Fallback a localStorage
            Storage.save('raffleConfig', config);
        }
    },

    /**
     * Guardar venta
     */
    saveSale: async function(sale) {
        if (!this.isConnected) {
            AppState.sales.push(sale);
            return Storage.save('sales', AppState.sales);
        }
        
        try {
            await addDoc(collection(db, 'sales'), {
                ...sale,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Venta guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando venta:', error);
            // Fallback a localStorage
            AppState.sales.push(sale);
            Storage.save('sales', AppState.sales);
        }
    },

    /**
     * Guardar reserva
     */
    saveReservation: async function(reservation) {
        if (!this.isConnected) {
            AppState.reservations.push(reservation);
            return Storage.save('reservations', AppState.reservations);
        }
        
        try {
            await addDoc(collection(db, 'reservations'), {
                ...reservation,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Reserva guardada en Firebase');
        } catch (error) {
            console.error('❌ Error guardando reserva:', error);
            // Fallback a localStorage
            AppState.reservations.push(reservation);
            Storage.save('reservations', AppState.reservations);
        }
    },

    /**
     * Cargar todos los datos
     */
    loadAllData: async function() {
        if (!this.isConnected) return loadFromStorage();
        
        try {
            // Cargar configuración
            const rafflesSnapshot = await getDocs(collection(db, 'raffles'));
            rafflesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'config') {
                    AppState.raffleConfig = data;
                }
            });

            // Cargar ventas
            const salesSnapshot = await getDocs(collection(db, 'sales'));
            AppState.sales = [];
            salesSnapshot.forEach(doc => {
                AppState.sales.push({ id: doc.id, ...doc.data() });
            });

            // Cargar reservas
            const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
            AppState.reservations = [];
            reservationsSnapshot.forEach(doc => {
                AppState.reservations.push({ id: doc.id, ...doc.data() });
            });

            console.log('✅ Datos cargados desde Firebase');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            // Fallback a localStorage
            loadFromStorage();
        }
    },

    /**
     * Configurar listeners en tiempo real
     */
    setupRealtimeListeners: function() {
        if (!this.isConnected) return;
        
        // Listener para ventas
        onSnapshot(collection(db, 'sales'), (snapshot) => {
            AppState.sales = [];
            snapshot.forEach(doc => {
                AppState.sales.push({ id: doc.id, ...doc.data() });
            });
            
            // Actualizar interfaz
            if (typeof AdminManager !== 'undefined') {
                AdminManager.updateInterface();
            }
            if (typeof NumbersManager !== 'undefined') {
                NumbersManager.updateDisplay();
            }
        });

        // Listener para reservas
        onSnapshot(collection(db, 'reservations'), (snapshot) => {
            AppState.reservations = [];
            snapshot.forEach(doc => {
                AppState.reservations.push({ id: doc.id, ...doc.data() });
            });
            
            // Actualizar interfaz
            if (typeof AdminManager !== 'undefined') {
                AdminManager.updateInterface();
            }
        });
    },

    /**
     * Migrar datos locales a Firebase
     */
    migrateLocalData: async function() {
        const localConfig = Storage.load('raffleConfig');
        const localSales = Storage.load('sales', []);
        const localReservations = Storage.load('reservations', []);

        // Solo migrar si hay datos locales y Firebase está vacío
        if (localConfig && AppState.sales.length === 0) {
            console.log('🔄 Migrando datos locales a Firebase...');
            
            await this.saveRaffleConfig(localConfig);
            
            for (const sale of localSales) {
                await this.saveSale(sale);
            }
            
            for (const reservation of localReservations) {
                await this.saveReservation(reservation);
            }
            
            console.log('✅ Migración completada');
        }
    },

    /**
     * Obtener estadísticas de uso
     */
    getUsageStats: async function() {
        if (!this.isConnected) return null;
        
        try {
            const salesSnapshot = await getDocs(collection(db, 'sales'));
            const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
            
            return {
                totalSales: salesSnapshot.size,
                totalReservations: reservationsSnapshot.size,
                lastUpdate: new Date()
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }
};

// Auto-inicializar Firebase si está disponible
if (typeof firebase !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        FirebaseManager.init();
    });
}

console.log('✅ Firebase.js cargado correctamente');