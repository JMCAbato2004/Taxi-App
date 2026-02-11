/**
 * TabNavigation Component
 * Manages tab navigation with swipe gestures and keyboard shortcuts
 */

class TabNavigation {
  constructor() {
    this.activeTab = 'home';
    this.tabs = [
      { id: 'home', label: 'Inicio', icon: 'home' },
      { id: 'services', label: 'Servicios', icon: 'car' },
      { id: 'balance', label: 'Balance', icon: 'wallet' },
      { id: 'profile', label: 'Perfil', icon: 'person' }
    ];
    
    this.tabsElement = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.swipeThreshold = 50; // Minimum swipe distance in pixels
  }

  /**
   * Initialize the tab navigation
   */
  initialize() {
    this.tabsElement = document.querySelector('ion-tabs');
    
    if (!this.tabsElement) {
      console.error('TabNavigation: ion-tabs element not found');
      return;
    }

    // Set up tab change listeners
    this.setupTabListeners();
    
    // Set up swipe gesture listeners
    this.setupSwipeGestures();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Set initial active tab
    this.updateActiveTab(this.activeTab);
    
    console.log('TabNavigation initialized');
  }

  /**
   * Set up tab change listeners
   */
  setupTabListeners() {
    // Listen for tab button clicks
    const tabButtons = document.querySelectorAll('ion-tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = button.getAttribute('tab');
        if (tabId) {
          this.switchTab(tabId);
        }
      });
    });

    // Listen for Ionic tab change events
    this.tabsElement.addEventListener('ionTabsDidChange', (e) => {
      if (e.detail && e.detail.tab) {
        this.activeTab = e.detail.tab;
        this.updateActiveTab(this.activeTab);
      }
    });
  }

  /**
   * Set up swipe gesture listeners
   */
  setupSwipeGestures() {
    const contentElements = document.querySelectorAll('ion-content');
    
    contentElements.forEach(content => {
      // Touch start
      content.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      // Touch end
      content.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipeGesture();
      }, { passive: true });
    });
  }

  /**
   * Handle swipe gesture
   */
  handleSwipeGesture() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    // Swipe left (next tab)
    if (swipeDistance < -this.swipeThreshold) {
      this.navigateToAdjacentTab('next');
    }
    
    // Swipe right (previous tab)
    if (swipeDistance > this.swipeThreshold) {
      this.navigateToAdjacentTab('previous');
    }
  }

  /**
   * Navigate to adjacent tab
   * @param {string} direction - 'next' or 'previous'
   */
  navigateToAdjacentTab(direction) {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTab);
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % this.tabs.length;
    } else {
      newIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    }
    
    const newTab = this.tabs[newIndex];
    this.switchTab(newTab.id);
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Check for Ctrl key (or Cmd on Mac)
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+1 to Ctrl+4 for tabs
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 4) {
          e.preventDefault();
          const tab = this.tabs[keyNum - 1];
          if (tab) {
            this.switchTab(tab.id);
          }
        }
      }
    });
  }

  /**
   * Switch to a specific tab
   * @param {string} tabId - The tab ID to switch to
   */
  switchTab(tabId) {
    if (!this.tabs.find(tab => tab.id === tabId)) {
      console.error(`TabNavigation: Invalid tab ID: ${tabId}`);
      return;
    }

    // Update active tab
    this.activeTab = tabId;
    
    // Select the tab using Ionic's API
    if (this.tabsElement) {
      this.tabsElement.select(tabId);
    }
    
    // Update UI
    this.updateActiveTab(tabId);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('tab-changed', { 
      detail: { tabId } 
    }));
  }

  /**
   * Update active tab highlighting
   * @param {string} tabId - The active tab ID
   */
  updateActiveTab(tabId) {
    // Update tab button states
    const tabButtons = document.querySelectorAll('ion-tab-button');
    tabButtons.forEach(button => {
      const buttonTabId = button.getAttribute('tab');
      if (buttonTabId === tabId) {
        button.classList.add('tab-selected');
      } else {
        button.classList.remove('tab-selected');
      }
    });
  }

  /**
   * Get current active tab
   * @returns {string} The active tab ID
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Get all tabs
   * @returns {Array} Array of tab objects
   */
  getTabs() {
    return this.tabs;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TabNavigation = TabNavigation;
}

console.log('TabNavigation component loaded');
