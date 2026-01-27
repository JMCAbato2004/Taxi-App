// Patron Panel UI Component
// HTML/CSS rendering component for the patron dashboard
// Requirements: 3.1, 3.2, 2.1, 2.2

import { 
  PatronPanel, 
  PatronPanelConfig, 
  TaxistaSearchFilters,
  AggregatedReportData 
} from './patron-panel';
import { 
  User, 
  AvailableTaxista, 
  AssociationWithDetails,
  PatronDashboard 
} from '../types';

/**
 * UI Configuration for patron panel
 */
export interface PatronPanelUIConfig extends PatronPanelConfig {
  containerId: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
  };
}

/**
 * Patron Panel UI Component
 */
export class PatronPanelUI {
  private panel: PatronPanel;
  private container: HTMLElement | null = null;
  private theme: any;

  constructor(private config: PatronPanelUIConfig) {
    this.theme = {
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      backgroundColor: '#f5f5f5',
      textColor: '#1f2937',
      borderRadius: '8px',
      ...config.theme
    };

    this.panel = new PatronPanel(config);
    this.initialize();
  }

  /**
   * Initialize the UI component
   */
  private initialize(): void {
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      throw new Error(`Container with ID '${this.config.containerId}' not found`);
    }

    this.render();
    this.attachEventListeners();
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
      this.refreshData();
    }, 30000);
  }

  /**
   * Render the complete patron panel UI
   */
  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="patron-panel" style="${this.getContainerStyles()}">
        ${this.renderHeader()}
        ${this.renderDashboard()}
        ${this.renderTabs()}
        <div class="tab-content">
          ${this.renderTaxistasTab()}
          ${this.renderSearchTab()}
          ${this.renderReportsTab()}
          ${this.renderNotificationsTab()}
        </div>
      </div>
      ${this.renderStyles()}
    `;

    // Show the first tab by default
    this.showTab('taxistas');
  }

  /**
   * Render the header section
   */
  private renderHeader(): string {
    const dashboardData = this.panel.getDashboardData();
    const unreadCount = this.panel.getUnreadNotificationCount();

    return `
      <div class="panel-header">
        <div class="header-content">
          <div class="header-info">
            <h1 class="panel-title">
              <span class="icon">🚕</span>
              Panel de Patrón
            </h1>
            <p class="patron-info">
              ${dashboardData?.patronNombre || 'Cargando...'} 
              <span class="email">(${dashboardData?.patronEmail || ''})</span>
            </p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" onclick="patronPanelUI.refreshData()">
              <span class="icon">🔄</span>
              Actualizar
            </button>
            <button class="btn btn-primary notification-btn" onclick="patronPanelUI.showTab('notifications')">
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
   * Render the dashboard summary
   */
  private renderDashboard(): string {
    const dashboardData = this.panel.getDashboardData();
    const reportData = this.panel.getReportData();

    return `
      <div class="dashboard-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <h3>${dashboardData?.totalTaxistasAsociados || 0}</h3>
              <p>Taxistas Asociados</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">📈</div>
            <div class="card-content">
              <h3>${dashboardData?.nuevasAsociacionesMes || 0}</h3>
              <p>Nuevas Este Mes</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">🚗</div>
            <div class="card-content">
              <h3>${reportData?.totalServices || 0}</h3>
              <p>Servicios Totales</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <h3>€${reportData?.totalRevenue?.toFixed(2) || '0.00'}</h3>
              <p>Ingresos Totales</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the tab navigation
   */
  private renderTabs(): string {
    return `
      <div class="tab-navigation">
        <button class="tab-btn active" data-tab="taxistas" onclick="patronPanelUI.showTab('taxistas')">
          <span class="icon">👥</span>
          Mis Taxistas
        </button>
        <button class="tab-btn" data-tab="search" onclick="patronPanelUI.showTab('search')">
          <span class="icon">🔍</span>
          Buscar Taxistas
        </button>
        <button class="tab-btn" data-tab="reports" onclick="patronPanelUI.showTab('reports')">
          <span class="icon">📊</span>
          Reportes
        </button>
        <button class="tab-btn" data-tab="notifications" onclick="patronPanelUI.showTab('notifications')">
          <span class="icon">🔔</span>
          Notificaciones
        </button>
      </div>
    `;
  }

  /**
   * Render the associated taxistas tab
   */
  private renderTaxistasTab(): string {
    const taxistas = this.panel.getAssociatedTaxistas();
    const associations = this.panel.getAssociations();

    return `
      <div class="tab-panel" id="tab-taxistas">
        <div class="tab-header">
          <h2>Taxistas Asociados (${taxistas.length})</h2>
          <button class="btn btn-primary" onclick="patronPanelUI.showTab('search')">
            <span class="icon">➕</span>
            Añadir Taxista
          </button>
        </div>
        
        ${taxistas.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No tienes taxistas asociados</h3>
            <p>Comienza buscando y asociando taxistas para gestionar tu flota.</p>
            <button class="btn btn-primary" onclick="patronPanelUI.showTab('search')">
              Buscar Taxistas
            </button>
          </div>
        ` : `
          <div class="taxistas-grid">
            ${taxistas.map(taxista => this.renderTaxistaCard(taxista, associations)).join('')}
          </div>
        `}
      </div>
    `;
  }

  /**
   * Render individual taxista card
   */
  private renderTaxistaCard(taxista: User, associations: AssociationWithDetails[]): string {
    const association = associations.find(a => a.taxistaId === taxista.id);
    const associationDate = association ? new Date(association.fechaAsociacion).toLocaleDateString() : '';

    return `
      <div class="taxista-card">
        <div class="card-header">
          <div class="taxista-info">
            <h3>${taxista.nombre}</h3>
            <p class="taxista-number">${taxista.numeroTaxista}</p>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary" onclick="patronPanelUI.viewTaxistaDetails('${taxista.id}')">
              <span class="icon">👁️</span>
              Ver
            </button>
            <button class="btn btn-sm btn-danger" onclick="patronPanelUI.confirmRemoveAssociation('${association?.id}', '${taxista.nombre}')">
              <span class="icon">🗑️</span>
              Desasociar
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${taxista.email}</span>
          </div>
          ${taxista.telefono ? `
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${taxista.telefono}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Asociado desde:</span>
            <span class="value">${associationDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Estado:</span>
            <span class="value status ${taxista.activo ? 'active' : 'inactive'}">
              ${taxista.activo ? '✅ Activo' : '❌ Inactivo'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the search taxistas tab
   */
  private renderSearchTab(): string {
    const availableTaxistas = this.panel.getAvailableTaxistas();

    return `
      <div class="tab-panel" id="tab-search" style="display: none;">
        <div class="tab-header">
          <h2>Buscar Taxistas Disponibles</h2>
        </div>
        
        <div class="search-controls">
          <div class="search-form">
            <div class="form-row">
              <div class="form-group">
                <label for="searchTerm">Buscar por nombre, email o número:</label>
                <input type="text" id="searchTerm" class="form-control" placeholder="Ej: Juan, juan@email.com, TX001">
              </div>
              <div class="form-group">
                <label for="sortBy">Ordenar por:</label>
                <select id="sortBy" class="form-control">
                  <option value="nombre">Nombre</option>
                  <option value="email">Email</option>
                  <option value="numeroTaxista">Número Taxista</option>
                  <option value="fechaCreacion">Fecha Registro</option>
                </select>
              </div>
              <div class="form-group">
                <label for="sortOrder">Orden:</label>
                <select id="sortOrder" class="form-control">
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick="patronPanelUI.performSearch()">
                <span class="icon">🔍</span>
                Buscar
              </button>
              <button class="btn btn-secondary" onclick="patronPanelUI.clearSearch()">
                <span class="icon">🗑️</span>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div class="search-results">
          <h3>Taxistas Disponibles (${availableTaxistas.length})</h3>
          ${availableTaxistas.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No se encontraron taxistas disponibles</h3>
              <p>Todos los taxistas registrados ya están asociados o no hay taxistas registrados.</p>
            </div>
          ` : `
            <div class="available-taxistas-grid">
              ${availableTaxistas.map(taxista => this.renderAvailableTaxistaCard(taxista)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render available taxista card
   */
  private renderAvailableTaxistaCard(taxista: AvailableTaxista): string {
    return `
      <div class="available-taxista-card">
        <div class="card-header">
          <div class="taxista-info">
            <h3>${taxista.nombre}</h3>
            <p class="taxista-number">${taxista.numeroTaxista}</p>
          </div>
          <button class="btn btn-primary" onclick="patronPanelUI.confirmCreateAssociation('${taxista.id}', '${taxista.nombre}', '${taxista.numeroTaxista}')">
            <span class="icon">➕</span>
            Asociar
          </button>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${taxista.email}</span>
          </div>
          ${taxista.telefono ? `
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${taxista.telefono}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Registrado:</span>
            <span class="value">${new Date(taxista.fechaCreacion).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the reports tab
   */
  private renderReportsTab(): string {
    const reportData = this.panel.getReportData();

    return `
      <div class="tab-panel" id="tab-reports" style="display: none;">
        <div class="tab-header">
          <h2>Reportes Agregados</h2>
          <button class="btn btn-secondary" onclick="patronPanelUI.exportReports()">
            <span class="icon">📥</span>
            Exportar
          </button>
        </div>
        
        ${!reportData ? `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>No hay datos de reportes disponibles</h3>
            <p>Los reportes se generarán cuando tengas taxistas asociados con actividad.</p>
          </div>
        ` : `
          <div class="reports-content">
            <div class="report-summary">
              <div class="summary-grid">
                <div class="summary-item">
                  <h4>Taxistas Activos</h4>
                  <p class="big-number">${reportData.activeTaxistas}/${reportData.totalTaxistas}</p>
                </div>
                <div class="summary-item">
                  <h4>Servicios Totales</h4>
                  <p class="big-number">${reportData.totalServices}</p>
                </div>
                <div class="summary-item">
                  <h4>Ingresos Totales</h4>
                  <p class="big-number">€${reportData.totalRevenue.toFixed(2)}</p>
                </div>
                <div class="summary-item">
                  <h4>Promedio por Servicio</h4>
                  <p class="big-number">€${reportData.averageServiceValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div class="performance-section">
              <h3>Top Taxistas por Rendimiento</h3>
              <div class="performance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Taxista</th>
                      <th>Número</th>
                      <th>Servicios</th>
                      <th>Ingresos</th>
                      <th>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.topPerformingTaxistas.map((taxista, index) => `
                      <tr>
                        <td>
                          <span class="rank">#${index + 1}</span>
                          ${taxista.nombre}
                        </td>
                        <td>${taxista.numeroTaxista}</td>
                        <td>${taxista.totalServices}</td>
                        <td>€${taxista.totalRevenue.toFixed(2)}</td>
                        <td>€${(taxista.totalRevenue / taxista.totalServices).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="growth-section">
              <h3>Crecimiento Mensual</h3>
              <div class="growth-indicator ${reportData.monthlyGrowth >= 0 ? 'positive' : 'negative'}">
                <span class="growth-icon">${reportData.monthlyGrowth >= 0 ? '📈' : '📉'}</span>
                <span class="growth-value">${reportData.monthlyGrowth >= 0 ? '+' : ''}${reportData.monthlyGrowth}%</span>
                <span class="growth-text">vs. mes anterior</span>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  /**
   * Render the notifications tab
   */
  private renderNotificationsTab(): string {
    const notifications = this.panel.getNotifications();
    const unreadCount = this.panel.getUnreadNotificationCount();

    return `
      <div class="tab-panel" id="tab-notifications" style="display: none;">
        <div class="tab-header">
          <h2>Notificaciones</h2>
          ${unreadCount > 0 ? `
            <button class="btn btn-secondary" onclick="patronPanelUI.markAllAsRead()">
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
  private renderNotificationCard(notification: any): string {
    const isUnread = !notification.read;
    const timeAgo = this.getTimeAgo(new Date(notification.timestamp));

    return `
      <div class="notification-card ${isUnread ? 'unread' : 'read'}" onclick="patronPanelUI.markNotificationAsRead('${notification.id}')">
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
  private getContainerStyles(): string {
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
  private renderStyles(): string {
    return `
      <style>
        .patron-panel {
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

        .patron-info {
          margin: 5px 0 0 0;
          color: #666;
        }

        .email {
          font-size: 0.9em;
          color: #888;
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

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
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

        .dashboard-summary {
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

        .taxistas-grid, .available-taxistas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .taxista-card, .available-taxista-card {
          border: 1px solid #e5e5e5;
          border-radius: ${this.theme.borderRadius};
          overflow: hidden;
          transition: all 0.2s;
        }

        .taxista-card:hover, .available-taxista-card:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card-header {
          padding: 15px;
          background: #f9f9f9;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .taxista-info h3 {
          margin: 0;
          color: ${this.theme.textColor};
        }

        .taxista-number {
          margin: 5px 0 0 0;
          color: ${this.theme.primaryColor};
          font-weight: bold;
          font-size: 0.9em;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .card-body {
          padding: 15px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          align-items: center;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: #666;
          font-size: 0.9em;
        }

        .value {
          color: ${this.theme.textColor};
          font-size: 0.9em;
        }

        .status.active {
          color: ${this.theme.primaryColor};
        }

        .status.inactive {
          color: #ef4444;
        }

        .search-controls {
          margin-bottom: 30px;
        }

        .search-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
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

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .search-results h3 {
          margin: 0 0 20px 0;
          color: ${this.theme.textColor};
        }

        .reports-content {
          space-y: 30px;
        }

        .report-summary {
          margin-bottom: 30px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .summary-item {
          text-align: center;
          padding: 20px;
          background: #f9f9f9;
          border-radius: ${this.theme.borderRadius};
        }

        .summary-item h4 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 0.9em;
        }

        .big-number {
          margin: 0;
          font-size: 2em;
          font-weight: bold;
          color: ${this.theme.primaryColor};
        }

        .performance-section {
          margin-bottom: 30px;
        }

        .performance-section h3 {
          margin: 0 0 15px 0;
          color: ${this.theme.textColor};
        }

        .performance-table {
          overflow-x: auto;
        }

        .performance-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-table th,
        .performance-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }

        .performance-table th {
          background: #f9f9f9;
          font-weight: 600;
          color: #333;
        }

        .rank {
          display: inline-block;
          background: ${this.theme.primaryColor};
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 12px;
          margin-right: 8px;
        }

        .growth-section h3 {
          margin: 0 0 15px 0;
          color: ${this.theme.textColor};
        }

        .growth-indicator {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border-radius: ${this.theme.borderRadius};
          font-size: 1.2em;
        }

        .growth-indicator.positive {
          background: #d1fae5;
          color: #065f46;
        }

        .growth-indicator.negative {
          background: #fee2e2;
          color: #991b1b;
        }

        .growth-icon {
          font-size: 1.5em;
        }

        .growth-value {
          font-weight: bold;
          font-size: 1.3em;
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
          .patron-panel {
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

          .form-row {
            grid-template-columns: 1fr;
          }

          .taxistas-grid, .available-taxistas-grid {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-actions {
            align-self: stretch;
            justify-content: flex-end;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .performance-table {
            font-size: 0.9em;
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      </style>
    `;
  }

  // Public methods for interaction

  /**
   * Show specific tab
   */
  showTab(tabName: string): void {
    // Hide all tab panels
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
      (panel as HTMLElement).style.display = 'none';
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
  async refreshData(): Promise<void> {
    try {
      await this.panel.loadData();
      this.render();
      this.showMessage('Datos actualizados correctamente', 'success');
    } catch (error) {
      this.showMessage('Error al actualizar datos', 'error');
    }
  }

  /**
   * Perform search with current filters
   */
  async performSearch(): Promise<void> {
    const searchTerm = (document.getElementById('searchTerm') as HTMLInputElement)?.value;
    const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value as any;
    const sortOrder = (document.getElementById('sortOrder') as HTMLSelectElement)?.value as any;

    const filters: TaxistaSearchFilters = {
      searchTerm: searchTerm || undefined,
      sortBy: sortBy || 'nombre',
      sortOrder: sortOrder || 'asc'
    };

    try {
      await this.panel.searchTaxistas(filters);
      this.updateSearchResults();
      this.showMessage('Búsqueda completada', 'success');
    } catch (error) {
      this.showMessage('Error en la búsqueda', 'error');
    }
  }

  /**
   * Clear search filters
   */
  clearSearch(): void {
    (document.getElementById('searchTerm') as HTMLInputElement).value = '';
    (document.getElementById('sortBy') as HTMLSelectElement).value = 'nombre';
    (document.getElementById('sortOrder') as HTMLSelectElement).value = 'asc';
    
    this.panel.clearFilters();
    this.updateSearchResults();
  }

  /**
   * Confirm and create association
   */
  async confirmCreateAssociation(taxistaId: string, nombre: string, numeroTaxista: string): Promise<void> {
    if (confirm(`¿Confirmas que deseas asociar al taxista ${nombre} (${numeroTaxista})?`)) {
      const success = await this.panel.createAssociation(taxistaId);
      if (success) {
        this.render();
        this.showTab('taxistas');
      }
    }
  }

  /**
   * Confirm and remove association
   */
  async confirmRemoveAssociation(associationId: string, taxistaNombre: string): Promise<void> {
    if (confirm(`¿Confirmas que deseas desasociar al taxista ${taxistaNombre}? Esta acción no eliminará su cuenta personal.`)) {
      const success = await this.panel.removeAssociation(associationId);
      if (success) {
        this.render();
      }
    }
  }

  /**
   * View taxista details (placeholder for future implementation)
   */
  viewTaxistaDetails(taxistaId: string): void {
    const taxista = this.panel.getAssociatedTaxistas().find(t => t.id === taxistaId);
    if (taxista) {
      alert(`Detalles de ${taxista.nombre}:\n\nEmail: ${taxista.email}\nNúmero: ${taxista.numeroTaxista}\nTeléfono: ${taxista.telefono || 'No especificado'}\n\n(Funcionalidad de detalles completos pendiente de implementación)`);
    }
  }

  /**
   * Export reports
   */
  exportReports(): void {
    try {
      const reportData = this.panel.exportReportData();
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-patron-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showMessage('Reporte exportado correctamente', 'success');
    } catch (error) {
      this.showMessage('Error al exportar reporte', 'error');
    }
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    if (this.panel.markNotificationAsRead(notificationId)) {
      this.updateNotificationsTab();
      this.updateNotificationBadge();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.panel.getNotifications(true).forEach(notification => {
      this.panel.markNotificationAsRead(notification.id);
    });
    this.updateNotificationsTab();
    this.updateNotificationBadge();
    this.showMessage('Todas las notificaciones marcadas como leídas', 'success');
  }

  // Private helper methods

  /**
   * Update search results section
   */
  private updateSearchResults(): void {
    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
      const availableTaxistas = this.panel.getAvailableTaxistas();
      searchResults.innerHTML = `
        <h3>Taxistas Disponibles (${availableTaxistas.length})</h3>
        ${availableTaxistas.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No se encontraron taxistas disponibles</h3>
            <p>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ` : `
          <div class="available-taxistas-grid">
            ${availableTaxistas.map(taxista => this.renderAvailableTaxistaCard(taxista)).join('')}
          </div>
        `}
      `;
    }
  }

  /**
   * Update notifications tab
   */
  private updateNotificationsTab(): void {
    const notificationsPanel = document.getElementById('tab-notifications');
    if (notificationsPanel) {
      notificationsPanel.innerHTML = this.renderNotificationsTab().replace('<div class="tab-panel" id="tab-notifications" style="display: none;">', '').replace('</div>', '');
    }
  }

  /**
   * Update notification badge
   */
  private updateNotificationBadge(): void {
    const badge = document.querySelector('.notification-btn .badge');
    const unreadCount = this.panel.getUnreadNotificationCount();
    
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount.toString();
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Show temporary message
   */
  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
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
        messageEl.style.background = '#10b981';
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
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Make the UI instance globally available for onclick handlers
    (window as any).patronPanelUI = this;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            this.refreshData();
            break;
          case 'f':
            e.preventDefault();
            this.showTab('search');
            const searchInput = document.getElementById('searchTerm') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
        }
      }
    });
  }
}

/**
 * Factory function to create patron panel UI
 */
export function createPatronPanelUI(config: PatronPanelUIConfig): PatronPanelUI {
  return new PatronPanelUI(config);
}