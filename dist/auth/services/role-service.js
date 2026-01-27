// Role Service for managing permissions and associations
import { UserRole, Permission, AuthError, AuthErrorCodes } from '../types';
export class RoleService {
    constructor(getCurrentUser) {
        this.getCurrentUser = getCurrentUser;
        this.ASSOCIATIONS_KEY = 'taxi_associations';
    }
    getUserRole() {
        const user = this.getCurrentUser();
        return user?.rol || null;
    }
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user)
            return false;
        return user.permissions.includes(permission);
    }
    async getAssociatedUsers() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCodes.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        try {
            if (currentUser.rol === UserRole.PATRON) {
                // Get all taxistas associated with this patron
                const associations = await this.getAssociationsForPatron(currentUser.id);
                const users = this.getStoredUsers();
                return associations
                    .filter(a => a.activa)
                    .map(a => users.find(u => u.id === a.taxistaId))
                    .filter((user) => user !== undefined);
            }
            else if (currentUser.rol === UserRole.TAXISTA) {
                // Get all patrones associated with this taxista
                const associations = await this.getAssociationsForTaxista(currentUser.id);
                const users = this.getStoredUsers();
                return associations
                    .filter(a => a.activa)
                    .map(a => users.find(u => u.id === a.patronId))
                    .filter((user) => user !== undefined);
            }
            return [];
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al obtener usuarios asociados', error);
        }
    }
    async createAssociation(patronId, taxistaId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCodes.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Verify current user has permission to create associations
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCodes.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            // Validate users exist and have correct roles
            const users = this.getStoredUsers();
            const patron = users.find(u => u.id === patronId && u.rol === UserRole.PATRON);
            const taxista = users.find(u => u.id === taxistaId && u.rol === UserRole.TAXISTA);
            if (!patron) {
                throw new AuthError(AuthErrorCodes.USER_NOT_FOUND, 'Patrón no encontrado');
            }
            if (!taxista) {
                throw new AuthError(AuthErrorCodes.USER_NOT_FOUND, 'Taxista no encontrado');
            }
            // Check if association already exists
            const existingAssociations = this.getStoredAssociations();
            const existingAssociation = existingAssociations.find(a => a.patronId === patronId && a.taxistaId === taxistaId && a.activa);
            if (existingAssociation) {
                throw new AuthError(AuthErrorCodes.INVALID_ASSOCIATION, 'La asociación ya existe');
            }
            // Check if taxista is already associated with another patron
            const taxistaAssociations = existingAssociations.filter(a => a.taxistaId === taxistaId && a.activa);
            if (taxistaAssociations.length > 0) {
                throw new AuthError(AuthErrorCodes.INVALID_ASSOCIATION, 'El taxista ya está asociado a otro patrón');
            }
            // Create new association
            const newAssociation = {
                id: this.generateAssociationId(),
                patronId,
                taxistaId,
                fechaAsociacion: new Date(),
                activa: true
            };
            existingAssociations.push(newAssociation);
            this.storeAssociations(existingAssociations);
            // In a real implementation, send notification to taxista
            await this.notifyTaxistaOfAssociation(taxista, patron);
            return newAssociation;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al crear asociación', error);
        }
    }
    async removeAssociation(associationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCodes.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCodes.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            const associations = this.getStoredAssociations();
            const associationIndex = associations.findIndex(a => a.id === associationId);
            if (associationIndex === -1) {
                throw new AuthError(AuthErrorCodes.INVALID_ASSOCIATION, 'Asociación no encontrada');
            }
            // Verify the current user owns this association (if patron)
            const association = associations[associationIndex];
            if (currentUser.rol === UserRole.PATRON && association.patronId !== currentUser.id) {
                throw new AuthError(AuthErrorCodes.INSUFFICIENT_PERMISSIONS, 'No tienes permisos para eliminar esta asociación');
            }
            // Mark association as inactive instead of deleting
            associations[associationIndex].activa = false;
            this.storeAssociations(associations);
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al eliminar asociación', error);
        }
    }
    filterDataByRole(data, userContext) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return [];
        // This is a generic filtering method that would be customized
        // based on the specific data type and business rules
        // For now, return all data - specific filtering logic would be
        // implemented in the calling components
        return data;
    }
    async searchAvailableTaxistas(searchTerm) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            throw new AuthError(AuthErrorCodes.INSUFFICIENT_PERMISSIONS, 'Solo los patrones pueden buscar taxistas');
        }
        try {
            const users = this.getStoredUsers();
            const associations = this.getStoredAssociations();
            // Get IDs of taxistas that are already associated
            const associatedTaxistaIds = associations
                .filter(a => a.activa)
                .map(a => a.taxistaId);
            // Filter available taxistas
            let availableTaxistas = users.filter(u => u.rol === UserRole.TAXISTA &&
                u.activo &&
                !associatedTaxistaIds.includes(u.id));
            // Apply search filter if provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                availableTaxistas = availableTaxistas.filter(u => u.nombre.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term) ||
                    (u.numeroTaxista && u.numeroTaxista.toLowerCase().includes(term)));
            }
            return availableTaxistas;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al buscar taxistas disponibles', error);
        }
    }
    async getAssociationsForPatron(patronId) {
        const associations = this.getStoredAssociations();
        return associations.filter(a => a.patronId === patronId);
    }
    async getAssociationsForTaxista(taxistaId) {
        const associations = this.getStoredAssociations();
        return associations.filter(a => a.taxistaId === taxistaId);
    }
    // Private helper methods
    getStoredUsers() {
        try {
            const stored = localStorage.getItem('taxi_users');
            if (!stored)
                return [];
            const users = JSON.parse(stored);
            return users.map((user) => ({
                ...user,
                fechaCreacion: new Date(user.fechaCreacion),
                fechaActualizacion: new Date(user.fechaActualizacion)
            }));
        }
        catch {
            return [];
        }
    }
    getStoredAssociations() {
        try {
            const stored = localStorage.getItem(this.ASSOCIATIONS_KEY);
            if (!stored)
                return [];
            const associations = JSON.parse(stored);
            return associations.map((assoc) => ({
                ...assoc,
                fechaAsociacion: new Date(assoc.fechaAsociacion)
            }));
        }
        catch {
            return [];
        }
    }
    storeAssociations(associations) {
        try {
            localStorage.setItem(this.ASSOCIATIONS_KEY, JSON.stringify(associations));
        }
        catch (error) {
            console.error('Error storing associations:', error);
        }
    }
    generateAssociationId() {
        return 'assoc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    async notifyTaxistaOfAssociation(taxista, patron) {
        // In a real implementation, this would send a notification
        // For now, we'll just log it
        console.log(`Notification: ${taxista.nombre} has been associated with ${patron.nombre}`);
        // Could also store notifications in localStorage for offline support
        const notifications = this.getStoredNotifications();
        notifications.push({
            id: Date.now().toString(),
            userId: taxista.id,
            type: 'association_created',
            message: `Has sido asociado con el patrón ${patron.nombre}`,
            timestamp: new Date(),
            read: false
        });
        this.storeNotifications(notifications);
    }
    getStoredNotifications() {
        try {
            const stored = localStorage.getItem('taxi_notifications');
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    }
    storeNotifications(notifications) {
        try {
            localStorage.setItem('taxi_notifications', JSON.stringify(notifications));
        }
        catch (error) {
            console.error('Error storing notifications:', error);
        }
    }
}
//# sourceMappingURL=role-service.js.map