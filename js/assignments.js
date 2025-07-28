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
                        <strong>${assignment.seller_name}</strong>
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