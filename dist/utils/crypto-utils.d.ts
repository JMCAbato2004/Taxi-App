export declare class CryptoUtils {
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    generateSecureToken(length?: number): string;
    encryptSensitiveData(data: string, key?: string): Promise<string>;
    decryptSensitiveData(encryptedData: string, key?: string): Promise<string>;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
    private generateSalt;
    private simpleHash;
    private secureCompare;
    private getDefaultEncryptionKey;
}
//# sourceMappingURL=crypto-utils.d.ts.map