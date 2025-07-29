/**
 * INTERFAZ DE NÚMEROS - Sistema de Rifas Pampero
 * Maneja la interfaz, grid de números y selección
 */

window.NumbersInterface = {
    /**
     * Crear interfaz de números
     */
    createInterface: function() {
        if (!AppState.raffleConfig) return;

        const container = document.getElementById('numbersContent');
        container.innerHTML = `
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #d4edda;"></div>
                    Disponible
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #4CAF50;"></div>
                    Seleccionado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #fff3cd;"></div>
                    Reservado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ffc107;"></div>
                    Asignado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #007bff;"></div>
                    Confirmado
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f8d7da;"></div>
                    Vendido
                </div>
            </div>

            <div id="selectionSummary" style="display: none;" class="selection-summary">
                <h3>Tu selección</h3>
                <div id="selectedNumbersList" class="selected-numbers"></div>
                <div class="total-price" id="totalPrice"></div>
                <button class="btn" onclick="NumbersManager.openPurchaseModal('buy')" style="width: calc(33% - 3px);">💰 Comprar</button>
                <button class="btn btn-secondary" onclick="NumbersManager.openPurchaseModal('reserve')" style="width: calc(33% - 3px); background: #ffc107; color: #000;">⏰ Reservar</button>
                <button class="btn btn-info" onclick="NumbersManager.openAssignmentModal()" style="width: calc(33% - 3px); background: #17a2b8;">🎯 Asignar</button>
                <button class="btn btn-secondary" onclick="NumbersManager.clearSelection()">Limpiar Selección</button>
            </div>

            <div class="numbers-grid" id="numbersGrid"></div>
        `;

        // Generar grid de números (del 0 al N-1)
        const grid = document.getElementById('numbersGrid');
        for (let i = 0; i < AppState.raffleConfig.totalNumbers; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn available';
            button.textContent = Utils.formatNumber(i);
            button.onclick = () => this.handleNumberClick(i);
            button.id = `number-${i}`;
            grid.appendChild(button);
        }

        NumbersManager.updateDisplay();
    },

    /**
     * Manejar clic en número (mostrar info o seleccionar)
     */
    handleNumberClick: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Si el número está vendido o confirmado, mostrar información
        if (button.classList.contains('sold') || button.classList.contains('confirmed')) {
            NumbersManager.showNumberInfo(number);
        } else if (button.classList.contains('assigned')) {
            // Si está asignado, permitir editar titular
            const assignment = AppState.assignments?.find(a => a.numbers.includes(number));
            if (assignment) {
                const now = new Date();
                const rendicionDate = new Date(assignment.payment_deadline);
                
                if (now < rendicionDate) {
                    // Aún se puede editar el titular
                    NumbersManager.showEditOwnerModal(number);
                } else {
                    // Ya pasó la fecha de rendición, solo mostrar info
                    NumbersManager.showNumberInfo(number);
                }
            } else {
                NumbersManager.showNumberInfo(number);
            }
        } else {
            // Si está disponible o reservado, proceder con selección normal
            this.toggleNumber(number);
        }
    },

    /**
     * Alternar selección de número
     */
    toggleNumber: function(number) {
        const button = document.getElementById(`number-${number}`);
        
        // Verificar si el número ya está vendido
        if (button.classList.contains('sold')) {
            Utils.showNotification('Este número ya está vendido', 'warning');
            return;
        }
        
        // Verificar si está asignado o confirmado
        if (button.classList.contains('assigned')) {
            Utils.showNotification('Este número está asignado a un vendedor', 'warning');
            return;
        }
        
        if (button.classList.contains('confirmed')) {
            Utils.showNotification('Este número está confirmado para el sorteo', 'warning');
            return;
        }
        
        // Verificar reservas temporales (sistema antiguo)
        if (button.classList.contains('reserved')) {
            const reservation = AppState.reservations.find(r => 
                r.numbers.includes(number) && r.status === 'active'
            );
            if (reservation && !Utils.isReservationExpired(reservation)) {
                Utils.showNotification('Este número está reservado temporalmente', 'warning');
                return;
            }
        }

        if (AppState.selectedNumbers.includes(number)) {
            // Deseleccionar
            AppState.selectedNumbers = AppState.selectedNumbers.filter(n => n !== number);
            button.classList.remove('selected');
            button.classList.add('available');
        } else {
            // Seleccionar
            AppState.selectedNumbers.push(number);
            button.classList.remove('available', 'reserved');
            button.classList.add('selected');
        }

        AppState.selectedNumbers.sort((a, b) => a - b);
        this.updateSelectionSummary();
    },

    /**
     * Actualizar resumen de selección
     */
    updateSelectionSummary: function() {
        const summary = document.getElementById('selectionSummary');
        const numbersList = document.getElementById('selectedNumbersList');
        const totalPrice = document.getElementById('totalPrice');

        if (AppState.selectedNumbers.length === 0) {
            summary.style.display = 'none';
            return;
        }

        summary.style.display = 'block';
        
        numbersList.innerHTML = AppState.selectedNumbers.map(num => 
            `<span class="selected-number">${Utils.formatNumber(num)}</span>`
        ).join('');

        const total = AppState.selectedNumbers.length * AppState.raffleConfig.price;
        totalPrice.textContent = `Total: ${Utils.formatPrice(total)}`;
    },

    /**
     * Limpiar selección
     */
    clearSelection: function() {
        AppState.selectedNumbers.forEach(number => {
            const button = document.getElementById(`number-${number}`);
            if (button) {
                button.classList.remove('selected');
                button.classList.add('available');
            }
        });
        AppState.selectedNumbers = [];
        this.updateSelectionSummary();
    }
};

console.log('✅ numbers-interface.js cargado correctamente');
