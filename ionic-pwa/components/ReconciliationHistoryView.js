/**
 * ReconciliationHistoryView Component
 * Displays list of saved reconciliations with role-based filtering
 */

class ReconciliationHistoryView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.reconciliations = [];
  }

  /**
   * Render the history view
   */
  async render() {
    const container = document.getElementById('reconciliation-history-content');
    if (!container) return;

    // Clear any loading spinners
    container.innerHTML = '';

    await this.loadReconciliations();

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Historial de Conciliaciones</ion-card-title>
          <ion-card-subtitle>${this.reconciliations.length} conciliaciones guardadas</ion-card-subtitle>
        </ion-card-header>
      </ion-card>

      <!-- Reconciliation List -->
      <ion-list id="reconciliation-list">
        ${this.renderReconciliationItems()}
      </ion-list>

      <!-- Empty State -->
      <div id="empty-state" style="display: ${this.reconciliations.length === 0 ? 'block' : 'none'}; text-align: center; padding: 40px 20px;">
        <ion-icon name="document-text-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
        <h3>No hay conciliaciones</h3>
        <p style="color: var(--ion-color-medium);">Las conciliaciones guardadas aparecerán aquí</p>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Load reconciliations from adapter
   */
  async loadReconciliations() {
    try {
      this.reconciliations = await this.reconcileAdapter.getReconciliations();
      // Sort by date (newest first)
      this.reconciliations.sort((a, b) => 
        new Date(b.generatedAt) - new Date(a.generatedAt)
      );
    } catch (error) {
      console.error('Error loading reconciliations:', error);
      ToastManager.showError('Error al cargar conciliaciones');
    }
  }

  /**
   * Render reconciliation items
   */
  renderReconciliationItems() {
    if (this.reconciliations.length === 0) {
      return '';
    }

    return this.reconciliations.map(reconciliation => {
      const { config, summary, distribution } = reconciliation;
      const generatedDate = new Date(reconciliation.generatedAt);
      const formattedDate = generatedDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Handle different property names with fallbacks
      const driverAmount = distribution?.driverAmount || distribution?.taxistaAmount || 0;
      const ownerAmount = distribution?.ownerAmount || distribution?.patronAmount || 0;
      const grossIncome = summary?.grossIncome || summary?.totalIncome || 0;
      const totalExpenses = summary?.totalExpenses || 0;
      const netIncome = summary?.netIncome || (grossIncome - totalExpenses);

      return `
        <ion-item-sliding>
          <ion-item button class="reconciliation-item" data-reconciliation-id="${reconciliation.id}">
            <div slot="start" class="reconciliation-icon">
              <ion-icon name="calculator" style="font-size: 24px; color: var(--ion-color-primary);"></ion-icon>
            </div>
            <ion-label>
              <h2>${config?.clientName || 'Sin nombre'}</h2>
              <p>${config?.startDate || ''} - ${config?.endDate || ''}</p>
              <p style="margin-top: 4px;">
                <ion-badge color="success">Conductor: €${driverAmount.toFixed(2)}</ion-badge>
                <ion-badge color="primary" style="margin-left: 8px;">Propietario: €${ownerAmount.toFixed(2)}</ion-badge>
              </p>
            </ion-label>
            <div slot="end" style="text-align: right;">
              <div style="font-size: 12px; color: var(--ion-color-medium);">${formattedDate}</div>
              <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">€${netIncome.toFixed(2)}</div>
            </div>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="danger" class="delete-reconciliation-btn" data-reconciliation-id="${reconciliation.id}">
              <ion-icon name="trash" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      `;
    }).join('');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Reconciliation item click (view details)
    document.querySelectorAll('.reconciliation-item').forEach(item => {
      item.addEventListener('click', () => {
        const reconciliationId = item.getAttribute('data-reconciliation-id');
        this.handleViewDetails(reconciliationId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-reconciliation-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reconciliationId = btn.getAttribute('data-reconciliation-id');
        this.handleDelete(reconciliationId);
      });
    });
  }

  /**
   * Handle view reconciliation details
   */
  handleViewDetails(reconciliationId) {
    const reconciliation = this.reconciliations.find(r => r.id === reconciliationId);
    if (!reconciliation) return;

    // Dispatch event to show details modal
    window.dispatchEvent(new CustomEvent('view-reconciliation-details', { detail: reconciliation }));
  }

  /**
   * Handle delete reconciliation
   */
  async handleDelete(reconciliationId) {
    await ActionSheetManager.showConfirmation(
      'Eliminar Conciliación',
      '¿Estás seguro de que deseas eliminar esta conciliación?',
      async () => {
        try {
          await LoadingManager.show('Eliminando...');
          await this.reconcileAdapter.deleteReconciliation(reconciliationId);
          await LoadingManager.hide();
          
          ToastManager.showSuccess('Conciliación eliminada');
          await this.render();
        } catch (error) {
          await LoadingManager.hide();
          ToastManager.showError('Error al eliminar conciliación');
        }
      }
    );
  }

  /**
   * Refresh the reconciliation list
   */
  async refresh() {
    await this.render();
  }
}

// Export for use in other modules
window.ReconciliationHistoryView = ReconciliationHistoryView;

console.log('ReconciliationHistoryView component loaded');
