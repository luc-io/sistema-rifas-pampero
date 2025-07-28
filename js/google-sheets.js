/**
 * INTEGRACIÓN CON GOOGLE SHEETS - Sistema de Rifas Pampero
 * Maneja la sincronización de datos con Google Sheets
 */

window.GoogleSheetsManager = {
    
    // Configuración de Google Sheets API
    config: {
        apiKey: null,
        clientId: null,
        discoveryDoc: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
        spreadsheetId: null,
        isInitialized: false,
        isSignedIn: false
    },
    
    /**
     * Inicializar Google Sheets API
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
        
        try {
            await this.loadGoogleAPI();
            await this.initializeGapi();
            this.config.isInitialized = true;
            console.log('✅ [SHEETS] Google Sheets API inicializada');
            return true;
        } catch (error) {
            console.error('❌ [SHEETS] Error inicializando Google Sheets:', error);
            return false;
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
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    /**
     * Inicializar GAPI
     */
    initializeGapi: function() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.config.apiKey,
                        clientId: this.config.clientId,
                        discoveryDocs: [this.config.discoveryDoc],
                        scope: this.config.scopes
                    });
                    
                    // Verificar estado de autenticación
                    const authInstance = gapi.auth2.getAuthInstance();
                    this.config.isSignedIn = authInstance.isSignedIn.get();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
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
     * Iniciar sesión en Google
     */
    signIn: async function() {
        if (!this.config.isInitialized) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('No se pudo inicializar Google Sheets API');
            }
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        this.config.isSignedIn = true;
        
        Utils.showNotification('Conectado a Google Sheets exitosamente', 'success');
        return true;
    },
    
    /**
     * Cerrar sesión
     */
    signOut: async function() {
        if (this.config.isInitialized) {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            this.config.isSignedIn = false;
            Utils.showNotification('Desconectado de Google Sheets', 'info');
        }
    },
    
    /**
     * Crear nueva hoja de cálculo para la rifa
     */
    createRaffleSpreadsheet: async function(raffleName) {
        if (!this.config.isSignedIn) {
            await this.signIn();
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
            ['Asignaciones Activas', '=COUNTIF(Asignaciones!G:G,\"assigned\")']
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
        }
        
        // Limpiar datos existentes (excepto headers)\n        await this.clearRange(this.config.spreadsheetId, 'Ventas!A2:O1000');\n        \n        // Preparar datos de ventas\n        const salesData = AppState.sales.map(sale => [\n            sale.id,\n            Utils.formatDateTime(sale.date),\n            sale.buyer.name,\n            sale.buyer.lastName,\n            sale.buyer.phone,\n            sale.buyer.email || '',\n            sale.buyer.instagram || '',\n            sale.numbers.map(n => Utils.formatNumber(n)).join(', '),\n            sale.numbers.length,\n            sale.total,\n            AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod,\n            sale.status,\n            AppConstants.MEMBER_LABELS[sale.buyer.membershipArea] || 'No especificado',\n            sale.buyer.membershipArea || '',\n            sale.buyer.navigationInterest || ''\n        ]);\n        \n        if (salesData.length > 0) {\n            await this.updateRange(\n                this.config.spreadsheetId,\n                `Ventas!A2:O${salesData.length + 1}`,\n                salesData\n            );\n        }\n        \n        console.log('✅ [SHEETS] Ventas sincronizadas');\n    },\n    \n    /**\n     * Sincronizar asignaciones con Google Sheets\n     */\n    syncAssignments: async function() {\n        if (!this.config.spreadsheetId) {\n            throw new Error('No hay hoja de cálculo configurada');\n        }\n        \n        if (!this.config.isSignedIn) {\n            await this.signIn();\n        }\n        \n        // Limpiar datos existentes (excepto headers)\n        await this.clearRange(this.config.spreadsheetId, 'Asignaciones!A2:J1000');\n        \n        // Preparar datos de asignaciones\n        const assignmentsData = AppState.assignments.map(assignment => [\n            assignment.id,\n            assignment.seller_name,\n            assignment.seller_phone,\n            assignment.numbers.map(n => Utils.formatNumber(n)).join(', '),\n            assignment.numbers.length,\n            assignment.total_amount,\n            assignment.status,\n            Utils.formatDateTime(assignment.assigned_at),\n            assignment.payment_deadline ? Utils.formatDateTime(assignment.payment_deadline) : '',\n            assignment.notes || ''\n        ]);\n        \n        if (assignmentsData.length > 0) {\n            await this.updateRange(\n                this.config.spreadsheetId,\n                `Asignaciones!A2:J${assignmentsData.length + 1}`,\n                assignmentsData\n            );\n        }\n        \n        console.log('✅ [SHEETS] Asignaciones sincronizadas');\n    },\n    \n    /**\n     * Sincronizar todos los datos\n     */\n    syncAll: async function() {\n        try {\n            Utils.showNotification('Sincronizando con Google Sheets...', 'info');\n            \n            await this.syncSales();\n            await this.syncAssignments();\n            \n            Utils.showNotification('Datos sincronizados exitosamente', 'success');\n        } catch (error) {\n            console.error('❌ [SHEETS] Error sincronizando:', error);\n            Utils.showNotification('Error sincronizando con Google Sheets', 'error');\n            throw error;\n        }\n    },\n    \n    /**\n     * Actualizar rango en Google Sheets\n     */\n    updateRange: async function(spreadsheetId, range, values) {\n        const response = await gapi.client.sheets.spreadsheets.values.update({\n            spreadsheetId: spreadsheetId,\n            range: range,\n            valueInputOption: 'USER_ENTERED',\n            resource: {\n                values: values\n            }\n        });\n        \n        return response;\n    },\n    \n    /**\n     * Limpiar rango en Google Sheets\n     */\n    clearRange: async function(spreadsheetId, range) {\n        const response = await gapi.client.sheets.spreadsheets.values.clear({\n            spreadsheetId: spreadsheetId,\n            range: range\n        });\n        \n        return response;\n    },\n    \n    /**\n     * Mostrar modal de configuración\n     */\n    showConfigModal: function() {\n        const modalHtml = `\n            <div id=\"googleSheetsConfigModal\" class=\"modal\" style=\"display: block;\">\n                <div class=\"modal-content\">\n                    <div class=\"modal-header\">\n                        <h3>📊 Configurar Google Sheets</h3>\n                        <span class=\"close-btn\" onclick=\"GoogleSheetsManager.closeConfigModal()\">&times;</span>\n                    </div>\n                    <div class=\"modal-body\">\n                        <div style=\"background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;\">\n                            <h4>🔧 Instrucciones de Configuración</h4>\n                            <ol>\n                                <li>Ve a la <a href=\"https://console.cloud.google.com/\" target=\"_blank\">Google Cloud Console</a></li>\n                                <li>Crea un nuevo proyecto o selecciona uno existente</li>\n                                <li>Habilita la API de Google Sheets</li>\n                                <li>Crea credenciales (API Key y OAuth 2.0 Client ID)</li>\n                                <li>Configura el dominio autorizado</li>\n                            </ol>\n                        </div>\n                        \n                        <div class=\"form-group\">\n                            <label for=\"googleApiKey\">API Key:</label>\n                            <input type=\"text\" id=\"googleApiKey\" placeholder=\"Tu Google API Key\" value=\"${this.config.apiKey || ''}\">\n                        </div>\n                        \n                        <div class=\"form-group\">\n                            <label for=\"googleClientId\">Client ID:</label>\n                            <input type=\"text\" id=\"googleClientId\" placeholder=\"Tu Google OAuth Client ID\" value=\"${this.config.clientId || ''}\">\n                        </div>\n                        \n                        <div class=\"form-group\">\n                            <label for=\"existingSpreadsheetId\">ID de Hoja Existente (opcional):</label>\n                            <input type=\"text\" id=\"existingSpreadsheetId\" placeholder=\"ID de Google Sheets existente\" value=\"${this.config.spreadsheetId || ''}\">\n                            <small style=\"color: #6c757d;\">Deja vacío para crear una nueva hoja automáticamente</small>\n                        </div>\n                    </div>\n                    <div class=\"modal-footer\">\n                        <button class=\"btn btn-secondary\" onclick=\"GoogleSheetsManager.closeConfigModal()\">Cancelar</button>\n                        <button class=\"btn btn-primary\" onclick=\"GoogleSheetsManager.saveConfig()\">💾 Guardar Configuración</button>\n                        <button class=\"btn btn-success\" onclick=\"GoogleSheetsManager.testConnection()\" style=\"background: #28a745;\">🔍 Probar Conexión</button>\n                    </div>\n                </div>\n            </div>\n        `;\n        \n        document.body.insertAdjacentHTML('beforeend', modalHtml);\n    },\n    \n    /**\n     * Cerrar modal de configuración\n     */\n    closeConfigModal: function() {\n        const modal = document.getElementById('googleSheetsConfigModal');\n        if (modal) {\n            modal.remove();\n        }\n    },\n    \n    /**\n     * Guardar configuración\n     */\n    saveConfig: function() {\n        const apiKey = document.getElementById('googleApiKey').value.trim();\n        const clientId = document.getElementById('googleClientId').value.trim();\n        const spreadsheetId = document.getElementById('existingSpreadsheetId').value.trim();\n        \n        if (!apiKey || !clientId) {\n            Utils.showNotification('Por favor completa API Key y Client ID', 'error');\n            return;\n        }\n        \n        this.setCredentials(apiKey, clientId, spreadsheetId);\n        this.config.isInitialized = false; // Forzar reinicialización\n        \n        Utils.showNotification('Configuración guardada exitosamente', 'success');\n        this.closeConfigModal();\n    },\n    \n    /**\n     * Probar conexión\n     */\n    testConnection: async function() {\n        try {\n            const apiKey = document.getElementById('googleApiKey').value.trim();\n            const clientId = document.getElementById('googleClientId').value.trim();\n            \n            if (!apiKey || !clientId) {\n                Utils.showNotification('Completa las credenciales primero', 'error');\n                return;\n            }\n            \n            // Configurar temporalmente\n            this.config.apiKey = apiKey;\n            this.config.clientId = clientId;\n            this.config.isInitialized = false;\n            \n            const initialized = await this.init();\n            if (initialized) {\n                Utils.showNotification('Conexión exitosa! 🎉', 'success');\n            } else {\n                Utils.showNotification('Error en la conexión', 'error');\n            }\n        } catch (error) {\n            console.error('❌ [SHEETS] Error probando conexión:', error);\n            Utils.showNotification('Error probando conexión: ' + error.message, 'error');\n        }\n    },\n    \n    /**\n     * Obtener estado de configuración\n     */\n    getStatus: function() {\n        return {\n            configured: !!(this.config.apiKey && this.config.clientId),\n            initialized: this.config.isInitialized,\n            signedIn: this.config.isSignedIn,\n            hasSpreadsheet: !!this.config.spreadsheetId\n        };\n    }\n};\n\n// Cargar credenciales al inicializar\nGoogleSheetsManager.loadCredentials();\n\nconsole.log('✅ Google Sheets Manager cargado correctamente');\n