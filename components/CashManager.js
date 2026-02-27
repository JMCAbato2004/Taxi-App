/**
 * CashManager - Gestor de Efectivo Diario para Taxistas
 * 
 * Responsabilidades:
 * - Establecer saldo inicial de efectivo
 * - Calcular automáticamente ingresos en efectivo de servicios
 * - Registrar gastos en efectivo
 * - Mostrar saldo actual en tiempo real
 * - Permitir reiniciar caja para nuevo día
 */

class CashManager {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.modal = null;
    this.cashSession = null;
  }

  /**
   * Mostrar modal de gestión de efectivo
   */
  async show() {
    await this.loadCurrentSession();
    this.modal = await this.createModal();
    await this.modal.present();
    await this.updateCashSummary();
  }

  /**
   * Cargar sesión de caja actual
   */
  async loadCurrentSession() {
    const user = await this.authAdapter.getCurrentUser();
    if (!user) return;

    const sessions = JSON.parse(localStorage.getItem('taxi_cash_sessions') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar sesión de hoy
    this.cashSession = sessions.find(s => 
      s.userId === user.id && 
      s.date === today && 
      s.status === 'active'
    );

    // Si no existe, crear una nueva
    if (!this.cashSession) {
      this.cashSession = {
        id: 'cash-' + Date.now(),
        userId: user.id,
        date: today,
        startTime: new Date().toISOString(),
        initialBalance: 0,
        cashExpenses: [],
        status: 'active'
      };
      sessions.push(this.cashSession);
      localStorage.setItem('taxi_cash_sessions', JSON.stringify(sessions));
    }
  }

  /**
   * Crear modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="success">
          <ion-title>💵 Gestión de Efectivo</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-cash-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <!-- Resumen de Caja -->
        <ion-card style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%); border: 2px solid var(--ion-color-success);">
          <ion-card-content>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 14px; color: var(--ion-color-medium); font-weight: 600;">EFECTIVO DISPONIBLE</p>
              <h1 id="current-cash-balance" style="margin: 8px 0; font-size: 48px; font-weight: bold; color: var(--ion-color-success);">€0,00</h1>
              <p style="margin: 0; font-size: 12px; color: var(--ion-color-medium);">Actualizado en tiempo real</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Desglose -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Desglose del Día</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-icon name="wallet" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Saldo Inicial</h3>
                  <p>Efectivo al comenzar el día</p>
                </ion-label>
                <ion-note slot="end" id="initial-balance-note" style="font-size: 18px; font-weight: 600;">€0,00</ion-note>
              </ion-item>
              
              <ion-item>
                <ion-icon name="add-circle" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Ingresos en Efectivo</h3>
                  <p id="cash-services-count">0 servicios</p>
                </ion-label>
                <ion-note slot="end" id="cash-income-note" style="font-size: 18px; font-weight: 600; color: var(--ion-color-success);">+€0,00</ion-note>
              </ion-item>
              
              <ion-item>
                <ion-icon name="remove-circle" slot="start" color="danger"></ion-icon>
                <ion-label>
                  <h3>Gastos en Efectivo</h3>
                  <p id="cash-expenses-count">0 gastos</p>
                </ion-label>
                <ion-note slot="end" id="cash-expenses-note" style="font-size: 18px; font-weight: 600; color: var(--ion-color-danger);">-€0,00</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Botones de Acción -->
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <ion-button expand="block" id="set-initial-balance-btn" style="flex: 1;">
            <ion-icon name="create" slot="start"></ion-icon>
            Establecer Saldo Inicial
          </ion-button>
          <ion-button expand="block" color="danger" id="add-cash-expense-btn" style="flex: 1;">
            <ion-icon name="remove" slot="start"></ion-icon>
            Registrar Gasto
          </ion-button>
        </div>

        <!-- Lista de Gastos en Efectivo -->
        <ion-card style="margin-top: 16px;">
          <ion-card-header>
            <ion-card-title>Gastos en Efectivo Hoy</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div id="cash-expenses-list">
              <p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">
                No hay gastos registrados
              </p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Botón Reiniciar Caja -->
        <ion-button expand="block" fill="outline" color="warning" id="reset-cash-btn" style="margin-top: 16px;">
          <ion-icon name="refresh" slot="start"></ion-icon>
          Reiniciar Caja (Nuevo Día)
        </ion-button>
      </ion-content>
    `;

    document.body.appendChild(modal);

    // Adjuntar event listeners
    modal.querySelector('#close-cash-modal').addEventListener('click', () => {
      modal.dismiss();
    });

    modal.querySelector('#set-initial-balance-btn').addEventListener('click', () => {
      this.showSetInitialBalanceModal();
    });

    modal.querySelector('#add-cash-expense-btn').addEventListener('click', () => {
      this.showAddCashExpenseModal();
    });

    modal.querySelector('#reset-cash-btn').addEventListener('click', () => {
      this.handleResetCash();
    });

    return modal;
  }

  /**
   * Actualizar resumen de caja
   */
  async updateCashSummary() {
    if (!this.cashSession) return;

    const user = await this.authAdapter.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];

    // Obtener servicios en efectivo de hoy
    const allServices = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    const cashServices = allServices.filter(s => 
      s.userId === user.id &&
      s.date === today &&
      s.paymentMethod === 'efectivo'
    );

    const cashIncome = cashServices.reduce((sum, s) => sum + parseFloat(s.netAmount || 0), 0);

    // Calcular gastos en efectivo
    const cashExpenses = this.cashSession.cashExpenses || [];
    const totalExpenses = cashExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Calcular saldo actual
    const currentBalance = this.cashSession.initialBalance + cashIncome - totalExpenses;

    // Actualizar UI
    document.getElementById('current-cash-balance').textContent = this.formatEuros(currentBalance) + '€';
    document.getElementById('initial-balance-note').textContent = this.formatEuros(this.cashSession.initialBalance) + '€';
    document.getElementById('cash-income-note').textContent = '+' + this.formatEuros(cashIncome) + '€';
    document.getElementById('cash-expenses-note').textContent = '-' + this.formatEuros(totalExpenses) + '€';
    document.getElementById('cash-services-count').textContent = cashServices.length + ' servicios';
    document.getElementById('cash-expenses-count').textContent = cashExpenses.length + ' gastos';

    // Actualizar lista de gastos
    this.renderCashExpensesList();
  }

  /**
   * Renderizar lista de gastos en efectivo
   */
  renderCashExpensesList() {
    const container = document.getElementById('cash-expenses-list');
    const expenses = this.cashSession.cashExpenses || [];

    if (expenses.length === 0) {
      container.innerHTML = `
        <p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">
          No hay gastos registrados
        </p>
      `;
      return;
    }

    container.innerHTML = expenses.map(expense => `
      <ion-item>
        <ion-icon name="${expense.category === 'fuel' ? 'car' : 'receipt'}" slot="start" color="danger"></ion-icon>
        <ion-label>
          <h3>${expense.concept}</h3>
          <p>${new Date(expense.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        </ion-label>
        <ion-note slot="end" style="font-size: 16px; font-weight: 600; color: var(--ion-color-danger);">
          -${this.formatEuros(expense.amount)}€
        </ion-note>
        <ion-button fill="clear" slot="end" class="delete-cash-expense-btn" data-expense-id="${expense.id}">
          <ion-icon name="trash" color="danger"></ion-icon>
        </ion-button>
      </ion-item>
    `).join('');

    // Adjuntar listeners para eliminar
    document.querySelectorAll('.delete-cash-expense-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expenseId = e.currentTarget.getAttribute('data-expense-id');
        this.handleDeleteCashExpense(expenseId);
      });
    });
  }

  /**
   * Mostrar modal para establecer saldo inicial
   */
  async showSetInitialBalanceModal() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Saldo Inicial';
    alert.message = '¿Cuánto efectivo tienes al comenzar el día?';
    alert.inputs = [
      {
        name: 'initialBalance',
        type: 'number',
        placeholder: '0.00',
        value: this.cashSession.initialBalance || 0,
        attributes: {
          step: '0.01',
          min: '0'
        }
      }
    ];
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Guardar',
        handler: (data) => {
          const amount = parseFloat(data.initialBalance) || 0;
          this.setInitialBalance(amount);
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  /**
   * Establecer saldo inicial
   */
  setInitialBalance(amount) {
    this.cashSession.initialBalance = amount;
    this.saveCashSession();
    this.updateCashSummary();
    
    if (window.ToastManager) {
      window.ToastManager.showSuccess(`Saldo inicial: ${this.formatEuros(amount)}€`);
    }
  }

  /**
   * Mostrar modal para agregar gasto en efectivo
   */
  async showAddCashExpenseModal() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Registrar Gasto en Efectivo';
    alert.message = 'Ingresa los detalles del gasto';
    alert.inputs = [
      {
        name: 'concept',
        type: 'text',
        placeholder: 'Concepto (ej: Gasolina)',
        attributes: {
          maxlength: 50
        }
      },
      {
        name: 'amount',
        type: 'number',
        placeholder: 'Importe (€)',
        attributes: {
          step: '0.01',
          min: '0.01'
        }
      },
      {
        name: 'category',
        type: 'radio',
        label: '⛽ Combustible',
        value: 'fuel',
        checked: true
      },
      {
        name: 'category',
        type: 'radio',
        label: '📋 Otro',
        value: 'other'
      }
    ];
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Registrar',
        handler: (data) => {
          if (!data.concept || !data.amount) {
            if (window.ToastManager) {
              window.ToastManager.showError('Completa todos los campos');
            }
            return false;
          }
          this.addCashExpense(data);
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  /**
   * Agregar gasto en efectivo
   */
  addCashExpense(data) {
    const expense = {
      id: 'expense-' + Date.now(),
      concept: data.concept,
      amount: parseFloat(data.amount),
      category: data.category,
      timestamp: new Date().toISOString()
    };

    if (!this.cashSession.cashExpenses) {
      this.cashSession.cashExpenses = [];
    }

    this.cashSession.cashExpenses.push(expense);
    this.saveCashSession();
    this.updateCashSummary();

    if (window.ToastManager) {
      window.ToastManager.showSuccess(`Gasto registrado: -${this.formatEuros(expense.amount)}€`);
    }
  }

  /**
   * Eliminar gasto en efectivo
   */
  async handleDeleteCashExpense(expenseId) {
    const confirmed = await window.AlertManager.confirm(
      'Eliminar Gasto',
      '¿Estás seguro de eliminar este gasto?'
    );

    if (confirmed) {
      this.cashSession.cashExpenses = this.cashSession.cashExpenses.filter(e => e.id !== expenseId);
      this.saveCashSession();
      this.updateCashSummary();

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Gasto eliminado');
      }
    }
  }

  /**
   * Reiniciar caja para nuevo día
   */
  async handleResetCash() {
    const confirmed = await window.AlertManager.confirm(
      'Reiniciar Caja',
      '¿Estás seguro? Esto cerrará la caja actual y creará una nueva para hoy. Los datos anteriores se guardarán en el historial.'
    );

    if (confirmed) {
      // Cerrar sesión actual
      this.cashSession.status = 'closed';
      this.cashSession.endTime = new Date().toISOString();
      this.saveCashSession();

      // Crear nueva sesión
      await this.loadCurrentSession();
      await this.updateCashSummary();

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Caja reiniciada para nuevo día');
      }
    }
  }

  /**
   * Guardar sesión de caja
   */
  saveCashSession() {
    const sessions = JSON.parse(localStorage.getItem('taxi_cash_sessions') || '[]');
    const index = sessions.findIndex(s => s.id === this.cashSession.id);
    
    if (index >= 0) {
      sessions[index] = this.cashSession;
    } else {
      sessions.push(this.cashSession);
    }

    localStorage.setItem('taxi_cash_sessions', JSON.stringify(sessions));
  }

  /**
   * Formatear euros
   */
  formatEuros(amount) {
    return amount.toFixed(2).replace('.', ',');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.CashManager = CashManager;
}

console.log('CashManager component loaded');
