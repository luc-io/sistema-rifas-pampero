/**
 * CONFIGURACIÓN SEGURA - Sistema de Rifas Pampero
 * Manejo seguro de credenciales sin exposición en el código
 */

window.AppConfig = {
    // 🔒 Configuración de Supabase
    supabase: {
        url: null,
        anonKey: null,
        isConfigured: false
    },

    // 🎛️ Configuración de la aplicación
    app: {
        name: 'Sistema de Rifas Pampero',
        version: '2.0.0',
        environment: 'production'
    },

    /**
     * 🔧 Inicializar configuración desde variables de entorno o prompt
     */
    init: function() {
        console.log('🔧 Inicializando configuración segura...');
        
        // Método 1: Intentar cargar desde variables de entorno (si están disponibles)
        this.loadFromEnvironment();
        
        // Método 2: Si no están configuradas, solicitar al usuario
        if (!this.supabase.isConfigured) {
            this.promptForCredentials();
        }
        
        return this.supabase.isConfigured;
    },

    /**
     * 📂 Cargar desde variables de entorno (Digital Ocean App Platform)
     */
    loadFromEnvironment: function() {
        console.log('🔍 [CONFIG] Verificando variables de entorno...');
        console.log('🔍 [CONFIG] window.SUPABASE_URL:', !!window.SUPABASE_URL ? '✅ Encontrada' : '❌ No encontrada');
        console.log('🔍 [CONFIG] window.SUPABASE_ANON_KEY:', !!window.SUPABASE_ANON_KEY ? '✅ Encontrada' : '❌ No encontrada');
        
        // Método 1: Variables de entorno inyectadas (Digital Ocean App Platform)
        // Estas variables se configuran en el panel de Digital Ocean
        const envUrl = window.SUPABASE_URL;
        const envKey = window.SUPABASE_ANON_KEY;
        
        if (envUrl && envKey) {
            console.log('🌐 [CONFIG] Usando variables de entorno de Digital Ocean');
            this.supabase.url = envUrl;
            this.supabase.anonKey = envKey;
            this.supabase.isConfigured = true;
            console.log('✅ [CONFIG] Configuración cargada desde variables de entorno');
            return;
        }
        
        console.log('📁 [CONFIG] Variables de entorno no disponibles, verificando localStorage...');
        
        // Método 2: Configuración almacenada localmente (fallback)
        const storedConfig = localStorage.getItem('supabase_config_secure');
        
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                this.supabase.url = config.url;
                this.supabase.anonKey = config.anonKey;
                this.supabase.isConfigured = true;
                console.log('✅ [CONFIG] Configuración cargada desde almacenamiento seguro');
            } catch (error) {
                console.warn('⚠️ [CONFIG] Error cargando configuración almacenada');
            }
        } else {
            console.log('📁 [CONFIG] No hay configuración en localStorage');
        }
        
        if (!this.supabase.isConfigured) {
            console.log('⚠️ [CONFIG] No se encontró configuración, se solicitará al usuario');
        }
    },

    /**
     * 🔑 Solicitar credenciales al usuario de forma segura
     */
    promptForCredentials: function() {
        const hasCredentials = confirm(
            '🔒 CONFIGURACIÓN DE SUPABASE REQUERIDA\n\n' +
            'Para conectar con la base de datos, necesitas configurar las credenciales de Supabase.\n\n' +
            '¿Tienes las credenciales de Supabase disponibles?'
        );

        if (hasCredentials) {
            this.showCredentialsForm();
        } else {
            this.showInstructions();
        }
    },

    /**
     * 📝 Mostrar formulario de credenciales
     */
    showCredentialsForm: function() {
        const credentialsHtml = `
            <div class="credentials-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
                align-items: center; justify-content: center;
            ">
                <div style="
                    background: white; padding: 30px; border-radius: 10px; 
                    max-width: 500px; width: 90%;
                ">
                    <h3>🔒 Configuración de Supabase</h3>
                    <p>Ingresa las credenciales de tu proyecto de Supabase:</p>
                    
                    <div style="margin: 15px 0;">
                        <label>URL del proyecto:</label>
                        <input type="url" id="supabaseUrl" placeholder="https://tu-proyecto.supabase.co" 
                               style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label>Anon Key (clave pública):</label>
                        <textarea id="supabaseAnonKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                                  style="width: 100%; padding: 8px; margin-top: 5px; height: 100px;"></textarea>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <strong>⚠️ Importante:</strong><br>
                        • Solo usa la <strong>Anon Key</strong> (segura para el frontend)<br>
                        • <strong>NUNCA</strong> uses la Service Role Key<br>
                        • Las credenciales se almacenan localmente en tu navegador
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="AppConfig.saveCredentials()" style="
                            background: #4CAF50; color: white; padding: 10px 20px; 
                            border: none; border-radius: 5px; margin: 5px; cursor: pointer;
                        ">💾 Guardar y Conectar</button>
                        
                        <button onclick="AppConfig.closeCredentialsForm()" style="
                            background: #f44336; color: white; padding: 10px 20px; 
                            border: none; border-radius: 5px; margin: 5px; cursor: pointer;
                        ">❌ Cancelar</button>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 12px; color: #666;">
                        📖 <a href="https://app.supabase.com/project/_/settings/api" target="_blank">
                            ¿Dónde encontrar mis credenciales?
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', credentialsHtml);
    },

    /**
     * 💾 Guardar credenciales de forma segura
     */
    saveCredentials: function() {
        const url = document.getElementById('supabaseUrl').value.trim();
        const anonKey = document.getElementById('supabaseAnonKey').value.trim();
        
        if (!url || !anonKey) {
            alert('❌ Por favor completa todos los campos');
            return;
        }
        
        if (!url.includes('supabase.co')) {
            alert('❌ La URL debe ser de Supabase (contener "supabase.co")');
            return;
        }
        
        if (!anonKey.startsWith('eyJ')) {
            alert('❌ La Anon Key debe ser un JWT válido (empezar con "eyJ")');
            return;
        }
        
        // Verificar que no sea una service key (las service keys tienen "service_role" en el payload)
        try {
            const payload = JSON.parse(atob(anonKey.split('.')[1]));
            if (payload.role === 'service_role') {
                alert('🚨 ¡PELIGRO! Has ingresado una SERVICE ROLE KEY.\n\nEsta clave NUNCA debe usarse en el frontend.\nUsa solo la ANON KEY.');
                return;
            }
        } catch (error) {
            alert('❌ La clave no tiene un formato JWT válido');
            return;
        }
        
        // Guardar de forma segura
        const config = { url, anonKey };
        localStorage.setItem('supabase_config_secure', JSON.stringify(config));
        
        this.supabase.url = url;
        this.supabase.anonKey = anonKey;
        this.supabase.isConfigured = true;
        
        this.closeCredentialsForm();
        
        // Reinicializar la aplicación con las nuevas credenciales
        if (window.RaffleApp && window.RaffleApp.initSupabase) {
            window.RaffleApp.initSupabase();
        }
        
        alert('✅ Credenciales configuradas correctamente!');
    },

    /**
     * ❌ Cerrar formulario de credenciales
     */
    closeCredentialsForm: function() {
        const modal = document.querySelector('.credentials-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * 📖 Mostrar instrucciones para obtener credenciales
     */
    showInstructions: function() {
        const instructionsHtml = `
            <div class="instructions-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
                align-items: center; justify-content: center;
            ">
                <div style="
                    background: white; padding: 30px; border-radius: 10px; 
                    max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;
                ">
                    <h3>📖 Cómo obtener las credenciales de Supabase</h3>
                    
                    <ol style="text-align: left;">
                        <li>Ve a <a href="https://app.supabase.com" target="_blank">app.supabase.com</a></li>
                        <li>Selecciona tu proyecto</li>
                        <li>Ve a <strong>Settings</strong> → <strong>API</strong></li>
                        <li>Copia la <strong>URL</strong> del proyecto</li>
                        <li>Copia la <strong>anon/public key</strong> (NO la service_role)</li>
                    </ol>
                    
                    <div style="background: #f8d7da; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <strong>🚨 IMPORTANTE:</strong><br>
                        • Solo usa la <strong>anon/public key</strong><br>
                        • <strong>NUNCA</strong> uses la <strong>service_role key</strong><br>
                        • La service_role key puede acceder a todo sin restricciones
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="AppConfig.showCredentialsForm()" style="
                            background: #4CAF50; color: white; padding: 10px 20px; 
                            border: none; border-radius: 5px; margin: 5px; cursor: pointer;
                        ">🔑 Tengo las credenciales</button>
                        
                        <button onclick="AppConfig.useDemoMode()" style="
                            background: #2196F3; color: white; padding: 10px 20px; 
                            border: none; border-radius: 5px; margin: 5px; cursor: pointer;
                        ">🎮 Usar modo demo</button>
                        
                        <button onclick="AppConfig.closeInstructions()" style="
                            background: #f44336; color: white; padding: 10px 20px; 
                            border: none; border-radius: 5px; margin: 5px; cursor: pointer;
                        ">❌ Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', instructionsHtml);
    },

    /**
     * 🎮 Usar modo demo (solo localStorage)
     */
    useDemoMode: function() {
        this.closeInstructions();
        localStorage.setItem('demo_mode', 'true');
        if (window.RaffleApp && window.RaffleApp.updateDbStatus) {
            window.RaffleApp.updateDbStatus('🎮 Modo Demo (Solo localStorage)', '#e7f3ff');
        }
        alert('🎮 Modo demo activado. Los datos se guardarán solo localmente.');
    },

    /**
     * ❌ Cerrar instrucciones
     */
    closeInstructions: function() {
        const modal = document.querySelector('.instructions-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * 🗑️ Limpiar configuración almacenada
     */
    clearStoredConfig: function() {
        localStorage.removeItem('supabase_config_secure');
        localStorage.removeItem('demo_mode');
        this.supabase.url = null;
        this.supabase.anonKey = null;
        this.supabase.isConfigured = false;
        console.log('🗑️ Configuración limpiada');
    },

    /**
     * 📊 Obtener estadísticas de configuración
     */
    getConfigStats: function() {
        return {
            isConfigured: this.supabase.isConfigured,
            hasUrl: !!this.supabase.url,
            hasKey: !!this.supabase.anonKey,
            isDemoMode: localStorage.getItem('demo_mode') === 'true'
        };
    }
};

console.log('✅ AppConfig (seguro) cargado correctamente');
