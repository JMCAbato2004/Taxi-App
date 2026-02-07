// RGPD Compliance Manager
class RGPDManager {
    constructor() {
        this.consentKey = 'taxi_rgpd_consent';
        this.consentLogKey = 'taxi_rgpd_consent_log';
        this.init();
    }

    init() {
        this.checkConsent();
    }

    checkConsent() {
        const consent = this.getConsent();
        if (!consent || !consent.accepted) {
            this.showConsentBanner();
        }
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'rgpd-banner';
        banner.className = 'rgpd-banner';
        banner.innerHTML = `
            <div class="rgpd-content">
                <div class="rgpd-text">
                    <h3>🔒 Protección de Datos</h3>
                    <p>
                        Utilizamos localStorage para almacenar tus datos de forma local en tu dispositivo. 
                        No compartimos información con terceros. Tus datos permanecen en tu navegador.
                    </p>
                    <p class="rgpd-links">
                        <a href="politica-privacidad.html" target="_blank">Política de Privacidad</a> | 
                        <a href="terminos-condiciones.html" target="_blank">Términos y Condiciones</a>
                    </p>
                </div>
                <div class="rgpd-actions">
                    <button id="rgpd-accept" class="rgpd-btn rgpd-btn-accept">
                        ✓ Aceptar
                    </button>
                    <button id="rgpd-reject" class="rgpd-btn rgpd-btn-reject">
                        ✗ Rechazar
                    </button>
                    <button id="rgpd-customize" class="rgpd-btn rgpd-btn-customize">
                        ⚙️ Personalizar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('rgpd-accept').addEventListener('click', () => this.acceptAll());
        document.getElementById('rgpd-reject').addEventListener('click', () => this.rejectAll());
        document.getElementById('rgpd-customize').addEventListener('click', () => this.showCustomizeModal());
    }

    showCustomizeModal() {
        const modal = document.createElement('div');
        modal.id = 'rgpd-modal';
        modal.className = 'rgpd-modal';
        modal.innerHTML = `
            <div class="rgpd-modal-content">
                <h3>Personalizar Consentimiento</h3>
                <div class="rgpd-options">
                    <div class="rgpd-option">
                        <label>
                            <input type="checkbox" id="consent-necessary" checked disabled>
                            <strong>Cookies Necesarias</strong>
                            <p>Esenciales para el funcionamiento de la aplicación (autenticación, sesión)</p>
                        </label>
                    </div>
                    <div class="rgpd-option">
                        <label>
                            <input type="checkbox" id="consent-functional" checked>
                            <strong>Cookies Funcionales</strong>
                            <p>Mejoran la experiencia del usuario (preferencias, configuración)</p>
                        </label>
                    </div>
                    <div class="rgpd-option">
                        <label>
                            <input type="checkbox" id="consent-analytics">
                            <strong>Cookies Analíticas</strong>
                            <p>Nos ayudan a entender cómo usas la aplicación (deshabilitado por defecto)</p>
                        </label>
                    </div>
                </div>
                <div class="rgpd-modal-actions">
                    <button id="rgpd-save-custom" class="rgpd-btn rgpd-btn-accept">Guardar Preferencias</button>
                    <button id="rgpd-cancel" class="rgpd-btn rgpd-btn-reject">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('rgpd-save-custom').addEventListener('click', () => this.saveCustomConsent());
        document.getElementById('rgpd-cancel').addEventListener('click', () => modal.remove());
    }

    acceptAll() {
        const consent = {
            accepted: true,
            necessary: true,
            functional: true,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        this.saveConsent(consent);
        this.removeBanner();
    }

    rejectAll() {
        const consent = {
            accepted: false,
            necessary: true, // Siempre necesarias
            functional: false,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        this.saveConsent(consent);
        this.removeBanner();
        alert('Has rechazado el uso de cookies. Algunas funcionalidades pueden estar limitadas.');
    }

    saveCustomConsent() {
        const consent = {
            accepted: true,
            necessary: true,
            functional: document.getElementById('consent-functional').checked,
            analytics: document.getElementById('consent-analytics').checked,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        this.saveConsent(consent);
        this.removeBanner();
        document.getElementById('rgpd-modal')?.remove();
    }

    saveConsent(consent) {
        localStorage.setItem(this.consentKey, JSON.stringify(consent));
        this.logConsent(consent);
    }

    logConsent(consent) {
        const log = JSON.parse(localStorage.getItem(this.consentLogKey) || '[]');
        log.push({
            ...consent,
            logTimestamp: new Date().toISOString()
        });
        localStorage.setItem(this.consentLogKey, JSON.stringify(log));
    }

    getConsent() {
        const stored = localStorage.getItem(this.consentKey);
        return stored ? JSON.parse(stored) : null;
    }

    removeBanner() {
        document.getElementById('rgpd-banner')?.remove();
    }

    // Derecho al olvido - Eliminar todos los datos del usuario
    deleteAllUserData(userId) {
        if (!confirm('¿Estás seguro de que deseas eliminar todos tus datos? Esta acción no se puede deshacer.')) {
            return false;
        }

        // Eliminar usuario de la lista
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('taxi_users', JSON.stringify(filteredUsers));

        // Eliminar servicios del usuario
        const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
        const filteredServices = services.filter(s => s.taxistaId !== userId);
        localStorage.setItem('taxi_services', JSON.stringify(filteredServices));

        // Eliminar gastos del usuario
        const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
        const filteredExpenses = expenses.filter(e => e.taxistaId !== userId);
        localStorage.setItem('taxi_expenses', JSON.stringify(filteredExpenses));

        // Eliminar solicitudes
        const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
        const filteredRequests = requests.filter(r => r.taxistaId !== userId && r.patronId !== userId);
        localStorage.setItem('taxi_join_requests', JSON.stringify(filteredRequests));

        // Cerrar sesión
        localStorage.removeItem('taxi_auth_current_user');

        // Log de eliminación
        this.logDataDeletion(userId);

        alert('Todos tus datos han sido eliminados correctamente.');
        window.location.href = 'index.html';
        return true;
    }

    logDataDeletion(userId) {
        const log = JSON.parse(localStorage.getItem('taxi_rgpd_deletion_log') || '[]');
        log.push({
            userId: userId,
            timestamp: new Date().toISOString(),
            action: 'DATA_DELETION'
        });
        localStorage.setItem('taxi_rgpd_deletion_log', JSON.stringify(log));
    }

    // Exportar datos personales (Derecho de portabilidad)
    exportUserData(userId) {
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const user = users.find(u => u.id === userId);

        if (!user) {
            alert('Usuario no encontrado');
            return;
        }

        const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
        const userServices = services.filter(s => s.taxistaId === userId);

        const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
        const userExpenses = expenses.filter(e => e.taxistaId === userId);

        const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
        const userRequests = requests.filter(r => r.taxistaId === userId || r.patronId === userId);

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                ...user,
                password: '[REDACTED]' // No exportar contraseña
            },
            services: userServices,
            expenses: userExpenses,
            requests: userRequests,
            consent: this.getConsent(),
            consentLog: JSON.parse(localStorage.getItem(this.consentLogKey) || '[]')
        };

        // Crear archivo JSON para descarga
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis-datos-taxi-${userId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Tus datos han sido exportados correctamente.');
    }

    // Mostrar configuración de privacidad
    showPrivacySettings(userId) {
        const modal = document.createElement('div');
        modal.id = 'privacy-settings-modal';
        modal.className = 'rgpd-modal';
        modal.innerHTML = `
            <div class="rgpd-modal-content" style="max-width: 600px;">
                <h3>⚙️ Configuración de Privacidad</h3>
                <div class="privacy-section">
                    <h4>Tus Derechos RGPD</h4>
                    <ul class="privacy-rights">
                        <li>✓ Derecho de acceso a tus datos</li>
                        <li>✓ Derecho de rectificación</li>
                        <li>✓ Derecho de supresión (derecho al olvido)</li>
                        <li>✓ Derecho de portabilidad</li>
                        <li>✓ Derecho de oposición</li>
                    </ul>
                </div>
                <div class="privacy-actions">
                    <button id="export-data-btn" class="rgpd-btn rgpd-btn-accept">
                        📥 Exportar Mis Datos
                    </button>
                    <button id="manage-consent-btn" class="rgpd-btn rgpd-btn-customize">
                        🔧 Gestionar Consentimiento
                    </button>
                    <button id="delete-data-btn" class="rgpd-btn rgpd-btn-reject">
                        🗑️ Eliminar Todos Mis Datos
                    </button>
                </div>
                <div class="privacy-info">
                    <p><strong>Responsable del tratamiento:</strong> Control de Taxi</p>
                    <p><strong>Finalidad:</strong> Gestión de servicios de taxi</p>
                    <p><strong>Almacenamiento:</strong> Local (tu navegador)</p>
                    <p><strong>Contacto:</strong> <a href="mailto:privacidad@controltaxi.es">privacidad@controltaxi.es</a></p>
                </div>
                <button id="close-privacy-modal" class="rgpd-btn rgpd-btn-customize">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportUserData(userId);
        });

        document.getElementById('manage-consent-btn').addEventListener('click', () => {
            modal.remove();
            this.showCustomizeModal();
        });

        document.getElementById('delete-data-btn').addEventListener('click', () => {
            if (this.deleteAllUserData(userId)) {
                modal.remove();
            }
        });

        document.getElementById('close-privacy-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Inicializar RGPD Manager
window.rgpdManager = new RGPDManager();
