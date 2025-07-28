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
