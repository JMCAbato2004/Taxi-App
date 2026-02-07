// Mobile Native Interactions

class MobileNativeUI {
    constructor() {
        this.init();
    }

    init() {
        this.setupTouchFeedback();
        this.setupPullToRefresh();
        this.setupSwipeGestures();
        this.setupHapticFeedback();
        this.setupSafeArea();
    }

    // Touch feedback para todos los elementos interactivos
    setupTouchFeedback() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('button, a, .mobile-card, .mobile-list-item');
            if (target) {
                target.style.opacity = '0.7';
            }
        });

        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('button, a, .mobile-card, .mobile-list-item');
            if (target) {
                setTimeout(() => {
                    target.style.opacity = '1';
                }, 100);
            }
        });
    }

    // Pull to refresh
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            currentY = e.touches[0].pageY;
            const diff = currentY - startY;

            if (diff > 0 && diff < 100) {
                // Mostrar indicador de pull
                const indicator = document.querySelector('.mobile-pull-refresh');
                if (indicator) {
                    indicator.classList.add('active');
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (!pulling) return;
            
            const diff = currentY - startY;
            if (diff > 80) {
                // Trigger refresh
                this.triggerRefresh();
            }

            const indicator = document.querySelector('.mobile-pull-refresh');
            if (indicator) {
                indicator.classList.remove('active');
            }

            pulling = false;
            startY = 0;
            currentY = 0;
        });
    }

    triggerRefresh() {
        // Simular refresh
        this.showToast('Actualizando...', 1000);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    // Swipe gestures para navegación
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        const handleSwipe = () => {
            const swipeThreshold = 100;
            const diff = touchEndX - touchStartX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - volver atrás
                    this.handleSwipeRight();
                } else {
                    // Swipe left - siguiente
                    this.handleSwipeLeft();
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    handleSwipeRight() {
        // Implementar navegación hacia atrás
        if (window.history.length > 1) {
            this.hapticFeedback('light');
        }
    }

    handleSwipeLeft() {
        // Implementar navegación hacia adelante
        this.hapticFeedback('light');
    }

    // Haptic feedback (vibración)
    setupHapticFeedback() {
        // Verificar soporte de vibración
        this.hasVibration = 'vibrate' in navigator;
    }

    hapticFeedback(type = 'light') {
        if (!this.hasVibration) return;

        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'heavy':
                navigator.vibrate(30);
                break;
            case 'success':
                navigator.vibrate([10, 50, 10]);
                break;
            case 'error':
                navigator.vibrate([20, 100, 20]);
                break;
        }
    }

    // Safe area para notch/island
    setupSafeArea() {
        // Detectar si tiene notch
        const hasNotch = window.matchMedia('(display-mode: standalone)').matches;
        
        if (hasNotch) {
            document.documentElement.style.setProperty('--mobile-safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--mobile-safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
    }

    // Toast notifications
    showToast(message, duration = 3000) {
        // Remover toast anterior si existe
        const existingToast = document.querySelector('.mobile-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Crear nuevo toast
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Mostrar con delay para animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        this.hapticFeedback('light');

        // Ocultar y eliminar
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300); // Esperar a que termine la animación
        }, duration);
    }

    // Bottom sheet
    showBottomSheet(content, options = {}) {
        const sheet = document.createElement('div');
        sheet.className = 'mobile-bottom-sheet';
        sheet.innerHTML = `
            <div class="mobile-bottom-sheet-backdrop"></div>
            <div class="mobile-bottom-sheet-content">
                <div class="mobile-bottom-sheet-handle"></div>
                ${content}
            </div>
        `;

        document.body.appendChild(sheet);
        
        setTimeout(() => {
            sheet.classList.add('show');
        }, 10);

        // Cerrar al hacer click en backdrop
        sheet.querySelector('.mobile-bottom-sheet-backdrop').addEventListener('click', () => {
            this.closeBottomSheet(sheet);
        });

        this.hapticFeedback('medium');
    }

    closeBottomSheet(sheet) {
        sheet.classList.remove('show');
        setTimeout(() => {
            sheet.remove();
        }, 300);
    }

    // Action sheet (menú de opciones)
    showActionSheet(options) {
        const actions = options.map(option => `
            <button class="mobile-action-sheet-item" data-action="${option.action}">
                ${option.icon ? `<span class="mobile-action-sheet-icon">${option.icon}</span>` : ''}
                <span class="mobile-action-sheet-label">${option.label}</span>
            </button>
        `).join('');

        const content = `
            <div class="mobile-action-sheet-actions">
                ${actions}
            </div>
            <button class="mobile-action-sheet-cancel">Cancelar</button>
        `;

        this.showBottomSheet(content);

        // Manejar clicks en acciones
        document.querySelectorAll('.mobile-action-sheet-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const option = options.find(o => o.action === action);
                if (option && option.handler) {
                    option.handler();
                }
                this.closeBottomSheet(document.querySelector('.mobile-bottom-sheet'));
            });
        });

        // Cancelar
        document.querySelector('.mobile-action-sheet-cancel').addEventListener('click', () => {
            this.closeBottomSheet(document.querySelector('.mobile-bottom-sheet'));
        });
    }

    // Loading spinner
    showLoading(message = 'Cargando...') {
        const loading = document.createElement('div');
        loading.className = 'mobile-loading';
        loading.innerHTML = `
            <div class="mobile-loading-backdrop"></div>
            <div class="mobile-loading-content">
                <div class="mobile-loading-spinner"></div>
                <div class="mobile-loading-message">${message}</div>
            </div>
        `;
        loading.id = 'mobile-loading';
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('mobile-loading');
        if (loading) {
            loading.remove();
        }
    }

    // Detectar si es móvil
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Detectar si es iOS
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    // Detectar si es Android
    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    // Detectar si está instalado como PWA
    static isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
}

// Estilos adicionales para bottom sheet y action sheet
const additionalStyles = `
<style>
.mobile-bottom-sheet {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    pointer-events: none;
}

.mobile-bottom-sheet.show {
    pointer-events: auto;
}

.mobile-bottom-sheet-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    transition: background 0.3s;
}

.mobile-bottom-sheet.show .mobile-bottom-sheet-backdrop {
    background: rgba(0, 0, 0, 0.5);
}

.mobile-bottom-sheet-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
    transform: translateY(100%);
    transition: transform 0.3s;
    max-height: 80vh;
    overflow-y: auto;
}

.mobile-bottom-sheet.show .mobile-bottom-sheet-content {
    transform: translateY(0);
}

.mobile-bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 0 auto 20px;
}

.mobile-action-sheet-actions {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
}

.mobile-action-sheet-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background: white;
    border: none;
    font-size: 16px;
    color: #1f2937;
    cursor: pointer;
    transition: background 0.2s;
}

.mobile-action-sheet-item:active {
    background: #f3f4f6;
}

.mobile-action-sheet-icon {
    margin-right: 12px;
    font-size: 20px;
}

.mobile-action-sheet-cancel {
    width: 100%;
    padding: 16px;
    background: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #ef4444;
    cursor: pointer;
}

.mobile-action-sheet-cancel:active {
    background: #f3f4f6;
}

.mobile-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mobile-loading-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.mobile-loading-content {
    position: relative;
    background: white;
    padding: 24px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.mobile-loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #059669;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.mobile-loading-message {
    font-size: 14px;
    color: #6b7280;
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileUI = new MobileNativeUI();
    });
} else {
    window.mobileUI = new MobileNativeUI();
}

// Exportar para uso global
window.MobileNativeUI = MobileNativeUI;
