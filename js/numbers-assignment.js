/**
 * ASIGNACIONES - Sistema de Rifas Pampero
 * Maneja las asignaciones de números y cambio de titulares
 */

window.NumbersAssignment = {
    /**
     * Abrir modal de asignación de números
     */
    openAssignmentModal: function() {
        if (AppState.selectedNumbers.length === 0) {
            Utils.showNotification('Selecciona al menos un número para asignar', 'warning');
            return;
        }

        // Calcular fecha de rendición (24 horas antes del sorteo)
        let sorteoDate;
        try {
            sorteoDate = new Date(AppState.raffleConfig.drawDate);
            if (isNaN(sorteoDate.getTime())) {
                throw new Error('Fecha de sorteo inválida');
            }
        } catch (error) {
            console.error('❌ Error con fecha de sorteo:', error);
            Utils.showNotification('Error: Fecha de sorteo no válida. Configura la rifa nuevamente.', 'error');
            return;
        }
        
        const rendicionDate = new Date(sorteoDate.getTime() - 24 * 60 * 60 * 1000);
        const rendicionDateString = rendicionDate.toISOString().slice(0, 16);

        const modalHtml = `
            <div id="assignmentModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎯 Asignar Números</h3>
                        <span class="modal-close" onclick="NumbersManager.closeAssignmentModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="selection-summary" style="margin-bottom: 20px;">
                            <h4>Números a asignar:</h4>
                            <div class="selected-numbers" id="assignmentNumbers">
                                ${AppState.selectedNumbers.map(n => Utils.formatNumber(n)).join(', ')}
                            </div>
                            <div class="total-price">
                                Total: ${Utils.formatPrice(AppState.selectedNumbers.length * AppState.raffleConfig.price)}
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="assigneeName">Nombre del Responsable *</label>
                            <input type="text" id="assigneeName" required autocomplete="off" 
                                   oninput="NumbersAssignment.searchExistingAssignees()" onblur="NumbersAssignment.clearAssigneeSuggestions()">
                            <div id="assigneeSuggestions" class="buyer-suggestions" style="display: none;"></div>
                        </div>

                        <div class="form-group">
                            <label for="assigneeLastName">Apellido del Responsable *</label>
                            <input type="text" id="assigneeLastName" required>
                        </div>

                        <div class="form-group">
                            <label for="assigneePhone">Teléfono del Responsable *</label>
                            <input type="tel" id="assigneePhone" required>
                        </div>

                        <div class="form-group">
                            <label for="assigneeEmail">Email del Responsable (opcional)</label>
                            <input type="email" id="assigneeEmail">
                        </div>

                        <div class="form-group">
                            <label for="assignmentNotes">Notas (opcional)</label>
                            <textarea id="assignmentNotes" rows="2" placeholder="Notas adicionales sobre esta asignación..."></textarea>
                        </div>

                        <div class="form-group">
                            <label for="assignmentDeadline">Fecha de rendición</label>
                            <input type="datetime-local" id="assignmentDeadline" value="${rendicionDateString}" readonly>
                            <small style="color: #6c757d;">La fecha de rendición es automáticamente 24 horas antes del sorteo</small>
                        </div>

                        <div class="assignment-info" style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h4 style="color: #0066cc; margin-bottom: 10px;">📝 Importante sobre asignaciones:</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #666;">
                                <li>El titular inicial de cada número será la persona responsable</li>
                                <li>Se puede cambiar el titular haciendo tap sobre el número antes de la rendición</li>
                                <li>Al cambiar titular se envía notificación automática por WhatsApp</li>
                                <li>Fecha límite de rendición: ${Utils.formatDateTime(rendicionDate)}</li>
                            </ul>
                        </div>

                        <div class="payment-buttons" style="display: flex; gap: 10px; margin: 20px 0;">
                            <button class="btn btn-info" onclick="NumbersAssignment.completeAssignment()" style="flex: 1;">🎯 Asignar Números</button>
                            <button class="btn btn-secondary" onclick="NumbersManager.closeAssignmentModal()" style="flex: 1;">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si hay uno
        const existingModal = document.getElementById('assignmentModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Cerrar modal de asignación
     */
    closeAssignmentModal: function() {
        const modal = document.getElementById('assignmentModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Completar asignación de números
     */
    completeAssignment: async function() {
        try {
            const name = document.getElementById('assigneeName').value.trim();
            const lastName = document.getElementById('assigneeLastName').value.trim();
            const phone = document.getElementById('assigneePhone').value.trim();
            const email = document.getElementById('assigneeEmail').value.trim();
            const notes = document.getElementById('assignmentNotes').value.trim();
            const deadline = document.getElementById('assignmentDeadline').value;

            if (!name || !lastName || !phone) {
                Utils.showNotification('Completa los campos obligatorios', 'error');
                return;
            }

            if (AppState.selectedNumbers.length === 0) {
                Utils.showNotification('Selecciona al menos un número', 'error');
                return;
            }

            const totalAmount = AppState.selectedNumbers.length * AppState.raffleConfig.price;

            const assignment = {
                id: Utils.generateId(),
                seller_name: name,
                seller_lastname: lastName,
                seller_phone: phone,
                seller_email: email || null,
                numbers: [...AppState.selectedNumbers],
                total_amount: totalAmount,
                status: 'assigned',
                assigned_at: new Date(),
                payment_deadline: deadline,
                notes: notes || null,
                payment_method: 'pending',
                raffle_id: AppState.raffleConfig?.id || null
            };

            // Inicializar arrays si no existen
            if (!AppState.assignments) AppState.assignments = [];
            if (!AppState.numberOwners) AppState.numberOwners = [];

            // Crear titulares iniciales (la persona responsable es el titular inicial)
            const numberOwners = AppState.selectedNumbers.map(number => ({
                id: Utils.generateId(),
                assignment_id: assignment.id,
                number_value: number,
                name: name,
                lastname: lastName,
                phone: phone,
                email: email || '',
                instagram: '',
                membership_area: '',
                edited_at: new Date(),
                created_at: new Date()
            }));

            // Guardar en base de datos
            if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                try {
                    // Guardar asignación
                    const savedAssignment = await window.SupabaseManager.saveAssignment(assignment);
                    const assignmentId = savedAssignment[0]?.id || assignment.id;
                    assignment.id = assignmentId;
                    
                    // Actualizar los IDs de los titulares
                    numberOwners.forEach(owner => {
                        owner.assignment_id = assignmentId;
                    });
                    
                    // Guardar titulares
                    for (const owner of numberOwners) {
                        const supabaseOwner = {
                            assignment_id: owner.assignment_id,
                            number_value: owner.number_value,
                            owner_name: owner.name,
                            owner_lastname: owner.lastname,
                            owner_phone: owner.phone,
                            owner_email: owner.email,
                            owner_instagram: owner.instagram,
                            membership_area: owner.membership_area,
                            edited_at: owner.edited_at
                        };
                        const savedOwner = await window.SupabaseManager.saveNumberOwner(supabaseOwner);
                        owner.id = savedOwner[0]?.id || owner.id;
                    }
                    
                    console.log('✅ [ASSIGNMENT] Asignación guardada en Supabase');
                } catch (error) {
                    console.error('❌ [ASSIGNMENT] Error guardando en Supabase:', error);
                    Utils.showNotification('Error guardando en la base de datos, pero se guardó localmente', 'warning');
                }
            }

            // Agregar a estado local
            AppState.assignments.push(assignment);
            AppState.numberOwners.push(...numberOwners);

            // Guardar localmente como respaldo
            if (typeof autoSave === 'function') {
                await autoSave();
            }

            // Marcar números como asignados en la UI
            AppState.selectedNumbers.forEach(number => {
                const button = document.getElementById(`number-${number}`);
                if (button) {
                    button.classList.remove('selected', 'available');
                    button.classList.add('assigned');
                }
            });

            // Generar mensaje de WhatsApp para el responsable
            const whatsappMessage = this.generateAssignmentMessage(assignment, numberOwners);
            
            // Mostrar confirmación
            this.showAssignmentConfirmation(assignment, whatsappMessage);

            // Limpiar selección y cerrar modal
            NumbersInterface.clearSelection();
            this.closeAssignmentModal();

            Utils.showNotification(`✅ ${AppState.selectedNumbers.length} números asignados a ${name} ${lastName}`, 'success');

            // Actualizar interfaz
            if (AdminManager?.updateInterface) {
                AdminManager.updateInterface();
            }
            NumbersManager.updateDisplay();

        } catch (error) {
            console.error('❌ Error asignando números:', error);
            Utils.showNotification('Error al asignar números: ' + error.message, 'error');
        }
    },

    /**
     * Generar mensaje de asignación para WhatsApp
     */
    generateAssignmentMessage: function(assignment, numberOwners) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        const rendicionDate = new Date(assignment.payment_deadline);
        
        let message = `🎯 *ASIGNACIÓN DE NÚMEROS*\n\n`;
        message += `Hola ${assignment.seller_name}!\n\n`;
        message += `Te han sido asignados los siguientes números para la rifa:\n\n`;
        message += `🎟️ *${AppState.raffleConfig.name}*\n`;
        message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n`;
        message += `📅 *Sorteo:* ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
        message += `🔢 *Tus números:* ${numbersFormatted}\n`;
        message += `💰 *Total:* ${Utils.formatPrice(assignment.total_amount)}\n`;
        message += `⏰ *Fecha de rendición:* ${Utils.formatDateTime(rendicionDate)}\n\n`;
        
        message += `📝 *IMPORTANTE:*\n`;
        message += `• Eres el titular inicial de todos los números asignados\n`;
        message += `• Puedes cambiar el titular de cada número individualmente\n`;
        message += `• La fecha límite de rendición es 24 horas antes del sorteo\n`;
        message += `• Cualquier cambio de titular se notificará automáticamente\n\n`;
        
        if (assignment.notes) {
            message += `📝 *Notas:* ${assignment.notes}\n\n`;
        }
        
        message += `Para consultas, contacta:\n`;
        message += `${AppState.raffleConfig.whatsappNumber}\n\n`;
        message += `¡Gracias por tu colaboración!\n`;
        message += `${AppState.raffleConfig.organizationName || 'Organización'}`;
        
        return message;
    },

    /**
     * Mostrar confirmación de asignación
     */
    showAssignmentConfirmation: function(assignment, whatsappMessage) {
        const numbersFormatted = assignment.numbers.map(n => Utils.formatNumber(n)).join(', ');
        
        const confirmationHtml = `
            <div class="confirmation-modal" id="confirmationModal">
                <div class="confirmation-content">
                    <div class="success-icon">🎯</div>
                    <h3>Números Asignados</h3>
                    <p><strong>Responsable:</strong> ${assignment.seller_name} ${assignment.seller_lastname}</p>
                    <p><strong>Números:</strong> ${numbersFormatted}</p>
                    <p><strong>Total:</strong> ${Utils.formatPrice(assignment.total_amount)}</p>
                    <p style="color: #856404;"><strong>⏰ Rendición: ${Utils.formatDateTime(assignment.payment_deadline)}</strong></p>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Notificar al responsable:</strong></p>
                        <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(assignment.seller_phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                           class="whatsapp-btn" target="_blank">
                           📱 Notificar a ${assignment.seller_name}
                        </a>
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;">
                        <strong>📋 Recordatorio:</strong><br>
                        • El responsable es el titular inicial de todos los números<br>
                        • Puede cambiar titulares haciendo tap en cada número<br>
                        • Fecha límite: 24 horas antes del sorteo
                    </div>
                    
                    <button class="btn btn-secondary" onclick="NumbersManager.closeConfirmationModal()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
    },

    /**
     * Mostrar modal para editar titular de un número asignado
     */
    showEditOwnerModal: function(number) {
        const owner = AppState.numberOwners?.find(o => o.number_value === number);
        const assignment = AppState.assignments?.find(a => a.numbers.includes(number));
        
        if (!owner || !assignment) {
            Utils.showNotification('No se encontró información del número', 'error');
            return;
        }
        
        // Verificar si ya pasó la fecha de rendición
        const now = new Date();
        const rendicionDate = new Date(assignment.payment_deadline);
        
        if (now >= rendicionDate) {
            Utils.showNotification('Ya pasó la fecha de rendición. No se puede cambiar el titular.', 'warning');
            return;
        }
        
        const modalHtml = `
            <div id="editOwnerModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>✏️ Editar Titular del Número ${Utils.formatNumber(number)}</h3>
                        <span class="modal-close" onclick="NumbersManager.closeEditOwnerModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="owner-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p><strong>Responsable:</strong> ${assignment.seller_name} ${assignment.seller_lastname}</p>
                            <p><strong>Fecha límite:</strong> ${Utils.formatDateTime(rendicionDate)}</p>
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerName">Nombre del Titular *</label>
                            <input type="text" id="ownerName" value="${owner.name || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerLastName">Apellido del Titular *</label>
                            <input type="text" id="ownerLastName" value="${owner.lastname || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerPhone">Teléfono del Titular *</label>
                            <input type="tel" id="ownerPhone" value="${owner.phone || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerEmail">Email (opcional)</label>
                            <input type="email" id="ownerEmail" value="${owner.email || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerInstagram">Instagram (opcional)</label>
                            <input type="text" id="ownerInstagram" value="${owner.instagram || ''}" placeholder="@usuario">
                        </div>
                        
                        <div class="form-group">
                            <label for="ownerMembership">Relación con el club</label>
                            <select id="ownerMembership">
                                <option value="" ${!owner.membership_area ? 'selected' : ''}>Seleccionar...</option>
                                <option value="no_socio" ${owner.membership_area === 'no_socio' ? 'selected' : ''}>No es socio</option>
                                <option value="nautica" ${owner.membership_area === 'nautica' ? 'selected' : ''}>Socio - Náutica</option>
                                <option value="remo" ${owner.membership_area === 'remo' ? 'selected' : ''}>Socio - Remo</option>
                                <option value="ecologia" ${owner.membership_area === 'ecologia' ? 'selected' : ''}>Socio - Ecología</option>
                                <option value="pesca" ${owner.membership_area === 'pesca' ? 'selected' : ''}>Socio - Pesca</option>
                                <option value="ninguna" ${owner.membership_area === 'ninguna' ? 'selected' : ''}>Socio - Sin área específica</option>
                            </select>
                        </div>
                        
                        <div class="notification-info" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 0; color: #856404;">
                                <strong>📱 Importante:</strong> Al cambiar el titular, se enviará una notificación automática por WhatsApp al nuevo titular y al responsable.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="NumbersManager.closeEditOwnerModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="NumbersAssignment.saveOwnerChanges(${number})">Guardar y Notificar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('editOwnerModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },
    
    /**
     * Cerrar modal de edición de titular
     */
    closeEditOwnerModal: function() {
        const modal = document.getElementById('editOwnerModal');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * Guardar cambios del titular y enviar notificaciones
     */
    saveOwnerChanges: async function(number) {
        try {
            const name = document.getElementById('ownerName').value.trim();
            const lastName = document.getElementById('ownerLastName').value.trim();
            const phone = document.getElementById('ownerPhone').value.trim();
            const email = document.getElementById('ownerEmail').value.trim();
            const instagram = document.getElementById('ownerInstagram').value.trim();
            const membershipArea = document.getElementById('ownerMembership').value;
            
            if (!name || !lastName || !phone) {
                Utils.showNotification('Completa los campos obligatorios', 'error');
                return;
            }
            
            // Encontrar el titular y la asignación
            const owner = AppState.numberOwners?.find(o => o.number_value === number);
            const assignment = AppState.assignments?.find(a => a.numbers.includes(number));
            
            if (!owner || !assignment) {
                Utils.showNotification('Error: No se encontró la información', 'error');
                return;
            }
            
            // Verificar si realmente cambió el titular
            const hasChanged = owner.name !== name || owner.lastname !== lastName || owner.phone !== phone;
            
            // Actualizar los datos del titular
            const updatedOwnerData = {
                name: name,
                lastname: lastName,
                phone: phone,
                email: email,
                instagram: instagram,
                membership_area: membershipArea,
                edited_at: new Date()
            };
            
            // Actualizar en memoria local
            Object.assign(owner, updatedOwnerData);
            
            // Actualizar en Supabase si está conectado
            if (window.SupabaseManager && window.SupabaseManager.isConnected && owner.id) {
                const supabaseData = {
                    owner_name: name,
                    owner_lastname: lastName,
                    owner_phone: phone,
                    owner_email: email,
                    owner_instagram: instagram,
                    membership_area: membershipArea,
                    edited_at: updatedOwnerData.edited_at.toISOString()
                };
                await window.SupabaseManager.updateNumberOwner(owner.id, supabaseData);
            }
            
            // Guardar localmente como respaldo
            if (typeof autoSave === 'function') {
                await autoSave();
            }
            
            // Enviar notificaciones por WhatsApp si cambió el titular
            if (hasChanged) {
                await this.sendOwnerChangeNotifications(number, assignment, owner);
            }
            
            this.closeEditOwnerModal();
            Utils.showNotification(`Titular del número ${Utils.formatNumber(number)} actualizado exitosamente`, 'success');
            
        } catch (error) {
            console.error('❌ Error guardando cambios del titular:', error);
            Utils.showNotification('Error guardando los cambios: ' + error.message, 'error');
        }
    },
    
    /**
     * Enviar notificaciones de cambio de titular
     */
    sendOwnerChangeNotifications: async function(number, assignment, newOwner) {
        try {
            // Mensaje para el nuevo titular
            const ownerMessage = this.generateOwnerChangeMessage(number, assignment, newOwner, 'owner');
            
            // Mensaje para el responsable
            const sellerMessage = this.generateOwnerChangeMessage(number, assignment, newOwner, 'seller');
            
            // URLs de WhatsApp
            const ownerWhatsAppUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(newOwner.phone)}?text=${encodeURIComponent(ownerMessage)}`;
            const sellerWhatsAppUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(assignment.seller_phone)}?text=${encodeURIComponent(sellerMessage)}`;
            
            // Mostrar modal de confirmación de notificaciones
            const confirmationHtml = `
                <div id="notificationConfirmModal" class="modal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📱 Enviar Notificaciones</h3>
                        </div>
                        <div class="modal-body">
                            <p>Se ha actualizado el titular del número <strong>${Utils.formatNumber(number)}</strong>.</p>
                            <p><strong>Nuevo titular:</strong> ${newOwner.name} ${newOwner.lastname}</p>
                            
                            <div style="margin: 20px 0;">
                                <h4>Notificaciones a enviar:</h4>
                                <div style="display: flex; gap: 10px; margin: 10px 0;">
                                    <a href="${ownerWhatsAppUrl}" class="btn btn-success" target="_blank" style="flex: 1;">
                                        📱 Notificar a ${newOwner.name}
                                    </a>
                                    <a href="${sellerWhatsAppUrl}" class="btn btn-info" target="_blank" style="flex: 1;">
                                        📱 Notificar a ${assignment.seller_name}
                                    </a>
                                </div>
                            </div>
                            
                            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; font-size: 14px;">
                                <strong>📝 Recordatorio:</strong><br>
                                Envía ambas notificaciones para mantener a todos informados del cambio de titular.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="NumbersManager.closeNotificationConfirmModal()">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
            
        } catch (error) {
            console.error('❌ Error preparando notificaciones:', error);
            Utils.showNotification('Error preparando las notificaciones', 'warning');
        }
    },
    
    /**
     * Generar mensaje de cambio de titular
     */
    generateOwnerChangeMessage: function(number, assignment, newOwner, recipient) {
        const formattedNumber = Utils.formatNumber(number);
        const rendicionDate = new Date(assignment.payment_deadline);
        
        if (recipient === 'owner') {
            // Mensaje para el nuevo titular
            let message = `🎉 *ERES EL NUEVO TITULAR*\n\n`;
            message += `Hola ${newOwner.name}!\n\n`;
            message += `Te informamos que ahora eres el titular del número *${formattedNumber}* en:\n\n`;
            message += `🎟️ *${AppState.raffleConfig.name}*\n`;
            message += `🏆 *Premio:* ${AppState.raffleConfig.prize}\n`;
            message += `📅 *Sorteo:* ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
            message += `📋 *Detalles de tu número:*\n`;
            message += `• Número: *${formattedNumber}*\n`;
            message += `• Responsable: ${assignment.seller_name} ${assignment.seller_lastname}\n`;
            message += `• Fecha de rendición: ${Utils.formatDateTime(rendicionDate)}\n\n`;
            message += `🚀 ¡Mucha suerte en el sorteo!\n\n`;
            message += `Para consultas, contacta:\n${AppState.raffleConfig.whatsappNumber}`;
            
            return message;
            
        } else {
            // Mensaje para el responsable
            let message = `🔄 *CAMBIO DE TITULAR*\n\n`;
            message += `Hola ${assignment.seller_name}!\n\n`;
            message += `Te informamos que se ha cambiado el titular del número *${formattedNumber}*:\n\n`;
            message += `🔢 *Número:* ${formattedNumber}\n`;
            message += `👤 *Nuevo titular:* ${newOwner.name} ${newOwner.lastname}\n`;
            message += `📱 *Teléfono:* ${newOwner.phone}\n`;
            if (newOwner.email) {
                message += `📧 *Email:* ${newOwner.email}\n`;
            }
            message += `\n⏰ *Fecha de rendición:* ${Utils.formatDateTime(rendicionDate)}\n\n`;
            message += `El nuevo titular ha sido notificado automáticamente.\n\n`;
            message += `🎟️ *${AppState.raffleConfig.name}*\n`;
            message += `${AppState.raffleConfig.organizationName || 'Organización'}`;
            
            return message;
        }
    },
    
    /**
     * Cerrar modal de confirmación de notificaciones
     */
    closeNotificationConfirmModal: function() {
        const modal = document.getElementById('notificationConfirmModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Buscar asignantes existentes para autocompletar
     */
    searchExistingAssignees: function() {
        const searchTerm = document.getElementById('assigneeName').value.toLowerCase();
        const suggestionsDiv = document.getElementById('assigneeSuggestions');
        
        if (searchTerm.length < 2) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }

        // Buscar en asignaciones existentes
        const assigneeMap = new Map();

        AppState.assignments?.forEach(assignment => {
            const fullName = `${assignment.seller_name} ${assignment.seller_lastname}`.toLowerCase();
            const key = fullName;
            
            if (fullName.includes(searchTerm)) {
                if (!assigneeMap.has(key)) {
                    assigneeMap.set(key, {
                        name: assignment.seller_name,
                        lastname: assignment.seller_lastname,
                        phone: assignment.seller_phone,
                        email: assignment.seller_email
                    });
                }
            }
        });

        const suggestions = Array.from(assigneeMap.values()).slice(0, 5);
        
        if (suggestions.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        suggestionsDiv.innerHTML = suggestions.map(suggestion => `
            <div class="buyer-suggestion" onclick="NumbersAssignment.selectExistingAssignee('${suggestion.name}', '${suggestion.lastname}', '${suggestion.phone}', '${suggestion.email || ''}')">
                <div class="buyer-name">${suggestion.name} ${suggestion.lastname}</div>
                <div class="buyer-details">${suggestion.phone} ${suggestion.email ? `• ${suggestion.email}` : ''}</div>
            </div>
        `).join('');
        
        suggestionsDiv.style.display = 'block';
    },

    /**
     * Seleccionar asignante existente
     */
    selectExistingAssignee: function(name, lastname, phone, email) {
        document.getElementById('assigneeName').value = name;
        document.getElementById('assigneeLastName').value = lastname;
        document.getElementById('assigneePhone').value = phone;
        document.getElementById('assigneeEmail').value = email || '';
        
        this.clearAssigneeSuggestions();
    },

    /**
     * Limpiar sugerencias de asignantes
     */
    clearAssigneeSuggestions: function() {
        setTimeout(() => {
            const suggestionsDiv = document.getElementById('assigneeSuggestions');
            if (suggestionsDiv) {
                suggestionsDiv.style.display = 'none';
            }
        }, 200);
    }
};

console.log('✅ numbers-assignment.js cargado correctamente');
