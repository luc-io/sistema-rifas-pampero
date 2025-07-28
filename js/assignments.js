/**
 * Gestor de asignaciones de numeros
 */
const AssignmentsManager = {
    
    /**
     * Crear interfaz de asignaciones
     */
    createInterface: function() {
        if (!AppState.raffleConfig) {
            document.getElementById('assignmentsContent').innerHTML = `
                <div class="setup-needed">
                    <h3>🎯 Configura tu rifa primero</h3>
                    <p>Ve a la pestaña "Configurar" para crear tu rifa</p>
                </div>
            `;
            return;
        }

        const container = document.getElementById('assignmentsContent');
        container.innerHTML = `
            <div class="assignments-header">
                <h3>📋 Gestión de Asignaciones</h3>
                <div class="search-box-container">
                    <input type="text" id="assignmentSearchBox" class="search-box" placeholder="Buscar por vendedor o teléfono..." onkeyup="AssignmentsManager.filterAssignments()">
                </div>
            </div>
            
            <!-- Botón para crear nueva asignación -->
            <div class="assignment-create-section">
                <button class="btn btn-primary" onclick="AssignmentsManager.showCreateAssignmentModal()">
                    ➕ Crear Nueva Asignación
                </button>
            </div>
            
            <div class="assignments-stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalAssignments">0</div>
                    <div class="stat-label">Total Asignaciones</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="paidAssignments">0</div>
                    <div class="stat-label">Pagadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="pendingAssignments">0</div>
                    <div class="stat-label">Pendientes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="expiredAssignments">0</div>
                    <div class="stat-label">Vencidas</div>
                </div>
            </div>
            
            <div id="assignmentsList" class="assignments-list">
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones registradas aún</p>
            </div>
        `;
        
        this.updateAssignmentsList();
    },
    
    /**
     * Actualizar lista de asignaciones
     */
    updateAssignmentsList: function() {
        if (!AppState.assignments || AppState.assignments.length === 0) {
            document.getElementById('assignmentsList').innerHTML = `
                <p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones registradas aún</p>
            `;
            this.updateAssignmentsStats();
            return;
        }
        
        const container = document.getElementById('assignmentsList');
        container.innerHTML = AppState.assignments.map(assignment => `
            <div class="assignment-card" data-assignment-id="${assignment.id}">
                <div class="assignment-header">
                    <div class="assignment-seller">
                        <strong>${assignment.seller_name} ${assignment.seller_lastname || ''}</strong>
                        <div class="seller-phone">${assignment.seller_phone}</div>
                    </div>
                    <div class="assignment-status status-${assignment.status}">
                        ${this.getStatusText(assignment.status)}
                    </div>
                </div>
                
                <div class="assignment-details">
                    <div class="assignment-numbers">
                        <strong>Números:</strong> ${assignment.numbers.map(n => Utils.formatNumber(n)).join(', ')}
                    </div>
                    <div class="assignment-amount">
                        <strong>Total:</strong> ${Utils.formatPrice(assignment.total_amount)}
                    </div>
                    ${assignment.payment_deadline ? `
                        <div class="assignment-deadline">
                            <strong>Vence:</strong> ${Utils.formatDateTime(assignment.payment_deadline)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="assignment-actions">
                    <button class="btn btn-sm btn-secondary" onclick="AssignmentsManager.showOwnersEditModal('${assignment.id}')">
                        ✏️ Editar Titulares
                    </button>
                    <button class="btn btn-sm btn-info" onclick="AssignmentsManager.sendReminder('${assignment.id}')">
                        📱 Recordatorio
                    </button>
                </div>
            </div>
        `).join('');
        
        this.updateAssignmentsStats();
    },
    
    /**
     * Actualizar estadísticas de asignaciones
     */
    updateAssignmentsStats: function() {
        if (!AppState.assignments) {
            document.getElementById('totalAssignments').textContent = '0';
            document.getElementById('paidAssignments').textContent = '0';
            document.getElementById('pendingAssignments').textContent = '0';
            document.getElementById('expiredAssignments').textContent = '0';
            return;
        }
        
        const total = AppState.assignments.length;
        const paid = AppState.assignments.filter(a => a.status === 'paid').length;
        const pending = AppState.assignments.filter(a => a.status === 'assigned').length;
        const expired = AppState.assignments.filter(a => a.status === 'expired').length;
        
        document.getElementById('totalAssignments').textContent = total;
        document.getElementById('paidAssignments').textContent = paid;
        document.getElementById('pendingAssignments').textContent = pending;
        document.getElementById('expiredAssignments').textContent = expired;
    },
    
    /**
     * Mostrar modal para crear nueva asignación
     */
    showCreateAssignmentModal: function() {
        const modalHtml = `
            <div id="createAssignmentModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>➕ Crear Nueva Asignación</h3>
                        <span class="close-btn" onclick="AssignmentsManager.closeCreateAssignmentModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="sellerName">Nombre del vendedor:</label>
                            <input type="text" id="sellerName" placeholder="Nombre del vendedor" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="sellerLastName">Apellido del vendedor:</label>
                            <input type="text" id="sellerLastName" placeholder="Apellido del vendedor" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="sellerPhone">Teléfono del vendedor:</label>
                            <input type="tel" id="sellerPhone" placeholder="Teléfono del vendedor" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Método de asignación de números:</label>
                            <div class="assignment-method-radio">
                                <label>
                                    <input type="radio" name="assignmentMethod" value="manual" checked onchange="AssignmentsManager.toggleAssignmentMethod()">
                                    <span>Manual (especificar números)</span>
                                </label>
                                <label>
                                    <input type="radio" name="assignmentMethod" value="consecutive" onchange="AssignmentsManager.toggleAssignmentMethod()">
                                    <span>Consecutivos (cantidad automática)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group" id="manualNumbersGroup">
                            <label for="assignedNumbers">Números a asignar:</label>
                            <input type="text" id="assignedNumbers" placeholder="Ej: 001,002,003 o 001-005">
                            <small style="color: #6c757d;">Puedes usar rangos (001-005) o lista separada por comas (001,002,003)</small>
                        </div>
                        
                        <div class="form-group" id="consecutiveNumbersGroup" style="display: none;">
                            <label for="consecutiveCount">Cantidad de números consecutivos:</label>
                            <input type="number" id="consecutiveCount" min="1" max="50" placeholder="Ej: 10">
                            <div class="consecutive-info">
                                🔄 <strong>Números consecutivos automáticos:</strong> El sistema buscará y asignará la primera secuencia de números consecutivos disponibles.
                                <br>📊 Ejemplo: Si solicitas 5 números, podrías obtener 045, 046, 047, 048, 049.
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="paymentDeadline">Fecha límite de pago:</label>
                            <input type="datetime-local" id="paymentDeadline" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="assignmentNotes">Notas (opcional):</label>
                            <textarea id="assignmentNotes" rows="3" placeholder="Notas adicionales sobre la asignación"></textarea>
                        </div>
                        
                        <div id="assignmentPreview" class="assignment-preview" style="display: none;">
                            <h4>Vista previa:</h4>
                            <div id="previewContent"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="AssignmentsManager.closeCreateAssignmentModal()">Cancelar</button>
                        <button class="btn btn-info" onclick="AssignmentsManager.previewAssignment()">🔍 Vista Previa</button>
                        <button class="btn btn-primary" onclick="AssignmentsManager.createAssignment()">✅ Crear Asignación</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('createAssignmentModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar fecha mínima como mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('paymentDeadline').min = tomorrow.toISOString().slice(0, 16);
        
        // Configurar fecha por defecto (24 horas)
        const defaultDeadline = new Date();
        defaultDeadline.setHours(defaultDeadline.getHours() + 24);
        document.getElementById('paymentDeadline').value = defaultDeadline.toISOString().slice(0, 16);
    },
    
    /**
     * Alternar entre modo manual y consecutivo
     */
    toggleAssignmentMethod: function() {
        const method = document.querySelector('input[name="assignmentMethod"]:checked').value;
        const manualGroup = document.getElementById('manualNumbersGroup');
        const consecutiveGroup = document.getElementById('consecutiveNumbersGroup');
        
        if (method === 'manual') {
            manualGroup.style.display = 'block';
            consecutiveGroup.style.display = 'none';
        } else {
            manualGroup.style.display = 'none';
            consecutiveGroup.style.display = 'block';
            // Actualizar información de números consecutivos disponibles
            setTimeout(() => this.updateConsecutiveInfo(), 100);
        }
    },
    
    /**
     * Encontrar números consecutivos disponibles
     */
    findConsecutiveNumbers: function(count) {
        const maxNumber = AppState.raffleConfig.totalNumbers - 1;
        const allSoldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const allAssignedNumbers = AppState.assignments
            .filter(a => a.status === 'assigned')
            .flatMap(a => a.numbers);
        const unavailableNumbers = [...allSoldNumbers, ...allAssignedNumbers];
        
        // Buscar secuencia consecutiva disponible
        for (let start = 0; start <= maxNumber - count + 1; start++) {
            let isConsecutiveAvailable = true;
            
            for (let i = 0; i < count; i++) {
                if (unavailableNumbers.includes(start + i)) {
                    isConsecutiveAvailable = false;
                    break;
                }
            }
            
            if (isConsecutiveAvailable) {
                const consecutiveNumbers = [];
                for (let i = 0; i < count; i++) {
                    consecutiveNumbers.push(start + i);
                }
                return consecutiveNumbers;
            }
        }
        
        return null; // No se encontraron números consecutivos disponibles
        
    },
    
    /**
     * Calcular máximos números consecutivos disponibles
     */
    getMaxConsecutiveAvailable: function() {
        const maxNumber = AppState.raffleConfig.totalNumbers - 1;
        const allSoldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const allAssignedNumbers = AppState.assignments
            .filter(a => a.status === 'assigned')
            .flatMap(a => a.numbers);
        const unavailableNumbers = new Set([...allSoldNumbers, ...allAssignedNumbers]);
        
        let maxConsecutive = 0;
        let currentConsecutive = 0;
        
        for (let i = 0; i <= maxNumber; i++) {
            if (!unavailableNumbers.has(i)) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 0;
            }
        }
        
        return maxConsecutive;
    },
    
    /**
     * Actualizar información de números consecutivos disponibles
     */
    updateConsecutiveInfo: function() {
        const infoDiv = document.querySelector('.consecutive-info');
        if (!infoDiv) return;
        
        const maxAvailable = this.getMaxConsecutiveAvailable();
        const totalAvailable = AppState.raffleConfig.totalNumbers - 
            AppState.sales.reduce((sum, sale) => sum + sale.numbers.length, 0) -
            AppState.assignments.filter(a => a.status === 'assigned').reduce((sum, a) => sum + a.numbers.length, 0);
            
        infoDiv.innerHTML = `
            🔄 <strong>Números consecutivos automáticos:</strong> El sistema buscará y asignará la primera secuencia de números consecutivos disponibles.
            <br>📊 Máximo consecutivo disponible: <strong>${maxAvailable}</strong> números
            <br>📊 Total disponibles: <strong>${totalAvailable}</strong> números
            <br>💫 Ejemplo: Si solicitas 5 números, podrías obtener 045, 046, 047, 048, 049.
        `;
        
        // Actualizar el max del input
        const countInput = document.getElementById('consecutiveCount');
        if (countInput) {
            countInput.max = Math.min(maxAvailable, 50);
        }
    },
    
    /**
     * Cerrar modal de crear asignación
     */
    closeCreateAssignmentModal: function() {
        const modal = document.getElementById('createAssignmentModal');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * Vista previa de la asignación
     */
    previewAssignment: function() {
        const method = document.querySelector('input[name="assignmentMethod"]:checked').value;
        let numbers = [];
        
        try {
            if (method === 'manual') {
                const numbersInput = document.getElementById('assignedNumbers').value.trim();
                if (!numbersInput) {
                    Utils.showNotification('Ingresa los números a asignar', 'warning');
                    return;
                }
                numbers = this.parseNumbersInput(numbersInput);
            } else {
                const count = parseInt(document.getElementById('consecutiveCount').value);
                if (!count || count < 1) {
                    Utils.showNotification('Ingresa una cantidad válida de números', 'warning');
                    return;
                }
                numbers = this.findConsecutiveNumbers(count);
                if (!numbers) {
                    Utils.showNotification(`No se encontraron ${count} números consecutivos disponibles`, 'error');
                    return;
                }
            }
            
            const validation = this.validateNumbers(numbers);
            
            const previewDiv = document.getElementById('assignmentPreview');
            const previewContent = document.getElementById('previewContent');
            
            if (validation.isValid) {
                const total = numbers.length * AppState.raffleConfig.price;
                const firstNumber = numbers.length > 0 ? Math.min(...numbers) : 0;
                const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
                const isConsecutive = method === 'consecutive' || (numbers.length > 1 && lastNumber - firstNumber === numbers.length - 1);
                
                previewContent.innerHTML = `
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                        <p><strong>✅ Números válidos:</strong> ${numbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                        <p><strong>📊 Cantidad:</strong> ${numbers.length} números</p>
                        <p><strong>💰 Total:</strong> ${Utils.formatPrice(total)}</p>
                        ${method === 'consecutive' ? '<p><strong>🔄 Método:</strong> Números consecutivos automáticos</p>' : ''}
                        ${isConsecutive && numbers.length > 1 ? `<p><strong>🔢 Secuencia:</strong> Del ${Utils.formatNumber(firstNumber)} al ${Utils.formatNumber(lastNumber)}</p>` : ''}
                    </div>
                `;
            } else {
                previewContent.innerHTML = `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                        <p><strong>❌ Error en los números:</strong></p>
                        <ul>
                            ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                        ${validation.soldNumbers.length > 0 ? `
                            <p><strong>⚠️ Números ya vendidos:</strong> ${validation.soldNumbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                        ` : ''}
                        ${validation.assignedNumbers.length > 0 ? `
                            <p><strong>🗒 Números ya asignados:</strong> ${validation.assignedNumbers.map(n => Utils.formatNumber(n)).join(', ')}</p>
                        ` : ''}
                    </div>
                `;
            }
            
            previewDiv.style.display = 'block';
        } catch (error) {
            Utils.showNotification('Error procesando los números: ' + error.message, 'error');
        }
    },
    
    /**
     * Crear nueva asignación
     */
    createAssignment: async function() {
        const sellerName = document.getElementById('sellerName').value.trim();
        const sellerLastName = document.getElementById('sellerLastName').value.trim();
        const sellerPhone = document.getElementById('sellerPhone').value.trim();
        const paymentDeadline = document.getElementById('paymentDeadline').value;
        const notes = document.getElementById('assignmentNotes').value.trim();
        const method = document.querySelector('input[name="assignmentMethod"]:checked').value;
        
        // Validaciones básicas
        const fieldValidation = AssignmentValidation.validateRequiredFields(sellerName, sellerLastName, sellerPhone, paymentDeadline);
        if (!fieldValidation.isValid) {
            Utils.showNotification(`Error: ${fieldValidation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Validar formato de teléfono
        if (!AssignmentValidation.validatePhone(sellerPhone)) {
            Utils.showNotification('El formato del teléfono no es válido', 'error');
            return;
        }
        
        let numbers = [];
        
        try {
            // Obtener números según el método seleccionado
            if (method === 'manual') {
                const numbersInput = document.getElementById('assignedNumbers').value.trim();
                if (!numbersInput) {
                    Utils.showNotification('Ingresa los números a asignar', 'error');
                    return;
                }
                numbers = this.parseNumbersInput(numbersInput);
            } else {
                const count = parseInt(document.getElementById('consecutiveCount').value);
                if (!count || count < 1) {
                    Utils.showNotification('Ingresa una cantidad válida de números', 'error');
                    return;
                }
                numbers = this.findConsecutiveNumbers(count);
                if (!numbers) {
                    Utils.showNotification(`No se encontraron ${count} números consecutivos disponibles`, 'error');
                    return;
                }
            }
            
            const validation = this.validateNumbers(numbers);
            
            if (!validation.isValid) {
                Utils.showNotification(`Error: ${validation.errors.join(', ')}`, 'error');
                return;
            }
            
            const assignment = {
                id: Utils.generateId(),
                seller_name: sellerName,
                seller_lastname: sellerLastName,
                seller_phone: AssignmentValidation.formatPhone(sellerPhone),
                numbers: numbers,
                total_amount: numbers.length * AppState.raffleConfig.price,
                status: 'assigned',
                assigned_at: new Date(),
                created_at: new Date(),
                payment_deadline: new Date(paymentDeadline),
                assignment_method: method, // Guardar el método usado
                notes: notes || null
            };
            
            // Crear titulares para cada número
            const numberOwners = numbers.map(number => ({
                id: Utils.generateId(),
                assignment_id: assignment.id,
                number_value: number,
                name: '',
                phone: '',
                email: '',
                notes: '',
                created_at: new Date(),
                edited_at: new Date()
            }));
            
            // Guardar en estado local
            AppState.assignments.push(assignment);
            AppState.numberOwners.push(...numberOwners);
            
            // Guardar en base de datos
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.saveAssignment(assignment);
                await Promise.all(numberOwners.map(owner => SupabaseManager.saveNumberOwner(owner)));
                console.log('✅ [ASSIGNMENTS] Asignación guardada en Supabase');
            } else {
                autoSave();
                console.log('📱 [ASSIGNMENTS] Asignación guardada en localStorage');
            }
            
            // Actualizar UI
            this.updateAssignmentsList();
            this.closeCreateAssignmentModal();
            
            const methodText = method === 'consecutive' ? 'consecutivos automáticos' : 'manuales';
            Utils.showNotification(`Asignación creada exitosamente para ${sellerName} ${sellerLastName} (${numbers.length} números ${methodText})`, 'success');
            
        } catch (error) {
            console.error('❌ [ASSIGNMENTS] Error creando asignación:', error);
            Utils.showNotification('Error creando la asignación: ' + error.message, 'error');
        }
    },
    
    /**
     * Parsear entrada de números (acepta rangos y listas)
     */
    parseNumbersInput: function(input) {
        const numbers = [];
        const parts = input.split(',').map(p => p.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                // Es un rango
                const [start, end] = part.split('-').map(p => parseInt(p.trim()));
                if (isNaN(start) || isNaN(end) || start > end) {
                    throw new Error(`Rango inválido: ${part}`);
                }
                for (let i = start; i <= end; i++) {
                    numbers.push(i);
                }
            } else {
                // Es un número individual
                const num = parseInt(part);
                if (isNaN(num)) {
                    throw new Error(`Número inválido: ${part}`);
                }
                numbers.push(num);
            }
        }
        
        return [...new Set(numbers)]; // Eliminar duplicados
    },
    
    /**
     * Validar números antes de asignar
     */
    validateNumbers: function(numbers) {
        const errors = [];
        const soldNumbers = [];
        const assignedNumbers = [];
        
        // Verificar rango válido
        const maxNumber = AppState.raffleConfig.totalNumbers - 1;
        const invalidNumbers = numbers.filter(n => n < 0 || n > maxNumber);
        if (invalidNumbers.length > 0) {
            errors.push(`Números fuera de rango (0-${maxNumber}): ${invalidNumbers.join(', ')}`);
        }
        
        // Verificar números ya vendidos
        const allSoldNumbers = AppState.sales.flatMap(sale => sale.numbers);
        const conflictingSold = numbers.filter(n => allSoldNumbers.includes(n));
        if (conflictingSold.length > 0) {
            soldNumbers.push(...conflictingSold);
            errors.push(`Números ya vendidos: ${conflictingSold.map(n => Utils.formatNumber(n)).join(', ')}`);
        }
        
        // Verificar números ya asignados
        const allAssignedNumbers = AppState.assignments
            .filter(a => a.status === 'assigned')
            .flatMap(a => a.numbers);
        const conflictingAssigned = numbers.filter(n => allAssignedNumbers.includes(n));
        if (conflictingAssigned.length > 0) {
            assignedNumbers.push(...conflictingAssigned);
            errors.push(`Números ya asignados: ${conflictingAssigned.map(n => Utils.formatNumber(n)).join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            soldNumbers,
            assignedNumbers
        };
    },
    
    /**
     * Mostrar modal de edicion de titulares
     */
    showOwnersEditModal: function(assignmentId) {
        console.log('showOwnersEditModal llamado con ID:', assignmentId);
        
        const assignment = AppState.assignments.find(a => a.id == assignmentId);
        if (!assignment) {
            console.error('Asignacion no encontrada:', assignmentId);
            Utils.showNotification('Asignacion no encontrada', 'error');
            return;
        }

        const owners = AppState.numberOwners.filter(o => o.assignment_id == assignmentId);
        console.log('Titulares encontrados:', owners);

        const modalHtml = `
            <div id="ownersEditModal" class="modal" style="display: block;">
                <div class="modal-content owners-edit-modal">
                    <div class="modal-header">
                        <h3>Editar Titulares - ${assignment.seller_name}</h3>
                        <span class="close-btn" onclick="AssignmentsManager.closeOwnersEditModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="owners-edit-container">
                            ${owners.map(owner => `
                                <div class="owner-edit-row" data-owner-id="${owner.id || ''}" data-number="${owner.number_value}">
                                    <div class="owner-number">
                                        <strong>Numero ${Utils.formatNumber(owner.number_value)}</strong>
                                    </div>
                                    <div class="owner-fields">
                                        <div class="field-group">
                                            <label>Nombre:</label>
                                            <input type="text" data-field="name" value="${owner.name || ''}" placeholder="Nombre del titular">
                                        </div>
                                        <div class="field-group">
                                            <label>Telefono:</label>
                                            <input type="text" data-field="phone" value="${owner.phone || ''}" placeholder="Telefono del titular">
                                        </div>
                                        <div class="field-group">
                                            <label>Email:</label>
                                            <input type="email" data-field="email" value="${owner.email || ''}" placeholder="Email del titular">
                                        </div>
                                        <div class="field-group">
                                            <label>Notas:</label>
                                            <input type="text" data-field="notes" value="${owner.notes || ''}" placeholder="Notas adicionales">
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="AssignmentsManager.closeOwnersEditModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="AssignmentsManager.saveOwnerChanges('${assignmentId}')">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('ownersEditModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Guardar cambios de titulares
     */
    saveOwnerChanges: async function(assignmentId) {
        console.log('saveOwnerChanges llamado con ID:', assignmentId);
        
        const modal = document.getElementById('ownersEditModal');
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        const rows = modal.querySelectorAll('.owner-edit-row');
        console.log('Filas encontradas:', rows.length);
        
        try {
            for (const row of rows) {
                const ownerId = row.dataset.ownerId;
                const number = parseInt(row.dataset.number);
                const fields = row.querySelectorAll('input[data-field]');
                
                console.log('Procesando titular ID:', ownerId, 'Numero:', number);
                
                const ownerData = {};
                fields.forEach(field => {
                    ownerData[field.dataset.field] = field.value.trim();
                });
                ownerData.edited_at = new Date();

                console.log('Datos a actualizar:', ownerData);

                // Actualizar en memoria local
                const owner = AppState.numberOwners.find(o => 
                    o.assignment_id == assignmentId && o.number_value === number
                );
                
                if (owner) {
                    Object.assign(owner, ownerData);
                    console.log('Titular actualizado en memoria:', owner);
                } else {
                    console.warn('Titular no encontrado en memoria');
                }

                // Actualizar en Supabase si esta conectado
                if (window.SupabaseManager && SupabaseManager.isConnected && ownerId) {
                    await SupabaseManager.updateNumberOwner(ownerId, ownerData);
                    console.log('Titular actualizado en Supabase');
                } else if (typeof autoSave === 'function') {
                    autoSave();
                    console.log('Cambios guardados localmente');
                }
            }

            this.closeOwnersEditModal();
            Utils.showNotification('Titulares actualizados exitosamente', 'success');
            
        } catch (error) {
            console.error('Error actualizando titulares:', error);
            Utils.showNotification('Error actualizando los titulares', 'error');
        }
    },

    /**
     * Cerrar modal de edicion de titulares
     */
    closeOwnersEditModal: function() {
        const modal = document.getElementById('ownersEditModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Enviar recordatorio a vendedor
     */
    sendReminder: function(assignmentId) {
        console.log('sendReminder llamado con ID:', assignmentId);
        
        const assignment = AppState.assignments.find(a => a.id == assignmentId);
        if (!assignment) {
            console.error('Asignacion no encontrada:', assignmentId);
            Utils.showNotification('Asignacion no encontrada', 'error');
            return;
        }

        const message = this.generateReminderMessage(assignment);
        const cleanPhone = assignment.seller_phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
        Utils.showNotification('Recordatorio enviado por WhatsApp', 'success');
    },

    /**
     * Generar mensaje de recordatorio
     */
    generateReminderMessage: function(assignment) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        let message = `RECORDATORIO - ${AppState.raffleConfig.name}\n\n`;
        message += `Hola ${assignment.seller_name}!\n\n`;
        
        if (assignment.status === 'assigned') {
            message += `Tienes numeros asignados pendientes de pago:\n`;
            message += `Numeros: ${numbersFormatted}\n`;
            message += `Total: ${Utils.formatPrice(assignment.total_amount)}\n\n`;
            if (assignment.payment_deadline) {
                message += `Plazo limite: ${Utils.formatDateTime(assignment.payment_deadline)}\n`;
            }
            message += `Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
            message += `Por favor confirma tu pago para asegurar la participacion.\n\n`;
        } else if (assignment.status === 'paid') {
            message += `Estado de tu asignacion:\n`;
            message += `Numeros: ${numbersFormatted}\n`;
            message += `Estado: Pagado\n`;
            message += `Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
            message += `Perfecto! Tus numeros estan confirmados para el sorteo.\n\n`;
        } else {
            message += `Estado de tu asignacion:\n`;
            message += `Numeros: ${numbersFormatted}\n`;
            message += `Estado: ${this.getStatusText(assignment.status)}\n\n`;
        }
        
        message += `Para consultas, contacta:\n`;
        message += `${AppState.raffleConfig.whatsappNumber}\n\n`;
        message += `Gracias por tu colaboracion!\n`;
        message += `${AppState.raffleConfig.organization}`;
        
        return message;
    },

    /**
     * Obtener texto del estado
     */
    getStatusText: function(status) {
        const statusMap = {
            'assigned': 'Asignado',
            'paid': 'Pagado',
            'expired': 'Vencido',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    },

    /**
     * Filtrar asignaciones
     */
    filterAssignments: function() {
        const searchTerm = document.getElementById('assignmentSearchBox').value.toLowerCase().trim();
        const assignmentCards = document.querySelectorAll('.assignment-card');
        
        assignmentCards.forEach(card => {
            const sellerText = card.querySelector('.assignment-seller').textContent.toLowerCase();
            const phoneText = card.querySelector('.seller-phone') ? card.querySelector('.seller-phone').textContent.toLowerCase() : '';
            
            if (sellerText.includes(searchTerm) || phoneText.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
};

console.log('AssignmentsManager cargado correctamente');