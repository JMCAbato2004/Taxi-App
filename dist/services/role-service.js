// Role Service for managing permissions and associations
import { UserRole, Permission, AuthError, AuthErrorCode, ROLE_PERMISSIONS } from '../types';
import { SensitiveDataConfirmationService, SensitiveOperationType } from './sensitive-data-confirmation';
export class RoleService {
    constructor(getCurrentUser, sensitiveDataService) {
        this.getCurrentUser = getCurrentUser;
        this.ASSOCIATIONS_KEY = 'taxi_associations';
        this.sensitiveDataService = sensitiveDataService || new SensitiveDataConfirmationService();
    }
    getUserRole() {
        const user = this.getCurrentUser();
        return user?.rol || null;
    }
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user)
            return false;
        const userPermissions = ROLE_PERMISSIONS[user.rol];
        return userPermissions.includes(permission);
    }
    getPermissions() {
        const user = this.getCurrentUser();
        if (!user)
            return [];
        return ROLE_PERMISSIONS[user.rol];
    }
    async getAssociatedUsers() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
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
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al obtener usuarios asociados', error);
        }
    }
    async createAssociation(patronId, taxistaId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Verify current user has permission to create associations
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            // Validate users exist and have correct roles
            const users = this.getStoredUsers();
            const patron = users.find(u => u.id === patronId && u.rol === UserRole.PATRON);
            const taxista = users.find(u => u.id === taxistaId && u.rol === UserRole.TAXISTA);
            if (!patron) {
                throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Patrón no encontrado');
            }
            if (!taxista) {
                throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Taxista no encontrado');
            }
            // Check if association already exists
            const existingAssociations = this.getStoredAssociations();
            const existingAssociation = existingAssociations.find(a => a.patronId === patronId && a.taxistaId === taxistaId && a.activa);
            if (existingAssociation) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'La asociación ya existe');
            }
            // Check if taxista is already associated with another patron
            const taxistaAssociations = existingAssociations.filter(a => a.taxistaId === taxistaId && a.activa);
            if (taxistaAssociations.length > 0) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'El taxista ya está asociado a otro patrón');
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
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al crear asociación', error);
        }
    }
    /**
     * Initiate association creation with confirmation requirement
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    async initiateAssociationCreation(patronId, taxistaId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Verify current user has permission to create associations
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            // Pre-validate the association request
            const users = this.getStoredUsers();
            const patron = users.find(u => u.id === patronId && u.rol === UserRole.PATRON);
            const taxista = users.find(u => u.id === taxistaId && u.rol === UserRole.TAXISTA);
            if (!patron) {
                throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Patrón no encontrado');
            }
            if (!taxista) {
                throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Taxista no encontrado');
            }
            // Check if association already exists
            const existingAssociations = this.getStoredAssociations();
            const existingAssociation = existingAssociations.find(a => a.patronId === patronId && a.taxistaId === taxistaId && a.activa);
            if (existingAssociation) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'La asociación ya existe');
            }
            // Check if taxista is already associated with another patron
            const taxistaAssociations = existingAssociations.filter(a => a.taxistaId === taxistaId && a.activa);
            if (taxistaAssociations.length > 0) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'El taxista ya está asociado a otro patrón');
            }
            // Initiate confirmation process
            return await this.sensitiveDataService.initiateConfirmation(currentUser, SensitiveOperationType.ASSOCIATION_CREATE, {
                patronId,
                taxistaId,
                patronNombre: patron.nombre,
                taxistaNombre: taxista.nombre,
                taxistaNumero: taxista.numeroTaxista
            });
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al iniciar creación de asociación', error);
        }
    }
    async removeAssociation(associationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            const associations = this.getStoredAssociations();
            const associationIndex = associations.findIndex(a => a.id === associationId);
            if (associationIndex === -1) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'Asociación no encontrada');
            }
            // Verify the current user owns this association (if patron)
            const association = associations[associationIndex];
            if (association && currentUser.rol === UserRole.PATRON && association.patronId !== currentUser.id) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'No tienes permisos para eliminar esta asociación');
            }
            // Mark association as inactive instead of deleting
            const targetAssociation = associations[associationIndex];
            if (targetAssociation) {
                targetAssociation.activa = false;
                this.storeAssociations(associations);
                // Notify both users about the association removal
                await this.notifyAssociationRemoval(targetAssociation);
            }
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al eliminar asociación', error);
        }
    }
    /**
     * Initiate association removal with confirmation requirement
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    async initiateAssociationRemoval(associationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        if (!this.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para gestionar asociaciones');
        }
        try {
            // Pre-validate the association removal request
            const associations = this.getStoredAssociations();
            const association = associations.find(a => a.id === associationId);
            if (!association) {
                throw new AuthError(AuthErrorCode.INVALID_ASSOCIATION, 'Asociación no encontrada');
            }
            // Verify the current user owns this association (if patron)
            if (currentUser.rol === UserRole.PATRON && association.patronId !== currentUser.id) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'No tienes permisos para eliminar esta asociación');
            }
            // Get user details for confirmation
            const users = this.getStoredUsers();
            const patron = users.find(u => u.id === association.patronId);
            const taxista = users.find(u => u.id === association.taxistaId);
            if (!patron || !taxista) {
                throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuarios de la asociación no encontrados');
            }
            // Initiate confirmation process
            return await this.sensitiveDataService.initiateConfirmation(currentUser, SensitiveOperationType.ASSOCIATION_REMOVE, {
                associationId,
                patronId: association.patronId,
                taxistaId: association.taxistaId,
                patronNombre: patron.nombre,
                taxistaNombre: taxista.nombre,
                taxistaNumero: taxista.numeroTaxista,
                fechaAsociacion: association.fechaAsociacion
            });
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al iniciar eliminación de asociación', error);
        }
    }
    /**
     * Execute confirmed association creation
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    async executeConfirmedAssociationCreation(confirmationRequestId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        try {
            // Execute the confirmed operation
            const result = await this.sensitiveDataService.executeConfirmedOperation(confirmationRequestId, currentUser);
            if (result.operationType === SensitiveOperationType.ASSOCIATION_CREATE) {
                const { patronId, taxistaId } = result.operationData;
                return await this.createAssociation(patronId, taxistaId);
            }
            throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Tipo de operación inválido para creación de asociación');
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al ejecutar creación de asociación confirmada', error);
        }
    }
    /**
     * Execute confirmed association removal
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    async executeConfirmedAssociationRemoval(confirmationRequestId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        try {
            // Execute the confirmed operation
            const result = await this.sensitiveDataService.executeConfirmedOperation(confirmationRequestId, currentUser);
            if (result.operationType === SensitiveOperationType.ASSOCIATION_REMOVE) {
                const { associationId } = result.operationData;
                await this.removeAssociation(associationId);
            }
            else {
                throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Tipo de operación inválido para eliminación de asociación');
            }
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al ejecutar eliminación de asociación confirmada', error);
        }
    }
    filterDataByRole(data, userContext) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return [];
        // If no data to filter, return empty array
        if (!data || data.length === 0)
            return [];
        try {
            // For Patrones: filter data to show only data from associated taxistas
            if (currentUser.rol === UserRole.PATRON) {
                return this.filterDataForPatron(data, currentUser, userContext);
            }
            // For Taxistas: filter data to show only their own data
            if (currentUser.rol === UserRole.TAXISTA) {
                return this.filterDataForTaxista(data, currentUser, userContext);
            }
            // Default: return empty array for unknown roles
            return [];
        }
        catch (error) {
            console.error('Error filtering data by role:', error);
            return [];
        }
    }
    /**
     * Filter data for Patron users - show data from associated taxistas
     */
    filterDataForPatron(data, patron, userContext) {
        try {
            // Get associated taxista IDs
            const associations = this.getStoredAssociations();
            const associatedTaxistaIds = associations
                .filter(a => a.patronId === patron.id && a.activa)
                .map(a => a.taxistaId);
            // If no associations, return empty array
            if (associatedTaxistaIds.length === 0)
                return [];
            // Filter data based on common patterns for operational data
            return data.filter(item => {
                // Handle different data structures that might contain user/taxista references
                const itemAny = item;
                // Pattern 1: Direct userId field
                if (itemAny.userId && associatedTaxistaIds.includes(itemAny.userId)) {
                    return true;
                }
                // Pattern 2: taxistaId field
                if (itemAny.taxistaId && associatedTaxistaIds.includes(itemAny.taxistaId)) {
                    return true;
                }
                // Pattern 3: createdBy field (for data created by taxistas)
                if (itemAny.createdBy && associatedTaxistaIds.includes(itemAny.createdBy)) {
                    return true;
                }
                // Pattern 4: numeroTaxista field (match by taxista number)
                if (itemAny.numeroTaxista) {
                    const users = this.getStoredUsers();
                    const taxistaWithNumber = users.find(u => u.numeroTaxista === itemAny.numeroTaxista &&
                        associatedTaxistaIds.includes(u.id));
                    if (taxistaWithNumber)
                        return true;
                }
                // Pattern 5: Custom context-based filtering
                if (userContext && userContext.userIdField) {
                    const fieldValue = itemAny[userContext.userIdField];
                    if (fieldValue && associatedTaxistaIds.includes(fieldValue)) {
                        return true;
                    }
                }
                // Pattern 6: Data owned by the patron themselves
                if (itemAny.userId === patron.id || itemAny.createdBy === patron.id) {
                    return true;
                }
                return false;
            });
        }
        catch (error) {
            console.error('Error filtering data for patron:', error);
            return [];
        }
    }
    /**
     * Filter data for Taxista users - show only their own data
     */
    filterDataForTaxista(data, taxista, userContext) {
        try {
            return data.filter(item => {
                const itemAny = item;
                // Pattern 1: Direct userId field
                if (itemAny.userId === taxista.id) {
                    return true;
                }
                // Pattern 2: taxistaId field
                if (itemAny.taxistaId === taxista.id) {
                    return true;
                }
                // Pattern 3: createdBy field
                if (itemAny.createdBy === taxista.id) {
                    return true;
                }
                // Pattern 4: numeroTaxista field (match by taxista number)
                if (itemAny.numeroTaxista === taxista.numeroTaxista) {
                    return true;
                }
                // Pattern 5: Custom context-based filtering
                if (userContext && userContext.userIdField) {
                    const fieldValue = itemAny[userContext.userIdField];
                    if (fieldValue === taxista.id) {
                        return true;
                    }
                }
                return false;
            });
        }
        catch (error) {
            console.error('Error filtering data for taxista:', error);
            return [];
        }
    }
    async searchAvailableTaxistas(searchTerm) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Solo los patrones pueden buscar taxistas');
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
            // Transform to AvailableTaxista format
            return availableTaxistas.map(u => ({
                id: u.id,
                email: u.email,
                nombre: u.nombre,
                telefono: u.telefono ?? undefined,
                numeroTaxista: u.numeroTaxista,
                fechaCreacion: u.fechaCreacion
            }));
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al buscar taxistas disponibles', error);
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
    /**
     * Check if current user can access data from a specific user
     */
    canAccessUserData(targetUserId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return false;
        // Users can always access their own data
        if (currentUser.id === targetUserId)
            return true;
        // Patrones can access data from their associated taxistas
        if (currentUser.rol === UserRole.PATRON) {
            const associations = this.getStoredAssociations();
            return associations.some(a => a.patronId === currentUser.id &&
                a.taxistaId === targetUserId &&
                a.activa);
        }
        // Taxistas cannot access other users' data
        return false;
    }
    /**
     * Get filtered user list based on current user's permissions
     */
    getAccessibleUsers() {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return [];
        const allUsers = this.getStoredUsers();
        if (currentUser.rol === UserRole.PATRON) {
            // Patrones can see themselves and their associated taxistas
            const associations = this.getStoredAssociations();
            const associatedTaxistaIds = associations
                .filter(a => a.patronId === currentUser.id && a.activa)
                .map(a => a.taxistaId);
            return allUsers.filter(u => u.id === currentUser.id || associatedTaxistaIds.includes(u.id));
        }
        if (currentUser.rol === UserRole.TAXISTA) {
            // Taxistas can only see themselves
            return allUsers.filter(u => u.id === currentUser.id);
        }
        return [];
    }
    /**
     * Validate if current user can perform an operation on target data
     */
    validateDataAccess(targetData, operation = 'read') {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return false;
        // Extract user ID from target data using common patterns
        let targetUserId = null;
        if (targetData.userId)
            targetUserId = targetData.userId;
        else if (targetData.taxistaId)
            targetUserId = targetData.taxistaId;
        else if (targetData.createdBy)
            targetUserId = targetData.createdBy;
        else if (targetData.numeroTaxista) {
            // Find user by taxista number
            const users = this.getStoredUsers();
            const user = users.find(u => u.numeroTaxista === targetData.numeroTaxista);
            if (user)
                targetUserId = user.id;
        }
        if (!targetUserId)
            return false;
        // Check basic access permission
        if (!this.canAccessUserData(targetUserId))
            return false;
        // Additional checks based on operation type
        switch (operation) {
            case 'read':
                return this.hasPermission(Permission.VIEW_OWN_DATA) ||
                    this.hasPermission(Permission.VIEW_ALL_DRIVERS);
            case 'write':
                // Users can only write their own data, patrones cannot modify taxista data directly
                return targetUserId === currentUser.id &&
                    (this.hasPermission(Permission.EDIT_OWN_PROFILE) ||
                        this.hasPermission(Permission.INPUT_OPERATIONAL_DATA));
            case 'delete':
                // Similar to write - only own data
                return targetUserId === currentUser.id &&
                    (this.hasPermission(Permission.EDIT_OWN_PROFILE) ||
                        this.hasPermission(Permission.INPUT_OPERATIONAL_DATA));
            default:
                return false;
        }
    }
    /**
     * Get aggregated data summary for patrones
     */
    getAggregatedDataSummary(data, aggregationField = 'amount') {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            return null;
        }
        const filteredData = this.filterDataByRole(data);
        if (filteredData.length === 0) {
            return {
                totalRecords: 0,
                totalAmount: 0,
                averageAmount: 0,
                associatedTaxistas: 0
            };
        }
        // Calculate aggregations
        const totalAmount = filteredData.reduce((sum, item) => {
            const value = item[aggregationField];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        // Count unique taxistas in the data (exclude patron)
        const uniqueTaxistas = new Set();
        const users = this.getStoredUsers();
        filteredData.forEach((item) => {
            let userId = null;
            if (item.userId)
                userId = item.userId;
            else if (item.taxistaId)
                userId = item.taxistaId;
            else if (item.createdBy)
                userId = item.createdBy;
            if (userId && userId !== currentUser.id) {
                // Only count if it's a taxista, not the patron
                const user = users.find(u => u.id === userId);
                if (user && user.rol === UserRole.TAXISTA) {
                    uniqueTaxistas.add(userId);
                }
            }
        });
        return {
            totalRecords: filteredData.length,
            totalAmount,
            averageAmount: filteredData.length > 0 ? totalAmount / filteredData.length : 0,
            associatedTaxistas: uniqueTaxistas.size
        };
    }
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
    async notifyAssociationRemoval(association) {
        try {
            const users = this.getStoredUsers();
            const patron = users.find(u => u.id === association.patronId);
            const taxista = users.find(u => u.id === association.taxistaId);
            if (!patron || !taxista) {
                console.warn('Could not find users for association removal notification');
                return;
            }
            const notifications = this.getStoredNotifications();
            // Notify taxista about association removal
            const taxistaNotification = {
                id: this.generateNotificationId(),
                userId: taxista.id,
                type: 'association_removed',
                title: 'Asociación Terminada',
                message: `Tu asociación con el patrón ${patron.nombre} ha sido terminada. Mantienes acceso a tu cuenta personal.`,
                timestamp: new Date(),
                read: false,
                data: {
                    patronId: patron.id,
                    patronNombre: patron.nombre,
                    patronEmail: patron.email,
                    removalDate: new Date()
                }
            };
            // Notify patron about association removal
            const patronNotification = {
                id: this.generateNotificationId(),
                userId: patron.id,
                type: 'association_removed',
                title: 'Asociación Terminada',
                message: `Has terminado la asociación con el taxista ${taxista.nombre} (${taxista.numeroTaxista}).`,
                timestamp: new Date(),
                read: false,
                data: {
                    taxistaId: taxista.id,
                    taxistaNombre: taxista.nombre,
                    taxistaEmail: taxista.email,
                    taxistaNumero: taxista.numeroTaxista,
                    removalDate: new Date()
                }
            };
            notifications.push(taxistaNotification, patronNotification);
            this.storeNotifications(notifications);
            console.log(`✓ Association removal notifications sent for ${taxista.nombre} and ${patron.nombre}`);
        }
        catch (error) {
            console.error('Error sending association removal notification:', error);
        }
    }
    /**
     * Get notifications for current user
     */
    getNotifications(unreadOnly = false) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return [];
        try {
            const allNotifications = this.getStoredNotifications();
            let userNotifications = allNotifications.filter(n => n.userId === currentUser.id);
            if (unreadOnly) {
                userNotifications = userNotifications.filter(n => !n.read);
            }
            // Sort by timestamp, newest first
            return userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return false;
        try {
            const notifications = this.getStoredNotifications();
            const notification = notifications.find(n => n.id === notificationId && n.userId === currentUser.id);
            if (notification) {
                notification.read = true;
                this.storeNotifications(notifications);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }
    /**
     * Mark all notifications as read for current user
     */
    markAllNotificationsAsRead() {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return 0;
        try {
            const notifications = this.getStoredNotifications();
            let markedCount = 0;
            notifications.forEach(n => {
                if (n.userId === currentUser.id && !n.read) {
                    n.read = true;
                    markedCount++;
                }
            });
            if (markedCount > 0) {
                this.storeNotifications(notifications);
            }
            return markedCount;
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            return 0;
        }
    }
    /**
     * Get count of unread notifications for current user
     */
    getUnreadNotificationCount() {
        return this.getNotifications(true).length;
    }
    /**
     * Enhanced search for available taxistas with additional filters
     */
    async searchAvailableTaxistasAdvanced(options = {}) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Solo los patrones pueden buscar taxistas');
        }
        try {
            let availableTaxistas = await this.searchAvailableTaxistas(options.searchTerm);
            // Apply sorting
            if (options.sortBy) {
                availableTaxistas.sort((a, b) => {
                    let aValue = a[options.sortBy];
                    let bValue = b[options.sortBy];
                    // Handle date sorting
                    if (options.sortBy === 'fechaCreacion') {
                        aValue = new Date(aValue).getTime();
                        bValue = new Date(bValue).getTime();
                    }
                    else {
                        // String sorting
                        aValue = String(aValue).toLowerCase();
                        bValue = String(bValue).toLowerCase();
                    }
                    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                    return options.sortOrder === 'desc' ? -comparison : comparison;
                });
            }
            // Apply limit
            if (options.limit && options.limit > 0) {
                availableTaxistas = availableTaxistas.slice(0, options.limit);
            }
            return availableTaxistas;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error en búsqueda avanzada de taxistas', error);
        }
    }
    /**
     * Get association statistics for current patron
     */
    getAssociationStatistics() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            return null;
        }
        try {
            const associations = this.getStoredAssociations();
            const patronAssociations = associations.filter(a => a.patronId === currentUser.id);
            const activeAssociations = patronAssociations.filter(a => a.activa);
            const inactiveAssociations = patronAssociations.filter(a => !a.activa);
            // Calculate associations created in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentAssociations = patronAssociations.filter(a => new Date(a.fechaAsociacion) >= thirtyDaysAgo);
            return {
                totalAssociations: patronAssociations.length,
                activeAssociations: activeAssociations.length,
                inactiveAssociations: inactiveAssociations.length,
                recentAssociations: recentAssociations.length,
                oldestAssociation: patronAssociations.length > 0
                    ? new Date(Math.min(...patronAssociations.map(a => new Date(a.fechaAsociacion).getTime())))
                    : null,
                newestAssociation: patronAssociations.length > 0
                    ? new Date(Math.max(...patronAssociations.map(a => new Date(a.fechaAsociacion).getTime())))
                    : null
            };
        }
        catch (error) {
            console.error('Error getting association statistics:', error);
            return null;
        }
    }
    generateNotificationId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }
    generateAssociationId() {
        return 'assoc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }
    async notifyTaxistaOfAssociation(taxista, patron) {
        try {
            // Store notification for the taxista
            const notifications = this.getStoredNotifications();
            const notification = {
                id: this.generateNotificationId(),
                userId: taxista.id,
                type: 'association_created',
                title: 'Nueva Asociación',
                message: `Has sido asociado con el patrón ${patron.nombre}. Ahora puedes introducir datos operativos bajo su supervisión.`,
                timestamp: new Date(),
                read: false,
                data: {
                    patronId: patron.id,
                    patronNombre: patron.nombre,
                    patronEmail: patron.email,
                    associationDate: new Date()
                }
            };
            notifications.push(notification);
            this.storeNotifications(notifications);
            // Also notify the patron about the successful association
            const patronNotification = {
                id: this.generateNotificationId(),
                userId: patron.id,
                type: 'association_created',
                title: 'Asociación Creada',
                message: `Has asociado exitosamente al taxista ${taxista.nombre} (${taxista.numeroTaxista}).`,
                timestamp: new Date(),
                read: false,
                data: {
                    taxistaId: taxista.id,
                    taxistaNombre: taxista.nombre,
                    taxistaEmail: taxista.email,
                    taxistaNumero: taxista.numeroTaxista,
                    associationDate: new Date()
                }
            };
            notifications.push(patronNotification);
            this.storeNotifications(notifications);
            // In a real implementation, this would also send push notifications, emails, etc.
            console.log(`✓ Notification sent: ${taxista.nombre} associated with ${patron.nombre}`);
        }
        catch (error) {
            console.error('Error sending association notification:', error);
            // Don't throw error - notification failure shouldn't break association creation
        }
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