/**
 * ServiceListView Component
 * Displays list of services with role-based filtering, search, and actions
 */

class ServiceListView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.services = [];
    this.filteredServices = [];
    this.searchQuery = '';
    this.sortBy = 'date'; // date, amount
    this.sortOrder = 'desc'; // asc, desc
    this.filterServiceSource = 'all'; // all, emisora, calle, uber, freenow, otro
    this.filterTaxista = 'all'; // all, or taxista ID
    this.filterDateFrom = ''; // YYYY-MM-DD
    this.filterDateTo = ''; // YYYY-MM-DD
  }

  /**
   * Render the service list view
   */
  async render() {
    const container = document.getElementById('services-content');
    if (!container) return;

    // Load services
    await this.loadServices();

    // Get current user to check if patron
    const user = this.authAdapter.getCurrentUser();
    const isPatron = user && user.rol === 'PATRON';

    // Get taxistas list if patron
    let taxistas = [];
    if (isPatron) {
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      taxistas = users.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
    }

    // Build UI
    container.innerHTML = `
      <!-- Search and Filter Bar -->
      <div class="search-filter-bar">
        <ion-searchbar 
          id="service-search" 
          placeholder="Buscar servicios..."
          debounce="300">
        </ion-searchbar>
        
        <div class="filter-controls">
          <!-- Source Filter -->
          <ion-segment id="source-filter" value="all" scrollable>
            <ion-segment-button value="all">
              <ion-label>Todos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="emisora">
              <ion-label>📻 Emisora</ion-label>
            </ion-segment-button>
            <ion-segment-button value="calle">
              <ion-label>🚶 Calle</ion-label>
            </ion-segment-button>
            <ion-segment-button value="uber">
              <ion-label>🚗 Uber</ion-label>
            </ion-segment-button>
            <ion-segment-button value="freenow">
              <ion-label>🚕 FreeNow</ion-label>
            </ion-segment-button>
            <ion-segment-button value="otro">
              <ion-label>📋 Otro</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <!-- Taxista Filter (only for patrons) -->
          ${isPatron && taxistas.length > 0 ? `
            <ion-item style="margin-top: 8px;">
              <ion-label>Taxista</ion-label>
              <ion-select id="taxista-filter" value="all" interface="popover">
                <ion-select-option value="all">Todos los taxistas</ion-select-option>
                ${taxistas.map(t => `
                  <ion-select-option value="${t.id}">${t.nombre} (${t.numeroTaxista})</ion-select-option>
                `).join('')}
              </ion-select>
            </ion-item>
          ` : ''}
          
          <!-- Date Range Filter -->
          <ion-grid style="margin-top: 8px;">
            <ion-row>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Desde</ion-label>
                  <ion-input 
                    type="date" 
                    id="date-from-filter"
                    placeholder="Fecha inicio">
                  </ion-input>
                </ion-item>
              </ion-col>
              <ion-col size="6">
                <ion-item>
                  <ion-label position="stacked">Hasta</ion-label>
                  <ion-input 
                    type="date" 
                    id="date-to-filter"
                    placeholder="Fecha fin">
                  </ion-input>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <!-- Action Buttons -->
          <div class="sort-controls" style="margin-top: 8px;">
            <ion-button id="sort-date-btn" fill="outline" size="small">
              <ion-icon name="calendar" slot="start"></ion-icon>
              Fecha
            </ion-button>
            <ion-button id="sort-amount-btn" fill="outline" size="small">
              <ion-icon name="cash" slot="start"></ion-icon>
              Importe
            </ion-button>
            <ion-button id="clear-filters-btn" fill="clear" size="small" color="medium">
              <ion-icon name="close-circle" slot="start"></ion-icon>
              Limpiar
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div class="stats-summary">
        <ion-card>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value" id="total-services">0</div>
                    <div class="stat-label">Servicios</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value" id="total-income">€0</div>
                    <div class="stat-label">Total</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value" id="avg-service">€0</div>
                    <div class="stat-label">Promedio</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Service List -->
      <ion-list id="service-list">
        ${this.renderServiceItems()}
      </ion-list>

      <!-- Empty State -->
      <div id="empty-state" style="display: none; text-align: center; padding: 40px 20px;">
        <ion-icon name="car-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
        <h3>No hay servicios</h3>
        <p style="color: var(--ion-color-medium);">Añade tu primer servicio usando el botón +</p>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();

    // Update statistics
    this.updateStatistics();

    // Show empty state if needed
    this.toggleEmptyState();
  }

  /**
   * Load services from adapter
   */
  async loadServices() {
    try {
      this.services = await this.reconcileAdapter.getServices();
      this.filteredServices = [...this.services];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading services:', error);
      ToastManager.showError('Error al cargar servicios');
    }
  }

  /**
   * Render service items
   */
  renderServiceItems() {
    if (this.filteredServices.length === 0) {
      return '';
    }

    return this.filteredServices.map(service => {
      const sourceIcons = {
        emisora: '📻',
        calle: '🚶',
        uber: '🚗',
        freenow: '🚕',
        otro: '📋'
      };
      const paymentIcons = {
        efectivo: '💵',
        tarjeta: '💳',
        transferencia: '🏦',
        app: '📱'
      };

      const date = new Date(service.date + ' ' + (service.time || '00:00'));
      const formattedDate = date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short' 
      });
      const formattedTime = service.time || '';

      const sourceIcon = sourceIcons[service.serviceSource] || '🚕';
      const paymentIcon = paymentIcons[service.paymentMethod] || '💵';

      return `
        <ion-item button class="service-item" data-service-id="${service.id}">
          <div class="service-icon" slot="start" style="font-size: 28px;">${sourceIcon}</div>
          <ion-label>
            <h2 style="font-weight: 600; color: #1f2937;">${service.origin} → ${service.destination}</h2>
            <p style="color: #6b7280; font-size: 13px;">${formattedDate} ${formattedTime} • ${paymentIcon} ${service.paymentMethod}</p>
            ${service.clientName ? `<p style="font-size: 11px; color: #9ca3af;">Cliente: ${service.clientName}</p>` : ''}
            ${service.commission > 0 || service.tip > 0 ? `
              <p style="font-size: 11px; color: #6b7280;">
                ${service.amount !== service.netAmount ? `Base: €${service.amount.toFixed(2)}` : ''}
                ${service.commission > 0 ? ` • -€${service.commission.toFixed(2)} comisión` : ''}
                ${service.tip > 0 ? ` • +€${service.tip.toFixed(2)} propina` : ''}
              </p>
            ` : ''}
          </ion-label>
          <div slot="end" class="service-actions" style="display: flex; flex-direction: column; align-items: flex-end; min-width: 100px;">
            <div style="background: #10b981; color: white; padding: 6px 12px; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
              <div style="font-size: 16px; font-weight: bold; text-align: center;">€${service.netAmount.toFixed(2)}</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <ion-button fill="clear" size="small" class="edit-service-btn" data-service-id="${service.id}" style="--color: #3b82f6; margin: 0;">
                <ion-icon name="create" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="small" color="danger" class="delete-service-btn" data-service-id="${service.id}" style="margin: 0;">
                <ion-icon name="trash" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>
        </ion-item>
      `;
    }).join('');
  }

  /**
   * Get payment type icon
   */
  getPaymentIcon(paymentType) {
    const icons = {
      cash: '💵',
      card: '💳',
      app: '📱'
    };
    return icons[paymentType] || '💵';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    const searchBar = document.getElementById('service-search');
    if (searchBar) {
      searchBar.addEventListener('ionInput', (e) => {
        this.searchQuery = e.detail.value.toLowerCase();
        this.applyFilters();
        this.updateList();
      });
    }

    // Source filter
    const sourceFilter = document.getElementById('source-filter');
    if (sourceFilter) {
      sourceFilter.addEventListener('ionChange', (e) => {
        this.filterServiceSource = e.detail.value;
        this.applyFilters();
        this.updateList();
      });
    }

    // Taxista filter
    const taxistaFilter = document.getElementById('taxista-filter');
    if (taxistaFilter) {
      taxistaFilter.addEventListener('ionChange', (e) => {
        this.filterTaxista = e.detail.value;
        this.applyFilters();
        this.updateList();
      });
    }

    // Date filters
    const dateFromFilter = document.getElementById('date-from-filter');
    if (dateFromFilter) {
      dateFromFilter.addEventListener('ionChange', (e) => {
        this.filterDateFrom = e.detail.value;
        this.applyFilters();
        this.updateList();
      });
    }

    const dateToFilter = document.getElementById('date-to-filter');
    if (dateToFilter) {
      dateToFilter.addEventListener('ionChange', (e) => {
        this.filterDateTo = e.detail.value;
        this.applyFilters();
        this.updateList();
      });
    }

    // Clear filters button
    document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Sort buttons
    document.getElementById('sort-date-btn')?.addEventListener('click', () => {
      this.toggleSort('date');
    });

    document.getElementById('sort-amount-btn')?.addEventListener('click', () => {
      this.toggleSort('amount');
    });

    // Edit and delete buttons
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const serviceId = btn.getAttribute('data-service-id');
        this.handleEdit(serviceId);
      });
    });

    document.querySelectorAll('.delete-service-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const serviceId = btn.getAttribute('data-service-id');
        this.handleDelete(serviceId);
      });
    });

    // Service item click (view details)
    document.querySelectorAll('.service-item').forEach(item => {
      item.addEventListener('click', () => {
        const serviceId = item.getAttribute('data-service-id');
        this.handleViewDetails(serviceId);
      });
    });
  }

  /**
   * Apply filters and sorting
   */
  applyFilters() {
    let filtered = [...this.services];

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(service => {
        const searchText = `${service.origin} ${service.destination} ${service.clientName || ''} ${service.serviceSource}`.toLowerCase();
        return searchText.includes(this.searchQuery);
      });
    }

    // Apply source filter
    if (this.filterServiceSource !== 'all') {
      filtered = filtered.filter(service => service.serviceSource === this.filterServiceSource);
    }

    // Apply taxista filter
    if (this.filterTaxista !== 'all') {
      filtered = filtered.filter(service => service.userId === this.filterTaxista);
    }

    // Apply date range filter
    if (this.filterDateFrom) {
      filtered = filtered.filter(service => service.date >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      filtered = filtered.filter(service => service.date <= this.filterDateTo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (this.sortBy === 'date') {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        comparison = dateA - dateB;
      } else if (this.sortBy === 'amount') {
        comparison = parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredServices = filtered;
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    // Reset filter values
    this.searchQuery = '';
    this.filterServiceSource = 'all';
    this.filterTaxista = 'all';
    this.filterDateFrom = '';
    this.filterDateTo = '';

    // Reset UI elements
    const searchBar = document.getElementById('service-search');
    if (searchBar) searchBar.value = '';

    const sourceFilter = document.getElementById('source-filter');
    if (sourceFilter) sourceFilter.value = 'all';

    const taxistaFilter = document.getElementById('taxista-filter');
    if (taxistaFilter) taxistaFilter.value = 'all';

    const dateFromFilter = document.getElementById('date-from-filter');
    if (dateFromFilter) dateFromFilter.value = '';

    const dateToFilter = document.getElementById('date-to-filter');
    if (dateToFilter) dateToFilter.value = '';

    // Reapply filters and update
    this.applyFilters();
    this.updateList();

    ToastManager.showInfo('Filtros limpiados');
  }

  /**
   * Toggle sort order
   */
  toggleSort(field) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }

    this.applyFilters();
    this.updateList();
  }

  /**
   * Update the service list display
   */
  updateList() {
    const listContainer = document.getElementById('service-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderServiceItems();
      this.attachEventListeners();
    }

    this.updateStatistics();
    this.toggleEmptyState();
  }

  /**
   * Update statistics
   */
  updateStatistics() {
    const totalServices = this.filteredServices.length;
    const totalIncome = this.filteredServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const avgService = totalServices > 0 ? totalIncome / totalServices : 0;

    document.getElementById('total-services').textContent = totalServices;
    document.getElementById('total-income').textContent = '€' + totalIncome.toFixed(2);
    document.getElementById('avg-service').textContent = '€' + avgService.toFixed(2);
  }

  /**
   * Toggle empty state visibility
   */
  toggleEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const serviceList = document.getElementById('service-list');
    
    if (this.filteredServices.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (serviceList) serviceList.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (serviceList) serviceList.style.display = 'block';
    }
  }

  /**
   * Handle edit service
   */
  async handleEdit(serviceId) {
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    // Dispatch event to open edit modal
    window.dispatchEvent(new CustomEvent('edit-service', { detail: service }));
  }

  /**
   * Handle delete service
   */
  async handleDelete(serviceId) {
    await ActionSheetManager.showConfirmation(
      'Eliminar Servicio',
      '¿Estás seguro de que deseas eliminar este servicio?',
      async () => {
        try {
          await LoadingManager.show('Eliminando...');
          await this.reconcileAdapter.deleteService(serviceId);
          await LoadingManager.hide();
          
          ToastManager.showSuccess('Servicio eliminado');
          await this.loadServices();
          this.updateList();
        } catch (error) {
          await LoadingManager.hide();
          ToastManager.showError('Error al eliminar servicio');
        }
      }
    );
  }

  /**
   * Handle view service details
   */
  handleViewDetails(serviceId) {
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    // Dispatch event to show details
    window.dispatchEvent(new CustomEvent('view-service-details', { detail: service }));
  }

  /**
   * Refresh the service list (for pull-to-refresh)
   */
  async refresh() {
    await this.loadServices();
    this.updateList();
  }
}

// Export for use in other modules
window.ServiceListView = ServiceListView;

console.log('ServiceListView component loaded');
