/**
 * StatsCard Component
 * Reusable component for displaying statistics
 */

class StatsCard {
  /**
   * Create a StatsCard
   * @param {string} label - The label for the stat
   * @param {string|number} value - The value to display
   * @param {string} icon - The icon name (Ionic icon)
   * @param {string} theme - The color theme (primary, success, warning, danger)
   */
  constructor(label, value, icon, theme = 'primary') {
    this.label = label;
    this.value = value;
    this.icon = icon;
    this.theme = theme;
  }

  /**
   * Render the stats card as HTML
   * @returns {string} HTML string
   */
  render() {
    return `
      <ion-card class="stats-card stats-card-${this.theme}">
        <ion-card-content>
          <div class="stats-card-header">
            <ion-icon name="${this.icon}" color="${this.theme}"></ion-icon>
          </div>
          <div class="stats-card-body">
            <div class="stats-card-value">${this.value}</div>
            <div class="stats-card-label">${this.label}</div>
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Render as a simple div (for grid layouts)
   * @returns {string} HTML string
   */
  renderSimple() {
    return `
      <div class="stat-card stat-card-${this.theme}">
        <div class="stat-icon">
          <ion-icon name="${this.icon}" color="${this.theme}"></ion-icon>
        </div>
        <div class="stat-value">${this.value}</div>
        <div class="stat-label">${this.label}</div>
      </div>
    `;
  }

  /**
   * Create and append a stats card to a container
   * @param {HTMLElement} container - The container element
   * @param {boolean} simple - Whether to use simple rendering
   */
  appendTo(container, simple = false) {
    if (!container) {
      console.error('StatsCard: Container element not found');
      return;
    }

    const html = simple ? this.renderSimple() : this.render();
    container.insertAdjacentHTML('beforeend', html);
  }

  /**
   * Update the value of an existing stats card
   * @param {HTMLElement} cardElement - The card element
   * @param {string|number} newValue - The new value
   */
  static updateValue(cardElement, newValue) {
    if (!cardElement) return;

    const valueElement = cardElement.querySelector('.stats-card-value, .stat-value');
    if (valueElement) {
      valueElement.textContent = newValue;
    }
  }

  /**
   * Update the label of an existing stats card
   * @param {HTMLElement} cardElement - The card element
   * @param {string} newLabel - The new label
   */
  static updateLabel(cardElement, newLabel) {
    if (!cardElement) return;

    const labelElement = cardElement.querySelector('.stats-card-label, .stat-label');
    if (labelElement) {
      labelElement.textContent = newLabel;
    }
  }

  /**
   * Update the theme of an existing stats card
   * @param {HTMLElement} cardElement - The card element
   * @param {string} newTheme - The new theme
   */
  static updateTheme(cardElement, newTheme) {
    if (!cardElement) return;

    // Remove old theme classes
    const themes = ['primary', 'success', 'warning', 'danger', 'secondary'];
    themes.forEach(theme => {
      cardElement.classList.remove(`stats-card-${theme}`, `stat-card-${theme}`);
    });

    // Add new theme class
    if (cardElement.classList.contains('stats-card')) {
      cardElement.classList.add(`stats-card-${newTheme}`);
    } else if (cardElement.classList.contains('stat-card')) {
      cardElement.classList.add(`stat-card-${newTheme}`);
    }

    // Update icon color
    const icon = cardElement.querySelector('ion-icon');
    if (icon) {
      icon.setAttribute('color', newTheme);
    }
  }

  /**
   * Create a stats card grid
   * @param {Array} statsArray - Array of stat objects {label, value, icon, theme}
   * @param {HTMLElement} container - The container element
   */
  static createGrid(statsArray, container) {
    if (!container || !statsArray || statsArray.length === 0) {
      console.error('StatsCard: Invalid parameters for createGrid');
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create grid
    const grid = document.createElement('ion-grid');
    const row = document.createElement('ion-row');

    statsArray.forEach(stat => {
      const col = document.createElement('ion-col');
      col.setAttribute('size', '6');
      col.setAttribute('size-md', '3');

      const card = new StatsCard(stat.label, stat.value, stat.icon, stat.theme);
      col.innerHTML = card.renderSimple();

      row.appendChild(col);
    });

    grid.appendChild(row);
    container.appendChild(grid);
  }

  /**
   * Animate a value change
   * @param {HTMLElement} cardElement - The card element
   * @param {number} newValue - The new numeric value
   * @param {number} duration - Animation duration in ms
   * @param {string} prefix - Value prefix (e.g., '€')
   * @param {string} suffix - Value suffix
   */
  static animateValue(cardElement, newValue, duration = 500, prefix = '', suffix = '') {
    if (!cardElement) return;

    const valueElement = cardElement.querySelector('.stats-card-value, .stat-value');
    if (!valueElement) return;

    const currentText = valueElement.textContent;
    const currentValue = parseFloat(currentText.replace(/[^0-9.-]/g, '')) || 0;

    const startTime = Date.now();
    const difference = newValue - currentValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = currentValue + (difference * easeOut);

      // Format value
      let formattedValue;
      if (Number.isInteger(newValue)) {
        formattedValue = Math.round(current);
      } else {
        formattedValue = current.toFixed(2);
      }

      valueElement.textContent = prefix + formattedValue + suffix;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure final value is exact
        valueElement.textContent = prefix + (Number.isInteger(newValue) ? newValue : newValue.toFixed(2)) + suffix;
      }
    };

    animate();
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.StatsCard = StatsCard;
}

console.log('StatsCard component loaded');
