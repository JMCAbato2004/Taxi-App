/**
 * Configuración personalizable para Control de Taxi
 * Aplicación principal para taxistas con módulo secundario de ventas generales
 */

const APP_CONFIG = {
  // Información básica de la aplicación
  appName: 'Control de Taxi',
  appIcon: '🚕',
  currency: '€',
  
  // Plataformas de taxi (principal)
  taxiPlatforms: [
    'Emisora',
    'Calle', 
    'Uber',
    'Cabify',
    'Freenow',
    'Bolt',
    'Didi',
    'Otro'
  ],
  
  // Fuentes de ingresos generales (secundario)
  incomeSources: [
    'Tienda Física',
    'Venta Online', 
    'Servicios',
    'Comisiones',
    'Freelance',
    'Mercado Local',
    'Redes Sociales',
    'Otro'
  ],
  
  // Categorías de gastos para taxi
  expenseCategories: [
    'Gasolina',
    'Comida', 
    'Lavado',
    'Mantenimiento',
    'Peajes',
    'Multas',
    'Seguro',
    'Otro'
  ],
  
  // Configuración de campos
  fields: {
    // Campos para ingresos
    income: {
      amount: { required: true, label: 'Importe' },
      description: { required: false, label: 'Descripción' },
      client: { required: false, label: 'Cliente' },
      date: { required: true, label: 'Fecha y Hora' }
    },
    // Campos para gastos
    expense: {
      category: { required: true, label: 'Categoría' },
      amount: { required: true, label: 'Importe' },
      notes: { required: false, label: 'Notas' }
    }
  },
  
  // Configuración de reportes
  reports: {
    periods: ['today', 'week', 'month'],
    exportFormats: ['csv', 'pdf'],
    charts: {
      incomeBySource: true,
      expensesByCategory: true
    }
  },
  
  // Configuración de tema
  theme: {
    primaryColor: '#059669',
    darkModeDefault: false
  },
  
  // Configuración offline
  offline: {
    enabled: true,
    syncOnReconnect: true
  }
};

// Función para obtener configuración con valores por defecto
function getConfig(key, defaultValue = null) {
  const keys = key.split('.');
  let value = APP_CONFIG;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

// Función para actualizar configuración
function updateConfig(key, value) {
  const keys = key.split('.');
  let config = APP_CONFIG;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in config) || typeof config[k] !== 'object') {
      config[k] = {};
    }
    config = config[k];
  }
  
  config[keys[keys.length - 1]] = value;
  
  // Guardar en localStorage
  localStorage.setItem('app_config', JSON.stringify(APP_CONFIG));
}

// Cargar configuración personalizada del localStorage
function loadCustomConfig() {
  try {
    const saved = localStorage.getItem('app_config');
    if (saved) {
      const customConfig = JSON.parse(saved);
      Object.assign(APP_CONFIG, customConfig);
    }
  } catch (error) {
    console.warn('Error cargando configuración personalizada:', error);
  }
}

// Inicializar configuración
loadCustomConfig();

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.getConfig = getConfig;
  window.updateConfig = updateConfig;
}