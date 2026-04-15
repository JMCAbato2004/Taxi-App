/**
 * ExpenseListView Component
 * Displays list of expenses with role-based filtering, search, and actions
 */

class ExpenseListView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.expenses = [];
    this.filteredExpenses = [];
    this.searchQuery = '';
    this.sortBy = 'date'; // date, amount
    this.sortOrder = 'desc'; // asc, desc
    this.filterCategory = 'all'; // all, fuel, maintenance, insurance, other
  }

  /**
   * Render the expense list view
   */
  async render() {
    const container = document.getElementById('expenses-content');
    if (!container) return;

    // Load expenses
    await this.loadExpenses();

    // Build UI
    container.innerHTML = `
      <!-- Search and Filter Bar -->
      <div class="search-filter-bar">
        <ion-searchbar 
          id="expense-search" 
          placeholder="Buscar gastos..."
          debounce="300">
        </ion-searchbar>
        
        <div class="filter-controls">
          <ion-segment id="category-filter" value="all" scrollable>
            <ion-segment-button value="all">
              <ion-label>Todos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="fuel">
              <ion-label>⛽ Combustible</ion-label>
            </ion-segment-button>
            <ion-segment-button value="other">
              <ion-label>📋 Otro</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <div class="sort-controls">
            <ion-button id="sort-date-btn" fill="outline" size="small">
              <ion-icon name="calendar" slot="start"></ion-icon>
              Fecha
            </ion-button>
            <ion-button id="sort-amount-btn" fill="outline" size="small">
              <ion-icon name="cash" slot="start"></ion-icon>
              Importe
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
                    <div class="stat-value" id="total-expenses-count">0</div>
                    <div class="stat-label">Gastos</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value" id="total-expenses-amount">€0</div>
                    <div class="stat-label">Total</div>
                  </div>
                </ion-col>
                <ion-col size="4">
                  <div class="stat-item">
                    <div class="stat-value" id="avg-expense">€0</div>
                    <div class="stat-label">Promedio</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Category Breakdown -->
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>Desglose por Categoría</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content id="category-breakdown">
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Expense List -->
      <ion-list id="expense-list">
        ${this.renderExpenseItems()}
      </ion-list>

      <!-- Empty State -->
      <div id="empty-state" style="display: none; text-align: center; padding: 40px 20px;">
        <ion-icon name="wallet-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
        <h3>No hay gastos</h3>
        <p style="color: var(--ion-color-medium);">Añade tu primer gasto usando el botón +</p>
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
   * Load expenses from adapter
   */
  async loadExpenses() {
    try {
      this.expenses = await this.reconcileAdapter.getExpenses();
      this.filteredExpenses = [...this.expenses];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading expenses:', error);
      ToastManager.showError('Error al cargar gastos');
    }
  }

  /**
   * Render expense items
   */
  renderExpenseItems() {
    if (this.filteredExpenses.length === 0) {
      return '';
    }

    // Get current user to check if patron
    const user = this.authAdapter.getCurrentUser();
    const isPatron = user && user.rol === 'PATRON';
    
    // Get taxistas map if patron
    let taxistasMap = {};
    if (isPatron) {
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      users.forEach(u => {
        if (u.rol === 'TAXISTA') {
          taxistasMap[u.id] = u;
        }
      });
    }

    return this.filteredExpenses.map(expense => {
      const categoryIcon = this.getCategoryIcon(expense.category);
      const date = new Date(expense.date);
      const formattedDate = date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short' 
      });
      
      // Get taxista name if patron
      let taxistaInfo = '';
      if (isPatron && expense.userId && taxistasMap[expense.userId]) {
        const taxista = taxistasMap[expense.userId];
        taxistaInfo = `<p style="font-size: 11px; color: var(--ion-color-primary); font-weight: 600;">🚕 ${taxista.nombre}${taxista.numeroTaxista ? ` (${taxista.numeroTaxista})` : ''}</p>`;
      }

      return `
        <ion-item button class="expense-item" data-expense-id="${expense.id}">
          <div class="expense-icon" slot="start">${categoryIcon}</div>
          <ion-label>
            <h2>${expense.concept || expense.category}</h2>
            <p>${formattedDate} • €${parseFloat(expense.amount).toFixed(2)}</p>
            ${taxistaInfo}
            ${expense.comments ? `<p style="font-size: 11px; color: var(--ion-color-medium); font-style: italic;">${expense.comments}</p>` : ''}
            ${expense.paidBy ? `<p style="font-size: 11px; color: var(--ion-color-medium);">Pagado por: <strong>${expense.paidBy === 'patron' ? 'Patrón' : 'Taxista'}</strong></p>` : ''}
          </ion-label>
          <div slot="end" class="expense-actions">
            <ion-button fill="clear" class="edit-expense-btn" data-expense-id="${expense.id}">
              <ion-icon name="create" slot="icon-only"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="danger" class="delete-expense-btn" data-expense-id="${expense.id}">
              <ion-icon name="trash" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </ion-item>
      `;
    }).join('');
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category) {
    const icons = {
      fuel: '⛽',
      other: '📋'
    };
    return icons[category] || '📋';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    const searchBar = document.getElementById('expense-search');
    if (searchBar) {
      searchBar.addEventListener('ionInput', (e) => {
        this.searchQuery = e.detail.value.toLowerCase();
        this.applyFilters();
        this.updateList();
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('ionChange', (e) => {
        this.filterCategory = e.detail.value;
        this.applyFilters();
        this.updateList();
      });
    }

    // Sort buttons
    document.getElementById('sort-date-btn')?.addEventListener('click', () => {
      this.toggleSort('date');
    });

    document.getElementById('sort-amount-btn')?.addEventListener('click', () => {
      this.toggleSort('amount');
    });

    // Edit and delete buttons
    document.querySelectorAll('.edit-expense-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expenseId = btn.getAttribute('data-expense-id');
        this.handleEdit(expenseId);
      });
    });

    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expenseId = btn.getAttribute('data-expense-id');
        this.handleDelete(expenseId);
      });
    });

    // Expense item click (view details)
    document.querySelectorAll('.expense-item').forEach(item => {
      item.addEventListener('click', () => {
        const expenseId = item.getAttribute('data-expense-id');
        this.handleViewDetails(expenseId);
      });
    });
  }

  /**
   * Apply filters and sorting
   */
  applyFilters() {
    let filtered = [...this.expenses];

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(expense => {
        const searchText = `${expense.concept} ${expense.amount} ${expense.category}`.toLowerCase();
        return searchText.includes(this.searchQuery);
      });
    }

    // Apply category filter
    if (this.filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === this.filterCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (this.sortBy === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        comparison = dateA - dateB;
      } else if (this.sortBy === 'amount') {
        comparison = parseFloat(a.amount) - parseFloat(b.amount);
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredExpenses = filtered;
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
   * Update the expense list display
   */
  updateList() {
    const listContainer = document.getElementById('expense-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderExpenseItems();
      this.attachEventListeners();
    }

    this.updateStatistics();
    this.toggleEmptyState();
  }

  /**
   * Update statistics
   */
  updateStatistics() {
    const totalCount = this.filteredExpenses.length;
    const totalAmount = this.filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const avgExpense = totalCount > 0 ? totalAmount / totalCount : 0;

    document.getElementById('total-expenses-count').textContent = totalCount;
    document.getElementById('total-expenses-amount').textContent = '€' + totalAmount.toFixed(2);
    document.getElementById('avg-expense').textContent = '€' + avgExpense.toFixed(2);

    // Update category breakdown
    this.updateCategoryBreakdown();
  }

  /**
   * Update category breakdown
   */
  updateCategoryBreakdown() {
    const categories = {
      fuel: { label: '⛽ Combustible', amount: 0 },
      other: { label: '📋 Otro', amount: 0 }
    };

    this.filteredExpenses.forEach(expense => {
      if (categories[expense.category]) {
        categories[expense.category].amount += parseFloat(expense.amount || 0);
      }
    });

    const breakdownHtml = Object.entries(categories)
      .filter(([_, data]) => data.amount > 0)
      .map(([category, data]) => `
        <div class="category-item">
          <span>${data.label}</span>
          <span class="category-amount">€${data.amount.toFixed(2)}</span>
        </div>
      `).join('');

    const container = document.getElementById('category-breakdown');
    if (container) {
      container.innerHTML = breakdownHtml || '<p style="color: var(--ion-color-medium);">No hay datos</p>';
    }
  }

  /**
   * Toggle empty state visibility
   */
  toggleEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const expenseList = document.getElementById('expense-list');
    
    if (this.filteredExpenses.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (expenseList) expenseList.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (expenseList) expenseList.style.display = 'block';
    }
  }

  /**
   * Handle edit expense
   */
  async handleEdit(expenseId) {
    const expense = this.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Dispatch event to open edit modal
    window.dispatchEvent(new CustomEvent('edit-expense', { detail: expense }));
  }

  /**
   * Handle delete expense
   */
  async handleDelete(expenseId) {
    await ActionSheetManager.showConfirmation(
      'Eliminar Gasto',
      '¿Estás seguro de que deseas eliminar este gasto?',
      async () => {
        try {
          await LoadingManager.show('Eliminando...');
          await this.reconcileAdapter.deleteExpense(expenseId);
          await LoadingManager.hide();
          
          ToastManager.showSuccess('Gasto eliminado');
          await this.loadExpenses();
          this.updateList();
        } catch (error) {
          await LoadingManager.hide();
          ToastManager.showError('Error al eliminar gasto');
        }
      }
    );
  }

  /**
   * Handle view expense details
   */
  handleViewDetails(expenseId) {
    const expense = this.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Dispatch event to show details
    window.dispatchEvent(new CustomEvent('view-expense-details', { detail: expense }));
  }

  /**
   * Refresh the expense list (for pull-to-refresh)
   */
  async refresh() {
    await this.loadExpenses();
    this.updateList();
  }
}

// Export for use in other modules
window.ExpenseListView = ExpenseListView;

console.log('ExpenseListView component loaded');
