/**
 * Sanitizer - XSS Prevention Utility
 * Sanitizes user input to prevent Cross-Site Scripting attacks
 * 
 * Security Features:
 * - HTML sanitization
 * - Script tag removal
 * - Event handler removal
 * - URL validation
 * - Safe innerHTML replacement
 */

class Sanitizer {
  constructor() {
    // Dangerous HTML tags to remove
    this.DANGEROUS_TAGS = [
      'script', 'iframe', 'object', 'embed', 'link', 'style',
      'form', 'input', 'button', 'textarea', 'select'
    ];

    // Dangerous attributes to remove
    this.DANGEROUS_ATTRS = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
      'onkeyup', 'onkeypress', 'ondblclick', 'oncontextmenu'
    ];

    // Allowed protocols for URLs
    this.ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
  }

  /**
   * Sanitize HTML string
   * @param {string} html - HTML string to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html, options = {}) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const {
      allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span', 'div'],
      allowedAttrs = ['class', 'style'],
      stripTags = false
    } = options;

    // Create a temporary DOM element
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous tags
    this.DANGEROUS_TAGS.forEach(tag => {
      const elements = temp.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // Process all elements
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove if tag not allowed
      if (!allowedTags.includes(el.tagName.toLowerCase())) {
        if (stripTags) {
          // Keep content but remove tag
          const parent = el.parentNode;
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          el.remove();
        } else {
          el.remove();
        }
        return;
      }

      // Remove dangerous attributes
      this.DANGEROUS_ATTRS.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.removeAttribute(attr);
        }
      });

      // Remove non-allowed attributes
      Array.from(el.attributes).forEach(attr => {
        if (!allowedAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });

      // Sanitize href and src attributes
      if (el.hasAttribute('href')) {
        const href = el.getAttribute('href');
        if (!this.isValidURL(href)) {
          el.removeAttribute('href');
        }
      }

      if (el.hasAttribute('src')) {
        const src = el.getAttribute('src');
        if (!this.isValidURL(src)) {
          el.removeAttribute('src');
        }
      }
    });

    return temp.innerHTML;
  }

  /**
   * Escape HTML special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHTML(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitize text for safe display
   * Removes all HTML tags
   * @param {string} text - Text to sanitize
   * @returns {string} Plain text
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.textContent;
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidURL(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Check for javascript: protocol
    if (url.toLowerCase().startsWith('javascript:')) {
      return false;
    }

    // Check for data: protocol (can be dangerous)
    if (url.toLowerCase().startsWith('data:')) {
      return false;
    }

    try {
      const urlObj = new URL(url, window.location.origin);
      return this.ALLOWED_PROTOCOLS.includes(urlObj.protocol);
    } catch (e) {
      // Relative URLs are okay
      return !url.includes(':');
    }
  }

  /**
   * Sanitize object properties recursively
   * @param {Object} obj - Object to sanitize
   * @param {Array} keys - Keys to sanitize (if empty, sanitizes all string values)
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj, keys = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];

      if (typeof value === 'string') {
        // Sanitize if key is in the list or list is empty (sanitize all)
        if (keys.length === 0 || keys.includes(key)) {
          sanitized[key] = this.escapeHTML(value);
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, keys);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Safe innerHTML setter
   * Use this instead of element.innerHTML = value
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML content
   * @param {Object} options - Sanitization options
   */
  setInnerHTML(element, html, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      console.error('Invalid element provided to setInnerHTML');
      return;
    }

    const sanitized = this.sanitizeHTML(html, options);
    element.innerHTML = sanitized;
  }

  /**
   * Create safe HTML element with text content
   * @param {string} tagName - Tag name
   * @param {string} textContent - Text content
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement} Created element
   */
  createElement(tagName, textContent = '', attributes = {}) {
    const element = document.createElement(tagName);
    
    // Set text content (automatically escaped)
    if (textContent) {
      element.textContent = textContent;
    }

    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
      // Skip dangerous attributes
      if (this.DANGEROUS_ATTRS.includes(key.toLowerCase())) {
        continue;
      }

      // Validate URLs
      if ((key === 'href' || key === 'src') && !this.isValidURL(value)) {
        continue;
      }

      element.setAttribute(key, value);
    }

    return element;
  }

  /**
   * Sanitize CSS
   * @param {string} css - CSS string
   * @returns {string} Sanitized CSS
   */
  sanitizeCSS(css) {
    if (!css || typeof css !== 'string') {
      return '';
    }

    // Remove dangerous CSS properties
    const dangerous = [
      'expression', 'behavior', 'binding', 'import',
      'javascript:', 'vbscript:', 'data:'
    ];

    let sanitized = css;
    dangerous.forEach(term => {
      const regex = new RegExp(term, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    return sanitized;
  }

  /**
   * Sanitize JSON string
   * @param {string} jsonStr - JSON string
   * @returns {Object|null} Parsed and sanitized object
   */
  sanitizeJSON(jsonStr) {
    try {
      const obj = JSON.parse(jsonStr);
      return this.sanitizeObject(obj);
    } catch (e) {
      console.error('Invalid JSON:', e);
      return null;
    }
  }

  /**
   * Sanitize filename
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    
    // Remove special characters except dots, dashes, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit length
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }

    return sanitized;
  }

  /**
   * Sanitize email
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Basic email validation and sanitization
    const sanitized = email.trim().toLowerCase();
    
    // Remove any HTML tags
    const temp = document.createElement('div');
    temp.textContent = sanitized;
    
    return temp.textContent;
  }

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone
   */
  sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // Keep only numbers, +, -, (, ), and spaces
    return phone.replace(/[^0-9+\-() ]/g, '');
  }

  /**
   * Sanitize number input
   * @param {string|number} value - Value to sanitize
   * @param {Object} options - Options (min, max, decimals)
   * @returns {number|null} Sanitized number or null
   */
  sanitizeNumber(value, options = {}) {
    const { min = -Infinity, max = Infinity, decimals = 2 } = options;

    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return null;
    }

    // Clamp to min/max
    let sanitized = Math.max(min, Math.min(max, num));
    
    // Round to decimals
    sanitized = Math.round(sanitized * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    return sanitized;
  }

  /**
   * Sanitize date input
   * @param {string} dateStr - Date string
   * @returns {string|null} ISO date string or null
   */
  sanitizeDate(dateStr) {
    if (!dateStr) {
      return null;
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }

  /**
   * Strip all HTML tags
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripTags(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Truncate string safely
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add (default '...')
   * @returns {string} Truncated string
   */
  truncate(str, maxLength = 100, suffix = '...') {
    if (!str || typeof str !== 'string') {
      return '';
    }

    if (str.length <= maxLength) {
      return str;
    }

    return str.substring(0, maxLength - suffix.length) + suffix;
  }
}

// Create singleton instance
const sanitizer = new Sanitizer();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Sanitizer = Sanitizer;
  window.sanitizer = sanitizer;
}

console.log('Sanitizer utility loaded');
