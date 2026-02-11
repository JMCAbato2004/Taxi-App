/**
 * Secure Storage Service for JWT tokens and critical data
 * Implements secure persistence for offline PWA functionality
 * Requirements: 6.3 - Secure persistence of JWT tokens and critical data for offline mode
 */
import { CryptoUtils } from '../utils/crypto-utils';
import { User, AuthResult } from '../types';
/**
 * Offline cache data structure
 */
interface OfflineCacheData {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    lastSync: Date;
    permissions: string[];
    criticalData: Record<string, any>;
}
/**
 * Cache configuration options
 */
interface CacheOptions {
    maxAge?: number;
    encrypt?: boolean;
    compress?: boolean;
}
/**
 * Storage statistics for monitoring
 */
interface StorageStats {
    totalItems: number;
    encryptedItems: number;
    totalSize: number;
    oldestItem: Date | null;
    newestItem: Date | null;
    expiredItems: number;
}
export declare class SecureStorageService {
    private readonly cryptoUtils;
    private readonly VERSION;
    private readonly AUTH_TOKEN_KEY;
    private readonly REFRESH_TOKEN_KEY;
    private readonly USER_DATA_KEY;
    private readonly OFFLINE_CACHE_KEY;
    private readonly CRITICAL_DATA_KEY;
    private readonly STORAGE_METADATA_KEY;
    private readonly DEFAULT_TOKEN_TTL;
    private readonly DEFAULT_REFRESH_TTL;
    private readonly DEFAULT_OFFLINE_TTL;
    private readonly MAX_STORAGE_SIZE;
    constructor(cryptoUtils?: CryptoUtils);
    /**
     * Store JWT token securely with encryption
     * Requirements: 6.3 - Secure persistence of JWT tokens
     */
    storeAuthToken(token: string, expiresAt?: Date): Promise<void>;
    /**
     * Retrieve JWT token with automatic expiration check
     */
    getAuthToken(): Promise<string | null>;
    /**
     * Store refresh token securely
     */
    storeRefreshToken(refreshToken: string, expiresAt?: Date): Promise<void>;
    /**
     * Retrieve refresh token
     */
    getRefreshToken(): Promise<string | null>;
    /**
     * Store complete authentication result for offline access
     * Requirements: 6.3 - Cache essential data for offline mode
     */
    storeOfflineAuthData(authResult: AuthResult): Promise<void>;
    /**
     * Retrieve offline authentication data
     */
    getOfflineAuthData(): Promise<OfflineCacheData | null>;
    /**
     * Store user data securely
     */
    storeUserData(user: User): Promise<void>;
    /**
     * Retrieve user data
     */
    getUserData(): Promise<User | null>;
    /**
     * Store critical application data for offline access
     * Requirements: 6.3 - Cache essential data for offline mode
     */
    storeCriticalData(key: string, data: any, options?: CacheOptions): Promise<void>;
    /**
     * Retrieve critical application data
     */
    getCriticalData(key: string): Promise<any | null>;
    /**
     * Clear all authentication data
     */
    clearAuthData(): Promise<void>;
    /**
     * Clear all stored data
     */
    clearAllData(): Promise<void>;
    /**
     * Check if offline access is valid
     */
    validateOfflineAccess(): Promise<boolean>;
    /**
     * Get storage statistics for monitoring
     */
    getStorageStats(): StorageStats;
    /**
     * Clean up expired items
     */
    cleanupExpiredItems(): Promise<number>;
    /**
     * Store item with encryption and metadata
     */
    private setSecureItem;
    /**
     * Retrieve and decrypt item
     */
    private getSecureItem;
    /**
     * Remove secure item
     */
    private removeSecureItem;
    /**
     * Get item metadata without decrypting
     */
    private getItemMetadata;
    /**
     * Calculate checksum for data integrity
     */
    private calculateChecksum;
    /**
     * Check if data appears to be encrypted (base64 encoded with specific pattern)
     */
    private isEncryptedData;
    /**
     * Get current storage size in bytes
     */
    private getStorageSize;
    /**
     * Initialize storage and perform cleanup
     */
    private initializeStorage;
    /**
     * Update storage metadata for monitoring
     */
    private updateStorageMetadata;
}
export {};
//# sourceMappingURL=secure-storage.d.ts.map