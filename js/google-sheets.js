/**
 * INTEGRACIÓN CON GOOGLE SHEETS - Sistema de Rifas Pampero
 * Implementación moderna usando Google Identity Services (GIS)
 * Solucionando el error: idpiframe_initialization_failed
 */

window.GoogleSheetsManager = {
    
    // Configuración de Google Sheets API
    config: {
        apiKey: 'AIzaSyD-jURMnPjLogmHfyFHncEXw1fP5_SqBUU',
        clientId: '758158064041-4h6rk4jovr8k82li4k27571cfiu3iitb.apps.googleusercontent.com',
        discoveryDoc: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
        spreadsheetId: null,
        isInitialized: false,
        isSignedIn: false,
        tokenClient: null,
        accessToken: null
    },
    
    /**
     * Inicializar Google Sheets API con Google Identity Services
     */
    init: async function() {
        // Verificar si ya está inicializado
        if (this.config.isInitialized) {
            return true;
        }
        
        // Verificar credenciales
        if (!this.config.apiKey || !this.config.clientId) {
            console.warn('🔑 [SHEETS] Credenciales de Google Sheets no configuradas');
            return false;
        }
        
        // Verificar protocolo HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('⚠️ [SHEETS] Google OAuth requiere HTTPS. Usando localhost o servidor HTTPS.');
            throw new Error('Google OAuth requiere HTTPS. Debe usar localhost para desarrollo o un servidor HTTPS.');
        }
        
        try {
            console.log('🔄 [SHEETS] Inicializando Google API con GIS...');
            
            // Cargar las librerías necesarias
            await this.loadGoogleAPI();
            await this.loadGoogleIdentityServices();
            await this.initializeGapi();
            
            // Configurar el cliente de tokens usando GIS
            this.initializeTokenClient();
            
            this.config.isInitialized = true;
            
            // Intentar restaurar estado de autenticación
            setTimeout(() => {
                if (this.restoreAuthState()) {
                    console.log('✅ [SHEETS] Estado de autenticación restaurado');
                }
                this.updateUIStatus();
            }, 100);
            
            console.log('✅ [SHEETS] Google Sheets API inicializada con GIS');
            return true;
            
        } catch (error) {
            console.error('❌ [SHEETS] Error inicializando Google Sheets:', error);
            
            // Proporcionar mensaje de error más descriptivo
            if (error.message && error.message.includes('idpiframe_initialization_failed')) {
                const currentOrigin = window.location.origin;
                throw new Error(`Dominio no autorizado. Agrega '${currentOrigin}' como origen autorizado en Google Cloud Console:\n\n1. Ve a Google Cloud Console\n2. APIs y servicios > Credenciales\n3. Edita tu OAuth 2.0 Client ID\n4. Agrega '${currentOrigin}' en 'Orígenes de JavaScript autorizados'`);
            }
            
            // Manejar errores de red y otros
            if (error.message?.includes('network') || error.message?.includes('fetch')) {
                throw new Error('Error de red - verifica tu conexión a internet');
            }
            
            throw error;
        }
    },
    
    /**
     * Cargar Google API
     */
    loadGoogleAPI: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('No se pudo cargar Google API'));
            document.head.appendChild(script);
        });
    },
    
    /**
     * Cargar Google Identity Services
     */
    loadGoogleIdentityServices: function() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
            document.head.appendChild(script);
        });
    },
    
    /**
     * Inicializar GAPI (solo para API calls, no para auth)
     */
    initializeGapi: function() {
        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.config.apiKey,
                        discoveryDocs: [this.config.discoveryDoc]
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    },
    
    /**
     * Inicializar el cliente de tokens con GIS
     */
    initializeTokenClient: function() {
        this.config.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.config.clientId,
            scope: this.config.scopes,
            callback: (tokenResponse) => {
                console.log('🔑 [SHEETS] Token recibido:', tokenResponse);
                
                if (tokenResponse.error) {
                    console.error('❌ [SHEETS] Error obteniendo token:', tokenResponse.error);
                    Utils.showNotification('Error conectando con Google Sheets', 'error');
                    return;
                }
                
                // CRÍTICO: Actualizar estado de forma atómica
                this.config.accessToken = tokenResponse.access_token;
                this.config.isSignedIn = true;
                
                // Configurar el token para las llamadas a la API
                gapi.client.setToken({
                    access_token: tokenResponse.access_token
                });
                
                // Guardar estado de autenticación
                this.saveAuthState();
                
                console.log('✅ [SHEETS] Autenticación exitosa');
                console.log('🔍 [SHEETS] Estado después de auth:', {
                    isSignedIn: this.config.isSignedIn,
                    isInitialized: this.config.isInitialized,
                    hasToken: !!this.config.accessToken
                });
                
                Utils.showNotification('Conectado a Google Sheets exitosamente', 'success');
                
                // Actualizar UI inmediatamente
                this.updateUIStatus();
                console.log('🔄 [SHEETS] UI actualizada después de autenticación');
            }
        });
    },
    
    /**
     * Configurar credenciales
     */
    setCredentials: function(apiKey, clientId, spreadsheetId) {
        this.config.apiKey = apiKey;
        this.config.clientId = clientId;
        this.config.spreadsheetId = spreadsheetId;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('google_sheets_config', JSON.stringify({
            apiKey,
            clientId,
            spreadsheetId
        }));
        
        // Resetear inicialización para usar nuevas credenciales
        this.config.isInitialized = false;
        this.config.isSignedIn = false;
        this.config.tokenClient = null;
        this.config.accessToken = null;
    },
    
    /**
     * Cargar credenciales guardadas
     */
    loadCredentials: function() {
        const saved = localStorage.getItem('google_sheets_config');
        if (saved) {
            const config = JSON.parse(saved);
            this.config.apiKey = config.apiKey;
            this.config.clientId = config.clientId;
            this.config.spreadsheetId = config.spreadsheetId;
            return true;
        }
        return false;
    },
    
    /**
     * Iniciar sesión en Google usando GIS
     */
    signIn: async function() {
        if (!this.config.isInitialized) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('No se pudo inicializar Google Sheets API');
            }
        }
        
        // Usar el nuevo método de GIS para solicitar token
        if (this.config.tokenClient) {
            this.config.tokenClient.requestAccessToken({
                prompt: 'consent' // Forzar pantalla de consentimiento
            });
        } else {
            throw new Error('Cliente de tokens no inicializado');
        }
    },
    
    /**
     * Cerrar sesión
     */
    signOut: function() {
        if (this.config.accessToken) {
            // Revocar el token usando GIS
            google.accounts.oauth2.revoke(this.config.accessToken, () => {
                console.log('🔓 [SHEETS] Token revocado');
            });
        }
        
        // Limpiar estado
        this.config.isSignedIn = false;
        this.config.accessToken = null;
        gapi.client.setToken(null);
        
        // Limpiar estado local
        localStorage.removeItem('google_sheets_auth_state');
        
        Utils.showNotification('Desconectado de Google Sheets', 'info');
        this.updateUIStatus();
    },
    
    /**
     * Guardar estado de autenticación
     */
    saveAuthState: function() {
        if (this.config.isSignedIn && this.config.accessToken) {
            const authState = {
                isSignedIn: true,
                timestamp: Date.now(),
                // No guardamos el token por seguridad, solo el estado
            };
            localStorage.setItem('google_sheets_auth_state', JSON.stringify(authState));
        }
    },
    
    /**
     * Restaurar estado de autenticación
     */
    restoreAuthState: function() {
        try {
            const saved = localStorage.getItem('google_sheets_auth_state');
            if (saved) {
                const authState = JSON.parse(saved);
                const oneHour = 60 * 60 * 1000;
                
                // Verificar que el estado no sea muy antiguo (1 hora)
                if (authState.timestamp && (Date.now() - authState.timestamp) < oneHour) {
                    // Verificar si gapi tiene token
                    const gapiToken = gapi?.client?.getToken?.();
                    if (gapiToken && gapiToken.access_token) {
                        console.log('🔄 [SHEETS] Restaurando estado de autenticación');
                        this.config.accessToken = gapiToken.access_token;
                        this.config.isSignedIn = true;
                        return true;
                    }
                }
                
                // Limpiar estado expirado
                localStorage.removeItem('google_sheets_auth_state');
            }
        } catch (error) {
            console.warn('⚠️ [SHEETS] Error restaurando estado:', error);
            localStorage.removeItem('google_sheets_auth_state');
        }
        
        return false;
    },
    
    /**
     * Crear nueva hoja de cálculo para la rifa
     */
    createRaffleSpreadsheet: async function(raffleName) {
        if (!this.config.isSignedIn) {
            await this.signIn();
            // Esperar a que se complete la autenticación
            return new Promise((resolve) => {
                const checkAuth = () => {
                    if (this.config.isSignedIn) {
                        this.createRaffleSpreadsheet(raffleName).then(resolve);
                    } else {
                        setTimeout(checkAuth, 1000);
                    }
                };
                checkAuth();
            });
        }
        
        const spreadsheetName = `Rifa - ${raffleName} - ${new Date().getFullYear()}`;
        
        const resource = {
            properties: {
                title: spreadsheetName
            },
            sheets: [
                {
                    properties: {
                        title: 'Ventas',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 15
                        }
                    }
                },
                {
                    properties: {
                        title: 'Asignaciones',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 10
                        }
                    }
                },
                {
                    properties: {
                        title: 'Estadísticas',
                        gridProperties: {
                            rowCount: 100,
                            columnCount: 5
                        }
                    }
                }
            ]
        };
        
        try {
            const response = await gapi.client.sheets.spreadsheets.create({
                resource: resource
            });
            
            const spreadsheetId = response.result.spreadsheetId;
            this.config.spreadsheetId = spreadsheetId;
            
            // Configurar headers
            await this.setupSalesHeaders(spreadsheetId);
            await this.setupAssignmentsHeaders(spreadsheetId);
            await this.setupStatsHeaders(spreadsheetId);
            
            // Guardar configuración
            this.setCredentials(this.config.apiKey, this.config.clientId, spreadsheetId);
            
            Utils.showNotification('Hoja de cálculo creada exitosamente', 'success');
            this.updateUIStatus();
            
            return {
                spreadsheetId,
                url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
            };
            
        } catch (error) {
            console.error('❌ [SHEETS] Error creando hoja:', error);
            throw error;
        }
    },
    
    /**
     * Configurar headers de ventas
     */
    setupSalesHeaders: async function(spreadsheetId) {
        const values = [[
            'ID',
            'Fecha',
            'Nombre',
            'Apellido',
            'Teléfono',
            'Email',
            'Instagram',
            'Números',
            'Cantidad',
            'Total',
            'Método Pago',
            'Estado',
            'Es Socio',
            'Área Club',
            'Interés Navegación'
        ]];
        
        await this.updateRange(spreadsheetId, 'Ventas!A1:O1', values);
    },
    
    /**
     * Configurar headers de asignaciones
     */
    setupAssignmentsHeaders: async function(spreadsheetId) {
        const values = [[
            'ID',
            'Vendedor',
            'Teléfono',
            'Números',
            'Cantidad',
            'Total',
            'Estado',
            'Fecha Asignación',
            'Fecha Límite',
            'Notas'
        ]];
        
        await this.updateRange(spreadsheetId, 'Asignaciones!A1:J1', values);
    },
    
    /**
     * Configurar headers de estadísticas
     */
    setupStatsHeaders: async function(spreadsheetId) {
        const values = [
            ['Métrica', 'Valor'],
            ['Total Ventas', '=COUNTA(Ventas!A:A)-1'],
            ['Números Vendidos', '=SUMPRODUCT(Ventas!I:I)'],
            ['Ingresos Totales', '=SUMPRODUCT(Ventas!J:J)'],
            ['Asignaciones Activas', '=COUNTIF(Asignaciones!G:G,"assigned")']
        ];
        
        await this.updateRange(spreadsheetId, 'Estadísticas!A1:B5', values);
    },
    
    /**
     * Sincronizar ventas con Google Sheets
     */
    syncSales: async function() {
        if (!this.config.spreadsheetId) {
            throw new Error('No hay hoja de cálculo configurada');
        }
        
        if (!this.config.isSignedIn) {
            await this.signIn();
            return; // Se reintentará después de la autenticación
        }
        
        try {
            // Verificar que tenemos datos de ventas
            if (!AppState.sales || !Array.isArray(AppState.sales)) {
                console.warn('⚠️ [SHEETS] No hay datos de ventas para sincronizar');
                return;
            }
            
            // Limpiar datos existentes (excepto headers)
            await this.clearRange(this.config.spreadsheetId, 'Ventas!A2:O1000');
            
            // Preparar datos de ventas
            const salesData = AppState.sales.map(sale => [
                sale.id || '',
                Utils.formatDateTime(sale.date),
                sale.buyer?.name || '',
                sale.buyer?.lastName || '',
                sale.buyer?.phone || '',
                sale.buyer?.email || '',
                sale.buyer?.instagram || '',
                sale.numbers?.map(n => Utils.formatNumber(n)).join(', ') || '',
                sale.numbers?.length || 0,
                sale.total || 0,
                AppConstants.PAYMENT_METHODS?.[sale.paymentMethod] || sale.paymentMethod || '',
                sale.status || 'pending',
                AppConstants.MEMBER_LABELS?.[sale.buyer?.membershipArea] || 'No especificado',
                sale.buyer?.membershipArea || '',
                sale.buyer?.navigationInterest || ''
            ]);
            
            if (salesData.length > 0) {
                await this.updateRange(
                    this.config.spreadsheetId,
                    `Ventas!A2:O${salesData.length + 1}`,
                    salesData
                );
            }
            
            console.log(`✅ [SHEETS] ${salesData.length} ventas sincronizadas`);
        } catch (error) {
            console.error('❌ [SHEETS] Error sincronizando ventas:', error);
            throw error;
        }
    },
    
    /**
     * Sincronizar asignaciones con Google Sheets
     */
    syncAssignments: async function() {
        if (!this.config.spreadsheetId) {
            throw new Error('No hay hoja de cálculo configurada');
        }
        
        if (!this.config.isSignedIn) {
            await this.signIn();
            return; // Se reintentará después de la autenticación
        }
        
        try {
            // Verificar que tenemos datos de asignaciones
            if (!AppState.assignments || !Array.isArray(AppState.assignments)) {
                console.warn('⚠️ [SHEETS] No hay datos de asignaciones para sincronizar');
                return;
            }
            
            // Limpiar datos existentes (excepto headers)
            await this.clearRange(this.config.spreadsheetId, 'Asignaciones!A2:J1000');
            
            // Preparar datos de asignaciones
            const assignmentsData = AppState.assignments.map(assignment => [
                assignment.id || '',
                `${assignment.seller_name || ''} ${assignment.seller_lastname || ''}`.trim(),
                assignment.seller_phone || '',
                assignment.numbers?.map(n => Utils.formatNumber(n)).join(', ') || '',
                assignment.numbers?.length || 0,
                assignment.total_amount || 0,
                assignment.status || 'pending',
                Utils.formatDateTime(assignment.assigned_at),
                assignment.payment_deadline ? Utils.formatDateTime(assignment.payment_deadline) : '',
                assignment.notes || ''
            ]);
            
            if (assignmentsData.length > 0) {
                await this.updateRange(
                    this.config.spreadsheetId,
                    `Asignaciones!A2:J${assignmentsData.length + 1}`,
                    assignmentsData
                );
            }
            
            console.log(`✅ [SHEETS] ${assignmentsData.length} asignaciones sincronizadas`);
        } catch (error) {
            console.error('❌ [SHEETS] Error sincronizando asignaciones:', error);
            throw error;
        }
    },
    
    /**
     * Verificar disponibilidad de datos MEJORADO
     */
    checkDataAvailability: function() {
        // Verificar si la aplicación está inicializada
        if (!window.AppState) {
            return {
                hasSales: false,
                hasAssignments: false,
                hasRaffleConfig: false,
                totalData: 0,
                status: 'not_initialized',
                message: 'Aplicación no inicializada'
            };
        }
        
        // Verificar si hay configuración de rifa
        const hasRaffleConfig = !!(AppState.raffleConfig && AppState.raffleConfig.name);
        
        if (!hasRaffleConfig) {
            return {
                hasSales: false,
                hasAssignments: false,
                hasRaffleConfig: false,
                totalData: 0,
                status: 'no_raffle_config',
                message: 'No hay rifa configurada'
            };
        }
        
        // Verificar datos
        const hasSales = !!(AppState.sales && Array.isArray(AppState.sales) && AppState.sales.length > 0);
        const hasAssignments = !!(AppState.assignments && Array.isArray(AppState.assignments) && AppState.assignments.length > 0);
        const totalData = (hasSales ? 1 : 0) + (hasAssignments ? 1 : 0);
        
        // Determinar estado
        let status, message;
        
        if (totalData === 0) {
            // Verificar si Supabase está conectado para distinguir entre "sin datos" y "no cargado"
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                status = 'no_data';
                message = 'Sin ventas ni asignaciones registradas aún';
            } else {
                status = 'loading';
                message = 'Cargando datos desde la base de datos...';
            }
        } else {
            status = 'has_data';
            const parts = [];
            if (hasSales) parts.push(`${AppState.sales.length} ventas`);
            if (hasAssignments) parts.push(`${AppState.assignments.length} asignaciones`);
            message = `Listo para sincronizar: ${parts.join(' y ')}`;
        }
        
        return {
            hasSales,
            hasAssignments,
            hasRaffleConfig,
            totalData,
            status,
            message
        };
    },
    
    /**
     * Forzar actualización del estado después de cargar datos
     */
    refreshDataStatus: function() {
        console.log('🔄 [SHEETS] Actualizando estado de datos...');
        this.updateUIStatus();
    },
    
    /**
     * Verificar y mantener estado de autenticación
     */
    verifyAuthState: function() {
        console.log('🔍 [SHEETS] Verificando estado de autenticación...');
        
        // Verificar token en gapi
        const gapiToken = gapi?.client?.getToken?.();
        const hasGapiToken = !!(gapiToken && gapiToken.access_token);
        
        console.log('🔍 [SHEETS] Estado actual:', {
            configSignedIn: this.config.isSignedIn,
            configToken: !!this.config.accessToken,
            gapiToken: hasGapiToken,
            gapiTokenValue: gapiToken?.access_token?.substring(0, 20) + '...' || 'none'
        });
        
        // Si gapi tiene token pero config no, sincronizar
        if (hasGapiToken && (!this.config.isSignedIn || !this.config.accessToken)) {
            console.log('🔄 [SHEETS] Sincronizando estado de autenticación desde gapi');
            this.config.accessToken = gapiToken.access_token;
            this.config.isSignedIn = true;
            this.saveAuthState();
            return true;
        }
        
        // Si config dice que está autenticado pero gapi no tiene token, limpiar
        if (this.config.isSignedIn && !hasGapiToken) {
            console.log('⚠️ [SHEETS] Estado inconsistente, limpiando');
            this.config.isSignedIn = false;
            this.config.accessToken = null;
            localStorage.removeItem('google_sheets_auth_state');
            return false;
        }
        
        return this.config.isSignedIn;
    },
    
    /**
     * Función de debug para forzar actualización de UI
     */
    debugUI: function() {
        console.log('🔍 [SHEETS] DEBUG - Estado completo:', {
            isSignedIn: this.config.isSignedIn,
            isInitialized: this.config.isInitialized,
            hasToken: !!this.config.accessToken,
            hasSpreadsheet: !!this.config.spreadsheetId,
            apiKey: !!this.config.apiKey,
            clientId: !!this.config.clientId
        });
        
        const dataStatus = this.checkDataAvailability();
        console.log('🔍 [SHEETS] DEBUG - Estado de datos:', dataStatus);
        
        // Verificar estado antes de actualizar UI
        this.verifyAuthState();
        
        console.log('🔄 [SHEETS] Forzando actualización de UI...');
        this.updateUIStatus();
        
        return {
            config: this.config,
            dataStatus: dataStatus
        };
    },

    /**
     * Sincronizar todos los datos
     */
    syncAll: async function() {
        try {
            Utils.showNotification('Sincronizando con Google Sheets...', 'info');
            
            // Verificar que la aplicación esté inicializada
            if (!AppState || !AppState.raffleConfig) {
                Utils.showNotification('La aplicación no está completamente inicializada', 'warning');
                
                // Intentar forzar inicialización
                if (window.RaffleApp && RaffleApp.init) {
                    console.log('🔄 [SHEETS] Intentando inicializar aplicación...');
                    RaffleApp.init();
                    // Esperar un momento para que se carguen los datos
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            // Verificar disponibilidad de datos actualizada
            const dataStatus = this.checkDataAvailability();
            console.log('📊 [SHEETS] Estado de datos antes de sync:', dataStatus);
            
            if (dataStatus.status === 'not_initialized') {
                Utils.showNotification('Error: Aplicación no inicializada', 'error');
                return;
            }
            
            if (dataStatus.status === 'no_raffle_config') {
                Utils.showNotification('Configura una rifa primero', 'warning');
                return;
            }
            
            // Si no hay datos, ofrecer opciones
            if (dataStatus.totalData === 0) {
                if (dataStatus.status === 'loading') {
                    // Intentar cargar datos desde Supabase
                    console.log('🔄 [SHEETS] Intentando cargar datos desde Supabase...');
                    
                    if (window.SupabaseManager && SupabaseManager.isConnected) {
                        try {
                            // Forzar recarga de datos
                            if (window.AdminManager && AdminManager.loadAllData) {
                                await AdminManager.loadAllData();
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                                // Verificar datos nuevamente
                                const newDataStatus = this.checkDataAvailability();
                                if (newDataStatus.totalData === 0) {
                                    Utils.showNotification('No hay ventas ni asignaciones registradas para sincronizar', 'info');
                                    this.refreshDataStatus();
                                    return;
                                }
                            }
                        } catch (loadError) {
                            console.error('❌ [SHEETS] Error cargando datos:', loadError);
                            Utils.showNotification('Error cargando datos desde la base', 'error');
                            return;
                        }
                    } else {
                        Utils.showNotification('Base de datos no conectada', 'warning');
                        return;
                    }
                } else {
                    Utils.showNotification('No hay datos para sincronizar', 'info');
                    return;
                }
            }
            
            let syncCount = 0;
            let errors = [];
            
            // Sincronizar ventas si hay datos
            if (dataStatus.hasSales) {
                try {
                    await this.syncSales();
                    syncCount++;
                } catch (error) {
                    console.error('❌ [SHEETS] Error sincronizando ventas:', error);
                    errors.push('ventas');
                }
            }
            
            // Sincronizar asignaciones si hay datos
            if (dataStatus.hasAssignments) {
                try {
                    await this.syncAssignments();
                    syncCount++;
                } catch (error) {
                    console.error('❌ [SHEETS] Error sincronizando asignaciones:', error);
                    errors.push('asignaciones');
                }
            }
            
            // Resultado final
            if (syncCount === 0 && errors.length > 0) {
                Utils.showNotification(`Error sincronizando: ${errors.join(', ')}`, 'error');
            } else if (syncCount > 0) {
                const message = errors.length > 0 
                    ? `Parcialmente sincronizado (${syncCount} de ${dataStatus.totalData} tablas)` 
                    : `✅ Datos sincronizados exitosamente (${syncCount} tablas)`;
                Utils.showNotification(message, syncCount === dataStatus.totalData ? 'success' : 'warning');
                
                // Actualizar estado después de sincronización exitosa
                this.refreshDataStatus();
            }
        } catch (error) {
            console.error('❌ [SHEETS] Error sincronizando:', error);
            
            // Manejar errores específicos
            let errorMessage = 'Error sincronizando con Google Sheets';
            
            if (error.message?.includes('relation')) {
                errorMessage = 'Error de base de datos - algunas tablas no existen';
            } else if (error.message?.includes('spreadsheet')) {
                errorMessage = 'Error con Google Sheets - verifica la configuración';
            } else if (error.message?.includes('network')) {
                errorMessage = 'Error de conexión - verifica tu internet';
            } else if (error.message?.includes('permission')) {
                errorMessage = 'Error de permisos - verifica la configuración de Google Sheets';
            }
            
            Utils.showNotification(errorMessage, 'error');
            throw error;
        }
    },
    
    /**
     * Actualizar rango en Google Sheets
     */
    updateRange: async function(spreadsheetId, range, values) {
        const response = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: values
            }
        });
        
        return response;
    },
    
    /**
     * Limpiar rango en Google Sheets
     */
    clearRange: async function(spreadsheetId, range) {
        const response = await gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: range
        });
        
        return response;
    },
    
    /**
     * Actualizar estado en la UI MEJORADO
     */
    updateUIStatus: function() {
        console.log('🔄 [SHEETS] Iniciando updateUIStatus...');
        
        const indicator = document.getElementById('sheetsConnectionIndicator');
        const text = document.getElementById('sheetsConnectionText');
        const details = document.getElementById('sheetsConnectionDetails');
        const createBtn = document.getElementById('createSheetsBtn');
        const syncBtn = document.getElementById('syncSheetsBtn');
        
        try {
            // Verificar que existan los elementos
            if (!indicator || !text || !details || !createBtn || !syncBtn) {
                console.warn('⚠️ [SHEETS] Elementos de UI no encontrados');
                console.log('🔍 [SHEETS] Elementos encontrados:', {
                    indicator: !!indicator,
                    text: !!text,
                    details: !!details,
                    createBtn: !!createBtn,
                    syncBtn: !!syncBtn
                });
                return;
            }
            
            // Verificar y sincronizar estado de autenticación
            this.verifyAuthState();
            
            // Log del estado actual
            console.log('🔍 [SHEETS] Estado en updateUIStatus:', {
                isSignedIn: this.config.isSignedIn,
                isInitialized: this.config.isInitialized,
                hasToken: !!this.config.accessToken,
                hasSpreadsheet: !!this.config.spreadsheetId
            });
            
            // Verificar disponibilidad de datos
            const dataStatus = this.checkDataAvailability();
            console.log('📊 [SHEETS] Estado de datos:', dataStatus);
            
            if (this.config.isSignedIn) {
                console.log('✅ [SHEETS] Aplicando estilo para usuario autenticado');
                indicator.style.background = '#28a745';
                text.textContent = 'Autenticado exitosamente';
                
                // Mensaje detallado basado en el estado de datos
                if (this.config.spreadsheetId) {
                    const sheetId = this.config.spreadsheetId.substring(0, 10) + '...';
                    details.innerHTML = `
                        <div>📄 Hoja: ${sheetId}</div>
                        <div style="margin-top: 5px; font-size: 11px;">
                            📊 ${dataStatus.message}
                        </div>
                    `;
                } else {
                    details.innerHTML = `
                        <div>✅ Listo para crear hoja de cálculo</div>
                        <div style="margin-top: 5px; font-size: 11px;">
                            📊 ${dataStatus.message}
                        </div>
                    `;
                }
                
                createBtn.disabled = false;
                
                // Lógica mejorada para el botón de sincronización
                const canSync = this.config.spreadsheetId && 
                               (dataStatus.totalData > 0 || dataStatus.status === 'loading');
                
                syncBtn.disabled = !canSync;
                
                // Actualizar texto del botón según el estado
                if (!this.config.spreadsheetId) {
                    syncBtn.textContent = '🔄 Sin Hoja';
                    syncBtn.title = 'Crea una hoja de cálculo primero';
                } else if (dataStatus.status === 'loading') {
                    syncBtn.textContent = '🔄 Cargar y Sync';
                    syncBtn.title = 'Forzar carga de datos y sincronizar';
                } else if (dataStatus.totalData === 0) {
                    syncBtn.textContent = '🔄 Sin Datos';
                    syncBtn.title = 'No hay datos para sincronizar';
                } else {
                    syncBtn.textContent = '🔄 Sincronizar';
                    syncBtn.title = `Sincronizar ${dataStatus.message}`;
                }
                
            } else if (this.config.isInitialized) {
                console.log('🟡 [SHEETS] Aplicando estilo para inicializado pero no autenticado');
                indicator.style.background = '#ffc107';
                text.textContent = 'Listo para autenticar';
                details.innerHTML = `
                    <div>🔑 Haz clic en "Configurar" para conectar</div>
                    <div style="margin-top: 5px; font-size: 11px;">
                        📊 ${dataStatus.message}
                    </div>
                `;
                createBtn.disabled = true;
                syncBtn.disabled = true;
                syncBtn.textContent = '🔄 No Autenticado';
            } else {
                console.log('🔴 [SHEETS] Aplicando estilo para no configurado');
                indicator.style.background = '#dc3545';
                text.textContent = 'No configurado';
                details.innerHTML = `
                    <div>⚙️ Configura las credenciales primero</div>
                    <div style="margin-top: 5px; font-size: 11px;">
                        📊 ${dataStatus.message}
                    </div>
                `;
                createBtn.disabled = true;
                syncBtn.disabled = true;
                syncBtn.textContent = '🔄 No Configurado';
            }
            
            console.log('✅ [SHEETS] updateUIStatus completado');
        } catch (error) {
            console.error('❌ [SHEETS] Error actualizando estado UI:', error);
        }
    },
    
    /**
     * Mostrar modal de configuración
     */
    showConfigModal: function() {
        const currentOrigin = window.location.origin;
        const isLocalhost = location.hostname === 'localhost';
        const isHTTPS = location.protocol === 'https:';
        
        const modalHtml = `
            <div id="googleSheetsConfigModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>📊 Configurar Google Sheets - GIS</h3>
                        <span class="close-btn" onclick="GoogleSheetsManager.closeConfigModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #bee5eb;">
                            <h4>🔄 Actualización Importante</h4>
                            <p><strong>Nueva implementación:</strong> Ahora usamos Google Identity Services (GIS) en lugar de la API deprecated.</p>
                            <p><strong>Estado actual:</strong> ${this.config.isInitialized ? '✅ Inicializado' : '❌ No inicializado'}</p>
                        </div>
                        
                        <div style="background: ${isHTTPS || isLocalhost ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isHTTPS || isLocalhost ? '#28a745' : '#dc3545'};">
                            <h4>🔒 Estado del Protocolo</h4>
                            <p><strong>URL Actual:</strong> <code>${currentOrigin}</code></p>
                            ${isHTTPS || isLocalhost ? 
                                '<p style="color: #155724;"><strong>✅ Protocolo correcto</strong> - Google OAuth funcionará</p>' :
                                '<p style="color: #721c24;"><strong>❌ Protocolo incorrecto</strong> - Google OAuth requiere HTTPS o localhost</p>'
                            }
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                            <h4>🚨 Configuración Requerida en Google Cloud Console</h4>
                            <p><strong>PASO CRÍTICO:</strong> Para resolver el error <code>idpiframe_initialization_failed</code>, debes:</p>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                <li>Ve a <strong><a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console > Credenciales</a></strong></li>
                                <li>Busca y edita tu <strong>OAuth 2.0 Client ID</strong></li>
                                <li>En <strong>"Orígenes de JavaScript autorizados"</strong>, agrega exactamente:</li>
                            </ol>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; border: 1px solid #ddd;">
                                ${currentOrigin}
                            </div>
                            <p><strong>⚠️ Sin esta configuración, la conexión fallará siempre.</strong></p>
                        </div>
                        
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4>🔧 Instrucciones Completas</h4>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                <li><strong>Habilita la API:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Ve a "APIs y servicios" > "Biblioteca"</li>
                                        <li>Busca "Google Sheets API" y habilítala</li>
                                    </ul>
                                </li>
                                <li><strong>Crea credenciales:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Crea una "Clave de API" (para API Key)</li>
                                        <li>Crea un "ID de cliente de OAuth 2.0" (para Client ID)</li>
                                    </ul>
                                </li>
                                <li><strong>Configura OAuth 2.0:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Tipo de aplicación: "Aplicación web"</li>
                                        <li><strong>Orígenes autorizados:</strong> <code>${currentOrigin}</code></li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                        
                        <div class="form-group">
                            <label for="googleApiKey">API Key:</label>
                            <input type="text" id="googleApiKey" placeholder="Tu Google API Key" value="${this.config.apiKey || ''}">
                            <small style="color: #6c757d;">Ejemplo: AIzaSyD-jURMnPjLogmHfyFHncEXw1fP5_SqBUU</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="googleClientId">Client ID:</label>
                            <input type="text" id="googleClientId" placeholder="Tu Google OAuth Client ID" value="${this.config.clientId || ''}">
                            <small style="color: #6c757d;">Ejemplo: 758158064041-xxxxx.apps.googleusercontent.com</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="existingSpreadsheetId">ID de Hoja Existente (opcional):</label>
                            <input type="text" id="existingSpreadsheetId" placeholder="ID de Google Sheets existente" value="${this.config.spreadsheetId || ''}">
                            <small style="color: #6c757d;">Deja vacío para crear una nueva hoja automáticamente</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="GoogleSheetsManager.closeConfigModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="GoogleSheetsManager.saveConfig()">💾 Guardar Configuración</button>
                        <button class="btn btn-success" onclick="GoogleSheetsManager.testConnection()" style="background: #28a745;">🔍 Probar Conexión</button>
                        <button class="btn btn-info" onclick="GoogleSheetsManager.runDiagnostics()" style="background: #17a2b8;">🔍 Diagnóstico</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('googleSheetsConfigModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },
    
    /**
     * Cerrar modal de configuración
     */
    closeConfigModal: function() {
        const modal = document.getElementById('googleSheetsConfigModal');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * Guardar configuración
     */
    saveConfig: function() {
        const apiKey = document.getElementById('googleApiKey').value.trim();
        const clientId = document.getElementById('googleClientId').value.trim();
        const spreadsheetId = document.getElementById('existingSpreadsheetId').value.trim();
        
        if (!apiKey || !clientId) {
            Utils.showNotification('Por favor completa API Key y Client ID', 'error');
            return;
        }
        
        this.setCredentials(apiKey, clientId, spreadsheetId);
        
        Utils.showNotification('Configuración guardada exitosamente', 'success');
        this.updateUIStatus();
        this.closeConfigModal();
    },
    
    /**
     * Probar conexión
     */
    testConnection: async function() {
        try {
            Utils.showNotification('Probando conexión...', 'info');
            
            const apiKey = document.getElementById('googleApiKey')?.value.trim() || this.config.apiKey;
            const clientId = document.getElementById('googleClientId')?.value.trim() || this.config.clientId;
            
            if (!apiKey || !clientId) {
                Utils.showNotification('Completa las credenciales primero', 'error');
                return;
            }
            
            // Verificar protocolo
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                Utils.showNotification('Se requiere HTTPS o localhost para Google OAuth', 'error');
                return;
            }
            
            // Configurar temporalmente
            this.config.apiKey = apiKey;
            this.config.clientId = clientId;
            this.config.isInitialized = false;
            
            console.log('🔍 [SHEETS] Probando configuración con GIS...');
            console.log('🔍 [SHEETS] API Key:', apiKey.substring(0, 10) + '...');
            console.log('🔍 [SHEETS] Client ID:', clientId.substring(0, 20) + '...');
            console.log('🔍 [SHEETS] Origen actual:', window.location.origin);
            
            const initialized = await this.init();
            
            if (initialized) {
                Utils.showNotification('Conexión exitosa! 🎉', 'success');
                console.log('✅ [SHEETS] Test de conexión exitoso');
            } else {
                Utils.showNotification('Error en la inicialización', 'error');
            }
            
        } catch (error) {
            console.error('❌ [SHEETS] Error probando conexión:', error);
            
            let errorMessage = 'Error probando conexión';
            
            if (error.message.includes('Dominio no autorizado')) {
                errorMessage = 'Dominio no autorizado en Google Cloud Console';
            } else if (error.message.includes('HTTPS')) {
                errorMessage = 'Se requiere HTTPS o localhost';
            } else if (error.message.includes('API key')) {
                errorMessage = 'API Key inválida';
            } else if (error.message.includes('Client ID')) {
                errorMessage = 'Client ID inválido';
            } else if (error.error) {
                errorMessage = `Error de Google: ${error.error}`;
            }
            
            Utils.showNotification(errorMessage, 'error');
            
            // Mostrar detalles técnicos en consola
            console.group('🔍 [SHEETS] Detalles del error:');
            console.log('Mensaje:', error.message);
            console.log('Error completo:', error);
            console.log('URL actual:', window.location.href);
            console.log('Protocolo:', location.protocol);
            console.log('Hostname:', location.hostname);
            console.groupEnd();
        }
    },
    
    /**
     * Obtener estado de configuración
     */
    getStatus: function() {
        return {
            configured: !!(this.config.apiKey && this.config.clientId),
            initialized: this.config.isInitialized,
            signedIn: this.config.isSignedIn,
            hasSpreadsheet: !!this.config.spreadsheetId
        };
    },
    
    /**
     * Diagnóstico completo del sistema
     */
    runDiagnostics: function() {
        console.group('🔍 [SHEETS] Diagnóstico del Sistema GIS');
        
        // Información del entorno
        console.log('🌐 Entorno:');
        console.log('  URL:', window.location.href);
        console.log('  Protocolo:', location.protocol);
        console.log('  Hostname:', location.hostname);
        console.log('  Puerto:', location.port);
        console.log('  Origen:', window.location.origin);
        
        // Estado de la configuración
        console.log('⚙️ Configuración:');
        console.log('  API Key configurada:', !!this.config.apiKey);
        console.log('  Client ID configurado:', !!this.config.clientId);
        console.log('  Spreadsheet ID:', this.config.spreadsheetId || 'No configurado');
        console.log('  Inicializado:', this.config.isInitialized);
        console.log('  Conectado:', this.config.isSignedIn);
        
        // Verificación de protocolos
        console.log('🔒 Protocolo:');
        const isHTTPS = location.protocol === 'https:';
        const isLocalhost = location.hostname === 'localhost';
        const isValidProtocol = isHTTPS || isLocalhost;
        console.log('  HTTPS:', isHTTPS ? '✅' : '❌');
        console.log('  Localhost:', isLocalhost ? '✅' : '❌');
        console.log('  Válido para OAuth:', isValidProtocol ? '✅' : '❌');
        
        // APIs disponibles
        console.log('🛠️ APIs:');
        console.log('  Google API cargada:', typeof window.gapi !== 'undefined' ? '✅' : '❌');
        console.log('  Google Identity Services disponible:', 
            typeof window.google !== 'undefined' && 
            window.google.accounts ? '✅' : '❌'
        );
        
        // Nuevo en GIS: verificar cliente de tokens
        console.log('  Token Client inicializado:', !!this.config.tokenClient ? '✅' : '❌');
        console.log('  Access Token presente:', !!this.config.accessToken ? '✅' : '❌');
        
        // Recomendaciones
        console.log('💡 Recomendaciones:');
        if (!isValidProtocol) {
            console.warn('  ⚠️ Usa HTTPS o localhost para OAuth');
        }
        if (!this.config.apiKey) {
            console.warn('  ⚠️ Configura API Key de Google');
        }
        if (!this.config.clientId) {
            console.warn('  ⚠️ Configura Client ID de Google');
        }
        
        // Instrucción específica para el error actual
        if (this.config.apiKey && this.config.clientId && !isValidProtocol) {
            console.error('  🎯 PROBLEMA PRINCIPAL: Protocolo HTTP no permitido');
            console.log('  🔧 SOLUCIÓN: Usar HTTPS o cambiar a localhost');
        } else if (this.config.apiKey && this.config.clientId && isValidProtocol) {
            console.error('  🎯 PROBLEMA PRINCIPAL: Origen no autorizado en Google Cloud');
            console.log(`  🔧 SOLUCIÓN: Agregar '${window.location.origin}' en Google Cloud Console`);
            console.log('  📖 GUÍA: https://console.cloud.google.com/apis/credentials');
        }
        
        console.groupEnd();
        
        return {
            protocol: isValidProtocol,
            configured: !!(this.config.apiKey && this.config.clientId),
            apis: typeof window.gapi !== 'undefined',
            gis: typeof window.google !== 'undefined' && window.google.accounts,
            recommendations: {
                needsHTTPS: !isValidProtocol,
                needsCredentials: !(this.config.apiKey && this.config.clientId),
                needsOriginAuth: isValidProtocol && this.config.apiKey && this.config.clientId
            }
        };
    }
};

// Cargar credenciales al inicializar
GoogleSheetsManager.loadCredentials();

console.log('✅ Google Sheets Manager (GIS) cargado correctamente');
