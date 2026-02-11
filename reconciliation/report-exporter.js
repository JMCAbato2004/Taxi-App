/**
 * ReportExporter - Generador de reportes en PDF y JSON
 * 
 * Implementa la funcionalidad para generar reportes de conciliación en formato PDF
 * y exportar datos en formato JSON para backup o análisis externo.
 * 
 * Tarea 12.1: Crear ReportExporter con generación de PDF
 * Requerimientos: 8.1, 8.2
 */

class ReportExporter {
  constructor() {
    this.companyInfo = {
      name: 'Empresa de Taxi',
      address: 'Dirección de la empresa',
      phone: 'Teléfono de contacto',
      email: 'email@empresa.com',
      taxId: 'NIF/CIF'
    };
  }

  /**
   * Configura la información de la empresa para los reportes
   * @param {Object} info - Información de la empresa
   */
  setCompanyInfo(info) {
    this.companyInfo = { ...this.companyInfo, ...info };
  }

  /**
   * Genera un reporte PDF de la conciliación
   * @param {Object} reconciliation - Datos de conciliación
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Blob>} PDF generado como Blob
   */
  async generatePDF(reconciliation, options = {}) {
    try {
      // Verificar si jsPDF está disponible
      if (typeof window === 'undefined' || !window.jsPDF) {
        throw new Error('jsPDF no está disponible. Incluir la librería jsPDF.');
      }

      const { jsPDF } = window;
      const doc = new jsPDF();

      // Configuración del documento
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Función helper para agregar texto con salto de página automático
      const addText = (text, x, y, options = {}) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(text, x, y, options);
        return y;
      };

      // Función helper para agregar línea
      const addLine = (y, thickness = 0.5) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setLineWidth(thickness);
        doc.line(margin, y, pageWidth - margin, y);
        return y + 5;
      };

      // 1. HEADER DEL DOCUMENTO
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      currentY = addText('REPORTE DE CONCILIACIÓN', margin, currentY);
      currentY += 10;

      // Información de la empresa
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      currentY = addText(`${this.companyInfo.name}`, margin, currentY);
      currentY += 5;
      if (this.companyInfo.address) {
        currentY = addText(`${this.companyInfo.address}`, margin, currentY);
        currentY += 5;
      }
      if (this.companyInfo.phone || this.companyInfo.email) {
        const contact = [this.companyInfo.phone, this.companyInfo.email].filter(Boolean).join(' | ');
        currentY = addText(contact, margin, currentY);
        currentY += 5;
      }
      if (this.companyInfo.taxId) {
        currentY = addText(`${this.companyInfo.taxId}`, margin, currentY);
        currentY += 10;
      }

      currentY = addLine(currentY);

      // 2. INFORMACIÓN DEL PERÍODO
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      currentY = addText('PERÍODO DE CONCILIACIÓN', margin, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const startDate = new Date(reconciliation.period.startDate).toLocaleDateString('es-ES');
      const endDate = new Date(reconciliation.period.endDate).toLocaleDateString('es-ES');
      currentY = addText(`Desde: ${startDate}`, margin, currentY);
      currentY += 5;
      currentY = addText(`Hasta: ${endDate}`, margin, currentY);
      currentY += 5;
      currentY = addText(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, margin, currentY);
      currentY += 10;

      currentY = addLine(currentY);

      // 3. RESUMEN GENERAL
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      currentY = addText('RESUMEN GENERAL', margin, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      const summaryData = [
        ['Total de Servicios:', `${reconciliation.summary.totalServices || 0}`],
        ['Ingresos Brutos:', `${(reconciliation.summary.totalServices || 0).toFixed(2)}€`],
        ['Total Gastos:', `${(reconciliation.summary.totalExpenses || 0).toFixed(2)}€`],
        ['Ingresos Netos:', `${(reconciliation.summary.netIncome || 0).toFixed(2)}€`],
        ['', ''],
        ['Efectivo:', `${(reconciliation.summary.totalCash || 0).toFixed(2)}€`],
        ['Tarjeta:', `${(reconciliation.summary.totalCard || 0).toFixed(2)}€`],
        ['App:', `${(reconciliation.summary.totalApp || 0).toFixed(2)}€`],
        ['Freenow Total:', `${(reconciliation.summary.totalFreenow || 0).toFixed(2)}€`],
        ['Comisión Freenow:', `${(reconciliation.summary.totalCommission || 0).toFixed(2)}€`]
      ];

      summaryData.forEach(([label, value]) => {
        if (label && value) {
          currentY = addText(label, margin, currentY);
          currentY = addText(value, pageWidth - margin - 50, currentY - 5);
        }
        currentY += 5;
      });

      currentY += 5;
      currentY = addLine(currentY);

      // 4. LIQUIDACIÓN FINAL
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      currentY = addText('LIQUIDACIÓN FINAL', margin, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      const settlementData = [
        ['Distribución Patrón (60%):', `${(reconciliation.summary.distribution60 || 0).toFixed(2)}€`],
        ['Distribución Taxista (40%):', `${(reconciliation.summary.distribution40 || 0).toFixed(2)}€`],
        ['', ''],
        ['Extras Freenow:', `${(reconciliation.finalSettlement?.freenowExtras || 0).toFixed(2)}€`],
        ['Saldo Externo:', `${(reconciliation.finalSettlement?.externalBalance || 0).toFixed(2)}€`],
        ['', ''],
        ['TOTAL TAXISTA:', `${((reconciliation.summary.distribution40 || 0) + (reconciliation.finalSettlement?.freenowExtras || 0) + (reconciliation.finalSettlement?.externalBalance || 0)).toFixed(2)}€`]
      ];

      settlementData.forEach(([label, value]) => {
        if (label && value) {
          if (label.includes('TOTAL')) {
            doc.setFont(undefined, 'bold');
          } else {
            doc.setFont(undefined, 'normal');
          }
          currentY = addText(label, margin, currentY);
          currentY = addText(value, pageWidth - margin - 50, currentY - 5);
        }
        currentY += 5;
      });

      currentY += 5;
      currentY = addLine(currentY);

      // 5. TOTALES DIARIOS (si hay espacio)
      if (reconciliation.dailyTotals && reconciliation.dailyTotals.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        currentY = addText('TOTALES DIARIOS', margin, currentY);
        currentY += 8;

        // Header de la tabla
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        const headers = ['Fecha', 'Servicios', 'Total', 'Gastos', 'Neto'];
        const colWidths = [35, 25, 30, 30, 30];
        let xPos = margin;

        headers.forEach((header, index) => {
          currentY = addText(header, xPos, currentY);
          xPos += colWidths[index];
        });
        currentY += 5;
        currentY = addLine(currentY, 0.3);

        // Datos de la tabla
        doc.setFont(undefined, 'normal');
        reconciliation.dailyTotals.forEach(day => {
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = margin;
          }

          xPos = margin;
          const date = new Date(day.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          const rowData = [
            date,
            `${day.serviceStart || 0}`,
            `${(day.totalService || 0).toFixed(2)}€`,
            `${(day.expenses || 0).toFixed(2)}€`,
            `${((day.totalService || 0) - (day.expenses || 0)).toFixed(2)}€`
          ];

          rowData.forEach((data, index) => {
            currentY = addText(data, xPos, currentY);
            xPos += colWidths[index];
          });
          currentY += 5;
        });

        currentY += 5;
        currentY = addLine(currentY);
      }

      // 6. DESGLOSE DE EFECTIVO (si existe)
      if (reconciliation.cashBreakdown) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        currentY = addText('DESGLOSE DE EFECTIVO', margin, currentY);
        currentY += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        const bills = reconciliation.cashBreakdown.bills || {};
        const billData = [
          ['Billetes de 50€:', `${bills.fifty || 0} × 50€ = ${((bills.fifty || 0) * 50).toFixed(2)}€`],
          ['Billetes de 20€:', `${bills.twenty || 0} × 20€ = ${((bills.twenty || 0) * 20).toFixed(2)}€`],
          ['Billetes de 10€:', `${bills.ten || 0} × 10€ = ${((bills.ten || 0) * 10).toFixed(2)}€`],
          ['Billetes de 5€:', `${bills.five || 0} × 5€ = ${((bills.five || 0) * 5).toFixed(2)}€`],
          ['Monedas de 2€:', `${bills.two || 0} × 2€ = ${((bills.two || 0) * 2).toFixed(2)}€`],
          ['Monedas de 1€:', `${bills.one || 0} × 1€ = ${((bills.one || 0) * 1).toFixed(2)}€`],
          ['', ''],
          ['Total Contado:', `${(reconciliation.cashBreakdown.total || 0).toFixed(2)}€`],
          ['Diferencia:', `${(reconciliation.cashBreakdown.difference || 0).toFixed(2)}€`]
        ];

        billData.forEach(([label, value]) => {
          if (label && value) {
            if (label.includes('Total') || label.includes('Diferencia')) {
              doc.setFont(undefined, 'bold');
            } else {
              doc.setFont(undefined, 'normal');
            }
            currentY = addText(label, margin, currentY);
            currentY = addText(value, pageWidth - margin - 80, currentY - 5);
          }
          currentY += 5;
        });
      }

      // 7. FOOTER
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 30, pageHeight - 10);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 10);
      }

      // Retornar el PDF como Blob
      return doc.output('blob');

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  }

  /**
   * Exporta los datos de conciliación en formato JSON
   * @param {Object} reconciliation - Datos de conciliación
   * @param {Object} options - Opciones de exportación
   * @returns {string} JSON formateado
   */
  exportJSON(reconciliation, options = {}) {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          type: 'reconciliation',
          company: this.companyInfo
        },
        reconciliation: {
          id: reconciliation.id,
          period: reconciliation.period,
          summary: reconciliation.summary,
          finalSettlement: reconciliation.finalSettlement,
          dailyTotals: reconciliation.dailyTotals || [],
          services: reconciliation.services || [],
          expenses: reconciliation.expenses || [],
          cashBreakdown: reconciliation.cashBreakdown || null,
          createdAt: reconciliation.createdAt,
          updatedAt: reconciliation.updatedAt
        }
      };

      // Incluir datos adicionales si se especifica
      if (options.includeRawData) {
        exportData.rawData = {
          services: reconciliation.services,
          expenses: reconciliation.expenses
        };
      }

      if (options.includeCalculations) {
        exportData.calculations = {
          commissionRates: { freenow: 0.15, other: 0.10 },
          distributionRates: { driver: 0.40, owner: 0.60 }
        };
      }

      return JSON.stringify(exportData, null, options.minify ? 0 : 2);

    } catch (error) {
      console.error('Error exportando JSON:', error);
      throw new Error(`Error al exportar JSON: ${error.message}`);
    }
  }

  /**
   * Descarga un archivo en el navegador
   * @param {Blob|string} data - Datos a descargar
   * @param {string} filename - Nombre del archivo
   * @param {string} mimeType - Tipo MIME del archivo
   */
  downloadFile(data, filename, mimeType = 'application/octet-stream') {
    try {
      if (typeof window === 'undefined') {
        throw new Error('La descarga solo está disponible en el navegador');
      }

      let blob;
      if (data instanceof Blob) {
        blob = data;
      } else {
        blob = new Blob([data], { type: mimeType });
      }

      // Crear URL temporal
      const url = window.URL.createObjectURL(blob);

      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL temporal
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw new Error(`Error al descargar archivo: ${error.message}`);
    }
  }

  /**
   * Genera y descarga un reporte PDF
   * @param {Object} reconciliation - Datos de conciliación
   * @param {Object} options - Opciones de generación
   */
  async downloadPDF(reconciliation, options = {}) {
    try {
      const pdfBlob = await this.generatePDF(reconciliation, options);
      
      const filename = options.filename || this.generateFilename(reconciliation, 'pdf');
      
      this.downloadFile(pdfBlob, filename, 'application/pdf');

    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    }
  }

  /**
   * Genera y descarga un archivo JSON
   * @param {Object} reconciliation - Datos de conciliación
   * @param {Object} options - Opciones de exportación
   */
  downloadJSON(reconciliation, options = {}) {
    try {
      const jsonData = this.exportJSON(reconciliation, options);
      
      const filename = options.filename || this.generateFilename(reconciliation, 'json');
      
      this.downloadFile(jsonData, filename, 'application/json');

    } catch (error) {
      console.error('Error descargando JSON:', error);
      throw error;
    }
  }

  /**
   * Genera un nombre de archivo basado en la conciliación
   * @param {Object} reconciliation - Datos de conciliación
   * @param {string} extension - Extensión del archivo
   * @returns {string} Nombre del archivo
   */
  generateFilename(reconciliation, extension) {
    const startDate = new Date(reconciliation.period.startDate);
    const endDate = new Date(reconciliation.period.endDate);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start === end) {
      return `conciliacion_${start}.${extension}`;
    } else {
      return `conciliacion_${start}_${end}.${extension}`;
    }
  }

  /**
   * Valida los datos de conciliación antes de exportar
   * @param {Object} reconciliation - Datos a validar
   * @returns {Object} Resultado de validación
   */
  validateReconciliation(reconciliation) {
    const errors = [];
    const warnings = [];

    // Validaciones básicas
    if (!reconciliation) {
      errors.push('Datos de conciliación requeridos');
      return { valid: false, errors, warnings };
    }

    if (!reconciliation.period) {
      errors.push('Período de conciliación requerido');
    }

    if (!reconciliation.summary) {
      errors.push('Resumen de conciliación requerido');
    }

    // Validaciones de consistencia
    if (reconciliation.dailyTotals && reconciliation.summary) {
      const dailySum = reconciliation.dailyTotals.reduce((sum, day) => sum + (day.totalService || 0), 0);
      const summaryTotal = reconciliation.summary.totalServices || 0;
      
      if (Math.abs(dailySum - summaryTotal) > 0.01) {
        warnings.push('Inconsistencia entre totales diarios y resumen general');
      }
    }

    // Validaciones de datos faltantes
    if (!reconciliation.finalSettlement) {
      warnings.push('Liquidación final no disponible');
    }

    if (!reconciliation.cashBreakdown) {
      warnings.push('Desglose de efectivo no disponible');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera un reporte completo con validación
   * @param {Object} reconciliation - Datos de conciliación
   * @param {string} format - Formato de salida ('pdf' o 'json')
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Object>} Resultado de la generación
   */
  async generateReport(reconciliation, format = 'pdf', options = {}) {
    try {
      // Validar datos
      const validation = this.validateReconciliation(reconciliation);
      
      if (!validation.valid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Mostrar advertencias si las hay
      if (validation.warnings.length > 0) {
        console.warn('Advertencias en la generación del reporte:', validation.warnings);
      }

      let result;
      
      if (format.toLowerCase() === 'pdf') {
        result = await this.generatePDF(reconciliation, options);
      } else if (format.toLowerCase() === 'json') {
        result = this.exportJSON(reconciliation, options);
      } else {
        throw new Error(`Formato no soportado: ${format}`);
      }

      return {
        success: true,
        data: result,
        format: format,
        validation: validation,
        filename: this.generateFilename(reconciliation, format.toLowerCase())
      };

    } catch (error) {
      console.error('Error generando reporte:', error);
      return {
        success: false,
        error: error.message,
        format: format
      };
    }
  }

  /**
   * Obtiene información sobre las capacidades de exportación
   * @returns {Object} Información de capacidades
   */
  getCapabilities() {
    return {
      formats: ['pdf', 'json'],
      features: {
        pdf: {
          available: typeof window !== 'undefined' && !!window.jsPDF,
          requirements: ['jsPDF library'],
          supports: ['company info', 'daily totals', 'summary', 'cash breakdown']
        },
        json: {
          available: true,
          requirements: [],
          supports: ['complete data export', 'metadata', 'raw data', 'calculations']
        }
      },
      browser: {
        download: typeof window !== 'undefined' && !!window.URL && !!document.createElement
      }
    };
  }
}

// Exportar para uso en navegador y Node.js
if (typeof window !== 'undefined') {
  window.ReportExporter = ReportExporter;
} else if (typeof module !== 'undefined') {
  module.exports = ReportExporter;
}