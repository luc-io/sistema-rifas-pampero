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
        }
        
        // Limpiar datos existentes (excepto headers)
        await this.clearRange(this.config.spreadsheetId, 'Ventas!A2:O1000');
        
        // Preparar datos de ventas
        const salesData = AppState.sales.map(sale => [
            sale.id,
            Utils.formatDateTime(sale.date),
            sale.buyer.name,
            sale.buyer.lastName,
            sale.buyer.phone,
            sale.buyer.email || '',
            sale.buyer.instagram || '',
            sale.numbers.map(n => Utils.formatNumber(n)).join(', '),
            sale.numbers.length,
            sale.total,
            AppConstants.PAYMENT_METHODS[sale.paymentMethod] || sale.paymentMethod,
            sale.status,
            AppConstants.MEMBER_LABELS[sale.buyer.membershipArea] || 'No especificado',
            sale.buyer.membershipArea || '',
            sale.buyer.navigationInterest || ''
        ]);
        
        if (salesData.length > 0) {
            await this.updateRange(
                this.config.spreadsheetId,
                `Ventas!A2:O${salesData.length + 1}`,
                salesData
            );
        }
        
        console.log('✅ [SHEETS] Ventas sincronizadas');
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
        }
        
        // Limpiar datos existentes (excepto headers)
        await this.clearRange(this.config.spreadsheetId, 'Asignaciones!A2:J1000');
        
        // Preparar datos de asignaciones
        const assignmentsData = AppState.assignments.map(assignment => [
            assignment.id,
            assignment.seller_name,
            assignment.seller_phone,
            assignment.numbers.map(n => Utils.formatNumber(n)).join(', '),
            assignment.numbers.length,
            assignment.total_amount,
            assignment.status,
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
        
        console.log('✅ [SHEETS] Asignaciones sincronizadas');
    },
    
    /**
     * Sincronizar todos los datos
     */
    syncAll: async function() {
        try {
            Utils.showNotification('Sincronizando con Google Sheets...', 'info');
            
            await this.syncSales();
            await this.syncAssignments();
            
            Utils.showNotification('Datos sincronizados exitosamente', 'success');
        } catch (error) {
            console.error('❌ [SHEETS] Error sincronizando:', error);
            Utils.showNotification('Error sincronizando con Google Sheets', 'error');
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
     * Mostrar modal de configuración
     */
    showConfigModal: function() {
        const modalHtml = `
            <div id="googleSheetsConfigModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 Configurar Google Sheets</h3>
                        <span class="close-btn" onclick="GoogleSheetsManager.closeConfigModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4>🔧 Instrucciones de Configuración</h4>
                            <ol>
                                <li>Ve a la <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                                <li>Crea un nuevo proyecto o selecciona uno existente</li>
                                <li>Habilita la API de Google Sheets</li>
                                <li>Crea credenciales (API Key y OAuth 2.0 Client ID)</li>
                                <li>Configura el dominio autorizado</li>
                            </ol>
                        </div>
                        
                        <div class="form-group">
                            <label for="googleApiKey">API Key:</label>
                            <input type="text" id="googleApiKey" placeholder="Tu Google API Key" value="${this.config.apiKey || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="googleClientId">Client ID:</label>
                            <input type="text" id="googleClientId" placeholder="Tu Google OAuth Client ID" value="${this.config.clientId || ''}">
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
                    </div>
                </div>
            </div>
        `;
        
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
        this.config.isInitialized = false; // Forzar reinicialización
        
        Utils.showNotification('Configuración guardada exitosamente', 'success');
        this.closeConfigModal();
    },
    
    /**
     * Probar conexión
     */
    testConnection: async function() {
        try {
            const apiKey = document.getElementById('googleApiKey').value.trim();
            const clientId = document.getElementById('googleClientId').value.trim();
            
            if (!apiKey || !clientId) {
                Utils.showNotification('Completa las credenciales primero', 'error');
                return;
            }
            
            // Configurar temporalmente
            this.config.apiKey = apiKey;
            this.config.clientId = clientId;
            this.config.isInitialized = false;
            
            const initialized = await this.init();
            if (initialized) {
                Utils.showNotification('Conexión exitosa! 🎉', 'success');
            } else {
                Utils.showNotification('Error en la conexión', 'error');
            }
        } catch (error) {
            console.error('❌ [SHEETS] Error probando conexión:', error);
            Utils.showNotification('Error probando conexión: ' + error.message, 'error');
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
    }
};

// Cargar credenciales al inicializar
GoogleSheetsManager.loadCredentials();

console.log('✅ Google Sheets Manager cargado correctamente');
