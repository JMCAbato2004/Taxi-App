/**
 * ReconciliationDetailModal Component
 * Shows detailed reconciliation information with PDF export option
 */

class ReconciliationDetailModal {
  constructor(reconciliation) {
    this.reconciliation = reconciliation;
    this.modal = null;
  }

  /**
   * Show the modal
   */
  async show() {
    try {
      this.modal = await this.createModal();
      document.body.appendChild(this.modal);
      await this.modal.present();
      this.attachEventListeners();
    } catch (error) {
      console.error('ReconciliationDetailModal: Error showing modal:', error);
      ToastManager.showError('Error al abrir el modal');
    }
  }

  /**
   * Create the modal element
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = this.getModalContent();
    return modal;
  }

  /**
   * Get modal content HTML
   */
  getModalContent() {
    const { config, summary, distribution, services, expenses } = this.reconciliation;
    const generatedDate = new Date(this.reconciliation.generatedAt);
    const formattedDate = generatedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Handle different summary structures
    const totalServices = summary?.totalServices || services?.length || 0;
    const grossIncome = summary?.grossIncome || summary?.totalIncome || 0;
    const totalExpenses = summary?.totalExpenses || 0;
    const netIncome = summary?.netIncome || (grossIncome - totalExpenses);

    // Handle distribution
    const driverAmount = distribution?.driverAmount || distribution?.taxistaAmount || 0;
    const ownerAmount = distribution?.ownerAmount || distribution?.patronAmount || 0;
    const driverPercentage = config?.driverPercentage || config?.taxistaPercentage || 0;
    const ownerPercentage = config?.ownerPercentage || config?.patronPercentage || 0;

    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Detalle de Conciliación</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-detail-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <!-- Header Info -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>${config.clientName || 'Sin nombre'}</ion-card-title>
            <ion-card-subtitle>
              Período: ${config.startDate} - ${config.endDate}
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p style="font-size: 12px; color: var(--ion-color-medium);">
              Generado: ${formattedDate}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Summary -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Resumen</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>Total Servicios</ion-label>
                <ion-note slot="end">${totalServices}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>Ingresos Brutos</ion-label>
                <ion-note slot="end" color="success">€${grossIncome.toFixed(2)}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label>Total Gastos</ion-label>
                <ion-note slot="end" color="danger">€${totalExpenses.toFixed(2)}</ion-note>
              </ion-item>
              <ion-item>
                <ion-label><strong>Ingresos Netos</strong></ion-label>
                <ion-note slot="end" color="primary"><strong>€${netIncome.toFixed(2)}</strong></ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Distribution -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Distribución</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-icon name="person" slot="start" color="success"></ion-icon>
                <ion-label>
                  <h3>Conductor</h3>
                  <p>${driverPercentage}% de ingresos netos</p>
                </ion-label>
                <ion-note slot="end" color="success">
                  <strong>€${driverAmount.toFixed(2)}</strong>
                </ion-note>
              </ion-item>
              <ion-item>
                <ion-icon name="business" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>Propietario</h3>
                  <p>${ownerPercentage}% de ingresos netos</p>
                </ion-label>
                <ion-note slot="end" color="primary">
                  <strong>€${ownerAmount.toFixed(2)}</strong>
                </ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Services -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Servicios (${services?.length || 0})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            ${services && services.length > 0 ? `
              <ion-list>
                ${services.slice(0, 5).map(service => `
                  <ion-item>
                    <ion-label>
                      <h3>${service.date} ${service.time || ''}</h3>
                      <p>${service.destination || 'Sin destino'}</p>
                    </ion-label>
                    <ion-note slot="end">€${(service.netAmount || service.amount || 0).toFixed(2)}</ion-note>
                  </ion-item>
                `).join('')}
                ${services.length > 5 ? `
                  <ion-item>
                    <ion-label style="text-align: center; color: var(--ion-color-medium);">
                      ... y ${services.length - 5} servicios más
                    </ion-label>
                  </ion-item>
                ` : ''}
              </ion-list>
            ` : '<p style="text-align: center; color: var(--ion-color-medium);">No hay servicios</p>'}
          </ion-card-content>
        </ion-card>

        <!-- Expenses -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Gastos (${expenses?.length || 0})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            ${expenses && expenses.length > 0 ? `
              <ion-list>
                ${expenses.slice(0, 5).map(expense => `
                  <ion-item>
                    <ion-label>
                      <h3>${expense.date}</h3>
                      <p>${expense.category} - ${expense.description || 'Sin descripción'}</p>
                    </ion-label>
                    <ion-note slot="end" color="danger">€${expense.amount.toFixed(2)}</ion-note>
                  </ion-item>
                `).join('')}
                ${expenses.length > 5 ? `
                  <ion-item>
                    <ion-label style="text-align: center; color: var(--ion-color-medium);">
                      ... y ${expenses.length - 5} gastos más
                    </ion-label>
                  </ion-item>
                ` : ''}
              </ion-list>
            ` : '<p style="text-align: center; color: var(--ion-color-medium);">No hay gastos</p>'}
          </ion-card-content>
        </ion-card>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 12px; margin-top: 24px; padding-bottom: 16px;">
          <ion-button 
            id="export-pdf-btn"
            expand="block" 
            color="primary"
            style="flex: 1; height: 56px; font-size: 16px; font-weight: 600;">
            <ion-icon name="download" slot="start"></ion-icon>
            Exportar PDF
          </ion-button>
        </div>
      </ion-content>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.modal.querySelector('#close-detail-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Export PDF button
    const exportBtn = this.modal.querySelector('#export-pdf-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToPDF());
    }
  }

  /**
   * Export reconciliation to PDF
   */
  async exportToPDF() {
    try {
      await LoadingManager.show('Generando PDF...');

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      const { config, summary, distribution, services, expenses } = this.reconciliation;
      
      // Handle different summary structures
      const totalServices = summary?.totalServices || services?.length || 0;
      const grossIncome = summary?.grossIncome || summary?.totalIncome || 0;
      const totalExpenses = summary?.totalExpenses || 0;
      const netIncome = summary?.netIncome || (grossIncome - totalExpenses);
      
      // Handle distribution
      const driverAmount = distribution?.driverAmount || distribution?.taxistaAmount || 0;
      const ownerAmount = distribution?.ownerAmount || distribution?.patronAmount || 0;
      const driverPercentage = config?.driverPercentage || config?.taxistaPercentage || 0;
      const ownerPercentage = config?.ownerPercentage || config?.patronPercentage || 0;
      
      let yPos = 20;
      const lineHeight = 7;
      const margin = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Conciliación de Servicios', margin, yPos);
      yPos += lineHeight * 2;

      // Client and Period
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Cliente: ${config.clientName || 'Sin nombre'}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Período: ${config.startDate} - ${config.endDate}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Generado: ${new Date(this.reconciliation.generatedAt).toLocaleDateString('es-ES')}`, margin, yPos);
      yPos += lineHeight * 2;

      // Summary Section
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen', margin, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Servicios: ${totalServices}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Ingresos Brutos: €${grossIncome.toFixed(2)}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Total Gastos: €${totalExpenses.toFixed(2)}`, margin, yPos);
      yPos += lineHeight;
      doc.setFont(undefined, 'bold');
      doc.text(`Ingresos Netos: €${netIncome.toFixed(2)}`, margin, yPos);
      yPos += lineHeight * 2;

      // Distribution Section
      doc.setFontSize(14);
      doc.text('Distribución', margin, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Conductor (${driverPercentage}%): €${driverAmount.toFixed(2)}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Propietario (${ownerPercentage}%): €${ownerAmount.toFixed(2)}`, margin, yPos);
      yPos += lineHeight * 2;

      // Services Section
      if (services && services.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Servicios (${services.length})`, margin, yPos);
        yPos += lineHeight;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        services.forEach(service => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const serviceText = `${service.date} - ${service.destination || 'Sin destino'} - €${(service.netAmount || service.amount || 0).toFixed(2)}`;
          doc.text(serviceText, margin + 5, yPos);
          yPos += lineHeight;
        });
        
        yPos += lineHeight;
      }

      // Expenses Section
      if (expenses && expenses.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Gastos (${expenses.length})`, margin, yPos);
        yPos += lineHeight;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        expenses.forEach(expense => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const expenseText = `${expense.date} - ${expense.category} - €${expense.amount.toFixed(2)}`;
          doc.text(expenseText, margin + 5, yPos);
          yPos += lineHeight;
        });
      }

      // Save PDF
      const fileName = `conciliacion_${(config.clientName || 'sin_nombre').replace(/\s+/g, '_')}_${config.startDate}_${config.endDate}.pdf`;
      doc.save(fileName);

      await LoadingManager.hide();
      ToastManager.showSuccess('PDF generado correctamente');
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error generating PDF:', error);
      ToastManager.showError('Error al generar PDF');
    }
  }

  /**
   * Close the modal
   */
  async close() {
    if (this.modal) {
      await this.modal.dismiss();
      this.modal.remove();
    }
  }
}

// Export for use in other modules
window.ReconciliationDetailModal = ReconciliationDetailModal;

console.log('ReconciliationDetailModal component loaded');
