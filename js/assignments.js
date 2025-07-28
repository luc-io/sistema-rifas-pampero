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
            raffle_id: AppState.raffleConfig.id || 'current',
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
                autoSave();
                console.log('📱 [ASSIGNMENT] Guardada en localStorage');
            }

            // Crear registros de titulares iniciales (vendedor como titular)
            await this.createInitialOwners(assignment);

            // Actualizar interfaz
            this.loadAssignments();
            if (typeof NumbersManager !== 'undefined') {
                NumbersManager.updateDisplay();
            }

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
            owner_instagram: '',
            membership_area: '',
            edited_at: new Date(),
            created_at: new Date()
        }));

        if (window.SupabaseManager && SupabaseManager.isConnected) {
            for (const owner of owners) {
                await SupabaseManager.saveNumberOwner(owner);
            }
        } else {
            if (!AppState.numberOwners) AppState.numberOwners = [];
            AppState.numberOwners.push(...owners);
            autoSave();
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
        message += `💰 Total a pagar: ${Utils.formatPrice(assignment.total_amount)}\n\n`;
        message += deadlineText;
        message += `📌 Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
        message += `Por favor confirma el pago para asegurar la participación.\n\n`;
        message += `¡Gracias por tu colaboración!\n`;
        message += `${AppState.raffleConfig.organization}`;
        
        return message;
    },

    /**
     * Mostrar confirmación de asignación
     */
    showAssignmentConfirmation: function(assignment, whatsappMessage) {
        const modalHtml = `
            <div class="modal" id="assignmentConfirmModal">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="modal-close" onclick="AssignmentsManager.closeConfirmModal()">&times;</span>
                    <h3>✅ Asignación Creada</h3>
                    
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>👤 Vendedor:</strong> ${assignment.seller_name} ${assignment.seller_lastname}<br>
                        <strong>📞 Teléfono:</strong> ${assignment.seller_phone}<br>
                        <strong>🔢 Números:</strong> ${assignment.numbers.length} números<br>
                        <strong>💰 Total:</strong> ${Utils.formatPrice(assignment.total_amount)}
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>📱 Mensaje para WhatsApp:</strong><br>
                        <textarea readonly style="width: 100%; height: 150px; margin-top: 10px;">${whatsappMessage}</textarea>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-success" onclick="AssignmentsManager.sendWhatsApp('${assignment.seller_phone}', \`${whatsappMessage.replace(/`/g, '\\`')}\`)">
                            📱 Enviar por WhatsApp
                        </button>
                        <button class="btn btn-secondary" onclick="AssignmentsManager.closeConfirmModal()">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Enviar mensaje por WhatsApp
     */
    sendWhatsApp: function(phone, message) {
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        this.closeConfirmModal();
    },

    /**
     * Cerrar modal de confirmación
     */
    closeConfirmModal: function() {
        const modal = document.getElementById('assignmentConfirmModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Limpiar formulario de asignación
     */
    clearAssignmentForm: function() {
        document.getElementById('sellerName').value = '';
        document.getElementById('sellerLastname').value = '';
        document.getElementById('sellerPhone').value = '';
        document.getElementById('sellerEmail').value = '';
        document.getElementById('assignmentNumbers').value = '';
        document.getElementById('assignmentNotes').value = '';
        
        // Resetear fecha por defecto
        const defaultDeadline = new Date(AppState.raffleConfig.drawDate);
        defaultDeadline.setHours(defaultDeadline.getHours() - 24);
        document.getElementById('paymentDeadline').value = defaultDeadline.toISOString().slice(0, 16);
        
        document.getElementById('assignmentSummary').style.display = 'none';
    },

    /**
     * Cargar asignaciones desde la base de datos
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
            actions.push(`<button class="btn-small btn-success" onclick="AssignmentsManager.markAsPaid(${assignment.id})">💰 Marcar como Pagado</button>`);
        }
        
        if (assignment.status === 'paid') {
            actions.push(`<button class="btn-small btn-primary" onclick="AssignmentsManager.confirmAssignment(${assignment.id})">🎯 Confirmar para Sorteo</button>`);
        }

        // Estas acciones están disponibles para cualquier estado (excepto confirmado)
        if (assignment.status !== 'confirmed') {
            actions.push(`<button class="btn-small btn-secondary" onclick="AssignmentsManager.editOwners(${assignment.id})">✏️ Editar Titulares</button>`);
        }

        actions.push(`<button class="btn-small btn-info" onclick="AssignmentsManager.sendReminder(${assignment.id})">📱 Enviar Recordatorio</button>`);
        
        return actions.join(' ');
    },

    /**
     * Marcar asignación como pagada - CORREGIDA
     */
    markAsPaid: async function(assignmentId) {
        console.log('🔧 [DEBUG] markAsPaid llamado con ID:', assignmentId);
        
        const assignment = AppState.assignments.find(a => a.id == assignmentId); // Usar == para comparar string/number
        if (!assignment) {
            console.error('❌ [ERROR] Asignación no encontrada:', assignmentId);
            Utils.showNotification('Asignación no encontrada', 'error');
            return;
        }

        const paymentMethod = prompt('Método de pago:', 'efectivo');
        if (!paymentMethod) return;

        try {
            // Actualizar datos localmente primero
            assignment.status = 'paid';
            assignment.paid_at = new Date();
            assignment.payment_method = paymentMethod;

            // Actualizar en Supabase si está conectado
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.updateAssignment(assignmentId, {
                    status: 'paid',
                    paid_at: assignment.paid_at.toISOString(),
                    payment_method: paymentMethod
                });
                console.log('✅ [SUPABASE] Asignación actualizada en Supabase');
            } else {
                // Fallback a localStorage
                autoSave();
                console.log('📱 [LOCALSTORAGE] Asignación actualizada localmente');
            }

            // Actualizar interfaz
            this.displayAssignments();
            Utils.showNotification('Pago confirmado exitosamente', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando pago:', error);
            Utils.showNotification('Error actualizando el pago', 'error');
            
            // Revertir cambios locales si falla
            assignment.status = 'assigned';
            delete assignment.paid_at;
            delete assignment.payment_method;
        }
    },

    /**
     * Confirmar asignación para sorteo
     */
    confirmAssignment: async function(assignmentId) {
        const assignment = AppState.assignments.find(a => a.id == assignmentId);
        if (!assignment) {
            Utils.showNotification('Asignación no encontrada', 'error');
            return;
        }

        if (!confirm(`¿Confirmar asignación de ${assignment.seller_name} para el sorteo?\n\nEsto creará las ventas finales y no se podrá modificar.`)) {
            return;
        }

        try {
            // Actualizar estado localmente
            assignment.status = 'confirmed';

            // Crear ventas finales basadas en los titulares actuales
            await this.createFinalSales(assignment);

            // Actualizar en Supabase
            if (window.SupabaseManager && SupabaseManager.isConnected) {
                await SupabaseManager.updateAssignment(assignmentId, {
                    status: 'confirmed'
                });
            } else {
                autoSave();
            }

            // Actualizar interfaces
            this.displayAssignments();
            if (typeof NumbersManager !== 'undefined') {
                NumbersManager.updateDisplay();
            }
            if (typeof AdminManager !== 'undefined' && AdminManager.updateInterface) {
                AdminManager.updateInterface();
            }

            Utils.showNotification('Asignación confirmada para el sorteo', 'success');
            
        } catch (error) {
            console.error('❌ Error confirmando asignación:', error);
            Utils.showNotification('Error confirmando la asignación', 'error');
            
            // Revertir cambio local
            assignment.status = 'paid';
        }
    },

    /**
     * Crear ventas finales basadas en titulares
     */
    createFinalSales: async function(assignment) {
        // Obtener titulares actuales de los números
        const owners = AppState.numberOwners.filter(o => o.assignment_id == assignment.id);
        
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
                        email: owner.owner_email || assignment.seller_email || '',
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
                autoSave();
            }
        }
    },

    /**
     * Editar titulares de una asignación - CORREGIDA
     */
    editOwners: function(assignmentId) {
        console.log('🔧 [DEBUG] editOwners llamado con ID:', assignmentId);
        
        const assignment = AppState.assignments.find(a => a.id == assignmentId);
        if (!assignment) {
            console.error('❌ [ERROR] Asignación no encontrada:', assignmentId);
            Utils.showNotification('Asignación no encontrada', 'error');
            return;
        }

        console.log('✅ [DEBUG] Asignación encontrada:', assignment);
        this.showOwnersEditModal(assignment);
    },

    /**
     * Mostrar modal de edición de titulares - CORREGIDA
     */
    showOwnersEditModal: function(assignment) {
        const owners = AppState.numberOwners.filter(o => o.assignment_id == assignment.id);
        console.log('🔧 [DEBUG] Titulares encontrados:', owners);

        if (owners.length === 0) {
            Utils.showNotification('No se encontraron titulares para esta asignación', 'warning');
            return;
        }
        
        const ownersHtml = owners.map(owner => `
            <div class="owner-edit-row" data-number="${owner.number_value}" data-owner-id="${owner.id}">
                <div class="owner-number">${Utils.formatNumber(owner.number_value)}</div>
                <div class="owner-fields">
                    <input type="text" value="${owner.owner_name}" placeholder="Nombre" data-field="owner_name">
                    <input type="text" value="${owner.owner_lastname}" placeholder="Apellido" data-field="owner_lastname">
                    <input type="tel" value="${owner.owner_phone || ''}" placeholder="Teléfono" data-field="owner_phone">
                    <input type="email" value="${owner.owner_email || ''}" placeholder="Email" data-field="owner_email">
                </div>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal" id="ownersEditModal" style="display: block;">
                <div class="modal-content" style="max-width: 800px;">
                    <span class="modal-close" onclick="AssignmentsManager.closeOwnersEditModal()">&times;</span>
                    <h3>✏️ Editar Titulares - ${assignment.seller_name}</h3>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>📋 Instrucciones:</strong><br>
                        • Puedes cambiar el nombre del titular de cada número<br>
                        • Por defecto todos están a nombre del vendedor<br>
                        • Los cambios se pueden hacer hasta antes del sorteo
                    </div>
                    
                    <div class="owners-edit-container" style="max-height: 400px; overflow-y: auto;">
                        ${ownersHtml}
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn" onclick="AssignmentsManager.saveOwnerChanges(${assignment.id})">💾 Guardar Cambios</button>
                        <button class="btn btn-secondary" onclick="AssignmentsManager.closeOwnersEditModal()">Cancelar</button>
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
     * Guardar cambios de titulares - CORREGIDA
     */
    saveOwnerChanges: async function(assignmentId) {
        console.log('🔧 [DEBUG] saveOwnerChanges llamado con ID:', assignmentId);
        
        const modal = document.getElementById('ownersEditModal');
        if (!modal) {
            console.error('❌ [ERROR] Modal no encontrado');
            return;
        }

        const rows = modal.querySelectorAll('.owner-edit-row');
        console.log('🔧 [DEBUG] Filas encontradas:', rows.length);
        
        try {
            for (const row of rows) {
                const ownerId = row.dataset.ownerId;
                const number = parseInt(row.dataset.number);
                const fields = row.querySelectorAll('input[data-field]');
                
                console.log('🔧 [DEBUG] Procesando titular ID:', ownerId, 'Número:', number);
                
                const ownerData = {};
                fields.forEach(field => {
                    ownerData[field.dataset.field] = field.value.trim();
                });
                ownerData.edited_at = new Date();

                console.log('🔧 [DEBUG] Datos a actualizar:', ownerData);

                // Actualizar en memoria local
                const owner = AppState.numberOwners.find(o => 
                    o.assignment_id == assignmentId && o.number_value === number
                );
                
                if (owner) {
                    Object.assign(owner, ownerData);
                    console.log('✅ [DEBUG] Titular actualizado en memoria:', owner);
                } else {
                    console.warn('⚠️ [DEBUG] Titular no encontrado en memoria');
                }

                // Actualizar en Supabase si está conectado
                if (window.SupabaseManager && SupabaseManager.isConnected && ownerId) {
                    await SupabaseManager.updateNumberOwner(ownerId, ownerData);
                    console.log('✅ [SUPABASE] Titular actualizado en Supabase');
                } else {
                    autoSave();
                    console.log('📱 [LOCALSTORAGE] Cambios guardados localmente');
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
     * Enviar recordatorio a vendedor - CORREGIDA
     */
    sendReminder: function(assignmentId) {
        console.log('🔧 [DEBUG] sendReminder llamado con ID:', assignmentId);
        
        const assignment = AppState.assignments.find(a => a.id == assignmentId);
        if (!assignment) {
            console.error('❌ [ERROR] Asignación no encontrada:', assignmentId);
            Utils.showNotification('Asignación no encontrada', 'error');
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
        let message = `⏰ RECORDATORIO - ${AppState.raffleConfig.name}\n\n`;
        message += `Hola ${assignment.seller_name}!\n\n`;
        
        if (assignment.status === 'assigned') {
            message += `Tienes números asignados pendientes de pago:\n`;
            message += `🔢 Números: ${numbersFormatted}\n`;
            message += `💰 Total: ${Utils.formatPrice(assignment.total_amount)}\n\n`;
            if (assignment.payment_deadline) {
                message += `⏰ Plazo límite: ${Utils.formatDateTime(assignment.payment_deadline)}\n`;
            }
            message += `📌 Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
            message += `Por favor confirma tu pago para asegurar la participación.\n\n`;
        } else if (assignment.status === 'paid') {
            message += `Estado de tu asignación:\n`;
            message += `🔢 Números: ${numbersFormatted}\n`;
            message += `✅ Estado: Pagado\n`;
            message += `📌 Sorteo: ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n`;
            message += `¡Perfecto! Tus números están confirmados para el sorteo.\n\n`;
        } else {
            message += `Estado de tu asignación:\n`;
            message += `🔢 Números: ${numbersFormatted}\n`;
            message += `🎯 Estado: ${this.getStatusText(assignment.status)}\n\n`;
        }
        
        message += `Para consultas, contacta:\n`;
        message += `📱 ${AppState.raffleConfig.whatsappNumber}\n\n`;
        message += `¡Gracias por tu colaboración!\n`;
        message += `${AppState.raffleConfig.organization}`;
        
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
            const phoneText = card.querySelector('.seller-phone') ? card.querySelector('.seller-phone').textContent.toLowerCase() : '';
            
            if (sellerText.includes(searchTerm) || phoneText.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
};

console.log('✅ AssignmentsManager (CORREGIDO) cargado correctamente');
