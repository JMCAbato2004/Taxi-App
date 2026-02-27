/**
 * ShiftPDFExporter - Exportador de jornadas a PDF
 * 
 * Responsabilidades:
 * - Generar documentos PDF de jornadas individuales
 * - Incluir información completa: fecha, horas, pausas, servicios, ingresos
 * - Formatear PDF con diseño legible y estructura organizada
 * - Generar nombre de archivo con formato específico
 */

class ShiftPDFExporter {
  constructor() {
    // jsPDF ya está disponible globalmente
    this.jsPDF = window.jspdf.jsPDF;
  }

  /**
   * Exportar jornada a PDF
   * @param {Object} shift - Jornada
   * @param {Array} services - Servicios de la jornada
   */
  async exportShift(shift, services = []) {
    const doc = new this.jsPDF();
    
    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 20;

    // Header con fondo azul
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título en blanco
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Detalle de Jornada Laboral', pageWidth / 2, 25, { align: 'center' });
    
    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Información básica
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    const startDate = new Date(shift.startTime);
    const endDate = shift.endTime ? new Date(shift.endTime) : null;
    
    doc.text(`Fecha: ${this.formatDate(startDate)}`, margin, yPosition);
    yPosition += 8;
    
    doc.text(`Hora Inicio: ${this.formatTime(startDate)}`, margin, yPosition);
    yPosition += 8;
    
    if (endDate) {
      doc.text(`Hora Fin: ${this.formatTime(endDate)}`, margin, yPosition);
      yPosition += 8;
    }
    
    // Duración en caja azul
    yPosition += 5;
    doc.setFillColor(52, 152, 219);
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 20, 3, 3, 'F');
    
    const duration = this.calculateDuration(shift);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(`Duración Total: ${this.formatDuration(duration)}`, margin + 5, yPosition + 5);
    yPosition += 20;
    
    // Horas efectivas en caja verde
    yPosition += 5;
    const effectiveHours = this.calculateEffectiveHours(shift);
    doc.setFillColor(46, 204, 113);
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 20, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.text(`Horas Efectivas: ${this.formatDuration(effectiveHours)}`, margin + 5, yPosition + 5);
    yPosition += 25;
    
    doc.setTextColor(0, 0, 0);

    // Pausas
    if (shift.pauses && shift.pauses.length > 0) {
      const completedPauses = shift.pauses.filter(p => p.endTime);
      
      if (completedPauses.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Pausas', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        
        completedPauses.forEach((pause, index) => {
          const pauseStart = new Date(pause.startTime);
          const pauseEnd = pause.endTime ? new Date(pause.endTime) : null;
          const pauseDuration = pauseEnd ? pauseEnd - pauseStart : 0;
          
          // Fondo alternado
          if (index % 2 === 0) {
            doc.setFillColor(236, 240, 241);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
          }
          
          doc.text(
            `${index + 1}. ${this.formatTime(pauseStart)} - ${pauseEnd ? this.formatTime(pauseEnd) : 'En curso'} (${this.formatDuration(pauseDuration)})`,
            margin + 5,
            yPosition
          );
          yPosition += 8;
        });
        
        yPosition += 10;
      }
    }
    
    // Servicios realizados
    if (services.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('Servicios Realizados', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      let totalIncome = 0;
      
      services.forEach((service, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        const serviceTime = service.datetime || service.date;
        const amount = parseFloat(service.amount || 0);
        totalIncome += amount;
        
        // Fondo alternado
        if (index % 2 === 0) {
          doc.setFillColor(236, 240, 241);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
        }
        
        doc.text(
          `${index + 1}. ${serviceTime ? this.formatTime(serviceTime) : 'N/A'} - €${amount.toFixed(2)}`,
          margin + 5,
          yPosition
        );
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Resumen en caja roja
      doc.setFillColor(231, 76, 60);
      doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 3, 3, 'F');
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Servicios: ${services.length}`, margin + 5, yPosition + 5);
      yPosition += 10;
      doc.text(`Ingresos Totales: €${totalIncome.toFixed(2)}`, margin + 5, yPosition + 5);
      yPosition += 15;
      
      // Calcular ingreso por hora efectiva
      const hoursEffective = effectiveHours / (1000 * 60 * 60);
      const incomePerHour = hoursEffective > 0 ? totalIncome / hoursEffective : 0;
      doc.text(`Ingreso por Hora Efectiva: €${incomePerHour.toFixed(2)}/h`, margin + 5, yPosition + 5);
      yPosition += 15;
      
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFontSize(11);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(127, 140, 141);
      doc.text('No hay servicios registrados en esta jornada', margin, yPosition);
      yPosition += 10;
    }
    
    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(149, 165, 166);
    doc.text(
      `Generado el ${this.formatDate(new Date())} a las ${this.formatTime(new Date())}`,
      margin,
      footerY
    );
    
    // Número de página
    doc.text(
      `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
      pageWidth - margin - 20,
      footerY
    );
    
    // Guardar PDF
    const fileName = `jornada_${this.formatDateForFilename(startDate)}.pdf`;
    doc.save(fileName);
  }

  /**
   * Formatear fecha
   * @param {Date} date - Fecha
   * @returns {string} Fecha formateada
   */
  formatDate(date) {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatear hora
   * @param {string|Date} dateOrString - Fecha o string ISO
   * @returns {string} Hora formateada
   */
  formatTime(dateOrString) {
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear duración
   * @param {number} milliseconds - Duración en milisegundos
   * @returns {string} Duración formateada
   */
  formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  /**
   * Formatear fecha para nombre de archivo
   * @param {Date} date - Fecha
   * @returns {string} Fecha formateada
   */
  formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  }

  /**
   * Calcular duración de jornada
   * @param {Object} shift - Jornada
   * @returns {number} Duración en milisegundos
   */
  calculateDuration(shift) {
    const start = new Date(shift.startTime);
    const end = shift.endTime ? new Date(shift.endTime) : new Date();
    return end - start;
  }

  /**
   * Calcular horas efectivas
   * @param {Object} shift - Jornada
   * @returns {number} Horas efectivas en milisegundos
   */
  calculateEffectiveHours(shift) {
    const duration = this.calculateDuration(shift);
    const pauseTime = shift.pauses.reduce((total, pause) => {
      if (pause.endTime) {
        const pauseStart = new Date(pause.startTime);
        const pauseEnd = new Date(pause.endTime);
        return total + (pauseEnd - pauseStart);
      }
      return total;
    }, 0);
    return duration - pauseTime;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ShiftPDFExporter = ShiftPDFExporter;
}
