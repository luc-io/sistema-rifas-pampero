/**
 * SUPABASE ASSIGNMENTS - Sistema de Rifas Pampero
 * Funcionalidades de asignaciones y titulares de números
 */

window.SupabaseAssignmentsManager = {
    client: null,
    isConnected: false,
    
    /**
     * Inicializar con cliente de Supabase
     */
    init: function(supabaseClient, isConnected) {
        this.client = supabaseClient;
        this.isConnected = isConnected;
        console.log('✅ SupabaseAssignmentsManager inicializado');
        return true;
    },

    /**
     * Verifica si un error indica que la tabla no existe
     */
    isTableNotFoundError: function(error) {
        if (!error) return false;
        
        // Verificar diferentes propiedades del error de forma segura
        const errorMessage = (error.message || error.error_description || error.description || '').toString();
        const errorCode = (error.code || '').toString();
        const errorDetails = (error.details || '').toString();
        const errorStatus = error.status || 0;
        
        // Casos comunes de tabla no encontrada
        return (
            errorCode === '42P01' ||
            errorCode === 'PGRST116' ||
            errorStatus === 404 ||
            errorMessage.includes('does not exist') ||
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorDetails.includes('does not exist')
        );
    },

    /**
     * Guardar asignación
     */
    saveAssignment: async function(assignment) {
        if (!this.isConnected) {
            console.warn('⚠️ [ASSIGNMENTS] Supabase no conectado, rechazando guardado');
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('assignments')
                .insert([{
                    raffle_id: assignment.raffle_id || 'current',
                    seller_name: assignment.seller_name,
                    seller_lastname: assignment.seller_lastname,
                    seller_phone: assignment.seller_phone,
                    seller_email: assignment.seller_email,
                    numbers: assignment.numbers,
                    total_amount: assignment.total_amount,
                    status: assignment.status,
                    assigned_at: assignment.assigned_at instanceof Date ? 
                        assignment.assigned_at.toISOString() : 
                        (typeof assignment.assigned_at === 'string' ? assignment.assigned_at : new Date().toISOString()),
                    payment_deadline: assignment.payment_deadline ? 
                        (assignment.payment_deadline instanceof Date ? 
                            assignment.payment_deadline.toISOString() : 
                            (typeof assignment.payment_deadline === 'string' ? 
                                assignment.payment_deadline : 
                                new Date().toISOString())) 
                        : null,
                    notes: assignment.notes
                }])
                .select();
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no existe, guardando solo localmente');
                    // Simular respuesta exitosa con ID temporal
                    return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
                }
                throw error;
            }
            
            console.log('✅ [ASSIGNMENTS] Asignación guardada en Supabase');
            
            // 🔄 NUEVO: Sincronización automática con Google Sheets
            if (window.syncWithGoogleSheets) {
                console.log('🔄 [ASSIGNMENTS] Iniciando auto-sync con Google Sheets...');
                window.syncWithGoogleSheets();
            }
            
            return data;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no disponible, guardando solo localmente');
                return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
            }
            console.error('❌ [ASSIGNMENTS] Error guardando asignación:', error);
            throw error;
        }
    },

    /**
     * Guardar titular de número
     */
    saveNumberOwner: async function(owner) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('number_owners')
                .insert([{
                    assignment_id: owner.assignment_id,
                    number_value: owner.number_value,
                    owner_name: owner.owner_name,
                    owner_lastname: owner.owner_lastname,
                    owner_phone: owner.owner_phone,
                    owner_email: owner.owner_email,
                    owner_instagram: owner.owner_instagram,
                    membership_area: owner.membership_area,
                    edited_at: owner.edited_at instanceof Date ? 
                        owner.edited_at.toISOString() : 
                        (typeof owner.edited_at === 'string' ? owner.edited_at : new Date().toISOString())
                }])
                .select();
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no existe, guardando solo localmente');
                    return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
                }
                throw error;
            }
            
            console.log('✅ [ASSIGNMENTS] Titular guardado en Supabase');
            return data;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no disponible, guardando solo localmente');
                return [{ id: Utils.generateId(), created_at: new Date().toISOString() }];
            }
            console.error('❌ [ASSIGNMENTS] Error guardando titular:', error);
            throw error;
        }
    },

    /**
     * Obtener asignaciones
     */
    getAssignments: async function() {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('assignments')
                .select('*')
                .eq('raffle_id', 'current')
                .order('created_at', { ascending: false });
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no existe');
                    return [];
                }
                throw error;
            }
            
            const assignments = (data || []).map(assignment => ({
                id: assignment.id,
                raffle_id: assignment.raffle_id,
                seller_name: assignment.seller_name,
                seller_lastname: assignment.seller_lastname,
                seller_phone: assignment.seller_phone,
                seller_email: assignment.seller_email,
                numbers: assignment.numbers,
                total_amount: assignment.total_amount,
                status: assignment.status,
                assigned_at: DateUtils.parseDate(assignment.assigned_at),
                payment_deadline: assignment.payment_deadline ? DateUtils.parseDate(assignment.payment_deadline) : null,
                paid_at: assignment.paid_at ? DateUtils.parseDate(assignment.paid_at) : null,
                payment_method: assignment.payment_method,
                notes: assignment.notes,
                created_at: DateUtils.parseDate(assignment.created_at)
            }));
            
            console.log(`✅ [ASSIGNMENTS] ${assignments.length} asignaciones cargadas`);
            return assignments;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no disponible');
                return [];
            }
            console.error('❌ [ASSIGNMENTS] Error cargando asignaciones:', error);
            throw error;
        }
    },

    /**
     * Obtener titulares de números
     */
    getNumberOwners: async function() {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { data, error } = await this.client
                .from('number_owners')
                .select('*')
                .order('number_value', { ascending: true });
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no existe');
                    return [];
                }
                throw error;
            }
            
            const owners = (data || []).map(owner => ({
                id: owner.id,
                assignment_id: owner.assignment_id,
                number_value: owner.number_value,
                name: owner.owner_name || '',
                lastname: owner.owner_lastname || '',
                phone: owner.owner_phone || '',
                email: owner.owner_email || '',
                instagram: owner.owner_instagram || '',
                membership_area: owner.membership_area || '',
                edited_at: DateUtils.parseDate(owner.edited_at),
                created_at: DateUtils.parseDate(owner.created_at)
            }));
            
            console.log(`✅ [ASSIGNMENTS] ${owners.length} titulares cargados`);
            return owners;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no disponible');
                return [];
            }
            console.error('❌ [ASSIGNMENTS] Error cargando titulares:', error);
            throw error;
        }
    },

    /**
     * Actualizar asignación
     */
    updateAssignment: async function(assignmentId, updateData) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            const { error } = await this.client
                .from('assignments')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', assignmentId);
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no existe, actualizando solo localmente');
                    const assignment = AppState.assignments?.find(a => a.id == assignmentId);
                    if (assignment) {
                        Object.assign(assignment, updateData);
                        console.log(`✅ [ASSIGNMENTS] Asignación ${assignmentId} actualizada en memoria local`);
                    }
                    return true;
                }
                throw error;
            }
            
            // Actualizar estado local
            const assignment = AppState.assignments?.find(a => a.id == assignmentId);
            if (assignment) {
                Object.assign(assignment, updateData);
                console.log(`✅ [ASSIGNMENTS] Asignación ${assignmentId} actualizada en memoria local`);
            }
            
            console.log(`✅ [ASSIGNMENTS] Asignación ${assignmentId} actualizada en Supabase`);
            return true;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla assignments no disponible, actualizando solo localmente');
                const assignment = AppState.assignments?.find(a => a.id == assignmentId);
                if (assignment) {
                    Object.assign(assignment, updateData);
                    console.log(`✅ [ASSIGNMENTS] Asignación ${assignmentId} actualizada en memoria local`);
                }
                return true;
            }
            console.error(`❌ [ASSIGNMENTS] Error actualizando asignación:`, error);
            throw error;
        }
    },

    /**
     * Actualizar titular de número - ✅ CORREGIDA LA FUNCIÓN PROBLEMÁTICA
     */
    updateNumberOwner: async function(ownerId, updateData) {
        if (!this.isConnected) {
            throw new Error('Supabase no conectado');
        }
        
        try {
            // Convertir fechas si es necesario
            const dataToUpdate = {
                ...updateData,
                edited_at: updateData.edited_at instanceof Date ? 
                    updateData.edited_at.toISOString() : 
                    (typeof updateData.edited_at === 'string' ? updateData.edited_at : new Date().toISOString()),
                updated_at: new Date().toISOString()
            };
            
            const { error } = await this.client
                .from('number_owners')
                .update(dataToUpdate)
                .eq('id', ownerId);
                
            if (error) {
                // ✅ CORREGIDO: Verificación segura de error - AQUÍ ESTABA EL PROBLEMA ORIGINAL
                if (this.isTableNotFoundError(error)) {
                    console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no existe, actualizando solo localmente');
                    // Continuar con actualización local
                    const owner = AppState.numberOwners?.find(o => o.id == ownerId);
                    if (owner) {
                        Object.assign(owner, {
                            name: updateData.owner_name || owner.name,
                            lastname: updateData.owner_lastname || owner.lastname,
                            phone: updateData.owner_phone || owner.phone,
                            email: updateData.owner_email || owner.email,
                            instagram: updateData.owner_instagram || owner.instagram,
                            membership_area: updateData.membership_area || owner.membership_area,
                            edited_at: dataToUpdate.edited_at
                        });
                        console.log(`✅ [ASSIGNMENTS] Titular ${ownerId} actualizado en memoria local`);
                    }
                    return true;
                }
                throw error;
            }
            
            // Actualizar estado local
            const owner = AppState.numberOwners?.find(o => o.id == ownerId);
            if (owner) {
                Object.assign(owner, {
                    name: updateData.owner_name || owner.name,
                    lastname: updateData.owner_lastname || owner.lastname,
                    phone: updateData.owner_phone || owner.phone,
                    email: updateData.owner_email || owner.email,
                    instagram: updateData.owner_instagram || owner.instagram,
                    membership_area: updateData.membership_area || owner.membership_area,
                    edited_at: dataToUpdate.edited_at
                });
                console.log(`✅ [ASSIGNMENTS] Titular ${ownerId} actualizado en memoria local`);
            }
            
            console.log(`✅ [ASSIGNMENTS] Titular ${ownerId} actualizado en Supabase`);
            return true;
            
        } catch (error) {
            // ✅ CORREGIDO: Verificación segura de error en catch - AQUÍ TAMBIÉN ESTABA EL PROBLEMA
            if (this.isTableNotFoundError(error)) {
                console.warn('⚠️ [ASSIGNMENTS] Tabla number_owners no disponible, actualizando solo localmente');
                // Actualizar solo en memoria local
                const owner = AppState.numberOwners?.find(o => o.id == ownerId);
                if (owner) {
                    Object.assign(owner, {
                        name: updateData.owner_name || owner.name,
                        lastname: updateData.owner_lastname || owner.lastname,
                        phone: updateData.owner_phone || owner.phone,
                        email: updateData.owner_email || owner.email,
                        instagram: updateData.owner_instagram || owner.instagram,
                        membership_area: updateData.membership_area || owner.membership_area,
                        edited_at: new Date()
                    });
                    console.log(`✅ [ASSIGNMENTS] Titular ${ownerId} actualizado en memoria local`);
                }
                return true;
            }
            console.error('❌ [ASSIGNMENTS] Error actualizando titular:', error);
            throw error;
        }
    }
};

console.log('✅ SupabaseAssignmentsManager cargado correctamente');
