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
      const pageWidth = doc.internal.pageSize.width;

      // Colors
      const primaryColor = [66, 133, 244]; // Blue
      const successColor = [52, 168, 83]; // Green
      const dangerColor = [234, 67, 53]; // Red
      const darkColor = [33, 33, 33]; // Dark gray
      const lightGray = [245, 245, 245]; // Light gray

      // Header with background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Title in white
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('CONCILIACIÓN DE SERVICIOS', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`${config.clientName || 'Sin nombre'}`, pageWidth / 2, 23, { align: 'center' });
      doc.text(`Período: ${config.startDate} - ${config.endDate}`, pageWidth / 2, 29, { align: 'center' });
      
      yPos = 45;

      // Reset text color
      doc.setTextColor(...darkColor);

      // Summary Section with colored boxes
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen Financiero', margin, yPos);
      yPos += lineHeight + 2;

      // Box for Total Services
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, 85, 18, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Total Servicios', margin + 3, yPos + 6);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`${totalServices}`, margin + 3, yPos + 14);
      
      // Box for Gross Income
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin + 90, yPos, 85, 18, 2, 2, 'F');
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Ingresos Brutos', margin + 93, yPos + 6);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...successColor);
      doc.text(`€${grossIncome.toFixed(2)}`, margin + 93, yPos + 14);
      
      yPos += 22;

      // Box for Total Expenses
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, 85, 18, 2, 2, 'F');
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Total Gastos', margin + 3, yPos + 6);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...dangerColor);
      doc.text(`€${totalExpenses.toFixed(2)}`, margin + 3, yPos + 14);
      
      // Box for Net Income
      doc.setFillColor(52, 168, 83, 0.2);
      doc.roundedRect(margin + 90, yPos, 85, 18, 2, 2, 'F');
      doc.setDrawColor(...successColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin + 90, yPos, 85, 18, 2, 2, 'S');
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Ingresos Netos', margin + 93, yPos + 6);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...successColor);
      doc.text(`€${netIncome.toFixed(2)}`, margin + 93, yPos + 14);
      
      yPos += 28;

      // Distribution Section with Pie Chart
      doc.setTextColor(...darkColor);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Distribución', margin, yPos);
      yPos += lineHeight + 2;

      // Draw pie chart
      const chartCenterX = margin + 30;
      const chartCenterY = yPos + 25;
      const chartRadius = 20;
      
      if (driverAmount > 0 || ownerAmount > 0) {
        const total = driverAmount + ownerAmount;
        const driverAngle = (driverAmount / total) * 360;
        
        // Driver slice (green)
        doc.setFillColor(...successColor);
        this.drawPieSlice(doc, chartCenterX, chartCenterY, chartRadius, 0, driverAngle);
        
        // Owner slice (blue)
        doc.setFillColor(...primaryColor);
        this.drawPieSlice(doc, chartCenterX, chartCenterY, chartRadius, driverAngle, 360);
      }

      // Legend and amounts
      const legendX = margin + 70;
      let legendY = yPos + 10;
      
      // Driver legend
      doc.setFillColor(...successColor);
      doc.circle(legendX, legendY, 3, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Conductor', legendX + 6, legendY + 1);
      doc.setFont(undefined, 'normal');
      doc.text(`${driverPercentage}%`, legendX + 35, legendY + 1);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...successColor);
      doc.text(`€${driverAmount.toFixed(2)}`, legendX + 50, legendY + 1);
      
      legendY += 10;
      
      // Owner legend
      doc.setFillColor(...primaryColor);
      doc.circle(legendX, legendY, 3, 'F');
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Propietario', legendX + 6, legendY + 1);
      doc.setFont(undefined, 'normal');
      doc.text(`${ownerPercentage}%`, legendX + 35, legendY + 1);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`€${ownerAmount.toFixed(2)}`, legendX + 50, legendY + 1);
      
      yPos += 60;

      // Services Section
      if (services && services.length > 0) {
        doc.setTextColor(...darkColor);
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Servicios (${services.length})`, margin + 2, yPos + 3);
        yPos += 10;
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        services.forEach((service, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(...lightGray);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');
          }
          
          const serviceAmount = service.netAmount || service.amount || 0;
          doc.text(`${service.date}`, margin + 2, yPos);
          doc.text(`${service.destination || 'Sin destino'}`, margin + 30, yPos);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...successColor);
          doc.text(`€${serviceAmount.toFixed(2)}`, pageWidth - margin - 25, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...darkColor);
          
          yPos += 6;
        });
        
        yPos += 5;
      }

      // Expenses Section
      if (expenses && expenses.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setTextColor(...darkColor);
        doc.setFillColor(...dangerColor);
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Gastos (${expenses.length})`, margin + 2, yPos + 3);
        yPos += 10;
        
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        expenses.forEach((expense, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(...lightGray);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');
          }
          
          doc.text(`${expense.date}`, margin + 2, yPos);
          doc.text(`${expense.category}`, margin + 30, yPos);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...dangerColor);
          doc.text(`€${expense.amount.toFixed(2)}`, pageWidth - margin - 25, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...darkColor);
          
          yPos += 6;
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generado: ${new Date(this.reconciliation.generatedAt).toLocaleDateString('es-ES')} - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
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
   * Draw a pie slice for the chart
   */
  drawPieSlice(doc, centerX, centerY, radius, startAngle, endAngle) {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    doc.moveTo(centerX, centerY);
    doc.lineTo(
      centerX + radius * Math.cos(startRad),
      centerY + radius * Math.sin(startRad)
    );
    
    // Draw arc
    const steps = Math.ceil(Math.abs(endAngle - startAngle) / 5);
    for (let i = 1; i <= steps; i++) {
      const angle = startRad + (endRad - startRad) * i / steps;
      doc.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
    }
    
    doc.lineTo(centerX, centerY);
    doc.fill();
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
