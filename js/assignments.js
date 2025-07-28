/**
 * GESTIÓN DE ASIGNACIONES - Sistema de Rifas Pampero
 * Maneja la asignación obligatoria de números a vendedores
 */

window.AssignmentsManager = {
    /**
     * Crear interfaz de asignaciones
     */
    createInterface: function() {
        if (!AppState.raffleConfig) return;

        const container = document.getElementById('assignmentsContent');
        container.innerHTML = `
            <div class="assignment-section">
                <h3>🎯 Crear Nueva Asignación</h3>
                <div class="assignment-form">
                    <div class="form-group">
                        <label for="sellerName">Nombre del Vendedor *</label>
                        <input type="text" id="sellerName" required>
                    </div>
                    <div class="form-group">
                        <label for="sellerLastname">Apellido *</label>
                        <input type="text" id="sellerLastname" required>
                    </div>
                    <div class="form-group">
                        <label for="sellerPhone">Teléfono *</label>
                        <input type="tel" id="sellerPhone" required placeholder="+54 341 123-4567">
                    </div>
                    <div class="form-group">
                        <label for="sellerEmail">Email (opcional)</label>
                        <input type="email" id="sellerEmail">
                    </div>
                    <div class="form-group">
                        <label for="assignmentNumbers">Números a Asignar *</label>
                        <input type="text" id="assignmentNumbers" placeholder="001-010 o 001,005,020,025" required>
                        <small>Formato: 001-010 (rango) o 001,005,020 (específicos)</small>
                    </div>
                    <div class="form-group">
                        <label for="paymentDeadline">Plazo de Pago</label>
                        <input type="datetime-local" id="paymentDeadline">
                        <small>Fecha límite para que el vendedor confirme el pago</small>
                    </div>
                    <div class="form-group">
                        <label for="assignmentNotes">Notas (opcional)</label>
                        <textarea id="assignmentNotes" rows="2" placeholder="Observaciones sobre esta asignación"></textarea>
                    </div>
                    <div class="assignment-summary" id="assignmentSummary" style="display: none;">
                        <h4>📋 Resumen de Asignación</h4>
                        <div id="summaryNumbers"></div>
                        <div id="summaryTotal"></div>
                    </div>
                    <button class="btn" onclick="AssignmentsManager.createAssignment()">📤 Asignar y Notificar</button>
                </div>
            </div>

            <div class="assignment-section">
                <h3>📊 Asignaciones Activas</h3>
                <div id="assignmentsList" class="assignments-list">
                    <p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones registradas</p>
                </div>
            </div>

            <div class="assignment-section">
                <h3>🔍 Buscar Asignación</h3>
                <input type="text" class="search-box" id="assignmentSearchBox" 
                       placeholder="Buscar por nombre o teléfono del vendedor..." 
                       onkeyup="AssignmentsManager.filterAssignments()">
            </div>
        `;

        // Agregar eventos
        document.getElementById('assignmentNumbers').addEventListener('input', this.updateAssignmentSummary.bind(this));
        
        // Cargar asignaciones existentes
        this.loadAssignments();
    },

    /**
     * Actualizar resumen de asignación mientras se escribe
     */
    updateAssignmentSummary: function() {
        const numbersInput = document.getElementById('assignmentNumbers').value.trim();
        const summary = document.getElementById('assignmentSummary');
        const summaryNumbers = document.getElementById('summaryNumbers');
        const summaryTotal = document.getElementById('summaryTotal');

        if (!numbersInput) {
            summary.style.display = 'none';
            return;
        }

        try {
            const numbers = this.parseNumberInput(numbersInput);
            if (numbers.length > 0) {
                summary.style.display = 'block';
                summaryNumbers.textContent = `Números: ${numbers.map(n => Utils.formatNumber(n)).join(', ')} (${numbers.length} números)`;
                summaryTotal.textContent = `Total: ${Utils.formatPrice(numbers.length * AppState.raffleConfig.price)}`;
            } else {
                summary.style.display = 'none';
            }
        } catch (error) {
            summary.style.display = 'none';
        }
    },

    /**
     * Parsear entrada de números (rangos o específicos)
     */
    parseNumberInput: function(input) {
        const numbers = [];
        const parts = input.split(',').map(s => s.trim());

        for (const part of parts) {
            if (part.includes('-')) {
                // Rango: 001-010
                const [start, end] = part.split('-').map(s => parseInt(s.trim()));
                if (isNaN(start) || isNaN(end) || start > end) {
                    throw new Error(`Rango inválido: ${part}`);
                }
                for (let i = start; i <= end; i++) {
                    if (i >= 0 && i < AppState.raffleConfig.totalNumbers) {
                        numbers.push(i);
                    }
                }
            } else {
                // Número específico
                const num = parseInt(part);
                if (!isNaN(num) && num >= 0 && num < AppState.raffleConfig.totalNumbers) {
                    numbers.push(num);
                }
            }
        }

        // Eliminar duplicados y ordenar
        return [...new Set(numbers)].sort((a, b) => a - b);
    },

    /**
     * Verificar disponibilidad de números
     */
    checkNumbersAvailability: function(numbers) {
        const unavailable = [];
        
        // Verificar números vendidos
        AppState.sales.forEach(sale => {
            sale.numbers.forEach(num => {
                if (numbers.includes(num)) {
                    unavailable.push({ number: num, reason: 'vendido', detail: `${sale.buyer.name} ${sale.buyer.lastName}` });
                }
            });
        });

        // Verificar números ya asignados
        if (AppState.assignments) {
            AppState.assignments.filter(a => a.status !== 'cancelled').forEach(assignment => {
                assignment.numbers.forEach(num => {
                    if (numbers.includes(num)) {
                        unavailable.push({ number: num, reason: 'asignado', detail: `${assignment.seller_name} ${assignment.seller_lastname}` });
                    }
                });
            });
        }

        return unavailable;
    },

    /**
     * Crear nueva asignación
     */
    createAssignment: async function() {
        const sellerData = {
            name: Utils.sanitizeInput(document.getElementById('sellerName').value),
            lastname: Utils.sanitizeInput(document.getElementById('sellerLastname').value),
            phone: Utils.sanitizeInput(document.getElementById('sellerPhone').value),
            email: Utils.sanitizeInput(document.getElementById('sellerEmail').value)
        };

        const numbersInput = document.getElementById('assignmentNumbers').value.trim();
        const paymentDeadline = document.getElementById('paymentDeadline').value;
        const notes = document.getElementById('assignmentNotes').value.trim();

        // Validaciones
        if (!sellerData.name || !sellerData.lastname || !sellerData.phone || !numbersInput) {
            Utils.showNotification('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        if (!Utils.validateWhatsApp(sellerData.phone)) {
            Utils.showNotification('Por favor ingresa un número de WhatsApp válido', 'error');
            return;
        }

        let numbers;
        try {
            numbers = this.parseNumberInput(numbersInput);
            if (numbers.length === 0) {
                throw new Error('No se encontraron números válidos');
            }
        } catch (error) {
            Utils.showNotification(`Error en formato de números: ${error.message}`, 'error');
            return;
        }

        // Verificar disponibilidad
        const unavailable = this.checkNumbersAvailability(numbers);
        if (unavailable.length > 0) {
            const message = `Los siguientes números no están disponibles:\n${unavailable.map(u => `${Utils.formatNumber(u.number)} (${u.reason}: ${u.detail})`).join('\n')}`;
            Utils.showNotification(message, 'error');
            return;
        }

        // Crear asignación
        const assignment = {
            id: Utils.generateId(),
            raffle_id: AppState.raffleConfig.id || 1,
            seller_name: sellerData.name,
            seller_lastname: sellerData.lastname,
            seller_phone: sellerData.phone,
            seller_email: sellerData.email || null,
            numbers: numbers,
            total_amount: numbers.length * AppState.raffleConfig.price,
            status: 'assigned',
            assigned_at: new Date(),
            payment_deadline: paymentDeadline ? new Date(paymentDeadline) : null,
            notes: notes || null
        };

        try {
            // Guardar en Supabase o localStorage
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.saveAssignment(assignment);
                console.log('✅ [ASSIGNMENT] Guardada en Supabase');
            } else {
                // Fallback a localStorage
                if (!AppState.assignments) AppState.assignments = [];
                AppState.assignments.push(assignment);
                await autoSave();
                console.log('📱 [ASSIGNMENT] Guardada en localStorage');
            }

            // Crear registros de titulares iniciales (vendedor como titular)
            await this.createInitialOwners(assignment);

            // Actualizar interfaz
            this.loadAssignments();
            NumbersManager.updateDisplay();

            // Generar mensaje de WhatsApp
            const whatsappMessage = this.generateAssignmentMessage(assignment);
            this.showAssignmentConfirmation(assignment, whatsappMessage);

            // Limpiar formulario
            this.clearAssignmentForm();

            Utils.showNotification('Asignación creada exitosamente', 'success');

        } catch (error) {
            console.error('❌ [ASSIGNMENT] Error:', error);
            Utils.showNotification('Error creando la asignación', 'error');
        }
    },

    /**
     * Crear registros iniciales de titulares
     */
    createInitialOwners: async function(assignment) {
        const owners = assignment.numbers.map(number => ({
            id: Utils.generateId(),
            assignment_id: assignment.id,
            number_value: number,
            owner_name: assignment.seller_name,
            owner_lastname: assignment.seller_lastname,
            owner_phone: assignment.seller_phone,
            owner_email: assignment.seller_email,
            edited_at: new Date()
        }));

        if (window.SupabaseManager && SupabaseManager.isConnected) {
            for (const owner of owners) {
                await SupabaseManager.saveNumberOwner(owner);
            }
        } else {
            if (!AppState.numberOwners) AppState.numberOwners = [];
            AppState.numberOwners.push(...owners);
            await autoSave();
        }
    },

    /**
     * Generar mensaje de asignación para WhatsApp
     */
    generateAssignmentMessage: function(assignment) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const deadlineText = assignment.payment_deadline ? 
            `📅 Plazo de pago: ${Utils.formatDateTime(assignment.payment_deadline)}\n` : '';

        let message = `🎯 NÚMEROS ASIGNADOS - ${AppState.raffleConfig.name}\n\n`;
        message += `Hola ${assignment.seller_name}!\n\n`;
        message += `Se te asignaron estos números para vender:\n`;
        message += `🔢 Números: ${numbersFormatted}\n`;
        message += `📊 Cantidad: ${assignment.numbers.length} números\n`;
        message += `💰 Total a pagar: ${Utils.formatPrice(assignment.total_amount)}\n`;
        message += `🏆 Premio: ${AppState.raffleConfig.prize}\n`;
        message += `🗓️ Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n`;
        message += deadlineText;
        message += `\n✅ Puedes cambiar el nombre de los titulares hasta antes del sorteo\n`;
        message += `💳 Debes confirmar el pago para completar la asignación\n\n`;
        message += `📞 Para gestionar tus números o confirmar pago, contacta:\n`;
        message += `${AppState.raffleConfig.whatsappNumber}\n\n`;
        message += `¡Éxito en las ventas! 🍀⛵`;

        return message;
    },

    /**
     * Mostrar confirmación de asignación
     */
    showAssignmentConfirmation: function(assignment, whatsappMessage) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        
        const confirmationHtml = `
            <div class="confirmation-modal" id="assignmentConfirmationModal">
                <div class="confirmation-content">
                    <div class="success-icon">🎯</div>
                    <h3>Asignación Creada</h3>
                    <div class="assignment-details">
                        <p><strong>Vendedor:</strong> ${assignment.seller_name} ${assignment.seller_lastname}</p>
                        <p><strong>Números:</strong> ${numbersFormatted}</p>
                        <p><strong>Total:</strong> ${Utils.formatPrice(assignment.total_amount)}</p>
                        <p><strong>Estado:</strong> ⏳ Asignado (pago pendiente)</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Notificar al vendedor:</strong></p>
                        <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(assignment.seller_phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                           class="whatsapp-btn" target="_blank">
                           📱 Enviar a ${assignment.seller_name}
                        </a>
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
                        <strong>📋 Próximos pasos:</strong><br>
                        1. El vendedor recibe la notificación<br>
                        2. Puede editar nombres de titulares<br>
                        3. Debe confirmar pago antes del sorteo<br>
                        4. Tú puedes gestionar desde el panel de admin
                    </div>
                    
                    <button class="btn btn-secondary" onclick="AssignmentsManager.closeAssignmentConfirmation()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
    },

    /**
     * Cerrar confirmación de asignación
     */
    closeAssignmentConfirmation: function() {
        const modal = document.getElementById('assignmentConfirmationModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Limpiar formulario de asignación
     */
    clearAssignmentForm: function() {
        const fields = ['sellerName', 'sellerLastname', 'sellerPhone', 'sellerEmail', 'assignmentNumbers', 'paymentDeadline', 'assignmentNotes'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = '';
        });
        document.getElementById('assignmentSummary').style.display = 'none';
    },

    /**
     * Cargar asignaciones existentes
     */
    loadAssignments: async function() {
        try {
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                // Cargar desde Supabase
                AppState.assignments = await SupabaseManager.getAssignments();
                AppState.numberOwners = await SupabaseManager.getNumberOwners();
            } else {
                // Usar datos en memoria (localStorage)
                if (!AppState.assignments) AppState.assignments = [];
                if (!AppState.numberOwners) AppState.numberOwners = [];
            }

            this.displayAssignments();
        } catch (error) {
            console.error('❌ Error cargando asignaciones:', error);
            Utils.showNotification('Error cargando asignaciones', 'error');
        }
    },

    /**
     * Mostrar lista de asignaciones
     */
    displayAssignments: function() {
        const container = document.getElementById('assignmentsList');
        
        if (!AppState.assignments || AppState.assignments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay asignaciones registradas</p>';
            return;
        }

        const assignmentsHtml = AppState.assignments.map(assignment => {
            const statusIcon = this.getStatusIcon(assignment.status);
            const statusText = this.getStatusText(assignment.status);
            const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
            const deadlineText = assignment.payment_deadline ? 
                `<div class="assignment-deadline">⏰ Plazo: ${Utils.formatDateTime(assignment.payment_deadline)}</div>` : '';

            return `
                <div class="assignment-card" data-assignment-id="${assignment.id}">
                    <div class="assignment-header">
                        <div class="assignment-seller">
                            <strong>${assignment.seller_name} ${assignment.seller_lastname}</strong>
                            <span class="seller-phone">${assignment.seller_phone}</span>
                        </div>
                        <div class="assignment-status ${assignment.status}">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="assignment-details">
                        <div class="assignment-numbers">
                            <strong>Números:</strong> ${numbersFormatted} (${assignment.numbers.length})
                        </div>
                        <div class="assignment-total">
                            <strong>Total:</strong> ${Utils.formatPrice(assignment.total_amount)}
                        </div>
                        ${deadlineText}
                        ${assignment.notes ? `<div class="assignment-notes">📝 ${assignment.notes}</div>` : ''}
                    </div>
                    <div class="assignment-actions">
                        ${this.getAssignmentActions(assignment)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = assignmentsHtml;
    },

    /**
     * Obtener icono de estado
     */
    getStatusIcon: function(status) {
        const icons = {
            'assigned': '⏳',
            'paid': '✅',
            'confirmed': '🎯'
        };
        return icons[status] || '❓';
    },

    /**
     * Obtener texto de estado
     */
    getStatusText: function(status) {
        const texts = {
            'assigned': 'Asignado',
            'paid': 'Pagado',
            'confirmed': 'Confirmado'
        };
        return texts[status] || 'Desconocido';
    },

    /**
     * Obtener acciones disponibles para una asignación
     */
    getAssignmentActions: function(assignment) {
        let actions = [];

        if (assignment.status === 'assigned') {
            actions.push(`<button class="btn-small btn-success" onclick="AssignmentsManager.markAsPaid('${assignment.id}')">💰 Marcar como Pagado</button>`);
        }
        
        if (assignment.status === 'paid') {
            actions.push(`<button class="btn-small btn-primary" onclick="AssignmentsManager.confirmAssignment('${assignment.id}')">🎯 Confirmar para Sorteo</button>`);
        }

        actions.push(`<button class="btn-small btn-secondary" onclick="AssignmentsManager.editOwners('${assignment.id}')">✏️ Editar Titulares</button>`);
        actions.push(`<button class="btn-small btn-info" onclick="AssignmentsManager.sendReminder('${assignment.id}')">📱 Enviar Recordatorio</button>`);
        
        return actions.join(' ');
    },

    /**
     * Marcar asignación como pagada
     */
    markAsPaid: async function(assignmentId) {
        const assignment = AppState.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const paymentMethod = prompt('Método de pago:', 'efectivo');
        if (!paymentMethod) return;

        try {
            assignment.status = 'paid';
            assignment.paid_at = new Date();
            assignment.payment_method = paymentMethod;

            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.updateAssignment(assignmentId, {
                    status: 'paid',
                    paid_at: assignment.paid_at,
                    payment_method: paymentMethod
                });
            } else {
                await autoSave();
            }

            this.displayAssignments();
            Utils.showNotification('Pago confirmado exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error actualizando pago:', error);
            Utils.showNotification('Error actualizando el pago', 'error');
        }
    },

    /**
     * Confirmar asignación para sorteo
     */
    confirmAssignment: async function(assignmentId) {
        const assignment = AppState.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        if (!confirm(`¿Confirmar asignación de ${assignment.seller_name} para el sorteo?\n\nEsto creará las ventas finales y no se podrá modificar.`)) {
            return;
        }

        try {
            assignment.status = 'confirmed';

            // Crear ventas finales basadas en los titulares actuales
            await this.createFinalSales(assignment);

            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.updateAssignment(assignmentId, {
                    status: 'confirmed'
                });
            } else {
                await autoSave();
            }

            this.displayAssignments();
            NumbersManager.updateDisplay();
            if (AdminManager.updateInterface) AdminManager.updateInterface();

            Utils.showNotification('Asignación confirmada para el sorteo', 'success');
        } catch (error) {
            console.error('❌ Error confirmando asignación:', error);
            Utils.showNotification('Error confirmando la asignación', 'error');
        }
    },

    /**
     * Crear ventas finales basadas en titulares
     */
    createFinalSales: async function(assignment) {
        // Obtener titulares actuales de los números
        const owners = AppState.numberOwners.filter(o => o.assignment_id === assignment.id);
        
        // Agrupar por titular para crear ventas consolidadas
        const ownerMap = new Map();
        
        owners.forEach(owner => {
            const key = `${owner.owner_name}-${owner.owner_lastname}-${owner.owner_phone}`;
            if (!ownerMap.has(key)) {
                ownerMap.set(key, {
                    buyer: {
                        name: owner.owner_name,
                        lastName: owner.owner_lastname,
                        phone: owner.owner_phone || assignment.seller_phone,
                        email: owner.owner_email || assignment.seller_email,
                        instagram: owner.owner_instagram || '',
                        membershipArea: owner.membership_area || ''
                    },
                    numbers: []
                });
            }
            ownerMap.get(key).numbers.push(owner.number_value);
        });

        // Crear una venta por cada titular único
        for (const [key, ownerData] of ownerMap) {
            const sale = {
                id: Utils.generateId(),
                numbers: ownerData.numbers.sort((a, b) => a - b),
                buyer: ownerData.buyer,
                paymentMethod: assignment.payment_method || 'efectivo',
                total: ownerData.numbers.length * AppState.raffleConfig.price,
                status: 'paid',
                date: new Date(),
                assignment_id: assignment.id,
                seller_name: `${assignment.seller_name} ${assignment.seller_lastname}`,
                is_from_assignment: true
            };

            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.saveSale(sale);
            } else {
                AppState.sales.push(sale);
                await autoSave();
            }
        }
    },

    /**
     * Editar titulares de una asignación
     */
    editOwners: function(assignmentId) {
        const assignment = AppState.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        // Implementar modal de edición de titulares
        this.showOwnersEditModal(assignment);
    },

    /**
     * Mostrar modal de edición de titulares
     */
    showOwnersEditModal: function(assignment) {
        const owners = AppState.numberOwners.filter(o => o.assignment_id === assignment.id);
        
        const ownersHtml = owners.map(owner => `
            <div class="owner-edit-row" data-number="${owner.number_value}">
                <div class="owner-number">${Utils.formatNumber(owner.number_value)}</div>
                <div class="owner-fields">
                    <input type="text" value="${owner.owner_name}" placeholder="Nombre" data-field="name">
                    <input type="text" value="${owner.owner_lastname}" placeholder="Apellido" data-field="lastname">
                    <input type="tel" value="${owner.owner_phone || ''}" placeholder="Teléfono" data-field="phone">
                </div>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal" id="ownersEditModal">
                <div class="modal-content" style="max-width: 800px;">
                    <span class="modal-close" onclick="AssignmentsManager.closeOwnersEditModal()">&times;</span>
                    <h3>✏️ Editar Titulares - ${assignment.seller_name}</h3>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>📋 Instrucciones:</strong><br>
                        • Puedes cambiar el nombre del titular de cada número<br>
                        • Por defecto todos están a nombre del vendedor<br>
                        • Los cambios se pueden hacer hasta antes del sorteo
                    </div>
                    
                    <div class="owners-edit-container">
                        ${ownersHtml}
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn" onclick="AssignmentsManager.saveOwnerChanges('${assignment.id}')">💾 Guardar Cambios</button>
                        <button class="btn btn-secondary" onclick="AssignmentsManager.closeOwnersEditModal()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Guardar cambios de titulares
     */
    saveOwnerChanges: async function(assignmentId) {
        const modal = document.getElementById('ownersEditModal');
        const rows = modal.querySelectorAll('.owner-edit-row');
        
        try {
            for (const row of rows) {
                const number = parseInt(row.dataset.number);
                const fields = row.querySelectorAll('input[data-field]');
                
                const ownerData = {};
                fields.forEach(field => {
                    ownerData[`owner_${field.dataset.field}`] = field.value.trim();
                });
                ownerData.edited_at = new Date();

                // Actualizar en memoria
                const owner = AppState.numberOwners.find(o => 
                    o.assignment_id === assignmentId && o.number_value === number
                );
                if (owner) {
                    Object.assign(owner, ownerData);
                }

                // Actualizar en Supabase
                if (window.SupabaseManager && SupabaseManager.isConnected) {
                    await SupabaseManager.updateNumberOwner(owner.id, ownerData);
                } else {
                    await autoSave();
                }
            }

            this.closeOwnersEditModal();
            Utils.showNotification('Titulares actualizados exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error actualizando titulares:', error);
            Utils.showNotification('Error actualizando los titulares', 'error');
        }
    },

    /**
     * Cerrar modal de edición de titulares
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
        const assignment = AppState.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const message = this.generateReminderMessage(assignment);
        const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(assignment.seller_phone)}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    },

    /**
     * Generar mensaje de recordatorio
     */
    generateReminderMessage: function(assignment) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        let message = `⏰ RECORDATORIO - ${AppState.raffleConfig.name}\n\n`;
        message += `Hola ${assignment.seller_name}!\n\n`;
        
        if (assignment.status === 'assigned') {
            message += `Tienes números asignados pendientes de pago:\n`;
            message += `🔢 Números: ${numbersFormatted}\n`;
            message += `💰 Total: ${Utils.formatPrice(assignment.total_amount)}\n\n`;
            message += `El sorteo es el ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}.\n`;
            message += `Por favor confirma tu pago para asegurar la participación.\n\n`;
        } else {
            message += `Estado de tu asignación:\n`;
            message += `🔢 Números: ${numbersFormatted}\n`;
            message += `📊 Estado: ${this.getStatusText(assignment.status)}\n\n`;
        }
        
        message += `Para gestionar tus números, contacta:\n`;
        message += `${AppState.raffleConfig.whatsappNumber}`;
        
        return message;
    },

    /**
     * Filtrar asignaciones
     */
    filterAssignments: function() {
        const searchTerm = document.getElementById('assignmentSearchBox').value.toLowerCase().trim();
        const assignmentCards = document.querySelectorAll('.assignment-card');
        
        assignmentCards.forEach(card => {
            const sellerText = card.querySelector('.assignment-seller').textContent.toLowerCase();
            const phoneText = card.querySelector('.seller-phone').textContent.toLowerCase();
            
            if (sellerText.includes(searchTerm) || phoneText.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
};

console.log('✅ AssignmentsManager cargado correctamente');
