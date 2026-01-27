// Authentication Service Interface and Implementation
import { UserRole, Permission, AuthError, AuthErrorCodes } from '../types';
export class AuthService {
    constructor(jwtUtils, cryptoUtils, validationUtils) {
        this.jwtUtils = jwtUtils;
        this.cryptoUtils = cryptoUtils;
        this.validationUtils = validationUtils;
        this.currentUser = null;
        this.currentToken = null;
        this.STORAGE_KEY = 'taxi_auth_data';
        this.OFFLINE_KEY = 'taxi_offline_auth';
        this.loadStoredAuth();
    }
    async login(credentials) {
        try {
            // Validate input
            this.validationUtils.validateLoginCredentials(credentials);
            // In a real implementation, this would make an API call
            // For now, we'll simulate the authentication process
            const user = await this.authenticateUser(credentials);
            if (!user) {
                throw new AuthError(AuthErrorCodes.INVALID_CREDENTIALS, 'Credenciales inválidas');
            }
            // Generate tokens
            const token = this.jwtUtils.generateToken(user);
            const refreshToken = this.jwtUtils.generateRefreshToken(user);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            const authResult = {
                user,
                token,
                refreshToken,
                expiresAt
            };
            // Store authentication data
            this.currentUser = user;
            this.currentToken = token;
            this.storeAuthData(authResult);
            return authResult;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error durante el inicio de sesión', error);
        }
    }
    async logout() {
        try {
            // Clear current session
            this.currentUser = null;
            this.currentToken = null;
            // Clear stored data
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.OFFLINE_KEY);
            // In a real implementation, invalidate server-side session
            // await this.invalidateServerSession();
        }
        catch (error) {
            console.error('Error during logout:', error);
            // Even if server logout fails, clear local data
            this.currentUser = null;
            this.currentToken = null;
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.OFFLINE_KEY);
        }
    }
    async register(userData) {
        try {
            // Validate input
            this.validationUtils.validateRegisterData(userData);
            // Check for duplicate email (in real implementation, this would be server-side)
            if (await this.emailExists(userData.email)) {
                throw new AuthError(AuthErrorCodes.DUPLICATE_EMAIL, 'El email ya está registrado');
            }
            // Hash password
            const hashedPassword = await this.cryptoUtils.hashPassword(userData.password);
            // Create user
            const user = await this.createUser({
                ...userData,
                password: hashedPassword
            });
            // Generate tokens
            const token = this.jwtUtils.generateToken(user);
            const refreshToken = this.jwtUtils.generateRefreshToken(user);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const authResult = {
                user,
                token,
                refreshToken,
                expiresAt
            };
            // Store authentication data
            this.currentUser = user;
            this.currentToken = token;
            this.storeAuthData(authResult);
            return authResult;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error durante el registro', error);
        }
    }
    getCurrentUser() {
        return this.currentUser;
    }
    isAuthenticated() {
        if (!this.currentUser || !this.currentToken) {
            return false;
        }
        // Check if token is still valid
        try {
            const payload = this.jwtUtils.verifyToken(this.currentToken);
            return payload.exp > Date.now() / 1000;
        }
        catch {
            return false;
        }
    }
    async refreshToken() {
        try {
            const storedData = this.getStoredAuthData();
            if (!storedData || !storedData.refreshToken) {
                throw new AuthError(AuthErrorCodes.SESSION_EXPIRED, 'Sesión expirada');
            }
            // In a real implementation, validate refresh token with server
            const newToken = this.jwtUtils.generateToken(storedData.user);
            this.currentToken = newToken;
            // Update stored data
            const updatedAuthResult = {
                ...storedData,
                token: newToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };
            this.storeAuthData(updatedAuthResult);
            return newToken;
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al renovar token', error);
        }
    }
    validateOfflineAccess() {
        const offlineData = this.getOfflineAuthData();
        if (!offlineData) {
            return false;
        }
        // Check if offline data is still valid (e.g., within 7 days)
        const maxOfflineTime = 7 * 24 * 60 * 60 * 1000; // 7 days
        const timeSinceLastSync = Date.now() - offlineData.lastSync.getTime();
        return timeSinceLastSync < maxOfflineTime;
    }
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new AuthError(AuthErrorCodes.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        try {
            // Validate new password
            this.validationUtils.validatePassword(newPassword);
            // In a real implementation, verify current password and update
            // For now, we'll simulate the process
            const hashedNewPassword = await this.cryptoUtils.hashPassword(newPassword);
            // Update password (would be API call in real implementation)
            await this.updateUserPassword(this.currentUser.id, hashedNewPassword);
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al cambiar contraseña', error);
        }
    }
    // Private helper methods
    loadStoredAuth() {
        try {
            const storedData = this.getStoredAuthData();
            if (storedData && new Date(storedData.expiresAt) > new Date()) {
                this.currentUser = storedData.user;
                this.currentToken = storedData.token;
            }
        }
        catch (error) {
            console.error('Error loading stored auth:', error);
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }
    storeAuthData(authResult) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authResult));
            // Also store offline data
            const offlineData = {
                user: authResult.user,
                token: authResult.token,
                expiresAt: authResult.expiresAt,
                lastSync: new Date()
            };
            localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineData));
        }
        catch (error) {
            console.error('Error storing auth data:', error);
        }
    }
    getStoredAuthData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored)
                return null;
            const data = JSON.parse(stored);
            return {
                ...data,
                expiresAt: new Date(data.expiresAt),
                user: {
                    ...data.user,
                    fechaCreacion: new Date(data.user.fechaCreacion),
                    fechaActualizacion: new Date(data.user.fechaActualizacion)
                }
            };
        }
        catch {
            return null;
        }
    }
    getOfflineAuthData() {
        try {
            const stored = localStorage.getItem(this.OFFLINE_KEY);
            if (!stored)
                return null;
            const data = JSON.parse(stored);
            return {
                ...data,
                expiresAt: new Date(data.expiresAt),
                lastSync: new Date(data.lastSync),
                user: {
                    ...data.user,
                    fechaCreacion: new Date(data.user.fechaCreacion),
                    fechaActualizacion: new Date(data.user.fechaActualizacion)
                }
            };
        }
        catch {
            return null;
        }
    }
    // Simulated backend methods (would be replaced with actual API calls)
    async authenticateUser(credentials) {
        // This would be an API call in a real implementation
        // For now, simulate with localStorage-based user storage
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === credentials.email);
        if (!user)
            return null;
        // In a real implementation, compare hashed passwords
        const isValidPassword = await this.cryptoUtils.comparePassword(credentials.password, user.passwordHash);
        if (!isValidPassword)
            return null;
        // Remove password hash from returned user
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async emailExists(email) {
        const users = this.getStoredUsers();
        return users.some(u => u.email === email);
    }
    async createUser(userData) {
        const users = this.getStoredUsers();
        // Generate unique ID and taxista number if needed
        const id = this.generateUserId();
        const numeroTaxista = userData.rol === UserRole.TAXISTA
            ? this.generateTaxistaNumber()
            : undefined;
        // Assign permissions based on role
        const permissions = this.getPermissionsForRole(userData.rol);
        const newUser = {
            id,
            email: userData.email,
            nombre: userData.nombre,
            telefono: userData.telefono,
            rol: userData.rol,
            numeroTaxista,
            activo: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
            permissions,
            passwordHash: userData.password
        };
        users.push(newUser);
        this.storeUsers(users);
        // Return user without password hash
        const { passwordHash, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
    async updateUserPassword(userId, hashedPassword) {
        const users = this.getStoredUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new AuthError(AuthErrorCodes.USER_NOT_FOUND, 'Usuario no encontrado');
        }
        users[userIndex].passwordHash = hashedPassword;
        users[userIndex].fechaActualizacion = new Date();
        this.storeUsers(users);
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
    storeUsers(users) {
        try {
            localStorage.setItem('taxi_users', JSON.stringify(users));
        }
        catch (error) {
            console.error('Error storing users:', error);
        }
    }
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    generateTaxistaNumber() {
        const users = this.getStoredUsers();
        const taxistaNumbers = users
            .filter(u => u.numeroTaxista)
            .map(u => parseInt(u.numeroTaxista.replace('TX', '')))
            .filter(n => !isNaN(n));
        const nextNumber = taxistaNumbers.length > 0
            ? Math.max(...taxistaNumbers) + 1
            : 1;
        return `TX${nextNumber.toString().padStart(3, '0')}`;
    }
    getPermissionsForRole(role) {
        switch (role) {
            case UserRole.PATRON:
                return [
                    Permission.VIEW_ALL_DRIVERS,
                    Permission.MANAGE_ASSOCIATIONS,
                    Permission.VIEW_OWN_DATA,
                    Permission.EDIT_PROFILE,
                    Permission.VIEW_REPORTS,
                    Permission.MANAGE_SERVICES,
                    Permission.MANAGE_EXPENSES
                ];
            case UserRole.TAXISTA:
                return [
                    Permission.VIEW_OWN_DATA,
                    Permission.EDIT_PROFILE,
                    Permission.MANAGE_SERVICES,
                    Permission.MANAGE_EXPENSES
                ];
            default:
                return [Permission.VIEW_OWN_DATA];
        }
    }
}
//# sourceMappingURL=auth-service.js.map