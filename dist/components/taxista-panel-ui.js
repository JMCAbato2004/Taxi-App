// Taxista Panel UI Component
// HTML/CSS rendering component for the taxista personal dashboard
// Requirements: 4.1, 4.5, 4.3
import { TaxistaPanel } from './taxista-panel';
/**
 * Taxista Panel UI Component
 */
export class TaxistaPanelUI {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.theme = {
            primaryColor: '#059669',
            secondaryColor: '#047857',
            backgroundColor: '#f5f5f5',
            textColor: '#1f2937',
            borderRadius: '8px',
            ...config.theme
        };
        this.panel = new TaxistaPanel(config);
        this.initialize();
    }
    /**
     * Initialize the UI component
     */
    initialize() {
        this.container = document.getElementById(this.config.containerId);
        if (!this.container) {
            throw new Error(`Container with ID '${this.config.containerId}' not found`);
        }
        this.render();
        this.attachEventListeners();
        // Auto-refresh data every 60 seconds
        setInterval(() => {
            this.refreshData();
        }, 60000);
    }
    /**
     * Render the complete taxista panel UI
     */
    render() {
        if (!this.container)
            return;
        this.container.innerHTML = `
      <div class="taxista-panel" style="${this.getContainerStyles()}">
        ${this.renderHeader()}
        ${this.renderPersonalSummary()}
        ${this.renderTabs()}
        <div class="tab-content">
          ${this.renderDashboardTab()}
          ${this.renderHistoryTab()}
          ${this.renderServicesTab()}
          ${this.renderExpensesTab()}
          ${this.renderProfileTab()}
          ${this.renderNotificationsTab()}
        </div>
      </div>
      ${this.renderStyles()}
    `;
        // Show the first tab by default
        this.showTab('dashboard');
    }
    /**
     * Render the header section
     */
    renderHeader() {
        const currentUser = this.panel.getCurrentUser();
        const profile = this.panel.getPersonalProfile();
        const unreadCount = this.panel.getUnreadNotificationCount();
        const associationStatus = this.panel.getAssociationStatus();
        return `
      <div class="panel-header">
        <div class="header-content">
          <div class="header-info">
            <h1 class="panel-title">
              <span class="icon">🚖</span>
              Panel Personal
            </h1>
            <div class="taxista-info">
              <p class="taxista-name">${currentUser?.nombre || 'Cargando...'}</p>
              <p class="taxista-number">Taxista ${currentUser?.numeroTaxista || ''}</p>
              ${associationStatus.isAssociated ? `
                <p class="association-status">
                  <span class="icon">🤝</span>
                  Asociado con ${associationStatus.currentPatron?.nombre || 'Patrón'}
                </p>
              ` : `
                <p class="association-status independent">
                  <span class="icon">🆓</span>
                  Cuenta Independiente
                </p>
              `}
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" onclick="taxistaPanelUI.refreshData()">
              <span class="icon">🔄</span>
              Actualizar
            </button>
            <button class="btn btn-primary notification-btn" onclick="taxistaPanelUI.showTab('notifications')">
              <span class="icon">🔔</span>
              Notificaciones
              ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}
            </button>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Render the personal summary section
     */
    renderPersonalSummary() {
        const stats = this.panel.getPersonalStats();
        const profile = this.panel.getPersonalProfile();
        return `
      <div class="personal-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon">🚗</div>
            <div class="card-content">
              <h3>${stats?.totalServices || 0}</h3>
              <p>Servicios Totales</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <h3>€${stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
              <p>Ingresos Totales</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>€${stats?.averageServiceValue?.toFixed(2) || '0.00'}</h3>
              <p>Promedio por Servicio</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">📈</div>
            <div class="card-content">
              <h3>${stats?.monthlyServices || 0}</h3>
              <p>Servicios Este Mes</p>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Render the tab navigation
     */
    renderTabs() {
        return `
      <div class="tab-navigation">
        <button class="tab-btn active" data-tab="dashboard" onclick="taxistaPanelUI.showTab('dashboard')">
          <span class="icon">📊</span>
          Dashboard
        </button>
        <button class="tab-btn" data-tab="history" onclick="taxistaPanelUI.showTab('history')">
          <span class="icon">📋</span>
          Historial
        </button>
        <button class="tab-btn" data-tab="services" onclick="taxistaPanelUI.showTab('services')">
          <span class="icon">🚗</span>
          Servicios
        </button>
        <button class="tab-btn" data-tab="expenses" onclick="taxistaPanelUI.showTab('expenses')">
          <span class="icon">💸</span>
          Gastos
        </button>
        <button class="tab-btn" data-tab="profile" onclick="taxistaPanelUI.showTab('profile')">
          <span class="icon">👤</span>
          Perfil
        </button>
        <button class="tab-btn" data-tab="notifications" onclick="taxistaPanelUI.showTab('notifications')">
          <span class="icon">🔔</span>
          Notificaciones
        </button>
      </div>
    `;
    }
    /**
     * Render the dashboard tab
     */
    renderDashboardTab() {
        const stats = this.panel.getPersonalStats();
        const profile = this.panel.getPersonalProfile();
        return `
      <div class="tab-panel" id="tab-dashboard">
        <div class="tab-header">
          <h2>Dashboard Personal</h2>
          <button class="btn btn-secondary" onclick="taxistaPanelUI.exportData()">
            <span class="icon">📥</span>
            Exportar Datos
          </button>
        </div>
        
        <div class="dashboard-content">
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Rendimiento Mensual</h4>
              <div class="stat-value">
                <span class="big-number">€${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                <span class="growth ${(stats?.currentMonthGrowth || 0) >= 0 ? 'positive' : 'negative'}">
                  ${(stats?.currentMonthGrowth || 0) >= 0 ? '↗️' : '↘️'} 
                  ${Math.abs(stats?.currentMonthGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div class="stat-card">
              <h4>Estado de Cuenta</h4>
              <div class="account-status ${profile?.accountStatus || 'active'}">
                <span class="status-icon">
                  ${profile?.accountStatus === 'active' ? '✅' : '❌'}
                </span>
                <span class="status-text">
                  ${profile?.accountStatus === 'active' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p class="member-since">
                Miembro desde ${profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div class="recent-activity">
            <h3>Actividad Reciente</h3>
            ${stats?.recentActivity && stats.recentActivity.length > 0 ? `
              <div class="activity-list">
                ${stats.recentActivity.slice(0, 5).map(activity => `
                  <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                      ${activity.type === 'service' ? '🚗' : '💸'}
                    </div>
                    <div class="activity-content">
                      <p class="activity-description">${activity.description}</p>
                      <p class="activity-date">${new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div class="activity-amount ${activity.type}">
                      ${activity.type === 'service' ? '+' : '-'}€${activity.amount.toFixed(2)}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>No hay actividad reciente</p>
              </div>
            `}
          </div>

          <div class="top-services">
            <h3>Tipos de Servicio Principales</h3>
            ${stats?.topServiceTypes && stats.topServiceTypes.length > 0 ? `
              <div class="service-types-list">
                ${stats.topServiceTypes.map((serviceType, index) => `
                  <div class="service-type-item">
                    <div class="service-rank">#${index + 1}</div>
                    <div class="service-info">
                      <h4>${serviceType.type}</h4>
                      <p>${serviceType.count} servicios</p>
                    </div>
                    <div class="service-revenue">
                      €${serviceType.revenue.toFixed(2)}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-icon">🚗</div>
                <p>No hay datos de servicios</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Render the history tab
     */
    renderHistoryTab() {
        const services = this.panel.getPersonalServices();
        const expenses = this.panel.getPersonalExpenses();
        const currentFilters = this.panel.getCurrentFilters();
        // Combine and sort all history items
        const allHistory = [
            ...services.map(s => ({
                id: s.id,
                type: 'service',
                date: new Date(s.date || ''),
                description: s.description || `Servicio ${s.serviceType || 'General'}`,
                amount: s.totalAmount || 0,
                details: s
            })),
            ...expenses.map(e => ({
                id: e.id,
                type: 'expense',
                date: new Date(e.date || ''),
                description: e.description || `Gasto ${e.category || 'General'}`,
                amount: e.amount || 0,
                details: e
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());
        return `
      <div class="tab-panel" id="tab-history" style="display: none;">
        <div class="tab-header">
          <h2>Historial Personal</h2>
        </div>
        
        <div class="history-filters">
          <div class="filter-form">
            <div class="filter-row">
              <div class="filter-group">
                <label for="dateFrom">Desde:</label>
                <input type="date" id="dateFrom" class="form-control" 
                       value="${currentFilters.dateFrom ? currentFilters.dateFrom.toISOString().split('T')[0] : ''}">
              </div>
              <div class="filter-group">
                <label for="dateTo">Hasta:</label>
                <input type="date" id="dateTo" class="form-control"
                       value="${currentFilters.dateTo ? currentFilters.dateTo.toISOString().split('T')[0] : ''}">
              </div>
              <div class="filter-group">
                <label for="historyType">Tipo:</label>
                <select id="historyType" class="form-control">
                  <option value="all" ${currentFilters.type === 'all' ? 'selected' : ''}>Todos</option>
                  <option value="services" ${currentFilters.type === 'services' ? 'selected' : ''}>Servicios</option>
                  <option value="expenses" ${currentFilters.type === 'expenses' ? 'selected' : ''}>Gastos</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="sortBy">Ordenar por:</label>
                <select id="sortBy" class="form-control">
                  <option value="date" ${currentFilters.sortBy === 'date' ? 'selected' : ''}>Fecha</option>
                  <option value="amount" ${currentFilters.sortBy === 'amount' ? 'selected' : ''}>Importe</option>
                  <option value="type" ${currentFilters.sortBy === 'type' ? 'selected' : ''}>Tipo</option>
                </select>
              </div>
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" onclick="taxistaPanelUI.applyHistoryFilters()">
                <span class="icon">🔍</span>
                Filtrar
              </button>
              <button class="btn btn-secondary" onclick="taxistaPanelUI.clearHistoryFilters()">
                <span class="icon">🗑️</span>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div class="history-results">
          <h3>Historial (${allHistory.length} elementos)</h3>
          ${allHistory.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h3>No hay elementos en el historial</h3>
              <p>Comienza registrando servicios y gastos para ver tu historial.</p>
            </div>
          ` : `
            <div class="history-list">
              ${allHistory.map(item => this.renderHistoryItem(item)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
    }
    /**
     * Render individual history item
     */
    renderHistoryItem(item) {
        return `
      <div class="history-item ${item.type}">
        <div class="history-icon">
          ${item.type === 'service' ? '🚗' : '💸'}
        </div>
        <div class="history-content">
          <h4>${item.description}</h4>
          <p class="history-date">${item.date.toLocaleDateString()} ${item.date.toLocaleTimeString()}</p>
          ${item.type === 'service' ? `
            <p class="history-details">
              ${item.details.origin ? `${item.details.origin} → ${item.details.destination}` : ''}
              ${item.details.distance ? `• ${item.details.distance} km` : ''}
            </p>
          ` : `
            <p class="history-details">
              ${item.details.category || 'Gasto General'}
              ${item.details.vendor ? `• ${item.details.vendor}` : ''}
            </p>
          `}
        </div>
        <div class="history-amount ${item.type}">
          ${item.type === 'service' ? '+' : '-'}€${item.amount.toFixed(2)}
        </div>
      </div>
    `;
    }
    /**
     * Render the services tab
     */
    renderServicesTab() {
        const services = this.panel.getPersonalServices();
        return `
      <div class="tab-panel" id="tab-services" style="display: none;">
        <div class="tab-header">
          <h2>Mis Servicios</h2>
          <button class="btn btn-primary" onclick="taxistaPanelUI.showCreateServiceForm()">
            <span class="icon">➕</span>
            Nuevo Servicio
          </button>
        </div>
        
        <div id="create-service-form" class="create-form" style="display: none;">
          <h3>Registrar Nuevo Servicio</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="serviceType">Tipo de Servicio:</label>
              <select id="serviceType" class="form-control">
                <option value="Carrera Urbana">Carrera Urbana</option>
                <option value="Carrera Aeropuerto">Carrera Aeropuerto</option>
                <option value="Servicio Especial">Servicio Especial</option>
                <option value="Carrera Nocturna">Carrera Nocturna</option>
              </select>
            </div>
            <div class="form-group">
              <label for="serviceAmount">Importe (€):</label>
              <input type="number" id="serviceAmount" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="serviceOrigin">Origen:</label>
              <input type="text" id="serviceOrigin" class="form-control">
            </div>
            <div class="form-group">
              <label for="serviceDestination">Destino:</label>
              <input type="text" id="serviceDestination" class="form-control">
            </div>
            <div class="form-group">
              <label for="serviceDistance">Distancia (km):</label>
              <input type="number" id="serviceDistance" class="form-control" step="0.1" min="0">
            </div>
            <div class="form-group">
              <label for="serviceDuration">Duración (min):</label>
              <input type="number" id="serviceDuration" class="form-control" min="0">
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="taxistaPanelUI.createService()">
              <span class="icon">💾</span>
              Guardar Servicio
            </button>
            <button class="btn btn-secondary" onclick="taxistaPanelUI.hideCreateServiceForm()">
              <span class="icon">❌</span>
              Cancelar
            </button>
          </div>
        </div>

        <div class="services-list">
          ${services.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🚗</div>
              <h3>No tienes servicios registrados</h3>
              <p>Comienza registrando tus servicios para llevar un control de tus ingresos.</p>
              <button class="btn btn-primary" onclick="taxistaPanelUI.showCreateServiceForm()">
                Registrar Primer Servicio
              </button>
            </div>
          ` : `
            <div class="services-grid">
              ${services.map(service => this.renderServiceCard(service)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
    }
    /**
     * Render individual service card
     */
    renderServiceCard(service) {
        return `
      <div class="service-card">
        <div class="card-header">
          <h4>${service.serviceType || 'Servicio General'}</h4>
          <span class="service-amount">€${(service.totalAmount || 0).toFixed(2)}</span>
        </div>
        <div class="card-body">
          <p class="service-date">${new Date(service.date || '').toLocaleDateString()}</p>
          ${service.origin && service.destination ? `
            <p class="service-route">${service.origin} → ${service.destination}</p>
          ` : ''}
          ${service.distance ? `
            <p class="service-distance">📏 ${service.distance} km</p>
          ` : ''}
          ${service.duration ? `
            <p class="service-duration">⏱️ ${service.duration} min</p>
          ` : ''}
          ${service.description ? `
            <p class="service-description">${service.description}</p>
          ` : ''}
        </div>
      </div>
    `;
    }
    /**
     * Render the expenses tab
     */
    renderExpensesTab() {
        const expenses = this.panel.getPersonalExpenses();
        return `
      <div class="tab-panel" id="tab-expenses" style="display: none;">
        <div class="tab-header">
          <h2>Mis Gastos</h2>
          <button class="btn btn-primary" onclick="taxistaPanelUI.showCreateExpenseForm()">
            <span class="icon">➕</span>
            Nuevo Gasto
          </button>
        </div>
        
        <div id="create-expense-form" class="create-form" style="display: none;">
          <h3>Registrar Nuevo Gasto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="expenseCategory">Categoría:</label>
              <select id="expenseCategory" class="form-control">
                <option value="Combustible">Combustible</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Seguro">Seguro</option>
                <option value="Peajes">Peajes</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div class="form-group">
              <label for="expenseAmount">Importe (€):</label>
              <input type="number" id="expenseAmount" class="form-control" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="expenseVendor">Proveedor:</label>
              <input type="text" id="expenseVendor" class="form-control">
            </div>
            <div class="form-group">
              <label for="expenseDescription">Descripción:</label>
              <textarea id="expenseDescription" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="taxistaPanelUI.createExpense()">
              <span class="icon">💾</span>
              Guardar Gasto
            </button>
            <button class="btn btn-secondary" onclick="taxistaPanelUI.hideCreateExpenseForm()">
              <span class="icon">❌</span>
              Cancelar
            </button>
          </div>
        </div>

        <div class="expenses-list">
          ${expenses.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">💸</div>
              <h3>No tienes gastos registrados</h3>
              <p>Registra tus gastos para llevar un control completo de tu actividad.</p>
              <button class="btn btn-primary" onclick="taxistaPanelUI.showCreateExpenseForm()">
                Registrar Primer Gasto
              </button>
            </div>
          ` : `
            <div class="expenses-grid">
              ${expenses.map(expense => this.renderExpenseCard(expense)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
    }
    /**
     * Render individual expense card
     */
    renderExpenseCard(expense) {
        return `
      <div class="expense-card">
        <div class="card-header">
          <h4>${expense.category || 'Gasto General'}</h4>
          <span class="expense-amount">-€${(expense.amount || 0).toFixed(2)}</span>
        </div>
        <div class="card-body">
          <p class="expense-date">${new Date(expense.date || '').toLocaleDateString()}</p>
          ${expense.vendor ? `
            <p class="expense-vendor">🏪 ${expense.vendor}</p>
          ` : ''}
          ${expense.description ? `
            <p class="expense-description">${expense.description}</p>
          ` : ''}
          ${expense.receipt ? `
            <p class="expense-receipt">📄 ${expense.receipt}</p>
          ` : ''}
        </div>
      </div>
    `;
    }
    /**
     * Render the profile tab
     */
    renderProfileTab() {
        const currentUser = this.panel.getCurrentUser();
        const profile = this.panel.getPersonalProfile();
        const associationStatus = this.panel.getAssociationStatus();
        return `
      <div class="tab-panel" id="tab-profile" style="display: none;">
        <div class="tab-header">
          <h2>Mi Perfil</h2>
        </div>
        
        <div class="profile-content">
          <div class="profile-section">
            <h3>Información Personal</h3>
            <div class="profile-info">
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${currentUser?.nombre || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${currentUser?.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${currentUser?.telefono || 'No especificado'}</span>
              </div>
              <div class="info-row">
                <span class="label">Número de Taxista:</span>
                <span class="value taxista-number">${currentUser?.numeroTaxista || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Estado:</span>
                <span class="value status ${profile?.accountStatus || 'active'}">
                  ${profile?.accountStatus === 'active' ? '✅ Activa' : '❌ Inactiva'}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Miembro desde:</span>
                <span class="value">${profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <h3>Estado de Asociación</h3>
            <div class="association-info">
              ${associationStatus.isAssociated ? `
                <div class="association-active">
                  <div class="association-icon">🤝</div>
                  <div class="association-details">
                    <h4>Asociado con ${associationStatus.currentPatron?.nombre || 'Patrón'}</h4>
                    <p>Desde: ${associationStatus.associationDate ? new Date(associationStatus.associationDate).toLocaleDateString() : 'N/A'}</p>
                    <p class="independence-note">
                      <span class="icon">🆓</span>
                      Mantienes acceso independiente a tu cuenta personal
                    </p>
                  </div>
                </div>
              ` : `
                <div class="association-independent">
                  <div class="association-icon">🆓</div>
                  <div class="association-details">
                    <h4>Cuenta Independiente</h4>
                    <p>No estás asociado con ningún patrón actualmente.</p>
                    <p>Tienes control total sobre tu cuenta y datos.</p>
                  </div>
                </div>
              `}
            </div>
          </div>

          <div class="profile-section">
            <h3>Configuración Personal</h3>
            <div class="settings-form">
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="notifications" ${profile?.personalSettings.notifications ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Recibir notificaciones
                </label>
              </div>
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="dataSharing" ${profile?.personalSettings.dataSharing ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Compartir datos con patrón (si está asociado)
                </label>
              </div>
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="autoSync" ${profile?.personalSettings.autoSync ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Sincronización automática
                </label>
              </div>
              <div class="setting-actions">
                <button class="btn btn-primary" onclick="taxistaPanelUI.updateSettings()">
                  <span class="icon">💾</span>
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * Render the notifications tab
     */
    renderNotificationsTab() {
        const notifications = this.panel.getNotifications();
        const unreadCount = this.panel.getUnreadNotificationCount();
        return `
      <div class="tab-panel" id="tab-notifications" style="display: none;">
        <div class="tab-header">
          <h2>Notificaciones</h2>
          ${unreadCount > 0 ? `
            <button class="btn btn-secondary" onclick="taxistaPanelUI.markAllAsRead()">
              <span class="icon">✅</span>
              Marcar todas como leídas
            </button>
          ` : ''}
        </div>
        
        ${notifications.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <h3>No tienes notificaciones</h3>
            <p>Las notificaciones sobre asociaciones y actividades aparecerán aquí.</p>
          </div>
        ` : `
          <div class="notifications-list">
            ${notifications.map(notification => this.renderNotificationCard(notification)).join('')}
          </div>
        `}
      </div>
    `;
    }
    /**
     * Render individual notification card
     */
    renderNotificationCard(notification) {
        const isUnread = !notification.read;
        const timeAgo = this.getTimeAgo(new Date(notification.timestamp));
        return `
      <div class="notification-card ${isUnread ? 'unread' : 'read'}" onclick="taxistaPanelUI.markNotificationAsRead('${notification.id}')">
        <div class="notification-header">
          <h4>${notification.title}</h4>
          <span class="notification-time">${timeAgo}</span>
        </div>
        <div class="notification-body">
          <p>${notification.message}</p>
        </div>
        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
    }
    /**
     * Get container styles
     */
    getContainerStyles() {
        return `
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: ${this.theme.backgroundColor};
      color: ${this.theme.textColor};
      min-height: 100vh;
    `;
    }
    /**
     * Render CSS styles
     */
    renderStyles() {
        return `
      <style>
        .taxista-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .panel-header {
          background: white;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .panel-title {
          margin: 0;
          color: ${this.theme.primaryColor};
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .taxista-info {
          margin-top: 10px;
        }

        .taxista-name {
          margin: 0;
          font-size: 1.1em;
          font-weight: 600;
          color: #333;
        }

        .taxista-number {
          margin: 5px 0;
          color: ${this.theme.primaryColor};
          font-weight: bold;
        }

        .association-status {
          margin: 5px 0 0 0;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .association-status.independent {
          color: #059669;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: ${this.theme.borderRadius};
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary {
          background: ${this.theme.primaryColor};
          color: white;
        }

        .btn-primary:hover {
          background: ${this.theme.secondaryColor};
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .notification-btn {
          position: relative;
        }

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .personal-summary {
          margin-bottom: 20px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: white;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .card-icon {
          font-size: 2em;
          opacity: 0.8;
        }

        .card-content h3 {
          margin: 0;
          font-size: 1.8em;
          color: ${this.theme.primaryColor};
        }

        .card-content p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 0.9em;
        }

        .tab-navigation {
          background: white;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          display: flex;
          overflow-x: auto;
        }

        .tab-btn {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn:hover {
          background: #f3f4f6;
        }

        .tab-btn.active {
          background: ${this.theme.primaryColor};
          color: white;
        }

        .tab-panel {
          background: white;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-height: 400px;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .tab-header h2 {
          margin: 0;
          color: ${this.theme.textColor};
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 4em;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .empty-state p {
          margin: 0 0 20px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .dashboard-content {
          display: grid;
          gap: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          border-left: 4px solid ${this.theme.primaryColor};
        }

        .stat-card h4 {
          margin: 0 0 15px 0;
          color: #666;
        }

        .stat-value {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .big-number {
          font-size: 2em;
          font-weight: bold;
          color: ${this.theme.primaryColor};
        }

        .growth {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 500;
        }

        .growth.positive {
          background: #d1fae5;
          color: #065f46;
        }

        .growth.negative {
          background: #fee2e2;
          color: #991b1b;
        }

        .account-status {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2em;
          margin-bottom: 10px;
        }

        .account-status.active {
          color: ${this.theme.primaryColor};
        }

        .member-since {
          margin: 0;
          color: #666;
          font-size: 0.9em;
        }

        .recent-activity h3,
        .top-services h3 {
          margin: 0 0 15px 0;
          color: ${this.theme.textColor};
        }

        .activity-list,
        .service-types-list {
          space-y: 10px;
        }

        .activity-item,
        .service-type-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: ${this.theme.borderRadius};
          margin-bottom: 10px;
        }

        .activity-icon {
          font-size: 1.5em;
          width: 40px;
          text-align: center;
        }

        .activity-content {
          flex: 1;
        }

        .activity-description,
        .service-info h4 {
          margin: 0;
          font-weight: 500;
        }

        .activity-date,
        .service-info p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 0.9em;
        }

        .activity-amount {
          font-weight: bold;
          font-size: 1.1em;
        }

        .activity-amount.service {
          color: ${this.theme.primaryColor};
        }

        .activity-amount.expense {
          color: #ef4444;
        }

        .service-rank {
          background: ${this.theme.primaryColor};
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9em;
        }

        .service-revenue {
          font-weight: bold;
          color: ${this.theme.primaryColor};
        }

        .history-filters {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          margin-bottom: 20px;
        }

        .filter-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
          font-size: 0.9em;
        }

        .form-control {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          outline: none;
          border-color: ${this.theme.primaryColor};
          box-shadow: 0 0 0 2px ${this.theme.primaryColor}20;
        }

        .filter-actions {
          display: flex;
          gap: 10px;
        }

        .history-results h3 {
          margin: 0 0 20px 0;
          color: ${this.theme.textColor};
        }

        .history-list {
          space-y: 15px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #e5e5e5;
          border-radius: ${this.theme.borderRadius};
          margin-bottom: 15px;
        }

        .history-icon {
          font-size: 1.5em;
          width: 40px;
          text-align: center;
        }

        .history-content {
          flex: 1;
        }

        .history-content h4 {
          margin: 0;
          font-weight: 500;
        }

        .history-date,
        .history-details {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 0.9em;
        }

        .history-amount {
          font-weight: bold;
          font-size: 1.1em;
        }

        .history-amount.service {
          color: ${this.theme.primaryColor};
        }

        .history-amount.expense {
          color: #ef4444;
        }

        .create-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          margin-bottom: 20px;
        }

        .create-form h3 {
          margin: 0 0 20px 0;
          color: ${this.theme.textColor};
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
          font-size: 0.9em;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .services-grid,
        .expenses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .service-card,
        .expense-card {
          border: 1px solid #e5e5e5;
          border-radius: ${this.theme.borderRadius};
          overflow: hidden;
          transition: all 0.2s;
        }

        .service-card:hover,
        .expense-card:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .service-card .card-header,
        .expense-card .card-header {
          padding: 15px;
          background: #f9f9f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-card .card-header h4,
        .expense-card .card-header h4 {
          margin: 0;
          color: ${this.theme.textColor};
        }

        .service-amount {
          color: ${this.theme.primaryColor};
          font-weight: bold;
          font-size: 1.1em;
        }

        .expense-amount {
          color: #ef4444;
          font-weight: bold;
          font-size: 1.1em;
        }

        .service-card .card-body,
        .expense-card .card-body {
          padding: 15px;
        }

        .service-date,
        .expense-date {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 0.9em;
        }

        .service-route,
        .service-distance,
        .service-duration,
        .service-description,
        .expense-vendor,
        .expense-description,
        .expense-receipt {
          margin: 5px 0;
          color: #666;
          font-size: 0.9em;
        }

        .profile-content {
          display: grid;
          gap: 30px;
        }

        .profile-section h3 {
          margin: 0 0 15px 0;
          color: ${this.theme.textColor};
          border-bottom: 2px solid ${this.theme.primaryColor};
          padding-bottom: 5px;
        }

        .profile-info {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          align-items: center;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-row .label {
          font-weight: 500;
          color: #666;
        }

        .info-row .value {
          color: ${this.theme.textColor};
        }

        .info-row .value.taxista-number {
          color: ${this.theme.primaryColor};
          font-weight: bold;
        }

        .info-row .value.status.active {
          color: ${this.theme.primaryColor};
        }

        .association-info {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
        }

        .association-active,
        .association-independent {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .association-icon {
          font-size: 2em;
        }

        .association-details h4 {
          margin: 0 0 10px 0;
          color: ${this.theme.textColor};
        }

        .association-details p {
          margin: 5px 0;
          color: #666;
        }

        .independence-note {
          color: ${this.theme.primaryColor} !important;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .settings-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
        }

        .setting-item {
          margin-bottom: 15px;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 500;
        }

        .setting-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: ${this.theme.primaryColor};
        }

        .setting-actions {
          margin-top: 20px;
        }

        .notifications-list {
          space-y: 15px;
        }

        .notification-card {
          padding: 15px;
          border: 1px solid #e5e5e5;
          border-radius: ${this.theme.borderRadius};
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          margin-bottom: 15px;
        }

        .notification-card:hover {
          background: #f9f9f9;
        }

        .notification-card.unread {
          border-left: 4px solid ${this.theme.primaryColor};
          background: #f0f9ff;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .notification-header h4 {
          margin: 0;
          color: ${this.theme.textColor};
          font-size: 1em;
        }

        .notification-time {
          color: #666;
          font-size: 0.8em;
          white-space: nowrap;
        }

        .notification-body p {
          margin: 0;
          color: #666;
          line-height: 1.4;
        }

        .unread-indicator {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 8px;
          height: 8px;
          background: ${this.theme.primaryColor};
          border-radius: 50%;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .taxista-panel {
            padding: 10px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .tab-navigation {
            flex-direction: column;
          }

          .tab-btn {
            justify-content: flex-start;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .services-grid,
          .expenses-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .activity-item,
          .service-type-item,
          .history-item {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }

          .activity-amount,
          .history-amount,
          .service-revenue {
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-actions,
          .form-actions,
          .setting-actions {
            flex-direction: column;
          }
        }
      </style>
    `;
    }
    // Public methods for interaction
    /**
     * Show specific tab
     */
    showTab(tabName) {
        // Hide all tab panels
        const panels = document.querySelectorAll('.tab-panel');
        panels.forEach(panel => {
            panel.style.display = 'none';
        });
        // Remove active class from all tab buttons
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
        });
        // Show selected tab panel
        const selectedPanel = document.getElementById(`tab-${tabName}`);
        if (selectedPanel) {
            selectedPanel.style.display = 'block';
        }
        // Add active class to selected tab button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }
    /**
     * Refresh all data
     */
    async refreshData() {
        try {
            await this.panel.loadPersonalData();
            this.render();
            this.showMessage('Datos actualizados correctamente', 'success');
        }
        catch (error) {
            this.showMessage('Error al actualizar datos', 'error');
        }
    }
    /**
     * Apply history filters
     */
    async applyHistoryFilters() {
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        const type = document.getElementById('historyType')?.value;
        const sortBy = document.getElementById('sortBy')?.value;
        const filters = {
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            type: type || 'all',
            sortBy: sortBy || 'date',
            sortOrder: 'desc'
        };
        try {
            await this.panel.filterHistory(filters);
            this.updateHistoryResults();
            this.showMessage('Filtros aplicados', 'success');
        }
        catch (error) {
            this.showMessage('Error al aplicar filtros', 'error');
        }
    }
    /**
     * Clear history filters
     */
    clearHistoryFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('historyType').value = 'all';
        document.getElementById('sortBy').value = 'date';
        this.panel.clearHistoryFilters();
        this.updateHistoryResults();
    }
    /**
     * Show create service form
     */
    showCreateServiceForm() {
        const form = document.getElementById('create-service-form');
        if (form) {
            form.style.display = 'block';
        }
    }
    /**
     * Hide create service form
     */
    hideCreateServiceForm() {
        const form = document.getElementById('create-service-form');
        if (form) {
            form.style.display = 'none';
        }
    }
    /**
     * Create new service
     */
    async createService() {
        const serviceType = document.getElementById('serviceType')?.value;
        const amount = parseFloat(document.getElementById('serviceAmount')?.value || '0');
        const origin = document.getElementById('serviceOrigin')?.value;
        const destination = document.getElementById('serviceDestination')?.value;
        const distance = parseFloat(document.getElementById('serviceDistance')?.value || '0');
        const duration = parseInt(document.getElementById('serviceDuration')?.value || '0');
        if (!serviceType || amount <= 0) {
            this.showMessage('Por favor completa los campos obligatorios', 'error');
            return;
        }
        const serviceData = {
            serviceType,
            totalAmount: amount,
            origin: origin || undefined,
            destination: destination || undefined,
            distance: distance || undefined,
            duration: duration || undefined,
            description: `${serviceType} - ${new Date().toLocaleDateString()}`
        };
        const success = await this.panel.createService(serviceData);
        if (success) {
            this.hideCreateServiceForm();
            this.render();
            this.showTab('services');
        }
    }
    /**
     * Show create expense form
     */
    showCreateExpenseForm() {
        const form = document.getElementById('create-expense-form');
        if (form) {
            form.style.display = 'block';
        }
    }
    /**
     * Hide create expense form
     */
    hideCreateExpenseForm() {
        const form = document.getElementById('create-expense-form');
        if (form) {
            form.style.display = 'none';
        }
    }
    /**
     * Create new expense
     */
    async createExpense() {
        const category = document.getElementById('expenseCategory')?.value;
        const amount = parseFloat(document.getElementById('expenseAmount')?.value || '0');
        const vendor = document.getElementById('expenseVendor')?.value;
        const description = document.getElementById('expenseDescription')?.value;
        if (!category || amount <= 0) {
            this.showMessage('Por favor completa los campos obligatorios', 'error');
            return;
        }
        const expenseData = {
            category,
            amount,
            vendor: vendor || undefined,
            description: description || `${category} - ${new Date().toLocaleDateString()}`
        };
        const success = await this.panel.createExpense(expenseData);
        if (success) {
            this.hideCreateExpenseForm();
            this.render();
            this.showTab('expenses');
        }
    }
    /**
     * Update personal settings
     */
    async updateSettings() {
        const notifications = document.getElementById('notifications')?.checked || false;
        const dataSharing = document.getElementById('dataSharing')?.checked || false;
        const autoSync = document.getElementById('autoSync')?.checked || false;
        const updates = {
            personalSettings: {
                notifications,
                dataSharing,
                autoSync
            }
        };
        const success = await this.panel.updatePersonalProfile(updates);
        if (success) {
            this.showMessage('Configuración actualizada', 'success');
        }
    }
    /**
     * Export personal data
     */
    exportData() {
        try {
            const exportData = this.panel.exportPersonalData();
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const currentUser = this.panel.getCurrentUser();
            const a = document.createElement('a');
            a.href = url;
            a.download = `datos-personales-${currentUser?.numeroTaxista || 'taxista'}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showMessage('Datos exportados correctamente', 'success');
        }
        catch (error) {
            this.showMessage('Error al exportar datos', 'error');
        }
    }
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId) {
        if (this.panel.markNotificationAsRead(notificationId)) {
            this.updateNotificationsTab();
            this.updateNotificationBadge();
        }
    }
    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        this.panel.getNotifications(true).forEach(notification => {
            this.panel.markNotificationAsRead(notification.id);
        });
        this.updateNotificationsTab();
        this.updateNotificationBadge();
        this.showMessage('Todas las notificaciones marcadas como leídas', 'success');
    }
    // Private helper methods
    /**
     * Update history results section
     */
    updateHistoryResults() {
        const historyResults = document.querySelector('.history-results');
        if (historyResults) {
            const services = this.panel.getPersonalServices();
            const expenses = this.panel.getPersonalExpenses();
            // Combine and sort all history items
            const allHistory = [
                ...services.map(s => ({
                    id: s.id,
                    type: 'service',
                    date: new Date(s.date || ''),
                    description: s.description || `Servicio ${s.serviceType || 'General'}`,
                    amount: s.totalAmount || 0,
                    details: s
                })),
                ...expenses.map(e => ({
                    id: e.id,
                    type: 'expense',
                    date: new Date(e.date || ''),
                    description: e.description || `Gasto ${e.category || 'General'}`,
                    amount: e.amount || 0,
                    details: e
                }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime());
            historyResults.innerHTML = `
        <h3>Historial (${allHistory.length} elementos)</h3>
        ${allHistory.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No hay elementos en el historial</h3>
            <p>Los elementos aparecerán aquí según los filtros aplicados.</p>
          </div>
        ` : `
          <div class="history-list">
            ${allHistory.map(item => this.renderHistoryItem(item)).join('')}
          </div>
        `}
      `;
        }
    }
    /**
     * Update notifications tab
     */
    updateNotificationsTab() {
        const notificationsPanel = document.getElementById('tab-notifications');
        if (notificationsPanel) {
            notificationsPanel.innerHTML = this.renderNotificationsTab().replace('<div class="tab-panel" id="tab-notifications" style="display: none;">', '').replace('</div>', '');
        }
    }
    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-btn .badge');
        const unreadCount = this.panel.getUnreadNotificationCount();
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount.toString();
                badge.style.display = 'flex';
            }
            else {
                badge.style.display = 'none';
            }
        }
    }
    /**
     * Show temporary message
     */
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
        switch (type) {
            case 'success':
                messageEl.style.background = '#059669';
                break;
            case 'error':
                messageEl.style.background = '#ef4444';
                break;
            default:
                messageEl.style.background = '#3b82f6';
        }
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Ahora';
        if (diffMins < 60)
            return `${diffMins}m`;
        if (diffHours < 24)
            return `${diffHours}h`;
        if (diffDays < 7)
            return `${diffDays}d`;
        return date.toLocaleDateString();
    }
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Make the UI instance globally available for onclick handlers
        window.taxistaPanelUI = this;
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showTab('history');
                        break;
                    case 's':
                        e.preventDefault();
                        this.showTab('services');
                        break;
                    case 'e':
                        e.preventDefault();
                        this.showTab('expenses');
                        break;
                }
            }
        });
    }
}
/**
 * Factory function to create taxista panel UI
 */
export function createTaxistaPanelUI(config) {
    return new TaxistaPanelUI(config);
}
//# sourceMappingURL=taxista-panel-ui.js.map