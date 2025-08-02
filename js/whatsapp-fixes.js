/**
 * SCRIPT PARA APLICAR CORRECCIONES DE WHATSAPP
 * Este archivo contiene todas las correcciones necesarias para el sistema de WhatsApp
 * Se ejecuta automáticamente al cargar
 */

console.log('🔧 Iniciando correcciones del sistema de WhatsApp...');

// =============================================
// CORRECCIÓN 1: Agregar delegaciones faltantes en NumbersManager
// =============================================

// Esperar a que NumbersManager esté disponible
function addNumbersManagerDelegations() {
    if (window.NumbersManager) {
        // Agregar las funciones de delegación faltantes
        window.NumbersManager.generateSimpleWhatsAppMessage = function(sale, numbersFormatted) { 
            return NumbersPurchase.generateSimpleWhatsAppMessage(sale, numbersFormatted); 
        };
        
        window.NumbersManager.showPurchaseConfirmation = function(sale, whatsappMessage) { 
            NumbersPurchase.showPurchaseConfirmation(sale, whatsappMessage); 
        };
        
        console.log('✅ [FIX 1] Delegaciones agregadas a NumbersManager');
        return true;
    }
    return false;
}

// =============================================
// CORRECCIÓN 2: Mejorar función markAsPaid en AdminSales
// =============================================

function fixAdminSalesMarkAsPaid() {
    if (window.AdminSales) {
        // Reemplazar la función markAsPaid
        window.AdminSales.markAsPaid = async function(saleId) {
            console.log(`🔍 [SALES] Intentando marcar como pagado - Sale ID: ${saleId}`);
            
            const sale = AppState.sales.find(s => s.id == saleId);
            if (!sale) {
                console.error(`❌ [SALES] Venta ${saleId} no encontrada en memoria local`);
                Utils.showNotification('Venta no encontrada', 'error');
                return;
            }
            
            if (sale.status === 'paid') {
                Utils.showNotification('Esta venta ya está marcada como pagada', 'warning');
                return;
            }
            
            try {
                // 1. Actualizar en Supabase primero
                if (window.SupabaseManager && window.SupabaseManager.isConnected) {
                    const success = await window.SupabaseManager.markSaleAsPaid(saleId);
                    if (!success) {
                        Utils.showNotification('Error actualizando el pago en Supabase', 'error');
                        return;
                    }
                    console.log('✅ [SALES] Venta actualizada en Supabase');
                }
                
                // 2. Actualizar estado local SIEMPRE
                sale.status = 'paid';
                sale.paid_at = new Date();
                
                // 3. Actualizar números en UI
                if (sale.numbers && sale.numbers.length > 0) {
                    sale.numbers.forEach(number => {
                        const button = document.getElementById(`number-${number}`);
                        if (button && !button.classList.contains('sold')) {
                            button.classList.remove('reserved', 'available');
                            button.classList.add('sold');
                        }
                    });
                }
                
                // 4. ✅ MOSTRAR CONFIRMACIÓN CON WHATSAPP AUTOMÁTICAMENTE
                const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
                const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
                
                // Mostrar modal de confirmación con WhatsApp
                AdminSales.showPaymentConfirmationModal(sale, whatsappMessage);
                
                // 5. Guardar y actualizar interfaz
                await autoSave();
                AdminManager.updateInterface();
                if (NumbersManager.updateDisplay) NumbersManager.updateDisplay();
                if (ReportsManager.updateReports) ReportsManager.updateReports();
                
                Utils.showNotification('✅ Pago marcado como confirmado', 'success');
                console.log(`✅ [SALES] Venta ${saleId} marcada como pagada exitosamente`);
                
            } catch (error) {
                console.error('❌ [SALES] Error marcando pago:', error);
                Utils.showNotification('Error actualizando el pago', 'error');
            }
        };
        
        // Agregar nueva función de modal de confirmación
        window.AdminSales.showPaymentConfirmationModal = function(sale, whatsappMessage) {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
            
            const modalHtml = `
                <div class="modal" id="paymentConfirmationModal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>✅ Pago Confirmado</h3>
                            <span class="modal-close" onclick="AdminSales.closePaymentConfirmationModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="confirmation-section">
                                <div class="success-icon" style="text-align: center; font-size: 48px; margin: 20px 0;">✅</div>
                                
                                <div class="sale-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p><strong>Cliente:</strong> ${sale.buyer.name} ${sale.buyer.lastName}</p>
                                    <p><strong>Teléfono:</strong> ${sale.buyer.phone}</p>
                                    <p><strong>Números:</strong> ${numbersFormatted}</p>
                                    <p><strong>Total:</strong> ${Utils.formatPrice(sale.total)}</p>
                                    <p><strong>Método:</strong> ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}</p>
                                </div>

                                <div class="whatsapp-section" style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                                    <h4 style="color: #2d5016; margin-bottom: 10px;">📱 Enviar Confirmación por WhatsApp</h4>
                                    <p style="color: #2d5016; font-size: 14px; margin-bottom: 15px;">
                                        Haz clic para enviar la confirmación de pago al cliente:
                                    </p>
                                    <button class="btn btn-success" onclick="AdminSales.sendPaymentConfirmationWhatsApp('${sale.id}')" style="width: 100%; background: #25D366; padding: 12px;">
                                        📱 Enviar Confirmación a ${sale.buyer.name}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="AdminSales.closePaymentConfirmationModal()">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal existente si hay uno
            const existingModal = document.getElementById('paymentConfirmationModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };
        
        // Agregar función para cerrar modal
        window.AdminSales.closePaymentConfirmationModal = function() {
            const modal = document.getElementById('paymentConfirmationModal');
            if (modal) {
                modal.remove();
            }
        };
        
        // Agregar función para enviar confirmación
        window.AdminSales.sendPaymentConfirmationWhatsApp = function(saleId) {
            const sale = AppState.sales.find(s => s.id == saleId);
            if (!sale) {
                Utils.showNotification('Venta no encontrada', 'error');
                return;
            }
            
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
            
            const confirmationMessage = `✅ *PAGO CONFIRMADO - RIFA NÁUTICA*\n\n` +
                `¡Hola ${sale.buyer.name}! 🎉\n\n` +
                `✅ *Tu pago ha sido confirmado exitosamente*\n\n` +
                `📋 *Detalles de tu compra:*\n` +
                `🎟️ Números: ${numbersFormatted}\n` +
                `💰 Total pagado: ${Utils.formatPrice(sale.total)}\n` +
                `💳 Método: ${AppConstants.PAYMENT_METHODS[sale.paymentMethod]}\n` +
                `📅 Confirmado: ${Utils.formatDateTime(new Date())}\n\n` +
                `🏆 *Premio:* ${AppState.raffleConfig.prize}\n` +
                (AppState.raffleConfig.drawDate ? `🗓️ *Sorteo:* ${Utils.formatDateTime(AppState.raffleConfig.drawDate)}\n\n` : '\n') +
                `¡Ya estás participando oficialmente! 🍀⛵\n\n` +
                (AppState.raffleConfig.clubInstagram ? `📱 Síguenos: ${AppState.raffleConfig.clubInstagram}\n\n` : '') +
                `¡Gracias por tu participación!`;

            const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(confirmationMessage)}`;
            window.open(whatsappUrl, '_blank');
            
            // Cerrar modal después de enviar
            AdminSales.closePaymentConfirmationModal();
            
            Utils.showNotification('WhatsApp abierto para enviar confirmación', 'success');
        };
        
        // Mejorar función sendWhatsAppConfirmation
        const originalSendWhatsApp = window.AdminSales.sendWhatsAppConfirmation;
        window.AdminSales.sendWhatsAppConfirmation = function(saleId) {
            const sale = AppState.sales.find(s => s.id == saleId);
            if (!sale) {
                Utils.showNotification('Venta no encontrada', 'error');
                return;
            }
            
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
            const whatsappMessage = NumbersManager.generateSimpleWhatsAppMessage(sale, numbersFormatted);
            
            const whatsappUrl = `https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
            
            Utils.showNotification('WhatsApp abierto para enviar confirmación', 'info');
        };
        
        console.log('✅ [FIX 2] Función markAsPaid mejorada en AdminSales');
        return true;
    }
    return false;
}

// =============================================
// CORRECCIÓN 3: Mejorar showPurchaseConfirmation
// =============================================

function fixNumbersPurchaseConfirmation() {
    if (window.NumbersPurchase) {
        window.NumbersPurchase.showPurchaseConfirmation = function(sale, whatsappMessage) {
            const numbersFormatted = sale.numbers.map(n => Utils.formatNumber(n)).join(', ');
            
            const confirmationHtml = `
                <div class="confirmation-modal" id="confirmationModal">
                    <div class="confirmation-content">
                        <div class="success-icon">✅</div>
                        <h3>${sale.status === 'pending' ? 'Compra Registrada' : 'Compra Confirmada'}</h3>
                        <p><strong>Números:</strong> ${numbersFormatted}</p>
                        <p><strong>Total:</strong> ${Utils.formatPrice(sale.total)}</p>
                        
                        ${sale.status === 'pending' ? 
                            '<p style="color: #856404;"><strong>⏳ Pago pendiente por transferencia</strong></p>' : 
                            '<p style="color: #4CAF50;"><strong>✅ Pago confirmado</strong></p>'
                        }
                        
                        <div style="margin: 20px 0;">
                            <p><strong>Enviar confirmación al cliente:</strong></p>
                            <a href="https://wa.me/${NumbersManager.formatPhoneForWhatsApp(sale.buyer.phone)}?text=${encodeURIComponent(whatsappMessage)}" 
                               class="whatsapp-btn" target="_blank" 
                               style="display: inline-block; background: #25D366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                               📱 Confirmar a ${sale.buyer.name}
                            </a>
                        </div>
                        
                        ${sale.status === 'pending' ? `
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800;">
                            <p style="color: #e65100; font-size: 14px; margin: 0;">
                                <strong>📋 Recordatorio:</strong> Una vez que recibas el comprobante de transferencia, 
                                ve al panel de Admin para marcar el pago como confirmado.
                            </p>
                        </div>
                        ` : ''}
                        
                        <button class="btn btn-secondary" onclick="NumbersManager.closeConfirmationModal()">Cerrar</button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmationHtml);
        };
        
        console.log('✅ [FIX 3] Función showPurchaseConfirmation mejorada');
        return true;
    }
    return false;
}

// =============================================
// CORRECCIÓN 4: Agregar estilos CSS
// =============================================

function addWhatsAppStyles() {
    // Agregar estilos CSS si no existen
    const existingStyles = document.getElementById('whatsapp-fix-styles');
    if (!existingStyles) {
        const style = document.createElement('style');
        style.id = 'whatsapp-fix-styles';
        style.textContent = `
            .whatsapp-btn {
                background: #25D366 !important;
                color: white !important;
                padding: 12px 20px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
                transition: background 0.3s ease;
            }

            .whatsapp-btn:hover {
                background: #1DA851 !important;
                color: white !important;
            }

            .confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }

            .confirmation-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .success-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }

            #paymentConfirmationModal .modal-content {
                max-width: 600px;
            }

            .whatsapp-section button {
                border: none;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                border-radius: 8px;
                transition: all 0.3s ease;
            }

            .whatsapp-section button:hover {
                background: #1DA851 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ [FIX 4] Estilos CSS agregados');
        return true;
    }
    return false;
}

// =============================================
// FUNCIÓN PRINCIPAL PARA APLICAR TODAS LAS CORRECCIONES
// =============================================

async function applyAllWhatsAppFixes() {
    let fixes = 0;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Función para intentar aplicar todas las correcciones
    function tryApplyFixes() {
        let currentFixes = 0;
        
        if (addNumbersManagerDelegations()) currentFixes++;
        if (fixAdminSalesMarkAsPaid()) currentFixes++;
        if (fixNumbersPurchaseConfirmation()) currentFixes++;
        if (addWhatsAppStyles()) currentFixes++;
        
        return currentFixes;
    }
    
    // Intentar aplicar las correcciones cada 500ms hasta que todas estén aplicadas
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            attempts++;
            const currentFixes = tryApplyFixes();
            
            if (currentFixes > fixes) {
                fixes = currentFixes;
                console.log(`📈 Progreso: ${fixes}/4 correcciones aplicadas`);
            }
            
            if (fixes >= 4 || attempts >= maxAttempts) {
                clearInterval(interval);
                
                if (fixes >= 4) {
                    console.log('🎉 ¡Todas las correcciones de WhatsApp aplicadas exitosamente!');
                    Utils.showNotification('✅ Sistema de WhatsApp corregido exitosamente', 'success', 5000);
                } else {
                    console.log(`⚠️ Solo se aplicaron ${fixes}/4 correcciones después de ${attempts} intentos`);
                    Utils.showNotification(`⚠️ Solo se aplicaron ${fixes}/4 correcciones`, 'warning', 5000);
                }
                
                resolve({
                    success: fixes >= 4,
                    appliedFixes: fixes,
                    totalFixes: 4,
                    attempts: attempts
                });
            }
        }, 500);
    });
}

// =============================================
// AUTO-EJECUTAR LAS CORRECCIONES
// =============================================

// Ejecutar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyAllWhatsAppFixes, 1000);
    });
} else {
    // El DOM ya está listo, ejecutar después de un pequeño delay
    setTimeout(applyAllWhatsAppFixes, 1000);
}

// Exportar función para uso manual
window.applyAllWhatsAppFixes = applyAllWhatsAppFixes;

console.log('📋 Script de correcciones de WhatsApp cargado - Se aplicarán automáticamente');
