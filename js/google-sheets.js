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
        
        // Verificar protocolo HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('⚠️ [SHEETS] Google OAuth requiere HTTPS. Usando localhost o servidor HTTPS.');
            throw new Error('Google OAuth requiere HTTPS. Debe usar localhost para desarrollo o un servidor HTTPS.');
        }
        
        try {
            console.log('🔄 [SHEETS] Inicializando Google API...');
            await this.loadGoogleAPI();
            await this.initializeGapi();
            this.config.isInitialized = true;
            console.log('✅ [SHEETS] Google Sheets API inicializada');
            return true;
        } catch (error) {
            console.error('❌ [SHEETS] Error inicializando Google Sheets:', error);
            
            // Proporcionar mensaje de error más descriptivo
            if (error.error === 'idpiframe_initialization_failed') {
                const currentOrigin = window.location.origin;
                throw new Error(`Dominio no autorizado. Agrega '${currentOrigin}' como origen autorizado en Google Cloud Console:\n\n1. Ve a Google Cloud Console\n2. APIs y servicios > Credenciales\n3. Edita tu OAuth 2.0 Client ID\n4. Agrega '${currentOrigin}' en 'Orígenes de JavaScript autorizados'`);
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
            `${assignment.seller_name} ${assignment.seller_lastname || ''}`.trim(),
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
        const currentOrigin = window.location.origin;
        const isLocalhost = location.hostname === 'localhost';
        const isHTTPS = location.protocol === 'https:';
        
        const modalHtml = `
            <div id="googleSheetsConfigModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 Configurar Google Sheets</h3>
                        <span class="close-btn" onclick="GoogleSheetsManager.closeConfigModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="background: ${isHTTPS || isLocalhost ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${isHTTPS || isLocalhost ? '#28a745' : '#dc3545'};">
                            <h4>🔒 Estado del Protocolo</h4>
                            <p><strong>URL Actual:</strong> <code>${currentOrigin}</code></p>
                            ${isHTTPS || isLocalhost ? 
                                '<p style="color: #155724;"><strong>✅ Protocolo correcto</strong> - Google OAuth funcionará</p>' :
                                '<p style="color: #721c24;"><strong>❌ Protocolo incorrecto</strong> - Google OAuth requiere HTTPS o localhost</p>'
                            }
                        </div>
                        
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4>🔧 Instrucciones de Configuración</h4>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                <li><strong>Ve a la <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></strong></li>
                                <li><strong>Crea un proyecto nuevo</strong> o selecciona uno existente</li>
                                <li><strong>Habilita la API:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Ve a "APIs y servicios" > "Biblioteca"</li>
                                        <li>Busca "Google Sheets API" y habilítala</li>
                                    </ul>
                                </li>
                                <li><strong>Crea credenciales:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Ve a "APIs y servicios" > "Credenciales"</li>
                                        <li>Clic en "+ CREAR CREDENCIALES"</li>
                                        <li>Selecciona "Clave de API" (para API Key)</li>
                                        <li>Selecciona "ID de cliente de OAuth 2.0" (para Client ID)</li>
                                    </ul>
                                </li>
                                <li><strong>Configura OAuth 2.0:</strong>
                                    <ul style="margin: 5px 0; padding-left: 15px;">
                                        <li>Tipo de aplicación: "Aplicación web"</li>
                                        <li><strong>Orígenes autorizados:</strong> <code>${currentOrigin}</code></li>
                                        <li><strong>URI de redirección:</strong> <code>${currentOrigin}</code></li>
                                    </ul>
                                </li>
                            </ol>
                            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px;">
                                <strong>⚠️ Importante:</strong> Copia exactamente esta URL como origen autorizado:<br>
                                <code style="background: #f8f9fa; padding: 2px 5px; border-radius: 3px;">${currentOrigin}</code>
                            </div>
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
        this.config.isInitialized = false; // Forzar reinicialización
        
        Utils.showNotification('Configuración guardada exitosamente', 'success');
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
            const previousApiKey = this.config.apiKey;
            const previousClientId = this.config.clientId;
            const previousInitialized = this.config.isInitialized;
            
            this.config.apiKey = apiKey;
            this.config.clientId = clientId;
            this.config.isInitialized = false;
            
            console.log('🔍 [SHEETS] Probando configuración...');
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
        console.group('🔍 [SHEETS] Diagnóstico del Sistema');
        
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
        console.log('  Google Auth disponible:', 
            typeof window.gapi !== 'undefined' && 
            window.gapi.auth2 ? '✅' : '❌'
        );
        
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
        }
        
        console.groupEnd();
        
        return {
            protocol: isValidProtocol,
            configured: !!(this.config.apiKey && this.config.clientId),
            apis: typeof window.gapi !== 'undefined',
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

console.log('✅ Google Sheets Manager cargado correctamente');
